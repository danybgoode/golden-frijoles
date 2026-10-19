---
epic: landing-launch-experiment
sprint: 1
title: "Instruments"
risk: high
phase: Building
stories_total: 4
stories:
  - id: S1.1
    title: "Consent banner, GA4 and Clarity"
    as_a: "a visitor to goldenfrijoles.com"
    i_want: "GA4 and Clarity to load only after I accept, and nothing third-party if I decline"
    so_that: "the team can see sources and recordings without tracking anyone who said no"
    risk: high
    status: planned
  - id: S1.2
    title: "Visitor \u2192 user join, with the acquisition variant"
    as_a: "the product owner"
    i_want: "a landing visit, its signup and the workspace it creates to share one identity"
    so_that: "any landing change can be read against signups and proven bets"
    risk: high
    status: planned
  - id: S1.3
    title: "The landing funnel, retargeted"
    as_a: "the product owner"
    i_want: "the landing funnel to count visit \u2192 prompt copied \u2192 signup"
    so_that: "it stops reading 0 against a CTA that no longer exists"
    risk: low
    status: planned
  - id: S1.4
    title: "Instruments verified, quota raised"
    as_a: "the product owner"
    i_want: "proof that GA4, Clarity and our own funnel all see a visit, and room in our quota for launch day"
    so_that: "launch traffic is counted, not dropped"
    risk: low
    status: planned
---
# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Sprint 1: Instruments

**Status:** ⬜ not started

## Stories

### Story 1.1 — Consent banner, GA4 and Clarity
**As a** visitor to goldenfrijoles.com, **I want** GA4 and Clarity to load only after I accept, and nothing third-party if I decline, **so that** the team can see sources and recordings without tracking anyone who said no.
**Acceptance:**
- A banner on every public page, deny by default; the choice is remembered and can be changed from the footer.
- On accept: GA4 `G-BWSJJ7JC9X` (via `@next/third-parties`) and Clarity project `z0boh5dqbe` load, and Clarity receives its consent call (required for EEA/UK/CH traffic).
- On decline: the network tab shows no request to google-analytics, googletagmanager or clarity.ms.
- The IDs are public env vars, not gates (rule #6 is for gates); the first-party beacon is unchanged and outside consent.
- A CSP allow-list for exactly these hosts ships in the same PR.
- `e2e`: a spec asserts no third-party script tag renders before consent.
**Risk:** high (shared layout, every public page)

### Story 1.2 — Visitor → user join, with the acquisition variant
**As** the product owner, **I want** a landing visit, its signup and the workspace it creates to share one identity, **so that** any landing change can be read against signups and proven bets.
**Acceptance:**
- `gb_vid` reaches `/api/v1/public/signup` and the auth callback; the guardrail events (`signup_started`, `account_confirmed`) are also written under the visitor id. The activation funnel keeps the user id and is unchanged.
- The workspace created for that person records its acquisition variant (`a` | `b` | none); `workspace_proved_bet` carries it, so the North Star read splits by variant and our own workspaces (no variant) never count.
- No alias table (rabbit hole 1): the choice of which events go under which id is written as a dated note in the epic README before code.
- A spec signs up a visitor and reads the visit, the guardrail event and the workspace's variant under the right ids.
- Check the activation funnel's 70 started / 1 confirmed reading and record what it was.
**Risk:** high (auth path, tenancy — escalate trigger)

### Story 1.3 — The landing funnel, retargeted
**As** the product owner, **I want** the landing funnel to count visit → prompt copied → signup, **so that** it stops reading 0 against a CTA that no longer exists.
**Acceptance:**
- A `landing_conversion` feature on the self project: `landing_visited → start_prompt_copied → signup_started`; `waitlist_conversion` retired.
- One end-to-end check produces a NON-zero number (LEARNINGS: a zero pages nobody).
**Risk:** low

### Story 1.4 — Instruments verified, quota raised
**As** the product owner, **I want** proof that GA4, Clarity and our own funnel all see a visit, and room in our quota for launch day, **so that** launch traffic is counted, not dropped.
**Acceptance:**
- GA4 realtime shows a visit after accepting the banner; Clarity shows a recording.
- Clarity readable by an agent: a project-level Clarity MCP server using `CLARITY_TOKEN` from the root `.env.local` (never committed), or the claude.ai connector updated by Daniel; one query about the site answers.
- `projects.monthly_event_quota` / `ingest_rate_per_min` for `golden-frijoles` raised for launch (a data `UPDATE`, rabbit hole 3).
**Risk:** low

## Build contract (locked by the architect before the builder started)
Ships in wave 1's single PR with Sprint 2 (README D16). Cite the D-number; never restate it.
- **S1.1** → D8 (allow-listed marketing paths only; constants in `lib/analytics-ids.ts`; deny by default; footer
  "Cookie settings"). CSP dropped (README deviation 3). Spec: no `googletagmanager`/`clarity.ms` script before consent,
  and none on `/app` or `/install` ever.
- **S1.2** → D2 (middleware mints `gb_vid`), D3 (beacon is the only exposure writer; subject `visitor`), D4 (the id
  table — the dated note), D5 (migration `workspaces.acquisition_variant`, applied before merge), D6 (the second event
  and the `proving_landing_workspaces` input). Spec: a visitor signs up and the visit, the visitor-keyed
  `signup_started`, and the workspace's `acquisition_variant` all line up; the activation funnel's events keep the user id.
- **S1.3** → D7. The non-zero check is the production read after deploy (CI has no self key, so `trackSelfEvent` no-ops
  there by design).
- **S1.4** → D12 (rate 600 → 3,000/min, a data `UPDATE`); Clarity MCP at project scope with `CLARITY_TOKEN` read from
  the environment, never committed.

## Sprint QA
- `e2e`: consent spec (S1.1), identity-join spec (S1.2), non-zero landing funnel (S1.3)
- browser smoke owed: yes, to Daniel — S1.1's accept/decline in a real browser; S1.4's GA4 and Clarity checks
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the PR preview while testing pre-merge)

1. https://goldenfrijoles.com in a private window
   → the consent banner shows; DevTools → Network has no clarity.ms or google request
2. Click Decline, reload
   → no banner, still no third-party requests
3. Footer → cookie settings → Accept
   → requests to clarity.ms and google-analytics appear
4. GA4 → Reports → Realtime
   → your visit shows within a minute
5. https://clarity.microsoft.com → project z0boh5dqbe → Recordings
   → your session appears (can take up to 2 hours)
6. (auth — owed to Daniel) Copy the hero prompt, sign up a fresh account from that window
   → the landing funnel shows visit → copy → signup for one visitor

If any step fails, note the step number + what you saw — that's the bug report.
