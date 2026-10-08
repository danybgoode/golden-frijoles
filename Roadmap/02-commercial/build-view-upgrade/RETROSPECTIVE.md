# Build view upgrade — Retrospective

_Closed: 2026-10-08_
_Intent: owed to Daniel (yes | mostly | no)_
_Quote vs actual: $8–19 (S, n=5, p25–p75) → ≈$13.82 (inside the quote; Claude only, reviewers not measured)_

## What shipped
- **Sprint 1 · Why, how far, and where** (#312, merge `68b05e3`; plugin + kit 0.40.0). S1.1 a Why line from the
  epic's target, or "no target set" (`61d960e`). S1.2 one bar per sprint and the stage as a track, drawn in the
  mod from the resolver's own glyphs (`93fb65a`, review fix `fc9ae98`). S1.3 the link opens the epic's page on the
  Hub (`8ac31a4`). S1.4 (Daniel's kickoff addendum): the session line under the prompt in colour, with the time to
  each window's reset, `5h 78% (-2h) · 7d 46% (-3d)` (`0d2ae28`, review fix `7dffc29`).

## What went well
- **The lock corrected the pitch's premise out loud.** "The mod renders `lines` as-is" was half true: the mod drew
  the Progress bar itself and coloured Status with a regex that would have painted every track green, since the
  track always names Shipped. Both became lock corrections, not review findings.
- **Reading the engine's types before choosing where to draw.** `$.ui.status` takes plain text, so the colour ask had
  no home there. `PromptHint` lets a hook wrap the engine's own drawing (`next(e)`), and `$.ui.invalidate` exists for
  countdowns. One grep of the type file decided D6.
- **Mount specs on the real element table.** `$.ui.mount` validated the band and the hint row the way the engine
  will; the first fake hint was refused (`children` belongs beside `props`), which a JSON-level test would have hidden.

## What we learned
- **A value in `$.state` outlives the module variable beside it.** The hint row kept drawing pre-reload figures while
  `measured` reset to null, so the countdown froze and the next question erased them. When state survives a reload,
  read it back at `session.start`.
- **Render derived release files after the checksums, not before.** `plugin-release.generated.ts` embeds
  `SHA256SUMS`; rendering it first turned the static gate red. The order is: bump, checksums, then render.
- **Stage by name: `git add -u` is on the deny list.** The refusal looked like a judgement about the release; it was
  a glob in `.claude/settings.json`. Read the deny list before asking the product owner about a refused command.
- **Reviewers this round:** codex was capped, so agy Gemini ran the general pass. agy GPT-OSS overflowed even when
  scoped to five files, and vibe ran the security lens. agy also refuses a checkout with untracked directories, so run
  it from a clean worktree.

## Gaps / follow-ups
- **Owed to Daniel:** the walkthrough in `sprint-1.md` (Claude Code with plugin 0.40.0), and the `_Intent_` answer above.
- **No epic carries a target yet**, so the Why line says "no target set" everywhere until one is groomed with one.
- **Accepted:** a hint hook that throws makes the engine draw its own hint and no session row (D6 amended).
- **Not verified:** how the row sits beside the footer's mode labels at narrow widths, and `━`/`▸`/`◉` width in
  CJK-ambiguous terminals.
