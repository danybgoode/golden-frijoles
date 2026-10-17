# Template scripts hold to the gates their consumers run — Retrospective

_Closed: 2026-10-17_
_Intent: owed to Daniel (yes | mostly | no)_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: quote $5–17 (S, n=7, p25–p75) → ≈$26.24 (+54% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$26.24 built and orchestrated · reviewers agy gemini-3.8-flash-high (general,
scoped to 17 files), vibe (security, scoped, a bare "Nothing found"), agy gpt-oss-120b-medium (security, scoped to
perf-probe, 2 clean runs), the fresh verifier (2 rounds) · prose Claude. Codex was routed first but capped, and
gpt-oss couldn't hold the general pass in its context, so the general pass fell to Gemini Flash._

## What shipped
One PR, #399 (merge 9db9811), plugin + kit **1.12.0**: published to npm, tagged `v1.12.0` on the mirror, and
deployed to production.
- **S1.1: the rails are linted where they're written.** `skills/eslint.config.mjs` is the one rule source: core
  ESLint, `no-unused-vars`. The mirror's skills-ci runs it with `--max-warnings=0`, plus a committed fixture with an
  unused import that must fail. The monorepo's `npm run lint` spreads the same file with `basePath: 'skills'`.
  `frijoles-kit init` merges one marked block from a generated `template/.prettierignore`, listing 225 rail paths.
- **S1.2: scripts run through a symlinked path.** `lib/is-main.mjs` realpaths both sides, and all **59** entries
  call it: 54 template, 5 plugin. 34 of them compared paths lexically and silently exited 0 behind a symlink.
  `check-is-main.mjs` fails CI on any other spelling, and the symlink test proves one entry per broken spelling.
- **S1.3: perf-probe only requests the hosts a project names.** It refuses private, loopback, link-local and
  reserved addresses unless `allowPrivate: true`, checking before any request and again at connect through a guarded
  lookup, so rebinding is closed too. Every request gets a direct agent, so an env proxy can't route around the
  check. Client scripts on another origin make the run red, and it never follows redirects.
- Smoke walkthrough: 3 of 3 steps pass against the published 1.12.0 (sprint-1.md).

## What went well
- **The lock disproved the scope before the build.** Counting live code turned 22 entries into 59, and the lint
  baseline from 13 into 3. It also showed that `init` wrote nothing outside `Roadmap/` and that skills-ci has no
  install step. Each correction went into the README before any code.
- **Every guard was mutation-checked against `main`.** `check-is-main` run on `origin/main`'s tree finds exactly the
  59. The new symlink entries fail there and pass here. Removing the guarded lookup, the origin filter or the direct
  agent each fails a named test.
- **The new lint caught the migration's own leftovers.** It found 4 imports the scripted migration left unused, and
  1 `main()` that a greedy regex had swallowed, before any test ran.

## What we learned
- **A security residual written from memory is a claim, and it needs a test like any other.** The header said
  "node:http ignores HTTP(S)_PROXY". On Node 24 with `NODE_USE_ENV_PROXY=1` that is false: the guarded lookup
  resolved the proxy, and a refused name came back 200. The verifier reproduced it; two security passes missed it.
- **Never run a rail with `--help` to see what it does.** `build-order-sync.mjs` ignores the flag and runs: it
  switched the checkout to a new branch and committed. My next two commits landed there, and a PR comment cited a
  fix that wasn't on the PR. In the same session, `owed-ledger.mjs --bogus` wrote a ledger into the template. Read
  the arg parser first, or run it in a scratch copy.
- **A big mechanical diff can't be read by a single external pass.** At 292 KB (the 59 migrations plus their
  vendored copies), agy refused it on size, and gpt-oss refused even 17 files on context. Every external pass was
  scoped, so the fresh verifier was the only full read of the migration. Plan for that, and give the verifier the
  mechanical sweep explicitly.
- **A test that travels with the rails must skip what a project didn't copy, by name.** The root `scripts/` copy of
  the symlink test failed on the missing `perf-probe`.

## Gaps / follow-ups
- **Owed (judgment):** _Intent_, Daniel's one word.
- **Over the quote by 54%.** The quote assumed 22 files and one review round. The live count was 59, plus a merge
  onto 1.11.1, and two verifier rounds that found the proxy bypass.
- Not done, by design: the no-gos stand. Consumers' full ESLint configs aren't adopted at the source, and
  `skills/scripts/` (the plugin repo's own tooling) keeps its own entry checks, out of the guard's scope.
- NAT64 `64:ff9b::/96` remains a stated residual in perf-probe.
