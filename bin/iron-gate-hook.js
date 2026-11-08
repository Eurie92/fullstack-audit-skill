#!/usr/bin/env node

/**
 * Iron Gate PreToolUse hook.
 * Blocks only unscoped recursive directory walks from Windows shells (PowerShell Get-ChildItem -Recurse,
 * cmd dir /s, findstr /s, [IO.Directory]::GetFiles). Those walk node_modules/.next and can freeze for
 * 15-30s under Windows Defender. Scoped walks (e.g. `Get-ChildItem src -Recurse`), ripgrep, git grep and
 * the agent's built-in Grep/Glob tools are allowed: they are fast or already skip ignored folders.
 *
 * Claude Code: exit 2 + stderr blocks the call. Antigravity / Gemini CLI: JSON {decision} on stdout.
 */

import fs from "fs";
import { fileURLToPath } from "url";

// Flags whose next token is a value, not a path.
const VALUE_FLAGS = /^-(?:filter|include|exclude|depth|attributes|name)$/i;
const ROOT_TARGETS = new Set([".", "./", ".\\", "*", "/", "\\", "~"]);

/** True when the walk has no folder argument, or targets the project root. */
function isUnscoped(tokens) {
  const paths = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (VALUE_FLAGS.test(t)) { i++; continue; }
    if (/^-path$|^-literalpath$/i.test(t)) { if (tokens[i + 1]) paths.push(tokens[++i]); continue; }
    if (t.startsWith("-") || t.startsWith("/")) continue;
    paths.push(t);
  }
  return paths.length === 0 || paths.every((p) => ROOT_TARGETS.has(p.replace(/^['"]|['"]$/g, "")));
}

/** Returns a reason string when the command must be blocked, else null. */
export function checkCommand(cmd) {
  if (!cmd || typeof cmd !== "string") return null;
  for (const segment of cmd.split(/[|;&\n]/)) {
    const tokens = segment.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const head = tokens[0].toLowerCase();
    const rest = tokens.slice(1);

    if (["get-childitem", "gci"].includes(head) && rest.some((t) => /^-recurse$/i.test(t)) && isUnscoped(rest)) {
      return "Get-ChildItem -Recurse on the project root";
    }
    if (head === "dir" && rest.some((t) => /^\/s$/i.test(t)) && isUnscoped(rest)) {
      return "dir /s on the project root";
    }
    if (head === "findstr" && rest.some((t) => /^\/s$/i.test(t))) {
      return "findstr /s recursive search";
    }
  }
  if (/\[(?:System\.)?IO\.Directory\]::(?:GetFiles|EnumerateFiles)\([^)]*AllDirectories/i.test(cmd)) {
    return "[IO.Directory]::GetFiles with AllDirectories";
  }
  return null;
}

function run() {
  let payload = {};
  try {
    payload = JSON.parse(fs.readFileSync(0, "utf-8") || "{}");
  } catch {
    // Unreadable input: never block on our own parsing failure.
  }
  const args = payload.tool_input || payload.toolCall?.args || {};
  const cmd = args.command || args.CommandLine || args.cmd || "";
  const isClaudeCode = Boolean(payload.tool_name);
  const blocked = checkCommand(cmd);

  if (!blocked) {
    if (!isClaudeCode) console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  const reason = [
    `Blocked: ${blocked}. An unscoped recursive walk enters node_modules/.next and can freeze for 15-30s on Windows.`,
    "Instead:",
    "- Atlas lookup: the fullstack_find / fullstack_locate_visual / fullstack_path MCP tools",
    "- Text search: your Grep tool, `rg <pattern> <dir>`, or `git grep <pattern>` (all skip ignored folders)",
    "- Or scope the walk to a folder: Get-ChildItem src -Recurse -Filter *.tsx",
  ].join("\n");

  if (isClaudeCode) {
    process.stderr.write(reason + "\n");
    process.exit(2);
  }
  console.log(JSON.stringify({ decision: "deny", reason }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) run();
