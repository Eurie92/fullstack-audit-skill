# 🧠 Second Brain: Release Tiers, Versioning Governance & Playbook

> **The Permanent Operational Second Brain for `fullstack-audit-skill` and AI Pair-Programming.**  
> Grounded in the industry standards of **Next.js, Tailwind CSS, Vite, and Vue** (SemVer + Conventional Commits + Keep a Changelog).

---

## 🏷️ 1. The 3-Tier Release Governance Framework

Whenever any modification, fix, or feature is added to the repository, consult this tier matrix to determine the exact version increment:

```
                          v 2  .  9  .  0
                            │     │     │
   HIGH TIER (Major) ───────┘     │     └── LOW TIER (Patch)
   MEDIUM TIER (Minor) ───────────┘
```

| Tier | SemVer Category | Commit Prefix | Trigger Criteria | Release Title Badge |
| :--- | :--- | :--- | :--- | :--- |
| 🟢 **LOW** | **PATCH** (`+0.0.1`) | `fix:`, `perf:`, `docs:`, `refactor:` | Bug fixes, typo corrections, internal optimizations, documentation improvements. Zero new features, 100% backward compatible. | `[Low Tier / Patch]` |
| 🟡 **MEDIUM** | **MINOR** (`+0.1.0`) | `feat:`, `feat(engine):` | New capabilities, new CLI flags (`--setup-all`, `--find`), architectural enhancements (4-Phase Synergy Engine). 100% backward compatible. | `[Medium Tier / Minor]` |
| 🔴 **HIGH** | **MAJOR** (`+1.0.0`) | `feat!:`, `BREAKING CHANGE:` | Breaking API changes, altered configuration schema, dropped Node/framework support that breaks existing user projects. | `[High Tier / Major Breaking]` |

---

## ⚡ 2. The 4-Phase Synergy Engine Golden Rules

Before writing any code or answering user tasks, follow the **Orthogonal 4-Phase Pipeline**:

```
Phase 1: GPS / LOCATE (fullstack-audit)
  ➔ Atlas lookup first (fullstack_find / fullstack_locate_visual / fullstack_path MCP tools, or docs/frontend-atlas/ and docs/backend-atlas/)
  ➔ Confirm hits by reading the file; fall back to Grep / rg / git grep when the atlas has no hit or may be stale.
  ➔ On Windows, avoid Get-ChildItem -Recurse on the project root (walks node_modules).

Phase 2: DESIGN & KISS FIREWALL (ponytail)
  ➔ Does it need to exist? Skip unasked abstractions, wrappers, state machines, and extra options.
  ➔ Platform feature? Use standard web/DOM/Tailwind primitives over custom JavaScript trigonometry, 36-point polygon waves, or complex SVG math.
  ➔ Can it be one line? Make it one line a reader grasps at a glance.
  ➔ Shortest working diff wins. Deletion beats addition.

Phase 3: ZERO-FLUFF COMMUNICATION (caveman)
  ➔ Answer first: Dense result first, technical facts exact.
  ➔ Kill ceremony: Zero filler ("Sure, I can help!"), zero apologies, zero commentary between routine tool calls.
  ➔ Conclude with a Compact Diff Receipt: Target, Diff, Ponytail check, HMR status.

Phase 4: RIGHT-SIZED VERIFICATION (superpowers Dual-Speed)
  ➔ ⚡ Inner-Loop (UI/CSS/Layout/Copy ≤ 2 files, < 30 lines): Direct edit_file ➔ HMR.
     Hot reload is enough for pure style/copy tweaks; run the typecheck when types, props or exports change.
  ➔ 🛡️ Outer-Loop (Backend/DB/Auth Milestones): Rigorous verification gate (npx fullstack-audit --verify --gate-clean).
     Evidence before claims. Exit code 0 proof required.
```

---

## 📋 3. Step-by-Step Version Bump & Release Playbook

When shipping a new update, execute these exact steps in order:

