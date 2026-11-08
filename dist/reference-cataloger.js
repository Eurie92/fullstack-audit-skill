/**
 * Reference Pattern Cataloger (v2.17.0)
 *
 * Analyzes open-source reference repositories in docs/cloned-repos/ (or specified path),
 * catalogs their proven algorithms and architectures, and generates docs/reference-atlas/00_REFERENCE_PATTERNS.md
 * for agent pattern retrieval.
 */
import fs from "fs";
import path from "path";
import { getAtlasProvenanceHeader } from "./constants.js";
export function catalogReferenceRepos(referenceDir = "docs/cloned-repos", projectRoot = process.cwd()) {
    const fullRefDir = path.isAbsolute(referenceDir) ? referenceDir : path.resolve(projectRoot, referenceDir);
    const outDir = path.join(projectRoot, "docs", "reference-atlas");
    const summaries = [];
    if (!fs.existsSync(fullRefDir)) {
        return { reposCataloged: 0, atlasPath: "", summaries: [] };
    }
    let entries = [];
    try {
        entries = fs.readdirSync(fullRefDir, { withFileTypes: true });
    }
    catch {
        return { reposCataloged: 0, atlasPath: "", summaries: [] };
    }
    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith("."))
            continue;
        const repoPath = path.join(fullRefDir, entry.name);
        const repoName = entry.name;
        let desc = "Open-source reference repository.";
        const toolsAndCommands = [];
        const keyMechanisms = [];
        // Check README for description
        const readmeCandidates = ["README.md", "readme.md", "README"];
        let readmeText = "";
        for (const r of readmeCandidates) {
            const p = path.join(repoPath, r);
            if (fs.existsSync(p)) {
                readmeText = fs.readFileSync(p, "utf-8").slice(0, 10000);
                break;
            }
        }
        if (readmeText) {
            const lines = readmeText.split("\n").filter(l => l.trim() && !l.startsWith("#") && !l.startsWith("[!") && !l.startsWith("<") && !l.startsWith("["));
            if (lines.length > 0) {
                desc = lines[0].trim().slice(0, 160);
            }
        }
        // Inspect package.json if present
        const pkgPath = path.join(repoPath, "package.json");
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
                if (pkg.description)
                    desc = pkg.description;
                if (pkg.scripts)
                    toolsAndCommands.push(...Object.keys(pkg.scripts).slice(0, 5).map(k => `npm run ${k}`));
            }
            catch { }
        }
        // Inspect Cargo.toml if present
        const cargoPath = path.join(repoPath, "Cargo.toml");
        if (fs.existsSync(cargoPath)) {
            try {
                const cargoText = fs.readFileSync(cargoPath, "utf-8");
                const descMatch = cargoText.match(/description\s*=\s*"([^"]+)"/);
                if (descMatch)
                    desc = descMatch[1];
                keyMechanisms.push("Compiled high-performance systems architecture");
            }
            catch { }
        }
        keyMechanisms.push("Reference patterns available for inspection and agent reuse.");
        summaries.push({
            repoName,
            repoPath: path.relative(projectRoot, repoPath),
            description: desc,
            toolsAndCommands,
            keyMechanisms,
        });
    }
    // Generate Reference Atlas Markdown
    let md = getAtlasProvenanceHeader("Open-Source Reference Patterns Atlas", "Indexed architectures, mechanisms, and algorithms from cloned reference repositories.");
    md += `\n> **Reference Coding Paradigm**: Before writing speculative code or complex algorithms from memory, the agent references these proven implementations to eliminate trial-and-error hallucinations.\n\n`;
    for (const s of summaries) {
        md += `## 📦 [${s.repoName}](file://${s.repoPath})\n\n`;
        md += `> ${s.description}\n\n`;
        md += `**Location**: \`${s.repoPath}\`\n\n`;
        if (s.toolsAndCommands.length > 0) {
            md += `### Core Tools & Commands\n`;
            for (const t of s.toolsAndCommands) {
                md += `- \`${t}\`\n`;
            }
            md += `\n`;
        }
        if (s.keyMechanisms.length > 0) {
            md += `### Architectural Patterns\n`;
            for (const m of s.keyMechanisms) {
                md += `- **${m}**\n`;
            }
            md += `\n`;
        }
        md += `---\n\n`;
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    const atlasPath = path.join(outDir, "00_REFERENCE_PATTERNS.md");
    fs.writeFileSync(atlasPath, md, "utf-8");
    return {
        reposCataloged: summaries.length,
        atlasPath: path.relative(projectRoot, atlasPath),
        summaries,
    };
}
