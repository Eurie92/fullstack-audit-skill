# Fullstack Audit

> **Universal Architecture Engine & Native MCP Companion for AI Coding Assistants**  
> Sub-3ms deterministic codebase navigation for Antigravity, Cursor, Claude Code, Windsurf, OpenCode, Codex, and Hermes.  
> Automatically indexes Next.js, React, Nuxt, SvelteKit, Astro, Remix, and backend APIs into zero-grep in-memory atlases.

[![Version](https://img.shields.io/badge/version-2.15.0-blue.svg)](https://github.com/Eurie92/fullstack-audit-skill/releases)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Benchmark](https://img.shields.io/badge/benchmark-500%2F500%20passed%20(0.35ms)-brightgreen.svg)](docs/BENCHMARK_500_XNIGHT_REPORT.md)
[![MCP Protocol](https://img.shields.io/badge/protocol-Model%20Context%20Protocol%20(MCP)-purple.svg)](https://modelcontextprotocol.io/)
[![Zero Config](https://img.shields.io/badge/config-zero%20config-blue.svg)](https://github.com/Eurie92/fullstack-audit-skill)

[Master Usage Guide](docs/MASTER_USAGE_GUIDE.md) | [How It Works](docs/HOW_IT_WORKS.md) | [500-Run Benchmark Report](docs/BENCHMARK_500_XNIGHT_REPORT.md) | [Changelog](CHANGELOG.md)

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

### Step 3: That's It! (Zero Maintenance)

Once generated, your AI coding assistant handles everything autonomously:

* **Daily coding & bugfixes (Micro-Edits)**: No re-audits needed. Your AI assistant navigates existing code in sub-3ms and applies edits in 1-2s.
* **Major milestones (Big Features)**: When adding brand-new routes, pages, or database models, run `/fullstack-audit` (or ask your AI to refresh the atlas) once the feature is complete.
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

## Empirical Benchmark (500-Run Live SaaS Codebase Evaluation)

Evaluated against 500 real-world queries on the `xnight` production codebase across Frontend & Backend:

| Metric | Vanilla AI Agent (File Grep) | Old Skill CLI | Fullstack Audit (Native MCP) | Advantage (Plugin vs Skill) |
| :--- | :---: | :---: | :---: | :--- |
| **Median Latency (p50)** | 44.82 ms | 2,391.53 ms | **0.35 ms** | **6,896x faster** |
| **95th Percentile (p95)** | 583.28 ms | 3,046.55 ms | **3.21 ms** | **950x faster** |
| **99th Percentile (p99)** | 643.41 ms | 3,373.47 ms | **4.72 ms** | **715x faster** |
| **Average Latency (Mean)** | 149.06 ms | 2,458.69 ms | **0.98 ms** | **2,505x faster** |
| **Context Tokens Used** | 154,074,960 tokens | 90,000 tokens | **22,500 tokens** | **75.0% token reduction** |
| **Process Spawning** | 500 Child Processes | 500 Child Processes | **0 Processes (In-Memory)** | **Zero AMSI Defender Lag** |

*See [`docs/BENCHMARK_500_XNIGHT_REPORT.md`](docs/BENCHMARK_500_XNIGHT_REPORT.md) for full benchmark methodology.*

---

## License

Apache-2.0 (c) [Eurie Paulino](https://github.com/Eurie92)
