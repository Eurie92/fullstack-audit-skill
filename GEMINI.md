# GEMINI.md — Antigravity Agent Guidelines & Operational Protocol
> **Workspace:** `frontend-audit-skill` (`C:\Users\EURIE\Dev\Tools\frontend-audit-skill`)  
> **Target Consumer:** `xnight` (`C:\Users\EURIE\Dev\SaaS\xnight`)  
> **Engine:** Universal Fullstack Atlas & Design System Audit Engine

---

## Executive Rule: Transparent Action Description & Versioning Invariant

### 1. Pre-Task Intent & Action Description (Bago Galawin ang Code)
Kahit magbukas ang user ng bagong chat (`/new` o fresh session), **HINDI DAPAT** magsimula ng code edits o terminal execution nang walang malinaw na paliwanag.

Bago gumalaw, magbigay agad ng maikli at eksaktong **Execution Brief**:
* **Goal / Objective**: Ano ang gagawin (1–2 pangungusap).
* **Root Cause / Context**: Bakit ito kailangang gawin (kung bugfix, latency trap, o feature request).
* **Version Tier & Bump**: Anong tier ng update (Tier 1 Patch, Tier 2 Minor, Tier 3 Major) at ano ang magiging bagong version number.
* **Target Files**: Eksaktong file paths na babaguhin.

---

## Version Governance & Release Playbook (Laging Nababago ang Version)

Ang bawat code change, bug fix, feature, o performance patch ay **OBLIGADONG** mag-bump ng version alinsunod sa Semantic Versioning (SemVer).

### Ang 3 Update Tiers:

| Tier | Antas ng Pagbabago | Bersyon | Kailan Ginagamit |
| :--- | :--- | :---: | :--- |
| **Tier 1: LOW** | Patch Release | `x.y.Z` | Bug fixes, typo corrections, minor regex fixes, documentation sync, maliliit na hotfixes. |
| **Tier 2: MEDIUM** | Minor Feature Release | `x.Y.0` | Bagong CLI commands/flags (`--patch`, `--resolve`, `--symbol`), bagong atlases (`12_TEST_SUITES`), modular profiles (`--standalone`, `--profile`), non-breaking features. |
| **Tier 3: HIGH** | Major Architecture Release | `X.0.0` | Breaking architectural changes, pagbura ng lumang commands, major overhaul ng atlas syntax o schema. |

### Checklist ng mga Files na Sabay-Sabay I-uupdate sa Bawat Version Bump:
1. `package.json` -> `"version": "x.y.z"`
2. `scripts/constants.ts` -> `FULLSTACK_AUDIT_VERSION = "x.y.z"`, `FULLSTACK_AUDIT_ENGINE`, `FULLSTACK_AUDIT_RELEASE_DATE`
3. `bin/audit.js` -> Fallback version banner string
4. `SKILL.md` -> YAML metadata `version` at CLI matrix section header
5. `README.md` -> Release badge (`Release-vx.y.z-emerald.svg`), CLI Command Matrix header (`vX.Y.Z`), at atlas counts
6. `docs/MASTER_USAGE_GUIDE.md` -> Title header at summary matrix
7. `CHANGELOG.md` -> Bagong entry sa itaas: `## [x.y.z] - YYYY-MM-DD` na may `Added`, `Fixed`, `Changed`
8. Internal Agent Skills -> I-mirror ang binagong scripts sa `.agent/skills/fullstack-audit/` at `.agent/skills/frontend-audit/`
9. Target Consumer (`xnight`) -> I-sync ang updated files sa `xnight/.agent/skills/fullstack-audit/`

---

## GitHub Release Description Invariant (Bawal ang Walang Description sa GitHub!)

Tulad ng natuklasan sa screenshot, ang mga automated GitHub releases ay maaaring maging blangko ("Full Changelog: ...") kapag tag push lamang ang naganap.
**MAHIGPIT NA IPINAGBABAWAL ANG BLANGKONG GITHUB RELEASE.**

Sa bawat release o tag push:

