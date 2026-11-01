/**
 * Adaptive Domain Sniffer & Atlas Generator (v2.17.0)
 * 
 * Automatically identifies non-standard architectures and generates specialized atlases in docs/adaptive-atlas/:
 * 1. Chrome Extension Manifest v3 / v2
 * 2. WebSocket & Bot Event Handlers (@mtcute, ws, socket.io)
 * 3. CLI Command Graphs & FFmpeg Pipelines
 * 4. Tailwind CSS v4 (@theme CSS Variables without tailwind.config.js)
 * 5. 3D Canvas & WebGL Scenes (Three.js, R3F)
 * 6. Pure Vanilla HTML/CSS/JS Web Applications
 */

import fs from "fs";
import path from "path";
import { getAtlasProvenanceHeader } from "./constants.js";

export interface SnifferResult {
  domain: string;
  detected: boolean;
  summary: string;
  atlasFileName?: string;
  atlasContent?: string;
}

/**
 * 1. Sniff Chrome Extension
 */
export function sniffChromeExtension(projectRoot: string): SnifferResult {
  const possibleManifests = [
    path.join(projectRoot, "manifest.json"),
    path.join(projectRoot, "public", "manifest.json"),
    path.join(projectRoot, "src", "manifest.json"),
    path.join(projectRoot, "packages", "extension", "manifest.json"),
    path.join(projectRoot, "packages", "extension-flow", "manifest.json"),
  ];

  let manifestPath = possibleManifests.find(p => fs.existsSync(p));
  if (!manifestPath) {
    // Check root packages directory shallowly
    const packagesDir = path.join(projectRoot, "packages");
    if (fs.existsSync(packagesDir)) {
      try {
        const sub = fs.readdirSync(packagesDir, { withFileTypes: true });
        for (const s of sub) {
          if (s.isDirectory()) {
            const m = path.join(packagesDir, s.name, "manifest.json");
            if (fs.existsSync(m)) {
              manifestPath = m;
              break;
            }
          }
        }
      } catch {}
    }
  }

  if (!manifestPath) {
    return { domain: "Chrome Extension", detected: false, summary: "No manifest.json found." };
  }

  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    const relManifest = path.relative(projectRoot, manifestPath);

    let md = getAtlasProvenanceHeader("Chrome Extension Architecture Atlas", "Auto-discovered Manifest v2/v3, background service workers, and content scripts.");
    md += `\n## Manifest Configuration (\`${relManifest}\`)\n\n`;
    md += `- **Extension Name**: \`${manifest.name || "Unnamed"}\`\n`;
    md += `- **Manifest Version**: \`v${manifest.manifest_version || 3}\`\n`;
    md += `- **Version**: \`${manifest.version || "0.0.1"}\`\n`;
    md += `- **Description**: ${manifest.description || "N/A"}\n\n`;

    md += `### Permissions & Host Permissions\n`;
    const perms = (manifest.permissions || []).map((p: string) => `\`${p}\``).join(", ") || "None";
    const hostPerms = (manifest.host_permissions || []).map((p: string) => `\`${p}\``).join(", ") || "None";
    md += `- **Permissions**: ${perms}\n`;
    md += `- **Host Permissions**: ${hostPerms}\n\n`;

    md += `### Service Workers & Background Scripts\n`;
    if (manifest.background) {
      if (manifest.background.service_worker) {
        md += `- **Service Worker (MV3)**: \`${manifest.background.service_worker}\`\n`;
      }
      if (Array.isArray(manifest.background.scripts)) {
        md += `- **Background Scripts (MV2)**: ${manifest.background.scripts.map((s: string) => `\`${s}\``).join(", ")}\n`;
      }
    } else {
      md += `*No dedicated background worker declared.*\n`;
    }

    md += `\n### Content Scripts & Target Matches\n`;
    if (Array.isArray(manifest.content_scripts) && manifest.content_scripts.length > 0) {
      md += `| Target Matches | JS Scripts | CSS Injections | Run At |\n| :--- | :--- | :--- | :--- |\n`;
      for (const cs of manifest.content_scripts) {
        const matches = (cs.matches || []).map((m: string) => `\`${m}\``).join("<br>");
        const js = (cs.js || []).map((j: string) => `\`${j}\``).join("<br>");
        const css = (cs.css || []).map((c: string) => `\`${c}\``).join("<br>");
        const runAt = cs.run_at || "document_idle";
        md += `| ${matches} | ${js || "None"} | ${css || "None"} | \`${runAt}\` |\n`;
      }
    } else {
      md += `*No content scripts declared.*\n`;
    }

    if (manifest.action || manifest.browser_action) {
      const act = manifest.action || manifest.browser_action;
      md += `\n### Action Popup & Browser UI\n`;
      md += `- **Popup Entrypoint**: \`${act.default_popup || "None"}\`\n`;
      md += `- **Title / Tooltip**: \`${act.default_title || "None"}\`\n`;
    }

    return {
      domain: "Chrome Extension",
      detected: true,
      summary: `Chrome Extension (MV${manifest.manifest_version || 3}: ${manifest.name})`,
      atlasFileName: "01_EXTENSION_MANIFEST_MAP.md",
      atlasContent: md,
    };
  } catch (err: any) {
    return { domain: "Chrome Extension", detected: true, summary: `Error parsing manifest.json: ${err.message}` };
  }
}

