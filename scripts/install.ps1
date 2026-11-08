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
foreach ($f in @("precision-patcher.ts", "adaptive-sniffer.ts", "reference-cataloger.ts")) {
    Invoke-WebRequest -Uri "$BaseUrl/scripts/$f" -OutFile (Join-Path $ScriptsDir $f)
}

$BinDir = Join-Path $TargetDir "bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Force -Path $BinDir | Out-Null }
Invoke-WebRequest -Uri "$BaseUrl/bin/audit.js" -OutFile (Join-Path $BinDir "audit.js")

# Construct rule block (same text as generateDynamicRuleBlock in scripts/audit.ts)
$RuleParts = [System.Collections.Generic.List[string]]::new()
$RuleParts.Add(@'
<!-- START_FULLSTACK_AUDIT_RULE -->
<!-- START_FRONTEND_AUDIT_RULE -->
## Fullstack Atlas (fullstack-audit)
This project has a pre-built code atlas in `docs/frontend-atlas/` and `docs/backend-atlas/`, served by the `fullstack-audit` MCP tools. Use it alongside normal search, not instead of it.

### Finding code
1. For structural questions, try the MCP tools first:
   - `fullstack_find`: routes, components, visible labels, query keys, API routes, DB models
   - `fullstack_locate_visual`: elements described by look (pulse dots, capsule pills, badges, icons)
   - `fullstack_path`: UI element -> server action / API route -> DB model
   - `fullstack_resolve`: loosely written file or component names; `fullstack_symbol`: line ranges inside large files
2. Confirm a hit by reading the file at that line. The atlas is a snapshot, so line numbers drift after edits.
3. If the atlas has no hit or the code changed since the last audit, use normal search: your Grep/Glob tools, `rg <pattern> <dir>`, or `git grep`.
4. On Windows, do not run `Get-ChildItem -Recurse` or `dir /s` on the project root: it walks `node_modules/` and `.next/` and can freeze for many seconds. Scope it to a folder (`Get-ChildItem src -Recurse`) or use `rg`.
5. Prefer the MCP tools over the `npx fullstack-audit` CLI; each CLI call starts the engine from scratch and takes seconds.
6. Screenshots: look up visible text or icon names with `fullstack_find` / `fullstack_locate_visual`. If a screenshot under `AppData\Local\Temp` cannot be opened, copy it into the project's `scratch/` folder first.

### Keeping the atlas fresh
- Run the `fullstack_audit` tool (or `/fullstack-audit`) after adding routes, pages, components or DB models, or when lookups look stale.

### Editing and verifying
- Edit with your normal edit tool. `fullstack_patch` is available when shell quoting gets in the way (for example PowerShell and `&`).
- Verify in proportion to the change: a style or copy tweak can rely on the dev server's hot reload; changes to types, exports, logic, backend, DB or auth need the typecheck and tests (`npm run typecheck`, `npm test`) before you call them done.
'@)
if ($enableSuper) { $RuleParts.Add(@'
- Do not claim a task is complete without fresh evidence (command output, exit code 0).
'@) }
if ($enablePonytail) { $RuleParts.Add(@'

### Keep changes small (ponytail)
- Solve the whole request with the least new code: reuse existing helpers and components, prefer platform features, no new dependency for a few lines, no unrequested options or abstractions.
- Never cut validation at trust boundaries, auth checks, data-loss error handling, or accessibility.
'@) }
if ($enableCaveman) { $RuleParts.Add(@'

### Reply style (caveman)
- Answer first, with exact technical facts. Skip filler, preamble and recap. End edit replies with the target `file:line`, the change, and the check you ran.
'@) }
$RuleParts.Add(@'

### Commands
- MCP tools: `fullstack_find`, `fullstack_locate_visual`, `fullstack_resolve`, `fullstack_path`, `fullstack_symbol`, `fullstack_patch`, `fullstack_audit`
- `/fullstack-audit` or `npx fullstack-audit`: rebuild the atlas and `docs/llms.txt`
- `npx fullstack-audit --theme --route <route> --compact`: design-token punchlist for one route
- `npx fullstack-audit --verify --gate-clean`: typecheck and atlas gate
- `npx fullstack-audit --diff`: architecture changes since the last scan
- `npx fullstack-audit --dead`: components that nothing imports
<!-- END_FRONTEND_AUDIT_RULE -->
<!-- END_FULLSTACK_AUDIT_RULE -->
'@)
$RuleBlock = $RuleParts -join "`n"

# Target files to update: AGENTS.md and CLAUDE.md (GEMINI.md is never auto-injected to prevent Antigravity token duplication)
$markerPattern = "(?s)(?:<!-- START_FULLSTACK_AUDIT_RULE -->.*?<!-- END_FULLSTACK_AUDIT_RULE -->|<!-- START_FRONTEND_AUDIT_RULE -->.*?<!-- END_FRONTEND_AUDIT_RULE -->)"
$legacyPattern = "(?s)##[ \t]*[^\r\n#]*?(?:Fullstack|Frontend) Architecture\s*&(?:amp;)?\s*Component Lookup[^\r\n]*.*?(?=(?:\r?\n---|\r?\n##\s+(?!Available Commands)[^\r\n]+)|\z)"

$TargetsToUpdate = [System.Collections.Generic.List[string]]::new()
if (Test-Path "AGENTS.md") { $TargetsToUpdate.Add("AGENTS.md") }
if (Test-Path "CLAUDE.md") { $TargetsToUpdate.Add("CLAUDE.md") }

# Only update GEMINI.md if it already explicitly contains the audit marker
if (Test-Path "GEMINI.md") {
    $fullGemini = (Resolve-Path "GEMINI.md").Path
    $geminiContent = [System.IO.File]::ReadAllText($fullGemini, [System.Text.Encoding]::UTF8)
    if ($geminiContent -match $markerPattern -or $geminiContent -match $legacyPattern) {
        $TargetsToUpdate.Add("GEMINI.md")
    }
}

if ($TargetsToUpdate.Count -eq 0 -and (-not (Test-Path "AGENTS.md"))) {
    $TargetsToUpdate.Add("AGENTS.md")
}

foreach ($target in $TargetsToUpdate) {
    if (Test-Path $target) {
        $fullPath = (Resolve-Path $target).Path
        $existing = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)

        if ($existing -match $markerPattern) {
            $updated = [System.Text.RegularExpressions.Regex]::Replace($existing, $markerPattern, [System.Text.RegularExpressions.MatchEvaluator]{ return $RuleBlock })
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "Cleanly updated Fullstack Architecture Rule in $target" -ForegroundColor Cyan
        } elseif ($existing -match $legacyPattern) {
            $updated = [System.Text.RegularExpressions.Regex]::Replace($existing, $legacyPattern, [System.Text.RegularExpressions.MatchEvaluator]{ return $RuleBlock })
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "Upgraded legacy Architecture Rule in-place in $target" -ForegroundColor Cyan
        } elseif ($target -ne "GEMINI.md") {
            $separator = if ($existing.EndsWith("`n")) { "`n" } else { "`n`n" }
            $updated = $existing + $separator + $RuleBlock + "`n"
            [System.IO.File]::WriteAllText($fullPath, $updated, $utf8NoBom)
            Write-Host "Injected Fullstack Architecture Rule into $target" -ForegroundColor Cyan
        }
    } else {
        $initialContent = "# $target $emDash Workspace Guidelines for AI Assistants`n`n$RuleBlock`n"
        [System.IO.File]::WriteAllText((Join-Path (Get-Location) $target), $initialContent, $utf8NoBom)
        Write-Host "Created $target with 100% Always-Active Fullstack Atlas rule!" -ForegroundColor Cyan
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
