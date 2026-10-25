/**
 * Empirical Benchmark & Verification Engine for Iron Gate Anti-Grep Hook
 * Measures interception accuracy, false positive rate, and latency.
 */

import { spawnSync } from "child_process";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gateScript = path.resolve(__dirname, "anti-grep-gate.js");

interface TestCase {
  name: string;
  command: string;
  expectedDecision: "deny" | "allow";
}

const forbiddenTestCases: TestCase[] = [
  // The exact command from the screenshot
  {
    name: "User Screenshot: Scoped app recurse with Select-String",
    command: "Get-ChildItem 'app' -Recurse -Filter '*.ts*' -ErrorAction SilentlyContinue | Select-String -Pattern 'from.*src/server/'",
    expectedDecision: "deny"
  },
  {
    name: "Scoped components recurse",
    command: "Get-ChildItem -Path 'components' -Recurse -Include *.tsx",
    expectedDecision: "deny"
  },
  {
    name: "Root Get-ChildItem recurse",
    command: "Get-ChildItem -Recurse",
    expectedDecision: "deny"
  },
  {
    name: "Short alias gci -Recurse",
    command: "gci -Recurse -Filter *.ts",
    expectedDecision: "deny"
  },
  {
    name: "Short alias dir -Recurse",
    command: "dir -Recurse",
    expectedDecision: "deny"
  },
  {
    name: "Legacy cmd dir /s",
    command: "dir /s *.tsx",
    expectedDecision: "deny"
  },
  {
    name: "PowerShell Select-String wildcard scan",
    command: "Select-String -Path .\\**\\*.ts -Pattern 'export'",
    expectedDecision: "deny"
  },
  {
    name: "Piped directory to Select-String",
    command: "Get-ChildItem app | Select-String -Pattern 'TODO'",
    expectedDecision: "deny"
  },
  {
    name: "Grep recursive standard",
    command: "grep -r 'useState' src/",
    expectedDecision: "deny"
  },
  {
    name: "Grep recursive combined flags",
    command: "grep -rnI 'process.env' .",
    expectedDecision: "deny"
  },
  {
    name: "Egrep recursive",
    command: "egrep -R 'authOptions' app/",
    expectedDecision: "deny"
  },
  {
    name: "Ripgrep global invocation",
    command: "rg 'export const' components/",
    expectedDecision: "deny"
  },
  {
    name: "Ripgrep longform invocation",
    command: "ripgrep --type ts 'prisma' .",
    expectedDecision: "deny"
  },
  {
    name: "Find dot recursive name search",
    command: "find . -name '*.tsx'",
    expectedDecision: "deny"
  },
  {
    name: "Findstr /s recursive",
    command: "findstr /s /i 'password' *.env",
    expectedDecision: "deny"
  },
  {
    name: "Inline node readdir scan",
    command: "node -e \"const fs = require('fs'); fs.readdirSync('.').forEach(console.log)\"",
    expectedDecision: "deny"
  },
  {
    name: "PowerShell [IO.File] batch reading script",
    command: "Get-ChildItem | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }",
    expectedDecision: "deny"
  }
];

const legitimateTestCases: TestCase[] = [
  {
    name: "Git status check",
    command: "git status",
    expectedDecision: "allow"
  },
  {
    name: "Git diff inspection",
    command: "git diff HEAD~1",
    expectedDecision: "allow"
  },
  {
    name: "Git commit command",
    command: "git commit -m 'feat: update auth'",
    expectedDecision: "allow"
  },
  {
    name: "NPM test execution",
    command: "npm test",
    expectedDecision: "allow"
  },
  {
    name: "TypeScript compilation typecheck",
    command: "tsc --noEmit",
    expectedDecision: "allow"
  },
  {
    name: "Fullstack audit fast find CLI",
    command: "node bin/audit.js --find 'Navbar' --compact",
    expectedDecision: "allow"
  },
  {
    name: "Fullstack audit visual locator",
    command: "node bin/audit.js --locate-visual 'pulse'",
    expectedDecision: "allow"
  },
  {
    name: "Fullstack audit causal path",
    command: "npx fullstack-audit --path /portal PaymentButton",
    expectedDecision: "allow"
  },
  {
    name: "Package installation",
    command: "npm install lucide-react",
    expectedDecision: "allow"
  },
  {
    name: "Build command",
    command: "npm run build",
    expectedDecision: "allow"
  },
  {
    name: "Copy item scratch command",
    command: "Copy-Item 'temp\\shot.png' 'scratch\\shot.png'",
    expectedDecision: "allow"
  },
  {
    name: "Echo status output",
    command: "echo 'Build succeeded'",
    expectedDecision: "allow"
  }
];

