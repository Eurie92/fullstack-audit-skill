# Benchmark summary

Target: C:\Users\EURIE\Dev\SaaS\xnight @ 236adb5  |  model: sonnet  |  runs/task: 1  |  budget/run: $1.5
Atlas generation (with arm, one-time): 57909 ms

CLAUDE.md hint used in "with" arm:
> This project has a pre-built code atlas. Before grepping or globbing, call the fullstack_find MCP tool (and fullstack_path / fullstack_impact / fullstack_component for relationships) to locate symbols, routes, labels and dependencies. Fall back to normal search only if it returns nothing. Before saying done on a change, call the fullstack_check MCP tool and fix every BLOCK item.

## all

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 4 | 100% | 23780 | $0.153 | 19 | 18 | 62 |
| without | 4 | 100% | 31898 | $0.155 | 13 | 12 | 48 |

## build-ui

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 4 | 100% | 23780 | $0.153 | 19 | 18 | 62 |
| without | 4 | 100% | 31898 | $0.155 | 13 | 12 | 48 |

## unfinished work left behind (check-clean tasks)

| arm | runs | runs with BLOCK leftovers | total BLOCK items |
|---|---|---|---|
| with | 4 | 0 | 0 |
| without | 4 | 0 | 0 |

