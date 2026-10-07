---
status: in-progress   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building               # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-07T12:44:56Z"
slug: one-epic-page
title: "One epic page"
area: 02-commercial
risk: low
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 22    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=8, p25–p75"
build_order: 66      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: One epic page

> **Area:** 02-commercial · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/one-epic-page.md`](../../00-ideas/seeds/one-epic-page.md)
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
An epic has two views with different content (F44): the Hub's epic page and the Board's card view. Neither says why
the epic exists or what it should move, neither shows its flag, and the commands are shorthand only our plugin
understands. This epic merges them into one page per epic, `/hub/<p>/epic/<e>`: where it is (a stage track), what to
do next (one plain-line command, the rest under More), why we're building it (hypothesis, target, read date, the bean
once read), progress by sprint, the flag's state, spend against quote and the documents, graphics before text. Old
`?card=` links land on it. Launch epic 5 of [`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md),
decision 4. Moves: grounded_bets_share · Tests: Value proposition.

**Signal:** open any card; without scrolling, say why the epic exists, where it is, and the next command.

## Platform-first note
No new data store. The page reads the pushed roadmap row (`BoardCard`: stage, sprints, links, PR, kickoff, appetite,
bet, goal, FinOps fields), launch epic 4's target and verdict fields, and this project's flag registry. One new field,
`flag_key`, travels the same path as the others: written at grooming, copied by the scaffold, extracted and pushed.

## Architecture lock (2026-10-07, verified against live code and live data)

**Live data, queried read-only on prod before the lock:** exactly **one** project has a pushed roadmap
(`golden-beans-demo`, latest push 2026-10-07, every Epic/Seed row carries a `stage`); it holds **0 flags**. The only
flag Golden Frijoles itself has decided (`auth.terminal_sign_in_enabled`) lives in **another** project (`golden-beans`);
`miyagi`/`miyagisanchez` hold 44/42 flags and no roadmap. No pushed row carries `flag_key` yet, and no epic carries a
target (`hypothesis`/`target_*` are null on all 67 Epic rows).

- **D1 — One model: the pushed row, as a `BoardCard`.** The page reads `findCard(items, slug)` (`lib/hub-board.ts`),
  not `summarizeRoadmap`'s epics, so the board and the page cannot disagree about a field. Seeds are cards, so seeds
  get the page. An unknown slug, a Sprint row or a stage-less (archived) row is a 404. A push with no stages at all
  renders the board's empty state ("push again"), never a page that guesses — live: 0 projects affected. FinOps keys
  ride on the card raw (`FINOPS_ROW_KEYS`, pinned by spec like `RESULT_ROW_KEYS`) and are read only through
  `epicFinops`; result keys through `epicResult`. `hub-board.ts` stays import-free.
- **D2 — `getHubRoadmap` also returns the project id it resolved.** The page needs it for the flag read (D12); it comes
  from the same server-side lookup the read already does after `requireDashboardAccess`, never from the URL a second
  time. ⚠️ *Corrected at build (2026-10-07):* the lock said `{ id, name }`, but `projects` has **no name column** — a
  product is its slug everywhere (switcher, `gf`, URLs). The plain lines (D7) name the product by its slug.
- **D3 — `?card=` redirects, filters ride along.** `/hub/<p>/board?card=<e>[&type=…&risk=high]` → `redirect()` to
  `/hub/<p>/epic/<e>[?type=…&risk=high]`, after the access gate. The epic page's Back link is
  `/hub/<p>/board` + `boardQuery(parseBoardFilters(query))`, so only the two whitelisted filters can ever reach it (no
  open redirect, no reflected text). The project board's cards, the Roadmap's rows and the workspace board's cards link
  straight to `/hub/<project>/epic/<e>` (the workspace card goes through the PROJECT's page, so access stays the
  project's; its Back is that project's board). ⌘K already opens the epic page (`console-palette.ts`) — epics only, as
  today. The build view's `?card=` link (`build-state.mjs`, a plugin file) is NOT changed: the redirect carries it.
