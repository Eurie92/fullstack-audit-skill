#!/usr/bin/env node
/**
 * Universal Fullstack Audit MCP Server (Stdio JSON-RPC 2.0 Daemon)
 * Exposes 13 native tools to AI agents:
 * 1. fullstack_find: compact lookup across Fullstack Atlas
 * 2. fullstack_locate_visual: visual locator (pulse dots, capsule pills, action icons, badges)
 * 3. fullstack_resolve: Fuzzy prefix-agnostic component and file resolver
 * 4. fullstack_path: causal path finder (UI -> Action -> DB)
 * 5. fullstack_symbol: Line-bound surgical slicer for functions/methods in monolithic files
 * 6. fullstack_patch: CRLF-agnostic surgical patcher (immune to PowerShell escaping crashes)
 * 7. fullstack_patch_apply: Chisel-style atomic unified diff patcher
 * 8. fullstack_batch_replace: 1-turn mass color and token replacer across multiple files
 * 9. fullstack_reference: Xerj-style Reference Coding pattern lookup from cloned repos
 * 10. fullstack_audit: On-demand atlas regeneration (frontend, backend, and adaptive)
 * 11. fullstack_impact: blast radius (reverse dependency walk over the causal graph)
 * 12. fullstack_component: component props, cva variants and usage count (duplicate check before building)
 * 13. fullstack_check: unfinished-work gate on changed files (dead/empty handlers, orphan components, unguarded DB writes)
 */
