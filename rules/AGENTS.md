<!-- START_FULLSTACK_AUDIT_RULE -->
<!-- START_FRONTEND_AUDIT_RULE -->
## Fullstack 4-Phase Synergy Engine (0ms Atlas • Native MCP • Ponytail KISS • Caveman Terse)
Universal execution rule across all harnesses (Antigravity, Cursor, Claude Code, Windsurf, Codex, OpenCode, VS Code).

### The 4-Phase Operational Pipeline

#### Phase 1: GPS / Locate (fullstack-audit Native MCP & Atlas)
- **IRON GATE INVARIANT (Zero-Grep & Zero-Scratch Absolute Mandate across ALL Tasks)**:
  - **FORBIDDEN (All Recursive Searches)**: NEVER run `Get-ChildItem -Recurse` (under ANY parameters or subdirectories: 'app', 'components', 'src', -Filter, -Include, -Path), `Select-String`, `grep -r`, `rg`, `find`, or `dir /s`. Scoped subfolder recursive scans are EQUALLY BANNED. The Iron Gate Lifecycle Hook physically denies these calls.
  - **FORBIDDEN (Refactoring & Import Grep)**: NEVER use recursive grep to find imports, functions, or dependencies during refactoring. Use `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` or `fullstack_path` (sub-5ms causal tracer).
  - **FORBIDDEN (Inline Scratch Scripts)**: NEVER execute `node -e "const fs = require('fs')..."`, `python -c "..."`, or PowerShell `[IO.File]::ReadAllText` / `ForEach-Object` one-liners to locate, read, or patch files.
  - **FORBIDDEN (Path Guessing)**: NEVER guess paths or prepend arbitrary prefixes like `src/components/`.
  - **MANDATORY GPS FIRST-ACTION**: The FIRST action MUST locate the element deterministically:
    - **Native MCP Fast Find**: Call `fullstack_find(query: "<query>")` (sub-3ms token-compact lookup).
    - **Native MCP Visual & Icon Locator**: Call `fullstack_locate_visual(query: "<query>")` (0ms lookup for live pulse dots `animate-pulse`, capsule pills `rounded-full`, badges, action icons).
    - **Native MCP Fuzzy Case Resolver**: Call `fullstack_resolve(name: "<name>")` (prefix-agnostic casing & path resolver in 0ms).
    - **Native MCP Causal Path Tracer**: Call `fullstack_path(from: "<fromComponent>", to: "<toActionOrModel>")` (sub-5ms causal dependency path).
    - **Native MCP God-File Slicer**: Call `fullstack_symbol(symbol: "<method>")` (exact start/end lines before calling `read_file`).
    - **Native MCP Surgical Patcher**: Call `fullstack_patch(filePath: "<file>", target: "<old>", replacement: "<new>")` or `edit_file`.
    - **Pre-Computed Atlases**: Direct `read_file` on `docs/frontend-atlas/` (01 routes, 02 components, 03 tokens, 06 visible text, 07 icons) or `docs/backend-atlas/` (01 APIs, 02 DB models, 03 server actions, 04 auth).
    - **Terminal Fallback**: If MCP tools are unavailable, run `node bin/audit.js --find "<query>" --compact` or `npx.cmd fullstack-audit --find "<query>" --compact`.
- **Screenshot & Temp Image Armor**: When a user references a screenshot in `AppData\Local\Temp\orca-paste-*.png`:
  - **FORBIDDEN**: Never call `read_file` or `view_file` directly on `AppData\Local\Temp` paths (avoids OS hook sandbox interception).
  - **Fast-Path A (Visual Atlas)**: Call `fullstack_locate_visual(query: "<element>")` or view `docs/frontend-atlas/02_COMPONENT_INVENTORY.md` in 0ms without opening the image.
  - **Fast-Path B (Scratch Copy)**: If the raw screenshot must be viewed, copy first: `Copy-Item '<temp-path>' 'scratch\screenshot.png'`, then open `scratch\screenshot.png`.
- **PowerShell Quoting & Surgical Patching**:
  - When running terminal commands, wrap PowerShell arguments in single-quotes `'...'` (prevents `&` reserved character syntax crash and variable expansion).
  - To edit code: Prefer `edit_file` or `fullstack_patch` native tool (CRLF-agnostic surgical patcher).
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
  - Perform direct surgical file edits (`fullstack_patch` or `edit_file`). Let local dev server (Next.js/Vite/Nuxt HMR) refresh in 50ms.
  - **HARD FORBIDDEN**: Do NOT run full TypeScript compilation (`tsc --noEmit`, `npm run typecheck`).
  - **HARD FORBIDDEN**: Do NOT run `npm run audit` or `fullstack_audit` on micro-edits.
  - **HARD FORBIDDEN**: Do NOT invoke Superpowers process skills (`brainstorming`, `writing-plans`, `test-driven-development`).
  - **HARD FORBIDDEN**: Do NOT invoke multiple design skills in parallel.
  - **HARD FORBIDDEN**: Do NOT invoke heavy browser automation (Chrome DevTools MCP / Puppeteer) or curl localhost.
  - **Response Time**: Return immediately to the user in 1–2 seconds.
- **Outer-Loop (Checkpoint Verification Gate — Milestones/Backend/DB/Auth)**:
  - Superpowers Iron Law applies: *No completion claims without fresh verification evidence.*
  - Run `fullstack_audit` or test suites (`npm test`, `npm run typecheck`).
  - Claim completion ONLY with fresh exit code 0 evidence.
  - **Zero Polling Invariant**: Do NOT loop on `manage_task status`. The harness features Reactive Wakeup and automatically resumes execution when tasks complete.
  - Run `fullstack_audit` or `npm run audit` upon milestone completion to synchronize atlases.

### Available MCP Tools & CLI Commands (v2.14.0 Multi-Harness Engine)
- **Native MCP Tools**:
  - `fullstack_find`: Sub-3ms token-compact lookup for symbols, components, routes, queries, APIs.
  - `fullstack_locate_visual`: 0ms visual element locator (pulse dots, capsule pills, status badges, icons).
  - `fullstack_resolve`: Fuzzy case-insensitive component & file path resolver.
  - `fullstack_path`: Sub-5ms causal execution path finder (UI button -> Action -> DB model).
  - `fullstack_symbol`: Line-bound surgical slicer for functions/methods in God-files.
  - `fullstack_patch`: CRLF-agnostic surgical patcher.
  - `fullstack_audit`: Refreshes the Fullstack Atlas in the active project.
- **CLI Commands**:
  - `/fullstack-audit` or `npm run audit`: Regenerates the entire Fullstack Atlas and root `llms.txt` / `llms-full.txt`.
  - `node bin/audit.js --find <query> --compact`: Ultra-fast query mode for AI agents.
  - `node bin/audit.js --theme --route <route> --compact`: Generates a route-scoped micro-punchlist.
  - `node bin/audit.js --verify --gate-clean`: Smart multi-target verification gate.
<!-- END_FRONTEND_AUDIT_RULE -->
<!-- END_FULLSTACK_AUDIT_RULE -->
