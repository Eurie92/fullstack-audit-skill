---
name: fullstack-audit
description: Runs the automated universal fullstack atlas and design system catalog engine into docs/frontend-atlas/ and docs/backend-atlas/. Supports Next.js (App & Pages Router), Vite React SPAs, Nuxt 3, SvelteKit, Astro, Remix, and React Router v7. Catalogs frontend routes, ghost/redirect shims, buttons, live pulse dots, capsule pills, modals, and design tokens, maps TanStack React Query cache topology, indexes test suites, and audits backend API routes, domain services, Prisma/Drizzle/Raw SQL schemas, server actions, auth guards, webhooks, and Answer.AI llms.txt standard.
version: 2.15.0
allowed-tools:
  - run_command
  - Bash(npx tsx .agent/skills/fullstack-audit/scripts/audit.ts)
  - Bash(npm run audit)
  - Bash(npm run audit:frontend)
  - Bash(npm run audit:backend)
  - Bash(npm run audit:theme)
---

# Universal Fullstack Atlas & Design System Audit Skill

> **Trigger**: `/fullstack-audit`, `/frontend-audit`, or when locating UI components, routes, database models, APIs, and color themes.
> Run this skill when the user invokes `/fullstack-audit`, asks to locate UI components or backend actions, or asks to generate, update, or inspect the project's **Frontend Atlas** in `docs/frontend-atlas/` or **Backend Atlas** in `docs/backend-atlas/`.

---

## Routing & Trigger Boundaries

* **USE THIS SKILL FOR**:
  1. Locating exact component files and route owners directly from `docs/frontend-atlas/01_ROUTES_AND_PANELS_MAP.md`, `06_VISIBLE_TEXT_AND_LABELS_MAP.md`, or `07_VISUAL_AND_ICON_INDEX.md`.
  2. Finding live status indicators (`animate-pulse`), capsule pills (`rounded-full`), and disclosed modals in `docs/frontend-atlas/02_COMPONENT_INVENTORY.md`.
  3. Auditing color palettes across all 22+ Tailwind families and generating rebrand checklists via `--theme` in `docs/frontend-atlas/THEME_MIGRATION_PUNCHLIST.md`.
  4. Locating API endpoints, database models (Prisma/Drizzle), server actions, and auth guards in `docs/backend-atlas/`.
  5. Generating zero-search agent handoff manifests via `--manifest <file:line>`.
  6. Running closed-loop verification gates via `--verify` to track metric improvements and TypeScript compilation.
  7. Explicit slash command: `/fullstack-audit` or `/frontend-audit`.
* **DO NOT USE THIS SKILL FOR**:
  - UI visual design, styling ideas, or color advice -> Use **`ui-ux-pro-max`** or **`design-taste-frontend`**.
  - Interaction physics, spring animations, micro-polish -> Use **`emil-design-eng`**.
  - Accessibility audit or UX critique of a component -> Use **`a11y-debugging`** or **`impeccable`**.

---

## How to Locate Components & Endpoints (Sub-Second 0ms Lookup)

### Frontend Lookup (Screenshots, Components, Themes):
1. **DO NOT run grep or search scripts.** Both atlases are already compiled on disk as Markdown.
2. **If looking up by Visible Text in a Screenshot**:
   - Open `docs/frontend-atlas/06_VISIBLE_TEXT_AND_LABELS_MAP.md` directly via `view_file`.
   - Search for the visible label (e.g. `"Purchases"`, `"Checkout"`, `"Live"`) to get the exact file and line number in 1 read!
3. **If looking up Live Status Dots or Capsule Pills**:
   - Open `docs/frontend-atlas/02_COMPONENT_INVENTORY.md` directly via `view_file`.
   - Inspect Section 2 (Live Status Dots) or Section 3 (Capsule Pills) to locate the exact file and line.
4. **If looking up by Icon / Symbol in a Textless Screenshot**:
   - Open `docs/frontend-atlas/07_VISUAL_AND_ICON_INDEX.md` directly via `view_file`.
   - Search for the icon name (e.g. `Sun`, `Moon`, `ShoppingCart`, `ChevronDown`, `Trash`) to get the exact file, line, and interactive context.
