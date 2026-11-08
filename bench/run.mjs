#!/usr/bin/env node
// A/B benchmark: Claude Code headless on a pinned checkout, with vs without fullstack-audit.
// Usage: node bench/run.mjs --target <repo> --commit <sha> [--arms with,without] [--runs 3]
//   [--tasks bench/tasks.json] [--only t01,t02] [--max-budget-usd 1.5] [--model sonnet]
//   [--out bench/results/<ts>] [--work bench/.work] [--timeout 600] [--seed 1] [--dry-run]
// Real runs cost money (each run is a full agent session). Use --only/--runs 1 for a pilot.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..");

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) continue;
  const k = a.slice(2);
  const nxt = process.argv[i + 1];
  if (nxt === undefined || nxt.startsWith("--")) args[k] = true;
  else { args[k] = nxt; i++; }
}
const need = (k) => { if (!args[k]) { console.error(`missing --${k}`); process.exit(2); } return args[k]; };
const target = path.resolve(need("target"));
const commit = need("commit");
const arms = String(args.arms || "with,without").split(",");
const runs = Number(args.runs || 3);
const tasksFile = path.resolve(args.tasks || path.join(HERE, "tasks.json"));
const budget = String(args["max-budget-usd"] || "1.5");
const model = args.model || "sonnet";
const timeoutMs = Number(args.timeout || 600) * 1000;
const seed = Number(args.seed || 1);
const dry = !!args["dry-run"];
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = path.resolve(args.out || path.join(HERE, "results", stamp));
const work = path.resolve(args.work || path.join(HERE, ".work"));

let tasks = JSON.parse(fs.readFileSync(tasksFile, "utf-8"));
if (args.only) { const s = new Set(String(args.only).split(",")); tasks = tasks.filter((t) => s.has(t.id)); }

const HINT = `This project has a pre-built code atlas. Before grepping or globbing, call the fullstack_find MCP tool (and fullstack_path / fullstack_impact / fullstack_component for relationships) to locate symbols, routes, labels and dependencies. Fall back to normal search only if it returns nothing.`;

const sh = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { encoding: "utf-8", ...opts });

function prepareCheckout(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dir), { recursive: true });
  const r = sh("git", ["-C", target, "worktree", "add", "--detach", "--force", dir, commit]);
  if (r.status !== 0) throw new Error("worktree add failed: " + r.stderr);
}
function resetCheckout(dir) {
  sh("git", ["-C", dir, "checkout", "--", "."]);
  sh("git", ["-C", dir, "clean", "-fdq", "-e", "docs/frontend-atlas", "-e", "CLAUDE.md", "-e", ".mcp.bench.json"]);
}

function armSetup(arm, dir) {
  if (arm !== "with") return { extra: [], atlasMs: 0 };
  const t0 = Date.now();
  const r = sh(process.execPath, [path.join(REPO, "bin", "audit.js")], { cwd: dir, timeout: 300000 });
  const atlasMs = Date.now() - t0;
  if (!fs.existsSync(path.join(dir, "docs", "frontend-atlas", ".atlas-index.json"))) {
    throw new Error("atlas not generated: " + (r.stderr || r.stdout || "").slice(-400));
  }
  fs.writeFileSync(path.join(dir, "CLAUDE.md"), HINT + "\n");
  const mcp = path.join(dir, ".mcp.bench.json");
  fs.writeFileSync(mcp, JSON.stringify({ mcpServers: { "fullstack-audit": { command: process.execPath, args: [path.join(REPO, "bin", "mcp-server.js")], env: { FULLSTACK_AUDIT_ROOT: dir } } } }));
  return { extra: ["--mcp-config", mcp], atlasMs };
}

function claudeArgs(prompt, arm, extra) {
  // Isolation: only project settings (user plugins/hooks/CLAUDE.md stay out), no skills, MCP only what we pass.
  return ["-p", "--output-format", "stream-json", "--verbose", "--model", model,
    "--max-budget-usd", budget, "--permission-mode", "acceptEdits", "--no-session-persistence",
    "--setting-sources", "project", "--strict-mcp-config", "--disable-slash-commands", ...extra];
}

function runClaude(argv, cwd, prompt) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const p = spawn("claude", argv, { cwd, shell: process.platform === "win32", stdio: ["pipe", "pipe", "pipe"] });
    p.stdin.end(prompt); // prompt via stdin: shell quoting on Windows mangles quotes in args
    let so = "", se = "", killed = false;
    const timer = setTimeout(() => { killed = true; p.kill("SIGKILL"); }, timeoutMs);
    p.stdout.on("data", (d) => (so += d));
    p.stderr.on("data", (d) => (se += d));
    p.on("close", (code) => { clearTimeout(timer); resolve({ code, so, se, killed, wallMs: Date.now() - t0 }); });
  });
}

function parseStream(raw) {
  const tools = {};
  let result = null, init = null;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type === "system" && o.subtype === "init") init = o;
    if (o.type === "assistant") for (const c of o.message?.content || []) if (c.type === "tool_use") tools[c.name] = (tools[c.name] || 0) + 1;
    if (o.type === "result") result = o;
  }
  return { tools, result, init };
}

