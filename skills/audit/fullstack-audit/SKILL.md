---
name: fullstack-audit
description: Universal fullstack architecture and design system atlas. Structural lookup for routes, components, design tokens, query keys, API routes, and DB models, alongside normal search.
---

# Fullstack Audit Skill (Hermes Agent Specification)

Execute `npx fullstack-audit` to catalog the entire repository into `docs/frontend-atlas/` and `docs/backend-atlas/`.

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
- Do not claim a task is complete without fresh evidence (command output, exit code 0).

### Keep changes small (ponytail)
- Solve the whole request with the least new code: reuse existing helpers and components, prefer platform features, no new dependency for a few lines, no unrequested options or abstractions.
- Never cut validation at trust boundaries, auth checks, data-loss error handling, or accessibility.

### Reply style (caveman)
- Answer first, with exact technical facts. Skip filler, preamble and recap. End edit replies with the target `file:line`, the change, and the check you ran.

### Commands
- MCP tools: `fullstack_find`, `fullstack_locate_visual`, `fullstack_resolve`, `fullstack_path`, `fullstack_symbol`, `fullstack_patch`, `fullstack_audit`
- `/fullstack-audit` or `npx fullstack-audit`: rebuild the atlas and `docs/llms.txt`
- `npx fullstack-audit --theme --route <route> --compact`: design-token punchlist for one route
- `npx fullstack-audit --verify --gate-clean`: typecheck and atlas gate
- `npx fullstack-audit --diff`: architecture changes since the last scan
- `npx fullstack-audit --dead`: components that nothing imports
<!-- END_FRONTEND_AUDIT_RULE -->
<!-- END_FULLSTACK_AUDIT_RULE -->