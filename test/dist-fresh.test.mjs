import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const norm = (b) => b.toString("utf-8").replace(/\r\n/g, "\n");

function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p).map((f) => path.join(e.name, f)));
    else out.push(e.name);
  }
  return out.sort();
}

test("committed dist/ matches a fresh build of scripts/mcp-server.ts", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dist-fresh-"));
  try {
    const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
    const r = spawnSync(process.execPath, [tsc, "-p", "tsconfig.build.json", "--outDir", tmp], { cwd: root, encoding: "utf-8" });
    assert.equal(r.status, 0, `tsc failed:\n${r.stdout}${r.stderr}`);
    const fresh = listFiles(tmp);
    const committed = listFiles(path.join(root, "dist"));
    assert.deepEqual(committed, fresh, "dist/ file list differs; run `npm run build`");
    for (const f of fresh) {
      assert.equal(norm(fs.readFileSync(path.join(root, "dist", f))), norm(fs.readFileSync(path.join(tmp, f))), `dist/${f} is stale; run \`npm run build\``);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
