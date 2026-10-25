# Changelog

All notable changes to the **Fullstack Audit Skill** (`fullstack-audit`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.15.0] - 2026-10-26

> **Release Tier**: `MINOR (Hardware Anti-Grep Lifecycle Hook & Zero-Forced Injection Engine)`  
> **Summary**: Introduces native Antigravity PreToolUse Lifecycle Hook (`hooks.json` + `scripts/anti-grep-gate.js`) physically denying slow recursive commands (`Get-ChildItem -Recurse`, `Select-String`, `grep -r`, `rg`, `find`) before PowerShell spawns. Hardens prompt guidelines to close scoped-recursion and refactoring loopholes with 100% interception accuracy in 100-run empirical benchmarks. Completely eliminates forced rule injection into `GEMINI.md` across installers and self-updaters, respecting developer workspace clean state.

### Added
* **Antigravity PreToolUse Iron Gate Hook (`hooks.json` & `scripts/anti-grep-gate.js`)**:
  * Native lifecycle hook intercepting `run_command` before terminal process instantiation.
  * Achieved 100.0% interception rate (50/50) against all variations of recursive searches (`Get-ChildItem 'app' -Recurse`, `Select-String`, `grep -rn`, `rg`, `findstr /s`).
  * 0.0% false positive rate on legitimate developer commands (`git`, `npm`, `tsc`, `audit`).
  * Denies execution with structured error instructing the agent on the exact zero-grep atlas alternative.
* **Empirical Gate Benchmark Engine (`scripts/benchmark-gate.ts`)**:
  * 100-run verification suite testing forbidden command interception and legitimate pass-through.

### Changed
* **Universal Recursive Ban Rule Hardening (`rules/AGENTS.md`, `scripts/audit.ts`)**:
  * Explicitly prohibits scoped recursive directory scans (`Get-ChildItem 'app' -Recurse`, `components`, `src`).
  * Broadens ban across ALL tasks (refactoring, import dependency tracking, bug investigations).
  * Directs AI agents to `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` and `fullstack_path` for import tracing.

### Fixed
* **Zero-Forced Rule Injection (`scripts/audit.ts`, `scripts/install.ps1`, `scripts/install.sh`)**:
  * Removed `GEMINI.md` from default auto-injection candidates.
  * Eliminated forced `else` rule append fallback in `syncAgentRulesInPlace` and `executeUniversalSetup`.
  * Files without existing audit markers are strictly skipped to prevent token bloat and preserve project cleanliness.

---

## [2.14.1] - 2026-10-25

> **Release Tier**: `PATCH (Automated Dev-to-Plugin Synchronization & Consumer Context Compaction)`  
> **Summary**: Introduces an automated dev-to-plugin mirroring script (`npm run sync:plugin`) to keep active harness plugins instantly in sync with development commits in zero friction. Cleans up redundant fullstack audit instruction blocks from consumer SaaS projects where the global plugin is active, recovering 3,000+ prompt tokens per invocation turn.

### Added
* **Dev-to-Plugin Sync Script (`scripts/sync-plugin.ps1`)**:
  * Added `npm run sync:plugin` to automatically synchronize `bin/`, `scripts/`, `rules/`, and package manifests directly to the global Antigravity plugin directory (`~/.gemini/config/plugins/fullstack-audit/`).

---

## [2.14.0] - 2026-10-25

> **Release Tier**: `MINOR (LRU Cache, Causal Graph, Multiline Screenshot-to-Code & Bootstrap Quarantine)`  
> **Summary**: Implements the top 3 architectural recommendations from the 500-run empirical benchmark on `xnight` and fixes the multiline JSX label extraction engine for screenshot-to-code targeting. Introduces an in-memory 256-entry LRU cache dropping p99 lookup latency from 3.71ms to <0.05ms, serializes pre-computed UI-to-DB causal dependency graphs directly into `.atlas-index.json` for 0ms path tracing, resolves arrow-function attribute truncation traps in `<a onClick={(e) => ...}>` and multiline Framer Motion headlines (`<motion.h1>`), and enforces automatic `.gitignore` quarantine on daemon bootstrap.

### Added
* **In-Memory LRU Cache (`FastLRUCache`)**:
  * Implemented zero-dependency `FastLRUCache` (256 capacity) in `mcp-server` for instant `<0.05ms` responses on repeated visual elements, tokens, and symbol queries.
  * Auto-flushes cache on atlas regeneration.
* **Pre-Computed Causal Graph in `.atlas-index.json`**:
  * Serialized bi-directional UI-to-DB causal adjacency graphs (components -> API endpoints / actions -> database models) directly into `.atlas-index.json`.
  * Accelerated `fullstack_path` to pure in-memory BFS execution without reading disk files.
* **Automatic Bootstrap Gitignore Quarantine**:
  * Guaranteed immediate repository isolation on daemon startup by auto-appending local atlas paths and benchmark files to `.gitignore`.
* **Multiline JSX & Screenshot-to-Code Engine**:
  * Replaced naive `[^>]*` tag matching with `extractJsxElement`, a brace- and quote-aware JSX parser that correctly skips arrow function handlers (`onClick={(e) => ...}`) and multiline attribute formatting.
  * Full support for Framer Motion typography (`motion.h1`-`motion.h6`, `motion.p`, `motion.button`).
  * Automatic uppercase alias indexing when `uppercase` utility class is present.
  * Punctuation-normalized scoring (`qNorm` / `symNorm`) in fast find and visual locator, preventing OCR punctuation discrepancies from returning zero matches.

---

## [2.13.5] - 2026-10-24

> **Release Tier**: `PATCH (One-and-Done Hard Stop & Anti-Overinvestigation Mandate)`  
> **Summary**: Solves the real-world agent "double-checking disease" where LLMs take 30+ seconds reading sister files (e.g., `mobile-nav-drawer.tsx` when `public-navbar.tsx:149` is already found). Enforces an unbreakable One-and-Done Hard Stop mandate with a Max Tool Call Budget of 1 for localization queries, cutting wall-clock lookup latency from 30s to <1s.

### Added
* **One-and-Done Hard Stop Law**:
  * Added strict invariant in `rules/AGENTS.md` and harness rules: The moment any tool reveals the matching `file:line`, the agent must immediately terminate further tool execution.
  * Formally forbade sister-component double-checking, end-of-file reading, and secondary verification searches.
  * Enforced a hard limit of **1 tool call max** for element lookups.
* **Synchronized CLAUDE.md across Workspaces**:
  * Deployed `CLAUDE.md` to consumer repositories (`xnight`) so Claude Code natively ingests the strict stop invariant without falling back to sequential file-reading habits.

---

## [2.13.4] - 2026-10-24

> **Release Tier**: `PATCH (Git Repository Isolation, Root Cleanliness & Dual-Speed Workflow)`  
> **Summary**: Guarantees zero Git pollution across consumer repositories (such as `xnight`) by automatically appending local atlas paths to `.gitignore`. Eliminates all root clutter by moving `llms.txt` and `llms-full.txt` into `docs/` and cleaning up legacy root files. Formally documents the Dual-Speed operating protocol (Micro-Edits vs Milestone Refreshes) in `README.md`.

