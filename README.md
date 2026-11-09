# Fullstack Audit

> **Universal Architecture Engine & Native MCP Companion for AI Coding Assistants**  
> Structural codebase map for Antigravity, Cursor, Claude Code, Windsurf, OpenCode, Codex, and Hermes.  
> Indexes Next.js, React, Nuxt, SvelteKit, Astro, Remix, and backend APIs into an atlas of routes, components, design tokens, server actions and DB models that your agent queries over MCP, next to its normal search tools.

[![Version](https://img.shields.io/badge/version-2.17.1-blue.svg)](https://github.com/Eurie92/fullstack-audit-skill/releases)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![MCP Protocol](https://img.shields.io/badge/protocol-Model%20Context%20Protocol%20(MCP)-purple.svg)](https://modelcontextprotocol.io/)

[Master Usage Guide](docs/MASTER_USAGE_GUIDE.md) | [How It Works](docs/HOW_IT_WORKS.md) | [Changelog](CHANGELOG.md)

---

## Getting Started (Step-by-Step)

Follow these 3 simple steps to get started:

### Step 1: Install Fullstack Audit

Choose either of the two fastest methods:

#### Method A: Ask Your AI Agent (Recommended)
Copy and paste this prompt directly into your AI coding assistant (Antigravity, Cursor, Claude Code, Codex, OpenCode):

```text
Install this plugin: https://github.com/Eurie92/fullstack-audit-skill
```

Your AI assistant will automatically clone or register the plugin, configure its native MCP server, and activate the zero-latency architecture rules.

#### Method B: Universal Terminal One-Liner
Run this in your terminal at the root of your project:

**Windows (PowerShell):**
```powershell
iex (irm https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.ps1)
```

**macOS / Linux (Bash):**
```bash
curl -fsSL https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.sh | bash
```

This sets up `.agent/skills/fullstack-audit/` in your project and automatically injects the architecture rules into your workspace `AGENTS.md`.

---

### Step 2: Run First-Time Audit

Right after installing, run this command once in your AI chat to index the codebase into `docs/`:

```text
/fullstack-audit
```

The scan writes the atlas into `docs/`. Re-run it after big changes (new routes, pages or models).

---

### Step 3: That's It! (Always Active & Always Enabled)

> [!IMPORTANT]
> **Always-On Architecture Plugin (Not a One-Time Audit Tool)**  
> Fullstack Audit is **NOT a passive linter or a one-off audit report** that you have to run manually whenever you want answers.  
> It is an **Always-On Fullstack GPS & Code Navigation Plugin** powered by an in-memory Model Context Protocol (MCP) daemon.  
> * **Run `/fullstack-audit` ONCE** on project setup to compile the in-memory architecture index into `docs/`.  
> * **After that, the plugin is perpetually active and enabled.**  
> * You do **NOT** need to type commands during daily coding. When you ask your AI assistant (*"Where is the checkout button?"*, *"Change button to emerald"*, *"Trace order flow"*), it calls the MCP tools, which answer from an index kept in memory.  
> * The atlas is a snapshot. Line numbers drift as code changes, so the agent should still confirm a hit by reading the file, and fall back to normal search (Grep / `rg`) when the atlas has no match.

Once generated, your AI coding assistant handles the rest:

* **Daily coding & bugfixes (Micro-Edits)**: No re-audit needed for small edits.
* **Major milestones (Big Features)**: When adding new routes, pages, or database models, run `/fullstack-audit` (or ask your AI to refresh the atlas) once the feature is complete.
* **Clean Git Repository (.gitignore Protection)**: When you run the audit, the generated atlases (`docs/frontend-atlas/`, `docs/backend-atlas/`, `docs/llms.txt`) are added to your existing `.gitignore`, so they stay local and out of commits.
* **Zero Root Clutter**: No files are dumped into your project root. All architecture documentation is cleanly encapsulated inside `docs/`.

---

## Updating Fullstack Audit

To update to the latest engine and rules:

### Windows (PowerShell)
```powershell
iex (irm https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.ps1)
```

### macOS / Linux (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.sh | bash
```

### Or Ask Your AI
```text
Update the fullstack-audit plugin to the latest version.
```

---

## Why Fullstack Audit?

Text search (Grep, `rg`) is great at finding a string. It is weak at structural questions that need several hops:
1. *"Which component renders the green pulse dot on the dashboard?"*: visual elements have no unique name to search for.
2. *"What happens when I click Place Order?"*: the answer spans a button, a server action and a DB model in different files.
3. *"Which hardcoded colors break our design tokens?"*: needs an inventory, not a single match.

Fullstack Audit answers these from a pre-built atlas, through MCP tools that return short `file:line` answers. It adds to your agent's normal search; it does not replace it. Outside research points the same way: Cursor measured a 12.5% average accuracy gain when an index was added **on top of** grep ([source](https://cursor.com/blog/semsearch)).

On Windows it also helps avoid one real trap: `Get-ChildItem -Recurse` on the project root walks `node_modules/` and `.next/` and can freeze for many seconds. An optional hook blocks only that case.

### Where it helps most

| Harness | How much it helps | Why |
|---|---|---|
| **Antigravity** | **Most.** In day-to-day use it is the biggest help here (from use, not yet benchmarked). | The agent tends to search with shell folder walks (`run_command`), which are slow on Windows and can freeze under Defender. The atlas replaces many of those walks with one lookup. |
| **Claude Code** | **Mainly for tracing.** Measured: 92% vs 75% success on page → API → DB questions; no gain on simple "where is X" lookups (see [Benchmarks](#benchmarks)). | Its built-in Grep (ripgrep) is already fast and skips `node_modules`, so for single-string lookups the atlas only adds a step. |
| **Cursor, Windsurf, Codex, OpenCode** | Not measured yet. | Expect the tracing, impact and visual-lookup gains; simple lookups depend on how good the built-in search is. |

Use the atlas for tracing flows, change impact, visual elements and unfamiliar code. Use normal search for simple string lookups.

---

## How It Works (Just Ask Your AI)

Once installed, **you do not need to run manual terminal commands during daily work**. Your AI assistant invokes Fullstack Audit tools under the hood:

* *"Where is the checkout button?"* -> `fullstack_find` returns the matching `file:line`.
* *"Trace what happens when clicking Place Order"* -> `fullstack_path` maps `Button -> Action -> DB Model`.
* *"Find the green pulse dot in the navbar"* -> `fullstack_locate_visual` finds `animate-pulse` elements.
* *"Review and patch lines 40-50 in store.tsx"* -> `fullstack_symbol` & `fullstack_patch` apply surgical edits with zero CRLF issues.

---

## The 10 Native MCP Tools

| Tool | Functionality | Example AI Prompt |
| :--- | :--- | :--- |
| **`fullstack_find`** | Index search across symbols, components, routes, and queries. | *"Find the checkout modal"* or *"Where is user query defined?"* |
| **`fullstack_locate_visual`** | Visual locator for live status dots, capsule pills, action icons, and badges. | *"Where is the green pulse dot?"* or *"Locate the cart icon"* |
| **`fullstack_resolve`** | Fuzzy file resolver (`connect-modal` -> `ConnectModal.tsx`). | Resolves exact paths without directory guessing |
| **`fullstack_path`** | Path tracer (`UI Component -> API Route -> DB Model`). | *"Trace what happens when clicking Place Order"* |
| **`fullstack_symbol`** | Start & end line numbers for functions inside large files. | Read just lines 140–185 instead of the whole file |
| **`fullstack_patch`** | CRLF-safe string replacer that avoids PowerShell escaping problems. | Replaces a code block without touching surrounding lines |
| **`fullstack_patch_apply`** | Unified diff patcher; the file is left unchanged if a hunk does not match. | Applies a standard unified diff |
| **`fullstack_batch_replace`** | Token, color, and string replacer across many files (supports dry run). | *"Swap brand hex `#4f46e5` to `#06b6d4` across all components"* |
| **`fullstack_reference`** | Pattern lookup across reference repos you cloned into `docs/cloned-repos/`. | *"Look up reference patterns for subtitle parsing"* |
| **`fullstack_audit`** | Rebuilds the atlas in `docs/` (frontend, backend, adaptive). Writes files. | Updates architecture maps after adding new routes, schema tables, or extensions |
| **`fullstack_check`** | Unfinished-work gate on changed files: dead or empty `on*` handlers, new components nothing imports, DB writes without an auth check. `BLOCK` / `WARN`. | Called by the agent before it says "done" |

### Unfinished-work gate (`fullstack_check`)

Agents often stop with UI half-wired: a button whose handler is empty or points at nothing, a new component nobody renders, a server action that writes to the DB without checking the user. `fullstack_check` looks only at the change set (`git diff HEAD` + new files, `--staged`, or a file list) and reports `BLOCK` items to fix and `WARN` items to review. One engine, four ways in, so it works in every harness:

| Way in | Harnesses | How |
|---|---|---|
| Rule file | all | `AGENTS.md` / skill text: "call `fullstack_check` before saying done" |
| MCP tool | every MCP harness | `fullstack_check` |
| Stop hook | Claude Code (plugin) | `bin/check-hook.js` checks the files the agent edited this session; on `BLOCK` it exits 2 so the agent keeps working (one forced pass, then it lets the turn end). Opt out: `FULLSTACK_AUDIT_NO_CHECK=1` |
| Git pre-commit | any harness, and people | `npx fullstack-audit --install-precommit` adds `--check --staged` to `.git/hooks/pre-commit` |

CLI: `npx fullstack-audit --check [--staged] [--files a.tsx,b.ts] [--json]` exits 1 only on `BLOCK`; tool errors never block. Silence an intentional case with a `// fullstack-check-ignore: <reason>` comment on the line or the line above.

v1 coverage: React `.tsx/.jsx/.js` handlers; Next.js server actions and App/Pages Router API routes, Express routes (WARN only); DB writes via Prisma, Drizzle and the Supabase query builder. Raw SQL writes and Vue/Svelte handlers are not covered yet. The auth rule runs only when `package.json` lists an auth library, and drops to WARN when `middleware.ts` / `proxy.ts` exists.

> In v2.17.1 the shipped MCP server (`bin/mcp-server.js`) still exposes the first 7 tools; `fullstack_patch_apply`, `fullstack_batch_replace` and `fullstack_reference` are in `scripts/mcp-server.ts` and ship once the build step lands (see the roadmap).

---

## Fast CLI Utilities & Hybrid Code RAG

* **`npx fullstack-audit --adaptive`**: Runs the Adaptive Domain Sniffer for Chrome Extensions, Bots, CLIs, Tailwind v4, 3D Canvas, and Vanilla Web.
* **`npx fullstack-audit --reference [dir]`**: Catalogs open-source reference repos in `docs/cloned-repos/` for pattern lookup.
* **`npx fullstack-audit --patch-apply <file> [--diff-content <diff>]`**: Applies a unified diff atomically with temporary file rollback.
* **`npx fullstack-audit --swap-token <old> --to <new> [--dry-run]`**: 1-turn mass token/color replacer across all files.
* **`npx fullstack-audit --rag "<query>"`**: Hybrid Code RAG combining BM25, sub-word tokenization, domain synonyms, and 1-hop causal bundle retrieval.
* **`npx fullstack-audit --doctor`**: Health check for Node.js, the MCP server, the Iron Gate hook, and IDE harness configs.

> CLI note: each CLI call currently compiles the TypeScript engine at startup (about 2–3 s measured on Windows). Agents should prefer the MCP tools, which stay loaded in memory. A precompiled build is on the roadmap.
* **`npx fullstack-audit --setup-all`**: Universal 10-harness setup auto-registering rules and MCP across Cursor, Claude Code, Windsurf, VS Code, Roo, and OpenCode.

---

## Generated Architecture Atlases (`docs/`)

Running Fullstack Audit documents your codebase architecture neatly inside `docs/`:

```text
docs/
|-- frontend-atlas/                         # Web routes, components, design tokens, query keys, test suites
|-- backend-atlas/                          # APIs, Prisma/Drizzle schemas, server actions, auth guards, webhooks
|-- adaptive-atlas/                         # Auto-discovered non-standard domains (Extensions, Bots, CLIs, 3D)
|   |-- 01_EXTENSION_MANIFEST_MAP.md       # Chrome Extension Manifest v3/v2, workers, content scripts
|   |-- 02_WEBSOCKET_BOT_CATALOG.md         # Realtime dispatchers (@mtcute, ws, socket.io)
|   |-- 03_CLI_PIPELINE_CATALOG.md          # CLI binaries, scripts, FFmpeg pipelines
|   |-- 04_TAILWIND_V4_THEME_CATALOG.md     # Tailwind v4 @theme CSS custom properties
|   |-- 05_3D_CANVAS_CATALOG.md             # Three.js 3D meshes, canvases, render loops
|   `-- 06_VANILLA_WEB_CATALOG.md           # Static HTML, CSS links, unbundled JS
`-- reference-atlas/
    `-- 00_REFERENCE_PATTERNS.md            # Proven patterns and mechanisms from reference repositories
`-- backend-atlas/
    |-- 01_API_ROUTES_AND_ENDPOINTS.md      # HTTP API routes, methods, auth guards
    |-- 02_DATABASE_MODELS_AND_SCHEMA.md    # Prisma, Drizzle, and Raw SQL table models
    |-- 03_SERVER_ACTIONS_AND_MUTATIONS.md  # Server Actions ("use server") and DB mutations
    |-- 04_AUTH_AND_MIDDLEWARE_GUARDS.md    # Middleware matchers & route protection rules
    |-- 05_INTEGRATIONS_AND_WEBHOOKS.md     # Stripe, Resend, Supabase, S3 integrations
    |-- 06_FULLSTACK_CROSS_REFERENCE_MAP.md # Deep bi-directional bridge (UI -> API -> DB)
    `-- 07_ENV_AND_SECRETS_MAP.md           # Client secret leak radar & shadow env audit
```

---

## Optional Synergy: Minimalist Token-Saver Stack

Fullstack Audit works 100% out-of-the-box on its own. For developers who want to push token efficiency, speed, and clean code architecture even further, it seamlessly pairs with these 3 optional plugins:

* **[Ponytail](https://github.com/Eurie92/ponytail-skill)** *(Anti-Overengineering & YAGNI)*: Enforces the shortest working diff. Stops AI assistants from adding bloated abstractions, unasked options, or speculative dependencies.
* **[Caveman](https://github.com/Eurie92/caveman-skill)** *(Zero-Fluff Responses)*: Strips conversational filler, apologies, and chatter from AI outputs, cutting response tokens by 60–75%.
* **[Superpowers](https://github.com/Eurie92/superpowers-plugin)** *(Dual-Speed Verification)*: Provides disciplined test verification and branch completion gates without slowing down everyday micro-edits.

*(These companion plugins are completely modular and optional—use whatever fits your workflow!)*

---

## Benchmarks

Earlier versions (up to v2.17.0) published "1,000-run flight test" tables. Those numbers were not measured with an AI agent: token counts were fixed constants per trial, and some latencies were fixed floors or fixed offsets. They were removed in v2.17.1.

### v2.17.2 A/B benchmark (Claude Code, measured)

24 tasks on a real Next.js SaaS app (pinned commit), Claude Code headless with Sonnet, with and without the plugin, 3 runs each. The run was stopped at 120 of 144 runs. Harness, tasks and raw logs: [`bench/`](bench/) and [`bench/results/full-2.17.2/`](bench/results/full-2.17.2/).

| Task type | Success with | Success without | Median tokens with / without |
|---|---|---|---|
| All | 79% | 77% | 5,168 / 3,526 |
| Trace (UI → API → DB) | **92%** | 75% | 9,604 / 10,165 |
| Locate ("where is X") | 87% | 90% | 5,735 / 2,881 |
| Impact ("what uses X") | 100% | 100% | 4,925 / 5,056 |
| Edit | 40% | 40% | 1,444 / 829 |

What this means: in Claude Code the atlas clearly helps multi-hop tracing, and costs extra on simple lookups because the agent still double-checks with Grep. The edit-task checks are likely too strict (both arms score the same 40%) and are being reviewed. Antigravity has not been benchmarked yet.

Lookup speed: `fullstack-audit --find` takes about 0.13 s from the CLI; MCP lookups take milliseconds because the index stays in memory.

---

## License

Apache-2.0 (c) [Eurie Paulino](https://github.com/Eurie92)
