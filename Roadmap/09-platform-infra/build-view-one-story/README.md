---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: In review       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-17T13:50:39Z"
slug: build-view-one-story
title: "The build view tells one story"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 1
stories_total: 7   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: 87   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 15    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 34
quote_basis: "M, n=24, p25–p75"
hypothesis: "The build view says the same status on several lines, each from a different source. One headline, one track and one line per fact, with the board as other work, lets a founder read where the build is at a glance. We'll know when the product owner reads it without asking."   # the result record — copied from the seed by scaffold-epic; null = no target (never an error)
target_metric: null   # which number: a North Star input key (grounded) or free text (not grounded)
target_from: null   # from what, a number
target_to: null       # to what, a number
read_date: null       # YYYY-MM-DD; null = 30 days after shipping, derived by the extract and never written back
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "A founder who owns the product, watching an agent build"   # for whom, doing which job — copied from the seed (grounded-bets D1)
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "A terminal surface for the founder watching a build; no North Star input counts it."   # only with grounded: false
flag_key: null   # the epic's flag, decided at refine Stage 6b and copied from the seed; null = no flag. The epic page shows its state
target_segment: null   # the bet's measurement (one-bet-wired D1), copied from the seed: TARS target segment
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
build_order: 95      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: The build view tells one story

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/build-view-one-story.md`](../../00-ideas/seeds/build-view-one-story.md)
<!-- Class (above) is the Stage-2 classification: Feature, Spike, Bug, or Chore — see SKILL.md's
     Stage 2 table; sourced from scaffold-epic.mjs's --type flag (a fixed 4-value enum, not free
     text — a longer description belongs in the Why section below, not here; this comment never names
     that heading literally, so an edit anchored on it cannot land inside the comment).
     Optional: if this epic was ALSO tagged with an archetype at refining (see spike-role-archetypes.md),
     append " · **Archetype:** <Prototyper|Builder|Sweeper|Grower|Maintainer>" after Class. Omit entirely
     for the Builder default — untagged is fine.
     Scope-seed link: always points at seeds/ — lifecycle lives in the seed's `status:` frontmatter, not
     in a folder path (see 00-ideas/README.md). If this epic was scaffolded from a doc that has no seeds/
     entry, link that doc instead and migrate it to seeds/ when convenient — don't fabricate a seeds/ file
     that doesn't exist. -->

## Why
The build view says the same status on several lines, each from a different source. This redraws it as one story: a
header with the repo, the epic, its size, risk and stories done, the track under it, then Why, Target, Now, Spend and
Around, each fact once, in every state from refining to shipped. The design, with every state drawn, was approved by
Daniel on 2026-10-14 (the seed's *The design*).


## Platform-first note
No new fact: everything comes from `build-state.mjs --json`. The band only decorates (D3): glyphs, layout and tone.
Rules #1–#6 untouched. A plugin release (`skills/RELEASING.md`).


## What already exists (reuse, don't rebuild)
- `skills/template/scripts/build-state.mjs`, `scripts/build-state.mjs`, `skills/plugins/golden-frijoles/hooks/vendor/build-state.mjs`.
- `skills/plugins/golden-frijoles/hooks/build-view.mjs` (`LABEL_GLYPHS`, `toneOf`, `spendOf`, `barsOf`) and
  `hooks/index.tsx` (`TONE_COLORS`, `RISK_COLORS`, the track, the bars, the session line).
- `build-view.test.mjs`, `build-view.mod.test.ts`, `scripts/check-script-parity.mjs`.


## Architecture lock (2026-10-17, verified against live code and data)

Read live on `origin/main` 0fa71bf: `skills/template/scripts/build-state.mjs` (1108 lines; byte-identical in
`scripts/` and `hooks/vendor/`), `hooks/build-view.mjs`, `hooks/index.tsx`, `skills/refine/session-budget.mjs`, and
the view each prints today on this branch and on `main`. Each decision lives here once. The sprint's build contract
cites them.

**Corrections the live system forced (said out loud):**
- **No epic README carries `appetite:`.** 3 of 92 do. The size comes from `appetite`, else the first letter of
  `quote_basis` (40 of 92 carry one, e.g. `M, n=24, p25–p75`), else the linked seed's `appetite` (D2).
- **The repo name on the header is the plugin's name today.** `index.tsx` hard-codes `golden-frijoles ·` in front of
  every heading. It becomes the repo's own name, from the resolver (D2).
- **The glyphs move into the resolver.** The design's plain text carries them (`❝ Why`, `▸ Now`), and the CLI output
  (`node scripts/build-state.mjs`) should read like the band. One glyph table in `build-state.mjs`. The band reads each
  glyph off its line and colours it; `LABEL_GLYPHS` goes. The `⬆ Plugin` row stays the mod's own (D10).
- **Every bar is drawn by the resolver as glyphs, the Spend bar too.** Today `spendOf` recomputes the Spend bar from
  the resolver's words. The resolver has the numbers, so it writes `▰▰▰▱▱▱▱▱▱▱` itself. The band only colours runs
  (D3 of build-view-upgrade, kept).
- **"-1h" is not a wrong number.** `resetIn` (`session-budget.mjs:107`) floors 89 minutes to `-1h`: the 9:20 pm
  reset seen at 7:51 pm on 2026-10-10 was 1 h 29 m away, and the minus sign read as "one hour ago". Reproduced as a
  spec before the change (S1.6). The fix is the wording and the precision, not the arithmetic.
- **Story `status:` is not a per-story signal.** 688 stories say `done`, and in the last four epics every one was
  ticked at close (`git log` on their sprint files). "Between stories" can't read it. It reads the tree instead (D6).
- **"Verdict due" exists only for an epic with a target.** `readDateOf` (`lib/result-dates.mjs`) gives no read date
  without a `target_metric`. A shipped epic with none says so (D7). The ship day costs one `git log` and runs only for a
  shipped epic. The band's extractor call stays `dates: false`.
- **`Open` rows go.** Epics whose README says `in-progress` but have no worktree are counted in `⋯ Around` and no
  longer listed one by one. The JSON keeps `elsewhere.open_epics` (D8).
- **The token count and the source/age line leave the text.** Both stay in `--json` (`spend.mtok`, `stage_source`,
  `stage_age`, `facts_mode`). The design shows neither, and "each fact once" covers both.
- **Four more facts leave the text, all kept in `--json`** (named after the verifier's read of #396):
  - the epic's area (`epic.area`, from the old `Epic` row's `title    area · risk`);
  - each other worktree's branch name (`elsewhere.worktrees[].branch`), since Around names its title;
  - the `+N more — node scripts/build-state.mjs --json` pointer, now `+N more`;
  - the written status in the stage-unknown fallback (`status`, `phase_written`). The `⚑` line still carries the
    warning.
- **A title carrying an emoji is one column wide per emoji** (4 of 200 titles on main carry `✅`). The view counts
  code points as columns (D11 holds for its own glyphs, never for a title someone wrote). This is accepted as a
  limitation: such a header's right part sits one column past 100.

**Decisions**
- **D1. Layout, one renderer.** `renderLines(state)` returns the design's lines and nothing else: header, track,
  link, then `❝ Why`, `⌖ Target`, `▸ Now`, `$ Spend`, `⋯ Around`, `→ Next`, each omitted when it has nothing to say.
  Width is 100 (`WIDTH`). A field is `  <glyph> <Label padded to 9><value>` (13 columns before the value), and a
  continuation is 13 spaces. Glyphs: `GLYPHS` in `build-state.mjs`, the seed's table exactly. The `⚑` line sits right
  under the track. In the nothing-in-flight state the board link is line 2 (no track).
- **D2. The header.** `<repo> <state> <lead> · <title> · <size> · ▲ risk <LEVEL>`, then 4+ spaces, then the right
  part: the story bar + `N of M stories done` for an epic, `quote $lo–hi` for a seed (from the seed body's
  `quote: $lo–hi (…)` line, scaffold-epic's own regex), nothing when neither exists. `repo` is the name in `git
  remote get-url origin`, else the main checkout's folder name. `state` is the stage's symbol (`❧` To groom/Refining,
  `◇` Ready, `▶` Building and Locking, `◎` QA, `✓` Shipped, `○` nothing in flight). `lead` is `Sprint N of M`. N is the
  story's sprint, else the branch's `-sN`, else the first sprint with a story with no commit, else the last. A feature
  seed's lead is `Idea`; any other seed's is its type word. In the plain text the title is clipped with `…` so the line
  fits 100 columns. Nothing in flight: `<repo> ○ No epic on this branch · <branch>`.
- **D3. The band's header layout.** `headerOf(line)` in `build-view.mjs` splits a header into repo, symbol, lead,
  title, size, risk and right part. It is pure and tested. The band draws the left part and the right part in one row,
  and clips the TITLE (never the bar) to `bodyColumns`. Every glyph is single-width (S1.7), so a character count is a
  column count. Under 90 columns the right part takes its own row, indented 2.
- **D4. Sources only on disagreement.** One pure function, `disagreement(state)`, returns a sentence or null. Four
  pairs, one spec each:
  (a) the README says `shipped` and this branch has story commits not on main → "the epic's docs say Shipped, but
  this branch has N story commits not on main";
  (b) story commits exist, `locked_at` is unset and the README phase is before Building → "the epic's docs say
  <phase>, but this branch has story commits" (the track then reads Building, not Locking);
  (c) the written phase is ahead of the stage (Verifying/In review/Shipped while the board says Ready or Building;
  Shipped while it says QA) → "<sprint N's|the epic's> docs say <phase>, but the board has it at <stage>";
  (d) the sprint's frontmatter can't be read → that warning, as written.
  It is the only place a source is named.
- **D5. Why and Target.** `❝ Why` is the README's `hypothesis` (a seed's too), wrapped by `wrapWords` at
  `WIDTH − 13`. `⌖ Target` is `<metric>: <from> → <to> · read <day>` (or `read 30 days after shipping`), else
  `none yet: <grounded_reason>`, else `none set`, then `· intent match N` when the README (or seed) carries
  `intent_match`. A stamped verdict reads `· verdict <v>`. A seed being refined shows the Why and no Target.
- **D6. Now.** In order: shipped → D7. Seed at To groom → "shaping the plan"; at Refining → "plan ready, waiting for
  your approval". Any other seed → "N commits on this branch". Locking → "locking the architecture · <first story>
  next". With a story, and the tree is clean (`git status --porcelain` empty) and HEAD's subject names that story →
  "between stories: <id> done, <next> next", where next is the first story in the branch's scope with no commit (or
  "every story has a commit"). With a story otherwise → `<id> <title>`, then the user story on the continuation. No
  story → today's note, reworded so it never says "session journal" ("no story started yet · S1.1 next" when no
  commit names one). The journal stays a source. Only the words go.
- **D7. Shipped reads shipped.** For a README `status: shipped`: every sprint's bar is full and "N of N stories done"
  (the extractor's `floorSprintDone` rule), the track reads Shipped, and Now reads `shipped <day> · verdict due
  <day>`. Without a target it reads `shipped <day> · no target to read`. With a verdict it reads `shipped <day> ·
  verdict <v>`. The ship day is the newest commit touching the README's `status: shipped` line.
- **D8. Spend, Around, Next.** `$ Spend` is `<bar> ≈$22 of the $49–68 quote · 1 session`. Over the quote:
  `<full bar> ≈$71 · 29% over the $30–55 quote · …`. No quote: `≈$22 · no quote · …`, no bar. A thin quote keeps its
  `(2 past epics, wide)`, and a refused push keeps its words. `⋯ Around` holds the counts by stage (`N building · N in
  QA · N ready`, zeros dropped), leaving out the work this view is about. Then `in other worktrees: <title> (<story>,
  <status>) · …` on a continuation, then `next up: <name> (#n)` while something is in flight. With nothing anywhere it
  says `nothing else on the board`. `→ Next` appears only with nothing in flight: `/build <slug>   (top of the ready
  list)`, only when the top of Ready is an Epic row. A seed there reads `next up` in Around. The epic link is the only
  link while something is in flight. The board link is line 2 when nothing is.
- **D9. The 5-hour meter.** `sessionParts` gives the 5h part a 10-cell bar (`▰` filled, rounded) and the words
  `5h <bar> 62% · resets 9:20 pm (in 1h 29m)`. The bar's filled cells and the words take the part's tone, and the
  empty cells are dim. `resetIn` becomes `in 40m` / `in 1h 29m` / `in 3d 4h`, floored to the minute (never `in 0m`,
  never a minus). The 7d part reads `7d 9% (in 3d 4h)`. The clock time is local (`getHours`), probed live in the mod
  before it ships.
- **D10. The band.** `bandRowsFrom` reads the new lines into kinds: `header`, `track`, `link`, `flag`, `field`
  (glyph, label, value, with its continuations joined into one value so Ink wraps it, and the Now story kept as its own
  `note`), and `plugin` (the mod's row). Colours, each pinned by S1.7: repo dim; state symbol in the stage's tone;
  title bold; size dim; `▲ risk` bold by level (HIGH red, MEDIUM yellow, LOW green); story bar done green, rest dim;
  track mark bold in its tone, the rest dim; field glyph cyan, label dim; Spend bar green, or red when over, rest dim;
  `N% over` red; `⚑` red; the Now user story dim italic; the session line's tones and reset words. `trackOf`,
  `barsOf` and `toneOf` stay. `spendOf` reads the resolver's bar and the word `over` instead of computing.
- **D11. Glyph safety.** A test walks every glyph in `GLYPHS`, the header symbols and every rendered golden line. It
  fails on any code point with East Asian Width W or F (a range table from Unicode's `EastAsianWidth.txt`, in the
  test) or with `\p{Emoji_Presentation}`. Ambiguous-width glyphs (`◇ ─ │ ▶`) stay allowed.
- **D12. Release.** One plugin release, 1.11.0 (a minor: the view's text changes). The three copies of
  `build-state.mjs` stay byte-identical (`render-hook-vendor`, `check-script-parity`, skills-ci `cmp`). Bump, then
  `plugin-checksums`, then `render-plugin-release` (LEARNINGS, build-view-upgrade). No migration, no flag (the
  seed's carve-out). Rollback is the previous plugin version.

**Amended during the build (2026-10-17), said out loud:**
- **The live clock probe (D9) was not run.** Both a headless session with a probe line and an engine-harness run
  under two `TZ` values were refused by the session's permissions. `clockTime` uses the runtime's `getHours`, the
  specs pin it under Node's local time, and smoke step 5 is the check that the mod's runtime agrees.
- **`refine/` is not a work branch** (`lib/work-branch.mjs` reads `feat|fix|chore|spike|bug|docs/`). Smoke step 2
  now uses `docs/<seed>`. An idea's own commits on its branch never lift it out of Refining.
- **Evidence lifts a docs-only board** (S1.2 fix, seen on this branch). A fresh worktree has no facts snapshot until
  the first online refresh, so the track said Ready over seven story commits. Story commits now lift it to Building
  and an open PR to QA. The board's own stage still wins whenever it says more.
- **D4 (c) narrowed after review (#396).** It now compares the written phase with the stage the track draws (it
  had compared with the raw board, and said "board has it at Ready" under a lifted Building track). It fires only for
  `Shipped` while the drawn stage is Ready or Building, and never on a docs-only board. Verifying or In review written
  ahead of the board is the cadence. The evidence lift is story commits only: a PR is known only from live facts,
  and by then the board has read it (a draft as Building).
- **A fourth copy of the resolver**, `skills/scripts/build-state.mjs` (skills CI `cmp`s it against the template), is
  synced with the other three.

**Routing:** one sprint and three hot files that every story touches, so the architect (Opus) builds it in place on
`feat/build-view-one-story`. There's no fan-out: parallel builders would only collide on `renderLines`. Review goes
through `review-route.mjs --builder claude`.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 Header · S1.2 Sources only on disagreement · S1.3 Why + Target · S1.4 Now · S1.5 Spend, Around, Next · S1.6 5-hour meter · S1.7 No regression | low |

## Deploy order
One plugin release, sharing its window with `template-scripts-consumer-gates` (#95). No migration, no flag; rollback
is the previous plugin version.


## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at refining — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and its switch is set there** —
      `frijoles flags get <key>` must print `on vN` or `off vN` in its PRODUCTION row (a bare `off` with no version
      means nothing is served there, so the app runs on its own built-in default). A newly synced flag goes live as written in its file; a sync never switches an existing one. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at refining, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
