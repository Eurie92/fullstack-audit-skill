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


