#!/usr/bin/env node

/**
 * PostToolUse hook (Edit|Write|MultiEdit): keep the atlas in step with the agent's own edits.
 * The hook returns at once and spawns a detached worker that waits for edits to settle, then runs
 * the normal full audit (about 3 s on a mid-size project). Only runs where an atlas already exists,
 * so it never creates docs/ in a project that did not ask for one. Opt out: FULLSTACK_AUDIT_NO_REFRESH=1.
 *
 * Until the worker finishes, queries tag hits from edited files with [STALE] (see scripts/freshness.ts).
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_EXT = /\.(tsx?|jsx?|mjs|cjs|vue|svelte|astro|prisma|sql|css)$/i;
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".git", "docs", "coverage", "cloned-repos"]);
const DEBOUNCE_MS = 1500;
const LOCK_STALE_MS = 120_000;

/** True when an edit to `filePath` should trigger an atlas refresh for the project at `root`. */
export function shouldRefresh(filePath, root) {
  if (!filePath || !root || process.env.FULLSTACK_AUDIT_NO_REFRESH === "1") return false;
  const rel = path.relative(path.resolve(root), path.resolve(root, filePath));
  if (rel === "" || rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel)) return false;
  if (!SOURCE_EXT.test(rel)) return false;
  if (rel.split(path.sep).slice(0, -1).some((d) => SKIP_DIRS.has(d))) return false;
  return fs.existsSync(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"));
}

function atlasDir(root) {
  return path.join(root, "docs", "frontend-atlas");
}

function runAudit(root) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, "audit.js")], { cwd: root, stdio: "ignore", windowsHide: true });
    child.on("error", () => resolve());
    child.on("exit", () => resolve());
  });
}

/** Detached worker: one audit at a time per project; edits during a run queue exactly one more run. */
async function worker(root) {
  const dir = atlasDir(root);
  const lock = path.join(dir, ".refresh.lock");
  const pending = path.join(dir, ".refresh.pending");
  try {
    fs.writeFileSync(pending, String(Date.now()));
    let fd;
    try {
      fd = fs.openSync(lock, "wx");
    } catch {
      let age = 0;
      try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { /* lock vanished */ }
      if (age < LOCK_STALE_MS) return; // another worker is running and will see the pending marker
      try { fs.rmSync(lock, { force: true }); fd = fs.openSync(lock, "wx"); } catch { return; }
    }
    fs.closeSync(fd);
    try {
      while (fs.existsSync(pending)) {
        await new Promise((r) => setTimeout(r, DEBOUNCE_MS));
        fs.rmSync(pending, { force: true });
        await runAudit(root);
      }
    } finally {
      fs.rmSync(lock, { force: true });
    }
  } catch { /* never surface errors from a background refresh */ }
}

function main() {
  if (process.argv[2] === "--worker") {
    worker(process.argv[3]).then(() => process.exit(0));
    return;
  }
  let raw = "";
  try { raw = fs.readFileSync(0, "utf-8"); } catch { /* no stdin */ }
  let payload = {};
  try { payload = JSON.parse(raw || "{}"); } catch { /* ignore */ }
  const root = payload.cwd || process.cwd();
  const filePath = payload.tool_input?.file_path || payload.tool_input?.path;
  if (!shouldRefresh(filePath, root)) process.exit(0);
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "--worker", root], {
    detached: true, stdio: "ignore", windowsHide: true,
  });
  child.unref();
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