/**
 * 2. Sniff WebSocket & Bot Handlers (@mtcute, ws, socket.io)
 */
export function sniffWebSocketAndBots(projectRoot: string): SnifferResult {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { domain: "WebSocket/Bot", detected: false, summary: "No package.json found." };
  }

  let pkg: any = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return { domain: "WebSocket/Bot", detected: false, summary: "Invalid package.json." };
  }

  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const socketDeps = ["@mtcute/dispatcher", "@mtcute/node", "ws", "socket.io", "socket.io-client", "telegraf", "grammy", "discord.js"];
  const matched = socketDeps.filter(d => allDeps[d]);

  if (matched.length === 0) {
    return { domain: "WebSocket/Bot", detected: false, summary: "No bot or websocket dependencies found." };
  }

  let md = getAtlasProvenanceHeader("WebSocket & Bot Event Handler Atlas", "Topology of realtime dispatchers, MTProto userbots, and WebSocket listeners.");
  md += `\n## Realtime / Bot Packages Detected\n\n`;
  for (const m of matched) {
    md += `- **\`${m}\`**: \`${allDeps[m]}\`\n`;
  }
  md += `\n`;

  // Scan src/ or server/ for socket / bot definitions
  const targetDirs = [path.join(projectRoot, "src"), path.join(projectRoot, "server")];
  const detectedHandlers: Array<{ file: string; line: number; type: string; snippet: string }> = [];

  function scanForBotPatterns(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "dist") continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          scanForBotPatterns(full);
        } else if (/\.(ts|js|mjs)$/.test(e.name)) {
          const content = fs.readFileSync(full, "utf-8");
          const lines = content.split(/\r?\n/);
          lines.forEach((l, idx) => {
            if (/dp\.onNewMessage|dp\.onEditMessage|dp\.addUpdateHandler|\.on\(["']message["']|\.on\(["']connection["']|new WebSocketServer|WebSocket\.Server/i.test(l)) {
              detectedHandlers.push({
                file: path.relative(projectRoot, full),
                line: idx + 1,
                type: l.includes("dp.") ? "MTProto Dispatcher" : "WebSocket Handler",
                snippet: l.trim().slice(0, 80),
              });
            }
          });
        }
      }
    } catch {}
  }

  targetDirs.forEach(scanForBotPatterns);

  md += `### Realtime Event Listeners & Dispatchers (${detectedHandlers.length} detected)\n\n`;
  if (detectedHandlers.length > 0) {
    md += `| Handler Type | Location | Code Signature |\n| :--- | :--- | :--- |\n`;
    for (const h of detectedHandlers) {
      md += `| **${h.type}** | \`${h.file}:${h.line}\` | \`${h.snippet}\` |\n`;
    }
  } else {
    md += `*Realtime framework packages installed; handlers referenced at entrypoint.* \n`;
  }

  return {
    domain: "WebSocket/Bot",
    detected: true,
    summary: `Realtime / Bot Engine (${matched.join(", ")})`,
    atlasFileName: "02_WEBSOCKET_BOT_CATALOG.md",
    atlasContent: md,
  };
}

