# Benchmark task set (tasks.json)

- Target project: xnight (Next.js SaaS), pinned to commit 236adb5; all ground truth verified via `git grep` / `git show` on that commit, not the working tree.
- 24 tasks: 8 locate, 6 trace, 5 impact, 5 edit (ids t01-t24).
- locate: visible UI labels and well-known modules; answers are distinctive path fragments, never bare page.tsx.
- trace: UI -> API route -> service -> DB table; each hop confirmed by fetch() call sites, imports, and SQL strings.
- impact: expected lists are the non-test importers found by grep of HEAD (app, components, lib, src).
- edit: single visible-label string changes; checked with file-contains regex on the edited checkout.
- Checks are objective: answer-contains substrings (1-4 per task) or file-contains regex; no LLM judge.
- Prompts never mention file paths or the atlas.
- Run edit tasks on a throwaway checkout of 236adb5, not the user's working tree.
