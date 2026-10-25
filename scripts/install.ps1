# fullstack-audit-skill - One-line installer and updater (Windows / PowerShell)
#
# Usage:
#   # Recommended: Full Synergy Triad (Audit + Ponytail + Caveman + Superpowers)
#   iex (irm https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.ps1)
#
#   # Standalone Mode (Zero external dependencies):
#   & { $(irm https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.ps1) } -Standalone

param(
    [ValidateSet("triad", "standalone", "custom")]
    [string]$Profile = "triad",
    [switch]$Standalone,
    [switch]$WithPonytail,
    [switch]$WithCaveman,
    [switch]$WithSuperpowers,
    [switch]$NoPonytail,
    [switch]$NoCaveman,
    [switch]$NoSuperpowers
)

$ErrorActionPreference = "Stop"

# Ensure console and environment handle UTF-8 cleanly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

# Unicode symbols safely generated at runtime without non-ASCII source characters
$emojiMap     = ""
$emojiTool    = ""
$emojiInbox   = "[INFO]"
$emojiRefresh = "[UPDATE]"
$emojiLink    = "[INJECT]"
$emojiDoc     = "[CREATED]"
$emojiCheck   = "[OK]"
$emojiTip     = "[TIP]"
$emDash       = "-"

if ($Standalone) { $Profile = "standalone" }

$enablePonytail = ($Profile -eq "triad" -or $WithPonytail) -and (-not $NoPonytail)
$enableCaveman  = ($Profile -eq "triad" -or $WithCaveman)  -and (-not $NoCaveman)
$enableSuper    = ($Profile -eq "triad" -or $WithSuperpowers) -and (-not $NoSuperpowers)

if ($Profile -eq "standalone") {
    $enablePonytail = $false
    $enableCaveman  = $false
    $enableSuper    = $false
}

$isTriad = ($Profile -eq "triad") -and $enablePonytail -and $enableCaveman -and $enableSuper
$isStandalone = ($Profile -eq "standalone") -or ((-not $enablePonytail) -and (-not $enableCaveman) -and (-not $enableSuper))

$TargetDir = Join-Path (Get-Location) ".agent\skills\fullstack-audit"
$ScriptsDir = Join-Path $TargetDir "scripts"

if (-not (Test-Path $ScriptsDir)) {
    New-Item -ItemType Directory -Force -Path $ScriptsDir | Out-Null
}

$BaseUrl = "https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main"

Write-Host "$emojiInbox Installing / Updating fullstack-audit-skill (Profile: $($Profile.ToUpper()))..." -ForegroundColor Cyan

Invoke-WebRequest -Uri "$BaseUrl/SKILL.md" -OutFile (Join-Path $TargetDir "SKILL.md")
Invoke-WebRequest -Uri "$BaseUrl/scripts/audit.ts" -OutFile (Join-Path $ScriptsDir "audit.ts")
Invoke-WebRequest -Uri "$BaseUrl/scripts/audit-backend.ts" -OutFile (Join-Path $ScriptsDir "audit-backend.ts")
Invoke-WebRequest -Uri "$BaseUrl/scripts/constants.ts" -OutFile (Join-Path $ScriptsDir "constants.ts")

$BinDir = Join-Path $TargetDir "bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }
Invoke-WebRequest -Uri "$BaseUrl/bin/audit.js" -OutFile (Join-Path $BinDir "audit.js")

# Dynamically construct rule lines based on profile using safe Here-Strings
$RuleParts = [System.Collections.Generic.List[string]]::new()
$RuleParts.Add("<!-- START_FULLSTACK_AUDIT_RULE -->")
$RuleParts.Add("<!-- START_FRONTEND_AUDIT_RULE -->")

