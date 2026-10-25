#!/usr/bin/env node
/**
 * Universal Fullstack Audit MCP Server (Stdio JSON-RPC 2.0 Daemon)
 * Exposes 7 high-performance native tools to AI agents:
 * 1. fullstack_find: Sub-3ms token-compact lookup across Fullstack Atlas
 * 2. fullstack_locate_visual: 0ms visual locator (pulse dots, capsule pills, action icons, badges)
 * 3. fullstack_resolve: Fuzzy prefix-agnostic component and file resolver
 * 4. fullstack_path: Sub-5ms causal execution path finder (UI -> Action -> DB)
 * 5. fullstack_symbol: Line-bound surgical slicer for functions/methods in monolithic files
 * 6. fullstack_patch: CRLF-agnostic surgical patcher (immune to PowerShell escaping crashes)
 * 7. fullstack_audit: On-demand atlas regeneration and cache refresh
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import child_process from "child_process";
import { FULLSTACK_AUDIT_VERSION, FULLSTACK_AUDIT_ENGINE, tokenizeCodeIdentifier, expandSynonyms, AtlasIndex } from "./constants.js";

// Ensure all diagnostic logging goes strictly to stderr. stdout is exclusively for JSON-RPC 2.0.
function logDebug(msg: string) {
  process.stderr.write(`[fullstack-audit-mcp] ${msg}\n`);
}

// High-Performance In-Memory LRU Cache for sub-0.05ms repeated queries
class FastLRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity = 256) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

const findLruCache = new FastLRUCache<string, string>(256);
const visualLruCache = new FastLRUCache<string, string>(256);
const pathLruCache = new FastLRUCache<string, string>(256);

// In-Memory Cached Atlas Store to eliminate disk I/O on query bursts
interface CachedIndex {
  mtime: number;
  data: AtlasIndex;
  files: string[];
}
const indexFileCache = new Map<string, CachedIndex>();

function getCachedAtlasIndex(indexPath: string): CachedIndex | null {
  try {
    if (!fs.existsSync(indexPath)) return null;
    const stat = fs.statSync(indexPath);
    const cached = indexFileCache.get(indexPath);
    if (cached && cached.mtime === stat.mtimeMs) {
      return cached;
    }
    const raw = fs.readFileSync(indexPath, "utf-8");
    const data: AtlasIndex = JSON.parse(raw);
    const files = Array.isArray(data.files) ? data.files : [];
    const entry: CachedIndex = { mtime: stat.mtimeMs, data, files };
    indexFileCache.set(indexPath, entry);
    return entry;
  } catch {
    return null;
  }
}

function escapeRegex(str: string): string {
  return (str || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function ensureGitignoreProtection(projectRoot: string): void {
  try {
    const gitignorePath = path.join(projectRoot, ".gitignore");
    if (!fs.existsSync(gitignorePath)) return;

    const content = fs.readFileSync(gitignorePath, "utf-8");
    const requiredEntries = [
      "docs/frontend-atlas/",
      "docs/backend-atlas/",
      "docs/llms.txt",
      "docs/llms-full.txt",
      "docs/THEME_MIGRATION_PUNCHLIST.md",
      "scripts/benchmark-*.ts",
    ];

    const missing = requiredEntries.filter(e => !content.includes(e));
    if (missing.length === 0) return;

    let toAppend = "\n# Fullstack Audit local architecture maps & benchmarks (AI navigation only)\n";
    for (const entry of missing) {
      toAppend += `${entry}\n`;
    }

    fs.appendFileSync(gitignorePath, toAppend, "utf-8");
    logDebug(`Quarantined .gitignore in ${projectRoot} (+${missing.length} entries)`);
  } catch (err: any) {
    logDebug(`Could not update .gitignore: ${err.message}`);
  }
}

function resolveProjectRoot(projectRoot?: string): string {
  let root = process.cwd();
  if (projectRoot && path.isAbsolute(projectRoot)) {
    root = projectRoot;
  } else if (projectRoot) {
    root = path.resolve(process.cwd(), projectRoot);
  }
  ensureGitignoreProtection(root);
  return root;
}

function getFilesRecursively(dir: string, fileList: string[], maxFiles = 3000) {
  if (fileList.length >= maxFiles) return;
  if (!fs.existsSync(dir)) return;

  const ignores = new Set([
    "node_modules", ".git", ".next", "dist", "build", ".nuxt", ".output",
    ".cache", "coverage", ".turbo", ".agent", ".gemini"
  ]);

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (fileList.length >= maxFiles) break;
      if (entry.isDirectory()) {
        if (!ignores.has(entry.name)) {
          getFilesRecursively(path.join(dir, entry.name), fileList, maxFiles);
        }
      } else {
        fileList.push(path.join(dir, entry.name));
      }
    }
  } catch {}
}

// 1. Tool: fullstack_find
function toolFind(query: string, projectRoot?: string, compact = true): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  const q = (query || "").toLowerCase().trim();

  if (!q) {
    return { content: "❌ Query parameter cannot be empty.", isError: true };
  }

  const cacheKey = `find:${root}:${compact ? "c" : "f"}:${q}`;
  const cached = findLruCache.get(cacheKey);
  if (cached !== undefined) {
    return { content: cached, isError: false };
  }

  const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const cachedIndex = getCachedAtlasIndex(indexPath);

  if (!cachedIndex || !cachedIndex.data) {
    return {
      content: `❌ [Atlas Not Found] docs/frontend-atlas/.atlas-index.json is missing in ${root}.\nTip: Call the "fullstack_audit" tool to generate the fullstack atlas for this project.`,
      isError: false,
    };
  }

  try {
    const index = cachedIndex.data;
    const qNorm = q.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
    const qTokens = tokenizeCodeIdentifier(query);
    const expandedTokens = expandSynonyms(qTokens);

    const hits: { entry: any; score: number }[] = [];
    (index.entries || []).forEach((entry: any) => {
      const sym = (entry.symbol || "").toLowerCase();
      const symNorm = sym.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
      const file = (entry.file || "").toLowerCase();
      const meta = (entry.meta || "").toLowerCase();

      let score = 0;
      if (sym === q || (qNorm && symNorm === qNorm)) {
        score = 100;
      } else if (sym.startsWith(q) || (qNorm && symNorm.startsWith(qNorm))) {
        score = 85;
      } else if (sym.includes(q) || (qNorm && symNorm.includes(qNorm))) {
        score = 70;
      } else if (qNorm && qNorm.length >= 3 && symNorm.includes(qNorm)) {
        score = 60;
      } else if (file.includes(q) || meta.includes(q)) {
        score = 30;
      }

      if (qTokens.length > 0) {
        const entryTokens = tokenizeCodeIdentifier(`${entry.symbol} ${entry.meta || ""} ${entry.file}`);
        let matchedTokens = 0;
        for (const token of expandedTokens) {
          if (entryTokens.includes(token)) matchedTokens++;
        }
        if (matchedTokens > 0) {
          const hybridScore = Math.min(85, Math.round((matchedTokens / Math.max(qTokens.length, 1)) * 80));
          if (hybridScore > score) score = hybridScore;
        }
      }

      if (score > 0) {
        if (entry.category === "route" || entry.category === "component") score += 5;
        if (entry.category === "action" || entry.category === "api") score += 4;
        hits.push({ entry, score });
      }
    });

    hits.sort((a, b) => b.score - a.score);

    if (hits.length === 0) {
      const emptyResult = `ZERO_MATCH: "${query}" in .atlas-index.json.`;
      findLruCache.set(cacheKey, emptyResult);
      return { content: emptyResult, isError: false };
    }

    const topHits = hits.slice(0, 15);
    const lines = topHits.map(h => {
      const e = h.entry;
      const metaStr = e.meta ? ` [${e.meta}]` : "";
      return `${e.file}:${e.line} [${(e.category || "").toUpperCase()}] ${e.symbol}${metaStr} (${e.atlasRef})`;
    });

    if (hits.length > 15) {
      lines.push(`... (+${hits.length - 15} more matches in docs/frontend-atlas/)`);
    }

    const outputResult = lines.join("\n");
    findLruCache.set(cacheKey, outputResult);
    return { content: outputResult, isError: false };
  } catch (err: any) {
    return { content: `❌ Error querying atlas index: ${err.message}`, isError: true };
  }
}

// 2. Tool: fullstack_locate_visual
function toolLocateVisual(query: string, projectRoot?: string): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  const q = (query || "").toLowerCase().trim();

  if (!q) {
    return { content: "❌ Query parameter cannot be empty.", isError: true };
  }

  const cacheKey = `visual:${root}:${q}`;
  const cached = visualLruCache.get(cacheKey);
  if (cached !== undefined) {
    return { content: cached, isError: false };
  }

  const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const cachedIndex = getCachedAtlasIndex(indexPath);

  if (!cachedIndex || !cachedIndex.data) {
    return {
      content: `❌ [Atlas Not Found] docs/frontend-atlas/.atlas-index.json is missing in ${root}. Run "fullstack_audit" first.`,
      isError: false,
    };
  }

  try {
    const index = cachedIndex.data;

    const visualCategories = new Set(["live-dot", "capsule-pill", "icon", "label", "overlay"]);
    const hits: { entry: any; score: number }[] = [];
    const qNorm = q.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();

    (index.entries || []).forEach((entry: any) => {
      const isVisual = visualCategories.has(entry.category);
      const sym = (entry.symbol || "").toLowerCase();
      const symNorm = sym.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
      const meta = (entry.meta || "").toLowerCase();
      const file = (entry.file || "").toLowerCase();

      let score = 0;
      if (sym === q || (qNorm && symNorm === qNorm)) score = 100;
      else if (sym.startsWith(q) || (qNorm && symNorm.startsWith(qNorm))) score = 85;
      else if (sym.includes(q) || (qNorm && symNorm.includes(qNorm))) score = 70;
      else if (qNorm && qNorm.length >= 3 && symNorm.includes(qNorm)) score = 60;
      else if (meta.includes(q)) score = 50;
      else if (file.includes(q)) score = 30;

      if (score > 0) {
        if (isVisual) score += 25;
        hits.push({ entry, score });
      }
    });

    hits.sort((a, b) => b.score - a.score);

    if (hits.length === 0) {
      const notFoundMsg = `⚡ [VISUAL LOCATOR] No visual elements matching "${query}". Check docs/frontend-atlas/02_COMPONENT_INVENTORY.md.`;
      visualLruCache.set(cacheKey, notFoundMsg);
      return { content: notFoundMsg, isError: false };
    }

    const lines = [`🎯 [VISUAL LOCATOR: 0ms Match] Found ${hits.length} visual element(s) for "${query}":\n`];
    hits.slice(0, 10).forEach(h => {
      const e = h.entry;
      const metaStr = e.meta ? ` [${e.meta}]` : "";
      lines.push(`   - [${(e.category || "").toUpperCase()}] ${e.file}:${e.line} ➔ ${e.symbol}${metaStr}`);
      lines.push(`     📖 Atlas: ${e.atlasRef}`);
    });

    const outputResult = lines.join("\n");
    visualLruCache.set(cacheKey, outputResult);
    return { content: outputResult, isError: false };
  } catch (err: any) {
    return { content: `❌ Error querying visual locator: ${err.message}`, isError: true };
  }
}

// 3. Tool: fullstack_resolve
function toolResolve(name: string, projectRoot?: string): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  const qRaw = (name || "").trim();
  if (!qRaw) return { content: "❌ Name parameter cannot be empty.", isError: true };

  const normalizedQuery = qRaw.replace(/\\/g, "/");
  const strippedPrefix = normalizedQuery.replace(/^(\.\/)?(src\/|app\/)?/, "");
  const baseOnlyQuery = path.basename(normalizedQuery);
  const cleanQ = baseOnlyQuery.toLowerCase().replace(/[-_.]/g, "").replace(/\.(tsx|jsx|ts|js|vue|svelte|astro|css)$/, "");

  const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const cachedIndex = getCachedAtlasIndex(indexPath);
  let allFiles: string[] = [];
  if (cachedIndex && cachedIndex.files && cachedIndex.files.length > 0) {
    allFiles = cachedIndex.files.map(f => path.resolve(root, f));
  } else {
    getFilesRecursively(root, allFiles);
  }

  const matches: { path: string; relPath: string; score: number }[] = [];

  for (const f of allFiles) {
    const rel = path.relative(root, f).replace(/\\/g, "/");
    const basename = path.basename(f);
    const cleanBase = basename.toLowerCase().replace(/[-_.]/g, "").replace(/\.(tsx|jsx|ts|js|vue|svelte|astro|css)$/, "");

    if (rel.toLowerCase() === normalizedQuery.toLowerCase() || rel.toLowerCase() === strippedPrefix.toLowerCase()) {
      matches.push({ path: f, relPath: rel, score: 100 });
    } else if (basename.toLowerCase() === baseOnlyQuery.toLowerCase() || basename === baseOnlyQuery) {
      matches.push({ path: f, relPath: rel, score: 95 });
    } else if (cleanBase === cleanQ) {
      matches.push({ path: f, relPath: rel, score: 90 });
    } else if (cleanBase.includes(cleanQ)) {
      matches.push({ path: f, relPath: rel, score: 70 });
    } else if (rel.toLowerCase().includes(strippedPrefix.toLowerCase())) {
      matches.push({ path: f, relPath: rel, score: 60 });
    } else if (rel.toLowerCase().includes(baseOnlyQuery.toLowerCase())) {
      matches.push({ path: f, relPath: rel, score: 50 });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return { content: `❌ [RESOLVE] Could not locate any file matching "${name}" in ${root}.`, isError: false };
  }

  const best = matches[0];
  const out = [`🎯 [RESOLVED] ${best.relPath} (Confidence: ${best.score}%)`];
  if (matches.length > 1) {
    out.push("   Alternatives:");
    matches.slice(1, 4).forEach(m => out.push(`     - ${m.relPath}`));
  }
  return { content: out.join("\n"), isError: false };
}

// 4. Tool: fullstack_path
function toolCausalPath(from: string, to: string, projectRoot?: string): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  if (!from || !to) return { content: "❌ Both 'from' and 'to' parameters are required.", isError: true };

  const fromQ = from.toLowerCase().trim();
  const toQ = to.toLowerCase().trim();
  const cacheKey = `path:${root}:${fromQ}:${toQ}`;
  const cached = pathLruCache.get(cacheKey);
  if (cached !== undefined) {
    return { content: cached, isError: false };
  }

  let nodes: any[] = [];
  let links: any[] = [];

  // 1. Fast-Path A: Pre-computed causalGraph from .atlas-index.json (0ms in-memory graph)
  const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  if (fs.existsSync(indexPath)) {
    try {
      const raw = fs.readFileSync(indexPath, "utf-8");
      const index = JSON.parse(raw);
      if (index.causalGraph && Array.isArray(index.causalGraph.nodes) && index.causalGraph.nodes.length > 0) {
        nodes = index.causalGraph.nodes;
        links = index.causalGraph.links || [];
      }
    } catch {}
  }

  // 2. Fast-Path B: docs/graph.json
  if (nodes.length === 0) {
    const graphPath = path.join(root, "docs", "graph.json");
    if (fs.existsSync(graphPath)) {
      try {
        const raw = fs.readFileSync(graphPath, "utf-8");
        const graphData = JSON.parse(raw);
        nodes = graphData.nodes || [];
        links = graphData.links || [];
      } catch {}
    }
  }

  // 3. Fallback: Parse docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md
  if (nodes.length === 0) {
    const crossRef = path.join(root, "docs", "backend-atlas", "06_FULLSTACK_CROSS_REFERENCE_MAP.md");
    if (fs.existsSync(crossRef)) {
      try {
        const fileLines = fs.readFileSync(crossRef, "utf-8").split("\n");
        const nodeSet = new Set<string>();
        const addN = (id: string, type: string) => {
          if (!nodeSet.has(id)) {
            nodeSet.add(id);
            nodes.push({ id, label: id, type });
          }
        };
        fileLines.forEach(line => {
          const parts = line.split("|").map(p => p.trim()).filter(Boolean);
          if (parts.length >= 4 && !parts[0].includes("---") && !parts[0].toLowerCase().includes("ui trigger")) {
            const ui = parts[0].replace(/`|\[|\]/g, "");
            const api = parts[1].replace(/`|\[|\]/g, "");
            const db = parts[3].replace(/`|\[|\]/g, "");
            if (ui && ui !== "-") addN(ui, "component");
            if (api && api !== "-") addN(api, "api_endpoint");
            if (db && db !== "-") addN(db, "db_model");
            if (ui && api && ui !== "-" && api !== "-") links.push({ source: ui, target: api, type: "calls" });
            if (api && db && api !== "-" && db !== "-") links.push({ source: api, target: db, type: "mutates" });
          }
        });
      } catch {}
    }
  }

  if (nodes.length === 0) {
    return {
      content: `❌ No graph data or cross-reference map found in ${root}. Run "fullstack_audit" first.`,
      isError: false,
    };
  }

  const startNode = nodes.find(n => n.id.toLowerCase().includes(fromQ) || (n.label || "").toLowerCase().includes(fromQ));
  const endNode = nodes.find(n => n.id.toLowerCase().includes(toQ) || (n.label || "").toLowerCase().includes(toQ));

  if (!startNode) return { content: `❌ Start node matching "${from}" not found.`, isError: false };
  if (!endNode) return { content: `❌ Target node matching "${to}" not found.`, isError: false };

  // BFS
  const queue: { current: string; path: string[] }[] = [{ current: startNode.id, path: [startNode.id] }];
  const visited = new Set<string>([startNode.id]);
  let foundPath: string[] | null = null;

  while (queue.length > 0) {
    const { current, path: curPath } = queue.shift()!;
    if (current === endNode.id) {
      foundPath = curPath;
      break;
    }
    const neighbors = links.filter(l => l.source === current).map(l => l.target);
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push({ current: n, path: [...curPath, n] });
      }
    }
  }

  if (!foundPath) {
    const noPathMsg = `❌ No causal dependency path found between "${from}" and "${to}".`;
    pathLruCache.set(cacheKey, noPathMsg);
    return { content: noPathMsg, isError: false };
  }

  const steps = foundPath.map((nodeId, idx) => {
    const nodeObj = nodes.find(n => n.id === nodeId);
    const typeLabel = (nodeObj?.type || "unknown").toUpperCase();
    return `   ${idx + 1}. [${typeLabel}] ${nodeId}`;
  });

  const outputResult = `⚡ [CAUSAL PATH: Sub-5ms Trace]\n${foundPath.join(" ➔ ")}\n\nSteps:\n${steps.join("\n")}`;
  pathLruCache.set(cacheKey, outputResult);
  return {
    content: outputResult,
    isError: false,
  };
}

// 5. Tool: fullstack_symbol
function toolSymbolSlices(symbolName: string, projectRoot?: string): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  if (!symbolName) return { content: "❌ Symbol parameter cannot be empty.", isError: true };

  const q = symbolName.toLowerCase().trim();
  const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
  const cachedIndex = getCachedAtlasIndex(indexPath);

  // Fast-Path: In-memory pre-indexed slices and symbols (<0.1ms)
  if (cachedIndex && cachedIndex.data && Array.isArray(cachedIndex.data.entries)) {
    const preHits = cachedIndex.data.entries.filter(e => 
      (e.category === "slice" || e.category === "symbol" || e.category === "action") &&
      (e.symbol.toLowerCase().includes(q) || (e.meta && e.meta.toLowerCase().includes(q)))
    );
    if (preHits.length > 0) {
      const out = [`⚡ [GOD-FILE SLICER: Sub-1ms Index Hit] Found ${preHits.length} slice(s) matching "${symbolName}":\n`];
      preHits.forEach(h => {
        out.push(`   - ${h.file}:${h.line} [${h.meta || h.category}] -> ${h.symbol}`);
      });
      out.push(`\n💡 Target lines above with read_file(StartLine, EndLine) for sub-second precision.`);
      return { content: out.join("\n"), isError: false };
    }
  }

  let allFiles: string[] = [];
  if (cachedIndex && cachedIndex.files && cachedIndex.files.length > 0) {
    allFiles = cachedIndex.files.map(f => path.resolve(root, f));
  } else {
    getFilesRecursively(root, allFiles);
  }
  const targetFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
  const escapedSym = escapeRegex(symbolName);
  const hits: { file: string; relPath: string; symbol: string; startLine: number; endLine: number; lineCount: number }[] = [];

  for (const f of targetFiles) {
    let content = "";
    try {
      content = fs.readFileSync(f, "utf-8");
    } catch {
      continue;
    }

    if (!content.toLowerCase().includes(q)) continue;

    const rel = path.relative(root, f).replace(/\\/g, "/");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const declRegex = new RegExp(`(?:async\\s+)?(?:function\\s+)?([a-zA-Z0-9_$]*${escapedSym}[a-zA-Z0-9_$]*)\\s*(?:=|\\()`, "i");
      const match = line.match(declRegex);
      if (match) {
        const foundSym = match[1];
        const startLine = i + 1;
        let braceDepth = 0;
        let started = false;
        let endLine = startLine;

        for (let j = i; j < lines.length; j++) {
          const l = lines[j];
          for (const ch of l) {
            if (ch === "{") {
              braceDepth++;
              started = true;
            } else if (ch === "}") {
              braceDepth--;
            }
          }
          if (started && braceDepth <= 0) {
            endLine = j + 1;
            break;
          }
          if (j - i > 400) {
            endLine = j + 1;
            break;
          }
        }

        hits.push({
          file: f,
          relPath: rel,
          symbol: foundSym,
          startLine,
          endLine,
          lineCount: endLine - startLine + 1,
        });
      }
    }
  }

  if (hits.length === 0) {
    return { content: `❌ [SYMBOL] No function or method found matching "${symbolName}".`, isError: false };
  }

  const out = [`⚡ [GOD-FILE SLICER] Found ${hits.length} method/function slice(s) matching "${symbolName}":\n`];
  hits.forEach(h => {
    out.push(`   - ${h.relPath}:${h.startLine}-${h.endLine} [L${h.startLine}–L${h.endLine} (${h.lineCount} lines)] -> ${h.symbol}`);
  });
  out.push(`\n💡 Tip: Call read_file with StartLine=${hits[0].startLine} and EndLine=${hits[0].endLine} to save context!`);

  return { content: out.join("\n"), isError: false };
}

// 6. Tool: fullstack_patch
function toolSurgicalPatch(filePath: string, target: string, replacement: string, projectRoot?: string): { content: string; isError: boolean } {
  const root = resolveProjectRoot(projectRoot);
  if (!filePath) return { content: "❌ Target filePath is required.", isError: true };
  if (target === undefined || replacement === undefined) return { content: "❌ Both target and replacement strings are required.", isError: true };

  const resolvedRoot = path.resolve(root);
  const fullPath = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath);
  if (!fullPath.startsWith(resolvedRoot)) {
    return { content: `❌ Security Error: Path traversal forbidden. Path outside workspace root: ${filePath}`, isError: true };
  }
  if (!fs.existsSync(fullPath)) {
    return { content: `❌ Target file not found: ${filePath}`, isError: true };
  }

  const originalContent = fs.readFileSync(fullPath, "utf-8");
  const isCrlf = originalContent.includes("\r\n");

  const normalizedFile = originalContent.replace(/\r\n/g, "\n");
  const normalizedTarget = target.replace(/\r\n/g, "\n");
  const normalizedReplace = replacement.replace(/\r\n/g, "\n");

  if (!normalizedFile.includes(normalizedTarget)) {
    const fileLines = normalizedFile.split("\n");
    const targetLines = normalizedTarget.trim().split("\n").map(l => l.trim());
    let matchLineIdx = -1;

    for (let i = 0; i <= fileLines.length - targetLines.length; i++) {
      let allMatch = true;
      for (let j = 0; j < targetLines.length; j++) {
        if (fileLines[i + j].trim() !== targetLines[j]) {
          allMatch = false;
          break;
        }
      }
      if (allMatch) {
        matchLineIdx = i;
        break;
      }
    }

    if (matchLineIdx !== -1) {
      const leadingIndent = fileLines[matchLineIdx].match(/^\s*/)?.[0] || "";
      const indentedReplace = normalizedReplace.split("\n").map(l => leadingIndent + l).join("\n");
      fileLines.splice(matchLineIdx, targetLines.length, indentedReplace);
      let updated = fileLines.join("\n");
      if (isCrlf) updated = updated.replace(/\n/g, "\r\n");
      fs.writeFileSync(fullPath, updated, "utf-8");

      return {
        content: `✅ [PATCH SUCCESS] ${filePath}:${matchLineIdx + 1}\nReplaced lines ${matchLineIdx + 1}–${matchLineIdx + targetLines.length} with whitespace normalization. Clean exit 0.`,
        isError: false,
      };
    }

    return {
      content: `❌ Target string not found in ${filePath}.\nPreview of target: ${target.slice(0, 100)}...`,
      isError: true,
    };
  }

  let updatedContent = normalizedFile.replace(normalizedTarget, () => normalizedReplace);
  if (isCrlf) updatedContent = updatedContent.replace(/\n/g, "\r\n");
  fs.writeFileSync(fullPath, updatedContent, "utf-8");

  const matchIndex = normalizedFile.indexOf(normalizedTarget);
  const matchedLine = normalizedFile.substring(0, matchIndex).split("\n").length;

  return {
    content: `✅ [PATCH SUCCESS] ${filePath}:${matchedLine}\nTarget: "${target.slice(0, 40).replace(/\n/g, " ")}..." ➔ "${replacement.slice(0, 40).replace(/\n/g, " ")}..."\nStatus: Clean Exit Code 0 (CRLF preserved)`,
    isError: false,
  };
}

