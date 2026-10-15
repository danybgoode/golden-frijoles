---
epic: build-view-one-story
sprint: 1
title: "One story"
risk: low
phase: Shaping
stories_total: 7
stories:
  - id: S1.1
    title: "The header says what, and how far"
    as_a: "a founder watching an agent build"
    i_want: "the repo, the state, the sprint, the epic, its size and risk on one line, the stories-done bar on the right, the track and the link under it"
    so_that: "I know what is being built and how far it has got without reading further"
    risk: low
    status: planned
  - id: S1.2
    title: "A source is named only when two disagree"
    as_a: "a founder watching an agent build"
    i_want: "the stage said once, a ⚑ line only when the docs and the branch disagree, and a shipped epic reading as shipped"
    so_that: "the view never contradicts itself"
    risk: low
    status: planned
  - id: S1.3
    title: "Why and Target say what we know"
    as_a: "a founder watching an agent build"
    i_want: "the Why in full, and the target or the reason there is none, with the read date and intent match"
    so_that: "I remember why this is being built and how it will be judged"
    risk: low
    status: planned
  - id: S1.4
    title: "Now tells the story in progress"
    as_a: "a founder watching an agent build"
    i_want: "the story being built as a user story, or between stories, or where the plan stands while refining"
    so_that: "I know what is happening this minute"
    risk: low
    status: planned
  - id: S1.5
    title: "Spend, Around and Next"
    as_a: "a founder watching an agent build"
    i_want: "spend as a bar against the quote, other work in one Around line, and a Next command when nothing is in flight"
    so_that: "I see the cost, the rest of the board, and what to do next"
    risk: low
    status: planned
  - id: S1.6
    title: "The 5-hour line as a meter, to the minute"
    as_a: "a founder working in long sessions"
    i_want: "the 5-hour budget as a bar with the reset time and the time left, to the minute"
    so_that: "I can plan around the reset"
    risk: low
    status: planned
  - id: S1.7
    title: "No colour or symbol regresses"
    as_a: "the product owner"
    i_want: "every colour the band draws today, and the new ones, pinned by a test, and no wide or emoji glyph"
    so_that: "the redesign never quietly loses what already worked"
    risk: low
    status: planned
---
# The build view tells one story — Sprint 1: One story

**Status:** ⬜ not started

The approved design, with every state drawn, is in the seed's *The design*
([`00-ideas/seeds/build-view-one-story.md`](../../00-ideas/seeds/build-view-one-story.md)). Each story below points
at its part of it.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S1.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 1.1 — The header says what, and how far
**As** a founder watching an agent build, **I want** the repo, the state, the sprint, the epic, its size and risk on
one line, the stories-done bar on the right, the track and the link under it, **so that** I know what is being built
and how far it has got without reading further.
**Acceptance:** line 1 is `<repo> <state symbol> Sprint N of M · <title> · <appetite> · ▲ risk <LEVEL>` with
`▰…│…▱  N of M stories done` right-aligned; line 2 is the track (its old `Status` row is gone); line 3 is the full
epic URL (or the seed path while refining). A long title shortens with `…`; the bar and track never do. Under ~90
columns the bar moves to its own line. The state symbols are those in the design's table.
**Risk:** low

### Story 1.2 — A source is named only when two disagree
**As** a founder watching an agent build, **I want** the stage said once, a `⚑` line only when the docs and the branch
disagree, and a shipped epic reading as shipped, **so that** the view never contradicts itself.
**Acceptance:** one function decides whether the README's `status`/`phase` and the live facts disagree, with a spec
per disagreeing pair; only then does `⚑ <what each says>` appear under the track. A shipped epic shows `✓`, "N of N
stories done" and `▸ Now  shipped <day> · verdict due <day>`.
**Risk:** low

### Story 1.3 — Why and Target say what we know
**As** a founder watching an agent build, **I want** the Why in full, and the target or the reason there is none, with
the read date and intent match, **so that** I remember why this is being built and how it will be judged.
**Acceptance:** `❝ Why` wraps the full Why. `⌖ Target` shows `<metric>: <from> → <to> · read <day> · intent match N`,
or `none yet: <grounded_reason> · intent match N`. "no target set" no longer appears when a reason exists.
**Risk:** low

