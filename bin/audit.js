#!/usr/bin/env node

import { spawn, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instant Fast-Path for Version Check (<5ms exit without spawning tsx)
const args = process.argv.slice(2);
if (args.includes("-v") || args.includes("--version")) {
  try {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    console.log(`fullstack-audit v${pkg.version} (engine: AST reactive graph v2)`);
  } catch {
    console.log("fullstack-audit (version unknown: package.json not found)");
  }
  process.exit(0);
}

// --check: unfinished-work gate on the change set (see scripts/check.ts). Exit 1 only on BLOCK.
async function runCheckCli() {
  try {
    const mod = await import("../dist/check.js");
    return mod.cli(args);
  } catch (e) {
    if (e?.code !== "ERR_MODULE_NOT_FOUND") { console.error(`fullstack-check: skipped (${e?.message || e})`); return 0; }
  }
  const tsx = path.resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");
  if (!fs.existsSync(tsx)) { console.error("fullstack-check: skipped (dist/check.js missing; run npm run build)"); return 0; }
  const r = spawnSync(process.execPath, [tsx, path.resolve(__dirname, "../scripts/check.ts"), ...args], { stdio: "inherit", shell: false });
  return r.status === 1 ? 1 : 0;
}

// --install-precommit: add the check to .git/hooks/pre-commit (skips when hooks are managed elsewhere).
function installPrecommit() {
  const bin = path.resolve(__dirname, "audit.js").replace(/\\/g, "/");
  // Missing bin (plugin moved/removed) must not block commits: only exit 1 on a real BLOCK.
  const line = `if [ -f "${bin}" ]; then node "${bin}" --check --staged || exit 1; fi`;
  const g = (a) => spawnSync("git", a, { encoding: "utf-8", shell: false });
  const custom = (g(["config", "core.hooksPath"]).stdout || "").trim();
  const dirOut = g(["rev-parse", "--git-path", "hooks"]);
  if (dirOut.status !== 0) { console.error("Not a git repository."); return 1; }
  if (custom) {
    console.log(`core.hooksPath is set to ${custom} (husky or similar). Add this line to your pre-commit hook:\n  ${line}`);
    return 0;
  }
  const hook = path.resolve(dirOut.stdout.trim(), "pre-commit");
  const cur = fs.existsSync(hook) ? fs.readFileSync(hook, "utf-8") : "";
  if (cur.includes("--check --staged")) { console.log(`Already installed: ${hook}`); return 0; }
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, (cur || "#!/bin/sh\n").replace(/\n?$/, "\n") + line + "\n", { mode: 0o755 });
  console.log(`Installed fullstack-check in ${hook}`);
  return 0;
}

if (args.includes("--install-precommit")) process.exit(installPrecommit());
if (args.includes("--check")) process.exit(await runCheckCli());

// Fast path: atlas lookups served from the compiled MCP tools (no tsx cold start).
function argAfter(...flags) {
  for (const f of flags) {
    const i = args.indexOf(f);
    if (i !== -1) return { i, v: args[i + 1] };
  }
  return null;
}

function liveSearch(query) {
  const probe = spawnSync("rg", ["--version"], { stdio: "ignore", shell: false });
  if (probe.error || probe.status !== 0) return false;
  const rgArgs = ["-F", "-S", "-n", "--no-heading", "--max-count", "3", "--max-columns", "200"];
  for (const d of ["node_modules", "dist", "docs", ".next", ".git", "cloned-repos"]) rgArgs.push("-g", `!${d}`);
  rgArgs.push("--", query, ".");
  const r = spawnSync("rg", rgArgs, { cwd: process.cwd(), encoding: "utf-8", shell: false, maxBuffer: 10 * 1024 * 1024 });
  const lines = (r.stdout || "").split(/\r?\n/).filter(Boolean);
  if (!lines.length) return false;
  console.log("live search (rg, not from atlas index):");
  console.log(lines.slice(0, 20).join("\n"));
  if (lines.length > 20) console.log(`... (+${lines.length - 20} more lines)`);
  return true;
}

async function tryFastPath() {
  if (args.some((a) => ["--diff", "--theme", "--verify", "--fix-buttons", "--dead", "--rag"].includes(a))) return null;
  const root = process.cwd();
  if (!fs.existsSync(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"))) return null;
  const compact = args.includes("--compact") || args.includes("--json");
  let call;
  const find = argAfter("--find", "-f");
  const vis = argAfter("--locate-visual", "--visual");
  const res = argAfter("--resolve");
  const sym = argAfter("--symbol");
  const pth = argAfter("--path");
  if (pth) { if (!pth.v || !args[pth.i + 2]) return null; call = (m) => m.toolCausalPath(pth.v, args[pth.i + 2], root); }
  else if (find) { if (!find.v || !compact) return null; call = (m) => m.toolFind(find.v, root, true); }
  else if (vis) { if (!vis.v) return null; call = (m) => m.toolLocateVisual(vis.v, root); }
  else if (res) { if (!res.v) return null; call = (m) => m.toolResolve(res.v, root); }
  else if (sym) { if (!sym.v) return null; call = (m) => m.toolSymbolSlices(sym.v, root); }
  else return null;
  let r;
  try {
    const mod = await import("../dist/mcp-server.js");
    r = call(mod);
  } catch {
    return null;
  }
  if (!r || /\[Atlas Not Found\]/.test(r.content)) return null;
  const miss = r.isError || /^ZERO_MATCH/.test(r.content) || r.content.startsWith("❌");
  console.log(r.content);
  if (miss && find && liveSearch(find.v)) return 0;
  return miss ? 1 : 0;
}

const fastCode = await tryFastPath();
if (fastCode !== null) process.exit(fastCode);

const scriptPath = path.resolve(__dirname, "../scripts/audit.ts");

// Check if local tsx cli exists to avoid cmd.exe / shell: true quoting hazards
const localTsx = path.resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");
const cwdTsx = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
const tsxPath = fs.existsSync(localTsx) ? localTsx : (fs.existsSync(cwdTsx) ? cwdTsx : null);
let child;

if (tsxPath) {
  // Direct node execution with shell: false (100% immune to & | ^ special char explosion)
  child = spawn(process.execPath, [tsxPath, scriptPath, ...args], {
    stdio: "inherit",
    shell: false,
  });
} else {
  // Fallback to npx
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  child = spawn(npxCmd, ["tsx", scriptPath, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

child.on("error", (err) => {
  console.error("❌ Failed to spawn fullstack-audit process:", err.message);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