1. Gamitin ang GitHub CLI (`gh`) para agad lagyan ng kumpletong description at title ang release:
    ```bash
    gh release edit <tag> --title "vX.Y.Z: <Concise Headline>" --notes-file <path-to-notes.md>
    # O kung bagong release:
    gh release create <tag> --title "vX.Y.Z: <Concise Headline>" --notes-file <path-to-notes.md>
    ```

2. Ang release body ay dapat may sumusunod na istruktura:
    * **What's Changed**: Maikling buod ng mga pagbabago.
    * **New Features / Flags**: Mga bagong commands at switches.
    * **Performance & Token Savings**: Gaano kalaki ang natipid na oras at tokens.
    * **Bug Fixes & Guardrails**: Mga naayos na shell crashes, quoting errors, at line-ending mismatches.
    * **Installation / Upgrade Command**: Quick copy-paste one-liner para sa mga developers.
    * **Full Changelog Link**: `https://github.com/Eurie92/fullstack-audit-skill/compare/vA.B.C...vX.Y.Z`

---

<!-- START_FULLSTACK_AUDIT_RULE -->
<!-- START_FRONTEND_AUDIT_RULE -->
## Fullstack 4-Phase Synergy Engine (0ms Atlas • Ponytail KISS • Caveman Terse • Dual-Speed Verify)
Universal execution rule across all harnesses (Antigravity, Cursor, Claude Code, Windsurf, Codex, OpenCode, VS Code).

### The 4-Phase Operational Pipeline

#### Phase 1: GPS / Locate (fullstack-audit)
- **IRON GATE INVARIANT (Zero-Grep & Zero-Scratch Absolute Mandate)**:
  - **FORBIDDEN (All Recursive Searches)**: NEVER run `Get-ChildItem -Recurse` (under ANY parameters: `-Filter`, `-Include`, `-Path`, `-Directory`, etc.), `grep -r`, `rg`, `find`, or `dir /s`. Windows PowerShell scans `node_modules` and `.next`, causing a 15–30s Defender freeze.
  - **FORBIDDEN (Inline Scratch Scripts)**: NEVER execute `node -e "const fs = require('fs')..."`, `python -c "..."`, or PowerShell `[IO.File]::ReadAllText` / `ForEach-Object` one-liners to locate, read, or patch files.
  - **FORBIDDEN (Path Guessing)**: NEVER guess paths or prepend arbitrary prefixes like `src/components/`.
  - **MANDATORY GPS FIRST-ACTION**: The FIRST tool call MUST locate the element deterministically:
    - **Fast Find**: Run `npx fullstack-audit --find "<query>" --compact` (sub-3ms token-compact lookup).
    - **Visual & Icon Locator**: Run `npx fullstack-audit --locate-visual "<query>"` (0ms lookup for live pulse dots `animate-pulse`, capsule pills `rounded-full`, badges, action icons).
    - **Fuzzy Case Resolver**: Run `npx fullstack-audit --resolve "<name>"` (prefix-agnostic casing & path resolver in 0ms).
    - **Causal Path Tracer**: Run `npx fullstack-audit --path <fromComponent> <toActionOrModel>` (sub-5ms causal dependency path).
    - **God-File Slicer**: Run `npx fullstack-audit --symbol "<method>"` (exact start/end lines before calling `read_file`).
    - **Pre-Computed Atlases**: Direct `view_file` on `docs/frontend-atlas/` (01 routes, 02 components, 03 tokens, 06 visible text, 07 icons) or `docs/backend-atlas/` (01 APIs, 02 DB models, 03 server actions, 04 auth).
- **Screenshot & Temp Image Armor**: When a user references a screenshot in `AppData\Local\Temp\orca-paste-*.png`:
  - **FORBIDDEN**: Never call `read_file` or `view_file` directly on `AppData\Local\Temp` paths (avoids OS hook sandbox interception).
  - **Fast-Path A (Visual Atlas)**: Query `npx fullstack-audit --locate-visual "<element>"` or view `docs/frontend-atlas/02_COMPONENT_INVENTORY.md` in 0ms without opening the image.
  - **Fast-Path B (Scratch Copy)**: If the raw screenshot must be viewed, copy first: `Copy-Item '<temp-path>' 'scratch\screenshot.png'`, then open `scratch\screenshot.png`.