### Added
* **Automatic .gitignore Repository Protection**:
  * `scripts/install.ps1` and `scripts/audit.ts` automatically detect and ensure `docs/frontend-atlas/`, `docs/backend-atlas/`, `docs/llms.txt`, and related artifacts are in `.gitignore` so they never pollute Git commits or pull requests.
* **Zero Root Clutter Guarantee**:
  * Moved Answer.AI `llms.txt` and `llms-full.txt` strictly into `docs/` (`docs/llms.txt` and `docs/llms-full.txt`), removing all file pollution from the project root.

### Changed
* **README Dual-Speed Workflow Clarification**:
  * Explicitly distinguished between daily micro-edits (sub-3ms lookup, zero re-audits needed) and milestone completions (running `/fullstack-audit` only after completing major features or schema changes).

---

## [2.13.3] - 2026-10-24

> **Release Tier**: `PATCH (Two-Option Zero-Friction Installation & Complete Emoji Elimination)`  
> **Summary**: Completely bans all icons/emojis across `README.md` for a clean, minimalist developer experience. Consolidates onboarding into exactly two ultra-simple paths: Option 1 (Ask Your AI Agent via GitHub link) and Option 2 (Universal Terminal One-Liner via PowerShell/Bash). Removes NPX commands and per-harness JSON fragments from the primary setup guide.

### Added
* **First-Time Initialization Guide**:
  * Added clear run-once step (`/fullstack-audit`) right after installation to build the initial index in ~300ms, establishing complete zero-maintenance automation thereafter.
* **Ask Your AI Agent Setup (Option 1)**:
  * Universal prompt for Antigravity, Cursor, Claude Code, and Codex: `Install this plugin: https://github.com/Eurie92/fullstack-audit-skill`.
* **Universal Terminal One-Liner (Option 2)**:
  * Windows PowerShell: `iex (irm https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.ps1)`.
  * macOS / Linux: `curl -fsSL https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.sh | bash`.

### Changed
* **Complete Icon & Emoji Ban**:
  * Stripped 100% of decorative emojis, icons, and glyphs from `README.md`.
* **Zero-NPX Cleanup**:
  * Removed all confusing NPX CLI references from the primary installation flow.

---

## [2.13.2] - 2026-10-24

> **Release Tier**: `PATCH (Universal Installation Prominence & Zero Decorative Emojis)`  
> **Summary**: Restores universal installation one-liners to the very top of `README.md`, replaces all hardcoded machine paths with portable workspace paths, strips all decorative emoji clutter, and tucks updating instructions inside collapsible details.

### Fixed
* **Universal Harness Paths in README**:
  * Removed machine-specific path references (`C:/Users/EURIE/...`) from Cursor, Claude Code, and OpenCode setup guides, replacing them with standard portable paths (`node .agent/skills/fullstack-audit/bin/mcp-server.js`).
* **Zero Decorative Emoji Enforcement**:
  * Stripped all decorative emoji icons from `README.md` to maintain strict professional documentation integrity and full compliance with `GEMINI.md`.

### Changed
* **Installation Prominence**:
  * Moved the 1-line installation commands (PowerShell, bash, and npx) directly to the top of `README.md` for immediate developer onboarding.
  * Tucked updating instructions and Windows execution policy troubleshooting inside `<details>` tabs.

---

## [2.13.1] - 2026-10-24

> **Release Tier**: `PATCH (CTA Link Indexing, Hook Lag Elimination & 200-Run Benchmark)`  
> **Summary**: Fixes visible label indexing blindspot for `<a>` and `<Link>` CTA buttons (e.g. `Explore 12 Dispensers`), eliminates the 10–17s tool hook delay from `orca-status`, enforces an unbypassable Immediate Relinquishment rule against over-investigation, moves `llms.txt` to opt-in to keep project roots 100% clean, and publishes the 200-Run Empirical Benchmark on the `xnight` SaaS codebase demonstrating a 3,016x median speedup (0.43ms vs 1,289ms).

### Added
* **🏷️ Action Links & Interactive CTA Indexing**:
  * Extended AST parser in `scripts/audit.ts` to index `<a ...>`, `<Link ...>`, and `<NuxtLink ...>` visible text and child `<span>` elements as `"Action Link / CTA"`.
  * Fixes screenshot targeting for anchor-based buttons (e.g. `Explore 12 Dispensers` at `storefront-hero.tsx:71`), resolving in 0ms.
* **📊 200-Run Empirical Benchmark (`docs/BENCHMARK_200_XNIGHT_REPORT.md`)**:
  * Added `scripts/benchmark-xnight.ts` testing 200 live queries across `xnight`.
  * Measured **0.43 ms median latency** for Native MCP vs **1,289.81 ms** for file-by-file search (3,016x faster) and 99.97% context token savings (4.5k vs 17.7M tokens).

### Fixed
* **⚡ Pre-Tool Hook Latency Elimination**:
  * Shielded `antigravity-pre-tool-use.cmd` and `antigravity-post-tool-use.cmd` in `~/.orca/agent-hooks/`, eliminating the 10–17 second hang and exit status 1 error on every tool execution.
* **🧹 Root Directory Zero-Clutter Mandate**:
  * Made `llms.txt` and `llms-full.txt` generation opt-in via `--llms`, preventing automatic creation of unrequested root files during routine audits.

### Changed
* **🛑 Immediate Relinquishment Rule Hardening (`rules/AGENTS.md`)**:
  * Enforced strict stop condition: Once target `file:line` is located, the agent must output the receipt and stop immediately without crawling parent wrappers or layout trees.
* **📖 Beginner-Friendly `README.md` Overhaul**:
  * Added 7-tool interactive cheat sheet table and 10-second setup guide across Antigravity, Cursor, Claude Code, and OpenCode.
  * Collapsed updating instructions and Windows execution policy troubleshooting inside `<details>` tabs.

---

## [2.13.0] - 2026-10-24

> **Release Tier**: `MINOR (Global Antigravity Plugin & Native In-Memory MCP Server)`  
> **Summary**: Introduces native Model Context Protocol (MCP) server running as a persistent stdio background daemon, exposing 7 instant in-memory tools (`fullstack_find`, `fullstack_locate_visual`, `fullstack_resolve`, `fullstack_path`, `fullstack_symbol`, `fullstack_patch`, `fullstack_audit`). Transforms Fullstack Audit into a global Antigravity plugin with zero-touch system prompt rule injection, completely eliminating PowerShell execution policy errors, npm 404 registry failures, and command-line quoting crashes.

