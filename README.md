# Fullstack Audit

> **Universal Architecture Engine & Native MCP Companion for AI Coding Assistants**  
> Sub-3ms deterministic codebase navigation for Antigravity, Cursor, Claude Code, Windsurf, OpenCode, Codex, and Hermes.  
> Automatically indexes Next.js, React, Nuxt, SvelteKit, Astro, Remix, and backend APIs into zero-grep in-memory atlases.

[![Version](https://img.shields.io/badge/version-2.16.0-blue.svg)](https://github.com/Eurie92/fullstack-audit-skill/releases)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Flight Test Benchmark](https://img.shields.io/badge/flight%20test-1%2C000%20tests%20(1.08ms)-brightgreen.svg)](docs/BENCHMARK_1000_FLIGHT_REPORT.md)
[![MCP Protocol](https://img.shields.io/badge/protocol-Model%20Context%20Protocol%20(MCP)-purple.svg)](https://modelcontextprotocol.io/)
[![Zero Config](https://img.shields.io/badge/config-zero%20config-blue.svg)](https://github.com/Eurie92/fullstack-audit-skill)

[Master Usage Guide](docs/MASTER_USAGE_GUIDE.md) | [How It Works](docs/HOW_IT_WORKS.md) | [1,000-Run Flight Test Report](docs/BENCHMARK_1000_FLIGHT_REPORT.md) | [500-Run Benchmark Report](docs/BENCHMARK_500_XNIGHT_REPORT.md) | [Changelog](CHANGELOG.md)

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

Wait ~300ms for the scan to complete.

---

### Step 3: That's It! (Always Active & Always Enabled)

> [!IMPORTANT]
> **Always-On Architecture Plugin (Not a One-Time Audit Tool)**  
> Fullstack Audit is **NOT a passive linter or a one-off audit report** that you have to run manually whenever you want answers.  
> It is an **Always-On Fullstack GPS & Code Navigation Plugin** powered by an in-memory Model Context Protocol (MCP) daemon.  
> * **Run `/fullstack-audit` ONCE** on project setup to compile the in-memory architecture index into `docs/`.  
> * **After that, the plugin is perpetually active and enabled.**  
> * You do **NOT** need to type commands or re-run audits during daily coding. Whenever you prompt your AI assistant (*"Where is the checkout button?"*, *"Change button to emerald"*, *"Trace order flow"*), your assistant automatically calls the native MCP tools in sub-3ms under the hood.  
> * **Why is it so fast?** The AI navigates an in-memory inverted hash map rather than scanning disk files with slow recursive greps or burning hundreds of thousands of tokens!

Once generated, your AI coding assistant handles everything autonomously:

* **Daily coding & bugfixes (Micro-Edits)**: Zero re-audits needed. Your AI assistant navigates existing code in sub-3ms and applies surgical tweaks in 1-2s.
* **Major milestones (Big Features)**: Only when adding brand-new routes, pages, or database models, run `/fullstack-audit` (or ask your AI to refresh the atlas) once the feature is complete.
* **Clean Git Repository (.gitignore Protection)**: All generated atlases (`docs/frontend-atlas/`, `docs/backend-atlas/`, `docs/llms.txt`) are automatically added to `.gitignore`. They stay 100% local for AI navigation and never pollute your Git commits or pull requests.
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

When AI coding assistants attempt to locate UI elements, API routes, or database schemas using recursive search (`grep -r` or `Get-ChildItem -Recurse`), they:
1. Waste **100,000+ context tokens** reading compiled directories (`.next/`, `node_modules/`).
2. Trigger **15–30 second Windows Defender AMSI process creation freezes**.
3. Hallucinate component paths and over-investigate parent layouts.

**Fullstack Audit replaces brute-force grep with an in-memory AST index:**
* **Sub-Millisecond Retrieval**: Queries run against the index in **0.43ms (median)**.
* **Zero Project Clutter**: Generated documentation is stored exclusively in `docs/frontend-atlas/` and `docs/backend-atlas/`. Zero files are dumped into your project root.
* **Fully Autonomous**: You prompt normally in chat (*"Where is the checkout button?"*). The AI invokes native MCP tools to locate exact line bounds in milliseconds.

---

## How It Works (Just Ask Your AI)

Once installed, **you do not need to run manual terminal commands during daily work**. Your AI assistant invokes Fullstack Audit tools under the hood:

* *"Where is the checkout button?"* -> `fullstack_find` locates the symbol in sub-3ms.
* *"Trace what happens when clicking Place Order"* -> `fullstack_path` maps `Button -> Action -> DB Model` in sub-5ms.
* *"Find the green pulse dot in the navbar"* -> `fullstack_locate_visual` pinpoints `animate-pulse` in 0ms.
* *"Review and patch lines 40-50 in store.tsx"* -> `fullstack_symbol` & `fullstack_patch` apply surgical edits with zero CRLF issues.

---

## The 7 Native MCP Tools

| Tool | Functionality | Example AI Prompt | Speed |
| :--- | :--- | :--- | :---: |
| **`fullstack_find`** | Instant inverted index search across symbols, components, routes, and queries. | *"Find the checkout modal"* or *"Where is user query defined?"* | **Sub-3ms** |
| **`fullstack_locate_visual`** | 0ms visual locator for live status dots, capsule pills, action icons, and badges. | *"Where is the green pulse dot?"* or *"Locate the cart icon"* | **0ms** |
| **`fullstack_resolve`** | Prefix-agnostic fuzzy file resolver (`connect-modal` -> `ConnectModal.tsx`). | Resolves exact paths without directory guessing | **0ms** |
| **`fullstack_path`** | Causal execution path tracer (`UI Component -> API Route -> DB Model`). | *"Trace what happens when clicking Place Order"* | **Sub-5ms** |
| **`fullstack_symbol`** | Retrieves exact start & end line numbers for functions inside God-files (>500 lines). | Slices just lines 140–185 instead of burning tokens on the whole file | **Sub-1ms** |
| **`fullstack_patch`** | Surgical CRLF-safe string replacer immune to PowerShell escaping & `&` crashes. | Replaces code blocks cleanly without touching surrounding lines | **Sub-2ms** |
| **`fullstack_audit`** | Refreshes and updates the entire architecture atlas in `docs/`. | Updates architecture maps after adding new routes or schema tables | **~300ms** |

---

## Fast CLI Utilities & Hybrid Code RAG

* **`npx fullstack-audit --rag "<query>"`**: Hybrid Code RAG combining BM25, sub-word tokenization, domain synonyms, and 1-hop causal bundle retrieval in <1.5ms.
* **`npx fullstack-audit --doctor`**: Automated health check verifying Node.js, MCP daemon, Iron Gate hooks, and 10 IDE harness configurations.
* **`npx fullstack-audit --roi`**: Live developer ROI card tracking tokens, dollar savings, and AMSI Defender latency saved.
* **`npx fullstack-audit --setup-all`**: Universal 10-harness setup auto-registering rules and MCP across Cursor, Claude Code, Windsurf, VS Code, Roo, and OpenCode.

---

## Generated Architecture Atlases (`docs/`)

Running Fullstack Audit documents your codebase architecture neatly inside `docs/`:

```text
docs/
|-- frontend-atlas/
|   |-- 01_ROUTES_AND_PANELS_MAP.md         # Route hierarchy, layouts, RSC [Server]/[Client] boundaries
|   |-- 02_COMPONENT_INVENTORY.md           # Triggers, modals, live pulse dots, capsule pills
|   |-- 03_DESIGN_TOKENS_AND_COLORS.md      # Tailwind color matrix & dark mode asymmetries
|   |-- 04_UI_ISLANDS_AND_DRIFT.md          # UI drift analysis & styling consolidation targets
|   |-- 05_DEAD_ORPHANED_COMPONENTS.md      # Unused component audit & safe removal guide
|   |-- 06_VISIBLE_TEXT_AND_LABELS_MAP.md   # Screenshot-to-code text index (buttons, CTAs, headings)
|   |-- 07_VISUAL_AND_ICON_INDEX.md         # Action icon index with interactive context
|   |-- 08_DISPATCH_GATEWAY.md              # Agent triage matrix & tool routing table
|   |-- 09_QUERY_AND_CACHE_MAP.md           # TanStack React Query cache keys & invalidations
|   |-- 10_GOD_FILES_SURGICAL_MAP.md        # AST line slices for monolithic files (>500 lines)
|   |-- 11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md # Risk scoring (0-100) & blast radius tiers
|   `-- 12_TEST_SUITES_AND_COVERAGE_MAP.md  # Test suite index & assertion map
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

## 1,000-Run Empirical Flight Test Benchmark (Live SaaS Codebase Evaluation)

Subjected to a comprehensive 1,000-test empirical flight test against the live production codebase of [xnight.dev](https://xnight.dev/) (500 real path/route/component searches + 500 live frontend code modifications with instant atomic reverts):

| Performance Dimension | Without Plugin (Baseline AI Agent) | With Fullstack Audit Plugin (v2.16.0) | Verified Advantage |
| :--- | :---: | :---: | :---: |
| **Path / Route Locate (p50)** | **347.02 ms** | **1.08 ms** | **322x faster** *(Sub-3ms verified!)* |
| **Real Frontend Tweak Time (p50)** | **60.13 ms** | **5.28 ms** | **11x faster** |
| **Overall Median Latency (p50)** | **64.95 ms** | **2.00 ms** | **32x faster** |
| **90th Percentile (p90)** | **421.62 ms** | **5.77 ms** | **73x faster** |
| **95th Percentile (p95)** | **473.50 ms** | **6.97 ms** | **68x faster** |
| **99th Percentile (p99)** | **725.12 ms** | **7.79 ms** | **93x faster** |
| **Context Tokens Burned (1,000 Runs)** | **~3,155,600 tokens (Est.)** | **~55,000 tokens** | **~98.3% Tokens Saved (~$9.30)** |
| **Patch & Revert Reliability** | **100.0%** | **100.0%** | **Zero Unwanted Diffs** |
| **Child Processes Spawned** | **1,000 Processes** | **0 Processes (In-Memory)** | **Zero Windows Defender / AMSI Lag** |

*Read the complete empirical methodology, findings, and diagnostic traces in [`docs/BENCHMARK_1000_FLIGHT_REPORT.md`](docs/BENCHMARK_1000_FLIGHT_REPORT.md).*

---

## License

Apache-2.0 (c) [Eurie Paulino](https://github.com/Eurie92)
