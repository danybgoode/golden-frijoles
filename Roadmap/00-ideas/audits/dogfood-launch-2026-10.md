# Audit: dogfooding the launch: building Golden Frijoles with Golden Frijoles (2026-10, running log)

**Scope:** the product owner's brief of 2026-10-04: pre-launch audit of the whole product (brand refresh, UX/UI audit
of the human GUI, one naming theme across skills, coaches, folders, states and artifacts). Method: the product owner
acts as a user who has already installed the plugin and builds this product with it; Claude facilitates and logs every
gap here. Order: blind positioning run → `pmf-narrative` → `north-star` → `risk-validation` → compare → naming/brand →
UX audit. `scenarios-freeze` is out of scope (it belongs in the product, not a spin-off).

**Conventions:** one finding per entry, `F<n>`. **Area** = coaches · onboarding · naming · repo · method.
**Severity** = blocker (a stranger would stop) · friction (a stranger would stumble) · polish. Findings become seeds
once the run ends; nothing here is a decision yet.

---

## Run record

| When (CDMX) | Step | Outcome |
|---|---|---|
| 2026-10-04 11:31 | Brief agreed | Fully blind run (no coach frameworks, no existing positioning); separate agent; strategy outputs stay local; PO answers, Claude facilitates. |
| 2026-10-04 11:44 | Blind run sealed | `Roadmap/00-strategy/blind/2026-10-04-blind-positioning.md`, sha256 `9335a51d936c822b44a6886f31af103760ffba9ffeb6c1f53aaf369bfbf082b3`, ~5k words, ~45 files read, 49 skipped (logged in the doc), 19 web sources. Not read by the facilitator. |
| 2026-10-04 11:45 | `pmf-narrative` started | Followed from `skills/plugins/golden-frijoles/skills/pmf-narrative/SKILL.md` (plugin 0.27.2). |
| 2026-10-04 13:58 | `pmf-narrative` agreed | `Roadmap/00-strategy/pmf-narrative.md` `status: agreed`; business model delegated to the facilitator (F13), analysis in `business-model-scenarios.md`; three risks carried to `risk-validation`. ~2h15 of coaching. |
| 2026-10-04 13:59 | `north-star` started | Followed from `skills/plugins/golden-frijoles/skills/north-star/SKILL.md`. |

---

## Findings

### F1 · naming · friction: the front page names a different product
`README.md` opens "# golden-beans / **Golden Beans: Unified Growth Engine**" and describes the repo as spawned from
`dobby-foundation`. At least nine names are live across the repo: Golden Beans, `golden-beans`, Golden Frijoles,
`dobby`/`dobby-foundation`, Jev, TARS, Miyagi, `gf`/`gf-kit`, `ways-of-work`. A stranger landing on the repo cannot
tell what the product is called. Input to the naming theme.

### F2 · coaches · blocker: strategy is written to a public repo by default, with no question asked
`pmf-narrative` (and per their descriptions `north-star` and `risk-validation`) write to `Roadmap/00-strategy/*.md`
with no prompt about visibility. Our own rule (public-monorepo D7) says commercial strategy does not go in a public repo.
A user on a public repo commits their positioning, pricing and riskiest assumption to the world. This run kept them
local by hand (`.git/info/exclude`). Options: the coach asks once ("is this repo public?") and offers a git-excluded
or private location; or `00-strategy/` ships git-ignored with an explicit opt-in; or a config key for where strategy lives.

### F3 · onboarding · friction: the same coaches exist twice under different names
The claude.ai account carries `pmf-narrative-facilitator` and `deliberate-risk-validation`; the plugin ships
`pmf-narrative` and `risk-validation`. The content has drifted. A user with both sees two coaches for one job and can't
tell which is current. One source of truth, one name.

