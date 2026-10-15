---
epic: owed-on-screen
sprint: 1
title: "The data, member-only"
risk: high
phase: Shipped
stories_total: 2
stories:
  - id: S1.1
    title: "The roadmap push carries each epic's owed checks"
    as_a: "a founder who owns the product"
    i_want: "each epic's owed checks pushed to the Hub with the rest of its roadmap"
    so_that: "the console can show them without anyone opening a file"
    risk: high
    status: shipped
  - id: S1.2
    title: "Only a member ever receives an owed check"
    as_a: "a founder whose ledger names people and internal ids"
    i_want: "owed checks handed only to members of my project"
    so_that: "an anonymous reader of a public roadmap, or a signed-in stranger, never sees them"
    risk: high
    status: shipped
---
# Owed on screen — Sprint 1: The data, member-only

**Status:** ✅ shipped 2026-10-15 — PR #375, merge `8cb1ec4` (commits `73745f8`, `64cb553`, `8bbadcf`, `6c131dc`, `b3ccdb9`); plugin + kit 1.10.0; no migration

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The roadmap push carries each epic's owed checks ✅ `73745f8`
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

### Story 1.2 — Only a member ever receives an owed check ✅ `64cb553`
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

## Build contract (locked by the architect before the builder started)
Cites the epic README's D1–D8 and D12; restates none of them.
- **S1.1** → D1 (`owedForPush`, the JSON's presence is the opt-in), D2 (attribution), D3 (envelope), D4 (schema + the
  route stores `owed`), D12 (release 1.10.0; `refine`/`report`/`setup` declare `owed-ledger.mjs`, checked on the built kit).
  Mirror every edited `scripts/` file to `skills/template/scripts/` byte-for-byte.
- **S1.2** → D5 (strip at `lib/report-artifacts.ts`), D6 (the raw read + its caller registry spec), D7 (`lib/owed.ts`
  pure + `lib/owed-read.ts` gate), D8 (scrub drop + anonymous connector api spec). Mutation-check D5, D6 and D7 (break
  the line, see red, revert, `git diff HEAD` clean).
- No screen in this sprint. Corrected acceptance: S1.1-4 reads "a repo with no `OWED-LEDGER.json` pushes exactly as
  before" (unchanged); S1.1-1's "matching the ledger's count" = `node scripts/owed-ledger.mjs --json`'s `total`.

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

**Run 2026-10-15 (architect):**
1. ✅ — but only on the SECOND run. The `roadmap-push` run the merge fired (`38738523117`) pushed at 12:56:46, before the
   production deploy of `8cb1ec4` existed (12:57:15): the old route's schema dropped the unknown `owed` key and answered
   `unchanged`. Re-run by `workflow_dispatch` once the deploy was `success` (`38738689311`): `✓ roadmap pushed (335
   rows)`, version 446, and production stores 96 owed checks (7 unattached) — the ledger's `total`.
2. ✅ Signed out, the public connector's `get_horizon` answers `pushed: true` with no `owed` anywhere in the reply; the
   public hub, board and this epic's page carry none of the checks' text.