/**
 * 3. Sniff CLI & Processing Pipelines (Node CLI, FFmpeg, Tsx engines)
 */
export function sniffCliAndPipelines(projectRoot: string): SnifferResult {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { domain: "CLI & Pipelines", detected: false, summary: "No package.json." };
  }

  let pkg: any = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return { domain: "CLI & Pipelines", detected: false, summary: "Invalid package.json." };
  }

  const scripts = pkg.scripts || {};
  const bin = pkg.bin || {};
  const hasCliScripts = Object.keys(scripts).some(k => /cli|engine|ffmpeg|render|edit|pipeline/i.test(k) || /tsx .*cli\.ts/i.test(scripts[k]));
  const hasBin = Object.keys(bin).length > 0;

  // Check for ffmpeg scripts
  let hasFfmpeg = false;
  const keywords = pkg.keywords || [];
  if (keywords.includes("ffmpeg") || keywords.includes("video-editor") || Object.values(scripts).some((s: any) => typeof s === "string" && s.includes("ffmpeg"))) {
    hasFfmpeg = true;
  }

  if (!hasCliScripts && !hasBin && !hasFfmpeg) {
    return { domain: "CLI & Pipelines", detected: false, summary: "No CLI or pipeline indicators found." };
  }

  let md = getAtlasProvenanceHeader("CLI Engine & Processing Pipeline Atlas", "Command-line interfaces, executable binaries, and data transformation pipelines.");
  md += `\n## CLI Executables & Scripts\n\n`;

  if (hasBin) {
    md += `### Registered Binary Entrypoints (\`pkg.bin\`)\n\n`;
    md += `| Command Name | Executable Target Path |\n| :--- | :--- |\n`;
    if (typeof bin === "string") {
      md += `| \`${pkg.name}\` | \`${bin}\` |\n`;
    } else {
      for (const [cmd, target] of Object.entries(bin)) {
        md += `| \`${cmd}\` | \`${target}\` |\n`;
      }
    }
    md += `\n`;
  }

  md += `### Pipeline Scripts (\`pkg.scripts\`)\n\n`;
  md += `| Script Command | Execution Command |\n| :--- | :--- |\n`;
  for (const [k, v] of Object.entries(scripts)) {
    if (/cli|engine|render|ffmpeg|ts:|edit|build|test/i.test(k)) {
      md += `| \`npm run ${k}\` | \`${v}\` |\n`;
    }
  }

  if (hasFfmpeg) {
    md += `\n### Media Processing Engine (FFmpeg Pipeline)\n\n`;
    md += `- **Engine Type**: Video / Media Renderer\n`;
    md += `- **Keywords**: ${keywords.map((kw: string) => `\`${kw}\``).join(", ")}\n`;
  }

  return {
    domain: "CLI & Pipelines",
    detected: true,
    summary: `CLI & Pipeline Engine (${hasBin ? "Binaries" : "Scripts"} ${hasFfmpeg ? "+ FFmpeg" : ""})`,
    atlasFileName: "03_CLI_PIPELINE_CATALOG.md",
    atlasContent: md,
  };
}

/**
 * 4. Sniff Tailwind CSS v4 Theme (@theme block without tailwind.config.js)
 */
export function sniffTailwindV4(projectRoot: string): SnifferResult {
  const pkgPath = path.join(projectRoot, "package.json");
  let isV4 = false;

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (allDeps["@tailwindcss/vite"] || (allDeps["tailwindcss"] && String(allDeps["tailwindcss"]).includes("^4"))) {
        isV4 = true;
      }
    } catch {}
  }

  // Look for @theme in CSS files
  const cssFiles = [
    path.join(projectRoot, "src", "index.css"),
    path.join(projectRoot, "src", "app", "globals.css"),
    path.join(projectRoot, "src", "styles.css"),
    path.join(projectRoot, "app", "globals.css"),
  ];

  let themeCssPath = "";
  let themeBlocks: Array<{ variable: string; value: string }> = [];

  for (const c of cssFiles) {
    if (fs.existsSync(c)) {
      const content = fs.readFileSync(c, "utf-8");
      if (content.includes("@theme") || content.includes('@import "tailwindcss"') || content.includes("@import 'tailwindcss'")) {
        isV4 = true;
        themeCssPath = c;
        const matches = content.matchAll(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g);
        for (const m of matches) {
          themeBlocks.push({ variable: `--${m[1]}`, value: m[2].trim() });
        }
        break;
      }
    }
  }

  if (!isV4) {
    return { domain: "Tailwind v4", detected: false, summary: "No Tailwind v4 indicators found." };
  }

  let md = getAtlasProvenanceHeader("Tailwind CSS v4 Modern Theme Atlas", "CSS-first theme configuration, @theme variables, and utility tokens.");
  md += `\n## Tailwind v4 Architecture\n\n`;
  md += `- **Configuration Paradigm**: CSS-native (\`@theme\` directives, no \`tailwind.config.js\` needed)\n`;
  md += `- **Theme Source File**: \`${themeCssPath ? path.relative(projectRoot, themeCssPath) : "CSS entrypoint"}\`\n\n`;

  md += `### Design Tokens & CSS Custom Properties (${themeBlocks.length} defined)\n\n`;
  if (themeBlocks.length > 0) {
    md += `| CSS Variable | Resolved Value | Tailwind Utility Equivalent |\n| :--- | :--- | :--- |\n`;
    for (const t of themeBlocks.slice(0, 100)) {
      const utilName = t.variable.replace(/^--(color-|font-|spacing-)?/, "");
      md += `| \`${t.variable}\` | \`${t.value}\` | \`${utilName}\` |\n`;
    }
  } else {
    md += `*Using Tailwind v4 default styling primitives without custom CSS variable overrides.*\n`;
  }

  return {
    domain: "Tailwind v4",
    detected: true,
    summary: `Tailwind CSS v4 (CSS-native @theme, ${themeBlocks.length} custom properties)`,
    atlasFileName: "04_TAILWIND_V4_THEME_CATALOG.md",
    atlasContent: md,
  };
}

