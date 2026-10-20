---
epic: screensavers
sprint: 1
title: "Screensavers, and the line that installs them"
risk: low
phase: Building
stories_total: 5
stories:
  - id: S1.1
    title: "It plays when you are away, at its own size"
    as_a: "a builder who leaves Claude Code running"
    i_want: "an ascii.rest animation in the band after a few minutes away, drawn at its own size and ended by my first keystroke"
    so_that: "my idle terminal is worth a screenshot and never in my way"
    risk: low
    status: done
  - id: S1.2
    title: "One line installs it, and the band shows the rest"
    as_a: "a builder who saw the post"
    i_want: "one command that installs the screensaver, and a band that then names the step that lights it up"
    so_that: "I get the screensaver now and find the rest of Golden Frijoles from it"
    risk: low
    status: done
  - id: S1.3
    title: "The post goes out, and the read is taken"
    as_a: "the product owner"
    i_want: "the screenshot and the install line posted, and the skills repo's unique cloners read on the read date"
    so_that: "the bet is judged on a number, not a feeling"
    risk: low
    status: planned
  - id: S1.4
    title: "Colour scenes, and now with an epic in flight"
    as_a: "a builder who leaves Claude Code running"
    i_want: "ascii.rest's colour scenes at their own 2:1 shape, and /screensaver now to play even mid-epic with the band folding out of the way"
    so_that: "the picture is worth posting and I always know how to get the band back"
    risk: low
    status: done
  - id: S1.5
    title: "Text pieces from eight categories, rendered in Node"
    as_a: "a builder who leaves Claude Code running"
    i_want: "crisp one-ink animations from shapes, space, physics, nature, creatures, objects, generative and effects, never a brand"
    so_that: "the screensaver looks sharp in any terminal"
    risk: low
    status: done
---

# Claude Code screensavers — Sprint 1: Screensavers, and the line that installs them

**Status:** 🔨 building — S1.1 and S1.2 built on `feat/screensavers`; S1.3 (the post and the read) owed to the product owner

## Stories

### Story 1.1 — It plays when you are away, at its own size
`hooks/screensaver.mjs` (when, and what fits), `hooks/screensaver-view-core.mjs` (the `Client` drawing),
`hooks/ascii/` (ten pieces, MIT). D1–D6 in the README.

### Story 1.2 — One line installs it, and the band shows the rest
The line is the README's *The install line*. In a repo with no `Roadmap/` the resolver adds
`→ Next /golden-frijoles:setup`; outside any repo the caption ends `· goldenfrijoles.com`.

### Story 1.4 — Colour scenes, and `now` with an epic in flight
`hooks/scene-render.mjs` (a scene → a clip, in Node), `hooks/scene-player.mjs` (size, fold, frames → runs),
`hooks/scenes/` (34 scenes, MIT, vendored by `scripts/vendor-ascii-scenes.mjs`). D7 in the README.

### Story 1.5 — Text pieces from eight categories, rendered in Node
`hooks/piece-render.mjs` (a piece → a clip, in Node), `hooks/piece-player.mjs` (what fits, crop, frames → lines),
`hooks/pieces/` (96 pieces, MIT, vendored by `scripts/vendor-ascii-pieces.mjs`). D8 in the README.

### Story 1.3 — The post goes out, and the read is taken
Owed to the product owner: post the screenshot with the line; on 2026-11-30 read
`gh api repos/golden-frijoles/skills/traffic/clones --jq .uniques` and stamp the verdict.

## Sprint QA
- `node --test skills/plugins/golden-frijoles/hooks/screensaver.test.mjs skills/plugins/golden-frijoles/hooks/screensaver-view.test.mjs`
- `claude plugin test skills/plugins/golden-frijoles` (the band and the real pieces under the engine)

## Sprint 1 — Smoke walkthrough (do these in order)
1. Install from the line above in a fresh terminal; start `claude` in any folder.
2. `/screensaver now` — a piece plays under the band; type a key — it goes.
3. Leave it 3 minutes on `main` — it starts by itself; on an epic branch it waits 9.
4. Shrink the terminal to 24 rows — a shorter piece, or a cropped one, never a squashed one; under 40 columns, none.
5. In a repo with no `Roadmap/`: the band reads `→ Next /golden-frijoles:setup`.