- **PowerShell Quoting & Surgical Patching**:
  - Wrap PowerShell arguments in single-quotes `'...'` (prevents `&` reserved character syntax crash and variable expansion).
  - To edit code: Use native harness tools (`edit_file`) or `npx fullstack-audit --patch <file> --target "<old>" --replace "<new>"` (CRLF-agnostic surgical patcher).
- **Immediate Relinquishment**: Once `file:line` is located, `fullstack-audit` IMMEDIATELY relinquishes control to implementation. `fullstack-audit` is a GPS locator, NOT an implementation or animation tool.
- **ONE-AND-DONE HARD STOP (Anti-Overinvestigation & Zero Double-Checking Mandate)**:
  - The moment ANY tool call, search hit, or atlas lookup reveals the matching `file:line` (e.g. `public-navbar.tsx:149` for "xnight"):
    - **IMMEDIATELY STOP ALL FURTHER TOOL CALLS.** Do not make another read, search, or check.
    - **FORBIDDEN (Sister-File Double-Checking)**: NEVER inspect related, sibling, or drawer components (e.g. `mobile-nav-drawer.tsx`, `header.tsx`, `footer.tsx`, `sidebar.tsx`) to "double check" or "be thorough" unless the user explicitly used the word "ALL" (e.g. "find ALL occurrences").
    - **FORBIDDEN (End-of-File Crawling)**: NEVER read further down or read to the end of the file once the target snippet is identified.
    - **FORBIDDEN (Redundant Verification Calls)**: NEVER run secondary searches, grep commands, or file reads to verify what you already found.
    - **MAX TOOL CALL BUDGET = 1**: For lookup queries ("where is X", "find Y in navbar", "locate button"), the agent must resolve in **1 tool call**, output the exact `file:line` snippet receipt, and conclude the response in that very turn.

#### Phase 2: Design & Anti-Overengineering Firewall (ponytail)
- **YAGNI Invariant**: The best code is the code never written. Solve the whole problem with the least new code.
- **The Ponytail Hierarchy**:
  1. *Does it need to exist?* Skip unasked features, options, and speculative abstractions. A vague request gets the smallest working version.
  2. *Already in codebase?* Reuse existing helpers, components, and patterns.
  3. *Platform feature?* Use standard web/DOM/Tailwind primitives over custom JavaScript trigonometry, 36-point polygon waves, or complex SVG math.
  4. *Installed dependency?* Never install a new package for a few lines of logic.
  5. *Can it be one line?* Make it one line a reader grasps at a glance.
  6. *Shortest working diff wins.* Deletion beats addition. Keep surrounding layers and conventions intact.
- **Preserve Always**: Trust boundary validation, auth guards, data-loss error handling, accessibility.
- **Shortcuts**: Document deliberate limits as `// shortcut: <limit>, <when to upgrade>`.

#### Phase 3: Communication & Zero-Fluff Receipts (caveman)
- **Answer First**: Dense result first, technical facts exact.
- **Kill Ceremony**: No conversational filler ("Sure, I can help with that!", "I apologize for the confusion"), no preamble, no postamble.
- **Tool Status**: Zero conversational commentary between routine tool calls.
- **Compact Diff Receipt**: Conclude replies with a tight diff receipt:
  - `Target`: `<file:line>`
  - `Diff`: `<old>` -> `<new>`
  - `Status`: `<HMR applied | Test pass count | Exit code>`