5. **If looking up by Screen / Route**:
   - Open `docs/frontend-atlas/01_ROUTES_AND_PANELS_MAP.md` directly via `view_file`.
   - Check the Next.js boundary (`Client ⚡` vs `Server 🖥️`) and inspect the 2-level deep component tree.
6. **If doing a Theme or Color Palette Rebrand**:
   - Open `docs/frontend-atlas/THEME_MIGRATION_PUNCHLIST.md` directly via `view_file` to get the line-by-line checklist of every color token to update.

### Backend Lookup (APIs, Database, Auth, Server Actions):
1. **If looking up an API Route**:
   - Open `docs/backend-atlas/01_API_ROUTES_AND_ENDPOINTS.md` directly via `view_file` to find the handler file, HTTP method, and auth requirements.
2. **If looking up a Database Table or Model**:
   - Open `docs/backend-atlas/02_DATABASE_MODELS_AND_SCHEMA.md` to see Prisma, Drizzle, and Raw SQL / Supabase models, field definitions, and foreign keys.
3. **If looking up a Server Action or Mutation**:
   - Open `docs/backend-atlas/03_SERVER_ACTIONS_AND_MUTATIONS.md` to see exported action functions and database operations.
4. **If tracing a UI button to its backend database call**:
   - Open `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` to see the bi-directional bridge.

---

## The 4-Phase Operational Pipeline (Universal Synergy Engine)
Works seamlessly across **Antigravity, Cursor, Claude Code, Windsurf, Codex, and VS Code**:

### Phase 1: GPS / Locate (fullstack-audit)
1. 🛑 **Iron Gate Invariant (Zero-Grep & Zero-Scratch Mandate)**:
   - ❌ **FORBIDDEN**: NEVER run `Get-ChildItem -Recurse` (under any parameters), `grep -r`, `rg`, `find`, or `dir /s`.
   - ❌ **FORBIDDEN**: NEVER run inline scratch scripts like `node -e "const fs = ..."` or PowerShell `ReadAllText` one-liners.
   - ❌ **FORBIDDEN**: NEVER guess paths or prepend arbitrary `src/components/`.
   - ✅ **MANDATORY**: The FIRST tool call MUST be `view_file` on `docs/frontend-atlas/` or `docs/backend-atlas/`, or run `npx fullstack-audit --find "<query>" --compact` / `npx fullstack-audit --locate-visual "<query>"` / `npx fullstack-audit --resolve "<name>"`.
2. **Immediate Relinquishment**: Once `file:line` is located, `fullstack-audit` IMMEDIATELY relinquishes control to Phase 2. It is an architecture locator, NOT an animation or code implementation tool.

### Phase 2: Design & Anti-Overengineering Firewall (ponytail)
1. **The Ponytail Hierarchy**:
   - *Does it need to exist?* Skip unasked features, options, and speculative abstractions.
   - *Already in codebase?* Reuse existing project helpers and components.
   - *Platform feature?* Use standard web/DOM/Tailwind primitives over custom JavaScript trigonometry, 36-point polygon waves, or complex SVG math.
   - *Can it be one line?* Make it one line a reader grasps at a glance.
   - *Shortest working diff wins.* Deletion beats addition.
2. **Preserve Always**: Trust boundary validation, auth guards, data-loss error handling, accessibility.

### Phase 3: Communication & Zero-Fluff Receipts (caveman)
1. **Answer First**: Dense result first, technical facts exact. Zero filler, zero apologies.
2. **Compact Diff Receipt**: Return exact target, diff, ponytail savings, and HMR status.

### Phase 4: Right-Sized Verification (superpowers Dual-Speed)
1. **Inner-Loop (Fast Mode — 1 to 2s responses — Mandatory for UI/CSS/Layout/Copy)**:
   - Direct surgical file edits (`edit_file` / native patch). Let local dev server HMR refresh in 50ms.
   - **HARD FORBIDDEN**: Do NOT run full TypeScript compilation (`tsc --noEmit`, `npm run typecheck`).
   - **HARD FORBIDDEN**: Do NOT run `npm run audit` or `npx fullstack-audit` on micro-edits.
   - **HARD FORBIDDEN**: Do NOT invoke Superpowers process skills (`brainstorming`, `writing-plans`, `test-driven-development`).
   - **HARD FORBIDDEN**: Do NOT invoke multiple design skills in parallel.
   - **HARD FORBIDDEN**: Do NOT invoke heavy browser automation (Chrome DevTools MCP / Puppeteer) or curl localhost.
   - **Response Time**: Return immediately to the user in 1–2 seconds.