### Added
* **⚡ Native MCP Stdio Daemon (`bin/mcp-server.js` & `scripts/mcp-server.ts`)**:
  * Persistent JSON-RPC 2.0 background daemon (~20MB RAM) delivering sub-3ms in-memory queries with zero process initialization overhead.
  * Native tools exposed to AI coding agents:
    * `fullstack_find`: Sub-3ms inverted index search across components, queries, test assertions, and database models.
    * `fullstack_locate_visual`: 0ms visual element locator (pulse dots, capsule pills, status badges, icons).
    * `fullstack_resolve`: Fuzzy prefix-agnostic component and file resolver.
    * `fullstack_path`: Sub-5ms causal execution path finder (`UI Trigger ➔ API Route ➔ DB Model`).
    * `fullstack_symbol`: Exact start and end line bounds for functions inside God-files (>500 lines).
    * `fullstack_patch`: CRLF-safe string replacement tool immune to PowerShell syntax errors.
    * `fullstack_audit`: Refreshes and updates both frontend and backend atlases in the active project.
* **🌐 Global Antigravity Plugin Architecture**:
  * Manifest configurations: `plugin.json`, `gemini-extension.json`, and `mcp_config.json`.
  * `rules/AGENTS.md`: Always-on global rules automatically loaded into the system prompt across all projects on the machine.
  * Clean Hands Policy: Eliminates the requirement to modify or inject rules into project-level `GEMINI.md` or `AGENTS.md` files.

### Changed
* **CLI Reference & Invariant Updates**:
  * Updated `README.md`, `SKILL.md`, and `docs/MASTER_USAGE_GUIDE.md` to reflect native MCP tools and v2.13.0 architecture.
  * Preserved full backwards compatibility with all existing CLI commands (`npm run audit`, `node bin/audit.js`, `--find`, `--theme`, etc.).

---

## [2.12.3] - 2026-10-24

> **Release Tier**: `PATCH (Installer Hardening, Multi-Guideline Rule Sync & Windows Execution Policy Armor)`  
> **Summary**: Hardens the automated installers (`install.ps1`, `install.sh`) and self-updater (`--update`) to guarantee that `constants.ts` and `bin/audit.js` are downloaded and that the Iron Gate Anti-Grep Mandate is always injected cleanly into all guideline files (`AGENTS.md`, `GEMINI.md`, `CLAUDE.md`). Adds comprehensive Windows PowerShell execution policy armor (`npx.ps1` fix) to `README.md`.

### Fixed
* **Multi-Guideline Rule Sync (`syncAgentRulesInPlace`)**:
  * Fixed `syncAgentRulesInPlace()` in `scripts/audit.ts` to iterate through and update **all** existing guideline files (`AGENTS.md`, `GEMINI.md`, `CLAUDE.md`) simultaneously rather than halting after the first match.
* **Self-Updater Asset Completeness (`executeSelfUpdate`)**:
  * Updated `executeSelfUpdate()` in `scripts/audit.ts` to download `scripts/constants.ts` and `bin/audit.js` alongside `audit.ts`, preventing version drift during CLI self-updates.
* **Installer Rule Block Synchronization**:
  * Synchronized `scripts/install.ps1` and `scripts/install.sh` with the verified **Iron Gate Anti-Grep Mandate** and updated command headers to `v2.12.3`.
  * Added `bin/audit.js` download and mirroring to both installer scripts.

### Added
* **Windows Execution Policy Armor & Update Guide**:
  * Added dedicated **Updating the Skill** section to `README.md` documenting 4 distinct update methods (PowerShell RAM one-liner, direct Node execution, `npx.cmd`, and bash).
  * Added **Windows Troubleshooting** guide explaining the root cause of `npx.ps1 cannot be loaded` and providing 1-second solutions (`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` or using `npx.cmd`).

---

## [2.12.2] - 2026-10-24

> **Release Tier**: `PATCH (Rule Hardening & Anti-Grep Iron Gate Mandate)`  
> **Summary**: Hardens workspace rules across all harnesses with an unbypassable Iron Gate invariant prohibiting all recursive directory searches (`Get-ChildItem -Recurse`, `grep -r`, `find`) and inline scratch scripts (`node -e fs`), fixes regex replacement expansion corruption in rule injection, and cleanly aligns `AGENTS.md` and `GEMINI.md` across repositories.

### Fixed
* **Regex Replacement String Hazard**:
  * Fixed string replacement in `scripts/audit.ts` (`legacyPattern.replace(..., () => ruleBlock)`) to always use an arrow function replacer, preventing JS `$'` backreference expansion from corrupting markdown files during rule injection.
  * Completely repaired and restored corrupted nested markdown duplication in `xnight/GEMINI.md`.

### Added
* **🛑 Iron Gate Invariant (Zero-Grep & Zero-Scratch Mandate)**:
  * Absolute prohibition on `Get-ChildItem -Recurse` under ANY flag or parameter (`-Path`, `-Filter`, `-Include`, `-Directory`), `grep -r`, `rg`, `find`, or `dir /s`.
  * Absolute prohibition on inline scratch scripts: `node -e "const fs = require('fs')..."`, `python -c`, or PowerShell `[IO.File]::ReadAllText` one-liners.
  * Explicit mandatory alternatives: `npx fullstack-audit --find` (sub-3ms), `--locate-visual` (0ms), `--resolve` (prefix-agnostic 0ms), `--path` (sub-5ms), and `--symbol`.

### Changed
* **Workspace Guideline Synchronization**:
  * Synchronized clean `v2.12.2` guidelines across `AGENTS.md`, `GEMINI.md`, and all internal `.agent/skills/` configurations.

---

## [2.12.1] - 2026-10-24

> **Release Tier**: `PATCH (Performance & Repository Hygiene Refinement)`  
> **Summary**: Converts `docs/graph.json` generation into an opt-in `--graph` switch, keeps knowledge graph files out of Git tracking to prevent Windows command-line buffer overflow, and implements zero-dependency in-memory path tracing.

### Changed
* **Opt-In Knowledge Graph Export (`--graph`)**:
  * `docs/graph.json` is no longer generated by default during standard audits, keeping consumer repositories 100% clean and preventing 10,000-line Git bloat.
  * Users desiring Graphify / NetworkX integration explicitly run `npx fullstack-audit --graph` to emit the file.
* **Zero-File In-Memory Path Tracer**:
  * Enhanced `npx fullstack-audit --path` to dynamically synthesize in-memory causal dependency graphs from `06_FULLSTACK_CROSS_REFERENCE_MAP.md` and `.atlas-index.json` in <2ms if `docs/graph.json` is absent.
* **Git Cleanliness & Windows Buffer Armor**:
  * Added `docs/graph.json` to `.gitignore` to prevent IDE GUI staging crashes (*"Antigravity prompt is too large for the Windows command line"*).

---

## [2.12.0] - 2026-10-24

> **Release Tier**: `MEDIUM (Minor Feature & Architecture Expansion)`  
> **Summary**: Introduces **Visual 0ms Element Locator (`--locate-visual`)**, **Causal Path Tracer (`--path <from> <to>`)**, **NetworkX / Graphify Knowledge Graph Export (`docs/graph.json`)**, **Prefix-Agnostic File Resolver**, **3-Tier Fullstack Dead Code Ledger (`--dead`)**, and **Apache License 2.0 Enterprise Legal Fortification**.

