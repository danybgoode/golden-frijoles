---
epic: setup-drafts-strategy
sprint: 2
title: "One review"
risk: low
phase: Shipped
stories_total: 3
stories:
  - id: S2.1
    title: "The five-block Strategy gate; Approve writes the choice, agrees the files and seeds a grounded first bet"
    as_a: "a founder at the end of setup"
    i_want: "one review with five blocks and one Approve"
    so_that: "setup ends with an agreed strategy and a first bet that can be proven"
    risk: low
    status: done
  - id: S2.2
    title: "The coaches go deeper over a draft"
    as_a: "a founder who wants more depth later"
    i_want: "a coach that starts from what setup drafted"
    so_that: "the workshop is optional depth, not a blank page"
    risk: low
    status: done
  - id: S2.3
    title: "Plugin 1.2.0"
    as_a: "a founder updating the plugin"
    i_want: "the new setup in a release"
    so_that: "I get it with `/plugin update`"
    risk: low
    status: done
---
# Setup drafts the strategy: two North Stars from the evidence, and a first bet in one review — Sprint 2: One review

**Status:** ✅ shipped 2026-10-09 (#336, merge `0428149`; plugin + kit 1.2.0)

## Stories

### Story 2.1 — The five-block Strategy gate; Approve writes the choice, agrees the files and seeds a grounded first bet ✅ `547329d`
**As** a founder at the end of setup, **I want** one review with five blocks and one Approve, **so that** setup ends with an agreed strategy and a first bet that can be proven.
**Acceptance:** `gates.md`'s Strategy gate shows Product & persona, North Star A or B, Measurement plan, Roadmap and First bet; Approve writes the chosen candidate and payload, removes Candidates, sets all three files agreed and writes a raw seed with the bet sentence, persona, `grounded: true` and the confirmed target (or `grounded: false — no baseline yet`); `check-gate-words` passes.
**Risk:** low

### Story 2.2 — The coaches go deeper over a draft ✅ `17f3f72`
**As** a founder who wants more depth later, **I want** a coach that starts from what setup drafted, **so that** the workshop is optional depth, not a blank page.
**Acceptance:** each coach, opened on an existing file, revises it section by section in place, keeps citations it does not change, replaces `(assumed)` with the founder's answer and never restarts from the template.
**Risk:** low

### Story 2.3 — Plugin 1.2.0 ✅ `e9dc231`
**As** a founder updating the plugin, **I want** the new setup in a release, **so that** I get it with `/plugin update`.
**Acceptance:** plugin 1.2.0 with a CHANGELOG entry; `check-release` agrees; the kit closure is unchanged unless a kit script changed.
**Risk:** low

## Sprint QA
- **unit:** `check-gate-words`, `check-onboarding-parity` (setup's words), skills tests; the setup and refine prose budgets
- **browser smoke owed:** no (terminal behaviour; Daniel's interactive setup walkthrough below)
- **deterministic gate:** as sprint 1

## Sprint 2 — Smoke walkthrough (do these in order)
Env: the same scratch repo, after sprint 1's step 2.

1. (owed to Daniel — interactive) Continue setup to the Strategy gate
   → five blocks: Product & persona, North Star A or B, Measurement plan, Roadmap, First bet.
2. Pick a candidate, confirm the first bet's target, then 1 Approve
   → the three files say `status: agreed`, `north-star.md` has the chosen metric and no Candidates section, and `Roadmap/00-ideas/seeds/` holds the first bet with `grounded: true`.
3. Run `node skills/plugins/golden-frijoles/skills/refine/strategy.mjs`
   → it prints the chosen North Star's inputs.
4. Ask for the North Star coach
   → it opens on the agreed file ("go deeper"), not a blank template.

If any step fails, note the step number + what you saw — that's the bug report.
