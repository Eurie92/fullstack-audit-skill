import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SECRET = "SUPER_SECRET_VALUE_12345";
let dir;
let index;

function write(rel, content) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(p, out);
    } else out.push(p);
  }
  return out;
}

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "idx-quality-"));
  write("package.json", JSON.stringify({ name: "fx", dependencies: { next: "^16.0.0", react: "^19.0.0" } }));
  write("tsconfig.json", `{ // comments are allowed in tsconfig
  "compilerOptions": { "baseUrl": ".", "paths": { "@kit/*": ["src/widgets/*"] } } }`);
  write(".env", `API_TOKEN=${SECRET}\nOTHER=1\n`);
  write(".env.example", "API_TOKEN=\n");
  write("src/widgets/Card.tsx", `import { cva } from "class-variance-authority";
const cardStyles = cva("rounded", { variants: { size: { sm: "p-1", md: "p-2" }, tone: { primary: "a", ghost: "b" } } });
interface CardProps { title: string; count?: number; onSelect: () => void }
export function Card({ title, count, onSelect, compact = false }: CardProps) {
  return <div className={cardStyles({ size: "sm" })} onClick={onSelect}>{title}{count}{String(compact)}</div>;
}
export const XNIGHT_ROOT = "/some/root";
export const BENCHMARK_100_CASES = [1, 2, 3];
`);
  write("src/app/page.tsx", `import { Card } from "@kit/Card";
export default function Page() { return <Card title="a" onSelect={() => {}} />; }
`);
  write("src/app/other/page.tsx", `import { Card } from "../../widgets/Card";
export default function Other() { return <Card title="b" onSelect={() => {}} />; }
`);
  write("src/app/actions.ts", `"use server";
export const saveThing = async (formData: FormData) => { return formData; };
export async function plainAction() { return 1; }
const token = process.env.API_TOKEN || "fallback-${SECRET}";
export function notAnAction() { return token; }
`);
  const r = spawnSync(process.execPath, [path.join(REPO, "bin", "audit.js")], { cwd: dir, encoding: "utf-8" });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  index = JSON.parse(fs.readFileSync(path.join(dir, "docs", "frontend-atlas", ".atlas-index.json"), "utf-8"));
});

after(() => fs.rmSync(dir, { recursive: true, force: true }));

test("components[] carries props, cva variants and usageCount (alias + relative importers)", () => {
  const card = index.components.find(c => c.name === "Card");
  assert.ok(card, "Card detail present");
  assert.equal(card.file, "src/widgets/Card.tsx");
  const byName = Object.fromEntries(card.props.map(p => [p.name, p]));
  assert.equal(byName.title.optional, false);
  assert.equal(byName.count.optional, true);
  assert.equal(byName.compact.optional, true, "destructured default is optional");
  assert.match(byName.onSelect.type, /=>/);
  assert.deepEqual(card.variants, { size: ["sm", "md"], tone: ["primary", "ghost"] });
  assert.equal(card.usageCount, 2);
});

test("constants are not COMPONENT entries", () => {
  const comps = index.entries.filter(e => e.category === "component").map(e => e.symbol);
  assert.ok(comps.includes("Card"));
  assert.ok(!comps.includes("XNIGHT_ROOT") && !comps.includes("BENCHMARK_100_CASES"));
  assert.ok(!index.components.some(c => /_/.test(c.name)));
});

test("arrow-style server action is detected", () => {
  const md = fs.readFileSync(path.join(dir, "docs", "backend-atlas", "03_SERVER_ACTIONS_AND_MUTATIONS.md"), "utf-8");
  assert.match(md, /saveThing/);
  assert.match(md, /plainAction/);
  assert.doesNotMatch(md, /notAnAction/);
});

test("env values never reach generated docs", () => {
  const files = [...walk(path.join(dir, "docs"))];
  assert.ok(files.length > 5);
  for (const f of files) assert.ok(!fs.readFileSync(f, "utf-8").includes(SECRET), `${path.relative(dir, f)} leaks the secret`);
  const env = fs.readFileSync(path.join(dir, "docs", "backend-atlas", "07_ENV_AND_SECRETS_MAP.md"), "utf-8");
  assert.match(env, /API_TOKEN/);
});

test("next-devtools MCP entry is added once for Next 16+", () => {
  const r = spawnSync(process.execPath, [path.join(REPO, "bin", "audit.js"), "--setup-claude"], { cwd: dir, encoding: "utf-8" });
  const read = () => JSON.parse(fs.readFileSync(path.join(dir, ".mcp.json"), "utf-8"));
  assert.deepEqual(read().mcpServers["next-devtools"], { command: "npx", args: ["-y", "next-devtools-mcp@latest"] }, r.stdout + r.stderr);
  assert.ok(read().mcpServers["fullstack-audit"]);
  const again = spawnSync(process.execPath, [path.join(REPO, "bin", "audit.js"), "--setup-claude"], { cwd: dir, encoding: "utf-8" });
  assert.doesNotMatch(again.stdout, /Added next-devtools/);
});
