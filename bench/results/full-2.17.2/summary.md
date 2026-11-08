# Benchmark summary (partial: 120 of 144 runs, stopped early)

Target: xnight @ 236adb5 | model: sonnet | budget/run: $1.00

## all

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 58 | 79% | 5168 | $0.042 | 5 | 4 | 15 |
| without | 62 | 77% | 3526 | $0.024 | 3 | 2 | 12 |

## locate

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 15 | 87% | 5735 | $0.043 | 5 | 4 | 16 |
| without | 20 | 90% | 2881 | $0.022 | 3 | 2 | 10 |

## trace

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 13 | 92% | 9604 | $0.065 | 9 | 8 | 21 |
| without | 12 | 75% | 10165 | $0.060 | 6 | 5 | 17 |

## impact

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 15 | 100% | 4925 | $0.042 | 5 | 4 | 14 |
| without | 15 | 100% | 5056 | $0.033 | 4 | 3 | 13 |

## edit

| arm | runs | success | median tokens | median cost | median turns | median tool calls | median wall s |
|---|---|---|---|---|---|---|---|
| with | 15 | 40% | 1444 | $0.023 | 5 | 4 | 13 |
| without | 15 | 40% | 829 | $0.014 | 3 | 2 | 9 |

Total spend: $4.79. with-arm runs missing fullstack tools: 0.
with-arm runs that called a fullstack_* tool: 58 of 58.