### Added
* **Visual 0ms Element Locator (`--locate-visual <query>`)**: Sub-3ms instant locator for live status dots (`animate-pulse`), capsule pills (`rounded-full`), status badges, and action icons without reading screenshots or consuming LLM tokens.
* **Causal Path Tracer (`--path <from> <to>`)**: In-memory Breadth-First Search (BFS) path finder executing in <5ms, tracing causal execution paths from UI components to Server Actions, API endpoints, Prisma models, and cache invalidation keys.
* **NetworkX / Graphify Knowledge Graph Export (`docs/graph.json`)**: Automatically serializes the entire codebase topology into standard NetworkX `node_link_data` schema during audit generation, delivering framework-aware semantics (Next.js boundaries, React Query invalidations, DB models) directly to Graphify.
* **Prefix-Agnostic File Resolver (`--resolve`)**: Enhanced fuzzy resolver to automatically strip accidental leading `src/`, `app/`, or `./` prefixes, resolving paths like `src/components/public/PublicFooter.tsx` directly to `components/public/PublicFooter.tsx` in 0ms.
* **Fullstack Dead Code Engine Upgrade (`--dead`)**: Expanded `--dead` with 3-tier risk classification (🟢 Zero Risk, 🟡 Low Risk, 🔴 Verification Recommended) and uncalled God-file symbol detection with exact line bounds.
* **Apache License 2.0 Enterprise Fortification**: Upgraded repository license from MIT to Apache License 2.0, providing an express patent license grant, patent retaliation defense, trademark protection, and root `NOTICE` file for Eurie Paulino.

### Fixed
* **Consumer Repo Rule Contamination (`xnight`)**: Purged tool-development SemVer release playbooks and Execution Brief ceremony from consumer applications, establishing a mandatory 1-2s Fast Mode Inner-Loop for UI micro-edits.
* **`tsconfig.json` Path Hallucination Trap (`xnight`)**: Removed `"rootDir": "src"` and aligned `include` paths with reality to prevent AI assistants from guessing non-existent `src/components/` paths.
* **Screenshot Sandbox Crash Armor**: Added explicit rule guardrails forbidding direct tool reads on `AppData\Local\Temp\orca-paste-*.png` to prevent OS sandbox hook rejections.

---

## [2.11.2] - 2026-10-24

> **Release Tier**: `PATCH (CI/CD Pipeline Hardening & Idempotent Release Workflow)`  
> **Summary**: Fixes GitHub Actions release workflow race condition by replacing `softprops/action-gh-release` with native, idempotent `gh` CLI release synchronization.

### Fixed
* **GitHub Release Workflow Race Condition (`.github/workflows/release.yml`)**:
  * Replaced third-party `softprops/action-gh-release@v2` with GitHub's native `gh` CLI.
  * Added idempotent release detection via `gh release view`: if a release already exists (created concurrently or pre-published), the workflow cleanly synchronizes release notes and exits with code 0 instead of failing with HTTP 422 `already_exists`.

---

## [2.11.1] - 2026-10-24

> **Release Tier**: `PATCH (Developer Experience & Documentation Refinement)`  
> **Summary**: Introduces **Prominent Top-Level Installation Section**, **AI Chat-First Prompt Cheat Sheet**, **Demystification of Terminal `npx` vs. In-Chat Usage**, and **PowerShell Single-Quoted Here-String Installer Fix**.

### Added
* **Prominent Installation Block in README**: Positioned directly beneath the Overview for instant copy-paste onboarding across Windows (PowerShell), macOS/Linux (Bash), and zero-install `npx`.
* **AI Chat-First Prompt Cheat Sheet**: Added a 10-point mapping table in `README.md` showing natural language developer prompts alongside autonomous AI primitives (0ms atlas queries, `--symbol` line slicing, `--diff`, `--verify`).
* **CLI Scope Boundary Clarification**: Clarified that developers never need to memorize or run `npx` commands in the terminal while coding; the terminal CLI is purely optional for manual atlas inspection and CI/CD pipelines.

### Fixed
* **PowerShell Remote Installer Parser Crash (`scripts/install.ps1`)**: Replaced backtick-escaped double-quoted strings with PowerShell single-quoted Here-Strings (`@' ... '@`) to eliminate `ExpectedValueExpression` crashes when invoked via `iex (irm ...)`.
* **Framework Test Suite Version Assertion (`scripts/test-frameworks.ts`)**: Replaced hardcoded version checks with dynamic `package.json` resolution, ensuring automated CI smoke tests pass cleanly across version bumps.

---

## [2.11.0] - 2026-10-23

> **Release Tier**: `MEDIUM (Minor Feature & Developer Experience Release)`  
> **Summary**: Introduces **In-Chat Quickstart First (`/fullstack-audit`)**, **Windows PowerShell Execution Armor (`npx.cmd` & policy remediation)**, **100-Run Production Verification Benchmark Suite against `xnight` (0.18ms p50, 12,760x speedup)**, and a **Complete Minimalist Documentation Overhaul (zero decorative emojis, typography-first architecture)**.

### Added
* **In-Chat First Quickstart**: Positioned `/fullstack-audit` directly in AI chat (Antigravity, Cursor, Claude Code, Windsurf) as the primary zero-terminal user experience.
* **100-Run Production Verification Suite (`test/benchmark-100.ts`)**:
  * Evaluated 100 verified production cases against `xnight` across UI labels, fuzzy casing resolution, God-file line slicing, and fullstack cross-reference traces.
  * Measured live telemetry: 0.18ms median lookup latency, 99% accuracy rate, and 98% token reduction.
  * Auto-generates `docs/BENCHMARK_100_REPORT.md`.
* **When to Use: Development Lifecycle Guide**: Added explicit operational guidance for Before Development (Orientation), During Development (Surgical Slicing), and After Development (Verification & Secret Leak Auditing).
* **Division of Labor Architecture**: Formalized the separation between Developer actions (natural language prompts) and AI Assistant actions (autonomous sub-3ms AST primitives under the hood).

### Changed
* **Minimalist Documentation Overhaul**:
  * Stripped all decorative emojis and icon clutter from `README.md`, `SKILL.md`, and `docs/MASTER_USAGE_GUIDE.md`.
  * Implemented clean, typography-first hierarchy modeled after high-star repositories (TypeScript, Biome, Vitest, Ripgrep).
  * Streamlined top-level navigation, moving deep-dive links to a curated index at the bottom.
* **Brand Positioning & Naming Harmony**:
  * Defined product identity as **Living Fullstack Atlas & 0ms GPS Companion** powered by the `fullstack-audit` engine, resolving the "one-time audit" misconception while preserving 100% backward compatibility with CLI binaries and packages.

### Fixed
* **Windows PowerShell `PSSecurityException` (`npx.ps1`)**:
  * Documented and provided direct execution armor using `npx.cmd fullstack-audit` to bypass default Windows `Restricted` script execution policies without requiring Administrator privileges.
  * Added documentation for `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force` ecosystem standard.

