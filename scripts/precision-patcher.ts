/**
 * Precision Surgical Patcher & Batch Token Replacer (v2.17.0)
 * 
 * High-performance atomic unified diffing and stream token editing.
 * Features:
 * 1. applyUnifiedDiff: Applies unified hunk diffs atomically without full file rewrites.
 * 2. batchReplaceTokens: 1-turn mass color, token, and string replacer across the entire codebase.
 * 3. atomicWrite: Writes to .tmp file first, renames on success, 100% rollback on hunk mismatch.
 */

import fs from "fs";
import path from "path";
import { isInsideRoot } from "../bin/path-contained.js";

export interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

export interface ParsedDiff {
  oldFile: string;
  newFile: string;
  hunks: Hunk[];
}

/**
 * Strips markdown code fences (```diff ... ```) that LLMs wrap around patches.
 */
export function stripDiffFence(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith("```")) return input;
  const lines = trimmed.split("\n");
  if (lines[0].startsWith("```")) lines.shift();
  if (lines.length > 0 && lines[lines.length - 1].trim() === "```") lines.pop();
  return lines.join("\n");
}

/**
 * Parses standard unified diff text into structured hunks.
 */
export function parseUnifiedDiff(diffText: string): ParsedDiff {
  const cleanText = stripDiffFence(diffText);
  const rawLines = cleanText.split(/\r?\n/);
  let oldFile = "";
  let newFile = "";
  const hunks: Hunk[] = [];
  let currentHunk: Hunk | null = null;

  for (const line of rawLines) {
    if (line.startsWith("--- ")) {
      oldFile = line.slice(4).trim().replace(/^[ab]\//, "");
      continue;
    }
    if (line.startsWith("+++ ")) {
      newFile = line.slice(4).trim().replace(/^[ab]\//, "");
      continue;
    }

    const hunkHeader = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkHeader) {
      if (currentHunk) hunks.push(currentHunk);
      currentHunk = {
        oldStart: parseInt(hunkHeader[1], 10),
        oldCount: hunkHeader[2] !== undefined ? parseInt(hunkHeader[2], 10) : 1,
        newStart: parseInt(hunkHeader[3], 10),
        newCount: hunkHeader[4] !== undefined ? parseInt(hunkHeader[4], 10) : 1,
        lines: [],
      };
      continue;
    }

    if (currentHunk) {
      if (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ") || line === "") {
        currentHunk.lines.push(line);
      }
    }
  }

  if (currentHunk) hunks.push(currentHunk);

  if (hunks.length === 0) {
    throw new Error("No unified diff hunks found in patch text. Header @@ -start,count +start,count @@ required.");
  }

  return { oldFile, newFile, hunks };
}

/**
 * Applies a unified diff to a target file atomically.
 */
export function applyUnifiedDiff(
  targetFilePath: string,
  patchText: string,
  projectRoot = process.cwd()
): { success: boolean; filePath: string; linesChanged: number; message: string } {
  const fullPath = path.isAbsolute(targetFilePath) ? targetFilePath : path.resolve(projectRoot, targetFilePath);
  if (!isInsideRoot(projectRoot, fullPath)) {
    throw new Error(`Path outside project root is forbidden: ${targetFilePath}`);
  }
  const parsed = parseUnifiedDiff(patchText);

  const isCreation = parsed.oldFile === "/dev/null";

  let originalLines: string[] = [];
  let isCrlf = false;

  if (!isCreation) {
    if (!fs.existsSync(fullPath)) {
      throw new Error(`file not found: ${fullPath} (use a "--- /dev/null" header to create a new file)`);
    }
    const rawContent = fs.readFileSync(fullPath, "utf-8");
    isCrlf = rawContent.includes("\r\n");
    originalLines = rawContent.split(/\r?\n/);
  }

  let workingLines = [...originalLines];
  let totalDelta = 0;
  let linesChanged = 0;

  for (const hunk of parsed.hunks) {
    // 1-based index to 0-based
    const targetIdx = hunk.oldStart - 1 + totalDelta;

    // Verify context lines match
    const contextOldLines: string[] = [];
    const replacementNewLines: string[] = [];

    // A trailing "" is usually just the diff's final newline; drop it unless the hunk header counts it.
    const hunkLines = [...hunk.lines];
    while (
      hunkLines.length > 0 &&
      hunkLines[hunkLines.length - 1] === "" &&
      hunkLines.filter((l) => !l.startsWith("+")).length > hunk.oldCount
    ) {
      hunkLines.pop();
    }

    for (const hLine of hunkLines) {
      if (hLine === "") {
        contextOldLines.push("");
        replacementNewLines.push("");
      } else if (hLine.startsWith(" ")) {
        contextOldLines.push(hLine.slice(1));
        replacementNewLines.push(hLine.slice(1));
      } else if (hLine.startsWith("-")) {
        contextOldLines.push(hLine.slice(1));
        linesChanged++;
      } else if (hLine.startsWith("+")) {
        replacementNewLines.push(hLine.slice(1));
        linesChanged++;
      }
    }

    // Context verification
    let matchOffset = 0;
    let foundMatch = false;

    // Check exact targetIdx first
    const sliceAtTarget = workingLines.slice(targetIdx, targetIdx + contextOldLines.length);
    if (sliceAtTarget.join("\n") === contextOldLines.join("\n")) {
      foundMatch = true;
      matchOffset = 0;
    } else {
      // Fuzzy search within +/- 15 lines in case file drifted slightly
      const searchRadius = 15;
      const maxStart = workingLines.length - contextOldLines.length;
      const wanted = contextOldLines.join("\n");

      // Search outward from the expected line so the nearest candidate wins.
      for (let d = 1; d <= searchRadius && !foundMatch; d++) {
        for (const i of [targetIdx + d, targetIdx - d]) {
          if (i < 0 || i > maxStart) continue;
          if (workingLines.slice(i, i + contextOldLines.length).join("\n") === wanted) {
            matchOffset = i - targetIdx;
            foundMatch = true;
            break;
          }
        }
      }
    }

    if (!foundMatch && !isCreation) {
      throw new Error(
        `[PatchFailed] Hunk context mismatch at line ${hunk.oldStart}. Expected:\n${contextOldLines.slice(0, 5).join("\n")}\n...file was NOT modified.`
      );
    }

    const actualIdx = targetIdx + matchOffset;
    workingLines.splice(actualIdx, contextOldLines.length, ...replacementNewLines);
    totalDelta += replacementNewLines.length - contextOldLines.length;
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(fullPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Atomic write via temporary file
  const tmpPath = `${fullPath}.${process.pid}.${Date.now()}.tmp`;
  const delimiter = isCrlf ? "\r\n" : "\n";
  const newContent = workingLines.join(delimiter);

  try {
    fs.writeFileSync(tmpPath, newContent, "utf-8");
    fs.renameSync(tmpPath, fullPath);
  } catch (err: any) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`Atomic write failed: ${err.message}`);
  }

  const relPath = path.relative(projectRoot, fullPath);
  return {
    success: true,
    filePath: relPath,
    linesChanged,
    message: `✅ [PATCH_APPLIED] ${relPath} (${linesChanged} lines modified across ${parsed.hunks.length} hunk(s)). Atomic rename exit 0.`,
  };
}

/**
 * 1-Turn High-Speed Batch Token / Color Swapper
 * Replaces design tokens, hex colors, Tailwind utility classes, or identifiers across all matching project files.
 */
export function batchReplaceTokens(
  target: string,
  replacement: string,
  options: {
    projectRoot?: string;
    fileExtensions?: string[];
    dryRun?: boolean;
    maxFiles?: number;
  } = {}
): {
  totalFilesModified: number;
  totalOccurrences: number;
  receipts: Array<{ file: string; occurrences: number; sampleLines: number[] }>;
  dryRun: boolean;
} {
  if (!target) {
    throw new Error("batchReplaceTokens: target must be a non-empty string.");
  }
  const root = options.projectRoot || process.cwd();
  const exts = options.fileExtensions || [".tsx", ".ts", ".jsx", ".js", ".css", ".scss", ".json", ".html"];
  const dryRun = options.dryRun ?? false;
  const maxFiles = options.maxFiles || 500;

  const receipts: Array<{ file: string; occurrences: number; sampleLines: number[] }> = [];
  let totalOccurrences = 0;

  function shouldIgnore(name: string): boolean {
    return (
      name.startsWith(".") ||
      name === "node_modules" ||
      name === "dist" ||
      name === ".next" ||
      name === "build" ||
      name === "cloned-repos" ||
      name === "docs"
    );
  }

  function scanDir(dir: string) {
    if (receipts.length >= maxFiles) return;
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!exts.includes(ext)) continue;

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          if (!content.includes(target)) continue;

          const isCrlf = content.includes("\r\n");
          const lines = content.split(/\r?\n/);
          let count = 0;
          const sampleLines: number[] = [];

          lines.forEach((l, idx) => {
            if (l.includes(target)) {
              count++;
              if (sampleLines.length < 3) sampleLines.push(idx + 1);
            }
          });

          if (count > 0) {
            totalOccurrences += count;
            const rel = path.relative(root, fullPath);
            receipts.push({ file: rel, occurrences: count, sampleLines });

            if (!dryRun) {
              const updated = content.replaceAll(target, replacement);
              const tmpPath = `${fullPath}.${process.pid}.tmp`;
              fs.writeFileSync(tmpPath, updated, "utf-8");
              fs.renameSync(tmpPath, fullPath);
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  scanDir(root);

  return {
    totalFilesModified: receipts.length,
    totalOccurrences,
    receipts,
    dryRun,
  };
}