2. **Outer-Loop (Checkpoint Verification Gate — Milestones/Backend/DB/Auth)**:
   - Run `npx fullstack-audit --verify --gate-clean` or test suites (`npm test`, `npm run typecheck`) ONLY at major milestones or explicit user request.

## The Atlas Documents Guide

### `docs/frontend-atlas/` (Frontend & UI)
1. **`01_ROUTES_AND_PANELS_MAP.md`**: Route-to-page link, ghost/redirect alias indicators (`Redirect -> /...`), Next.js boundary (`[Client]` vs `[Server]`), layout, and 2-level deep component tree.
2. **`02_COMPONENT_INVENTORY.md`**: Buttons, Live Dots (`animate-pulse`), Capsule Pills (`rounded-full`), and Disclosed Modals with reverse route mapping.
3. **`03_DESIGN_TOKENS_AND_COLORS.md`**: Universal Tailwind Color Matrix (all 22+ colors) and Dark Mode Asymmetry scanner.
4. **`04_UI_ISLANDS_AND_DRIFT.md`**: Raw HTML elements, inline style tags, and custom modal redundancies.
5. **`05_DEAD_ORPHANED_COMPONENTS.md`**: Dedicated punch-list for unused and orphaned components.
6. **`06_VISIBLE_TEXT_AND_LABELS_MAP.md`**: Buttons, headings, badges, and visible UI labels for instant Screenshot-to-Code targeting.
7. **`07_VISUAL_AND_ICON_INDEX.md`**: Lucide, Radix, Tabler, and SVG visual action icons for textless screenshot targeting.
8. **`08_DISPATCH_GATEWAY.md`**: Inter-skill handoff matrix routing UI findings to specialized peer skills.
9. **`09_QUERY_AND_CACHE_MAP.md`**: TanStack React Query cache keys, mutations, event invalidations (`invalidateQueriesForEvent`), reactive dependency graph, and Cache Hygiene Radar.
10. **`10_GOD_FILES_SURGICAL_MAP.md`**: Monolithic files (>500 lines) parsed into functional AST slices (components, hooks, functions) with exact line bounds for 88–99.8% token savings.
11. **`11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md`**: Composite route risk scoring (0–100) and blast-radius tiers (`Critical`, `Moderate`, `Low`) to safeguard high-impact screens.
12. **`12_TEST_SUITES_AND_COVERAGE_MAP.md`**: Pre-indexed registry of unit, integration, and E2E test suites. Eliminates blind directory greps on test assertion failures.
13. **`THEME_MIGRATION_PUNCHLIST.md`**: Actionable `- [ ]` checklist for whole-website color and dark mode migrations.

## Available Commands (v2.15.0 Multi-Harness & Native MCP Engine)
- **Native MCP Tools (Zero Latency, In-Memory)**:
  - `fullstack_find`: Sub-3ms instant inverted index search across components, queries, test assertions, and database models.
  - `fullstack_locate_visual`: 0ms visual element locator (pulse dots, capsule pills, status badges, icons).
  - `fullstack_resolve`: Fuzzy case-insensitive component & file resolver (e.g. `connect-modal` ➔ `ConnectModal.tsx`).
  - `fullstack_path`: Sub-5ms causal execution path finder (UI button -> Action -> DB model).
  - `fullstack_symbol`: Line-bound surgical slicer for functions/methods in God-files (>500 lines).
  - `fullstack_patch`: CRLF-agnostic surgical patcher (immune to PowerShell `&` syntax crashes).
  - `fullstack_audit`: Runs or refreshes the fullstack atlas catalog in the active project.
