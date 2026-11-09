#!/usr/bin/env node

/**
 * Stop hook (Claude Code, Codex, Devin/Windsurf Stop; Gemini AfterAgent; Cursor stop): before the agent ends its turn, check the files it edited this session
 * (recorded by refresh-hook.js) for unfinished work. On a BLOCK finding, exit 2 (Cursor: stdout followup_message) so the harness
 * feeds the report back to the agent and it keeps working.
 *
 * - Only runs where an atlas exists (same opt-in as the refresh hook) and only on files the agent
 *   touched, so it never blocks on the user's own uncommitted work.
 * - Loop guard: when the agent is already continuing because of this hook (`stop_hook_active`),
 *   it lets the turn end; the agent gets one forced fix pass, not an endless loop.
 * - Opt out: FULLSTACK_AUDIT_NO_CHECK=1. Any internal error lets the turn end (exit 0).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { hookContext, sessionEditsFile } from "./refresh-hook.js";

export async function main(raw) {
  let payload = {};
  try { payload = JSON.parse(raw || "{}"); } catch { return 0; }
  // stop_hook_active: Claude Code, Codex, Gemini AfterAgent. loop_count: Cursor stop.
  if (process.env.FULLSTACK_AUDIT_NO_CHECK === "1" || payload.stop_hook_active || payload.loop_count > 0) return 0;
  const { sessionId, root } = hookContext(payload);
  if (!sessionId || !fs.existsSync(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"))) return 0;
  let files = [];
  try { files = [...new Set(fs.readFileSync(sessionEditsFile(sessionId), "utf-8").split(/\r?\n/).filter(Boolean))]; } catch { return 0; }
  if (!files.length) return 0;
  try {
    const { runCheck, formatReport } = await import("../dist/check.js");
    const r = runCheck(root, { files });
    if (!r.findings.some((f) => f.severity === "BLOCK")) return 0;
    const report = formatReport(r) + "\nFix every BLOCK item before finishing.";
    // Cursor continues the agent from stdout `followup_message`; the others take exit 2 + stderr.
    if (payload.conversation_id && !payload.session_id) {
      process.stdout.write(JSON.stringify({ followup_message: report }));
      return 0;
    }
    process.stderr.write(report + "\n");
    return 2;
  } catch {
    return 0;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = "";
  try { raw = fs.readFileSync(0, "utf-8"); } catch { /* no stdin */ }
  main(raw).then((code) => process.exit(code));
}