/**
 * 5. Sniff 3D Canvas & WebGL (Three.js, R3F)
 */
export function sniff3DCanvas(projectRoot: string): SnifferResult {
  const pkgPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return { domain: "3D Canvas", detected: false, summary: "No package.json." };
  }

  let pkg: any = {};
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return { domain: "3D Canvas", detected: false, summary: "Invalid package.json." };
  }

  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const hasThree = allDeps["three"] || allDeps["@types/three"] || allDeps["@react-three/fiber"];

  if (!hasThree) {
    return { domain: "3D Canvas", detected: false, summary: "No 3D canvas libraries found." };
  }

  let md = getAtlasProvenanceHeader("3D Canvas & WebGL Scene Atlas", "Three.js 3D meshes, renderers, lighting, and scene graphs.");
  md += `\n## 3D Rendering Stack\n\n`;
  if (allDeps["three"]) md += `- **Three.js Core**: \`${allDeps["three"]}\`\n`;
  if (allDeps["@react-three/fiber"]) md += `- **React Three Fiber (R3F)**: \`${allDeps["@react-three/fiber"]}\`\n`;
  md += `\n`;

  // Look for canvas / scene files
  const detectedScenes: Array<{ file: string; line: number; type: string; snippet: string }> = [];
  function scanScenes(dir: string) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "dist") continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          scanScenes(full);
        } else if (/\.(tsx|jsx|ts|js)$/.test(e.name)) {
          const content = fs.readFileSync(full, "utf-8");
          const lines = content.split(/\r?\n/);
          lines.forEach((l, idx) => {
            if (/new THREE\.Scene|new THREE\.PerspectiveCamera|new THREE\.WebGLRenderer|<Canvas/i.test(l)) {
              detectedScenes.push({
                file: path.relative(projectRoot, full),
                line: idx + 1,
                type: l.includes("<Canvas") ? "R3F Canvas" : "Three.js Scene",
                snippet: l.trim().slice(0, 80),
              });
            }
          });
        }
      }
    } catch {}
  }

  scanScenes(path.join(projectRoot, "src"));

  md += `### 3D Scenes & Canvas Entrypoints (${detectedScenes.length} detected)\n\n`;
  if (detectedScenes.length > 0) {
    md += `| Scene Type | Location | Signature |\n| :--- | :--- | :--- |\n`;
    for (const s of detectedScenes) {
      md += `| **${s.type}** | \`${s.file}:${s.line}\` | \`${s.snippet}\` |\n`;
    }
  } else {
    md += `*3D dependencies installed; scene initialized via dynamic components.*\n`;
  }

  return {
    domain: "3D Canvas",
    detected: true,
    summary: `Three.js 3D Canvas (${detectedScenes.length} scenes)`,
    atlasFileName: "05_3D_CANVAS_CATALOG.md",
    atlasContent: md,
  };
}