import fs from "fs";
import path from "path";
import readline from "readline";
import child_process from "child_process";
import { fileURLToPath } from "url";
import { FULLSTACK_AUDIT_VERSION, tokenizeCodeIdentifier, expandSynonyms } from "./constants.js";
import { applyUnifiedDiff, batchReplaceTokens } from "./precision-patcher.js";
import { isInsideRoot } from "../bin/path-contained.js";
import { runAdaptiveAudit } from "./adaptive-sniffer.js";
import { catalogReferenceRepos } from "./reference-cataloger.js";
import { annotateStale, addSnippets } from "./freshness.js";
import { findNodes, dependentsOf, shortestPath, neighborFiles, proximityBoost } from "./graph.js";
// Ensure all diagnostic logging goes strictly to stderr. stdout is exclusively for JSON-RPC 2.0.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function logDebug(msg) {
    process.stderr.write(`[fullstack-audit-mcp] ${msg}\n`);
}
// High-Performance In-Memory LRU Cache for sub-0.05ms repeated queries
class FastLRUCache {
    capacity;
    cache;
    constructor(capacity = 256) {
        this.capacity = capacity;
        this.cache = new Map();
    }
    get(key) {
        if (!this.cache.has(key))
            return undefined;
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.capacity) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, value);
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
const findLruCache = new FastLRUCache(256);
const visualLruCache = new FastLRUCache(256);
const pathLruCache = new FastLRUCache(256);
const indexFileCache = new Map();
function getCachedAtlasIndex(indexPath) {
    try {
        if (!fs.existsSync(indexPath))
            return null;
        const stat = fs.statSync(indexPath);
        const cached = indexFileCache.get(indexPath);
        if (cached && cached.mtime === stat.mtimeMs) {
            return cached;
        }
        const raw = fs.readFileSync(indexPath, "utf-8");
        const data = JSON.parse(raw);
        // Index was regenerated: result caches built from the old one are now wrong.
        findLruCache.clear();
        visualLruCache.clear();
        pathLruCache.clear();
        const files = Array.isArray(data.files) ? data.files : [];
        const entry = { mtime: stat.mtimeMs, data, files };
        indexFileCache.set(indexPath, entry);
        return entry;
    }
    catch {
        return null;
    }
}
function escapeRegex(str) {
    return (str || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
export function ensureGitignoreProtection(projectRoot) {
    try {
        const gitignorePath = path.join(projectRoot, ".gitignore");
        if (!fs.existsSync(gitignorePath))
            return;
        const content = fs.readFileSync(gitignorePath, "utf-8");
        const requiredEntries = [
            "docs/frontend-atlas/",
            "docs/backend-atlas/",
            "docs/adaptive-atlas/",
            "docs/reference-atlas/",
            "docs/cloned-repos/",
            "docs/clone-repo/",
            "docs/research/",
            "GLOSSARY.md",
            "docs/adr/",
            "docs/llms.txt",
            "docs/llms-full.txt",
            "docs/THEME_MIGRATION_PUNCHLIST.md",
        ];
        const missing = requiredEntries.filter(e => !content.includes(e));
        if (missing.length === 0)
            return;
        let toAppend = "\n# Fullstack Audit local architecture maps & benchmarks (AI navigation only)\n";
        for (const entry of missing) {
            toAppend += `${entry}\n`;
        }
        fs.appendFileSync(gitignorePath, toAppend, "utf-8");
        logDebug(`Quarantined .gitignore in ${projectRoot} (+${missing.length} entries)`);
    }
    catch (err) {
        logDebug(`Could not update .gitignore: ${err.message}`);
    }
}
function resolveProjectRoot(projectRoot) {
    let root = process.cwd();
    if (projectRoot && path.isAbsolute(projectRoot)) {
        root = projectRoot;
    }
    else if (projectRoot) {
        root = path.resolve(process.cwd(), projectRoot);
    }
    return root;
}
function getFilesRecursively(dir, fileList, maxFiles = 3000) {
    if (fileList.length >= maxFiles)
        return;
    if (!fs.existsSync(dir))
        return;
    const ignores = new Set([
        "node_modules", ".git", ".next", "dist", "build", ".nuxt", ".output",
        ".cache", "coverage", ".turbo", ".agent", ".gemini"
    ]);
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (fileList.length >= maxFiles)
                break;
            if (entry.isDirectory()) {
                if (!ignores.has(entry.name)) {
                    getFilesRecursively(path.join(dir, entry.name), fileList, maxFiles);
                }
            }
            else {
                fileList.push(path.join(dir, entry.name));
            }
        }
    }
    catch { }
}
// Load the index first (a reload clears the result caches), run the lookup, then flag hits whose
// file changed since the atlas was built. Applied after the cache so cached answers are checked too.
/** Appended to every ZERO_MATCH: the atlas only knows structure, so plain text needs a live search. */
const grepHint = (q) => ` The atlas indexes routes, components, labels, API routes and DB models only; for other text search the code: rg -n -F ${JSON.stringify(q)}`;
function withFreshness(projectRoot, run, snippets = false) {
    const root = resolveProjectRoot(projectRoot);
    const idx = getCachedAtlasIndex(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"));
    const r = run();
    if (r.isError || !idx)
        return r;
    const content = annotateStale(root, idx.data.fileStamps, r.content);
    return { ...r, content: snippets ? addSnippets(root, content) : content };
}
export function toolFind(query, projectRoot, compact = true, activeFile) {
    return withFreshness(projectRoot, () => findImpl(query, projectRoot, compact, activeFile), true);
}
export function toolLocateVisual(query, projectRoot) {
    return withFreshness(projectRoot, () => locateVisualImpl(query, projectRoot), true);
}
// 1. Tool: fullstack_find
function findImpl(query, projectRoot, compact = true, activeFile) {
    const root = resolveProjectRoot(projectRoot);
    const active = activeFile
        ? (path.isAbsolute(activeFile) ? path.relative(root, activeFile) : activeFile).replace(/\\/g, "/").replace(/^\.\//, "")
        : "";
    const q = (query || "").toLowerCase().trim();
    if (!q) {
        return { content: "❌ Query parameter cannot be empty.", isError: true };
    }
    const cacheKey = `find:${root}:${compact ? "c" : "f"}:${q}${active ? `:@${active}` : ""}`;
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
        const hits = [];
        (index.entries || []).forEach((entry) => {
            const sym = (entry.symbol || "").toLowerCase();
            const symNorm = sym.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
            const file = (entry.file || "").toLowerCase();
            const meta = (entry.meta || "").toLowerCase();
            let score = 0;
            if (sym === q || (qNorm && symNorm === qNorm)) {
                score = 100;
            }
            else if (sym.startsWith(q) || (qNorm && symNorm.startsWith(qNorm))) {
                score = 85;
            }
            else if (sym.includes(q) || (qNorm && symNorm.includes(qNorm))) {
                score = 70;
            }
            else if (qNorm && qNorm.length >= 3 && symNorm.includes(qNorm)) {
                score = 60;
            }
            else if (file.includes(q) || meta.includes(q)) {
                score = 30;
            }
            if (qTokens.length > 0) {
                const entryTokens = tokenizeCodeIdentifier(`${entry.symbol} ${entry.meta || ""} ${entry.file}`);
                let matchedTokens = 0;
                for (const token of expandedTokens) {
                    if (entryTokens.includes(token))
                        matchedTokens++;
                }
                if (matchedTokens > 0) {
                    const hybridScore = Math.min(85, Math.round((matchedTokens / Math.max(qTokens.length, 1)) * 80));
                    if (hybridScore > score)
                        score = hybridScore;
                }
            }
            if (score > 0) {
                if (entry.category === "route" || entry.category === "component")
                    score += 5;
                if (entry.category === "action" || entry.category === "api")
                    score += 4;
                hits.push({ entry, score });
            }
        });
        if (active) {
            const near = neighborFiles(index.causalGraph, active);
            for (const h of hits)
                h.score += proximityBoost(h.entry.file || "", active, near, h.score);
        }
        hits.sort((a, b) => b.score - a.score);
        if (hits.length === 0) {
            const emptyResult = `ZERO_MATCH: "${query}" in .atlas-index.json.${grepHint(query)}`;
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
    }
    catch (err) {
        return { content: `❌ Error querying atlas index: ${err.message}`, isError: true };
    }
}
// 2. Tool: fullstack_locate_visual
function locateVisualImpl(query, projectRoot) {
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
        const hits = [];
        const qNorm = q.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
        (index.entries || []).forEach((entry) => {
            const isVisual = visualCategories.has(entry.category);
            const sym = (entry.symbol || "").toLowerCase();
            const symNorm = sym.replace(/[.,:;!?'"`\-_/\\()]/g, "").trim();
            const meta = (entry.meta || "").toLowerCase();
            const file = (entry.file || "").toLowerCase();
            let score = 0;
            if (sym === q || (qNorm && symNorm === qNorm))
                score = 100;
            else if (sym.startsWith(q) || (qNorm && symNorm.startsWith(qNorm)))
                score = 85;
            else if (sym.includes(q) || (qNorm && symNorm.includes(qNorm)))
                score = 70;
            else if (qNorm && qNorm.length >= 3 && symNorm.includes(qNorm))
                score = 60;
            else if (meta.includes(q))
                score = 50;
            else if (file.includes(q))
                score = 30;
            if (score > 0) {
                if (isVisual)
                    score += 25;
                hits.push({ entry, score });
            }
        });
        hits.sort((a, b) => b.score - a.score);
        if (hits.length === 0) {
            const notFoundMsg = `⚡ [VISUAL LOCATOR] No visual elements matching "${query}". Check docs/frontend-atlas/02_COMPONENT_INVENTORY.md.`;
            visualLruCache.set(cacheKey, notFoundMsg);
            return { content: notFoundMsg, isError: false };
        }
        const lines = [`🎯 [VISUAL LOCATOR] Found ${hits.length} visual element(s) for "${query}":\n`];
        hits.slice(0, 10).forEach(h => {
            const e = h.entry;
            const metaStr = e.meta ? ` [${e.meta}]` : "";
            lines.push(`   - [${(e.category || "").toUpperCase()}] ${e.file}:${e.line} ➔ ${e.symbol}${metaStr}`);
            lines.push(`     📖 Atlas: ${e.atlasRef}`);
        });
        const outputResult = lines.join("\n");
        visualLruCache.set(cacheKey, outputResult);
        return { content: outputResult, isError: false };
    }
    catch (err) {
        return { content: `❌ Error querying visual locator: ${err.message}`, isError: true };
    }
}
// 3. Tool: fullstack_resolve
export function toolResolve(name, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    const qRaw = (name || "").trim();
    if (!qRaw)
        return { content: "❌ Name parameter cannot be empty.", isError: true };
    const normalizedQuery = qRaw.replace(/\\/g, "/");
    const strippedPrefix = normalizedQuery.replace(/^(\.\/)?(src\/|app\/)?/, "");
    const baseOnlyQuery = path.basename(normalizedQuery);
    const cleanQ = baseOnlyQuery.toLowerCase().replace(/[-_.]/g, "").replace(/\.(tsx|jsx|ts|js|vue|svelte|astro|css)$/, "");
    const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
    const cachedIndex = getCachedAtlasIndex(indexPath);
    let allFiles = [];
    if (cachedIndex && cachedIndex.files && cachedIndex.files.length > 0) {
        allFiles = cachedIndex.files.map(f => path.resolve(root, f));
    }
    else {
        getFilesRecursively(root, allFiles);
    }
    const matches = [];
    for (const f of allFiles) {
        const rel = path.relative(root, f).replace(/\\/g, "/");
        const basename = path.basename(f);
        const cleanBase = basename.toLowerCase().replace(/[-_.]/g, "").replace(/\.(tsx|jsx|ts|js|vue|svelte|astro|css)$/, "");
        if (rel.toLowerCase() === normalizedQuery.toLowerCase() || rel.toLowerCase() === strippedPrefix.toLowerCase()) {
            matches.push({ path: f, relPath: rel, score: 100 });
        }
        else if (basename.toLowerCase() === baseOnlyQuery.toLowerCase() || basename === baseOnlyQuery) {
            matches.push({ path: f, relPath: rel, score: 95 });
        }
        else if (cleanBase === cleanQ) {
            matches.push({ path: f, relPath: rel, score: 90 });
        }
        else if (cleanBase.includes(cleanQ)) {
            matches.push({ path: f, relPath: rel, score: 70 });
        }
        else if (rel.toLowerCase().includes(strippedPrefix.toLowerCase())) {
            matches.push({ path: f, relPath: rel, score: 60 });
        }
        else if (rel.toLowerCase().includes(baseOnlyQuery.toLowerCase())) {
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
// 11. Tool: fullstack_impact
export function toolImpact(symbol, projectRoot, depth = 3) {
    if (!symbol || !symbol.trim())
        return { content: "❌ 'symbol' parameter is required.", isError: true };
    const maxDepth = Math.min(6, Math.max(1, Math.floor(Number(depth)) || 3));
    return withFreshness(projectRoot, () => {
        const root = resolveProjectRoot(projectRoot);
        const idx = getCachedAtlasIndex(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"));
        if (!idx)
            return { content: `❌ [Atlas Not Found] Call "fullstack_audit" first.`, isError: false };
        const entries = idx.data.entries || [];
        const entryLoc = (e) => `${e.file}:${e.line} [${(e.category || "").toUpperCase()}] ${e.symbol}`;
        const g = idx.data.causalGraph;
        const cands = g ? findNodes(g, symbol) : [];
        const start = cands[0];
        if (!g || !start) {
            const q = symbol.toLowerCase().trim();
            const sym = (e) => (e.symbol || "").toLowerCase();
            const hits = entries.filter(e => sym(e) === q).concat(entries.filter(e => sym(e) !== q && sym(e).includes(q))).slice(0, 15);
            if (!hits.length)
                return { content: `ZERO_MATCH: "${symbol}" has no graph node or atlas entry.${grepHint(symbol)}`, isError: false };
            return { content: `Graph had no edges for "${symbol}"; file-level matches only:\n${hits.map(entryLoc).join("\n")}`, isError: false };
        }
        const { items, truncated } = dependentsOf(g, start.id, maxDepth, 60);
        const loc = (n) => {
            const e = n.source ? null : entries.find(x => x.symbol === (n.label || n.id));
            return `${n.source || e?.file || "unknown"}:${n.line || e?.line || 1}`;
        };
        const out = [`Impact of ${start.label || start.id} [${start.type}] ${loc(start)}`];
        if (cands.length > 1)
            out.push(`(ambiguous: picked "${start.id}" of ${cands.length}: ${cands.slice(0, 5).map(c => c.id).join(", ")})`);
        for (let d = 1; d <= maxDepth; d++) {
            const lvl = items.filter(i => i.depth === d);
            if (!lvl.length)
                continue;
            out.push(`d${d}:`);
            for (const i of lvl)
                out.push(`${loc(i.node)} [${i.node.type}] ${i.node.label || i.node.id} (${i.via})`);
        }
        const files = new Set(items.map(i => loc(i.node).replace(/:\d+$/, "")));
        out.push(items.length ? `${items.length} dependents across ${files.size} files${truncated ? " (truncated at 60)" : ""}` : "0 dependents (nothing in the graph depends on this)");
        return { content: out.join("\n"), isError: false };
    });
}
// 12. Tool: fullstack_component
export function toolComponent(name, projectRoot) {
    if (!name || !name.trim())
        return { content: "❌ 'name' parameter is required.", isError: true };
    return withFreshness(projectRoot, () => {
        const root = resolveProjectRoot(projectRoot);
        const idx = getCachedAtlasIndex(path.join(root, "docs", "frontend-atlas", ".atlas-index.json"));
        if (!idx)
            return { content: `❌ [Atlas Not Found] Call "fullstack_audit" first.`, isError: false };
        const q = name.toLowerCase().trim();
        const pick = (list, nm) => {
            const exact = list.filter(x => nm(x).toLowerCase() === q);
            if (exact.length)
                return exact;
            const pre = list.filter(x => nm(x).toLowerCase().startsWith(q));
            return pre.concat(list.filter(x => !pre.includes(x) && nm(x).toLowerCase().includes(q))).slice(0, 5);
        };
        const comps = idx.data.components;
        if (!comps) {
            const hits = pick((idx.data.entries || []).filter(e => e.category === "component"), e => e.symbol);
            const head = "Component props are not indexed: re-run the audit (fullstack_audit) to index component props.";
            if (!hits.length)
                return { content: `ZERO_MATCH: no component "${name}". ${head}`, isError: false };
            return { content: `${head}\n${hits.map(e => `${e.file}:${e.line} [EXISTS] ${e.symbol}`).join("\n")}`, isError: false };
        }
        const hits = pick(comps, c => c.name);
        if (!hits.length)
            return { content: `ZERO_MATCH: no component "${name}" in the atlas.${grepHint(name)}`, isError: false };
        const out = hits.map(c => {
            const lines = [`${c.file}:${c.line} [EXISTS] ${c.name}`];
            lines.push(`  props: ${c.props.length ? c.props.map(p => `${p.name}${p.optional ? "?" : ""}${p.type ? `: ${p.type}` : ""}`).join(", ") : "(none)"}`);
            for (const [grp, vals] of Object.entries(c.variants || {}))
                lines.push(`  variant ${grp}: ${vals.join(" | ")}`);
            lines.push(`  used in ${c.usageCount} file(s)`);
            return lines.join("\n");
        });
        return { content: out.join("\n"), isError: false };
    });
}
// 4. Tool: fullstack_path
export function toolCausalPath(from, to, projectRoot) {
    return withFreshness(projectRoot, () => causalPathImpl(from, to, projectRoot), true);
}
function causalPathImpl(from, to, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    if (!from || !to)
        return { content: "❌ Both 'from' and 'to' parameters are required.", isError: true };
    const fromQ = from.toLowerCase().trim();
    const toQ = to.toLowerCase().trim();
    const cacheKey = `path:${root}:${fromQ}:${toQ}`;
    const cached = pathLruCache.get(cacheKey);
    if (cached !== undefined) {
        return { content: cached, isError: false };
    }
    let nodes = [];
    let links = [];
    // 1. Fast-Path A: Pre-computed causalGraph from .atlas-index.json (in-memory graph)
    const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
    if (fs.existsSync(indexPath)) {
        try {
            const raw = fs.readFileSync(indexPath, "utf-8");
            const index = JSON.parse(raw);
            if (index.causalGraph && Array.isArray(index.causalGraph.nodes) && index.causalGraph.nodes.length > 0) {
                nodes = index.causalGraph.nodes;
                links = index.causalGraph.links || [];
            }
        }
        catch { }
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
            }
            catch { }
        }
    }
    // 3. Fallback: Parse docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md
    if (nodes.length === 0) {
        const crossRef = path.join(root, "docs", "backend-atlas", "06_FULLSTACK_CROSS_REFERENCE_MAP.md");
        if (fs.existsSync(crossRef)) {
            try {
                const fileLines = fs.readFileSync(crossRef, "utf-8").split("\n");
                const nodeSet = new Set();
                const addN = (id, type) => {
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
                        if (ui && ui !== "-")
                            addN(ui, "component");
                        if (api && api !== "-")
                            addN(api, "api_endpoint");
                        if (db && db !== "-")
                            addN(db, "db_model");
                        if (ui && api && ui !== "-" && api !== "-")
                            links.push({ source: ui, target: api, type: "calls" });
                        if (api && db && api !== "-" && db !== "-")
                            links.push({ source: api, target: db, type: "mutates" });
                    }
                });
            }
            catch { }
        }
    }
    if (nodes.length === 0) {
        return {
            content: `❌ No graph data or cross-reference map found in ${root}. Run "fullstack_audit" first.`,
            isError: false,
        };
    }
    const g = { nodes, links };
    const startNode = findNodes(g, fromQ)[0];
    const endNode = findNodes(g, toQ)[0];
    if (!startNode)
        return { content: `❌ Start node matching "${from}" not found.`, isError: false };
    if (!endNode)
        return { content: `❌ Target node matching "${to}" not found.`, isError: false };
    const found = shortestPath(g, startNode.id, endNode.id, 8);
    if (!found) {
        const noPathMsg = `❌ No causal dependency path found between "${from}" and "${to}" (max 8 hops).`;
        pathLruCache.set(cacheKey, noPathMsg);
        return { content: noPathMsg, isError: false };
    }
    const foundPath = found.ids;
    const steps = foundPath.map((nodeId, idx) => {
        const typeLabel = (nodes.find(n => n.id === nodeId)?.type || "unknown").toUpperCase();
        return `   ${idx + 1}. [${typeLabel}] ${nodeId}${idx > 0 ? ` (via ${found.types[idx - 1]})` : ""}`;
    });
    const locs = foundPath.map(id => nodes.find(n => n.id === id)).filter(n => n && n.source)
        .map(n => `${n.source}:${n.line || 1} [${(n.type || "unknown").toUpperCase()}] ${n.label || n.id}`);
    const outputResult = `⚡ [CAUSAL PATH]\n${foundPath.map((id, i) => (i ? `-${found.types[i - 1]}-> ` : "") + id).join(" ")}\n\nSteps:\n${steps.join("\n")}${locs.length ? `\n\nLocations:\n${locs.join("\n")}` : ""}`;
    pathLruCache.set(cacheKey, outputResult);
    return {
        content: outputResult,
        isError: false,
    };
}
// 5. Tool: fullstack_symbol
export function toolSymbolSlices(symbolName, projectRoot) {
    return withFreshness(projectRoot, () => symbolSlicesImpl(symbolName, projectRoot));
}
function symbolSlicesImpl(symbolName, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    if (!symbolName)
        return { content: "❌ Symbol parameter cannot be empty.", isError: true };
    const q = symbolName.toLowerCase().trim();
    const indexPath = path.join(root, "docs", "frontend-atlas", ".atlas-index.json");
    const cachedIndex = getCachedAtlasIndex(indexPath);
    // Fast-Path: In-memory pre-indexed slices and symbols (<0.1ms)
    if (cachedIndex && cachedIndex.data && Array.isArray(cachedIndex.data.entries)) {
        const preHits = cachedIndex.data.entries.filter(e => (e.category === "slice" || e.category === "symbol" || e.category === "action") &&
            (e.symbol.toLowerCase().includes(q) || (e.meta && e.meta.toLowerCase().includes(q))));
        if (preHits.length > 0) {
            const out = [`⚡ [GOD-FILE SLICER] Found ${preHits.length} slice(s) matching "${symbolName}":\n`];
            preHits.forEach(h => {
                out.push(`${h.file}:${h.line} [${h.meta || h.category}] -> ${h.symbol}`);
            });
            out.push(`\n💡 Target lines above with read_file(StartLine, EndLine) for sub-second precision.`);
            return { content: out.join("\n"), isError: false };
        }
    }
    let allFiles = [];
    if (cachedIndex && cachedIndex.files && cachedIndex.files.length > 0) {
        allFiles = cachedIndex.files.map(f => path.resolve(root, f));
    }
    else {
        getFilesRecursively(root, allFiles);
    }
    const targetFiles = allFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f));
    const escapedSym = escapeRegex(symbolName);
    const hits = [];
    for (const f of targetFiles) {
        let content = "";
        try {
            content = fs.readFileSync(f, "utf-8");
        }
        catch {
            continue;
        }
        if (!content.toLowerCase().includes(q))
            continue;
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
                        }
                        else if (ch === "}") {
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
        out.push(`${h.relPath}:${h.startLine} [L${h.startLine}–L${h.endLine} (${h.lineCount} lines)] -> ${h.symbol}`);
    });
    out.push(`\n💡 Tip: Call read_file with StartLine=${hits[0].startLine} and EndLine=${hits[0].endLine} to save context!`);
    return { content: out.join("\n"), isError: false };
}
// 6. Tool: fullstack_patch
function toolSurgicalPatch(filePath, target, replacement, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    if (!filePath)
        return { content: "❌ Target filePath is required.", isError: true };
    if (target === undefined || replacement === undefined)
        return { content: "❌ Both target and replacement strings are required.", isError: true };
    const resolvedRoot = path.resolve(root);
    const fullPath = path.isAbsolute(filePath) ? path.resolve(filePath) : path.resolve(root, filePath);
    if (!isInsideRoot(resolvedRoot, fullPath)) {
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
            if (isCrlf)
                updated = updated.replace(/\n/g, "\r\n");
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
    if (isCrlf)
        updatedContent = updatedContent.replace(/\n/g, "\r\n");
    fs.writeFileSync(fullPath, updatedContent, "utf-8");
    const matchIndex = normalizedFile.indexOf(normalizedTarget);
    const matchedLine = normalizedFile.substring(0, matchIndex).split("\n").length;
    return {
        content: `✅ [PATCH SUCCESS] ${filePath}:${matchedLine}\nTarget: "${target.slice(0, 40).replace(/\n/g, " ")}..." ➔ "${replacement.slice(0, 40).replace(/\n/g, " ")}..."\nStatus: Clean Exit Code 0 (CRLF preserved)`,
        isError: false,
    };
}
// 7. Tool: fullstack_patch_apply (Atomic unified diff)
function toolPatchApply(filePath, patch, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    try {
        const res = applyUnifiedDiff(filePath, patch, root);
        return { content: res.message, isError: false };
    }
    catch (err) {
        return { content: `❌ Unified Diff Patch Failed: ${err.message}`, isError: true };
    }
}
// 8. Tool: fullstack_batch_replace (1-turn mass color and token replacer)
function toolBatchReplace(target, replacement, projectRoot, dryRun, extensions) {
    const root = resolveProjectRoot(projectRoot);
    try {
        const res = batchReplaceTokens(target, replacement, {
            projectRoot: root,
            dryRun,
            fileExtensions: extensions,
        });
        let msg = res.dryRun
            ? `🔍 [BATCH REPLACE DRY-RUN] Would modify ${res.totalFilesModified} file(s) (${res.totalOccurrences} occurrences):\n`
            : `✅ [BATCH REPLACE SUCCESS] Modified ${res.totalFilesModified} file(s) (${res.totalOccurrences} occurrences replaced):\n`;
        for (const r of res.receipts.slice(0, 20)) {
            msg += `- ${r.file}: ${r.occurrences} occurrence(s) at lines [${r.sampleLines.join(", ")}]\n`;
        }
        if (res.receipts.length > 20) {
            msg += `...and ${res.receipts.length - 20} more files.\n`;
        }
        return { content: msg, isError: false };
    }
    catch (err) {
        return { content: `❌ Batch Replace Failed: ${err.message}`, isError: true };
    }
}
// 9. Tool: fullstack_reference (Reference Pattern Cataloger)
function toolReference(query, referenceDir, projectRoot) {
    const root = resolveProjectRoot(projectRoot);
    try {
        const res = catalogReferenceRepos(referenceDir || "docs/cloned-repos", root);
        let msg = `📚 [REFERENCE CODING] Cataloged ${res.reposCataloged} reference repository/repositories in ${res.atlasPath || "docs/reference-atlas/"}:\n\n`;
        for (const s of res.summaries) {
            msg += `### ${s.repoName} (${s.repoPath})\n`;
            msg += `> ${s.description}\n`;
            if (s.toolsAndCommands.length > 0) {
                msg += `**Commands**: ${s.toolsAndCommands.join(", ")}\n`;
            }
            if (s.keyMechanisms.length > 0) {
                msg += `**Mechanisms**:\n` + s.keyMechanisms.map(m => `  • ${m}`).join("\n") + "\n";
            }
            msg += `\n`;
        }
        return { content: msg, isError: false };
    }
    catch (err) {
        return { content: `❌ Reference Cataloging Failed: ${err.message}`, isError: true };
    }
}
// 10. Tool: fullstack_audit
function toolAudit(projectRoot, frontendOnly, backendOnly) {
    findLruCache.clear();
    visualLruCache.clear();
    pathLruCache.clear();
    const root = resolveProjectRoot(projectRoot);
    ensureGitignoreProtection(root); // only when the user asks to write the atlas
    try {
        const auditScript = path.resolve(__dirname, "..", "bin", "audit.js");
        const flags = [];
        if (frontendOnly)
            flags.push("--frontend");
        if (backendOnly)
            flags.push("--backend");
        const res = child_process.spawnSync("node", [auditScript, ...flags], {
            cwd: root,
            encoding: "utf-8",
            maxBuffer: 10 * 1024 * 1024,
        });
        if (res.error) {
            return { content: `❌ Failed to execute fullstack audit: ${res.error.message}`, isError: true };
        }
        // Also run Adaptive Audit and Reference Cataloger
        try {
            runAdaptiveAudit(root);
            catalogReferenceRepos("docs/cloned-repos", root);
        }
        catch { }
        const output = (res.stdout || "") + (res.stderr || "");
        const lastLines = output.split("\n").slice(-15).join("\n");
        return {
            content: `🎉 Fullstack Audit completed in ${root} (Exit code: ${res.status}):\n${lastLines}`,
            isError: res.status !== 0,
        };
    }
    catch (err) {
        return { content: `❌ Audit execution exception: ${err.message}`, isError: true };
    }
}
// MCP Tool Manifests
const TOOL_DEFINITIONS = [
    {
        name: "fullstack_find",
        description: "Look up routes, components, symbols, visible UI labels, React Query keys, API routes and DB models in the pre-built atlas. Returns file:line hits with the code at the top hits inlined, so you often need no Read. For an exact, unique string (a label or name you can quote), Grep/rg is just as good; the atlas pays off for structure and connections (fullstack_path, fullstack_impact). Hits tagged [STALE] or a ZERO_MATCH mean: search the live code with Grep/rg.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query (e.g. 'theme-toggle', 'login', 'UserProfile', 'useAuth')" },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." },
                compact: { type: "boolean", description: "Whether to return compact single-line outputs (default: true)." },
                activeFile: { type: "string", description: "Optional file you are editing (project-relative or absolute). Hits in it, its import-graph neighbours and its directory rank higher." }
            },
            required: ["query"]
        }
    },
    {
        name: "fullstack_locate_visual",
        description: "Find UI elements by how they look rather than by name: live pulse dots (animate-pulse), capsule pills (rounded-full), status badges and action icons. Use it when the user describes an element visually (e.g. 'the green dot in the navbar').",
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
        description: "Resolve a loosely written component or file name (any casing, kebab or Pascal case, no folder prefix) to real file paths from the atlas file list. Use it when you know roughly what a file is called but not where it lives.",
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
        description: "Trace how a UI element connects to the backend: component -> server action or API route -> DB model. Use it for 'what happens when I click X' or 'what calls this model' questions that span several files.",
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
        name: "fullstack_impact",
        description: "Blast radius: what depends on a symbol, so what could break if you change it. Walks the causal graph in reverse (callers, importers, users) up to 'depth' hops and lists dependents grouped by depth with file:line. Use it before renaming, changing a signature, or editing a model/action.",
        inputSchema: {
            type: "object",
            properties: {
                symbol: { type: "string", description: "Component, action, API route or model name (e.g. 'createSubscription', 'UserModel')" },
                depth: { type: "number", description: "Max hops to walk (default 3, max 6)." },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            },
            required: ["symbol"]
        }
    },
    {
        name: "fullstack_component",
        description: "Look up a component's props, cva variants and usage count. Call it BEFORE building a new component: an [EXISTS] hit means a similar one is already there and should be reused or extended.",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Component name (exact, prefix or substring, e.g. 'Button', 'Modal')" },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            },
            required: ["name"]
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
        name: "fullstack_patch_apply",
        description: "Apply a standard unified diff (@@ hunks) to one file. Context lines must match (a +/-15 line drift is tolerated); if any hunk does not match, the file is left unchanged and an error is returned. Writes files.",
        inputSchema: {
            type: "object",
            properties: {
                filePath: { type: "string", description: "Target file path to patch." },
                patch: { type: "string", description: "Unified diff text with @@ -start,count +start,count @@ headers. Markdown code fences are auto-stripped." },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            },
            required: ["filePath", "patch"]
        }
    },
    {
        name: "fullstack_batch_replace",
        description: "Replace an exact string (a hex color, Tailwind class, token or identifier) in every matching project file in one call. Run with dryRun: true first to see which files change. Writes files.",
        inputSchema: {
            type: "object",
            properties: {
                target: { type: "string", description: "Target token, class name, hex color, or string to replace." },
                replacement: { type: "string", description: "New replacement string." },
                dryRun: { type: "boolean", description: "If true, simulates replacement and returns preview receipts without modifying files." },
                extensions: { type: "array", items: { type: "string" }, description: "Optional array of file extensions to target (e.g. ['.tsx', '.css'])." },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            },
            required: ["target", "replacement"]
        }
    },
    {
        name: "fullstack_reference",
        description: "Look up implementation patterns in reference repositories the user cloned into docs/cloned-repos/. Use it only when the user asks how a reference project solved something.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Optional query or topic to look up across reference architectures." },
                referenceDir: { type: "string", description: "Directory containing cloned reference repositories (defaults to 'docs/cloned-repos')." },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            }
        }
    },
    {
        name: "fullstack_check",
        description: "Run this BEFORE you say a UI or backend task is done. Checks the changed files (git diff + new files, or the list you pass) for unfinished work: on* handlers that point at undefined functions or have empty bodies, new components that nothing imports, DB-writing server actions / API routes with no auth check. BLOCK = fix before finishing; WARN = review. Not a search tool.",
        inputSchema: {
            type: "object",
            properties: {
                files: { type: "array", items: { type: "string" }, description: "Optional files to check (project-relative or absolute). Default: every changed source file in the working tree." },
                staged: { type: "boolean", description: "Check only staged files (pre-commit view)." },
                projectRoot: { type: "string", description: "Optional project root directory path. Defaults to active workspace." }
            }
        }
    },
    {
        name: "fullstack_audit",
        description: "Rebuild the atlas from the current code into docs/frontend-atlas/, docs/backend-atlas/ and docs/adaptive-atlas/, and add those folders to an existing .gitignore. Writes files. Use it after adding routes, pages or models, or when lookups look stale.",
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
    let clientUsesHeaders = false;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    const sendResponse = (id, result) => {
        const payload = JSON.stringify({ jsonrpc: "2.0", id, result });
        if (clientUsesHeaders) {
            const len = Buffer.byteLength(payload, "utf-8");
            process.stdout.write(`Content-Length: ${len}\r\n\r\n${payload}`);
        }
        else {
            process.stdout.write(payload + "\n");
        }
    };
    const sendError = (id, code, message, data) => {
        const payload = JSON.stringify({ jsonrpc: "2.0", id, error: { code, message, data } });
        if (clientUsesHeaders) {
            const len = Buffer.byteLength(payload, "utf-8");
            process.stdout.write(`Content-Length: ${len}\r\n\r\n${payload}`);
        }
        else {
            process.stdout.write(payload + "\n");
        }
    };
    rl.on("line", (line) => {
        const trimmed = line.trim();
        if (!trimmed)
            return;
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
                let result = { content: "Unknown tool", isError: true };
                switch (toolName) {
                    case "fullstack_find":
                        result = toolFind(args.query, args.projectRoot, args.compact ?? true, args.activeFile);
                        break;
                    case "fullstack_impact":
                        result = toolImpact(args.symbol, args.projectRoot, args.depth);
                        break;
                    case "fullstack_component":
                        result = toolComponent(args.name, args.projectRoot);
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
                    case "fullstack_patch_apply":
                        result = toolPatchApply(args.filePath, args.patch, args.projectRoot);
                        break;
                    case "fullstack_batch_replace":
                        result = toolBatchReplace(args.target, args.replacement, args.projectRoot, args.dryRun, args.extensions);
                        break;
                    case "fullstack_reference":
                        result = toolReference(args.query, args.referenceDir, args.projectRoot);
                        break;
                    case "fullstack_audit":
                        result = toolAudit(args.projectRoot, args.frontendOnly, args.backendOnly);
                        break;
                    case "fullstack_check":
                        // Lazy import: keeps the TypeScript parser out of server start-up and CLI fast paths.
                        import("./check.js")
                            .then(m => {
                            const r = m.runCheck(path.resolve(args.projectRoot || process.cwd()), { files: args.files, staged: args.staged });
                            sendResponse(id, { content: [{ type: "text", text: m.formatReport(r) }], isError: false });
                        })
                            .catch((err) => sendResponse(id, { content: [{ type: "text", text: `fullstack-check failed: ${err?.message || err}` }], isError: true }));
                        return;
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
        }
        catch (err) {
            logDebug(`Parse error on line: ${err.message}`);
            sendError(null, -32700, "Parse error");
        }
    });
    rl.on("close", () => {
        logDebug("MCP Server stdio stream closed. Exiting process.");
        process.exit(0);
    });
}