> **Release Tier**: `MEDIUM (Minor Feature & Architecture Expansion)`  
> **Summary**: Introduces **Modular Skill Installation Profiles** (Triad vs. Standalone Mode), **CRLF-Agnostic Surgical Patch Engine (`--patch`)**, **Fuzzy Component & Casing Resolver (`--resolve`)**, **Backend God-Files Line Slices (`--symbol`)**, **Pre-Indexed Test Suites & Coverage Map (`12_TEST_SUITES_AND_COVERAGE_MAP.md`)**, and **Windows PowerShell Quoting Armor & Anti-Freeze Guardrails**.

### 🎛️ Added: Modular Installation Profiles
* **Profile A: 🚀 Full Synergy Triad (`triad` - Recommended)**: Combines `fullstack-audit`, `ponytail`, `caveman`, and `superpowers` for maximum token efficiency (**~92% token reduction**).
* **Profile B: ⚡ Standalone Mode (`--standalone`)**: Zero external dependencies. Installs `fullstack-audit` with built-in minimalist inner-loop fast mode, zero mentions of missing skills, and natural courteous AI voice.
* **Profile C: 🎯 Selective Profiles**: Composable flags (`--with-ponytail`, `--with-caveman`, `--with-superpowers`, `--no-superpowers`, `--no-caveman`, `--no-ponytail`).
* **Dynamic Rule Synthesis (`generateDynamicRuleBlock`)**: Dynamically synthesizes and re-indexes rules across `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, and `.cursor/rules/fullstack-audit.mdc` without broken references or regex `$` substitution bugs.

### ⚡ Added: Latency Elimination & Surgical Tooling
* **CRLF-Agnostic Surgical Patch Engine (`npx fullstack-audit --patch <file> --target "<old>" --replace "<new>"`)**:
  * Automatically normalizes `\r\n` (Windows CRLF) and `\n` (POSIX LF) for flawless patching.
  * Immune to PowerShell `&` syntax crashes (e.g. `'Help & support'`), `$`, and quotes by bypassing `cmd.exe` shell concatenation.
  * Completely eliminates the need for temporary scratch patching scripts (`scratch/patch-*.js`).
* **Fuzzy Component & File Resolver (`npx fullstack-audit --resolve <name>`)**:
  * Case-insensitive, hyphen-agnostic, extension-agnostic file resolver.
  * Resolves casing confusion (e.g. `connect-modal` ➔ `components/ConnectModal.tsx`) in **0ms**, stopping 16-second recursive directory scans.
* **Backend God-Files & Method Line Slices (`npx fullstack-audit --symbol <method>`)**:
  * Computes exact start and end line ranges (e.g. `L145-L225`) for functions and methods in massive monolithic service files (>500 lines).
  * Replaces 5 fragmented pagination `read_file` calls with 1 targeted read, saving 15,000+ context tokens.
* **Pre-Indexed Test Suites Map (`12_TEST_SUITES_AND_COVERAGE_MAP.md`)**:
  * Pre-indexes all `describe(...)` and `it(...)` test titles and lines across `*.test.ts`, `*.spec.tsx`, and `test/` suites.
  * Links test failure strings directly to `.atlas-index.json`. Running `npx fullstack-audit --find "<failure-string>" --compact` returns the exact test file and line in sub-3ms, completely avoiding 50,000-line Jest snapshot dumps.
* **Database Table-to-ORM Aliasing Bridge**:
  * Automatically parses Prisma `@@map("table_name")` and Drizzle schema table exports.
  * Maps raw SQL table names (`table:orders`) directly to ORM model declarations, server actions, and UI triggers in `02_DATABASE_MODELS_AND_SCHEMA.md` and `06_FULLSTACK_CROSS_REFERENCE_MAP.md`.

### 🛡️ Fixed & Hardened
* **The PowerShell `-Exclude` Trap Guardrail**: Added explicit rules and documentation warning AI agents that `Get-ChildItem -Path '.' -Recurse -Exclude 'node_modules'` does NOT prune recursion on Windows, freezing the shell for 15–30s with Defender filter driver overhead.
* **Reactive Wakeup Invariant**: Strictly prohibited `manage_task status` polling loops in Phase 4 rules, saving up to 3,000,000 context re-send tokens per background job.
* **Windows `bin/audit.js` Shell Concatenation Fix**: Switched to direct `node` invocation with `shell: false` when local `tsx` is present, eliminating `DEP0190` security deprecation warnings and shell operator explosions.

---

## [2.9.0] - 2026-10-23

> **Release Tier**: `MEDIUM (Minor Feature & Architecture Release)`  
> **Summary**: Introduces the **4-Phase Synergy Engine** unifying `fullstack-audit`, `ponytail`, `caveman`, and `superpowers` into an unstoppable, anti-overengineering AI coding pipeline with 1–2 second response times.

### ⚡ Added
* **The 4-Phase Operational Synergy Engine (`AGENTS.md`, `GEMINI.md`, `CLAUDE.md`, `.cursor/rules/`)**:
  * **Phase 1: GPS / Locate (`fullstack-audit`)**: Instant 0ms lookup via pre-computed Markdown atlases; zero-grep mandate; immediate relinquishment once target `file:line` is acquired.
  * **Phase 2: Design & Anti-Overengineering Firewall (`ponytail`)**: Mandatory gatekeeper enforcing KISS, YAGNI, shortest working diff, and native web/Tailwind primitives over custom JavaScript trigonometry, 36-point polygon waves, or unneeded abstractions.
  * **Phase 3: Communication & Zero-Fluff Receipts (`caveman`)**: Dense result first, zero conversational apologies, zero filler commentary between tool calls, concluded with a compact diff receipt.
  * **Phase 4: Right-Sized Verification (`superpowers` Dual-Speed Harmonization)**:
    * ⚡ **Inner-Loop Fast Mode (1–2s responses)**: Direct surgical file edits (`edit_file`). Next.js/Vite HMR refreshes in 50ms. Strictly bans `tsc --noEmit`, `npm run typecheck`, intermediate audits, browser MCPs, and parallel design skill cascades on micro-edits.
    * 🛡️ **Outer-Loop Milestone Gate**: Rigorous verification gates (`npx fullstack-audit --verify --gate-clean`) run exclusively on milestone checkpoints or explicit user command.
* **Auto-Injection Upgrade**:
  * Updated `install.ps1`, `install.sh`, and `npx fullstack-audit --setup-all` to automatically inject the complete 4-Phase Synergy Engine into all harnesses with safe HTML delimiter boundaries.

---

## [2.8.0] - 2026-10-22

### 🌐 Added
* **Universal Multi-Harness Auto-Generator (`npx fullstack-audit --setup-all`)**:
  * One-click configuration across all leading AI coding harnesses (**Antigravity, Cursor IDE, Claude Code CLI, Hermes Agent, OpenCode**).
  * Auto-generates `.cursor/rules/fullstack-audit.mdc` with `alwaysApply: true` so Cursor Composer and Agent mode enforce Zero-Grep lookups on every prompt without requiring manual `@` mentions.
  * Auto-generates `.claude/commands/` (`/audit`, `/find`, `/diff`, `/theme`, `/verify`) with `$ARGUMENTS` and updates `CLAUDE.md` cleanly without busting Anthropic's 90% prompt caching discount.
  * Auto-scaffolds `skills/audit/fullstack-audit/SKILL.md` conforming to the `agentskills.io` standard for Nous Research's Hermes Agent with auto-registered slash commands.
  * Auto-scaffolds `.opencode/skills/` and `.opencode/commands/` for terminal agent harnesses.
  * Updates root `AGENTS.md` and backward-compatible mirrors with safe, idempotent delimiter markers.

* **Sub-3ms Local Inverted Index (`.atlas-index.json`) — Beating Cloud Decision Models ("Jev" / "Jeb")**:
  * Added lightweight, pre-indexed flat companion index in `docs/frontend-atlas/.atlas-index.json` and `docs/backend-atlas/.backend-index.json`.
  * `npx fullstack-audit --find <query> [--compact]` now loads the in-memory inverted index directly, returning exact file:line matches in **1–3 milliseconds** without re-parsing ASTs.
  * 100% offline, $0 token cost, 0ms network latency, and 0% hallucination risk compared to cloud-based discriminative models.

* **Version Transparency & Drift Radar (`--version`, `-v`, `--check-update`)**:
  * Added instant `<5ms` CLI flag: `npx fullstack-audit -v` / `--version` powered by fast-exit interceptor in `bin/audit.js`.
  * Added `npx fullstack-audit --check-update` to detect version drift between installed skill versions and project Atlas baselines (`.last_receipt.json`).
  * Injected provenance watermark stamps in the headers of all 19+ generated Frontend and Backend Atlas markdown files (`<!-- Generated by fullstack-audit v2.8.0 on 2026-10-22 -->`).
  * Unified internal version constants across `scripts/constants.ts`, `audit.ts`, and `audit-backend.ts`.

* **Installer Synchronization (`install.ps1` & `install.sh`)**:
  * Updated Windows PowerShell and Linux/macOS one-line installers to download and mirror `scripts/constants.ts` alongside core scripts.

---

## [2.7.0] - 2026-10-22

### 💥 Added
* **Fullstack Route Complexity & Blast-Radius Radar (`11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md`)**:
  * Evaluates composite complexity (0-100) and blast-radius risk across all frontend routes based on component import depth, disclosed overlays (modals/drawers), network API requests, and reactive query/cache invalidation footprints.
  * Assigns blast-radius tiers: `🚨 Critical Blast Radius (Score 65-100)`, `⚡ Moderate Impact (Score 35-64)`, and `🟢 Low / Isolated (Score 0-34)`.
  * Embeds the Blast Radius badge directly into `01_ROUTES_AND_PANELS_MAP.md` for instant zero-grep visibility.
  * Enhances `npx fullstack-audit --manifest <file:line>` with `blast_radius_safety` block and proactive pre-modification safety checklists for AI agents.
  * Tested on production SaaS `xnight`: cataloged 50 routes, identifying 5 Critical Blast-Radius routes (e.g. `/admin/suppliers`, `/admin/inventory`, `/admin/orders`).

* **Automated Stale Invalidation & Cache Hygiene Radar (`09_QUERY_AND_CACHE_MAP.md`)**:
  * Cross-references mutation triggers and query keys to identify **Orphaned Invalidation Targets**—mutations invalidating keys that have 0 active `useQuery` subscribers in the codebase.
  * Flags **Unlinked Dynamic Queries** that fetch data from dynamic endpoints but have no mutation invalidators, warning developers of stale UI state.

* **Architecture Delta Inspection Engine (`npx fullstack-audit --diff`)**:
  * Added `--diff` CLI flag to compare current codebase state against previous baseline (`.last_receipt.json`).
  * Emits an executive ASCII delta summary tracking additions and reductions in routes, god files, hardcoded hexes, rogue colors, and reactive queries.

* **Deterministic Byte-Stable Content Hashing**:
  * Stabilized atlas generation with deterministic Git commit hashes, preventing wall-clock timestamp drift and maximizing Anthropic and OpenAI KV prompt-cache hit rates (saving up to 90% input tokens across sessions).

* **Multi-Framework Automated Test Matrix Expansion**:
  * Added automated Test 11 in `scripts/test-frameworks.ts` covering route complexity scoring, cache hygiene detection, and `--diff` execution.
  * Total test matrix expanded to **74/74 tests passed (100% success rate)**.

---

## [2.6.0] - 2026-10-22

### 🔐 Added
* **Next.js Secret Leak & Client Env Radar (`07_ENV_AND_SECRETS_MAP.md`)**:
  * Statically analyzes all source files for environment variable accesses (`process.env.*`, `import.meta.env.*`).
  * Distinguishes client-side scope (`"use client"` directives, UI component trees, client SPAs) from server runtime (`app/api/`, RSCs, server actions, CLI scripts).
  * Automatically flags non-public environment variables referenced in client-side code (`🚨 CRITICAL` for sensitive keys like `STRIPE_SECRET_KEY`, `DATABASE_URL`, `ADMIN_API_KEY`; `⚠️ WARNING` for private config variables stripped to `undefined` in browser bundles).
  * Scans `.env.example`, `.env.sample`, `.env.template`, and `.env.local.example` to detect **Shadow (Undocumented) Variables**—critical environment variables actively used in code but absent from documentation, preventing deployment and CI/CD runtime crashes.
  * Tested on production SaaS `xnight`: cataloged 93 environment variables, verified 0 client leaks, and surfaced 63 undocumented shadow variables with file:line pointers.

* **Monolithic God-File Complexity Radar & Surgical Slicer (`10_GOD_FILES_SURGICAL_MAP.md`)**:
  * Automatically flags monolithic source files exceeding 500 lines or 25KB that cause LLM attention degradation and blow context windows.
  * Parses large files into discrete functional slices (React components, sub-components, custom hooks, service classes, exported functions, and type definitions) with exact start and end line ranges (`L{start}-L{end}`).
  * Calculates per-slice token costs and context savings percentages (typically saving **88% to 99.8% of input tokens** per surgical read!).
  * Enhances `npx fullstack-audit --manifest <file:line>` to detect when a target line resides inside a god file, emitting exact containing slice bounds and the optimal surgical read command (e.g. `read_file StartLine: 245 EndLine: 253`).
  * Enhances `npx fullstack-audit --find <query> --compact` to return matching surgical slices in single-line format (`[slice] Name (Type, Lstart-Lend) ➔ path (X% saved)`).
  * Tested on production SaaS `xnight`: mapped 94 monolithic god files totaling 99,318 lines (~1,017,726 tokens) into 767 surgical slices with an average context savings of **88.0%**.

* **API Contract & Payload Drift Detector (`06_FULLSTACK_CROSS_REFERENCE_MAP.md`)**:
  * Inspects frontend request payloads (`fetch`, `axios`, API clients) and compares sent object keys against backend endpoint expected parameters (`request.json()`, Zod schemas, destructuring).
  * Detects stealth casing drift between snake_case and camelCase (e.g. client sending `order_id` when the server expects `orderId`).
  * Surfaces high-severity warnings in `06_FULLSTACK_CROSS_REFERENCE_MAP.md` under `## ⚠️ API Contract & Payload Drift Radar` with clickable links to frontend triggers and backend handlers.
  * Tested on production SaaS `xnight`: successfully caught 4 real-world casing drift issues between `/app/admin/orders/page.tsx` and `/app/api/admin/orders/purge/route.ts`.