if ($isTriad) {
    $RuleParts.Add(@'
## Fullstack 4-Phase Synergy Engine (0ms Atlas • Ponytail KISS • Caveman Terse • Dual-Speed Verify)
Universal execution rule across all harnesses (**Antigravity, Cursor, Claude Code, Windsurf, Codex, OpenCode, VS Code**).

### The 4-Phase Operational Pipeline

#### Phase 1: GPS / Locate (`fullstack-audit`)
'@)
} elseif ($isStandalone) {
    $RuleParts.Add(@'
## Fullstack Atlas Engine (0ms Zero-Grep • Dual-Speed Verify)
Universal execution rule across all harnesses (**Antigravity, Cursor, Claude Code, Windsurf, Codex, OpenCode, VS Code**).

### The Operational Protocol

#### 1. GPS / Locate (`fullstack-audit`)
'@)
} else {
    $activePillars = [System.Collections.Generic.List[string]]::new()
    $activePillars.Add("0ms Atlas")
    if ($enablePonytail) { $activePillars.Add("Ponytail KISS") }
    if ($enableCaveman) { $activePillars.Add("Caveman Terse") }
    if ($enableSuper) { $activePillars.Add("Dual-Speed Verify") }
    $headerLine = "## Fullstack Modular Synergy Engine ($($activePillars -join ' • '))"
    $RuleParts.Add($headerLine)
    $RuleParts.Add(@'
Universal execution rule across all harnesses (**Antigravity, Cursor, Claude Code, Windsurf, Codex, OpenCode, VS Code**).

### The 4-Phase Operational Pipeline

#### Phase 1: GPS / Locate (`fullstack-audit`)
'@)
}

# Phase 1 GPS Content
$RuleParts.Add(@'
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
- **ONE-AND-DONE HARD STOP (Anti-Overinvestigation & Zero Double-Checking Mandate)**:
  - The moment ANY tool call, search hit, or atlas lookup reveals the matching `file:line` (e.g. `public-navbar.tsx:149` for "xnight"):
    - **IMMEDIATELY STOP ALL FURTHER TOOL CALLS.** Do not make another read, search, or check.
    - **FORBIDDEN (Sister-File Double-Checking)**: NEVER inspect related, sibling, or drawer components (e.g. `mobile-nav-drawer.tsx`, `header.tsx`, `footer.tsx`, `sidebar.tsx`) to "double check" or "be thorough" unless the user explicitly used the word "ALL" (e.g. "find ALL occurrences").
    - **FORBIDDEN (End-of-File Crawling)**: NEVER read further down or read to the end of the file once the target snippet is identified.
    - **FORBIDDEN (Redundant Verification Calls)**: NEVER run secondary searches, grep commands, or file reads to verify what you already found.
    - **MAX TOOL CALL BUDGET = 1**: For lookup queries ("where is X", "find Y in navbar", "locate button"), the agent must resolve in **1 tool call**, output the exact `file:line` snippet receipt, and conclude the response in that very turn.
'@)

$currPhase = 2

# Phase 2: Ponytail / Native KISS
if ($enablePonytail) {
    $p2Block = @'
#### Phase __PHASE__: Design & Anti-Overengineering Firewall (`ponytail`)
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
'@ -replace '__PHASE__', $currPhase
    $RuleParts.Add($p2Block)
    $currPhase++
} elseif ($isStandalone) {
    $p2Standalone = @'
#### __PHASE__. Implementation & Minimalist Discipline
- Solve the user request with the least code necessary. Reuse existing project helpers and primitives before adding new abstractions or dependencies.
- Surgical edits: keep modifications contained to the exact target files located via the atlas. Do not refactor untouched files.
'@ -replace '__PHASE__', $currPhase
    $RuleParts.Add($p2Standalone)
    $currPhase++
}

# Phase 3: Caveman
if ($enableCaveman) {
    $p3Block = @'
#### Phase __PHASE__: Communication & Zero-Fluff Receipts (`caveman`)
- **Answer First**: Dense result first, technical facts exact.
- **Kill Ceremony**: No conversational filler ("Sure, I can help with that!", "I apologize for the confusion"), no preamble, no postamble.
- **Tool Status**: Zero conversational commentary between routine tool calls.
- **Compact Diff Receipt**: Conclude replies with a tight diff receipt:
  - `Target`: `<file:line>`
  - `Diff`: `<old>` -> `<new>`
  - `Status`: `<HMR applied | Test pass count | Exit code>`
'@ -replace '__PHASE__', $currPhase
    $RuleParts.Add($p3Block)
    $currPhase++
}

# Phase 4: Superpowers or Dual-Speed Gate
if ($enableSuper) {
    $p4Block = @'
#### Phase __PHASE__: Right-Sized Verification (`superpowers` Dual-Speed Harmonization)
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
'@ -replace '__PHASE__', $currPhase
    $RuleParts.Add($p4Block)
} else {
    $p4Fallback = if ($isStandalone) {
        @'
#### __PHASE__. Dual-Speed Verification Loop
- **Inner-Loop (Fast Mode — 1 to 2s responses for edits <= 2 files, < 30 lines)**:
  - Perform direct surgical file edits (`npx fullstack-audit --patch` or `edit_file`). Let local dev server (Next.js/Vite/Nuxt HMR) refresh in 50ms.
  - Do NOT run full TypeScript compilation (`tsc --noEmit`) or heavy browser MCPs on micro-edits.
- **Outer-Loop (Checkpoint Verification Gate — Milestones/Backend/DB/Auth)**:
  - Run verification gates (`npm test`, `npm run typecheck`, or `npx fullstack-audit --verify --gate-clean`) before milestone commits.
  - **Zero Polling Invariant**: Do NOT loop on `manage_task status`. The harness features Reactive Wakeup and automatically resumes execution when tasks complete.
'@ -replace '__PHASE__', $currPhase
    } else {
        @'
#### Phase __PHASE__: Dual-Speed Verification Loop
- **Inner-Loop (Fast Mode — 1 to 2s responses for edits <= 2 files, < 30 lines)**:
  - Perform direct surgical file edits (`npx fullstack-audit --patch` or `edit_file`). Let local dev server (Next.js/Vite/Nuxt HMR) refresh in 50ms.
  - Do NOT run full TypeScript compilation (`tsc --noEmit`) or heavy browser MCPs on micro-edits.
- **Outer-Loop (Checkpoint Verification Gate — Milestones/Backend/DB/Auth)**:
  - Run verification gates (`npm test`, `npm run typecheck`, or `npx fullstack-audit --verify --gate-clean`) before milestone commits.
  - **Zero Polling Invariant**: Do NOT loop on `manage_task status`. The harness features Reactive Wakeup and automatically resumes execution when tasks complete.
'@ -replace '__PHASE__', $currPhase
    }
    $RuleParts.Add($p4Fallback)
}

# Available Commands Block
$RuleParts.Add(@'
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
'@)

$RuleBlock = $RuleParts -join "`n`n"

# Target files to update: AGENTS.md, GEMINI.md, and CLAUDE.md
$TargetsToUpdate = [System.Collections.Generic.List[string]]::new()
if (Test-Path "AGENTS.md") { $TargetsToUpdate.Add("AGENTS.md") }
if (Test-Path "GEMINI.md") { $TargetsToUpdate.Add("GEMINI.md") }
if (Test-Path "CLAUDE.md") { $TargetsToUpdate.Add("CLAUDE.md") }

if ($TargetsToUpdate.Count -eq 0) {
    $TargetsToUpdate.Add("AGENTS.md")
}

$markerPattern = "(?s)(?:<!-- START_FULLSTACK_AUDIT_RULE -->.*?<!-- END_FULLSTACK_AUDIT_RULE -->|<!-- START_FRONTEND_AUDIT_RULE -->.*?<!-- END_FRONTEND_AUDIT_RULE -->)"
$legacyPattern = "(?s)##[ \t]*[^\r\n#]*?(?:Fullstack|Frontend) Architecture\s*&(?:amp;)?\s*Component Lookup[^\r\n]*.*?(?=(?:\r?\n---|\r?\n##\s+(?!Available Commands)[^\r\n]+)|\z)"

foreach ($target in $TargetsToUpdate) {
    if (Test-Path $target) {
        $fullPath = (Resolve-Path $target).Path
        $existing = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)

        if ($existing -match $markerPattern) {
            $updated = [System.Text.RegularExpressions.Regex]::Replace($existing, $markerPattern, [System.Text.RegularExpressions.MatchEvaluator]{ return $RuleBlock })
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "$emojiRefresh Cleanly updated Fullstack Architecture Rule in $target" -ForegroundColor Cyan
        } elseif ($existing -match $legacyPattern) {
            $updated = [System.Text.RegularExpressions.Regex]::Replace($existing, $legacyPattern, [System.Text.RegularExpressions.MatchEvaluator]{ return $RuleBlock })
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "$emojiRefresh Upgraded legacy Architecture Rule in-place in $target" -ForegroundColor Cyan
        } else {
            $separator = if ($existing.EndsWith("`n")) { "`n" } else { "`n`n" }
            $updated = $existing + $separator + $RuleBlock + "`n"
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "$emojiLink Injected Fullstack Architecture Rule into $target" -ForegroundColor Cyan
        }
    } else {
        $initialContent = "# $target $emDash Workspace Guidelines for AI Assistants`n`n$RuleBlock`n"
        [System.IO.File]::WriteAllText((Join-Path (Get-Location) $target), $initialContent, $utf8NoBom)
        Write-Host "$emojiDoc Created $target with 100% Always-Active Fullstack Atlas rule!" -ForegroundColor Cyan
    }
}

# Mirror to .agent\skills\frontend-audit for 100% backward compatibility
$LegacyDir = Join-Path (Get-Location) ".agent\skills\frontend-audit"
$LegacyScriptsDir = Join-Path $LegacyDir "scripts"
$LegacyBinDir = Join-Path $LegacyDir "bin"
if (Test-Path $LegacyDir) {
    Copy-Item (Join-Path $TargetDir "SKILL.md") (Join-Path $LegacyDir "SKILL.md") -Force
    if (-not (Test-Path $LegacyScriptsDir)) { New-Item -ItemType Directory -Force -Path $LegacyScriptsDir | Out-Null }
    if (-not (Test-Path $LegacyBinDir)) { New-Item -ItemType Directory -Force -Path $LegacyBinDir | Out-Null }
    Copy-Item (Join-Path $ScriptsDir "audit.ts") (Join-Path $LegacyScriptsDir "audit.ts") -Force
    Copy-Item (Join-Path $ScriptsDir "audit-backend.ts") (Join-Path $LegacyScriptsDir "audit-backend.ts") -Force
    Copy-Item (Join-Path $ScriptsDir "constants.ts") (Join-Path $LegacyScriptsDir "constants.ts") -Force
    Copy-Item (Join-Path $BinDir "audit.js") (Join-Path $LegacyBinDir "audit.js") -Force
}

# Automatically protect project git repository from local atlas clutter
$GitIgnorePath = Join-Path (Get-Location) ".gitignore"
if (Test-Path $GitIgnorePath) {
    $giContent = [System.IO.File]::ReadAllText($GitIgnorePath, [System.Text.Encoding]::UTF8)
    $giEntries = @("docs/frontend-atlas/", "docs/backend-atlas/", "docs/llms.txt", "docs/llms-full.txt", "docs/graph.json", "docs/THEME_MIGRATION_PUNCHLIST.md")
    $missingEntries = [System.Collections.Generic.List[string]]::new()
    foreach ($entry in $giEntries) {
        if (-not $giContent.Contains($entry)) {
            $missingEntries.Add($entry)
        }
    }
    if ($missingEntries.Count -gt 0) {
        $giAppend = "`n# Fullstack Audit local architecture maps (AI navigation only)`n" + ($missingEntries -join "`n") + "`n"
        [System.IO.File]::AppendAllText($GitIgnorePath, $giAppend, $utf8NoBom)
        Write-Host "$emojiCheck Added local atlas paths to .gitignore (clean git repository protection)" -ForegroundColor Cyan
    }
}

Write-Host "$emojiCheck fullstack-audit-skill successfully installed / updated in .agent\skills\fullstack-audit!" -ForegroundColor Green
Write-Host "$emojiTip You can now type '/fullstack-audit' (or '/frontend-audit') directly in your AI chat." -ForegroundColor Yellow
