# Unlocking the Full Potential of fullstack-audit (v2.15.0 Master Guide)

> **The definitive operational playbook for software engineers and AI coding assistants (Antigravity, Cursor, Claude Code, Windsurf, Codex, VS Code).**

---

## The Core Philosophy: "Zero-Grep, Zero-Hallucination"

Modern web codebases (Next.js, Vite React, Nuxt 3, SvelteKit, Astro, Remix) grow rapidly. When developers or AI assistants try to understand or modify them using raw grep (`Select-String` or `grep -r`), they suffer from:
1. **Localization Errors & Hallucinations**: Over 64% of AI failures stem from reading minified build output (`.next/`, `dist/`, `.output/`) or hallucinating paths.
2. **Context Window Blowup & Token Costs**: Reading massive 1,000+ line files burns 100,000+ tokens and degrades LLM reasoning (*Lost in the Middle effect*).
3. **Hidden Blast-Radius Regressions**: Modifying a shared component or API route breaks dependent pages without warning.
4. **Per-Edit Latency Traps**: Running headless browser MCP automation or full TypeScript typechecks on every single micro-edit slows iterations to 45–60 seconds per change.

`fullstack-audit` solves this by pre-indexing the entire codebase in **under 350ms** into deterministic, human-readable Markdown atlases on disk (`docs/frontend-atlas/` and `docs/backend-atlas/`), establishing a **Dual-Speed Loop (1–2s responses)**.

---

## When to Use: Before, During, and After Development

Fullstack Audit is an always-on architectural companion across all three phases:

| Phase | Purpose | Recommended Commands & Actions |
| :--- | :--- | :--- |
| **Before Development** | Codebase orientation, route mapping, and mental model acquisition | Type `/fullstack-audit` in chat or run `npx.cmd fullstack-audit`. Generates all 20 atlases and root `llms.txt`. |
| **During Development** | Sub-3ms symbol extraction and surgical single-function reads | AI assistant autonomously invokes `--symbol`, `--resolve`, and `--patch` to avoid reading 1,000+ line God-files. |
| **After Development** | Secret leak scanning, blast radius check, and verification gate | Inspect `07_ENV_AND_SECRETS_MAP.md`, check `11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md`, and run `npx fullstack-audit --verify --gate-clean`. |

---

## Complete Atlas Directory (20 Specialized Architecture Maps)

```text
docs/
├── frontend-atlas/
│   ├── 01_ROUTES_AND_PANELS_MAP.md         # Routes, RSC [Server]/[Client] boundaries & Blast-Radius Badges
│   ├── 02_COMPONENT_INVENTORY.md           # Modals, Drawers, Live Dots, Capsule Pills (Centrality Ranked)
│   ├── 03_DESIGN_TOKENS_AND_COLORS.md      # 22+ Tailwind Palette Matrix & Dark Mode Asymmetries
│   ├── 04_UI_ISLANDS_AND_DRIFT.md          # Inconsistent styling & priority consolidation list
│   ├── 05_DEAD_ORPHANED_COMPONENTS.md      # Unused components safe for deletion
│   ├── 06_VISIBLE_TEXT_AND_LABELS_MAP.md   # Screenshot-to-Code visible UI text & button labels
│   ├── 07_VISUAL_AND_ICON_INDEX.md         # Action icons & SVG symbol registry
│   ├── 08_DISPATCH_GATEWAY.md              # Multi-skill routing matrix
│   ├── 09_QUERY_AND_CACHE_MAP.md           # React Query keys, invalidation triggers & Cache Hygiene Radar
│   ├── 10_GOD_FILES_SURGICAL_MAP.md        # Monolithic files sliced into AST line bounds (88-99.8% token savings)
│   ├── 11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md # Composite risk scoring (0-100) & blast radius impact tiers
│   ├── 12_TEST_SUITES_AND_COVERAGE_MAP.md  # Pre-indexed test assertions & suites registry (zero-grep test locator)
│   ├── THEME_MIGRATION_PUNCHLIST.md        # Actionable whole-website dark mode & color punchlist
│   └── README.md                           # Frontend stats dashboard
└── backend-atlas/
    ├── 01_API_ROUTES_AND_ENDPOINTS.md      # HTTP endpoints, methods, auth guards & Traffic Centrality
    ├── 02_DATABASE_MODELS_AND_SCHEMA.md    # Prisma, Drizzle & Raw SQL / Supabase DDL migrations
    ├── 03_SERVER_ACTIONS_AND_MUTATIONS.md  # Next.js "use server" actions, parameters & mutations
    ├── 04_AUTH_AND_MIDDLEWARE_GUARDS.md    # Route matchers, public vs protected barriers
    ├── 05_INTEGRATIONS_AND_WEBHOOKS.md     # Stripe, Resend, Supabase, S3 integrations
    ├── 06_FULLSTACK_CROSS_REFERENCE_MAP.md # Deep UI Trigger -> API Route -> Domain Service -> DB Model
    ├── 07_ENV_AND_SECRETS_MAP.md           # Client Secret Leak Radar & Undocumented Shadow Variables
    └── README.md                           # Backend stats dashboard
```