* **Automated Multi-Framework Test Matrix Expansion**:
  * Added automated Test 10 in `scripts/test-frameworks.ts` validating secret leak detection, god-file surgical slicing, and contract drift detection.
  * Total test suite expanded to **65/65 tests passed (100% success rate)** across Next.js (App & Pages Router), Vite React, Nuxt 3, SvelteKit, Astro, Remix, and React Router v7.

---

## [2.5.0] - 2026-10-22

### 🔄 Added
* **TanStack React Query & Cache Invalidation Topology (`09_QUERY_AND_CACHE_MAP.md`)**:
  * Statically analyzes `@tanstack/react-query`, `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`, `useMutation`, and custom event invalidation routers (such as `invalidateQueriesForEvent`).
  * Catalogs active query keys, query function API endpoints, parameter scoping (`Scoped` vs `Global`), and invalidation triggers.
  * Links mutation invalidations to active queries via prefix matching (e.g. `["customer"]` invalidates `["customer", "{id}", "vault"]`).
  * Generates interactive Mermaid reactive dependency graphs (`flowchart LR`) visualizing mutators ➔ invalidation keys ➔ re-fetched queries.
  * Includes Cache Hygiene & Stale State Radar flagging mutations that omit query invalidation.
* **Deep API Route Handler to Domain Service Cross-Reference Linker**:
  * Deepens `docs/backend-atlas/06_FULLSTACK_CROSS_REFERENCE_MAP.md` beyond route handlers to trace imported domain service classes and functions (e.g. `CatalogService.getCatalog()`, `OrderService.getOrderByCode()`, `AccountService.listAccounts()`).
  * Traverses service module imports to identify underlying database tables and SQL queries touched by domain services.
  * Renders end-to-end fullstack traces: `Frontend UI Trigger` ➔ `API Route Target` ➔ `Domain Service / Method` ➔ `Database Models`.
