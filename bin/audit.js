#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instant Fast-Path for Version Check (<5ms exit without spawning tsx)
const args = process.argv.slice(2);
if (args.includes("-v") || args.includes("--version")) {
  try {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    console.log(`fullstack-audit v${pkg.version} (engine: AST reactive graph v2)`);
  } catch {
    console.log("fullstack-audit v2.14.0 (engine: Living Fullstack Atlas & Minimalist Engine v2.14.0)");
  }
  process.exit(0);
}

const scriptPath = path.resolve(__dirname, "../scripts/audit.ts");

// Check if local tsx cli exists to avoid cmd.exe / shell: true quoting hazards
const localTsx = path.resolve(__dirname, "../node_modules/tsx/dist/cli.mjs");
const cwdTsx = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");
const tsxPath = fs.existsSync(localTsx) ? localTsx : (fs.existsSync(cwdTsx) ? cwdTsx : null);
let child;

if (tsxPath) {
  // Direct node execution with shell: false (100% immune to & | ^ special char explosion)
  child = spawn(process.execPath, [tsxPath, scriptPath, ...args], {
    stdio: "inherit",
    shell: false,
  });
} else {
  // Fallback to npx
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  child = spawn(npxCmd, ["tsx", scriptPath, ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