#### Phase 4: Right-Sized Verification (superpowers Dual-Speed Harmonization)
- **Inner-Loop (Fast Mode — 1 to 2s responses — Mandatory for UI/CSS/Layout/Copy edits <= 2 files, < 30 lines)**:
  - Perform direct surgical file edits (`npx fullstack-audit --patch` or `edit_file`). Let local dev server (Next.js/Vite/Nuxt HMR) refresh in 50ms.
  - **HARD FORBIDDEN**: Do NOT run full TypeScript compilation (`tsc --noEmit`, `npm run typecheck`).
  - **HARD FORBIDDEN**: Do NOT run `npm run audit` or `npx fullstack-audit` on micro-edits.
  - **HARD FORBIDDEN**: Do NOT invoke Superpowers process skills (`brainstorming`, `writing-plans`, `test-driven-development`).
  - **HARD FORBIDDEN**: Do NOT invoke multiple design skills in parallel.
  - **HARD FORBIDDEN**: Do NOT invoke heavy browser automation (Chrome DevTools MCP / Puppeteer) or curl localhost.
  - **Response Time**: Return immediately to the user in 1–2 seconds.
- **Outer-Loop (Checkpoint Verification Gate — Milestones/Backend/DB/Auth)**:
  - Superpowers Iron Law applies: *No completion claims without fresh verification evidence.*
  - Run `npx fullstack-audit --verify --gate-clean` or test suites (`npm test`, `npm run typecheck`).
  - Claim completion ONLY with fresh exit code 0 evidence.
  - **Zero Polling Invariant**: Do NOT loop on `manage_task status`. The harness features Reactive Wakeup and automatically resumes execution when tasks complete.
  - Run `npm run audit` upon milestone completion to synchronize atlases.

### Available Commands (v2.14.0 Multi-Harness Engine)
- `/fullstack-audit` or `npm run audit`: Regenerates the entire Fullstack Atlas and root `docs/llms.txt` / `docs/llms-full.txt`.
- `npx fullstack-audit --find <query> --compact`: Ultra-fast, sub-3ms token-compact query mode for AI agents.
- `npx fullstack-audit --locate-visual <query>`: 0ms visual element locator (pulse dots, capsule pills, status badges, icons).
- `npx fullstack-audit --resolve <name>`: Fuzzy case-insensitive component & file resolver.
- `npx fullstack-audit --path <from> <to>`: Sub-5ms causal execution path finder (UI button -> Action -> DB model).
- `npx fullstack-audit --symbol <method>`: Line-bound surgical slicer for functions/methods in God-files.
- `npx fullstack-audit --patch <file> --target "<old>" --replace "<new>"`: CRLF-agnostic surgical patcher (immune to PowerShell `&` syntax crashes).
- `npx fullstack-audit --setup-all [--standalone | --profile <profile>]`: Configures Cursor (.mdc), Claude Code, Hermes Agent, and OpenCode.
- `npx fullstack-audit --theme --route <route> --compact`: Generates a route-scoped micro-punchlist (saves 99.8% tokens).
- `npx fullstack-audit --verify --gate-clean [--route <route>]`: Smart multi-target verification gate.
- `npx fullstack-audit --solo`: Enforces strictly Single-Agent execution (no subagents).
- `npx fullstack-audit --multi-agent`: Partitions codebase into 4 parallel zone briefs for rapid Map-Reduce sweeps.
- `npx fullstack-audit --llms`: Generates `docs/llms.txt` and `docs/llms-full.txt` (Answer.AI specification).
- `npx fullstack-audit --graph`: Exports knowledge graph to `docs/graph.json` (NetworkX / Graphify schema).
- `npx fullstack-audit --diff`: Architecture delta report comparing current scan against `.last_receipt.json`.
- `npx fullstack-audit --migrate-theme --from "#hex1,#hex2" --to "dark:bg-slate-900"`: CRLF-agnostic AST codemod in 80ms (0 LLM output tokens).
- `npx fullstack-audit --manifest <file:line>`: Generates zero-search agent handoff manifest.
- `npx fullstack-audit --watch`: Live background file watcher for continuous background sync.
- `npx fullstack-audit --dead`: Scans for potential orphaned components.
<!-- END_FRONTEND_AUDIT_RULE -->
<!-- END_FULLSTACK_AUDIT_RULE -->
