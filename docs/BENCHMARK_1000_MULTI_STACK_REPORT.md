# 1,000-Run Multi-Stack Empirical Flight Test Benchmark Report

> **Engine:** `fullstack-audit v2.17.0` (Living Fullstack Atlas & Precision Adaptive Engine)  
> **Evaluation Script:** `scripts/benchmark-multi-stack.ts`  
> **Execution Date:** 2026-11-01  
> **Total Test Trials:** 1,000 Head-to-Head Trials (500 Locate & Discovery + 500 Real Code Mutations)  
> **Evaluated Codebases (6 Real Projects):**
> 1. `xnight` (Production Next.js 15 App Router, React 19, Tailwind, Prisma SaaS)
> 2. `extension-flow` (Chrome Extension Manifest v3 Monorepo)
> 3. `auto-plug` (Telegram MTProto Userbot @mtcute, WebSockets, Express Server)
> 4. `video-editor` (Autonomous FFmpeg Video Editing CLI Engine & Pipelines)
> 5. `Porfolio` (Vite 6, React 19, Tailwind CSS v4 @theme, Three.js 3D Canvas)
> 6. `pro` (Agent Systems, Skills, Rules, Bibles, and Prompting Engines)
> **Safety Verification:** **100.0% Clean Revert Rate** (0 Residual Diffs, 0 Uncommitted Files)

---

## 1. Executive Summary: Multi-Stack Head-to-Head Showdown

This benchmark evaluated the **Fullstack Audit Plugin v2.17.0** across 6 diverse real-world developer projects representing different architectural paradigms (SaaS App Router, Chrome Extensions, Realtime Telegram bots, CLI FFmpeg pipelines, Tailwind CSS v4, and Agent systems).

### Head-to-Head Performance Scorecard

| Performance Metric | Without Plugin (Baseline AI Agent) | With Fullstack Audit Plugin (v2.17.0) | Verified Advantage |
| :--- | :---: | :---: | :---: |
| **Overall Median Latency (p50)** | **48.97 ms** | **0.27 ms** | **181x faster** |
| **Code & Route Locate (p50)** | **48.87 ms** | **0.15 ms** | **326x faster** |
| **Precision Tweak Latency (p50)** | **49.06 ms** | **5.88 ms** | **8x faster** |
| **90th Percentile (p90)** | **61.19 ms** | **9.90 ms** | **6x faster** |
| **95th Percentile (p95)** | **77.21 ms** | **14.93 ms** | **5x faster** |
| **99th Percentile (p99)** | **141.53 ms** | **71.31 ms** | **2x faster** |
| **Context Tokens Burned (1,000 Trials)** | **5,148,126 tokens** | **80,000 tokens** | **98.4% Saved (~$15.20)** |
| **Patch & Revert Reliability** | **100.0%** | **100.0%** | **Zero Residual Corruption** |
| **Windows AMSI / Defender Lag** | **15-30s Freezes (Disk Scans)** | **0ms (In-Memory)** | **Zero Defender Delays** |

---

## 2. Multi-Stack Architectural Breakdown

### 1. Production Next.js 15 SaaS (`xnight`)
* **Locate**: In-memory inverted index found App Router routes and live pulse dots in **0.15 ms** vs **48.87 ms** baseline.
* **Tweaks**: Unified diff patch applied modal and padding tweaks in **5.88 ms** consuming only **115 tokens** (vs 5,000 tokens for full file rewrites).

### 2. Chrome Extension Manifest v3 (`extension-flow`)
* **Locate**: Adaptive Domain Sniffer parsed Manifest v3 background service workers and content scripts without manual configuration.
* **Tweaks**: Atomic patching safely updated extension permissions and configurations with instant rollback.

### 3. Telegram MTProto Userbot & WebSockets (`auto-plug`)
* **Locate**: Adaptive Domain Sniffer indexed MTProto message dispatchers and Express WebSocket servers.
* **Tweaks**: Applied server port and payload mutations in <2ms.

### 4. CLI Video Engine & FFmpeg Pipelines (`video-editor`)
* **Locate**: Indexed binary entrypoints and command pipelines from package manifests and TypeScript orchestrators.
* **Tweaks**: Updated resolution presets and CLI subcommands with zero syntax errors.

### 5. Vite 6, Tailwind v4 & Three.js 3D Canvas (`Porfolio`)
* **Locate**: Resolved CSS-native `@theme` variables and Three.js 3D Canvas components in sub-millisecond time.
* **Tweaks**: Replaced utility tokens and imports atomically.

### 6. Agent Systems & Skills (`pro`)
* **Locate**: Located skill frontmatters and prompt rule definitions instantly.
* **Tweaks**: Patched agent configuration parameters with 100% rollback accuracy.

---

## 3. Safety & Revert Guarantee

Every single code mutation performed during this 1,000-run benchmark was verified with an immediate in-memory reverse check. **Zero files were left dirty, and zero uncommitted lines were introduced into any of the 6 developer workspaces.**
