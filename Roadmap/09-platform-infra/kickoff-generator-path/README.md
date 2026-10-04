---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-04T12:25:54Z"
slug: kickoff-generator-path
title: "Kickoff generators run from anywhere"
area: 09-platform-infra
risk: low
type: bug
sprints_total: 2
stories_total: 5   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 81   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 23    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 36
quote_basis: "M, n=6, p25–p75"
build_order: 56      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Kickoff generators run from anywhere

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Bug · **Scope seed:** [`00-ideas/seeds/kickoff-generator-path.md`](../../00-ideas/seeds/kickoff-generator-path.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at grooming (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
Every user of the plugin, on every host, can generate a build kickoff from the command the docs give them. Today that
works only in Claude Code with the mod (`/build`), or by hand-resolving the plugin's folder. Everyone else copies a
path that fails with `MODULE_NOT_FOUND`, and the fallback is the hand-composed kickoff the generator exists to prevent.
Daniel at grooming: *"the idea is that this works for all users using the plugin not just me."*

## Platform-first note
No engine data is involved (AGENTS rule 1 doesn't apply). The plugin's own distribution channel already exists: the
kit (`@golden-frijoles/kit`, `gf-kit <name>`) ships whatever the skills declare in `requires_scripts`, built from
`skills/template/scripts/`. The kickoff builder's logic already lives there (`lib/epic-kickoff.mjs`, board-sinks D17).
This epic adds the two entry points and points the docs at them. Every edit under `skills/` is a plugin release
(`skills/RELEASING.md`), and a `skills/` PR merges with a merge commit, never a squash (public-monorepo D1).

## Decisions proposed at grooming (the architect verifies each against live code at the lock)
- **D1 — One source per generator, in `skills/template/scripts/`.** `emit-epic-kickoff.mjs` and `emit-kickoff.mjs`
  (args, `listEpics`, `findEpicDir`, `main`) move there. Groom's `skills/groom/emit-*.mjs` become **vendored bytes**
  written by `render-hook-vendor.mjs` and byte-checked by its spec, never hand-edited. The build-view mod keeps
  importing groom's bundled copy offline (`hooks/build-view.mjs:503`), unchanged.
- **D2 — The per-sprint template ships as a declared file.** `kickoff.md` moves to one path under
  `template/scripts/` and is declared in groom's `requires_scripts` (non-`.mjs` files are declared by hand; precedent
  `cross-panel.prompt.md`). The vendored copy finds it at the same relative path.
- **D3 — Root resolution.** The entries take the project root from `lib/project-root.mjs` (honours `GF_PROJECT_ROOT`,
  set by `gf-kit --root`), and `--repo-root` keeps working. A kit-installed script's own directory is never the project.
- **D4 — The doc form is the run rule every skill already advertises:** `/build <slug>`, else
  `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` (a project's own `scripts/emit-epic-kickoff.mjs` wins).
  Match the wording of the kit-advert block (`render-skill-adverts.mjs`); don't invent a second phrasing.
- **D5 — The guard checks the runnable form `node skills/groom/`** in shipped docs (`Roadmap/`, `skills/Roadmap/`,
  `skills/template/`) and in generator output strings. Plugin-relative code paths (`../skills/groom/`) and historic epic
  folders are exempt by path, not by judgment.
- **D6 — New entries use the realpath `isMain`** (as `config.mjs` does). The other eleven scripts are
  `script-ismain-realpath`'s job.
- **D7 — Release: lockstep plugin + kit bump** in S2's PR (or S1's, if S1 already ships a kit-closure change;
  `check-release.mjs` decides, don't argue with it). CI publishes the kit via OIDC; no human step.

## Architecture lock (2026-10-04, verified against `main` @ `e832dc5`)

D1–D7 above stand, **with the corrections C1–C6 below**, each forced by live code. Builders cite these; nothing here
is restated elsewhere.

- **C1 — Groom's vendored copies live in `groom/vendor/`, not at `groom/emit-*.mjs` (corrects D1).**
  `render-hook-vendor.mjs`'s `writeVendor` does `rmSync(vendorDir)` before writing, and the source's relative imports
  (`./lib/epic-kickoff.mjs`) only resolve when the copy sits beside its `lib/`. Vendoring into `groom/` itself would
  delete `SKILL.md`; a byte-identical copy at `groom/emit-*.mjs` would import a `groom/lib/` that does not exist. So
  the groom kickoff bundle becomes **entry `emit-epic-kickoff.mjs`** (its closure pulls in `emit-kickoff.mjs`,
  `lib/epic-kickoff.mjs`, `lib/wip.mjs`, `lib/project-root.mjs` and the extractor chain, derived, never listed) **+
  `also: ['templates/kickoff.md']`**. `groom/emit-epic-kickoff.mjs`, `groom/emit-kickoff.mjs` and
  `groom/templates/kickoff.md` are **deleted**. The mod's `VENDOR_EMIT_KICKOFF` becomes
  `../skills/groom/vendor/emit-epic-kickoff.mjs`, and groom's `SKILL.md` Stage 8 / `references/per-sprint-kickoff.md`
  name `$GROOM/vendor/…`. That is the "path change only" S1.1 allows for `build-view.mod.test.ts` and
  `build-view.test.mjs`.
- **C2 — Root resolution needs one more rung than `projectRoot()` (corrects D3).** In copied mode `projectRoot()`
  answers `kitRoot()/..`. That is right for a project's own `scripts/`, but for the plugin's vendored copy it is
  `groom/`, which holds no `Roadmap/`. Today's copy uses `cwd`, and groom's Stage 8 runs it from the project root. The
  rule, written **once** in a new `lib/kickoff-cli.mjs` that both entries import: `--repo-root` → `GF_PROJECT_ROOT`
  (verbatim, even without a `Roadmap/`: a person said so) → `projectRoot()` when it holds `Roadmap/` → the nearest
  `Roadmap/`-or-`.git` walking up from `cwd` (`findProjectRoot`) → `cwd`. The same module holds the one
  `findEpicDir` (today duplicated byte-for-byte in both CLIs) and `parseArgs` (re-exported from `emit-kickoff.mjs` for
  its spec).
- **C3 — The per-sprint template lives at `template/scripts/templates/kickoff.md` (settles D2).** It is declared in
  groom's `requires_scripts` by hand. `emit-kickoff.mjs` reads it from its own directory, which is `kitRoot()` in every
  mode (project `scripts/`, kit `dist/`, `groom/vendor/`). It is not a `projectAsset`, and a project cannot override
  it. `bundleManifest` passes it through `importClosure`, which reads a non-import file as a closure of one. This is
  verified by the S1.1 build, not assumed.
- **C4 — The specs move with their sources** to `template/scripts/emit-{epic-,}kickoff.test.mjs`. skills-ci's
  `template script tests` step already globs `template/scripts/*.test.mjs`, so the explicit `groom generator tests`
  step drops those two lines. The edit goes in the source `skills/.github/workflows/ci.yml`, then
  `node scripts/render-skills-ci.mjs`; the generated file is never hand-edited. The epic spec's WAYS-OF-WORKING lookup
  becomes `../Roadmap/WAYS-OF-WORKING.template.md` relative to `template/scripts/`.
- **C5 — The release happens in S1 too (settles D7).** S1 touches `plugins/**` (the vendor bundle, the mod) and the
  kit closure, so `check-release --base` forces a bump there: **0.27.0** (minor, because the kit gains two entries).
  S2 bumps again (**0.27.1**) only if `check-release` asks. This **removes** the release window the Deploy-order
  section worried about: the kit that carries the commands is on npm before any doc names them. S2's smoke pins
  `@0.27.x`.
- **C6 — The D5 guard is a root spec, `scripts/kickoff-doc-paths.test.mjs`.** It runs under `npm run test:unit` in the
  main CI's static job, which ci-diet never skips for docs. It cannot live in skills-ci, because the subtree split
  holds no root `Roadmap/`. It scans root `Roadmap/` (excluding `Roadmap/00-ideas/`, where seeds quote the bug as
  evidence, and every epic folder `Roadmap/<NN-area>/<slug>/`), `skills/Roadmap/` and `skills/template/` (docs **and**
  `template/scripts/**`, which covers the generators' output strings and usage comments). It also scans the plugin's
  shipped skill docs (`skills/plugins/golden-frijoles/skills/**/*.md`) for the literal `node skills/groom/`.
  Plugin-relative code paths (`../skills/groom/`) are not the pattern, so they never match. **The nine docs** are
  re-verified live: root WoW template + rendered + `SESSION-KICKOFFS.md`, plus the same three in each of
  `skills/Roadmap/` and `skills/template/Roadmap/`. `skills/Roadmap/SESSION-KICKOFFS.md` and its template twin differ
  today (line 54); each is edited at its own lines and nothing is synced.

- **C7 — Amended 2026-10-04 during S2: `check-release` counts the kit's Roadmap skeleton.** `gf-kit init` writes
  `template/Roadmap/WAYS-OF-WORKING.md` (it is in `init.mjs`'s `SKELETON`, which build-kit copies into
  `dist/skeleton/`). `check-release`'s shipped surface held only `plugins/**`, `kit/**` and the script closure, so
  S2.1's edit to that file would have passed with no release, and a new project would still get the broken line.
  `kitClosureFiles` now adds `template/<SKELETON path>` (same list, imported). S2 therefore releases **0.27.1**. The
  bug is the class, not this file: any skeleton edit now needs a version.

**Sprint build contracts.** S1 = D1, D2, D3, D6 as corrected by C1–C5; S2 = D4, D5, D7 as corrected by C5–C6. They
are recorded in each sprint file's *Build contract*.

**Routing (amended).** The architect builds both sprints in place. They share every hot file (the bundle, groom's
`SKILL.md`, the CHANGELOG), and this is the only session in the checkout. External review follows
`review-route.mjs`. The fresh `pr-reviewer` on S1 runs the packed-tarball spec itself.

## What already exists (reuse, don't rebuild)
- `skills/template/scripts/lib/epic-kickoff.mjs` (`epicKickoffFromDir`, `EPIC_KICKOFF_TEMPLATE`), `lib/wip.mjs`,
  `lib/project-root.mjs`
- `skills/scripts/build-kit.mjs` (manifest = the union of `requires_scripts`), `check-skill-scripts.mjs` (closure)
- `skills/scripts/render-hook-vendor.mjs` (+ `.test.mjs`): already vendors `lib/` into `groom/vendor/`
- `skills/kit/bin.mjs` (`gf-kit <name>`, `--root`, `--list`)
- `skills/plugins/golden-frijoles/skills/groom/emit-{epic-,}kickoff.mjs` + their specs: the behaviour to preserve
- `scripts/render-ways-of-working.mjs --check`; `skills/RELEASING.md` + `check-release.mjs`; skills-ci
  (`scripts/render-skills-ci.mjs`)

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `emit-epic-kickoff` ships in the kit (one source, groom vendored) | low |
| 1 | S1.2 `emit-kickoff` + its template ship in the kit | low |
| 1 | S1.3 The packed kit runs both from a scratch project | low |
| 2 | S2.1 Every doc and in-code hint names `/build` or the kit command | low |
| 2 | S2.2 A guard keeps `node skills/groom/` out; release | low |

**Risk note:** low throughout. No money, auth, tenancy, migration, or engine surface. The kit is a distributed package,
but this change is additive (two new entries); the existing entries and the mod's offline path are pinned by their
specs. No kill-switch (low risk; Daniel's default is no flag).

**Model routing:** S1 (the packaging contract: D1–D3) goes to the stronger builder. S2 is mechanical (docs + one guard)
and can go to the faster one. The fresh `pr-reviewer` on S1 should run the packed-tarball check itself, not trust the
report.

## Deploy order
S1 then S2, stacked (`feat/kickoff-generator-path` → `-s2`). Nothing on Vercel changes. The release is the version bump
merging to `main`, and the skills subtree split + CI publish follow. Docs must not point at the kit command before the
kit version that carries it is on npm: S2 merges the docs **and** the bump together, so the window is the few minutes
RELEASING.md already describes.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
