---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-17T15:09:30Z"
slug: template-scripts-consumer-gates
title: "Template scripts hold to the gates their consumers run"
area: 09-platform-infra
risk: high
type: chore
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 90   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 5    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 17
quote_basis: "S, n=7, p25–p75"
hypothesis: null   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: null   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: null   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: null   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 96      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Template scripts hold to the gates their consumers run

> **Area:** 09-platform-infra · **Risk:** high · **Class:** Chore · **Scope seed:** [`00-ideas/seeds/template-scripts-consumer-gates.md`](../../00-ideas/seeds/template-scripts-consumer-gates.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Keeps the plugin's shared scripts from breaking the projects that copy them: lint caught at the source, scripts that
run through a symlinked path instead of silently exiting 0, and a smoke probe that can't be pointed at an internal
address. Three chores merged into one plugin release (2026-10-14).


## Platform-first note
No product surface. Rules #1–#6 untouched. The scripts live in `skills/` (mirrored to golden-frijoles/skills), so the
work is a plugin release (`skills/RELEASING.md`).


## What already exists (reuse, don't rebuild)
- `eslint.config.mjs`, `scripts/render-skills-ci.mjs` → `.github/workflows/skills-ci.yml`, `scripts/check-script-parity.mjs`.
- `skills/template/scripts/lib/config.mjs` and `render-ways-of-working.mjs` (the realpath form).
- `skills/template/scripts/perf-probe.mjs`, `smoke.perf` in `golden-frijoles.config.json`.


## Architecture lock (2026-10-17, verified against live code and data)

Read live on `origin/main` d1ea6b2: `eslint.config.mjs`, `skills/.github/workflows/ci.yml` (→ `scripts/render-skills-ci.mjs`
→ `.github/workflows/skills-ci.yml`), `skills/scripts/render-hook-vendor.mjs`, `scripts/check-script-parity.mjs`,
`skills/template/scripts/{init,perf-probe}.mjs`, `skills/scripts/build-kit.mjs`, and every `process.argv[1]` comparison
under `skills/`. Live data: Miyagi's `perf-probe.config.json` (the one consumer with a probe config; this repo has no
`smoke.perf`) and the page it probes. Each decision lives here once; the sprint's build contract cites them.

**Corrections the live system forced (said out loud):**
- **59 entry checks, not 22.** 54 template files (`template/scripts`, `template/optional`) and 5 plugin files hand-roll
  "was I run directly?" in six spellings. 34 of them break behind a symlink (`resolve(argv[1]) === …`, a bare
  `=== process.argv[1]`, `pathToFileURL(argv[1]).href === …`): 30 template, 4 plugin. 5 realpath one side only (right
  unless `--preserve-symlinks-main`), 19 already realpath both sides, and `init.mjs` matches `endsWith('init.mjs')`.
  All 59 move to the one helper (D4), so one guard can ban every other spelling (D5). 43 of the 54 have a
  byte-identical copy in this repo's `scripts/`, which `check-script-parity` keeps; they are re-copied.