* **Symbol Centrality PageRank Ranking**:
  * Computes in-degree reference and import graphs across all components, API routes, and database entities.
  * Assigns centrality badges: `🔥 Core`, `⭐ Common` / `⭐ Active`, `📌 Standard`, `⚪ Leaf`.
  * Re-ranks `02_COMPONENT_INVENTORY.md`, `01_API_ROUTES_AND_ENDPOINTS.md`, and `02_DATABASE_MODELS_AND_SCHEMA.md` so primary high-traffic architecture backbones appear at the top.
  * Enhances `npx fullstack-audit --find <query>` to sort results by symbol centrality score and display matching query keys and invalidation events.
* **Multi-Framework Automated Test Matrix Expansion**:
  * Added automated test suite for reactive state parsing, domain service linking, and centrality ranking.
  * Verified **50/50 tests passing (100% success)** across Next.js (App & Pages Router), Vite React, Nuxt 3, SvelteKit, Astro, Remix, and React Router v7.

---

## [2.4.0] - 2026-10-22

### 🗄️ Added
* **Raw SQL Migrations & Supabase DDL Parser**:
  * Statically analyzes `.sql` migration files across `migrations/`, `db/migrations/`, and `supabase/migrations/` when Prisma or Drizzle are absent or used alongside them.
  * Robust AST/paren-aware tokenizer catalogs `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN`, column types (`UUID`, `SERIAL`, `TEXT`, `NUMERIC`, `JSONB`, `TIMESTAMPTZ`), primary keys, nullability, and foreign key relationships (`REFERENCES`).
  * Tested on production SaaS `xnight` (`C:\Users\EURIE\Dev\SaaS\xnight`), successfully detecting **79 database models** and resolving 179 cross-reference triggers.
* **Ghost & Redirect Alias Route Resolver**:
  * Statically analyzes single-line redirect shims (e.g. `import { redirect } from "next/navigation"; redirect("/admin/...")` or `NextResponse.redirect(...)`).
  * In `docs/frontend-atlas/01_ROUTES_AND_PANELS_MAP.md`, marks the boundary clearly as `🔀 Redirect ➔ /destination`, preventing AI assistants from editing dummy redirect shims.
* **Smart Multi-Target `tsconfig` & Script-Aware Verification Gate**:
  * Upgrades `npx fullstack-audit --verify` to automatically honor `package.json` `"typecheck"` scripts and auto-select multi-target configs (`tsconfig.check.json`, `tsconfig.app.json`, `tsconfig.web.json`) before falling back to `tsconfig.json`.
  * Solves multi-target projects (e.g. Telegram bot worker vs Next.js web application).
* **Answer.AI `llms.txt` Standard & `llms-full.txt` Generator (`--llms`)**:
  * Implemented `npx fullstack-audit --llms` and automatic generation during fullstack audits.
  * Outputs standardized root `llms.txt` (following the official Answer.AI specification) with project overview, key routes, design tokens, and API endpoints.
  * Generates `llms-full.txt` combining high-density summaries of all frontend and backend atlas documents into a single consolidated file for external LLMs and agent harnesses.
* **Deterministic LLM Prompt-Cache Stability**:
  * Preserves verification receipt timestamps across runs when metrics have not changed, eliminating unnecessary git diffs and ensuring 100% LLM KV prompt-cache prefix hit rates.
* **Next.js Root `app/` Discovery**:
  * Fixed framework auto-discovery in projects with both a `src/` directory (for backend services or bot workers) and a root `app/` directory (for Next.js App Router).

---

## [2.3.0] - 2026-10-21

### ⚡ Added
* **Universal Dual-Speed Loop Protocol**:
  * **Inner-Loop Fast Mode (1–2s responses)**: Separates active UI/styling/copy iterations from heavy compile/browser tasks. AI agents perform direct surgical file edits (`edit_file`) and let local dev server Hot Module Reload (HMR at `localhost:3000`) refresh in 50ms.
  * **Deferred Verification Gates**: Full TypeScript compilation (`tsc --noEmit`) and verification gates (`--verify --gate-clean`) are deferred to task checkpoints, pre-commits, or when explicitly requested by the developer.
  * **Zero Heavy Browser MCP Overhead**: Deprecates mandatory headless browser MCP commands (Chrome DevTools MCP / Puppeteer) for routine styling edits, eliminating background hook timeouts and lag.
  * **Harness-Agnostic AI Workspace Guidelines**: Updated `AGENTS.md` and `SKILL.md` to ensure identical fast-loop behavior across **Antigravity, Cursor, Claude Code, Windsurf, Codex, and VS Code**.
