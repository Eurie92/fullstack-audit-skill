import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { FileStamp } from "./constants.js";

function sha1Of(full: string): string {
  return crypto.createHash("sha1").update(fs.readFileSync(full)).digest("hex");
}

/** Fingerprint indexed files (project-relative paths). Missing or unreadable files are skipped. */
export function stampFiles(root: string, files: string[]): Record<string, FileStamp> {
  const out: Record<string, FileStamp> = {};
  for (const rel of files) {
    try {
      const full = path.resolve(root, rel);
      const st = fs.statSync(full);
      if (!st.isFile()) continue;
      out[rel] = { mtimeMs: st.mtimeMs, size: st.size, sha1: sha1Of(full) };
    } catch { /* skip */ }
  }
  return out;
}

/**
 * Which of `files` changed since they were stamped? Cheap path first: same mtime+size = fresh.
 * If mtime/size differ, compare sha1 so a bare `touch` or a checkout of identical content stays fresh.
 * Files with no stamp are ignored (cannot judge). A stamped file that is gone counts as stale.
 */
export function staleFiles(root: string, stamps: Record<string, FileStamp> | undefined, files: Iterable<string>): Set<string> {
  const stale = new Set<string>();
  if (!stamps) return stale;
  for (const rel of files) {
    const s = stamps[rel];
    if (!s || stale.has(rel)) continue;
    try {
      const full = path.resolve(root, rel);
      const st = fs.statSync(full);
      if (st.mtimeMs === s.mtimeMs && st.size === s.size) continue;
      if (sha1Of(full) !== s.sha1) stale.add(rel);
    } catch {
      stale.add(rel);
    }
  }
  return stale;
}

const HIT_LINE = /^(.+?):(\d+) \[/;

/** Tag result lines (`file:line [CAT] ...`) whose file changed after the atlas was built. */
export function annotateStale(root: string, stamps: Record<string, FileStamp> | undefined, text: string): string {
  if (!stamps) return text;
  const lines = text.split("\n");
  const files = new Set<string>();
  for (const l of lines) {
    const m = HIT_LINE.exec(l);
    if (m) files.add(m[1].replace(/\\/g, "/"));
  }
  if (files.size === 0) return text;
  const stale = staleFiles(root, stamps, files);
  if (stale.size === 0) return text;
  const tagged = lines.map((l) => {
    const m = HIT_LINE.exec(l);
    return m && stale.has(m[1].replace(/\\/g, "/")) ? `${l} [STALE: file edited since audit, line may have drifted]` : l;
  });
  tagged.push(`(${stale.size} file(s) changed since the atlas was built. Re-run the audit to refresh, or use Grep/rg for the live code.)`);
  return tagged.join("\n");
}

const SNIPPET_HITS = 3;
const SNIPPET_LINES = 3;
const SNIPPET_COLS = 120;

/**
 * Inline the code at the first few fresh hits (`    | 12: <code>`) so the agent can often answer
 * without a Read. Stale hits are skipped: their line may have drifted.
 */
export function addSnippets(root: string, text: string): string {
  const base = path.resolve(root);
  const out: string[] = [];
  let shown = 0;
  for (const l of text.split("\n")) {
    out.push(l);
    if (shown >= SNIPPET_HITS || l.includes("[STALE")) continue;
    const m = HIT_LINE.exec(l);
    if (!m) continue;
    const abs = path.resolve(base, m[1]);
    if (abs !== base && !abs.startsWith(base + path.sep)) continue;
    let src: string[];
    try {
      if (fs.statSync(abs).size > 1_000_000) continue;
      src = fs.readFileSync(abs, "utf-8").split(/\r?\n/);
    } catch { continue; }
    const start = Math.max(1, Number(m[2]));
    const code = src.slice(start - 1, start - 1 + SNIPPET_LINES);
    if (!code.some((c) => c.trim())) continue;
    code.forEach((c, i) => out.push(`    | ${start + i}: ${c.trimEnd().slice(0, SNIPPET_COLS)}`));
    shown++;
  }
  return out.join("\n");
}