- **The plugin's refine scripts can't import from `template/`.** An installed plugin holds `agents/ hooks/ skills/`
  only (render-hook-vendor's header). They import `./vendor/lib/is-main.mjs`, which the refine bundle carries (D4).
- **`frijoles-kit init` writes nothing outside `Roadmap/` today** (its header's one rule). The `.prettierignore` block
  is the first exception, and it is a merge into a marked block, never an overwrite of the file (D3).
- **skills-ci has no install step and no `package.json`** ("deliberately minimal and zero-dependency"). ESLint arrives
  as a pinned global install, the same as the claude-code step's (D2). This repo's own `npm run lint` lints the same
  files from its lockfile, so the gate also holds here whatever npm does (D1).
- **The lint baseline is 3, not 13.** `no-unused-vars` over the template's scripts and the plugin's scripts today:
  `refine/read-product.mjs:20` (`existsSync`), `prod-smoke.mjs:539` (`body`), and `prod-smoke.checks.example.mjs:19`,
  whose disable comment is malformed (`— for…` instead of `-- for…`). The waves' 13 were fixed downstream, not here.
  All three are fixed in S1.1, so the gate lands green.
- **Same-origin assets don't break the one real consumer.** Miyagi probes `https://miyagisanchez.com` (Cloudflare,
  104.21.10.238 / 172.67.164.209, which is outside 172.16/12), and its Next chunks are relative `/_next/static/…` paths.
- **DNS rebinding: closed, at no extra cost, not left as a residual.** The pitch puts rebinding defence out of scope
  ("resolves once"). The check that does the in-scope job best, though, is a `lookup` hook on the request: it validates
  the address the socket actually connects to, so nothing can rebind between the check and the connect. It is the same
  amount of code as resolving first. The stated residuals change to the ones in D7.

**D1 — One lint rule source, run in two places.** `skills/eslint.config.mjs` (new; core ESLint only, no plugin imports)
exports `RAILS`: a global-ignores object (`**/*.{mjs,js,cjs}`, then un-ignore `template/scripts/**/*.mjs`,
`template/optional/**/*.mjs`, `plugins/golden-frijoles/hooks/*.mjs` and `plugins/golden-frijoles/skills/**/*.mjs`,
and ignore `**/vendor/**`: the vendored copies are generated from `template/scripts` and linted there) plus one rules
object: `no-unused-vars` at `error` with `argsIgnorePattern`/`varsIgnorePattern` `^_`, the same options as the root
config's `scripts/` block. Its default export is `RAILS`, and it is what the mirror lints. The root `eslint.config.mjs`
drops its `skills/**` ignore and spreads `RAILS` with `basePath: 'skills'` (ESLint ≥ 9.30; the root has 9.39.5), so
`npm run lint` (`--max-warnings=0`, in `ci.yml`'s static job) lints the same files with the same rule. The rule lives
in one file. Its `files`/`ignores` are relative to `skills/` in both places. (Verified in a scratch tree: the same
config reports the same finding from the root and from `skills/`, and ignores the vendor copy in both.)

**D2 — The skills-ci step, and its teeth.** In `skills/.github/workflows/ci.yml`, a step named `rails lint — unused
bindings fail the release` runs `npm i -g eslint@9.39.5 --no-audit --no-fund` (failure: `::warning::` and skip, the
doctrine of every network install there, because D1's root run is the deterministic copy), then
`eslint . --max-warnings=0`, then the teeth: `eslint --no-ignore scripts/fixtures/rails-lint-teeth.mjs` must exit 1
(a committed one-line fixture with an unused import), or the step fails with "the rails lint has no teeth". Rendered
into `.github/workflows/skills-ci.yml` by `node scripts/render-skills-ci.mjs`.

**D3 — Consumers ignore the vendored rails through one marked `.prettierignore` block (Daniel, 2026-10-14, decision
a).** `skills/template/.prettierignore` (new) holds only the block:
`# >>> golden-frijoles rails (written by frijoles-kit init; edit outside this block) >>>`, one `scripts/<rel>` line
per `.mjs`, `.mts`, `.json` and `.html` file under `template/scripts/` (sorted), then `# <<< golden-frijoles rails <<<`.
It is generated, not hand-kept: `skills/scripts/render-prettier-block.mjs` writes it, and `--check` fails skills-ci when it is
stale. `init.mjs` gains `upsertPrettierBlock({ project, source })`, which reads the block from
`skeletonRoot()/.prettierignore`, and then writes `<project>/.prettierignore`: it creates the file, or appends the
block, or replaces the existing block in place. Lines outside the markers are never touched, and when nothing changes
it writes nothing (`skipped .prettierignore (rails block current)`). A file with two openers, or an opener without a
closer, is refused with a message, never guessed at. `build-kit.mjs` copies `template/.prettierignore` to
`kit/dist/skeleton/.prettierignore` next to `SKELETON` (a second exported list, `MERGED = ['.prettierignore']`). It is
not added to `SKELETON`, whose rule is "never overwrite".

**D4 — `lib/is-main.mjs`, the one entry check.** `skills/template/scripts/lib/is-main.mjs` exports
`isMain(metaUrl, argv1 = process.argv[1])`: it returns `false` when `argv1` is empty, and otherwise
`realpathSync(argv1) === realpathSync(fileURLToPath(metaUrl))`. Any throw (a missing path) returns `false`. All 59
files call `isMain(import.meta.url)`, and each file's own `const isMain = …` / `function isMain` goes away. The
plugin's five import `./vendor/lib/is-main.mjs`, and the refine bundle in `render-hook-vendor.mjs` gains
`'lib/is-main.mjs'` in `also`, so the import never depends on what the kickoff generators happen to import. Copies are
regenerated, never hand-edited: `node skills/scripts/render-hook-vendor.mjs` for both bundles, and a plain copy to
`scripts/` (plus `scripts/lib/is-main.mjs`) and to `skills/scripts/` for the files skills-ci `cmp`s. New and modified
files are formatted with the root Prettier first, and then checked from `skills/` (LEARNINGS: two Prettier configs).

**D5 — The guard.** `skills/scripts/check-is-main.mjs` (new; zero deps, exit 0 / 1 / 2 = ok / found / could not look):
it walks `template/scripts`, `template/optional` and `plugins/` (vendor included, since those copies ship), skipping
`*.test.mjs` and any `is-main.mjs`. A line fails when it reads `process.argv[1]` and also names `import.meta.url`, or
calls `.endsWith(` on it. The failure names `file:line` and the fix (`isMain(import.meta.url)` from `lib/is-main.mjs`).
It has a test with fixtures for each of the six spellings found here, and one clean file. It runs in skills-ci next to
`check-config-reads`. `skills/scripts/` (the plugin repo's own build tooling, which no consumer runs) and
`kit/bin.mjs` (already realpath on both sides) are out of its scope.

**D6 — The symlink test grows to prove it.** `rail-entry-symlink.test.mjs` keeps its five entries and adds one
previously-lexical entry per spelling that was broken: `epic-dod.mjs` (`resolve`), `babysit-pr.mjs` (the same,
reversed), `cold-read.mjs` (bare `===`) and `perf-probe.mjs` (`pathToFileURL`). Each one must print its proof through
the symlinked directory. One more test spawns a temp `is-main` probe through a symlinked dir and checks that
`isMain` is true there and false when a real file run as main imports it. **Amended at build (2026-10-17):**
`owed-ledger.mjs` was dropped because its run wrote a ledger into the project it resolved, and a proof must only print.
`init.mjs` was dropped because it writes into the project root, and its `endsWith` form never broke behind a link.
An entry a project didn't copy is skipped by name: this repo's `scripts/` has neither `perf-probe` nor `babysit-pr`.

**D7 — perf-probe only requests the hosts a project names.** All of it is in `perf-probe.mjs`, which is the only user.
- `isPrivateAddress(ip)`: a `net.BlockList` of IPv4 `0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24,
  192.168/16, 198.18/15, 224/4, 240/4` and IPv6 `::/128, ::1/128, 64:ff9b:1::/48, 100::/64, 2001:db8::/32, fc00::/7,
  fe80::/10, ff00::/8`. An IPv4-mapped IPv6 address (`::ffff:a.b.c.d`, either spelling) is checked as its IPv4.
- `refusal(url, address)` builds one message: `refusing <url>: <address> is a private, loopback or link-local address.
  Set smoke.perf.allowPrivate: true to probe a host on your own network.`
- **Before any request** (`runProbe`): `--dry-run` checks only the literal IPs of each fixture's host. A real run also
  `dns.lookup(host, { all: true })`s every distinct host, and it refuses when ANY address is private, unless
  `allowPrivate`. A refusal throws, so `main` exits 1 having made no request.
- **At connect** (`rawRequest`): the request's `lookup` option is a guarded lookup. It resolves the name, refuses a
  private address unless allowed, and hands the socket the address it checked, handling both the `all: true` and the
  single-address callback forms (Node's `autoSelectFamily` asks for `all`). The socket can't connect to an address
  nobody checked. An IP-literal host skips `lookup` in Node, so the literal is checked before the transport is called.
- **Assets:** `extractClientScriptUrls` results whose `origin` isn't the page's origin are not requested. The fixture
  becomes `absent`, with the detail `client script on another origin refused: <url>`, so it is a red run. It is never
  a silent skip, which would under-count the bytes. This holds whatever `allowPrivate` says.
- **Opt-in:** `loadProbeConfig` returns `allowPrivate: raw.allowPrivate === true` (only a literal `true` counts).
  `--base-url` and `--image-url` go through the same checks, because a CLI argument in CI is as editable as the config.
- **Never through an environment proxy (amended at review, 2026-10-17; the verifier on #399).** Under Node 24's
  `NODE_USE_ENV_PROXY=1` the global agent hands the request to `HTTP(S)_PROXY`, so the guarded lookup resolves the
  proxy and not the target. The verifier reproduced a refused name returning 200 through a local proxy. Every request
  now gets its own direct agent (`directAgent`), and a test runs that same case with the env proxy set. The header's
  old residual ("node:http ignores HTTP(S)_PROXY") was false, and it is gone.
- **Redirects** are not followed (`node:http`/`https` never follow them, and a 3xx is already `absent`). That is
  stated in the header.
- **Residuals, stated in the header:** NAT64 `64:ff9b::/96` addresses aren't refused, because they embed a public IPv4 on a NAT64
  network. Anything the operator puts behind `allowPrivate: true` is theirs.
- **Tests, one per refusal:** `127.0.0.1`, `169.254.169.254`, `10.0.0.1`, a hostname resolving to `10.0.0.1`
  (injected lookup), a rebinding host (preflight public, connect private: refused at connect), an asset on another
  origin, `[::ffff:127.0.0.1]`. And the passes: `172.67.164.209` is public (the 172.16/12 boundary), and
  `allowPrivate: true` probes a real local server on `127.0.0.1`.

**D8 — Release 1.12.0 (minor: new init behaviour and new probe refusals).** Per `skills/RELEASING.md` and the 1.11.0
shape (9b78a7e): `plugin.json`, `kit/package.json`, a `CHANGELOG.md` section, every `kit@` pin the renderers own,
`node skills/scripts/plugin-checksums.mjs`, and `apps/web/lib/plugin-release.generated.ts`. `check-release` decides
what is complete.

**D9 — Routing and build place.** One sprint and one PR, so there is no stack to keep. The architect (Opus) builds
all three stories in place: this is the only session in the checkout, and every story touches shared surface (the lint
config, the CI, a `lib/` seam 59 files import, and a security check). Review: `review-route.mjs --builder claude`. The
security lens is triggered (`risk: high`, perf-probe), and the fresh `verifier` runs on top, as this is a high-risk epic.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Lint at the source · S1.2 isMain by realpath · S1.3 perf-probe targets | high |

## Deploy order
One plugin release, which can share its window with `build-view-one-story`. No migration, no flag.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
