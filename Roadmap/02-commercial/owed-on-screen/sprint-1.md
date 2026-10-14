---
epic: owed-on-screen
sprint: 1
title: "The data, member-only"
risk: high
phase: Shaping
stories_total: 2
stories:
  - id: S1.1
    title: "The roadmap push carries each epic's owed checks"
    as_a: "a founder who owns the product"
    i_want: "each epic's owed checks pushed to the Hub with the rest of its roadmap"
    so_that: "the console can show them without anyone opening a file"
    risk: high
    status: planned
  - id: S1.2
    title: "Only a member ever receives an owed check"
    as_a: "a founder whose ledger names people and internal ids"
    i_want: "owed checks handed only to members of my project"
    so_that: "an anonymous reader of a public roadmap, or a signed-in stranger, never sees them"
    risk: high
    status: planned
---
# Owed on screen — Sprint 1: The data, member-only

**Status:** ⬜ not started

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The roadmap push carries each epic's owed checks
**As** a founder who owns the product, **I want** each epic's owed checks pushed to the Hub with the rest of its
roadmap, **so that** the console can show them without anyone opening a file.

**Build:** `scripts/roadmap-extract.mjs` reads `Roadmap/00-ideas/OWED-LEDGER.json` (absent file → no field, never an
error) and attaches each item to the epic whose folder holds its `file`; items outside any epic folder go to a
project-level `owed_unattached`. `lib/roadmap-artifact-schema.ts` gains nullish `owed` per item and
`owed_unattached` on the push: `{ text, kind, category, file, line }`, every string `max()`-bounded, with a cap per
epic and in total. The kind enum is the ledger's (`publish · credential · ops · judgment · signed-in · interactive ·
unsorted`). `skills/template/scripts/roadmap-extract.mjs` is mirrored (a plugin release, `skills/RELEASING.md`).

**Acceptance:**
1. A push from this repo carries `owed` on the epics the ledger names, matching the ledger's count.
2. A push without `owed` (an older pusher) still validates.
3. An unknown kind or an over-cap list is a 400 naming the field.
4. A repo with no `OWED-LEDGER.json` pushes exactly as before.

**Risk:** high (the push contract, mirrored to every consumer).

### Story 1.2 — Only a member ever receives an owed check
**As** a founder whose ledger names people and internal ids, **I want** owed checks handed only to members of my
project, **so that** an anonymous reader of a public roadmap, or a signed-in stranger, never sees them.

**Build:** one read function in `lib/` (e.g. `owedForViewer(artifact, viewer)`) returns owed rows only when
`lib/membership.ts` says the viewer is a member of that project, and `[]` otherwise. Every renderer in Sprint 2 reads
through it. The connector's roadmap reads and `lib/public-connector-scrub.ts` drop `owed` and `owed_unattached` from
anything they serialize.

**Acceptance:**
1. A member gets the rows. A signed-in non-member gets `[]`, even on the public project. Signed out gets `[]`.
2. The anonymous connector on golden-frijoles (the horizon and epic reads) carries no owed field.
3. A pure spec on the function, plus an api spec on the public project for criterion 2.

**Risk:** high (an authorization boundary on a public project). Security lens on review.

## Sprint QA
- **api spec(s):** S1.1 → a push spec beside the existing roadmap-push specs; S1.2 → connector spec on the public
  project. Pure specs for attach (`scripts/`) and `owedForViewer` (`lib/`).
- **browser smoke owed:** no (no screen yet).
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. After the merge, open the latest `roadmap-push` run on `main` in GitHub Actions.
   → it's green, and its log names the push's epic count.
2. Signed out, ask the golden-frijoles connector for its horizon (the public connector URL in Setup › Connect).
   → the answer names epics and destinations, and no owed check appears anywhere.

If any step fails, note the step number + what you saw — that's the bug report.
