---
title: "The kickoff generators run from anywhere: shipped in the kit, named correctly in every doc"
slug: kickoff-generator-path
status: scaffolded
area: "09"
type: bug
priority: null
appetite: M
underwritten_by: null
risk: low
epic: "09-platform-infra/kickoff-generator-path"
build_order: 56
updated: 2026-10-03
intent_ask: proxy   # the reviewer's finding on #226, plus Daniel's grooming words 2026-10-03 (below)
intent_match: 81
---

# Pitch — the kickoff generators run from anywhere: shipped in the kit, named correctly in every doc

## The ask, as given

> Nine docs tell a builder to run `node skills/groom/emit-epic-kickoff.mjs --epic <slug>` [...] That path exists only
> relative to the plugin's own folder. [...] Copied as written, it fails with `MODULE_NOT_FOUND`. The Hub board dropped
> its "Regenerate the kickoff" command rather than copy it.
> — fresh `pr-reviewer` on #226 (board-sinks-and-scrumban S2)

> lets include kit packaging, the idea is that this works for all users using the plugin not just me.
> — Daniel, grooming, 2026-10-03

### Claims
1. Every doc that tells a reader how to generate a kickoff names a command that actually runs where that doc is read.
2. It works for every user of the plugin, on every host, not only in this repo or under Claude Code with the mod:
   the kit ships the generators.
3. The fix lands at the template source and reaches every byte-checked copy.

**Teach-back:** partly → corrected — "You want the 'generate the kickoff' instruction to work when copied from any doc,"
*plus* Daniel's widening: "for all users using the plugin, not just me", which is why the kit packaging moved from a
no-go into scope.

## Problem

Re-verified 2026-10-03 on `main` (`cfc14d1`): still true. `git grep "node skills/groom/emit-"` outside the plugin finds:

| Doc | Line | Path named |
|---|---|---|
| `Roadmap/WAYS-OF-WORKING.template.md` (+ the rendered `WAYS-OF-WORKING.md`) | 74 / 72 | `emit-epic-kickoff.mjs` |
| `Roadmap/SESSION-KICKOFFS.md` | 47 | `emit-epic-kickoff.mjs` (as the no-mod fallback to `/build`) |
| `skills/Roadmap/{WAYS-OF-WORKING,WAYS-OF-WORKING.template,SESSION-KICKOFFS}.md` | 71 / 74 / 100, 122 | both generators |
| `skills/template/Roadmap/{same three}` | 67 / 74 / 100, 122 | both generators |
| `emit-epic-kickoff.mjs`'s own one-sprint hint (stderr) | ~165 | `node skills/groom/emit-kickoff.mjs` |

`skills/groom/` exists only inside the plugin folder. `/build <slug>` covers Claude Code with the mod. Every other host
(Codex, Cowork, `npx skills`, a mod that is off) has no command that runs. The kit (`npx -y @golden-frijoles/kit <name>`)
is already how the plugin's skills run their scripts on every host, but it does not carry the generators: `gf-kit --list`
on 0.26.0 shows no `emit-*`.

## Appetite
**M** (re-quoted after Daniel widened the scope at grooming; was S for the docs-only fix). Two sprints: the kit carries
the generators, then the docs point at the kit and a guard keeps them pointed.
quote: $23–36 (M, n=6, p25–p75)

## Outcome & signal
In a fresh project with no plugin checkout and no `scripts/emit-epic-kickoff.mjs`, running
`npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` from the root prints the same kickoff `/build <slug>` puts
in the prompt box, and `emit-kickoff --epic <slug> --sprint 1` prints the per-sprint one. Every doc names that command,
and a guard goes red if one names `node skills/groom/…` again.

## Stage-2.5 bucket
**Light enhancement.** The builder logic is already in the kit's source tree: `template/scripts/lib/epic-kickoff.mjs`
is the one home (board-sinks-and-scrumban D17), and groom only vendors it. What's missing is the entry scripts, the
manifest declaration, and the docs.

## Bill of materials (What / Why)

