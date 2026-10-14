---
title: "Template scripts hold to the gates their consumers run"
slug: template-scripts-consumer-gates
status: raw
area: "09"
type: chore
appetite: S
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-14
---

# Seed — the template scripts pass the consumers' gates before the copy-in does

**Consolidated 2026-10-14** from three chores, now archived: [`foundation-lint-gate`](foundation-lint-gate.md),
[`script-ismain-realpath`](script-ismain-realpath.md) and [`perf-probe-target-allowlist`](perf-probe-target-allowlist.md).
All three harden `skills/template/scripts`, each one ends in a CI guard, and together they make one plugin release
(`skills/RELEASING.md`).

## What it carries

1. **Lint.** `eslint.config.mjs` still ignores `skills/**` ("linting them is `foundation-lint-gate`'s job"). The
   consumers run `eslint --max-warnings=0` and Prettier on changed files, so unused bindings and unformatted files
   reached them twice (plugin waves 1 and 2). Run at least `no-unused-vars` over the template scripts in CI, and decide
   once whether shared rails are Prettier-formatted at the source or ignored by every consumer.
2. **`isMain` by realpath.** Scripts compare `resolve(process.argv[1]) === fileURLToPath(import.meta.url)`, which is
   false under a symlinked path (macOS `/var` → `/private/var`), so the script does nothing and exits 0. That form
   appeared in about 50 files on 2026-10-14, counting mirrors. Add one helper in `lib/` comparing realpaths, and a
   CI guard that fails on the lexical form.
3. **perf-probe's targets.** `perf-probe.mjs` checks only for an `http(s)` prefix on `baseUrl` and follows the
   `/_next/static/…` URLs the HTML names, so a config edit could point a runner at `169.254.169.254`. Refuse
   link-local, loopback and private ranges unless the project opts in, and fetch assets only from `baseUrl`'s own
   origin, with a test for each refusal.

## Note

This can share a plugin release window with `build-view-one-story`.