* **Modular In-Repository Documentation Deep-Dives**:
  * Added [`docs/HOW_IT_WORKS.md`](docs/HOW_IT_WORKS.md): Complete architectural breakdown of the Single-Pass AST parser, Next.js Component Boundary Radar, Tailwind JIT Color Matrix, CRLF-agnostic codemod engine, and Stanford/Princeton research token economics.
  * Added [`docs/MULTI_AGENT_RECIPES.md`](docs/MULTI_AGENT_RECIPES.md): Concrete multi-agent orchestration recipes covering Zero-Search Handoff Manifests (`--manifest`), 4-Zone Rebrand Swarms (`--multi-agent`), Route Micro-Punchlists, and Closed-Loop Anti-Hallucination Gates.
* **Streamlined Developer README**:
  * Refactored `README.md` for maximum developer ergonomics: 3-second quickstart, concise core value points, updated CLI matrix, and clean documentation navigation bar.

---

## [2.2.0] - 2026-10-21

### 🎨 Added
* **Inline Style Radar**: Evaluates JSX dynamic inline styles (`style={{ background: p.color }}`) and CSS gradients (`radial-gradient(...)`).
* **Root CSS Scanner**: Statically indexes custom CSS variables and surface highlight classes (`.xn-obsidian-surface`) directly from `globals.css`.
* **CRLF-Agnostic AST Codemod Engine**: Natively handles Windows CRLF (`\r\n`) and LF (`\n`) disk transformations in 80ms with 0 LLM output tokens via `npx fullstack-audit --migrate-theme`.
* **Multi-Agent Partition Engine**: Added `--multi-agent` flag to partition large codebases into 4 isolated, non-overlapping architectural zone briefs (`ZONE_STOREFRONT.md`, `ZONE_OVERLAYS.md`, `ZONE_PRIMITIVES.md`, `ZONE_PORTALS.md`) while maintaining `--solo` single-agent mode as the ultra-fast default.

---

## [2.1.0] - 2026-10-21

### 🚀 Added
* **Route-Scoped Micro-Punchlists (`--theme --route <route> --compact`)**: Reduces punchlist output by 99.8% (< 40ms execution) for single-screen workflows.
* **Deterministic Anti-Hallucination Gate (`--verify --gate-clean`)**: Exits with process status code 1 if rogue hardcoded colors remain in the target scope, preventing hallucinations from passing CI.
* **Empirical Benchmarks & Academic Research Grounding**: Head-to-head empirical proof on a 448-file Next.js 15 App Router repository (9,053x faster total benchmark time, 85.7% token reduction) grounded in Princeton SWE-bench localization error research and Stanford "Lost in the Middle" attention degradation principles.

---

## [2.0.0] - 2026-10-21

### 💥 Breaking Changes
* Rebranded package and commands from `frontend-audit-skill` to **`fullstack-audit-skill`** (`fullstack-audit`).

### 🌐 Added
* **Universal Backend Atlas Engine (`docs/backend-atlas/`)**:
  * `01_API_ROUTES_AND_ENDPOINTS.md`: App/Pages API route handlers, HTTP methods, and params.
  * `02_DATABASE_MODELS_AND_SCHEMA.md`: Prisma models and Drizzle ORM schemas, fields, and relations.
  * `03_SERVER_ACTIONS_AND_MUTATIONS.md`: Next.js Server Actions (`"use server"`) and mutations.
  * `04_AUTH_AND_MIDDLEWARE_GUARDS.md`: Route matchers, public vs. protected routes.
  * `05_INTEGRATIONS_AND_WEBHOOKS.md`: Third-party services (Stripe, Resend, Supabase, S3).
  * `06_FULLSTACK_CROSS_REFERENCE_MAP.md`: Bi-directional bridge linking frontend UI triggers directly to backend server actions and database models.
* **Live Pulse Dots & Capsule Pill Inventories**: Added dedicated catalogs for `animate-pulse` status indicators and `rounded-full` pills in `02_COMPONENT_INVENTORY.md`.
* **Universal JIT Color Matrix**: Expands color token extraction across all 22+ Tailwind color families, arbitrary hexes, and dark mode asymmetries.

---

## [1.7.0] - 2026-10-20

### 🧩 Added
* **Universal Multi-Framework Discovery**: Added static discovery for **Nuxt 3**, **SvelteKit**, **Astro**, and **Remix / React Router v7** in addition to Next.js and Vite React SPAs.
* Added automated framework test matrix (`scripts/test-frameworks.ts`).

---

## [1.6.0] - 2026-10-20

### 🔧 Added
* **Dynamic Skill Auto-Discovery**: Automatically indexes 50+ workspace skills across project root and global harnesses.
* **CLI Self-Updater**: Added `npx fullstack-audit --update` to fetch latest GitHub releases.
* **Idempotent UTF-8 Rule Sync**: Safe rule injection into `AGENTS.md`, `GEMINI.md`, and `CLAUDE.md`.

---

## [1.5.0] - 2026-10-20

### ⚡ Added
* **Next.js Component Boundary Radar**: Statically tags components as `[Client ⚡]` or `[Server 🖥️]` to prevent hydration mismatches.
* **Screenshot-to-Code Visual Icon Index**: Cataloged action icons (Lucide, Radix, Tabler, SVGs) in `07_VISUAL_AND_ICON_INDEX.md`.
* **Inter-Skill Dispatch Gateway**: Added `08_DISPATCH_GATEWAY.md` for routing architectural findings to specialized skills.
* **Verification Gate (`--verify`)**: First implementation of closed-loop TypeScript compilation and metric delta tracking.

---

## [1.4.0] - 2026-10-20

### 🔍 Added
* **Screenshot-to-Code Visible Text Index**: Cataloged all visible UI text, headings, and labels in `06_VISIBLE_TEXT_AND_LABELS_MAP.md`.
* **2-Level Component Tree Crawling**: Detailed child component hierarchy in `01_ROUTES_AND_PANELS_MAP.md`.

---

## [1.3.0] - 2026-10-19

### 👻 Added
* **Dead Component Finder**: Added `05_DEAD_ORPHANED_COMPONENTS.md` for safe removal of abandoned UI files.
* **Live File Watcher (`--watch`)**: Continuous background synchronization on file save.

---

## [1.2.0] - 2026-10-19

### ♿ Added
* **Button Accessibility Fast-Check**: Detects missing `aria-label`s on icon buttons and missing explicit `type="button"`.
* **Token-Compact Search (`--find`)**: Instant sub-second component query mode.

---

## [1.0.1] - 2026-10-19

### 🚀 Added
* Initial open-source release supporting Next.js (App & Pages Router) and Vite React SPAs.
* Generation of `docs/frontend-atlas/` with route maps and Tailwind color catalogs.
