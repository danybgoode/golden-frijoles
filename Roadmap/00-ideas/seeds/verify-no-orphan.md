---
title: "Nightly model check: noOrphan violated"
slug: verify-no-orphan
status: raw
area: "09"
type: bug
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-17
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — the nightly model check found `noOrphan` violated

Filed by `verify-nightly.yml` (verify-module S2.1) on 2026-10-17. Run: https://github.com/danybgoode/golden-frijoles/actions/runs/39001310753

- `sim` `outbox_timed`, depth ≤25: expected `[ok]`, got `[violation]` — trace `verify/quint/traces/nightly-sim-outbox_timed-noOrphan.itf.json`
- `sim` `outbox_untimed`, depth ≤25: expected `[ok]`, got `[violation]` — trace `verify/quint/traces/nightly-sim-outbox_untimed-noOrphan.itf.json`

**Before anything else, decide which is wrong: the code or the model.** The model mirrors the functions pinned in
`verify/pins.json`; a model that no longer describes the code is fixed in `verify/`, and a real bug is shaped from
here with `refine`. Re-print a trace with `node verify/quint/summarize-itf.mjs <trace>`.

## The counterexamples, one step per line

### `sim` · `outbox_timed`

```
0                                       | rows - | d1[on] d2[on] | workers idle
 1                                       | rows e2/d1:pending#0 e2/d2:pending#0 | d1[on] d2[on] | workers idle
 2                                       | rows e2/d1:pending#0 e2/d2:pending#0 | d1[DELETED] d2[on] | workers idle
```

### `sim` · `outbox_untimed`

```
0                                       | rows - | d1[on] d2[on] | workers idle
 1                                       | rows e2/d1:pending#0 e2/d2:pending#0 | d1[on] d2[on] | workers idle
 2                                       | rows e2/d1:pending#0 e2/d2:pending#0 | d1[DELETED] d2[on] | workers idle
```
