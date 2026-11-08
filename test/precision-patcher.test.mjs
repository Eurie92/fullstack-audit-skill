import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isInsideRoot } from "../bin/path-contained.js";
import { applyUnifiedDiff, batchReplaceTokens } from "../scripts/precision-patcher.ts";

function tmpProj() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "pp-test-"));
  const root = path.join(base, "proj");
  fs.mkdirSync(root);
  return { base, root, done: () => fs.rmSync(base, { recursive: true, force: true }) };
}

test("batchReplaceTokens throws on empty target and leaves files alone", () => {
  const t = tmpProj();
  try {
    const f = path.join(t.root, "a.ts");
    fs.writeFileSync(f, "abc");
    assert.throws(() => batchReplaceTokens("", "Z", { projectRoot: t.root }), /non-empty/);
    assert.equal(fs.readFileSync(f, "utf-8"), "abc");
  } finally { t.done(); }
});

test("applyUnifiedDiff on missing file without /dev/null throws and creates nothing", () => {
  const t = tmpProj();
  try {
    const diff = "--- a/typo.ts\n+++ b/typo.ts\n@@ -1,1 +1,1 @@\n-x\n+y\n";
    assert.throws(() => applyUnifiedDiff("typo.ts", diff, t.root), /file not found/);
    assert.equal(fs.existsSync(path.join(t.root, "typo.ts")), false);
  } finally { t.done(); }
});

test("applyUnifiedDiff with /dev/null header creates the file", () => {
  const t = tmpProj();
  try {
    const diff = "--- /dev/null\n+++ b/new.ts\n@@ -0,0 +1,2 @@\n+one\n+two\n";
    applyUnifiedDiff("new.ts", diff, t.root);
    assert.equal(fs.readFileSync(path.join(t.root, "new.ts"), "utf-8"), "one\ntwo");
  } finally { t.done(); }
});

test("isInsideRoot rejects sibling prefix and outside paths, accepts children", () => {
  const t = tmpProj();
  try {
    assert.equal(isInsideRoot(t.root, t.root + "-old"), false);
    assert.equal(isInsideRoot(t.root, path.join(t.root + "-old", "f.ts")), false);
    assert.equal(isInsideRoot(t.root, path.join(t.root, "sub", "file")), true);
    assert.equal(isInsideRoot(t.root, path.join(t.root, "..foo")), true);
    assert.equal(isInsideRoot(t.root, path.join(t.base, "elsewhere", "x")), false);
  } finally { t.done(); }
});

test("isInsideRoot ignores drive-letter case (win32)", { skip: process.platform !== "win32" }, () => {
  const t = tmpProj();
  try {
    const flipped = t.root[0].toLowerCase() === t.root[0] ? t.root[0].toUpperCase() : t.root[0].toLowerCase();
    assert.equal(isInsideRoot(t.root, flipped + t.root.slice(1) + path.sep + "f.ts"), true);
  } finally { t.done(); }
});

test("applyUnifiedDiff rejects a path outside the root", () => {
  const t = tmpProj();
  try {
    const outside = path.join(t.base, "outside.ts");
    fs.writeFileSync(outside, "x\n");
    const diff = "--- a/o.ts\n+++ b/o.ts\n@@ -1,1 +1,1 @@\n-x\n+y\n";
    assert.throws(() => applyUnifiedDiff(outside, diff, t.root), /outside project root/);
    assert.throws(() => applyUnifiedDiff("../outside.ts", diff, t.root), /outside project root/);
    assert.equal(fs.readFileSync(outside, "utf-8"), "x\n");
  } finally { t.done(); }
});

test("a blank (\"\") context line applies correctly", () => {
  const t = tmpProj();
  try {
    const f = path.join(t.root, "b.ts");
    fs.writeFileSync(f, "a\n\nb\nc\n");
    const diff = "--- a/b.ts\n+++ b/b.ts\n@@ -1,4 +1,4 @@\n a\n\n-b\n+B\n c\n";
    applyUnifiedDiff("b.ts", diff, t.root);
    assert.equal(fs.readFileSync(f, "utf-8"), "a\n\nB\nc\n");
  } finally { t.done(); }
});

test("fuzzy match picks the nearest candidate", () => {
  const t = tmpProj();
  try {
    const f = path.join(t.root, "c.ts");
    const lines = Array.from({ length: 40 }, (_, i) => `l${i}`);
    lines[5] = "target";   // distance 15 below expected (index 20)
    lines[22] = "target";  // distance 2 -> nearest
    fs.writeFileSync(f, lines.join("\n") + "\n");
    // header claims line 21 (idx 20); actual candidates at idx 5 and 22
    const diff = "--- a/c.ts\n+++ b/c.ts\n@@ -21,1 +21,1 @@\n-target\n+HIT\n";
    applyUnifiedDiff("c.ts", diff, t.root);
    const out = fs.readFileSync(f, "utf-8").split("\n");
    assert.equal(out[22], "HIT");
    assert.equal(out[5], "target");
  } finally { t.done(); }
});