/**
 * 6. Sniff Pure Vanilla HTML/CSS/JS
 */
export function sniffVanillaWeb(projectRoot: string): SnifferResult {
  const rootIndexHtml = path.join(projectRoot, "index.html");
  const pkgPath = path.join(projectRoot, "package.json");

  let isFramework = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (allDeps["react"] || allDeps["vue"] || allDeps["@angular/core"] || allDeps["svelte"] || allDeps["next"] || allDeps["nuxt"]) {
        isFramework = true;
      }
    } catch {}
  }

  if (isFramework || !fs.existsSync(rootIndexHtml)) {
    return { domain: "Vanilla Web", detected: false, summary: "Framework detected or no index.html." };
  }

  const html = fs.readFileSync(rootIndexHtml, "utf-8");
  const scriptTags = [...html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  const styleTags = [...html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);

  let md = getAtlasProvenanceHeader("Vanilla Web Architecture Atlas", "Static HTML, stylesheet links, and unbundled JavaScript modules.");
  md += `\n## Vanilla Web Entrypoint (\`index.html\`)\n\n`;
  md += `- **Stylesheets Linked**: ${styleTags.map(s => `\`${s}\``).join(", ") || "None"}\n`;
  md += `- **Script Files**: ${scriptTags.map(s => `\`${s}\``).join(", ") || "None"}\n\n`;

  return {
    domain: "Vanilla Web",
    detected: true,
    summary: `Vanilla HTML/CSS/JS (Static Entrypoint)`,
    atlasFileName: "06_VANILLA_WEB_CATALOG.md",
    atlasContent: md,
  };
}

/**
 * Master Adaptive Sniffer Orchestrator
 * Runs all sniffers and writes docs/adaptive-atlas/*.md when applicable.
 */
export function runAdaptiveAudit(projectRoot = process.cwd()): {
  detectedDomains: string[];
  generatedAtlases: string[];
} {
  const sniffers = [
    sniffChromeExtension,
    sniffWebSocketAndBots,
    sniffCliAndPipelines,
    sniffTailwindV4,
    sniff3DCanvas,
    sniffVanillaWeb,
  ];

  const detectedDomains: string[] = [];
  const generatedAtlases: string[] = [];
  const adaptiveOutputDir = path.join(projectRoot, "docs", "adaptive-atlas");

  for (const sniffer of sniffers) {
    const res = sniffer(projectRoot);
    if (res.detected && res.atlasFileName && res.atlasContent) {
      if (!fs.existsSync(adaptiveOutputDir)) {
        fs.mkdirSync(adaptiveOutputDir, { recursive: true });
      }
      const outPath = path.join(adaptiveOutputDir, res.atlasFileName);
      fs.writeFileSync(outPath, res.atlasContent, "utf-8");
      detectedDomains.push(res.summary);
      generatedAtlases.push(path.relative(projectRoot, outPath));
    }
  }

  return { detectedDomains, generatedAtlases };
}