### F4 · naming · polish: the coaches borrow outside brands and have no identity of their own
The `pmf-narrative` persona is "an authority on the 'Deliberate Startup Methodology'", a name that isn't ours and
isn't explained. The skill names are descriptive labels (`pmf-narrative`, `north-star`, `risk-validation`) that follow
no theme. Input to the coach rename.

### F5 · method · polish: no blind run / pre-registration procedure exists
We piloted one: a separate agent writes the independent take before the coaches run, with a strict exclusion list (no
coach frameworks, no existing positioning), a reading log inside the doc, and a sha256 seal recorded here so the
comparison can prove the blind doc wasn't edited. The facilitator never reads it until compare. Candidate SOP; see how
the compare step goes before deciding its shape.

### F6 · onboarding · friction: this run does not exercise install or discovery
This session follows each SKILL.md from disk (cloud session linked to the PO's computer). Whether a stranger's agent
*finds* the right coach from a natural ask, and what the umbrella `golden-frijoles` skill says on first run, still needs
a pass in a fresh local Claude Code with only the plugin installed.

### F7 · coaches · friction: Step 1 has no way to converge a rich answer into one insight
`pmf-narrative` Step 1 asks one open question and moves on. An experienced founder answers with five or six distinct
observations (here: agile's runtime cost, PM artifacts as specs, harness continuity, role consolidation, cost centre
vs revenue centre, the intent ↔ understanding gap). The skill has no step to name the candidates, test each one against
its own three criteria (earned, unique, grounded) and ask the founder to pick one. The facilitator improvised that step.
Proposed: add a "distil and test" sub-step with a small table (candidate × earned/unique/grounded) and a one-sentence
rewrite the founder edits.

### F8 · coaches · friction: nothing is saved until the very last step
`pmf-narrative` writes its file only at Step 8. A long, multi-turn coaching session that hits a context limit or a
dropped session loses everything. Founders also answer ahead (here: a competitor framing and an audience claim during
Step 1) and the skill has nowhere to park those. The facilitator wrote the `status: draft` file after Step 1 and
parked early answers as comments under their future headings. Proposed: write the draft after every step (the skill
already allows revising a `draft` in place) and keep a parked-answers note per heading.

### F9 · coaches · polish: the problem is asked before the customer, so the answer spans every customer
Step 2 asks for "the customer's" outcome and motivation before Step 3 defines who the customer is. The PO naturally
answered for four segments at once (ladder-climbing PM, maker-coordinator, new builder, executive buyer), which makes
the outcome generic ("product success, however defined"). The facilitator wrote a shared outcome and parked the segments
for Step 3. Proposed: Step 2 asks "pick the one person who hurts most" up front, or Steps 2 and 3 loop once.

### F10 · onboarding · blocker (to verify): the Now user is not the user the setup assumes
`pmf-narrative` Step 3 named the Now market: an experienced maker at a solo-to-small startup who is "somewhat technical
… would be challenged by deep technical decisions". Today's install and operate path assumes a terminal, git, CI,
GitHub Actions, Vercel and Supabase fluency, and reads like it was written for an engineer. To verify in the fresh local
install pass (F6) and the UX audit: can this person get from install to a first shipped, measured change without
making a deep technical decision unaided?

### F11 · coaches · friction: the coaches never check a claim against the product that exists
The coaches are written for an idea, not a product with a repo. When the founder proposed "your always-on team" as a
benefit, nothing in `pmf-narrative` says to check it against what is built; the facilitator grepped the code (kill-switch
flags, the signals loop) and reworded it to what is true today. The same applies to moat claims (Step 5): whether
switching costs are real depends on what the product holds that the user can't take with them. Proposed: when the repo
has code, the coach reads the product poster (`Roadmap/README.md`) once and flags any benefit or moat the product
does not back yet ("aspirational" vs "true today").

### F12 · method · friction: the plan of record prices against the narrative
The only written pricing (`seeds/golden-frijoles-cli.md`, 2026-09-16) copies Flagsmith: seats plus flag evaluations.
The narrative's moat is counter-positioning against per-seat tools, and flag evaluations run in the SDK at zero cost to
us. Neither unit tracks the real cost (events and their retention). Nothing is enforced yet, so superseding it costs
nothing. Analysis: `Roadmap/00-strategy/business-model-scenarios.md` (local).

### F13 · coaches · friction: no "do the homework" mode when the founder delegates
At Step 6 the PO asked the coach to run and rank business-model scenarios instead of answering. `pmf-narrative` only
asks questions; it has no step that reads cost-to-serve from the product, fetches competitor pricing and returns options.
The facilitator built that by hand (cost drivers from the code, a re-runnable model, a ranked table, tiers). Proposed:
when a dimension is delegated, the coach produces an options brief with sources and marks the section `proposed`, not
`agreed`, until the founder decides. Side effect for the blind comparison: the business model in the narrative is
facilitator-authored, so that dimension is not an independent read of the PO.

### F14 · coaches · friction: `north-star` re-asks what the agreed narrative already says
`north-star` Step 1 asks "What is your product? Who are your customers? How do you make money?" and never reads
`Roadmap/00-strategy/pmf-narrative.md`, even though `pmf-narrative` hands off to it and the file sits next door with
`status: agreed` (`risk-validation` does read it). A founder who just spent two hours on the narrative is asked the same
three questions again. The facilitator pre-filled Step 1 from the narrative and asked only for confirmation. Proposed:
read the narrative when it exists and open with "here's what your narrative says; still true?"

### F15 · coaches · friction: the North Star's send command pins a stale CLI
`north-star` Step 7 tells the user to run `npx -y @golden-frijoles/cli@0.3.0 north-star set …`; the published CLI is
0.4.1 (`packages/cli/package.json`, npm). Either the pin is deliberate and undocumented, or it drifts with every CLI
release. The plugin's release checks (`check-release.mjs`) could assert that skill-quoted CLI versions match.

### F16 · product · blocker: the product can't count its own North Star
The proposed North Star ("Proven bets": underwritten bets with an evidenced verdict, win or loss, within 30 days of
shipping) is built from pieces the product already has (bets ledger with appetite and opportunity cost, epics with
`shipped_at`, immutable experiment decision records, TARS readouts, the signals loop's evidence-pointer rule), but no
object ties a bet to the target it was meant to move and the verdict it got. `groom` does not ask "which number, by how
much, by when" when a bet is placed. Without a bet-verdict record the tagline's third verb ("prove it paid off") has no
data behind it. Candidate epic; likely the most important one on the launch path.

### F17 · coaches · friction: the North Star coach also gets delegated, and has no options-brief mode either
Same pattern as F13: at Step 4 the PO asked for scenarios instead of candidates. The facilitator ran the candidates
against five 30-day customer scenarios (solo low-traffic, startup with traffic, feature factory, splitter, honest
learner) and ranked them. That scenario test was the most useful step of the coach so far, because it caught two leaks
in the PO's draft (losses scored zero; no evidence floor) that the checklist questions alone would not have. Proposed:
make "run your candidates against 4–5 customer scenarios" a standard Step 4 sub-step.

### F18 · product · idea (PO, 2026-10-04): score each bet on how well it is grounded
Raised by the PO during `north-star` Step 5. A bet should carry a grounding score: is it tied to a North Star input,
was that North Star defined the full way (agreed narrative, agreed North Star, a target with a read date), and does it
have a hypothesis to validate? Ungrounded bets still run and build, but score lower. In this run it becomes the Depth
input ("grounded bets"); as a product feature it belongs with F16's bet-verdict record: the same object holds the
grounding score at placement and the verdict at the read date. The strategy coaches' `status: agreed` files are the
natural inputs to the score.

### F19 · coaches · polish: `risk-validation` reads the narrative but not the North Star
`risk-validation` Step 1 reads `pmf-narrative.md` (good, unlike F14), but not `north-star.md`, which sits beside it with
`status: agreed`. Here the North Star carries its own risk (the product can't count it yet, F16), and the coach would
not see it. Proposed: read every `agreed` file in `00-strategy/` and play back one line from each.

### F20 · product · friction (PO risk R4): the practice layer leaks one hosting stack
The PO's first-ranked risk: the product looks built for Vercel + Supabase, while makers should bring their own stack.
Evidence: the SDK is framework-agnostic and the engine is hosted, so a customer's app needn't run on either; but 5 of 14
plugin skills (`golden-frijoles`, `pmo-report`, `standup-post`, `vercel-prune`, `weekly-recap`) and the spawn template's
configs and WAYS-OF-WORKING assume Vercel. The stack assumption is in the practice, not the engine. Input to the
renaming/IA pass: hosting-specific skills become adapters, not core.

### F21 · product · friction: the experiments engine doesn't run on its own homepage
`risk-validation` chose a smoke test: two or three hero messages served through the product's own experiments engine.
The landing already sends its funnel events (`landing_visited` → `signup_started` → `account_confirmed` →
`first_event_ingested`, `lib/self-track-events.ts`), but `app/page.tsx` reads no flag or experiment, so the hero cannot
be varied without a build. Dogfooding the core promise ("ship it behind a flag, read the verdict") on our own front door
is a small, high-signal first bet. The funnel's own baseline is visible only in the PO's console; the public funnel
route is limited to the demo project.

### F22 · method · proposal: the blind run, as a standard procedure
Piloted end to end (F5). It earned its place: it changed the test sequence (its "the method travels" risk sits upstream
of the coached smoke test), added a launch channel (plugin marketplaces) and a segment (studios), and supplied naming and
messaging material the coaches don't produce, for one agent run and no PO time. Shape for the product:
1. **Seal before coaching:** a separate agent, an exclusion list (coach frameworks plus existing positioning), a
   reading log with self-reported contamination, a sha256 recorded in a log the facilitator can't edit silently.
2. **Different model family** for the blind agent (the cross-review tooling already reaches Codex, Gemini and Mistral),
   so agreement is real evidence; same-family agreement is discounted.
3. **The facilitator stays blind** until every coach has reached its decisions; delegated dimensions are marked as
   facilitator-authored (F13, F17).
4. **A compare template:** converged / diverged / only-blind / only-coached / decisions, plus a "did it earn its place"
   line.
5. **One output section is mandatory in the blind run:** the riskiest assumption and the cheapest test, in its own words.
Naming waits for the rename workstream ("second opinion", "cold read", etc.).

### F23 · naming · blocker: seven lifecycle vocabularies for one journey
Seed status (`raw · ready · queued · archived`, plus `scaffolded` and `shipped` in practice, outside the enum), epic
status (`scaffolded · in-progress · shipped · archived`), epic phase (`Shaping … Shipped`), board stage (`To groom ·
Grooming · Ready to build · Building · QA · Shipped`), sprint status, project loop stage (`Consider · Operate · Exit`)
and strategy status (`draft · agreed`). A seed that is `ready` shows as *Grooming*. A stranger must learn the mapping
before the board makes sense. Proposed: one canonical lifecycle enum, one display label set, derived everywhere.
Detail: `naming-inventory-2026-10-04.md` §2.

### F24 · brand · friction: the brand world broke at the rename
The Golden Beans identity is a coffee roastery (`references/design-direction.md`; tokens: dark roast, kraft and foil,
brass, gold). The rename to Golden Frijoles changed the name and public addresses, not the world, and frijoles are not
coffee beans. The brand workstream picks a world that belongs to the name; much of the material language (kraft,
warmth, gold) can carry over.

### F25 · product · friction: a customer's name in product copy
"Miyagi" appears in user-visible copy in the signed-in product (flag audit timeline, flag detail, the design-system
specimen's "Revoke key 'Miyagi Cloud Run'?") and 13 times in the CLI/SDK. Every stranger sees another customer's name.
Generic wording ("your control plane", an example key name) belongs there.

### F26 · coaches → groom · works: the strategy line connects the coaches to planning
`groom` Stage 0 ran `strategy.mjs` on the three agreed files and printed the North Star, its four inputs, the highest
domino and the low-conviction dimensions, plus the pitch's `Moves · Tests` line. The hand-off from the coaches to
planning works as designed. Note for the rename: `strategy.mjs` keys on today's file names (`pmf-narrative.md`,
`risk-validation.md`) and folder (`00-strategy/`), so it is on the rename's reuse list.

### F27 · groom · polish: the generator locator misses the plugin's own source tree
In this repo (the plugin's source), the locator's candidate list (`$CLAUDE_PLUGIN_ROOT`, the plugin cache,
`.agents/skills`, `~/.claude/skills`, `./skills/groom`) found nothing; only the slow `find` fallback found
`skills/plugins/golden-frijoles/skills/groom`. Add that path to the candidates.

### F28 · groom · friction: the intent score can't run where a Cowork session runs
`groom` Stage 3.5 (`intent-match.mjs`) asked Jev 29 questions and stopped with "could not look (jev: network: fetch
failed)". The Cowork VM's egress allowlist doesn't reach TypeSafe, though `.env.local` holds a key. The skill handles
it correctly (advisory, says "could not look", carries on), but a stranger planning from Cowork never gets the score.
Either document the host it needs on the allowlist, or let the score run from the cloud container.

### F29 · groom · polish: the kickoff adds a DB-migration rule for a bet with no DB migration
`emit-epic-kickoff.mjs` added "**Migration:** apply it BEFORE merging (merging deploys)" to this bet's kickoff. The bet
has no database migration (it explicitly maps stored values in the UI instead); the generator appears to key on the word
"migrat…" in the docs (`migrate-layout`). A builder following it would look for a migration that doesn't exist. Key the
rule on a `supabase/migrations/` path or an explicit flag in the epic, not on prose.

### F30 · environment · friction: git in a Cowork session needs delete permission and an identity
In the Cowork VM, `git fetch` left a stale `.git/index.lock` because deletes are off by default in connected folders,
and `git commit` failed with no author identity. Fixed by granting delete permission for the session and passing the
PO's identity per command. A stranger planning from Cowork hits both on their first `groom` commit; `groom` Stage 7.4
could check `git config user.email` and lock-file writability before it scaffolds.

### F31 · environment · friction: pushing from a Cowork session needs a detour
The Cowork VM has no GitHub credentials (`git push` → "could not read Username"), and the cloud workspace's `gh` token
is rejected for GraphQL. The plan reached GitHub via a git bundle staged into the cloud workspace, a push through the
session's git proxy, and `gh api` (REST) for the PR (#270). A stranger in the same setup would stop at the push; groom's
last step should print "commit done, push from your machine: <command>" when it can't push.

### F32 · process · blocker: the betting table never happens, so 84% of bets ship unfunded
`groom` scaffolds right after approval, skipping the documented Queue step; 43 of 51 scaffolded or shipped seeds have
no `underwritten_by`, and `build-order.mjs` only warns for `queued` seeds. PO decision (2026-10-04): fold funding into the
approval gate. Pitch: `seeds/fund-at-approval.md`.

### F33 · groom · friction: a funded fixed-scope seed has no build command
`fund-at-approval` is a queued seed (fixed scope, no epic), and both kickoff generators require `--epic`, so `/build`
can't start it and the builder needs a hand-written prompt, which `groom` itself forbids for anything a generator
produces. Either `scaffold-epic.mjs` always scaffolds (a one-sprint bet for fixed scope), or `emit-kickoff` accepts a
seed. Natural to fold into `fund-at-approval` itself, since it rewrites the approval step.

### F34 · coaches · blocker: anecdotes were written down as the persona's goals and frustrations
Reading the one-pagers the next morning, the PO rejected the persona's frustrations and drivers ("a Friday incident",
"a one-line change that waits on everyone", "refuses to be a note-taker"): those were illustrative anecdotes from the
PO's career, offered to explain the insight, not the customer's real goals, motivations or frustrations. The
facilitator transcribed them into the narrative's Problem → Gaps (and Audience motivations) and the one-pagers
amplified them. Root cause: no step that **ladders an example up to the need behind it** and checks it against outside
evidence before it becomes a dimension. Also surfaced: the Now segment itself was wrong; the PO pivoted to the startup
founder (solo to mid-size). For `coaches-v2`: add a "ladder up" sub-step (example → underlying need → evidence) to the
narrative coach, and have the persona poster cite a source or say "hypothesis" per line.


### F35 · product · blocker: the Hub and the console are two products
The console (`/app`) and the Hub (`/hub`: Roadmap, Board, Horizon, Report) share no header. The console's only way in
is Portfolio's link to a product's report; the Hub's only way out is one "back to the product" button; ⌘K finds pages
and flags, not epics or Hub tabs. Decided: one header with the Hub as Plan (`ux-ui-audit-2026-10.md`, decision 3).

### F36 · naming · friction: the same thing has several names
Flags are "Features" in the menu and "On in Production" on Today; A/B tests are "Experiments"; one report is "Report",
"Pod report" and the share page; "Destinations" means both Horizon's end states and webhook delivery; home is "Today"
or "Your workspace"; three lifecycles (Board stages, epic status, Portfolio loop). Decided: decision 2.

### F37 · product · blocker: nothing records whether an epic paid off
There is no target, read date or verdict per epic, so the report can't say which epics paid off and the epic page
can't show its result (see F16 for the North Star). Spend per epic is already in FinOps. Launch epic 4.

### F38 · onboarding · blocker: the Claude app connector can only read
The tokenized connector URL reads; writes need an `agent_write` Bearer key or a `gf_pat_`, which the Claude app's
custom connector can't send. Part of launch epic 2.

### F39 · onboarding · friction: the install prompt installs before anything is read
`INSTALL_PROMPT` tells the agent to install straight away; there's no `install.md` for the agent to read first, summarise
(what it installs, changes and contacts) and offer a security review on. Part of launch epic 2.

### F40 · onboarding · blocker: no browser sign-in for `gf login`, and no Google sign-in
Part of launch epic 2.

### F41 · repo · friction: this repo's build view links to the demo project
`golden-frijoles.config.json` sets `board.hubUrl` to `/hub/golden-beans-demo`, so the band's link opens the demo, not
this project. One-line fix; launch epic 8 changes the link target anyway.

### F42 · naming · friction: Plain · Outcome was hard to read for its own author
The PO needed a comparison table to follow the screens; agile-fluent users would stumble the same way. Reverted to
plain agile with the bet as framing (2026-10-05, decision 1).

### F43 · method · friction: the UX work proposed an IA without the route inventory
The first pass retired pages without checking them, including Portfolio, which shipped on 3 Oct. New rule (audit,
"How this ran"): start from the route map, show today next to the proposal, list what it removes.

### F44 · product · friction: an epic has two views with different content
The Board's card view (`?card=`: goal, stats, steps, docs, commands) and the epic page (`/hub/<p>/epic/<e>`: tiles,
sprints, FinOps line). Decided: one view (decision 4).

### F45 · design · friction: pages read as walls of text
Decided: density rules and an icon set (decision 6).

### F46 · flags · friction: no project-level flag policy, and QA assumes a preview environment
Flags are only raised for `risk: high` epics at grooming, with no project setting, and the review step assumes staging
or previews many projects don't have. Designed for after launch (decision 7): a project setting, and QA in production
with the flag on for the owner only.
