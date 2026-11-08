import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { shouldRefresh } from "../bin/refresh-hook.js";

const HOOK = path.resolve("bin/refresh-hook.js");

function project(withAtlas) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "refresh-"));
  fs.mkdirSync(path.join(root, "src"));
  if (withAtlas) {
    fs.mkdirSync(path.join(root, "docs", "frontend-atlas"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"), "{}");
  }
  return root;
}

test("refreshes for source edits in a project that already has an atlas", () => {
  const root = project(true);
  try {
    assert.equal(shouldRefresh(path.join(root, "src", "a.tsx"), root), true);
    assert.equal(shouldRefresh("src/a.ts", root), true);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("skips: no atlas, non-source, ignored dirs, outside root, opt-out", () => {
  const bare = project(false);
  const root = project(true);
  try {
    assert.equal(shouldRefresh("src/a.ts", bare), false, "no atlas yet");
    assert.equal(shouldRefresh("README.md", root), false, "not source");
    assert.equal(shouldRefresh("node_modules/x/index.js", root), false);
    assert.equal(shouldRefresh("docs/frontend-atlas/x.ts", root), false);
    assert.equal(shouldRefresh(path.join(os.tmpdir(), "elsewhere.ts"), root), false, "outside root");
    process.env.FULLSTACK_AUDIT_NO_REFRESH = "1";
    assert.equal(shouldRefresh("src/a.ts", root), false, "opt-out");
  } finally {
    delete process.env.FULLSTACK_AUDIT_NO_REFRESH;
    fs.rmSync(bare, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("hook process exits 0 immediately for a skipped edit and for garbage stdin", () => {
  const root = project(false);
  try {
    const a = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ cwd: root, tool_input: { file_path: "src/a.ts" } }), encoding: "utf-8" });
    assert.equal(a.status, 0);
    const b = spawnSync(process.execPath, [HOOK], { input: "not json", encoding: "utf-8" });
    assert.equal(b.status, 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