---

## Part 1: How Human Developers Use It

### 1. In AI Chat Quickstart (Recommended)
Trigger directly inside your assistant conversation:
```text
/fullstack-audit
```

### 2. Terminal Execution (Windows / Mac / Linux)
```powershell
# Windows PowerShell / CMD (bypasses execution policy restrictions):
npx.cmd fullstack-audit

# macOS / Linux:
npx fullstack-audit

# In-project script:
npm run audit
# or direct Node.js:
node bin/audit.js
```
* Generates both `docs/frontend-atlas/` and `docs/backend-atlas/`.
* Generates standard `llms.txt` and `llms-full.txt` in your project root so any external AI or tool instantly understands your whole architecture.

### 2. Check for Leaked Secrets & Client Env Exposures
Open [`docs/backend-atlas/07_ENV_AND_SECRETS_MAP.md`](../docs/backend-atlas/07_ENV_AND_SECRETS_MAP.md) before pushing to production:
* **`CRITICAL LEAKS`**: Flags private secrets like `STRIPE_SECRET_KEY` or `DATABASE_URL` accidentally imported in client components (`"use client"`).
* **`SHADOW VARIABLES`**: Flags critical variables used in code but missing from `.env.example`, preventing deployment or CI/CD crashes.

### 3. Check Blast-Radius Before Major Refactors
Open [`docs/frontend-atlas/11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md`](../docs/frontend-atlas/11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md):
* Look for routes tagged `Critical Blast Radius (Score 65–100)`.
* Know ahead of time which pages import 20+ modules, disclose modals, and perform multiple mutations so you can test them thoroughly.

### 4. Catch Stale Data & Cache Invalidation Bugs
Open [`docs/frontend-atlas/09_QUERY_AND_CACHE_MAP.md`](../docs/frontend-atlas/09_QUERY_AND_CACHE_MAP.md):
* **Orphaned Invalidations**: Identifies mutations invalidating keys that no `useQuery` listens to.
* **Unlinked Dynamic Queries**: Shows queries that fetch remote data but never refresh when relevant data is updated.

### 5. Instant Architecture Delta (`--diff`)
Run `--diff` to review what changed in your architecture compared to the last audit:
```bash
npx fullstack-audit --diff
```
Prints an ASCII report tracking newly added routes, god files, hex deviations, and query count changes.

### 6. Whole-Website Instant Rebranding in 80ms
Tired of manually hunting down old hex colors?
```bash
npx fullstack-audit --migrate-theme --from "#121110,#1E1C1A" --to "dark:bg-slate-900"
```
Replaces rogue colors across 400+ files in 80ms with 0 LLM tokens, cleanly preserving Windows CRLF or Linux LF formatting.

---

## Part 2: How AI Coding Agents Unlock Full Potential

### Rule #1: The Zero-Grep Golden Rule
Never let your AI assistant run recursive file searches (`grep -r` or `Select-String`). The first tool call MUST be reading the relevant markdown map:
* **User attaches a screenshot with text?** -> Read `06_VISIBLE_TEXT_AND_LABELS_MAP.md`.
* **User attaches a screenshot with an icon?** -> Read `07_VISUAL_AND_ICON_INDEX.md`.
* **User mentions a route (e.g. `/admin/orders`)?** -> Read `01_ROUTES_AND_PANELS_MAP.md`.
* **User mentions a database table or model?** -> Read `02_DATABASE_MODELS_AND_SCHEMA.md`.
* **User asks to tweak colors?** -> Read `03_DESIGN_TOKENS_AND_COLORS.md`.

### Rule #2: Surgical Slicing on God-Files (Save 90%+ Tokens)
When an edit involves a large file (> 500 lines):
1. The AI looks up the file in `10_GOD_FILES_SURGICAL_MAP.md` or runs:
   ```bash
   npx fullstack-audit --manifest <file:line>
   ```
2. The engine returns the exact containing slice (e.g., `calculateTax` function, `L245-L280`).
3. The AI reads **only those 35 lines** instead of the entire 1,500-line file.
4. **Result**: 95% token savings, zero lost-in-the-middle confusion, sub-second generation.

### Rule #3: The Dual-Speed Inner Loop
AI assistants should operate in two distinct speeds:
* **Inner Loop (Fast Mode - 1 to 2s responses)**:
  * Apply surgical edits directly via `edit_file`.
  * Let the running dev server (Next.js/Vite HMR) update the user's monitor in 50ms.
  * **Prohibited**: Headless browser MCP tools (Chrome DevTools MCP / Puppeteer) and full TypeScript compilation on micro-edits.
* **Outer Loop (Verification Gate)**:
  * Run `npx fullstack-audit --verify --gate-clean` only when the entire task is done or before committing to git.