function runGate(command: string): { decision: string; latencyMs: number; reason?: string } {
  const payload = {
    toolCall: {
      name: "run_command",
      args: {
        CommandLine: command
      }
    }
  };

  const start = performance.now();
  const res = spawnSync("node", [gateScript], {
    input: JSON.stringify(payload),
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  const latencyMs = performance.now() - start;

  if (res.error) {
    throw res.error;
  }

  let parsed: any = { decision: "error" };
  try {
    parsed = JSON.parse(res.stdout.trim());
  } catch (err) {
    console.error("Failed to parse stdout:", res.stdout, "stderr:", res.stderr);
  }

  return {
    decision: parsed.decision,
    latencyMs,
    reason: parsed.reason
  };
}

async function main() {
  console.log("==================================================================");
  console.log("IRON GATE ANTI-GREP LIFECYCLE HOOK: 100-RUN EMPIRICAL BENCHMARK");
  console.log("==================================================================\n");

  const totalRunsPerCategory = 50; // 50 * forbidden + 50 * legitimate = 100 total
  const latencies: number[] = [];
  let forbiddenHits = 0;
  let forbiddenMisses = 0;
  let legitPasses = 0;
  let legitFalseBlocks = 0;

  console.log("Running Phase 1: Forbidden Command Interception Tests...");
  for (let i = 0; i < totalRunsPerCategory; i++) {
    const tc = forbiddenTestCases[i % forbiddenTestCases.length];
    const res = runGate(tc.command);
    latencies.push(res.latencyMs);

    if (res.decision === "deny") {
      forbiddenHits++;
    } else {
      forbiddenMisses++;
      console.error(`FAILED TO BLOCK: ${tc.name} -> "${tc.command}" (Result: ${res.decision})`);
    }
  }

  console.log("Running Phase 2: Legitimate Command Pass-Through Tests...");
  for (let i = 0; i < totalRunsPerCategory; i++) {
    const tc = legitimateTestCases[i % legitimateTestCases.length];
    const res = runGate(tc.command);
    latencies.push(res.latencyMs);

    if (res.decision === "allow") {
      legitPasses++;
    } else {
      legitFalseBlocks++;
      console.error(`FALSE BLOCK: ${tc.name} -> "${tc.command}" (Result: ${res.decision})`);
    }
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
  const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
  const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
  const mean = (latencies.reduce((sum, v) => sum + v, 0) / latencies.length).toFixed(2);

  const interceptionRate = ((forbiddenHits / totalRunsPerCategory) * 100).toFixed(1);
  const falsePositiveRate = ((legitFalseBlocks / totalRunsPerCategory) * 100).toFixed(1);

  console.log("\n==================================================================");
  console.log("BENCHMARK RESULTS SUMMARY (100 TOTAL TRIALS)");
  console.log("==================================================================");
  console.log(`Forbidden Command Interception Rate : ${interceptionRate}% (${forbiddenHits}/${totalRunsPerCategory} blocked)`);
  console.log(`False Positive Rate on Legitimate   : ${falsePositiveRate}% (${legitFalseBlocks}/${totalRunsPerCategory} false blocks)`);
  console.log(`Median Latency (p50)                : ${p50} ms`);
  console.log(`95th Percentile Latency (p95)       : ${p95} ms`);
  console.log(`99th Percentile Latency (p99)       : ${p99} ms`);
  console.log(`Mean Latency                        : ${mean} ms`);
  console.log("==================================================================");

  // Print exact proof on the screenshot command
  const screenshotCmd = "Get-ChildItem 'app' -Recurse -Filter '*.ts*' -ErrorAction SilentlyContinue | Select-String -Pattern 'from.*src/server/'";
  const proof = runGate(screenshotCmd);
  console.log("\nEXACT PROOF ON USER SCREENSHOT COMMAND:");
  console.log(`Input Command : ${screenshotCmd}`);
  console.log(`Gate Decision : ${proof.decision.toUpperCase()}`);
  console.log(`Gate Latency  : ${proof.latencyMs.toFixed(2)} ms`);
  console.log(`Denied Reason :\n${proof.reason}\n`);
}

main().catch(console.error);
