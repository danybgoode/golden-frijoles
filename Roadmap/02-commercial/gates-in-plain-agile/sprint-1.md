---
epic: gates-in-plain-agile
sprint: 1
title: "The Plan and Build gates"
risk: low
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "One shape for every gate"
    as_a: "a founder"
    i_want: "every gate to have the same shape"
    so_that: "I always know what to read and what I'm deciding"
    risk: low
    status: planned
  - id: S1.2
    title: "The Plan gate, in plain words"
    as_a: "a founder approving a plan"
    i_want: "the gate in plain words with the bet in it"
    so_that: "I approve without learning ours"
    risk: low
    status: planned
  - id: S1.3
    title: "The Build gate"
    as_a: "a founder who just approved"
    i_want: "to be told what was created and the one command to start"
    so_that: "I start building without reading docs"
    risk: low
    status: planned
---
# Gates in plain agile — Sprint 1: The Plan and Build gates

**Status:** ⬜ not started

## Build contract (locked by the architect before the builder started)
Cites README D1–D5, D8, D11–D14; it restates none of them.
- New `skills/plugins/golden-frijoles/skills/groom/references/gates.md` (D1, D8): the shape, the two tables, the
  `gate plan` and `gate build` blocks (the `gate strategy` block lands in S2).
- Groom `SKILL.md` Stage 7.1 and Stage 8 point to it; the Bet block leaves `SKILL.md` and `funding.md` (D2, D3, D5).
  Prose budget ≤ 210 (the skills CI step).
- `groom/strategy.mjs` keeps `sourceEvent` and prints it; `strategy.test.mjs` covers it (D4).
- Templates: the WAYS-OF-WORKING template's option words (D10, the Plan gate half), re-rendered everywhere; the three
  `SESSION-KICKOFFS.md` copies.
- Release 0.35.0 (D12). Done = skills CI + root CI green, the D13 walk in the PR.

<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — One shape for every gate
**As** a founder, **I want** every gate to have the same shape, **so that** I always know what to read and what I'm
deciding.
`groom/references/gates.md`, the one home of the shape: where to read it (a path, and the console link when signed
in), what's decided for you already, the two or three decisions only you can make, then the numbered options. Plus
the screen-word table: what a person reads (Epic, Sprint, User story, Approve, Park it, Backlog → Shipped, Proven ·
Disproven · Unclear, Flag) next to the file value it maps to (`underwritten_by`, `status: agreed`, `fund.mjs`, …).
Other skills point to it; none restate it.
**Acceptance:**
- The reference exists and the groom, setup and coach skills point to it.
**Risk:** low

### Story 1.2 — The Plan gate, in plain words
**As** a founder approving a plan, **I want** the gate in plain words with the bet in it, **so that** I approve
without learning ours.
Groom Stage 7 and `references/funding.md` render the canvas PlanGate: the plan's path; "We bet that …"; Moves · Target
· Read date (launch epic 4) · Size (appetite and quote) · Flag (key, or none and why) · Measured by (only events the
target metric has); the decisions only you can make; then "1 Approve the plan · 2 Park it · 3 Change something", and
"What this pushes back: …". "Park it" runs exactly what "approve, don't fund" ran. `fund.mjs` and its records are
unchanged.
**Acceptance:**
- A groom run on a fixture seed shows the new gate; "Park it" leaves the seed `ready` with nothing funded or scaffolded.
- No fund, scaffold, underwritten, displaced, cycle or position on screen.
**Risk:** low

### Story 1.3 — The Build gate
**As** a founder who just approved, **I want** to be told what was created and the one command to start, **so that**
I start building without reading docs.
After the scaffold (Stage 8), the canvas Approved shape: "Plan approved: <title>", what was created (its sprints,
committed; the flag, if one), "Start building whenever you're ready: /build <slug>", where to follow it (the epic
page), and optional setup items only when missing (gh, Codex, the digest, the Claude app), then "1 Start building now
· 2 <first missing item> · 3 Later".
**Acceptance:**
- A groom run end to end ends with this gate; no kickoff or epic-mode words on screen.
**Risk:** low

## Sprint QA
- **api spec(s):** the skills' own checks; a groom run on a fixture seed through both gates, recorded in the PR.
- **browser smoke owed:** no; the walkthrough below is in the terminal, owed to Daniel.
- **deterministic gate:** the skills' checks, `check-template-drift.mjs` and the parity checks green before merge.
  Low risk: merge on green.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: a scratch repo with the plugin installed from this branch

1. Ask the agent to groom a tiny idea and answer its questions
   → The Plan gate: the path, "We bet that …", Moves, Target, Read date, Size, Flag, two decisions, three options.
2. Choose Park it
   → The seed stays ready; nothing is funded or scaffolded.
3. Groom it again and choose Approve the plan
   → The Build gate: what was created, "/build <slug>", optional items only if missing.
4. Read both gates once more
   → None of fund, scaffold, underwritten, displaced, kickoff, epic mode.

If any step fails, note the step number + what you saw — that's the bug report.
