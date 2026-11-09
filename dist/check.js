/**
 * fullstack-audit --check: find unfinished work in the files an agent (or person) just changed.
 *
 * Scope is the change set, not the whole repo: `git diff HEAD` + untracked files by default,
 * `--staged` for pre-commit, or an explicit file list (the Claude Code Stop hook passes the
 * files the agent edited this session). Same engine behind the CLI, the MCP tool and the hooks,
 * so every harness gets the same answer.
 *
 * Rules (v1, React/TSX/JSX + Next/Express backends):
 *   DEAD_HANDLER       BLOCK  on* handler points at a name not defined or imported in the file
 *   STUB_HANDLER       BLOCK  on* handler (inline or same-file function) has an empty body
 *                      WARN   on* handler only logs / alerts
 *   ORPHAN_COMPONENT   BLOCK  new .tsx/.jsx component that no file imports
 *   UNGUARDED_MUTATION BLOCK  DB-writing server action / mutating API route with no auth call,
 *                             in a project that uses auth and has no middleware (WARN if it has one)
 *
 * Escape hatch: `fullstack-check-ignore` in a comment on the flagged line or the line above.
 */
import fs from "fs";
import path from "path";
import ts from "typescript";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { parseApiRoutes, parseServerActions, AUTH_CALL_RE, DB_WRITE_RE } from "./audit-backend.js";
const SOURCE_RE = /\.(tsx|jsx|ts|js|mjs|cjs)$/i;
const JSX_RE = /\.(tsx|jsx|js)$/i;
const SKIP_DIR_RE = /(^|\/)(node_modules|dist|build|\.next|\.nuxt|\.svelte-kit|\.output|coverage|docs|cloned-repos)\//;
const IGNORE_MARK = "fullstack-check-ignore";
const BROWSER_GLOBALS = new Set(["alert", "confirm", "prompt", "window", "document", "location", "history", "navigator", "localStorage", "sessionStorage", "requestAnimationFrame", "open", "close", "print", "scrollTo"]);
/** Files the router or bundler loads by name, so "nothing imports it" is expected. */
const ENTRY_BASENAME_RE = /^(page|layout|route|loading|error|not-found|template|default|global-error|middleware|proxy|instrumentation|_app|_document|_error|main|index|app|root|entry\..+|.+\.(test|spec|stories|story)|\+.+)$/i;
function git(root, args) {
    const r = spawnSync("git", args, { cwd: root, encoding: "utf-8", shell: false, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
    return !r.error && r.status === 0 ? r.stdout : null;
}
/** Parse `git diff --name-status -z` output (rename/copy entries carry two paths). */
function parseNameStatus(out, into) {
    const parts = out.split("\0").filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
        const st = parts[i];
        if (/^[RC]/.test(st)) {
            into.set(parts[i + 2], false);
            i += 2;
        }
        else {
            into.set(parts[i + 1], st.startsWith("A"));
            i += 1;
        }
    }
}
/** Changed source files, or null when `root` is not a git work tree. */
export function changedFiles(root, staged = false) {
    if (git(root, ["rev-parse", "--is-inside-work-tree"]) === null)
        return null;
    const map = new Map();
    const hasHead = git(root, ["rev-parse", "--verify", "-q", "HEAD"]) !== null;
    if (staged) {
        parseNameStatus(git(root, ["diff", "--cached", "--name-status", "-z", "--diff-filter=ACMR"]) || "", map);
    }
    else {
        if (hasHead)
            parseNameStatus(git(root, ["diff", "HEAD", "--name-status", "-z", "--diff-filter=ACMR"]) || "", map);
        const untracked = git(root, ["ls-files", "--others", "--exclude-standard", "-z"]) || "";
        for (const f of untracked.split("\0").filter(Boolean))
            map.set(f, true);
        if (!hasHead)
            for (const f of (git(root, ["ls-files", "-z"]) || "").split("\0").filter(Boolean))
                map.set(f, true);
    }
    return [...map].filter(([rel]) => SOURCE_RE.test(rel) && !SKIP_DIR_RE.test(rel)).map(([rel, added]) => ({ rel, added }));
}
function ignored(lines, line) {
    return (lines[line - 1] || "").includes(IGNORE_MARK) || (lines[line - 2] || "").includes(IGNORE_MARK);
}
const lineOf = (sf, n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
const isFn = (n) => !!n && (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n));
/** Names a file declares or imports (scope-blind on purpose: fewer false DEAD hits). */
function declaredNames(sf) {
    const names = new Set();
    const fns = new Map();
    const visit = (n) => {
        if (ts.isIdentifier(n)) {
            const p = n.parent;
            if (p && p.name === n && (ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p) ||
                ts.isClassDeclaration(p) || ts.isImportClause(p) || ts.isImportSpecifier(p) || ts.isNamespaceImport(p) || ts.isBindingElement(p) ||
                ts.isEnumDeclaration(p) || ts.isImportEqualsDeclaration(p)))
                names.add(n.text);
        }
        if (ts.isFunctionDeclaration(n) && n.name)
            fns.set(n.name.text, n);
        if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name)) {
            let init = n.initializer;
            // useCallback(() => {}, []) and similar wrappers: look at the first function argument
            if (init && ts.isCallExpression(init))
                init = init.arguments.find(isFn);
            if (isFn(init))
                fns.set(n.name.text, init);
        }
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return { names, fns };
}
const isKnown = (name, names) => names.has(name) || BROWSER_GLOBALS.has(name) || name in globalThis;
/** "empty" | "log-only" | null for a handler function body. */
function stubKind(fn) {
    const body = fn.body;
    if (!body)
        return null;
    if (!ts.isBlock(body))
        return null; // concise arrow: `() => doThing()` has a real expression
    if (body.statements.length === 0)
        return "empty";
    const logOnly = body.statements.every(st => ts.isExpressionStatement(st) && ts.isCallExpression(st.expression) && ((ts.isPropertyAccessExpression(st.expression.expression) && st.expression.expression.expression.getText() === "console") ||
        (ts.isIdentifier(st.expression.expression) && st.expression.expression.text === "alert")));
    return logOnly ? "log-only" : null;
}
function checkHandlers(rel, content) {
    const out = [];
    const sf = ts.createSourceFile(rel, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lines = content.split(/\r?\n/);
    const { names, fns } = declaredNames(sf);
    const add = (severity, rule, n, message) => {
        const line = lineOf(sf, n);
        if (!ignored(lines, line))
            out.push({ severity, rule, file: rel, line, message });
    };
    const stub = (attr, fn, at, label) => {
        const k = stubKind(fn);
        if (k === "empty")
            add("BLOCK", "STUB_HANDLER", at, `${attr}: ${label} has an empty body (not wired up)`);
        else if (k === "log-only")
            add("WARN", "STUB_HANDLER", at, `${attr}: ${label} only logs or alerts (placeholder?)`);
    };
    const visit = (n) => {
        if (ts.isJsxAttribute(n) && /^on[A-Z]/.test(n.name.getText(sf)) && n.initializer && ts.isJsxExpression(n.initializer) && n.initializer.expression) {
            const attr = n.name.getText(sf);
            const e = n.initializer.expression;
            if (ts.isIdentifier(e)) {
                if (!isKnown(e.text, names))
                    add("BLOCK", "DEAD_HANDLER", n, `${attr}={${e.text}}: ${e.text} is not defined or imported in this file`);
                else if (fns.has(e.text))
                    stub(attr, fns.get(e.text), n, `handler ${e.text}`);
            }
            else if (isFn(e)) {
                stub(attr, e, n, "inline handler");
                const calls = (m) => {
                    if (ts.isCallExpression(m) && ts.isIdentifier(m.expression) && !isKnown(m.expression.text, names)) {
                        add("BLOCK", "DEAD_HANDLER", m, `${attr}: calls ${m.expression.text}() which is not defined or imported in this file`);
                    }
                    ts.forEachChild(m, calls);
                };
                calls(e.body);
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(sf);
    return out;
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** New component file that no other source file imports. */
function checkOrphan(root, rel) {
    if (!/\.(tsx|jsx)$/i.test(rel) || /(^|\/)(pages|routes)\//.test(rel))
        return null;
    const base = path.posix.basename(rel).replace(/\.(tsx|jsx)$/i, "");
    if (ENTRY_BASENAME_RE.test(base))
        return null;
    const hits = git(root, ["grep", "-l", "-F", "--untracked", "-e", base, "--", "*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs", "*.vue", "*.svelte", "*.astro", "*.mdx"]);
    if (hits === null && git(root, ["rev-parse", "--is-inside-work-tree"]) === null)
        return null; // no git: cannot judge
    const spec = new RegExp(`(?:from\\s*|import\\s*\\(\\s*|require\\s*\\(\\s*|import\\s+)["'][^"']*(?:^|[/"'@~])${escapeRe(base)}(?:\\.(?:tsx|jsx|js))?["']`);
    for (const f of (hits || "").split(/\r?\n/).filter(Boolean)) {
        if (f === rel || SKIP_DIR_RE.test(f))
            continue;
        try {
            if (spec.test(fs.readFileSync(path.join(root, f), "utf-8")))
                return null;
        }
        catch { /* unreadable */ }
    }
    return { severity: "BLOCK", rule: "ORPHAN_COMPONENT", file: rel, line: 1, message: `new component ${base} is not imported anywhere (not rendered yet?)` };
}
const AUTH_DEP_RE = /"(next-auth|@auth\/[^"]+|@clerk\/[^"]+|@supabase\/ssr|@supabase\/auth-helpers[^"]*|lucia|better-auth|@kinde-oss\/[^"]+|@workos-inc\/[^"]+|iron-session|passport|jsonwebtoken|firebase-admin)"\s*:/;
const PUBLIC_ROUTE_RE = /webhook|auth|login|logout|sign-?in|sign-?up|register|callback|cron|health|public/i;
function projectAuth(root) {
    let pkg = "";
    try {
        pkg = fs.readFileSync(path.join(root, "package.json"), "utf-8");
    }
    catch { /* none */ }
    const middleware = ["", "src/"].some(d => ["middleware", "proxy"].some(n => ["ts", "js"].some(x => fs.existsSync(path.join(root, `${d}${n}.${x}`)))));
    return { usesAuth: AUTH_DEP_RE.test(pkg), middleware };
}
function checkMutations(root, rel, content, auth) {
    if (!auth.usesAuth || !/\.(tsx?|jsx?|mjs)$/i.test(rel))
        return [];
    const out = [];
    const full = path.join(root, rel);
    const lines = content.split(/\r?\n/);
    const sev = auth.middleware ? "WARN" : "BLOCK";
    const why = auth.middleware ? " (middleware may cover it: confirm)" : "";
    for (const a of parseServerActions([full], root)) {
        if (a.writesDb && !a.hasAuth && !PUBLIC_ROUTE_RE.test(a.name) && !ignored(lines, a.line)) {
            out.push({ severity: sev, rule: "UNGUARDED_MUTATION", file: rel, line: a.line, message: `server action ${a.name} writes to the DB without an auth/session check${why}` });
        }
    }
    if (DB_WRITE_RE.test(content)) {
        for (const ep of parseApiRoutes([full], root)) {
            const mutating = ep.methods.filter(m => ["POST", "PUT", "PATCH", "DELETE", "ALL"].includes(m));
            if (!mutating.length || ep.isProtected || PUBLIC_ROUTE_RE.test(ep.urlPath) || AUTH_CALL_RE.test(content) || ignored(lines, ep.line))
                continue;
            const s = ep.framework.startsWith("Express") ? "WARN" : sev;
            out.push({ severity: s, rule: "UNGUARDED_MUTATION", file: rel, line: ep.line, message: `${mutating.join("/")} ${ep.urlPath} writes to the DB without an auth/session check${s === "WARN" && !why ? " (router-level middleware may cover it: confirm)" : why}` });
        }
    }
    return out;
}
export function runCheck(root, opts = {}) {
    root = path.resolve(root);
    const diff = changedFiles(root, opts.staged);
    let files;
    if (opts.files?.length) {
        const added = new Map((diff || []).map(f => [f.rel, f.added]));
        files = opts.files
            .map(f => path.relative(root, path.resolve(root, f)).replace(/\\/g, "/"))
            .filter(rel => rel && !rel.startsWith("..") && SOURCE_RE.test(rel) && !SKIP_DIR_RE.test(rel))
            .map(rel => ({ rel, added: added.get(rel) ?? false }));
    }
    else if (diff === null) {
        return { findings: [], scanned: [], note: "not a git repository: pass files explicitly (--files a.tsx,b.ts)" };
    }
    else {
        files = diff;
    }
    const auth = projectAuth(root);
    const findings = [];
    const scanned = [];
    for (const f of [...new Map(files.map(x => [x.rel, x])).values()]) {
        let content;
        try {
            content = fs.readFileSync(path.join(root, f.rel), "utf-8");
        }
        catch {
            continue;
        }
        scanned.push(f.rel);
        if (JSX_RE.test(f.rel) && /<\w/.test(content))
            findings.push(...checkHandlers(f.rel, content));
        if (f.added) {
            const o = checkOrphan(root, f.rel);
            if (o)
                findings.push(o);
        }
        findings.push(...checkMutations(root, f.rel, content, auth));
    }
    findings.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "BLOCK" ? -1 : 1) || a.file.localeCompare(b.file) || a.line - b.line);
    return { findings, scanned };
}
export function formatReport(r) {
    if (r.note)
        return `fullstack-check: ${r.note}`;
    if (!r.scanned.length)
        return "fullstack-check: no changed source files to check.";
    const block = r.findings.filter(f => f.severity === "BLOCK").length;
    const warn = r.findings.length - block;
    const head = `fullstack-check: ${r.scanned.length} changed file(s), ${block} BLOCK, ${warn} WARN`;
    if (!r.findings.length)
        return `${head}. Nothing left unfinished.`;
    const body = r.findings.map(f => `${f.severity} ${f.file}:${f.line} [${f.rule}] ${f.message}`).join("\n");
    const tail = block
        ? `Fix every BLOCK before calling the task done. If one is intentional, add a \`// ${IGNORE_MARK}: <reason>\` comment on that line.`
        : "No BLOCK items. Review the WARN items.";
    return `${head}\n${body}\n${tail}`;
}
/** CLI: --check [--staged] [--json] [--files a,b]. Exit 1 only on BLOCK; tool trouble never blocks. */
export function cli(argv, root = process.cwd()) {
    const i = argv.indexOf("--files");
    const files = i !== -1 && argv[i + 1] ? argv[i + 1].split(",").map(s => s.trim()).filter(Boolean) : undefined;
    let r;
    try {
        r = runCheck(root, { staged: argv.includes("--staged"), files });
    }
    catch (e) {
        console.error(`fullstack-check: skipped (${e?.message || e})`);
        return 0;
    }
    console.log(argv.includes("--json") ? JSON.stringify(r, null, 2) : formatReport(r));
    return r.findings.some(f => f.severity === "BLOCK") ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exit(cli(process.argv.slice(2)));
}