### Story 1.4 — Now tells the story in progress
**As** a founder watching an agent build, **I want** the story being built as a user story, or between stories, or
where the plan stands while refining, **so that** I know what is happening this minute.
**Acceptance:** `▸ Now` shows the in-flight story (id, title, as a / I want / so that), or `between stories: <last> done,
<next> next`; while refining, "shaping the plan" (`raw`) or "plan ready, waiting for your approval" (`ready`). The words
"session journal" never appear.
**Risk:** low

### Story 1.5 — Spend, Around and Next
**As** a founder watching an agent build, **I want** spend as a bar against the quote, other work in one Around line,
and a Next command when nothing is in flight, **so that** I see the cost, the rest of the board, and what to do next.
**Acceptance:** `$ Spend` keeps today's bar and tones. `⋯ Around` replaces the `Worktree`, `Open`, `Also` and `Board`
rows: counts by stage, other worktrees, next up. With an epic in flight there is no board link (the epic link is the
one link). With nothing in flight: the board link on line 2 and `→ Next  /build <top of the ready list>`.
**Risk:** low

### Story 1.6 — The 5-hour line as a meter, to the minute
**As** a founder working in long sessions, **I want** the 5-hour budget as a bar with the reset time and the time left,
to the minute, **so that** I can plan around the reset.
**Acceptance:** reproduce today's line against a real reset first and record what it says. Then
`5h ▰▰▰▰▰▰▱▱▱▱ 62% · resets 9:20 pm (in 1h 29m)`, its bar in the line's existing tones. A spec covers a reset under an
hour away (no "-1h").
**Risk:** low

### Story 1.7 — No colour or symbol regresses
**As** the product owner, **I want** every colour the band draws today, and the new ones, pinned by a test, and no
wide or emoji glyph, **so that** the redesign never quietly loses what already worked.
**Acceptance:** `build-view.mod.test.ts` pins each colour in the design's *Colours that must not regress* (track mark
in its tone, done green, Spend green / red-over, `▲ risk` by level, bold title, cyan glyphs, dim labels, the session
line) plus the new ones (dim repo, state symbol in the stage's tone, red `⚑`). A test fails on any glyph whose East
Asian Width is W or F or that has Emoji_Presentation. Golden specs render each state in the design.
**Risk:** low

## Sprint QA
- **specs:** `build-view.test.mjs` (golden lines per state), `build-view.mod.test.ts` (layout, colours, glyphs),
  `check-script-parity`.
- **browser smoke owed:** no; an interactive walkthrough in Claude Code, to the product owner.
- **deterministic gate:** skills-ci green; this repo's `npm run lint` and static gate.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: Claude Code with the new plugin version installed, in this repo.

1. On `main` with nothing in flight, look at the band.
   → `golden-frijoles ○ No epic on this branch`, the board link, one `⋯ Around` line and a `→ Next /build …` line.
2. Switch to an idea's branch being refined (`git switch -c refine/owed-on-screen-test`).
   → `❧ Idea · …`, the track at `◉ Refining`, the seed path, and `▸ Now  plan ready, waiting for your approval`.
3. Switch to an epic's feature branch with a story committed.
   → line 1 has the sprint, title, size, red `▲ risk HIGH` and a green-and-dim bar; line 2 the track with `Building`
   bold yellow; line 3 a clickable epic link.
4. Look at the Spend line.
   → a bar, green while under the quote.
5. Look below the prompt.
   → `5h` with a bar, a percentage and "resets <time> (in <h>h <m>m)" that matches the clock.
6. On `main`, open a shipped epic's view (or a branch of one).
   → `✓`, "N of N stories done", the track at `◉ Shipped` in green.

Every step is owed to the product owner (an interactive walkthrough); an agent can script steps 1–3 in a scratch repo.

If any step fails, note the step number + what you saw — that's the bug report.
