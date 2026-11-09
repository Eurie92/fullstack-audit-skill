import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runCheck, formatReport } from "../dist/check.js";
import { sessionEditsFile } from "../bin/refresh-hook.js";

const BIN = path.resolve("bin/audit.js");
const HOOK = path.resolve("bin/check-hook.js");

function git(root, ...a) {
  const r = spawnSync("git", a, { cwd: root, encoding: "utf-8" });
  assert.equal(r.status, 0, r.stderr);
}

/** Temp git repo with `committed` files in HEAD, then `changed` written on top (uncommitted). */
function repo(committed, changed = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "check-"));
  const write = (files) => {
    for (const [f, c] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
      fs.writeFileSync(path.join(root, f), c);
    }
  };
  git(root, "init", "-q");
  git(root, "config", "user.email", "t@t");
  git(root, "config", "user.name", "t");
  write({ "package.json": "{}", ...committed });
  git(root, "add", "-A");
  git(root, "commit", "-qm", "init");
  write(changed);
  return root;
}

const rm = (root) => fs.rmSync(root, { recursive: true, force: true });
const rules = (r) => r.findings.map((f) => `${f.severity} ${f.rule} ${f.file}:${f.line}`).sort();

test("handlers: dead, empty, log-only, ignore comment, and wired ones", () => {
  const root = repo({ "src/Panel.tsx": "export function Panel() { return null }\n" }, {
    "src/Panel.tsx": [
      'import { useState, useCallback } from "react";',
      'import { save } from "./api";',
      "export function Panel() {",
      "  const [open, setOpen] = useState(false);",
      "  const handleNoop = useCallback(() => {}, []);",
      "  return (<div>",
      "    <button onClick={handleDelete}>Delete</button>",
      "    <button onClick={() => {}}>Empty</button>",
      '    <button onClick={() => { console.log("todo") }}>Log</button>',
      "    <button onClick={handleNoop}>Noop</button>",
      "    <button onClick={() => archiveItem(1)}>Archive</button>",
      "    {/* fullstack-check-ignore: placeholder until design lands */}",
      "    <button onClick={() => {}}>Later</button>",
      "    <button onClick={() => setOpen(!open)}>Toggle</button>",
      "    <button onClick={save}>Save</button>",
      "    <button onClick={() => alert('hi')}>Alert</button>",
      "  </div>);",
      "}",
    ].join("\n"),
  });
  try {
    const r = runCheck(root);
    assert.deepEqual(rules(r), [
      "BLOCK DEAD_HANDLER src/Panel.tsx:11",
      "BLOCK DEAD_HANDLER src/Panel.tsx:7",
      "BLOCK STUB_HANDLER src/Panel.tsx:10",
      "BLOCK STUB_HANDLER src/Panel.tsx:8",
      "WARN STUB_HANDLER src/Panel.tsx:9",
    ]);
    assert.match(formatReport(r), /1 changed file\(s\), 4 BLOCK, 1 WARN/);
  } finally { rm(root); }
});

test("orphan: new component is BLOCK until something imports it; route files are exempt", () => {
  const root = repo({ "src/App.tsx": "export default function App() { return null }\n" }, {
    "src/components/DeleteButton.tsx": "export function DeleteButton() { return <button /> }\n",
    "src/app/settings/page.tsx": "export default function Page() { return <div /> }\n",
  });
  try {
    assert.deepEqual(rules(runCheck(root)), ["BLOCK ORPHAN_COMPONENT src/components/DeleteButton.tsx:1"]);
    fs.writeFileSync(path.join(root, "src/App.tsx"), 'import { DeleteButton } from "./components/DeleteButton";\nexport default function App() { return <DeleteButton /> }\n');
    assert.deepEqual(rules(runCheck(root)), []);
  } finally { rm(root); }
});

test("orphan: a component with a longer name that contains this one does not count as an import", () => {
  const root = repo({ "src/App.tsx": 'import { MyCard } from "./MyCard";\nexport default function App() { return <MyCard /> }\n', "src/MyCard.tsx": "export function MyCard() { return null }\n" }, {
    "src/Card.tsx": "export function Card() { return <div /> }\n",
  });
  try {
    assert.deepEqual(rules(runCheck(root)), ["BLOCK ORPHAN_COMPONENT src/Card.tsx:1"]);
  } finally { rm(root); }
});