| What | Why |
|---|---|
| `template/scripts/emit-epic-kickoff.mjs` as the ONE source of the CLI (args, `listEpics`, `findEpicDir`, `main`), root from `lib/project-root.mjs` | the kit is built from `template/scripts/`; one source, no fork |
| `template/scripts/emit-kickoff.mjs` + its `kickoff.md` template, declared as a hand-declared non-import file | the per-sprint generator reads a template file; `requires_scripts` already supports declaring one |
| Declare both in groom's `requires_scripts` | `build-kit.mjs` ships exactly what skills declare; `check-skill-scripts` holds the closure whole |
| Groom's own `emit-*.mjs` become vendored copies (`render-hook-vendor.mjs`), not hand-maintained | the build-view mod runs the bundled copy offline; the bytes must stay identical |
| Docs: `/build <slug>`, else `npx -y @golden-frijoles/kit emit-epic-kickoff --epic <slug>` (the project's own `scripts/` copy wins) | the run rule every skill already uses, so readers learn one form |
| Fix the in-code stderr hint(s) | the same bug in the generator's own output |
| Guard: no shipped doc or generator output names `node skills/groom/` | fix the class, not the instance |
| Lockstep plugin + kit version bump + CHANGELOG | `skills/RELEASING.md`: the bump IS the release; CI publishes the kit |

## Scope
**In v1:** both generators in the kit, groom's copies vendored from the one source, the nine docs + in-code hints, the
guard, the release.
**Out of v1 (no-gos):**
- **`scaffold-epic.mjs` in the kit.** Groom resolves `$GROOM` for it itself, and no doc tells a reader to run it by
  hand. Re-seed if a reader needs it.
- **Historic epic docs** (`build-visualization-claude-mods/sprint-1.md`, live-build-view's README). They are records of
  shipped work.
- **The isMain-by-realpath bug** (`script-ismain-realpath`) stays its own seed. The new entries use the realpath form
  from day one; the other eleven scripts are not touched.
- **A `gf` (CLI) subcommand for kickoffs.** The kit is the plugin's script channel; the CLI talks to the engine's API.

## Rabbit holes
- **Two copies of one CLI.** The build-view mod imports groom's bundled `emit-epic-kickoff.mjs` by relative path, so
  groom must keep a copy. Make it vendored bytes of the template entry (`render-hook-vendor.mjs` already vendors the
  `lib/` half; extend it). Never two hand-edited files.
- **Project root.** Under the kit, the script's own directory is `node_modules/…/dist`, not the project. Use
  `lib/project-root.mjs` (honours `GF_PROJECT_ROOT`, which `gf-kit --root` sets) wherever the old code used `cwd`. Keep
  `--repo-root` working.
- **`templates/kickoff.md` location.** The kit lays files out as in a project's `scripts/`. Pick one path under
  `template/scripts/` (e.g. `templates/kickoff.md`) and have groom's vendored copy find it at the same relative path.
  Check `check-skill-scripts` accepts the declared non-`.mjs` file. Precedent: `cross-panel.prompt.md`.
- **Verify the PACKED kit**, not the tree: `npm pack` the kit, install the tarball into a scratch project, run both
  entries. A packaging hole only shows up there (memory: *golden-frijoles-cli*, three defects hid until the tarball).
- **Release window.** Docs on `main` can advertise a kit version npm doesn't have yet for a few minutes. The run rule
  already reports that as "kit unreachable" (RELEASING.md); don't build around it.
- **Subtree merge.** A PR that changes `skills/` merges with a merge commit, never a squash (public-monorepo D1).

## What already exists (reuse, don't rebuild)
- `template/scripts/lib/epic-kickoff.mjs` (`epicKickoffFromDir`, `EPIC_KICKOFF_TEMPLATE`) and `lib/wip.mjs`: the builder
  is already the kit's source.
- `skills/scripts/build-kit.mjs` (manifest = the union of `requires_scripts`) + `check-skill-scripts.mjs` (closure check).
- `skills/scripts/render-hook-vendor.mjs` (already vendors into `groom/vendor/`).
- `skills/kit/bin.mjs` (`gf-kit <name>`, `--root`, `--list`); `lib/project-root.mjs`.
- `scripts/render-ways-of-working.mjs` (`--check`); `skills/RELEASING.md` + `check-release.mjs`; skills-ci (generated by
  `scripts/render-skills-ci.mjs`).
- The kit-advert block every SKILL.md carries (`render-skill-adverts.mjs`): the doc wording should match it.

## UX heuristics & rails check
- **CI guards covering this surface:** `build-kit.test.mjs`, `check-skill-scripts`, `render-hook-vendor.test.mjs`,
  `render-ways-of-working --check`, skills-ci byte checks, `check-release`. None of them checks that a command named in
  a doc can run; the new guard covers that one pattern.
- **Audits-lens findings that apply:** none found.
- **Design-language debt:** n/a.

## Acceptance criteria
- **S1 (kit).** `gf-kit --list` includes `emit-epic-kickoff` and `emit-kickoff`. From a scratch project with the PACKED
  kit tarball installed and no plugin checkout, `emit-epic-kickoff --epic <slug>`, `--list`, and
  `emit-kickoff --epic <slug> --sprint 1` each print the same text groom's bundled copy prints for the same epic. The
  build-view `/build` still fills the prompt (its existing spec stays green). Groom's copies are byte-checked vendor
  output.
- **S2 (docs + guard + release).** `git grep -n "node skills/groom/"` returns nothing outside `skills/plugins/` and
  shipped epic folders. The nine docs give `/build <slug>` and the kit command. The guard fails on a fixture doc
  containing `node skills/groom/emit-epic-kickoff.mjs`. Plugin and kit versions are bumped in lockstep with a CHANGELOG
  section, and after merge `npm view @golden-frijoles/kit@<v>` resolves.

## Open risks / research
- The kit publish runs in CI via OIDC (RELEASING.md). No human 2FA step, unlike the CLI.

## Intent match

_Advisory and uncalibrated (intent-match D1, D3): it can add a step, never block one. Regenerate with `node scripts/intent-match.mjs <this seed> --write`._

```text
Intent match — Roadmap/00-ideas/seeds/kickoff-generator-path.md
  coverage in   0.95  (3 claims)
  coverage out  0.91  (2 criteria)
  clarity       0.87  (2 criteria)
  teach-back    0.50  (partly)
  agreement     pending  (the optional reader at the architecture lock)
Total 81 / 100 — uncalibrated · signals: coverage in, coverage out, clarity, teach-back
Band: build (placeholder bands: 80 build · 60 resolve follow-ups · below 60 sketch or spike)
Gaps: none
```

<!-- intent-match: {"coverage_in":0.953,"coverage_out":0.91,"clarity":0.87,"teach_back":0.5,"total":81} -->