- **D4 — `CardView` is deleted; the page is one server component in `app/hub/[projectSlug]/epic/[epicSlug]/`.** Its
  parts move into page-local components (`epic-components.tsx`). The approved `hub-board-card` surface retires with
  it: the `.surface` file, its `APPROVED.md` hash line and its `STATE-CONTRACT.json` entry (regenerated by
  `state-contract.mjs`), and `hub-board.authed.spec.ts`'s card tests move to the epic page. It was never a route's
  `referenceState`, so the coverage ratchet does not move (checked by `design-coverage.mjs --check` at build).
- **D5 — The design contract (corrected out loud).** The seed's `surface` block uses `track`, `panel`, `section`,
  `bars` and `row`, which are not among the twelve kinds `surface.map.json` reaches, so it cannot be approved as a
  surface as drawn. The epic route's `referenceState` stays `hub-epic` (a prototype picture) and the route stays
  `coveredElsewhere` (`e2e/hub.authed.spec.ts`) — verified: no spec diffs the live page against `hub-epic` today, so
  nothing measured goes red and nothing is claimed that was not. A new picture in the twelve kinds is **owed to
  Daniel** for approval (same precedent as one-header-one-name D10); the authed spec asserts the page's blocks by
  name meanwhile.
- **D6 — Head and track (S1.2).** Title + stage chip; small chips for area, risk (`Risk high · you merge`), appetite and
  build order (`#66`); no tiles, no stats. The track is seven steps: the six `BOARD_STAGES` through `stageLabel`
  (Backlog · Grooming · Ready · Building · QA · Shipped) plus **Read**, lit only when the row carries a verdict (no new
  stage, no stored value — the epic-4 field). Position logic is a pure function in `lib/epic-page.ts` (import-free,
  returns keys; the component labels them). Freshness: "Every number comes from the epic's README and git · updated
  <age>" from `formatFreshness`.
- **D7 — Plain lines (S1.3).** `stageCommands(card, product)` returns `{ text, shorthand, label }[]`, primary first.
  Each `text` names the step, the epic (its slug, which is what every script takes) and the product (its slug, D2), and
  **begins with the shorthand's own verb**, so the `SESSION-KICKOFFS.md` table still matches it: "Groom the <e> idea in
  <P>", "Build the <e> epic in <P>", "Resume building the <e> epic in <P>", "Wrap sprint 2 of the <e> epic in <P>",
  "Review pull request #42 for the <e> epic in <P>", "Close the <e> epic in <P>". The two `node scripts/…` lines stay
  commands (they are already plain to any agent). Shipped owes nothing and says so. `shorthand` is kept on each entry
  and shown under More, so the shorthand keeps working and is visible. One line is added to `SESSION-KICKOFFS.md`
  (root and the template copy) saying the Hub writes these verbs as plain lines.
- **D8 — The Now panel.** An SVG stage icon (the drift guard forbids pictographs), when (the stage source or PR state),
  one line on what is happening, ONE command with Copy; the rest under a `ds-disclosure` "More". At Ready the kickoff
  copy stays the head action (unchanged generator).