const ACTION = [
  '"use server";',
  'import { prisma } from "@/lib/db";',
  "export async function deletePost(id: string) {",
  "  await prisma.post.delete({ where: { id } });",
  "}",
  "export async function renamePost(id: string, title: string) {",
  "  const session = await auth();",
  "  if (!session) throw new Error('unauthorized');",
  "  await prisma.post.update({ where: { id }, data: { title } });",
  "}",
  "export async function listPosts() { return prisma.post.findMany(); }",
].join("\n");

test("unguarded mutation: BLOCK without middleware, WARN with it, skipped when the project has no auth", () => {
  const authPkg = JSON.stringify({ dependencies: { "next-auth": "5.0.0" } });
  const root = repo({ "package.json": authPkg }, { "src/actions/posts.ts": ACTION });
  try {
    assert.deepEqual(rules(runCheck(root)), ["BLOCK UNGUARDED_MUTATION src/actions/posts.ts:3"]);
    fs.writeFileSync(path.join(root, "middleware.ts"), "export { auth as middleware } from '@/auth';\n");
    assert.deepEqual(rules(runCheck(root)), ["WARN UNGUARDED_MUTATION src/actions/posts.ts:3"]);
  } finally { rm(root); }
  const noAuth = repo({}, { "src/actions/posts.ts": ACTION });
  try { assert.deepEqual(rules(runCheck(noAuth)), []); } finally { rm(noAuth); }
});

test("unguarded mutation: App Router POST that writes, webhook route exempt", () => {
  const authPkg = JSON.stringify({ dependencies: { "@clerk/nextjs": "6.0.0" } });
  const write = 'import { prisma } from "@/lib/db";\nexport async function POST(req: Request) {\n  await prisma.order.create({ data: await req.json() });\n  return Response.json({ ok: true });\n}\n';
  const root = repo({ "package.json": authPkg }, { "src/app/api/orders/route.ts": write, "src/app/api/webhooks/stripe/route.ts": write });
  try {
    assert.deepEqual(rules(runCheck(root)), ["BLOCK UNGUARDED_MUTATION src/app/api/orders/route.ts:1"]);
  } finally { rm(root); }
});

test("unguarded mutation: raw SQL writes count; custom require*/verify* auth helpers count as guards", () => {
  const authPkg = JSON.stringify({ dependencies: { "firebase-admin": "12.0.0" } });
  const raw = (guard) => `import { query } from "@/db";\nexport async function DELETE(req: Request) {\n  ${guard}\n  await query(\`\n    DELETE FROM items WHERE id = $1\`, [1]);\n  return Response.json({});\n}\n`;
  const root = repo({ "package.json": authPkg }, {
    "src/app/api/items/route.ts": raw(""),
    "src/app/api/admin/items/route.ts": raw("await requireAdminInvisibility(req);"),
    "src/app/api/stats/route.ts": 'import { query } from "@/db";\nexport async function POST() {\n  return Response.json(await query("SELECT count(*) FROM items"));\n}\n',
  });
  try {
    assert.deepEqual(rules(runCheck(root)), ["BLOCK UNGUARDED_MUTATION src/app/api/items/route.ts:1"]);
  } finally { rm(root); }
});

test("staged mode only sees staged files; not a git repo returns a note", () => {
  const root = repo({ "src/A.tsx": "export const A = () => null;\n" }, { "src/A.tsx": "export const A = () => <b onClick={nope} />;\n" });
  try {
    assert.equal(runCheck(root, { staged: true }).scanned.length, 0);
    git(root, "add", "src/A.tsx");
    assert.deepEqual(rules(runCheck(root, { staged: true })), ["BLOCK DEAD_HANDLER src/A.tsx:1"]);
  } finally { rm(root); }
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "check-nogit-"));
  try { assert.match(runCheck(plain).note || "", /not a git repository/); } finally { rm(plain); }
});

test("CLI --check exits 1 on BLOCK, 0 when clean", () => {
  const root = repo({ "src/A.tsx": "export const A = () => null;\n" }, { "src/A.tsx": "export const A = () => <b onClick={() => {}} />;\n" });
  try {
    const bad = spawnSync(process.execPath, [BIN, "--check"], { cwd: root, encoding: "utf-8" });
    assert.equal(bad.status, 1, bad.stdout + bad.stderr);
    assert.match(bad.stdout, /BLOCK src\/A.tsx:1 \[STUB_HANDLER\]/);
    fs.writeFileSync(path.join(root, "src/A.tsx"), "export const A = () => <b onClick={() => alert(1)} />;\n");
    const ok = spawnSync(process.execPath, [BIN, "--check"], { cwd: root, encoding: "utf-8" });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  } finally { rm(root); }
});