const norm = (s) => String(s).toLowerCase().replace(/\\/g, "/");
function grade(task, answer, dir) {
  const c = task.check;
  if (c.type === "answer-contains") {
    const a = norm(answer);
    const all = (c.all || []).every((s) => a.includes(norm(s)));
    const any = !c.any || c.any.length === 0 || c.any.some((s) => a.includes(norm(s)));
    return all && any;
  }
  if (c.type === "file-contains") {
    try { return new RegExp(c.pattern).test(fs.readFileSync(path.join(dir, c.file), "utf-8")); } catch { return false; }
  }
  return false;
}

function rng(s) { return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const plan = [];
for (const t of tasks) for (let r = 1; r <= runs; r++) for (const arm of arms) plan.push({ t, r, arm });
const rand = rng(seed);
plan.sort(() => rand() - 0.5);

fs.mkdirSync(path.join(out, "raw"), { recursive: true });
const rows = [];
const checkouts = {};
for (const arm of arms) {
  const dir = path.join(work, arm);
  if (dry) { checkouts[arm] = { dir, extra: arm === "with" ? ["--mcp-config", "<mcp.json>"] : [], atlasMs: 0 }; continue; }
  prepareCheckout(dir);
  checkouts[arm] = { dir, ...armSetup(arm, dir) };
  console.log(`[${arm}] checkout ready` + (arm === "with" ? ` (atlas ${checkouts[arm].atlasMs} ms)` : ""));
}

for (const { t, r, arm } of plan) {
  const co = checkouts[arm];
  const argv = claudeArgs(t.prompt, arm, co.extra);
  if (dry) { console.log(`claude ${argv.map((x) => JSON.stringify(x)).join(" ")}  (cwd ${co.dir})`); continue; }
  resetCheckout(co.dir);
  const res = await runClaude(argv, co.dir, t.prompt);
  const { tools, result, init } = parseStream(res.so);
  const answer = result?.result || "";
  const u = result?.usage || {};
  const tokens = (u.input_tokens || 0) + (u.output_tokens || 0) + (u.cache_creation_input_tokens || 0);
  const row = {
    arm, task: t.id, category: t.category, run: r,
    pass: grade(t, answer, co.dir),
    tokens, cache_read: u.cache_read_input_tokens || 0,
    cost_usd: result?.total_cost_usd ?? null, turns: result?.num_turns ?? null,
    tool_calls: Object.values(tools).reduce((a, b) => a + b, 0), tools,
    audit_tools_visible: (init?.tools || []).filter((n) => n.includes("fullstack_")).length,
    wall_ms: res.wallMs, timed_out: res.killed, exit: res.code, error: result?.is_error || false,
  };
  rows.push(row);
  fs.writeFileSync(path.join(out, "raw", `${arm}-${t.id}-${r}.json`), res.so + (res.se ? `\n--stderr--\n${res.se}` : ""));
  fs.appendFileSync(path.join(out, "results.jsonl"), JSON.stringify(row) + "\n");
  console.log(`${arm.padEnd(7)} ${t.id} #${r} ${row.pass ? "PASS" : "FAIL"} tokens=${tokens} turns=${row.turns} tools=${row.tool_calls} ${(res.wallMs / 1000).toFixed(0)}s $${row.cost_usd}`);
}

if (dry) process.exit(0);

const med = (a) => { const v = a.filter((x) => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor((v.length - 1) / 2)] : 0; };
function summarize(list) {
  return { n: list.length, success: list.filter((x) => x.pass).length / (list.length || 1), tokens: med(list.map((x) => x.tokens)), cost: med(list.map((x) => x.cost_usd)), turns: med(list.map((x) => x.turns)), tools: med(list.map((x) => x.tool_calls)), wall_s: med(list.map((x) => x.wall_ms)) / 1000 };
}
const fmt = (s) => `| ${s.n} | ${(s.success * 100).toFixed(0)}% | ${s.tokens} | $${s.cost.toFixed(3)} | ${s.turns} | ${s.tools} | ${s.wall_s.toFixed(0)} |`;
let md = `# Benchmark summary\n\nTarget: ${target} @ ${commit}  |  model: ${model}  |  runs/task: ${runs}  |  budget/run: $${budget}\n`;
md += `Atlas generation (with arm, one-time): ${checkouts.with?.atlasMs ?? 0} ms\n\nCLAUDE.md hint used in "with" arm:\n> ${HINT}\n\n`;
for (const scope of ["all", ...new Set(tasks.map((t) => t.category))]) {
  md += `## ${scope}\n\n| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |\n|---|---|---|---|---|---|---|---|\n`;
  for (const arm of arms) {
    const l = rows.filter((x) => x.arm === arm && (scope === "all" || x.category === scope));
    md += `| ${arm} ${fmt(summarize(l))}\n`;
  }
  md += "\n";
}
const bad = rows.filter((x) => x.arm === "with" && x.audit_tools_visible === 0).length;
if (bad) md += `WARNING: ${bad} "with" runs had no fullstack_* tools visible; those numbers are invalid.\n`;
fs.writeFileSync(path.join(out, "summary.md"), md);
console.log("\n" + md);