- **D9 — Why (S2.1).** `goal`, then `epicResult(row)`: hypothesis, `metric from → to`, read date (`read 4 Dec`, and "30
  days after shipping" when derived). Read: the Bean, the actual and "target was …"; gold only through the Bean's own
  `proven` kind. No target: "No target set" (epic), "No target yet: that comes with grooming" (seed).
- **D10 — Bars (S2.2).** One row per sprint (n, title, done/total, a bar), replacing the sprint list. Inline `style` is
  forbidden by the drift guard, so the bar is an SVG whose `<rect width>` is the fraction. Epic 1's Moonlight/Sprout
  tokens do not exist yet: in progress uses `--blue`, done `--green` (the nearest existing tokens; epic 1 renames).
  A seed: "Sprints appear once it's groomed".
- **D11 — `flag_key` and `flag_note` travel the result-record path (S2.3).** Seed frontmatter `flag_key:` is written at
  groom Stage 6b when a flag is decided; `scaffold-epic.mjs` copies it into the README frontmatter; `roadmap-extract`
  pushes `flag_key` (the SDK grammar `^[a-z][a-z0-9_.-]{0,127}$`, else null) and `flag_note` (the README's
  `**Flag:** …` line, which 7 epics already carry; else null); `roadmap-contract` validates; the push schema takes both
  `nullish`. Edits land in `skills/template/scripts/` and are copied by the existing render/parity tools; plugin + kit
  bump to 0.34.0 in the S2 PR (`skills/RELEASING.md`).
- **D12 — The flag read is this project's, by key, read-only.** Only when the card carries a `flag_key`, the page calls
  `getFlagRegistryView(project.id)` (the existing seam; the id from D2) and finds the key; the state per environment
  comes from `resolveActivationState` (on / off / never), with **production** as the headline. Found: state + "Open in
  Ship" → `/app/flags/<p>/<key>`. Not found: "Flag <key> not found". No key: "No flag" + `flag_note`. A failed read says
  "Flag state could not be read", never "not found". The demo is public (rule #2), so its flag state is too — the same
  tenant the hub already shows anonymously. **Live consequence:** the only roadmap tenant holds no flags, so on prod any
  key says "not found" until a project holds both its roadmap and its flags; found/not-found/none are proven by an
  authed fixture, and the prod "Open in Ship" smoke step is owed on such a project.
- **D13 — Spend.** `epicFinops`: an SVG bar of actual against the quote's top, `Quote $22–34 · Actual ≈$x`, or "not
  measured yet"; "FinOps" links to `/app/finops/<p>#epic-<slug>` (the row gains that id). A seed shows no spend.
- **D14 — Documents.** The idea (`links.seed`), The epic (`links.readme`), Sprint N (`links.sprints`), Retrospective
  (`links.retro`, set by the extract only when the file exists), opened on the pushed `board.repo` base; without one the
  path is shown, never guessed (the card's rule).
- **D15 — No flag, no migration** (standing rule, risk low). Rollback is a revert (+ a version bump for S2's plugin part).
- **D16 — Routing.** The architect builds both sprints in place (one session in this checkout; the sprints share the
  page file, so stacked `feat/one-epic-page` → `-s2`). Review: `review-route.mjs` + the fresh `pr-reviewer` per PR.

## What already exists (reuse, don't rebuild)
- `app/hub/[projectSlug]/epic/[epicSlug]/page.tsx`, `app/hub/[projectSlug]/board/{page,board-components}.tsx`
  (`CardView`, `?card=`), `app/hub/w/[workspaceId]/board`, `app/hub/[projectSlug]/page.tsx`.
- `lib/hub-board.ts` (`BoardCard`), `lib/stage-commands.ts`, `lib/hub-query.ts`, `lib/hub-freshness.ts`,
  `lib/roadmap-finops.ts`, `lib/flag-registry.ts` (`getFlagRegistryView`), `/app/flags/[projectSlug]/[flagKey]`,
  `/app/finops/[projectSlug]`.
- `scripts/roadmap-extract.mjs`, `lib/roadmap-artifact-schema.ts`, groom Stage 6b (`references/kill-switch.md`),
  `scaffold-epic.mjs`, `Roadmap/SESSION-KICKOFFS.md` (the steps the commands start).
- From launch epics 1, 3, 4: the Bean, the label module, the target and verdict fields.
- Design source: the private canvas, page 0: Epic (seven stages) and "Where each part comes from".

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Every card opens one epic page | low |
| 1 | S1.2 Where the epic is, at a glance | low |
| 1 | S1.3 One next command, in plain words | low |
| 2 | S2.1 Why we're building this | low |
| 2 | S2.2 Progress, one bar per sprint | low |
| 2 | S2.3 Flag, spend and documents | low |

**No-gos:** changing a flag from the epic page (shown here, changed in Ship) · per-user flag targeting (open question
3) · the build view (epic 8) and the Outcome report (epic 6) · new stages or stored values ("Read" is shown when a
verdict exists) · the kickoff generator · styling (epic 1), header and names (epic 3).

**Rabbit holes** (detail in the seed): plain lines must start the same steps the shorthand does, proven by pasting
each into an agent · `?card=` is in shared links, redirect and keep filters · seeds have no README · the flag lookup is
this project's only · stage words through epic 3's label module · workspace cards go through the project's page.

**Flag:** none. Risk low. Rollback is a revert.

## Deploy order
Sprint 1 then sprint 2, one PR each, merge on green. `flag_key` reaches the push schema (nullish) before the page
reads it; the groom and scaffold change follows the skills release flow.

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
