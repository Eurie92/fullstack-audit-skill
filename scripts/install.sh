#!/usr/bin/env bash
# fullstack-audit-skill — One-line installer & updater (Linux / macOS)
#
# Usage:
#   # Recommended: Full Synergy Triad (Audit + Ponytail + Caveman + Superpowers)
#   curl -fsSL https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.sh | bash
#
#   # Standalone Mode (Zero external dependencies):
#   curl -fsSL https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main/scripts/install.sh | bash -s -- --standalone

set -e

PROFILE="triad"
WITH_PONYTAIL=""
WITH_CAVEMAN=""
WITH_SUPERPOWERS=""
NO_PONYTAIL=0
NO_CAVEMAN=0
NO_SUPERPOWERS=0

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --standalone) PROFILE="standalone" ;;
        --profile) PROFILE="$2"; shift ;;
        --with-ponytail) WITH_PONYTAIL=1 ;;
        --with-caveman) WITH_CAVEMAN=1 ;;
        --with-superpowers) WITH_SUPERPOWERS=1 ;;
        --no-ponytail) NO_PONYTAIL=1 ;;
        --no-caveman) NO_CAVEMAN=1 ;;
        --no-superpowers) NO_SUPERPOWERS=1 ;;
        *) echo "Unknown option: $1" ;;
    esac
    shift
done

ENABLE_PONYTAIL=0
ENABLE_CAVEMAN=0
ENABLE_SUPER=0

if [ "$PROFILE" = "triad" ]; then
    ENABLE_PONYTAIL=1
    ENABLE_CAVEMAN=1
    ENABLE_SUPER=1
fi

[ -n "$WITH_PONYTAIL" ] && ENABLE_PONYTAIL=1
[ -n "$WITH_CAVEMAN" ] && ENABLE_CAVEMAN=1
[ -n "$WITH_SUPERPOWERS" ] && ENABLE_SUPER=1
[ "$NO_PONYTAIL" -eq 1 ] && ENABLE_PONYTAIL=0
[ "$NO_CAVEMAN" -eq 1 ] && ENABLE_CAVEMAN=0
[ "$NO_SUPERPOWERS" -eq 1 ] && ENABLE_SUPER=0

if [ "$PROFILE" = "standalone" ]; then
    ENABLE_PONYTAIL=0
    ENABLE_CAVEMAN=0
    ENABLE_SUPER=0
fi

TARGET_DIR=".agent/skills/fullstack-audit"
mkdir -p "$TARGET_DIR/scripts"
mkdir -p "$TARGET_DIR/bin"

BASE_URL="https://raw.githubusercontent.com/Eurie92/fullstack-audit-skill/main"

echo "📥 Installing / Updating fullstack-audit-skill (Profile: $PROFILE)..."
curl -fsSL "$BASE_URL/SKILL.md" -o "$TARGET_DIR/SKILL.md"
curl -fsSL "$BASE_URL/scripts/audit.ts" -o "$TARGET_DIR/scripts/audit.ts"
curl -fsSL "$BASE_URL/scripts/audit-backend.ts" -o "$TARGET_DIR/scripts/audit-backend.ts"
curl -fsSL "$BASE_URL/scripts/constants.ts" -o "$TARGET_DIR/scripts/constants.ts"
for f in precision-patcher.ts adaptive-sniffer.ts reference-cataloger.ts; do curl -fsSL "$BASE_URL/scripts/$f" -o "$TARGET_DIR/scripts/$f"; done
curl -fsSL "$BASE_URL/bin/audit.js" -o "$TARGET_DIR/bin/audit.js"
curl -fsSL "$BASE_URL/bin/path-contained.js" -o "$TARGET_DIR/bin/path-contained.js"

# Construct rule block (same text as generateDynamicRuleBlock in scripts/audit.ts)
RULE_BLOCK="$(cat <<'RULE_EOF'
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
RULE_EOF
)"
[ "$ENABLE_SUPER" -eq 1 ] && RULE_BLOCK+=$'\n'"$(cat <<'RULE_EOF'
- Do not claim a task is complete without fresh evidence (command output, exit code 0).
RULE_EOF
)"
[ "$ENABLE_PONYTAIL" -eq 1 ] && RULE_BLOCK+=$'\n'"$(cat <<'RULE_EOF'

### Keep changes small (ponytail)
- Solve the whole request with the least new code: reuse existing helpers and components, prefer platform features, no new dependency for a few lines, no unrequested options or abstractions.
- Never cut validation at trust boundaries, auth checks, data-loss error handling, or accessibility.
RULE_EOF
)"
[ "$ENABLE_CAVEMAN" -eq 1 ] && RULE_BLOCK+=$'\n'"$(cat <<'RULE_EOF'

### Reply style (caveman)
- Answer first, with exact technical facts. Skip filler, preamble and recap. End edit replies with the target `file:line`, the change, and the check you ran.
RULE_EOF
)"
RULE_BLOCK+=$'\n'"$(cat <<'RULE_EOF'

