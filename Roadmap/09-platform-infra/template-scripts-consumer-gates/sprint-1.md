---
epic: template-scripts-consumer-gates
sprint: 1
title: "Consumer gates at the source"
risk: high
phase: Shipped
stories_total: 3
stories:
  - id: S1.1
    title: "Template scripts are linted where they are written"
    as_a: "a project that copies the plugin's scripts"
    i_want: "unused bindings caught in skills-ci, and the vendored scripts ignored by my Prettier check"
    so_that: "a plugin release never fails my gate"
    risk: low
    status: done
  - id: S1.2
    title: "Scripts run through a symlinked path"
    as_a: "a founder whose checkout sits behind a symlink"
    i_want: "every template script to act when I run it, not exit 0 having done nothing"
    so_that: "a silent no-op never looks like success"
    risk: low
    status: done
  - id: S1.3
    title: "perf-probe only requests the hosts a project names"
    as_a: "a project owner whose CI runs the smoke probe"
    i_want: "the probe to refuse internal addresses and other origins unless I opt in"
    so_that: "a config edit can't point my runner at an internal address"
    risk: high
    status: done
---
# Template scripts hold to the gates their consumers run — Sprint 1: Consumer gates at the source

**Status:** ✅ shipped 2026-10-17: #399, merge 9db9811, plugin + kit 1.12.0

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — Template scripts are linted where they are written ✅ (84fa702, 6b6c49b)
**As** a project that copies the plugin's scripts, **I want** unused bindings caught in skills-ci, and the vendored
scripts ignored by my Prettier check, **so that** a plugin release never fails my gate.
**Acceptance:** skills-ci (`scripts/render-skills-ci.mjs` → `.github/workflows/skills-ci.yml`) runs ESLint
`no-unused-vars` with `--max-warnings=0` over `skills/template/scripts` and the plugin's hooks; a fixture with an
unused import fails it. `frijoles-kit init` writes one marked `.prettierignore` block for the vendored scripts, and
running it twice changes nothing (decided 2026-10-14).
**Risk:** low

### Story 1.2 — Scripts run through a symlinked path ✅ (5a41f4a, ba36525, 60737ff, 946ba3a)
**As** a founder whose checkout sits behind a symlink, **I want** every template script to act when I run it, not exit
0 having done nothing, **so that** a silent no-op never looks like success.
**Acceptance:** `lib/is-main.mjs` compares realpaths on both sides; the 17 template and 5 plugin scripts use it. A test
runs one through a symlinked directory and sees it act. A guard fails CI on the lexical
`resolve(process.argv[1]) === fileURLToPath(import.meta.url)` form. `check-script-parity` stays green.
**Risk:** low

### Story 1.3 — perf-probe only requests the hosts a project names ✅ (7c6409e, 319ca75)
**As** a project owner whose CI runs the smoke probe, **I want** the probe to refuse internal addresses and other
origins unless I opt in, **so that** a config edit can't point my runner at an internal address.
**Acceptance:** `perf-probe.mjs` resolves `baseUrl`'s host and refuses loopback, link-local and private ranges
(`127.0.0.1`, `169.254.169.254`, `10.0.0.1`, and a hostname resolving to one) unless `smoke.perf.allowPrivate: true`;
it fetches assets only from `baseUrl`'s own origin. A test per refusal. DNS rebinding is a stated residual.
**Risk:** high (security). Security lens on review.

## Build contract (locked by the architect before the builder started)
Cites the README's D1–D9. S1.1 = D1 + D2 + D3 (the three baseline findings fixed in the same diff). S1.2 = D4 + D5 + D6
(all 59 entries, not 22: README, *Corrections*). S1.3 = D7, with the security lens on review. Release = D8. Routing
= D9. The order inside the PR: D4's helper first (59 files import it), then S1.2, S1.1 and S1.3, then the release last.
Every acceptance below holds as written except the counts, which D4 corrects.

## Sprint QA
- **specs:** node tests in skills-ci for each story; this repo's `check-script-parity`.
- **browser smoke owed:** no.
- **deterministic gate:** skills-ci green, plus this repo's `npm run lint` and static gate.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: a scratch repo (an agent can run this).

1. `mkdir -p /tmp/gf-real && ln -s /tmp/gf-real /tmp/gf-link && cd /tmp/gf-link && npx -y @golden-frijoles/kit@<new> init`
   → it initialises (it doesn't exit silently), and `.prettierignore` has one marked block.
2. Run the same init again.
   → `.prettierignore` is unchanged.
3. Set `smoke.perf.baseUrl` to `http://169.254.169.254` in `golden-frijoles.config.json`, then run the perf probe.
   → it refuses, naming the address and the `allowPrivate` opt-in.

If any step fails, note the step number + what you saw — that's the bug report.

### Walkthrough run (2026-10-17, by the agent, against the published 1.12.0)
`/tmp` became the session scratchpad: `gf-real` was the directory, and `gf-link` a symlink to it.
1. ✅ `npx -y @golden-frijoles/kit@1.12.0 init` from `gf-link` printed `wrote Roadmap/…` six times, then
   `wrote .prettierignore (rails block, new file)` and `6 written, 0 already present`. `.prettierignore` holds one
   block: one opener, one closer, and 225 rail paths between them.
2. ✅ Run again: `skipped .prettierignore (rails block current)` and `0 written, 6 already present`. `shasum -c`
   reported the file unchanged.
3. ✅ The kit doesn't serve `perf-probe`, because no skill declares it. A project gets it by copying the template,
   so I copied the `v1.12.0` mirror tag's `template/scripts/perf-probe.mjs` and `lib/` into `gf-real/scripts`. Run
   through the link with `smoke.perf.baseUrl: http://169.254.169.254`, it printed `refusing
   http://169.254.169.254/: 169.254.169.254 is a private, loopback or link-local address. Set
   smoke.perf.allowPrivate: true to probe a host on your own network.` and exited 1. The `--dry-run` refused the same
   way, with no network call. Because it ran through the symlinked path, the probe also proves S1.2 live.
- Also verified live: `npm view @golden-frijoles/kit@1.12.0` is published, release `v1.12.0` exists on
  golden-frijoles/skills, the production deploy of 9db9811 succeeded, and `goldenfrijoles.com/install.md` serves
  1.12.0.
