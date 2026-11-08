import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { walkFiles } from "../scripts/safe-walk.ts";

const filters = {
  skipDir: (n) => n === "node_modules" || n === ".git",
  acceptFile: (n) => n.endsWith(".ts"),
};
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "safe-walk-"));
const touch = (p) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, "x"); };
const names = (l) => l.map((p) => path.basename(p)).sort();

test("symlink loop does not crash or hang", (t) => {
  const d = tmp();
  touch(path.join(d, "a", "real.ts"));
  try {
    fs.symlinkSync(d, path.join(d, "a", "loop"), process.platform === "win32" ? "junction" : "dir");
  } catch (e) {
    if (e.code === "EPERM") return t.skip("cannot create symlink");
    throw e;
  }
  assert.deepEqual(names(walkFiles(d, filters)), ["real.ts"]);
  fs.rmSync(d, { recursive: true, force: true });
});

test("cloned-repos is skipped (manual walk)", () => {
  const d = tmp();
  touch(path.join(d, "keep.ts"));
  touch(path.join(d, "docs", "cloned-repos", "x", "skip.ts"));
  assert.deepEqual(names(walkFiles(d, filters)), ["keep.ts"]);
  fs.rmSync(d, { recursive: true, force: true });
});

test("git repo: gitignored excluded, cloned-repos skipped, .github kept", (t) => {
  const d = tmp();
  if (spawnSync("git", ["init", "-q"], { cwd: d }).status !== 0) return t.skip("git unavailable");
  fs.writeFileSync(path.join(d, ".gitignore"), "ignored.ts\n");
  touch(path.join(d, "keep.ts"));
  touch(path.join(d, "ignored.ts"));
  touch(path.join(d, "docs", "cloned-repos", "skip.ts"));
  touch(path.join(d, ".github", "gh.ts"));
  assert.deepEqual(names(walkFiles(d, filters)), ["gh.ts", "keep.ts"]);
  fs.rmSync(d, { recursive: true, force: true });
});