test("Stop hook: blocks with exit 2 on agent-edited files, respects stop_hook_active and missing atlas", () => {
  const root = repo({ "src/A.tsx": "export const A = () => null;\n" }, { "src/A.tsx": "export const A = () => <b onClick={missing} />;\n" });
  const sid = `test-${process.pid}-${Date.now()}`;
  const run = (extra = {}) => spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ session_id: sid, cwd: root, ...extra }), encoding: "utf-8" });
  try {
    fs.writeFileSync(sessionEditsFile(sid), path.join(root, "src/A.tsx") + "\n");
    assert.equal(run().status, 0, "no atlas: opt-in not given");
    fs.mkdirSync(path.join(root, "docs/frontend-atlas"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs/frontend-atlas/.atlas-index.json"), "{}");
    const blocked = run();
    assert.equal(blocked.status, 2);
    assert.match(blocked.stderr, /DEAD_HANDLER/);
    assert.equal(run({ stop_hook_active: true }).status, 0, "loop guard");
    assert.equal(spawnSync(process.execPath, [HOOK], { input: "garbage", encoding: "utf-8" }).status, 0);
  } finally {
    fs.rmSync(sessionEditsFile(sid), { force: true });
    rm(root);
  }
});

test("other harnesses: Codex apply_patch edits are recorded; Cursor stop gets followup_message, loop_count guards", () => {
  const root = repo({ "src/A.tsx": "export const A = () => null;\n" }, { "src/A.tsx": "export const A = () => <b onClick={missing} />;\n" });
  fs.mkdirSync(path.join(root, "docs/frontend-atlas"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/frontend-atlas/.atlas-index.json"), "{}");
  const env = { ...process.env, FULLSTACK_AUDIT_NO_REFRESH: "1" };
  const hook = (f, p) => spawnSync(process.execPath, [path.resolve("bin", f)], { input: JSON.stringify(p), encoding: "utf-8", env });
  const codex = `codex-${process.pid}-${Date.now()}`, cursor = `cursor-${process.pid}-${Date.now()}`;
  try {
    hook("refresh-hook.js", { session_id: codex, cwd: root, tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: src/A.tsx\n@@\n*** End Patch" } });
    const c = hook("check-hook.js", { session_id: codex, cwd: root, stop_hook_active: false });
    assert.equal(c.status, 2, c.stderr);
    hook("refresh-hook.js", { conversation_id: cursor, workspace_roots: [root], file_path: path.join(root, "src/A.tsx") });
    const k = hook("check-hook.js", { conversation_id: cursor, workspace_roots: [root], status: "completed", loop_count: 0 });
    assert.equal(k.status, 0);
    assert.match(JSON.parse(k.stdout).followup_message, /DEAD_HANDLER/);
    assert.equal(hook("check-hook.js", { conversation_id: cursor, workspace_roots: [root], loop_count: 1 }).stdout, "");
  } finally {
    for (const s of [codex, cursor]) fs.rmSync(sessionEditsFile(s), { force: true });
    rm(root);
  }
});

test("--install-hooks writes each harness config once (idempotent) and keeps existing keys", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "hooks-"));
  const run = (h) => spawnSync(process.execPath, [BIN, "--install-hooks", h], { cwd: root, encoding: "utf-8" });
  try {
    fs.mkdirSync(path.join(root, ".gemini"));
    fs.writeFileSync(path.join(root, ".gemini/settings.json"), JSON.stringify({ theme: "dark" }));
    for (const h of ["claude", "codex", "gemini", "windsurf", "cursor"]) { assert.equal(run(h).status, 0); assert.equal(run(h).status, 0); }
    const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf-8"));
    assert.equal(read(".gemini/settings.json").theme, "dark");
    assert.equal(read(".gemini/settings.json").hooks.AfterAgent.length, 1);
    assert.equal(read(".codex/hooks.json").hooks.Stop.length, 1);
    assert.equal(read(".devin/hooks.v1.json").Stop.length, 1);
    assert.equal(read(".cursor/hooks.json").version, 1);
    assert.equal(read(".cursor/hooks.json").hooks.stop[0].loop_limit, 1);
    assert.match(read(".claude/settings.json").hooks.Stop[0].hooks[0].command, /check-hook\.js"$/);
    assert.equal(run("nope").status, 1);
  } finally { rm(root); }
});