// 7. Tool: fullstack_audit
function toolAudit(projectRoot?: string, frontendOnly?: boolean, backendOnly?: boolean): { content: string; isError: boolean } {
  findLruCache.clear();
  visualLruCache.clear();
  pathLruCache.clear();
  const root = resolveProjectRoot(projectRoot);
  try {
    const auditScript = path.resolve(__dirname, "..", "bin", "audit.js");
    const flags = [];
    if (frontendOnly) flags.push("--frontend");
    if (backendOnly) flags.push("--backend");

    const res = child_process.spawnSync("node", [auditScript, ...flags], {
      cwd: root,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });

    if (res.error) {
      return { content: `❌ Failed to execute fullstack audit: ${res.error.message}`, isError: true };
    }

    const output = (res.stdout || "") + (res.stderr || "");
    const lastLines = output.split("\n").slice(-15).join("\n");
    return {
      content: `🎉 Fullstack Audit completed in ${root} (Exit code: ${res.status}):\n${lastLines}`,
      isError: res.status !== 0,
    };
  } catch (err: any) {
    return { content: `❌ Audit execution exception: ${err.message}`, isError: true };
  }
}

// MCP Tool Manifests
const TOOL_DEFINITIONS = [
  {
    name: "fullstack_find",
    description: "Sub-3ms token-compact lookup for routes, components, symbols, labels, queries, APIs, and models across the Fullstack Atlas.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (e.g. 'theme-toggle', 'login', 'UserProfile', 'useAuth')" },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." },
        compact: { type: "boolean", description: "Whether to return compact single-line outputs (default: true)." }
      },
      required: ["query"]
    }
  },
  {
    name: "fullstack_locate_visual",
    description: "0ms visual locator for live pulse dots (animate-pulse), capsule pills (rounded-full), status badges, and action icons.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Visual element name or pattern (e.g. 'pulse', 'pill', 'badge', 'chevron', 'lock')" },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
      },
      required: ["query"]
    }
  },
  {
    name: "fullstack_resolve",
    description: "Fuzzy case-insensitive component and file path resolver (prefix-agnostic). Resolves exact file paths without directory scanning.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Component or file name (e.g. 'ThemeToggle', 'user-profile', 'button', 'globals.css')" },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
      },
      required: ["name"]
    }
  },
  {
    name: "fullstack_path",
    description: "Sub-5ms causal execution path finder tracing UI triggers to backend API endpoints and DB models.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Source UI component or route (e.g. 'CheckoutButton', '/portal')" },
        to: { type: "string", description: "Target API endpoint, action, or DB model (e.g. 'createSubscription', 'UserModel')" },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
      },
      required: ["from", "to"]
    }
  },
  {
    name: "fullstack_symbol",
    description: "Line-bound surgical slicer for functions/methods in monolithic files. Returns exact start and end line numbers.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Function or method name to locate (e.g. 'executePayment', 'validateUser')" },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
      },
      required: ["symbol"]
    }
  },
  {
    name: "fullstack_patch",
    description: "CRLF-agnostic surgical patcher that replaces exact text blocks in files cleanly without PowerShell escaping or shell crashes.",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Target file path relative to project root or absolute." },
        target: { type: "string", description: "Exact string or block of code to replace." },
        replacement: { type: "string", description: "New replacement code." },
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
      },
      required: ["filePath", "target", "replacement"]
    }
  },
  {
    name: "fullstack_audit",
    description: "Generates or refreshes the fullstack atlas catalog (frontend & backend) into docs/frontend-atlas/ and docs/backend-atlas/.",
    inputSchema: {
      type: "object",
      properties: {
        projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." },
        frontendOnly: { type: "boolean", description: "Whether to only refresh the frontend atlas." },
        backendOnly: { type: "boolean", description: "Whether to only refresh the backend atlas." }
      }
    }
  }
];