### Step 1: Update Version Constants & Metadata
1. **`scripts/constants.ts`**:
   ```typescript
   export const FULLSTACK_AUDIT_VERSION = "X.Y.Z";
   export const FULLSTACK_AUDIT_ENGINE = "4-Phase Synergy Engine vX.Y.Z";
   export const FULLSTACK_AUDIT_RELEASE_DATE = "YYYY-MM-DD";
   ```
2. **`package.json`**:
   ```json
   "version": "X.Y.Z"
   ```
3. **`package-lock.json`**:
   ```bash
   npm.cmd install --package-lock-only
   ```
4. **`bin/audit.js`** (Fast-path fallback):
   ```javascript
   console.log("fullstack-audit vX.Y.Z (engine: 4-Phase Synergy Engine vX.Y.Z)");
   ```
5. **`SKILL.md`**:
   ```yaml
   version: X.Y.Z
   ```

### Step 2: Documentation & Badges
1. **`README.md`**:
   * Update badge: `[![Version: vX.Y.Z](https://img.shields.io/badge/Release-vX.Y.Z-emerald.svg)]`
   * Update matrix header: `## 🛠️ CLI Command Matrix (vX.Y.Z)`
2. **`docs/MASTER_USAGE_GUIDE.md`**:
   * Update title: `# 🚀 Unlocking the Full Potential of fullstack-audit (vX.Y.Z Master Guide)`
3. **`CHANGELOG.md`**:
   Add new entry adhering to Keep a Changelog:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD
   
   > **Release Tier**: `[LOW (Patch) | MEDIUM (Minor) | HIGH (Major)]`  
   > **Summary**: One-line executive summary of the release.
   
   ### ⚡ Added / 🐛 Fixed / 🚀 Changed
   * Detailed bullet points...
   ```

### Step 3: Multi-Harness Sync & Compilation Gate
1. Regenerate all harness rules:
   ```bash
   node bin/audit.js --setup-all
   ```
2. Run TypeScript strict typecheck:
   ```bash
   npx.cmd tsc --noEmit
   ```
3. Verify zero version drift:
   ```bash
   node bin/audit.js --check-update
   ```

### Step 4: Git Commit, Tag & Push
```bash
git add -A
git commit -m "feat(release): bump version to vX.Y.Z — <Summary Description>"
git push origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

### Step 5: Publish GitHub Release via GitHub CLI (`gh`)
Prepare release notes in a temporary scratch file or inline:
```bash
gh release create vX.Y.Z -F <path-to-notes.md> --title "vX.Y.Z — <Title with Key Features>"
# Or if GitHub Actions already auto-created a tag release shell:
gh release edit vX.Y.Z -F <path-to-notes.md> --title "vX.Y.Z — <Title with Key Features>"
```

### Step 6: Synchronize Target Projects (e.g. `xnight`)
When active in a project workspace using the skill:
1. Update `AGENTS.md` and `GEMINI.md`.
2. Sync `.agent/skills/fullstack-audit/` scripts, bin, and package.json.
3. Test version banner:
   ```bash
   node .agent/skills/fullstack-audit/bin/audit.js -v
   ```

---

## 🛠️ Essential Command Cheatsheet

| Task | Command |
| :--- | :--- |
| **Instant Version Check (<5ms)** | `npx fullstack-audit -v` / `--version` |
| **Detect Version Drift** | `npx fullstack-audit --check-update` |
| **Symbol Search** | `npx fullstack-audit --find "<query>" --compact` |
| **Setup All 5 Harnesses** | `npx fullstack-audit --setup-all` |
| **Theme Micro-Punchlist** | `npx fullstack-audit --theme --route <path> --compact` |
| **Verification Gate** | `npx fullstack-audit --verify --gate-clean` |
| **Architecture Delta** | `npx fullstack-audit --diff` |
| **Continuous Sync Watcher** | `npx fullstack-audit --watch` |