### Commands
- MCP tools: `fullstack_find`, `fullstack_locate_visual`, `fullstack_resolve`, `fullstack_path`, `fullstack_symbol`, `fullstack_patch`, `fullstack_audit`
- `/fullstack-audit` or `npx fullstack-audit`: rebuild the atlas and `docs/llms.txt`
- `npx fullstack-audit --theme --route <route> --compact`: design-token punchlist for one route
- `npx fullstack-audit --verify --gate-clean`: typecheck and atlas gate
- `npx fullstack-audit --diff`: architecture changes since the last scan
- `npx fullstack-audit --dead`: components that nothing imports
<!-- END_FRONTEND_AUDIT_RULE -->
<!-- END_FULLSTACK_AUDIT_RULE -->
RULE_EOF
)"

TARGET_FILES=()
[ -f "AGENTS.md" ] && TARGET_FILES+=("AGENTS.md")
[ -f "CLAUDE.md" ] && TARGET_FILES+=("CLAUDE.md")

# Only update GEMINI.md if it already explicitly contains the audit marker
if [ -f "GEMINI.md" ]; then
    if grep -q "START_FULLSTACK_AUDIT_RULE\|START_FRONTEND_AUDIT_RULE" "GEMINI.md" 2>/dev/null; then
        TARGET_FILES+=("GEMINI.md")
    fi
fi

if [ ${#TARGET_FILES[@]} -eq 0 ] && [ ! -f "AGENTS.md" ]; then
    TARGET_FILES+=("AGENTS.md")
fi

for TARGET_FILE in "${TARGET_FILES[@]}"; do
    if [ -f "$TARGET_FILE" ]; then
        if command -v node >/dev/null 2>&1; then
            FULLSTACK_RULE_CONTENT="$RULE_BLOCK" node -e '
const fs = require("fs");
const target = process.argv[1];
const newRule = process.env.FULLSTACK_RULE_CONTENT;
let content = fs.readFileSync(target, "utf8");
const markerPattern = /(?:<!-- START_FULLSTACK_AUDIT_RULE -->[\s\S]*?<!-- END_FULLSTACK_AUDIT_RULE -->|<!-- START_FRONTEND_AUDIT_RULE -->[\s\S]*?<!-- END_FRONTEND_AUDIT_RULE -->)/;
const legacyPattern = /##[ \t]*[^\r\n#]*?(?:Fullstack|Frontend) Architecture\s*&(?:amp;)?\s*Component Lookup[^\r\n]*[\s\S]*?(?=(?:\r?\n---|\r?\n##\s+(?!Available Commands)[^\r\n]+)|$)/;

if (markerPattern.test(content)) {
    content = content.replace(markerPattern, () => newRule);
    console.log(`Cleanly updated Fullstack Architecture Rule in ${target}`);
} else if (legacyPattern.test(content)) {
    content = content.replace(legacyPattern, () => newRule);
    console.log(`Upgraded legacy Architecture Rule in-place in ${target}`);
} else if (target !== "GEMINI.md") {
    content = content.trimEnd() + "\n\n" + newRule + "\n";
    console.log(`Injected Fullstack Architecture Rule into ${target}`);
}
fs.writeFileSync(target, content, "utf8");
' "$TARGET_FILE"
        else
            if [ "$TARGET_FILE" != "GEMINI.md" ]; then
                echo -e "\n$RULE_BLOCK" >> "$TARGET_FILE"
                echo "Injected Fullstack Architecture Rule into $TARGET_FILE"
            fi
        fi
    else
        echo -e "# $TARGET_FILE — Workspace Guidelines for AI Assistants\n\n$RULE_BLOCK\n" > "$TARGET_FILE"
        echo "Created $TARGET_FILE with 100% Always-Active Fullstack Atlas rule!"
    fi
done

# Mirror to .agent/skills/frontend-audit for 100% backward compatibility
LEGACY_DIR=".agent/skills/frontend-audit"
if [ -d "$LEGACY_DIR" ]; then
    mkdir -p "$LEGACY_DIR/scripts"
    mkdir -p "$LEGACY_DIR/bin"
    cp -f "$TARGET_DIR/SKILL.md" "$LEGACY_DIR/SKILL.md"
    cp -f "$TARGET_DIR/scripts/audit.ts" "$LEGACY_DIR/scripts/audit.ts"
    cp -f "$TARGET_DIR/scripts/audit-backend.ts" "$LEGACY_DIR/scripts/audit-backend.ts"
    cp -f "$TARGET_DIR/scripts/constants.ts" "$LEGACY_DIR/scripts/constants.ts"
    cp -f "$TARGET_DIR/bin/audit.js" "$LEGACY_DIR/bin/audit.js"
fi

echo "✅ fullstack-audit-skill successfully installed / updated in $TARGET_DIR!"
echo "💡 You can now type '/fullstack-audit' (or '/frontend-audit') directly in your AI chat."