- **CLI Commands (Terminal & Scripts)**:
  - `/fullstack-audit` or `npm run audit`: Regenerates the entire Fullstack Atlas and root `llms.txt` / `llms-full.txt`.
  - `npx fullstack-audit --find "<query>" --compact`: Fast-path index query for AI agents (<1ms).
  - `npx fullstack-audit --rag "<query>"`: Hybrid Code RAG retrieval (BM25 + Semantic Vector + 1-Hop Causal Bundle).
  - `npx fullstack-audit --doctor`: Health check for Node, MCP server, Iron Gate hooks, and 10 IDE harnesses.
  - `npx fullstack-audit --roi`: Live developer benchmark card showing exact tokens, dollars, and AMSI latency saved.
  - `npx fullstack-audit --version` or `-v`: Instant (<5ms) version banner and engine output.
  - `npx fullstack-audit --check-update`: Compares project Atlas against installed skill version and detects version drift.
  - `npx fullstack-audit --setup-all [--standalone | --profile <profile>]`: Universal 10-harness auto-installer (configures Cursor, Claude Code, VS Code Copilot, Windsurf, Cline/Roo, OpenCode, Hermes, Aider, and Codex with rules & native MCP auto-registration).
- `npx fullstack-audit --find <query> [--compact]`: Sub-3ms instant inverted index search across components, queries, test assertions, and database models.
- `npx fullstack-audit --locate-visual <query>`: 0ms visual element locator (pulse dots, capsule pills, status badges, icons).
- `npx fullstack-audit --resolve <name>`: Fuzzy case-insensitive component & file resolver (e.g. `connect-modal` ➔ `ConnectModal.tsx`).
- `npx fullstack-audit --path <from> <to>`: Sub-5ms causal execution path finder (UI button -> Action -> DB model).
- `npx fullstack-audit --symbol <method>`: Line-bound surgical slicer for functions/methods in God-files (>500 lines).
- `npx fullstack-audit --patch <file> --target "<old>" --replace "<new>"`: CRLF-agnostic surgical patcher (immune to PowerShell `&` syntax crashes).
- `npx fullstack-audit --solo`: Enforces strictly Single-Agent execution (no subagents).
- `npx fullstack-audit --multi-agent`: Partitions codebase into 4 parallel zone briefs for rapid Map-Reduce sweeps.
- `npx fullstack-audit --llms`: Generates root `llms.txt` and `llms-full.txt` (Answer.AI specification).
- `npx fullstack-audit --graph`: Exports knowledge graph to `docs/graph.json` (NetworkX / Graphify schema).
- `npx fullstack-audit --diff`: Architecture delta report comparing current scan against `.last_receipt.json`.
- `npx fullstack-audit --theme --route <route> --compact`: Emits route-scoped micro-punchlist (saves 99.8% tokens).
- `npx fullstack-audit --migrate-theme --from "#hex1,#hex2" --to "dark:bg-slate-900"`: CRLF-agnostic AST codemod in 80ms (0 LLM output tokens).
- `npx fullstack-audit --verify --gate-clean [--route <route>]`: Smart multi-target verification gate.
- `npx fullstack-audit --manifest <file:line>`: Generates zero-search agent handoff manifest.
- `npx fullstack-audit --watch`: Live background file watcher for continuous auto-sync.
- `npx fullstack-audit --dead`: Scans for potential orphaned components.

### `docs/backend-atlas/` (Backend & Fullstack)
1. **`01_API_ROUTES_AND_ENDPOINTS.md`**: HTTP API endpoints, methods (`GET`, `POST`, `PUT`, `DELETE`), params, auth guards, and Traffic Centrality ranking.
2. **`02_DATABASE_MODELS_AND_SCHEMA.md`**: Prisma, Drizzle, and Raw SQL / Supabase models, fields, types, relations, and Entity Centrality ranking.
3. **`03_SERVER_ACTIONS_AND_MUTATIONS.md`**: Next.js Server Actions (`"use server"`), parameters, and DB mutations.
4. **`04_AUTH_AND_MIDDLEWARE_GUARDS.md`**: Middleware matchers, protected routes, and authentication providers.
5. **`05_INTEGRATIONS_AND_WEBHOOKS.md`**: Third-party SDK clients (Stripe, Resend, Supabase, S3) and webhooks.
6. **`06_FULLSTACK_CROSS_REFERENCE_MAP.md`**: Deep bi-directional bridge linking frontend UI triggers to backend API routes, domain services (`CatalogService`, `OrderService`), and database models, plus API contract casing drift warnings.
7. **`07_ENV_AND_SECRETS_MAP.md`**: Client Secret Leak Radar (`🚨 CRITICAL` / `⚠️ WARNING`) and undocumented shadow `.env` variables detector.
