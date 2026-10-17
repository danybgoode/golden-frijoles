# verify/ — the models that check our riskiest code

Two pieces of this codebase are checked by a model on every PR that touches them, and in depth every night. They
came out of [`verify-spike`](../Roadmap/09-platform-infra/verify-spike/DECISION.md), which found three bugs the
code's review rounds had missed; [`verify-module`](../Roadmap/09-platform-infra/verify-module/README.md) moved them
into CI.

| What | Model | Mirrors | Per PR (path-filtered) | Nightly |
|---|---|---|---|---|
| The delivery outbox | [`quint/outbox.qnt`](quint/outbox.qnt) | six SQL functions + the dispatcher (`pins.json`) | `verify-outbox`: `quint/check.sh quick` + `teeth` | `quint/check.sh` (exhaustive, Apalache) |
| The flag evaluator | [`lean/Flageval/Model.lean`](lean/Flageval/Model.lean) | `packages/sdk/src/flags.ts` (`pins.json`) | `verify-flags`: `lean/check.sh` | — |

## The rules

1. **A model mirrors pinned code.** [`pins.json`](pins.json) holds a hash of every function a model mirrors and of
   the model itself; the static gate (`node scripts/verify-pins.mjs`) fails when one side moves without the other.
   Comments and whitespace don't count. When it fails: update the model and re-run its check, or — if the change
   can't affect what the model describes — say why in the PR and re-pin with `node scripts/verify-pins.mjs --write`.
2. **A protocol gets a per-PR simulation.** `quint run` over every invariant, in both timing modes, against the one
   expected table in [`quint/check.sh`](quint/check.sh). Some rows are expected violations (F1 is an accepted
   residual, F3 holds only with the timing order, W1 is a witness); a change in any row is a failure.
3. **The exhaustive check runs nightly, never per PR.** It takes most of an hour. It also re-finds F2 on the pre-#373
   model (`outbox_timed_prefix`) every night, so a check that has lost its reach goes red instead of quietly passing.
4. **No proof tier without a differential test against the real code.** The spike's Lean model once disagreed with
   the shipped evaluator on 8% of inputs while every theorem still held (F6). `lean/check.sh` runs the proofs, then
   the [differential test](diff-test/run.mjs) on three seeds, then a mutant the test must catch.

Every check also runs a **teeth** step: a known mutant it must fail. A check that passes its own mutant has stopped
checking anything, and says so.

## Run it locally

```bash
bash verify/quint/check.sh quick     # the per-PR simulation table (~1.5 min; npx fetches Quint 0.33.0)
bash verify/quint/check.sh teeth     # the mutant must fail
bash verify/quint/check.sh           # + the exhaustive table (~50 min; Java 17+)
bash verify/lean/check.sh            # build, axioms, differential test, mutant (needs elan)
node scripts/verify-pins.mjs         # are the models in step with the code?
```

Print a counterexample one step per line: `node verify/quint/summarize-itf.mjs <trace.itf.json>`.