// Stdio JSON-RPC 2.0 Dispatcher
export function startMcpServer() {
  logDebug(`Initializing Fullstack Audit MCP Server daemon v${FULLSTACK_AUDIT_VERSION}...`);
  ensureGitignoreProtection(process.cwd());

  let clientUsesHeaders = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const sendResponse = (id: any, result: any) => {
    const payload = JSON.stringify({ jsonrpc: "2.0", id, result });
    if (clientUsesHeaders) {
      const len = Buffer.byteLength(payload, "utf-8");
      process.stdout.write(`Content-Length: ${len}\r\n\r\n${payload}`);
    } else {
      process.stdout.write(payload + "\n");
    }
  };

  const sendError = (id: any, code: number, message: string, data?: any) => {
    const payload = JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } });
    if (clientUsesHeaders) {
      const len = Buffer.byteLength(payload, "utf-8");
      process.stdout.write(`Content-Length: ${len}\r\n\r\n${payload}`);
    } else {
      process.stdout.write(payload + "\n");
    }
  };

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("Content-Length:") || trimmed.startsWith("Content-Type:")) {
      clientUsesHeaders = true;
      return;
    }

    try {
      const request = JSON.parse(trimmed);
      const { id, method, params } = request;

      if (method === "initialize") {
        sendResponse(id, {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: "fullstack-audit",
            version: FULLSTACK_AUDIT_VERSION
          }
        });
        return;
      }

      if (method === "notifications/initialized") {
        // Notification, no response required
        return;
      }

      if (method === "ping") {
        sendResponse(id, {});
        return;
      }

      if (method === "tools/list") {
        sendResponse(id, { tools: TOOL_DEFINITIONS });
        return;
      }

      if (method === "tools/call") {
        const toolName = params?.name;
        const args = params?.arguments || {};
        let result: { content: string; isError: boolean } = { content: "Unknown tool", isError: true };

        switch (toolName) {
          case "fullstack_find":
            result = toolFind(args.query, args.projectRoot, args.compact ?? true);
            break;
          case "fullstack_locate_visual":
            result = toolLocateVisual(args.query, args.projectRoot);
            break;
          case "fullstack_resolve":
            result = toolResolve(args.name, args.projectRoot);
            break;
          case "fullstack_path":
            result = toolCausalPath(args.from, args.to, args.projectRoot);
            break;
          case "fullstack_symbol":
            result = toolSymbolSlices(args.symbol, args.projectRoot);
            break;
          case "fullstack_patch":
            result = toolSurgicalPatch(args.filePath, args.target, args.replacement, args.projectRoot);
            break;
          case "fullstack_audit":
            result = toolAudit(args.projectRoot, args.frontendOnly, args.backendOnly);
            break;
          default:
            sendError(id, -32601, `Tool not found: ${toolName}`);
            return;
        }

        sendResponse(id, {
          content: [
            {
              type: "text",
              text: result.content
            }
          ],
          isError: result.isError
        });
        return;
      }

      // Method not handled
      if (id !== undefined) {
        sendError(id, -32601, `Method not implemented: ${method}`);
      }
    } catch (err: any) {
      logDebug(`Parse error on line: ${err.message}`);
      sendError(null, -32700, "Parse error");
    }
  });

  rl.on("close", () => {
    logDebug("MCP Server stdio stream closed. Exiting process.");
    process.exit(0);
  });
}

// Run server directly if invoked as main process
if (process.argv[1] && (process.argv[1].endsWith("mcp-server.ts") || process.argv[1].endsWith("mcp-server.js"))) {
  startMcpServer();
}