### Rule #4: Multi-Agent Parallel Swarms (`--multi-agent`)
For large-scale codebase migrations or rebrands:
```bash
npx fullstack-audit --multi-agent
```
Partitions your project into 4 isolated, non-overlapping architectural zone briefs:
* `ZONE_STOREFRONT.md`: Public routes & landing pages.
* `ZONE_PORTALS.md`: Authenticated dashboards & admin views.
* `ZONE_OVERLAYS.md`: Modals, dialogs, drawers, and sheets.
* `ZONE_PRIMITIVES.md`: Shared UI buttons, cards, inputs, and badges.

Spawn 4 subagents in parallel to execute edits across their respective zones with zero git merge conflicts!

---

## Part 3: Real-World Scenario Playbooks

### Scenario A: "Change a button color from a screenshot"
1. **Developer**: Pastes a screenshot into chat: *"Change this blue 'Export CSV' button to emerald green"*.
2. **AI Action**: Reads `docs/frontend-atlas/06_VISIBLE_TEXT_AND_LABELS_MAP.md` for `"Export CSV"`.
3. **Instant Hit**: Finds `components/admin/OrdersTable.tsx:142`.
4. **Edit**: Calls `edit_file` to replace `bg-blue-600` with `bg-emerald-600`.
5. **Outcome**: UI refreshes on localhost in 50ms. Total agent time: **2 seconds**.

### Scenario B: "Add a field to an existing API route and UI form"
1. **Developer**: *"Add a phone number field to the customer profile update"*.
2. **AI Action**: Reads `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` for `/api/customers/update`.
3. **Instant Hit**: Immediately sees:
   - UI Trigger: `components/customers/ProfileForm.tsx`
   - Server Handler: `app/api/customers/update/route.ts`
   - Database Model: `Customer` in `prisma/schema.prisma`
4. **Execution**: Updates the Prisma schema, the API route, and the form component with full end-to-end alignment.

### Scenario C: "Fix a bug in a 1,200-line monolithic drawer"
1. **Developer**: *"The tax calculation is wrong in the checkout drawer"*.
2. **AI Action**: Runs `npx fullstack-audit --manifest components/checkout/CheckoutDrawer.tsx:410`.
3. **Instant Manifest**: Emits:
   ```json
   {
     "containing_slice": {
       "name": "calculateTax",
       "kind": "function",
       "startLine": 402,
       "endLine": 435,
       "token_savings": "96.8%"
     }
   }
   ```
4. **Read & Edit**: Reads lines 402–435, fixes the math, applies the patch.
5. **Outcome**: Saves 96.8% tokens and avoids touching the other 1,150 lines.

### Scenario D: "Final Verification Before Git Commit"
1. **Developer**: *"Check everything and prepare commit"*.
2. **AI Action**: Runs:
   ```bash
   npx fullstack-audit --verify --gate-clean
   npx fullstack-audit --diff
   ```
3. **Outcome**: Verifies 0 TypeScript errors, 0 rogue colors, and displays the exact delta report of files modified.

---

## Summary Cheat Sheet

| I want to... | Use this Command or File |
| :--- | :--- |
| **Audit whole project** | `npx fullstack-audit` or `npm run audit` |
| **Configure multi-harness profiles** | `npx fullstack-audit --setup-all [--standalone \| --profile <profile>]` |
| **Locate a UI element by text** | Read `docs/frontend-atlas/06_VISIBLE_TEXT_AND_LABELS_MAP.md` |
| **Locate an action icon** | Read `docs/frontend-atlas/07_VISUAL_AND_ICON_INDEX.md` |
| **Resolve component name & casing in 0ms** | `npx fullstack-audit --resolve <name>` |
| **Slice a 1,000-line God file / method bounds** | `npx fullstack-audit --symbol <method>` or `docs/frontend-atlas/10_GOD_FILES_SURGICAL_MAP.md` |
| **CRLF-safe surgical patch (immune to & syntax)**| `npx fullstack-audit --patch <file> --target "<old>" --replace "<new>"` |
| **Locate a test suite or failing assertion** | Read `docs/frontend-atlas/12_TEST_SUITES_AND_COVERAGE_MAP.md` or `npx fullstack-audit --find "test:<title>"` |
| **Find what a button triggers in backend** | Read `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` |
| **Find client-side secret leaks** | Read `docs/backend-atlas/07_ENV_AND_SECRETS_MAP.md` |
| **Check route blast radius** | Read `docs/frontend-atlas/11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md` |
| **Check React Query cache invalidations** | Read `docs/frontend-atlas/09_QUERY_AND_CACHE_MAP.md` |
| **Compare architectural changes** | `npx fullstack-audit --diff` |
| **Batch re-theme colors in 80ms** | `npx fullstack-audit --migrate-theme --from "#hex" --to "token"` |
| **Check TypeScript & anti-hallucination gate** | `npx fullstack-audit --verify --gate-clean` |
| **Run parallel multi-agent swarms** | `npx fullstack-audit --multi-agent` |
