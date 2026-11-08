import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stampFiles, staleFiles, annotateStale } from "../scripts/freshness.ts";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-"));
  fs.mkdirSync(path.join(root, "src"));
  fs.writeFileSync(path.join(root, "src", "a.ts"), "export const a = 1;\n");
  fs.writeFileSync(path.join(root, "src", "b.ts"), "export const b = 2;\n");
  return root;
}

test("unchanged files are fresh; missing source files are not stamped", () => {
  const root = fixture();
  try {
    const stamps = stampFiles(root, ["src/a.ts", "src/b.ts", "src/nope.ts"]);
    assert.deepEqual(Object.keys(stamps).sort(), ["src/a.ts", "src/b.ts"]);
    assert.equal(staleFiles(root, stamps, ["src/a.ts", "src/b.ts"]).size, 0);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("edited file is stale; touched-only file stays fresh", () => {
  const root = fixture();
  try {
    const stamps = stampFiles(root, ["src/a.ts", "src/b.ts"]);
    fs.writeFileSync(path.join(root, "src", "a.ts"), "export const a = 99;\n");
    const later = new Date(Date.now() + 5000);
    fs.utimesSync(path.join(root, "src", "b.ts"), later, later);
    const stale = staleFiles(root, stamps, ["src/a.ts", "src/b.ts"]);
    assert.deepEqual([...stale], ["src/a.ts"]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("deleted stamped file is stale", () => {
  const root = fixture();
  try {
    const stamps = stampFiles(root, ["src/a.ts"]);
    fs.rmSync(path.join(root, "src", "a.ts"));
    assert.deepEqual([...staleFiles(root, stamps, ["src/a.ts"])], ["src/a.ts"]);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("annotateStale tags only stale hit lines and adds a footer", () => {
  const root = fixture();
  try {
    const stamps = stampFiles(root, ["src/a.ts", "src/b.ts"]);
    fs.writeFileSync(path.join(root, "src", "a.ts"), "changed\n");
    const text = "src/a.ts:1 [COMPONENT] A (ref)\nsrc/b.ts:1 [COMPONENT] B (ref)";
    const out = annotateStale(root, stamps, text).split("\n");
    assert.match(out[0], /\[STALE:/);
    assert.doesNotMatch(out[1], /STALE/);
    assert.match(out[2], /1 file\(s\) changed/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test("annotateStale is a no-op without stamps (old index) or when nothing changed", () => {
  const root = fixture();
  try {
    const text = "src/a.ts:1 [COMPONENT] A (ref)";
    assert.equal(annotateStale(root, undefined, text), text);
    assert.equal(annotateStale(root, stampFiles(root, ["src/a.ts"]), text), text);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
