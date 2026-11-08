import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { toolImpact, toolComponent, toolCausalPath, toolFind } from "../scripts/mcp-server.ts";

const tmps = [];
function project(index) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "graph-tools-"));
  tmps.push(root);
  const dir = path.join(root, "docs", "frontend-atlas");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, ".atlas-index.json"), JSON.stringify(index));
  return root;
}
after(() => { for (const t of tmps) fs.rmSync(t, { recursive: true, force: true }); });

const entry = (symbol, category, file, line = 1) => ({ symbol, category, file, line, atlasRef: "x.md" });
const node = (id, type, source, line) => ({ id, label: id, type, source, line });

const chain = {
  entries: [entry("Widget", "component", "ui/a/Widget.tsx"), entry("Widget", "component", "ui/b/Widget.tsx")],
  causalGraph: {
    nodes: [
      node("CartPage", "component", "app/CartPage.tsx", 2),
      node("CheckoutButton", "component", "ui/CheckoutButton.tsx", 3),
      node("createOrder", "action", "actions/order.ts", 5),
      node("OrderModel", "model", "db/order.ts", 1),
    ],
    links: [
      { source: "CartPage", target: "CheckoutButton", type: "imports" },
      { source: "CheckoutButton", target: "createOrder", type: "calls" },
      { source: "createOrder", target: "OrderModel", type: "mutates" },
    ],
  },
};

test("impact lists transitive dependents by depth", () => {
  const r = toolImpact("OrderModel", project(chain)).content;
  assert.match(r, /d1:\nactions\/order\.ts:5 \[action\] createOrder/);
  assert.match(r, /d2:\nui\/CheckoutButton\.tsx:3 \[component\] CheckoutButton/);
  assert.match(r, /d3:\napp\/CartPage\.tsx:2 \[component\] CartPage/);
  assert.match(r, /3 dependents across 3 files/);
});

test("impact respects depth cap", () => {
  const r = toolImpact("OrderModel", project(chain), 1).content;
  assert.match(r, /createOrder/);
  assert.doesNotMatch(r, /CheckoutButton|CartPage/);
  assert.match(r, /1 dependents across 1 files/);
});

test("impact on unknown symbol falls back to entries / zero match", () => {
  const root = project(chain);
  assert.match(toolImpact("Widget", root).content, /Graph had no edges for "Widget"[\s\S]*ui\/a\/Widget\.tsx:1/);
  assert.match(toolImpact("NopeNothing", root).content, /^ZERO_MATCH/);
});

test("path returns the multi-hop chain with link types", () => {
  const r = toolCausalPath("CartPage", "OrderModel", project(chain)).content;
  assert.match(r, /CartPage -imports-> CheckoutButton -calls-> createOrder -mutates-> OrderModel/);
  assert.match(r, /4\. \[MODEL\] OrderModel \(via mutates\)/);
});

test("activeFile boosts same-directory hit and leaves default output unchanged", () => {
  const root = project(chain);
  const plain = toolFind("widget", root).content.split("\n");
  assert.ok(plain[0].startsWith("ui/a/Widget.tsx"));
  const near = toolFind("widget", root, true, "ui/b/Other.tsx").content.split("\n");
  assert.ok(near[0].startsWith("ui/b/Widget.tsx"));
  assert.equal(toolFind("widget", root).content, plain.join("\n"));
});

test("activeFile boosts import-graph neighbour over unrelated file", () => {
  const idx = {
    entries: [entry("Thing", "component", "q/Thing.tsx"), entry("Thing", "component", "z/Thing.tsx")],
    causalGraph: {
      nodes: [node("Caller", "component", "app/Caller.tsx", 1), node("ThingNode", "component", "z/Thing.tsx", 1)],
      links: [{ source: "Caller", target: "ThingNode", type: "imports" }],
    },
  };
  const root = project(idx);
  assert.ok(toolFind("thing", root).content.startsWith("q/Thing.tsx"));
  assert.ok(toolFind("thing", root, true, path.join(root, "app", "Caller.tsx")).content.startsWith("z/Thing.tsx"));
});

test("activeFile does not outrank an exact match", () => {
  const idx = { entries: [entry("Widgets", "label", "ui/b/x.tsx"), entry("Widget", "label", "far/x.tsx")] };
  const r = toolFind("widget", project(idx), true, "ui/b/y.tsx").content;
  assert.ok(r.startsWith("far/x.tsx"));
});

test("component returns props, variants, usage and EXISTS flag", () => {
  const idx = {
    entries: [entry("Button", "component", "ui/Button.tsx", 4)],
    components: [{
      name: "Button", file: "ui/Button.tsx", line: 4,
      props: [{ name: "label", type: "string" }, { name: "size", type: "Size", optional: true }],
      variants: { size: ["sm", "md"], tone: ["primary", "ghost"] },
      usageCount: 7,
    }],
  };
  const root = project(idx);
  const r = toolComponent("button", root).content;
  assert.match(r, /^ui\/Button\.tsx:4 \[EXISTS\] Button/);
  assert.match(r, /props: label: string, size\?: Size/);
  assert.match(r, /variant size: sm \| md/);
  assert.match(r, /variant tone: primary \| ghost/);
  assert.match(r, /used in 7 file/);
  assert.match(toolComponent("butt", root).content, /\[EXISTS\] Button/);
});

test("component falls back to entries when components[] is absent", () => {
  const r = toolComponent("Button", project({ entries: [entry("Button", "component", "ui/Button.tsx", 4)] })).content;
  assert.match(r, /re-run the audit/);
  assert.match(r, /ui\/Button\.tsx:4 \[EXISTS\] Button/);
});
