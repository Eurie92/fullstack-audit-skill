#!/usr/bin/env node

/**
 * Iron Gate Anti-Grep PreToolUse Lifecycle Hook (v2.15.0)
 * Intercepts and denies slow recursive directory scans (Get-ChildItem -Recurse, grep -r, find, Select-String, git grep)
 * preventing 15-30s Windows Defender / AMSI freezes and context bloat.
 * Compatible with Google Antigravity, Gemini CLI, and Claude Code PreToolUse hooks.
 */

import fs from "fs";

function run() {
  let raw = "";
  try {
    raw = fs.readFileSync(0, "utf-8");
  } catch {
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  if (!raw || !raw.trim()) {
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  // Handle Antigravity/Gemini ({ toolCall: { args: { CommandLine: "..." } } })
  // and Claude Code ({ tool_name: "Bash", tool_input: { command: "..." } })
  const toolCall = payload.toolCall || {};
  const args = toolCall.args || payload.tool_input || {};
  const cmd = args.CommandLine || args.command || args.cmd || "";
  const isClaudeCode = Boolean(payload.tool_name);

  if (!cmd || typeof cmd !== "string") {
    console.log(JSON.stringify({ decision: "allow" }));
    return;
  }

  const forbiddenRules = [
    {
      regex: /(?:Get-ChildItem|gci|dir|ls)\s+[^|\n\r]*(?:[-/]Recurse|[-/]s\b|-[a-zA-Z]*r\b)/i,
      desc: "Get-ChildItem -Recurse / dir /s / gci -r recursive file scan",
    },
    {
      regex: /Select-String\s+[^|\n\r]*-(?:Path|Include)\s+[^|\n\r]*\*/i,
      desc: "Select-String recursive wildcard file scan",
    },
    {
      regex: /\|\s*Select-String\b/i,
      condition: (c) => /(?:Get-ChildItem|gci|dir|ls)/i.test(c),
      desc: "Directory listing piped to Select-String",
    },
    {
      regex: /\b(?:grep|egrep)\s+-[a-zA-Z]*[rR]/i,
      desc: "grep -r recursive search",
    },
    {
      regex: /\bgit\s+grep\b/i,
      desc: "git grep recursive repository search",
    },
    {
      regex: /\b(?:rg|ripgrep)\s+-[a-zA-Z]*[rR]|\b(?:rg|ripgrep)\s+["'][^"']+["']\s*$/i,
      desc: "ripgrep global un-scoped search",
    },
    {
      regex: /\bfind\s+(?:\.|\/|[a-zA-Z0-9_\-'"\\]+)\s+-[a-zA-Z]*name/i,
      desc: "find recursive search",
    },
    {
      regex: /\bfindstr\s+[^|\n\r]*\/s/i,
      desc: "findstr /s recursive search",
    },
    {
      regex: /node\s+-e\s+.*(?:readdir|walk)/i,
      desc: "node -e inline directory scanner",
    },
    {
      regex: /python(?:\.exe)?\s+-c\s+.*os\.walk/i,
      desc: "python inline recursive directory scanner",
    },
    {
      regex: /\[(?:System\.)?IO\.(?:Directory|File)\]::(?:GetFiles|EnumerateFiles|ReadAllText)/i,
      desc: "PowerShell [IO.Directory/File] batch reading script",
    },
  ];

  for (const rule of forbiddenRules) {
    if (rule.regex.test(cmd)) {
      if (rule.condition && !rule.condition(cmd)) {
        continue;
      }
      const reason = [
        `IRON GATE REJECTED: ${rule.desc} is strictly prohibited.`,
        "Recursive directory scans trigger 15-30s Windows Defender / AMSI freezes and waste context tokens.",
        "",
        "INSTEAD USE ZERO-GREP FULLSTACK ATLAS TOOLS:",
        "- Symbol / Label / Route Search: fullstack_find(query: \"<word>\") or npx fullstack-audit --find \"<word>\" --compact (<0.3ms)",
        "- Visual Element / Badge / Icon: fullstack_locate_visual(query: \"<element>\")",
        "- Imports & Dependencies: Read docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md or call fullstack_path",
        "- God-File Slicer: fullstack_symbol(symbol: \"<method>\")",
        "- Pre-Computed Atlases: View docs/frontend-atlas/ or docs/backend-atlas/"
      ].join("\n");

      if (isClaudeCode) {
        process.stderr.write(reason + "\n");
        process.exit(2);
      }

      console.log(JSON.stringify({
        decision: "deny",
        reason: reason
      }));
      return;
    }
  }

  console.log(JSON.stringify({ decision: "allow" }));
}

run();
