---
epic: connect-page
sprint: 1
title: "Land on Connect, connected"
risk: high
phase: Building
stories_total: 3
stories:
  - id: S1.1
    title: "A new account's connector URL can already change things"
    as_a: "a founder who just signed up"
    i_want: "the connector URL I'm given to change things as me"
    so_that: "I don't have to make a new one first"
    risk: high
    status: done
  - id: S1.2
    title: "Signup lands on Connect"
    as_a: "a founder who just signed up"
    i_want: "to land on Connect"
    so_that: "I start from the page I'll use, not a separate onboarding page"
    risk: high
    status: done
  - id: S1.3
    title: "No one-time key at signup"
    as_a: "a founder who just signed up"
    i_want: "not to be pushed to copy a key I don't need yet"
    so_that: "the first screen doesn't feel urgent"
    risk: high
    status: done
---
# Connect: start where you are — Sprint 1: Land on Connect, connected

**Status:** ✅ shipped 2026-10-06 — PR #284 (`b8f5231`)

## Build contract (locked by the architect before the builder started — README § Architecture lock)
- S1.1 → **D1**. S1.2 → **D2**. S1.3 → **D3**.

## Stories
<!-- Keep the heading shape `### Story 1.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 1.1 — A new account's connector URL can already change things ✅ 5eb5f75
**As** a founder who just signed up, **I want** the connector URL I'm given to change things as me, **so that** I
don't have to make a new one first.
The URL signup provisioning mints names its owner (`created_by`), exactly like one made with the Create button —
never on the demo project. URLs minted at signup before this ship stay read-only until Get a new URL (no backfill).
**Acceptance:** a brand-new account's Connect page says the URL "can read and change <project> as you", and the Claude
app can turn a flag off with it.
**Risk:** high

### Story 1.2 — Signup lands on Connect ✅ 5d4ce6c, e1f5d8a
**As** a founder who just signed up, **I want** to land on Connect, **so that** I start from the page I'll use.
`/auth/callback` (including the Google return) and `/app/provision` send a newly provisioned account to
`/app/setup/connect/<slug>`. `/app/onboarding/<slug>` redirects there, so old links keep working. A `/cli/connect`
`next` still wins (account-from-the-terminal D8).
**Acceptance:** sign up with Google and land on Connect; open an old onboarding link and land on Connect.
**Risk:** high

### Story 1.3 — No one-time key at signup ✅ e050871
**As** a founder who just signed up, **I want** not to be pushed to copy a key I don't need yet, **so that** the first
screen doesn't feel urgent.
Signup still mints the project's first ingest key (it registers the starter feature through the SDK), but no longer
hands it to the browser: no one-time cookie, no "copy this now". Keys stay visible and revocable under Setup › Keys,
and Connect's SDK block says where a key comes from.
**Acceptance:** no page after signup shows an API key; Setup › Keys lists the project's key.
**Risk:** high

## Sprint QA
- **api spec(s):** provisioning stamps `created_by` (and not on the demo project); the callback and `/app/provision`
  redirect targets; `/app/onboarding/<slug>` redirects.
- **authed:** a fresh session lands on Connect with a writable URL and no key on screen.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Sign up at https://goldenfrijoles.com/signup with Continue with Google (a fresh Google account)
   → You land on Connect for your new project. No API key, no "copy this now".
2. Look at the Claude app block
   → The URL says it can read and change your project as you.
3. Open https://goldenfrijoles.com/app/onboarding/<your-project>
   → You end up on Connect.

If any step fails, note the step number + what you saw — that's the bug report.

**Run 2026-10-06 (agent, production):** `/app/onboarding/<slug>` → 307 to `/app/setup/connect/<slug>`; `/signup` says
"Straight to Setup › Connect". In CI, a brand-new account signs in through the real form, lands on Connect with no key
on screen, and its connector URL's `created_by` is the user (`connect-landing.authed.spec.ts`). Steps 1–2 with a fresh
Google account on production **owed to Daniel**.
