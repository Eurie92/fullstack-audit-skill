import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { writeBackendAtlas } from "../scripts/audit-backend.ts";
import { toolImpact, toolCausalPath, toolFind, toolSymbolSlices } from "../scripts/mcp-server.ts";

const tmps = [];
after(() => { for (const t of tmps) fs.rmSync(t, { recursive: true, force: true }); });

const bridge = (frontendFile, backendTarget, extra = {}) => ({
  frontendFile, frontendLine: 7, uiTriggerSnippet: "fetch", backendTarget, targetType: "API Route",
  httpMethod: "POST", connectedModels: [], ...extra,
});

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "causal-nodes-"));
  tmps.push(root);
  const fdir = path.join(root, "docs", "frontend-atlas");
  fs.mkdirSync(fdir, { recursive: true });
  const rate = { backendFile: "app/api/pay/route.ts", backendLine: 4, serviceCalls: ["checkRateLimit()"], serviceFiles: { checkRateLimit: "lib/rate-limit.ts" }, connectedModels: ["Order"] };
  const result = {
    endpoints: [], serverActions: [], authGuards: [], integrations: [],
    models: [{ name: "Order", tableName: "orders", orm: "prisma", fields: [], relativePath: "prisma/schema.prisma", filePath: "x", line: 12 }],
    bridgeItems: [
      bridge("app/pricing/page.tsx", "/api/pay?plan=1", rate),
      bridge("app/pricing/page.tsx", "/api/pay", rate),
      bridge("app/dashboard/page.tsx", "/api/pay/${id}", rate),
      bridge("components/Button.tsx", "/api/pay", rate),
    ],
  };
  fs.writeFileSync(path.join(fdir, ".atlas-index.json"), JSON.stringify({
    entries: [
      { symbol: "Thing", category: "component", file: "q/Thing.tsx", line: 1, atlasRef: "x" },
      { symbol: "Thing", category: "component", file: "app/api/pay/route.ts", line: 1, atlasRef: "x" },
    ],
  }));
  const origCwd = process.cwd();
  writeBackendAtlas(result, root);
  process.chdir(origCwd);
  return root;
}

test("two page.tsx files stay distinct; endpoints are cleaned and deduped", () => {
  const root = fixture();
  const g = JSON.parse(fs.readFileSync(path.join(root, "docs", "backend-atlas", ".backend-index.json"), "utf-8")).causalGraph;
  const pages = g.nodes.filter(n => n.type === "component" && /page/.test(n.id));
  assert.equal(pages.length, 2);
  assert.notEqual(pages[0].id, pages[1].id);
  assert.ok(pages.every(p => p.source && p.line));
  assert.ok(g.nodes.some(n => n.id === "Button"), "unique names stay short");
  const eps = g.nodes.filter(n => n.type === "api_endpoint");
  assert.deepEqual(eps.map(e => e.id), ["/api/pay"]);
  assert.equal(eps[0].source, "app/api/pay/route.ts");
});

test("impact prints real file:line and path resolves by label", () => {
  const root = fixture();
  const idxPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const bi = JSON.parse(fs.readFileSync(path.join(root, "docs", "backend-atlas", ".backend-index.json"), "utf-8"));
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf-8"));
  idx.causalGraph = bi.causalGraph;
  fs.writeFileSync(idxPath, JSON.stringify(idx));
  const r = toolImpact("checkRateLimit", root).content;
  assert.match(r, /lib\/rate-limit\.ts:1/);
  assert.match(r, /app\/pricing\/page\.tsx:7/);
  assert.doesNotMatch(r, /unknown:1/);
  const p = toolCausalPath("pricing/page", "Order", root).content;
  assert.match(p, /Locations:/);
  assert.match(p, /prisma\/schema\.prisma:12/);
  assert.match(toolImpact("app/dashboard/page", root).content, /Impact of dashboard\/page/);
});

test("activeFile neighbour boost changes ranking with real node sources", () => {
  const root = fixture();
  const idxPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const bi = JSON.parse(fs.readFileSync(path.join(root, "docs", "backend-atlas", ".backend-index.json"), "utf-8"));
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf-8"));
  idx.causalGraph = bi.causalGraph;
  fs.writeFileSync(idxPath, JSON.stringify(idx));
  assert.ok(toolFind("thing", root).content.startsWith("q/Thing.tsx"));
  const r = toolFind("thing", root, true, "components/Button.tsx").content;
  assert.ok(r.startsWith("app/api/pay/route.ts"), r);
});

test("fullstack_symbol and fullstack_path annotate stale files", () => {
  const root = fixture();
  fs.mkdirSync(path.join(root, "src"), { recursive: true });
  fs.writeFileSync(path.join(root, "src", "a.ts"), "export const x = 1;\n");
  const idxPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf-8"));
  idx.entries.push({ symbol: "doThing", category: "symbol", file: "src/a.ts", line: 1, atlasRef: "x" });
  idx.fileStamps = { "src/a.ts": { size: 1, mtimeMs: 1, sha1: "deadbeef" } };
  fs.writeFileSync(idxPath, JSON.stringify(idx));
  assert.match(toolSymbolSlices("doThing", root).content, /\[STALE/);
});
