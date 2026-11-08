import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkCommand } from "../bin/iron-gate-hook.js";

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../bin/iron-gate-hook.js");

test("blocks unscoped recursive walks", () => {
  for (const cmd of [
    "Get-ChildItem -Recurse",
    "Get-ChildItem . -Recurse -Filter *.tsx",
    "gci -Recurse | Select-String foo",
    "Get-ChildItem -Path . -Recurse",
    "dir /s",
    "findstr /s foo *.ts",
    "[IO.Directory]::GetFiles('.', '*', 'AllDirectories')",
  ]) {
    assert.ok(checkCommand(cmd), `expected block: ${cmd}`);
  }
});

test("allows scoped walks and fast search tools", () => {
  for (const cmd of [
    "Get-ChildItem src -Recurse -Filter *.tsx",
    "Get-ChildItem -Path app -Recurse",
    "rg -n useAuth src",
    'rg "TODO"',
    "git grep checkout",
    "grep -rn foo src",
    "ls -lrt",
    "find ./docs -name '*.md'",
    "dir",
    "npm test",
  ]) {
    assert.equal(checkCommand(cmd), null, `expected allow: ${cmd}`);
  }
});

test("Claude Code payload: exit 2 on block, exit 0 silent on allow", () => {
  const run = (command) =>
    spawnSync(process.execPath, [HOOK], {
      input: JSON.stringify({ tool_name: "PowerShell", tool_input: { command } }),
      encoding: "utf-8",
    });
  const blocked = run("Get-ChildItem -Recurse");
  assert.equal(blocked.status, 2);
  assert.match(blocked.stderr, /Blocked/);
  const allowed = run("rg foo src");
  assert.equal(allowed.status, 0);
  assert.equal(allowed.stdout, "");
});

test("Antigravity payload: JSON decision on stdout", () => {
  const res = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify({ toolCall: { args: { CommandLine: "dir /s" } } }),
    encoding: "utf-8",
  });
  assert.equal(JSON.parse(res.stdout).decision, "deny");
});
