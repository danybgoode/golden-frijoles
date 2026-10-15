---
epic: funnel-truth
sprint: 2
title: "Segments"
risk: high
phase: Shaping
stories_total: 4
stories:
  - id: S2.1
    title: "A project defines its segments"
    as_a: "a founder"
    i_want: "to name a segment by behaviour, such as people who did X at least N times in the last D days"
    so_that: "a bet can be aimed at the people who have the problem"
    risk: high
    status: in-review
  - id: S2.2
    title: "Targeted is the segment"
    as_a: "a founder whose bet names a segment"
    i_want: "Targeted to be that segment's share of the base, Adopted counted within it, and adopters outside it shown beside"
    so_that: "the funnel tests my targeting hypothesis, not everyone"
    risk: high
    status: in-review
  - id: S2.3
    title: "A bet names its segment"
    as_a: "a founder's agent refining a bet"
    i_want: "target_segment to accept a segment the project defines"
    so_that: "the bet travels with its segment from the seed to the Hub"
    risk: low
    status: in-review
  - id: S2.4
    title: "Segments on screen"
    as_a: "a founder"
    i_want: "my segments listed with their share of the base, and each funnel naming its segment"
    so_that: "I can tell who a number is about"
    risk: low
    status: in-review
---
# Funnel truth — Sprint 2: Segments

**Status:** 🟦 In review

## Build contract (locked by the architect before the builder started)
Cite the epic README's D9–D14; never restate them. **S2.1** = D9 + D10 (migration applied with `supabase db push`
before the merge; an api spec asserts anon and authenticated get a permission error, not an empty RLS result).
**S2.2** = D11 + D12 (`everyone` deep-equals today's output on the existing fixtures; a seeded-segment api spec).
**S2.3** = D13 (push schema, roadmap contract + its `skills/` copy, CLI `bet.ts`, the seed template comment).
**S2.4** = D14 (behind D6; a browser spec of a funnel with a segment).

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`; append ✅ + the commit ref when it ships. Name the story in
     each commit subject (`S2.1 …`). The frontmatter `stories:` entry is what tools read. -->

### Story 2.1 — A project defines its segments ✅ d84f05d, 72883a4, 378920b, f3a82c7
**As** a founder, **I want** to name a segment by behaviour, such as people who did X at least N times in the last D
days, **so that** a bet can be aimed at the people who have the problem.
**Acceptance:** a migration adds per-project segment definitions (`project_id`, key, event, min count, days),
service-role only, `REVOKE` from PUBLIC/anon/authenticated. `frijoles segments define <key> --event <e> --min <n>
--days <d>` and `frijoles segments ls` write and read them through a member-gated CLI route. `everyone` is reserved.
`supabase db push` runs before the merge.
**Risk:** high (a migration, an authenticated write).

### Story 2.2 — Targeted is the segment ✅ 6434eae, 57e4c35
**As** a founder whose bet names a segment, **I want** Targeted to be that segment's share of the base, Adopted counted
within it, and adopters outside it shown beside, **so that** the funnel tests my targeting hypothesis, not everyone.
**Acceptance:** `computeFunnel` takes an optional segment (the set of people matching the rule within the period's
base) and replaces `targeted = base` with it. Exposed people outside the segment and their adoptions go beside the
funnel, never inside its rates. A spec pins `everyone` byte-identical to today's output on the existing fixtures. The
trend (S1.1) uses the same segment.
**Risk:** high (the numbers people act on).

### Story 2.3 — A bet names its segment ✅ e017940
**As** a founder's agent refining a bet, **I want** `target_segment` to accept a segment the project defines, **so
that** the bet travels with its segment from the seed to the Hub.
**Acceptance:** `lib/roadmap-artifact-schema.ts` accepts `everyone` or a kebab key. An unknown key is accepted at push
time but read as "segment not defined" on screen, never silently as everyone. The refine seed template's comment
names the new option (`skills/`, a plugin release).
**Risk:** low

### Story 2.4 — Segments on screen ✅ 7f4785b
**As** a founder, **I want** my segments listed with their share of the base, and each funnel naming its segment,
**so that** I can tell who a number is about.
**Acceptance:** the console lists the project's segments with their share of the last 30 days' base. Every funnel and
trend names its segment ("Targeted: power-users, 18% of active people"). Behind `bets.funnel_trend_enabled`. A browser
spec covers a funnel with a segment.
**Risk:** low

## Sprint QA
- **api spec(s):** S2.1 → CLI route + function-level denial; S2.2 → pure model specs + an api spec with a seeded
  segment; S2.3 → push schema spec.
- **browser smoke owed:** yes, S2.4 signed in, to the product owner.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Run `frijoles segments define power-users --event funnel_trend_viewed --min 3 --days 30 --project golden-frijoles`.
   → it prints the segment and its share of the base.
2. Run `frijoles segments ls --project golden-frijoles`.
   → `everyone` and `power-users`, each with a share.
3. Set an open bet's `target_segment: power-users` in its epic README, merge, and let the roadmap push run.
   → the push run is green.
4. Signed in, open that bet's epic page in the Hub.
   → the funnel says "Targeted: power-users, N% of active people", and anyone who adopted outside it shows beside the
   funnel.
5. Open a bet whose segment is `everyone`.
   → its numbers are the same as before this sprint.
6. With `bets.funnel_trend_enabled` on, signed in, open https://goldenfrijoles.com/app/journeys/golden-frijoles.
   → a Segments section lists `everyone` (100%) and `power-users` with its rule and share, matching step 2.
7. Set a bet's `target_segment:` to a key nobody defined, push, and open its epic page.
   → "This bet targets <key>, which this project hasn't defined", and no funnel numbers.

Steps 4 and 6 are signed-in steps, owed to the product owner. Steps 1–2 need the CLI 1.9.0 release on npm (the
product owner's 2FA publish).

If any step fails, note the step number + what you saw — that's the bug report.
