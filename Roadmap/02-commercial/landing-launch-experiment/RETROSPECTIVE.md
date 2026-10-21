# Launch: the first landing A/B on goldenfrijoles.com, run on Golden Frijoles — Retrospective

_Closed: 2026-10-21_
_Intent: mostly_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $41–62 (L, n=8, p25–p75) → ≈$281 (+353%)_
<!-- The actual is STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_* into
     the README (finops S2.5); copy its numbers here. -->
_Crew (actual): claude-opus-5-5 ≈$277 · claude-sonnet-5-5 ≈$3.28 · reviewers Codex (luna, until its cap), Antigravity (gemini-3.8-flash, gpt-oss-120b), Mistral Vibe (general + security), a fresh `verifier` on every HIGH PR · prose Codex draft (prose-draft), rewritten by the builder — the epic grew from five sprints to six: the launch found the engine could not run a low-traffic test, and Sprint 6 (not in the quote) fixed the engine before launching._
<!-- The models are STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_models
     into the README (why-as-a-story D6). Codex, agy, Devin and other outside tools are not in the transcripts; name
     them from the PR's review records. -->

## What shipped

- **Sprint 1 — instruments** (#408, `749695a`): a consent banner gates GA4 and Clarity on the public pages; first-party
  events (visit, prompt copy, sign-up) describe the landing journey; a visitor is joined to the account they become, with
  the landing version they saw; the landing funnel reads visit → prompt copy → sign-up.
- **Sprint 2 — the experiment rail** (#408): `variant()` beside `gate()`, exposures through the SDK's bound-experiment
  path, the flag `landing.variant_b_enabled`; an unknown funnel period is an error, never a silent other period.
- **Sprint 3 — landing B** (#409, `28249c4`): B as a whole alternate story, A pinned unchanged (D13). It shipped dark;
  it is now served to half of visitors by the running experiment (below).
- **Sprint 4 — plans and Stripe** (#412 #414 #416 #419 #420): Free and Growth, one event pool per workspace, Checkout,
  the signed webhook, the portal as the only cancel path, Plan & billing, Terms and Privacy, live Stripe set-up (restricted
  key, product, price, portal, branding, public details); "Get Growth" on both landings; operator alerts for failed
  payments, disputes, refunds and fraud warnings, the owner warned on Plan & billing, an unpaid subscription blocking a
  second checkout, and a read-only Stripe-vs-workspaces reconcile. **Checkout is ON in production** (Daniel,
  2026-10-20); the sandbox lifecycle passed end to end; **no real purchase has been made yet.**
- **Sprint 5 — Set up with us** (#410, `5c33159`): `/talk` is one offer (from $1,500, a half-day working session, a
  written readout, Growth for 3 months), and both landings lead to it.
- **Sprint 6 — a test at any traffic, launched in minutes** (#421–#425, #426): low traffic and quiet metrics warn,
  never block a start; any end date or none (`OPEN_ENDED_AT`, no migration); roll out or keep at any time, with each
  version's counts and the chance the leader is really better (Bayesian, exact to a grid fitted to the posteriors);
  `frijoles experiments ls/show/create/start/pause/resume/stop/decide/delete`, one code path with the console; pause,
  resume and delete in console and CLI. **The landing A/B is live**: `variant_b_copy_test_2`, launched by the CLI on
  2026-10-21 — visitors split 50/50, decided on `start_prompt_copied`, guardrails `signup_started` and
  `account_confirmed`, until stopped.
- **Releases**: CLI 1.11.0 (`frijoles experiments`, #427) and 1.12.0 (`frijoles version` / `update`, #428 #429);
  plugin + kit 1.16.2 and 1.16.3.

## What went well

- **The launch used the product's own rails** — measurement, attribution, flags, the experiment builder — so when the
  builder refused to start a low-traffic test, it showed up as a product failure to fix (Sprint 6), not as a reporting
  inconvenience to work around.
- **A fresh verifier on every HIGH PR caught what CI and the cross-family reviewers did not**, every time it ran:
  checkout's session read that would have burned a refresh token (#419), a chance figure dragged to 50% at large n and a
  wrong lead at low n (#422), a dated plan "fixed" to a shorter one and Feb 31 accepted (#423), CI red from a describe-body
  DB client and an untested owner gate (#424), pause breaking one-test-per-feature (#425), and a global install read as a
  checkout (#428). Each was fixed before merge.
- **Every claim a person reads was held to the code**: the Terms and Privacy pinned to the plan numbers and storage
  names, the install-page security claims pinned to the CLI's hosts, programs and files.

## What went wrong / incidents

- **The engine could not run its own launch.** The builder refused Start ("a metric has gone quiet", "161,690 days"),
  results were withheld below the planned sample, end dates were capped at 8 weeks, and the CLI could not create or start
  a test. Daniel: low volume "must never be a constraint to launch an A/B test, or to record its performance". Sprint 6
  fixed all of it; it was not in the plan or the quote.
- **I recommended not running the test because of traffic** — the wrong call, corrected by Daniel. Saved as a rule.
- **A feature sync used another project's key** and created two rows in the wrong project (deleted with approval,
  2026-10-19; a one-use key for the right project since).
- **Stripe arrived as a sandbox** through the Marketplace; the live key, price, portal and webhook needed their own pass,
  and two classifier-blocked production writes went to Daniel.
- **A sandbox secret key was printed into the session once** during the test purchase (a failed command echoed its
  argv); keys go through the environment since. Rolling that sandbox key is owed to Daniel.
- **Checkout went on before the real-money list closed**; #420 closed it the next day.
- **Codex hit its usage cap** for most of the epic; reviews fell back to Antigravity and Vibe, and Antigravity's
  "blocking" findings were wrong several times (argued down on each PR).

## Gaps / follow-ups

- **The first real Growth purchase** from a Free account, and a cancel (sprint-4 walkthrough) — Daniel.
- **Stripe Tax** — Daniel's decision before real volume.
- **Read the A/B by the read date (2026-12-31)**: `frijoles experiments show variant_b_copy_test_2`, then
  `epic-read`; the target is 0 → 5 workspaces from the new page proving a bet.
- **Exclude paused intervals from the analysis** (today the readout discloses that conversions while paused count for
  each person's group) — Daniel's call.
- Real-browser walkthroughs owed to Daniel: the consent banner accept/decline with GA4/Clarity; B on phone and desktop;
  the production kill of `landing.variant_b_enabled`; a test slot on `/talk`.
- The founder-site link (no URL in the repo) and the résumé hook PR in `miyagisanchez-resume`.
- `variant_b_copy_test` (Daniel's never-started 4-week draft) was deleted; its record is kept.
