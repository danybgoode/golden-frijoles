# Connect: start where you are — Retrospective

_Closed: 2026-10-06_
_Intent: mostly_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $25–60 (M, architect estimate) → ≈$17.38 (−71% vs the quote's top)_
<!-- The actual is STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_* into
     the README (finops S2.5); copy its numbers here. -->

> _Intent_ is provisional ("mostly"), owed to Daniel: the six groups he asked for sit in two cards (D6), which is
> his call to accept or to re-approve as a new `setup-connect` picture.

## What shipped
- **#284** (`b8f5231`), both sprints in one PR (a recorded deviation: S1 lands on the page S2 rebuilt).
- **S1** — the connector URL a new account is handed now names its owner, so it can change flags from the start;
  signup (password, Google, `/app/provision`) lands on Connect; `/app/onboarding/<slug>` redirects there and the page
  is gone; no one-time key reaches the browser (it still registers the starter feature through the SDK and stays in
  Setup › Keys).
- **S2** — Connect, titled Connect: your agent (the install prompt, do it yourself) and connections (the Claude app,
  Codex with one `codex mcp add … --url` command, the SDK with an ingest key's real sources, your signed-in machines).

## What went well
- Checking the page's facts before writing copy caught the plan's own error: `gf init` writes a flag-read key, not
  an ingest key, so "`gf init` gives you the SDK key" would have shipped false.
- The coverage ratchet did its job: it refused a planned "defer the design" that would have lowered coverage, and the
  approved structure turned out to fit Daniel's order.

## What we learned
- **Fix the provenance, not the instance.** The read-only URL for new accounts came from a second mint path
  (provisioning) that account-from-the-terminal never stamped. When a credential gains a property, list every place it
  is minted, not only the button you changed.
- **A structural design contract can be satisfied by a different page.** `setup-connect` measures block sequence;
  "covered" now means "same skeleton". When the contents move, say so where the row is pinned and put the
  re-approval to the product owner, rather than letting a green gate read as approval.
- **A hedge needs the right diagnosis.** The SDK hint first said "zero means unregistered"; the funnel route answers
  Not found for an unregistered feature and zero for a missing event. Check what each state actually renders.
- **Prettier on a glob reformats files you never meant to touch.** Format only the files you changed.

## Gaps / follow-ups
- **Owed to Daniel:** accept the two-card grouping or approve a new `setup-connect` picture (D6); the walkthrough
  (a fresh Google signup lands on Connect with no key; the Claude app turns a flag off with the URL it was given).
- URLs minted at signup before this shipped stay read-only until Get a new URL (no credential backfill).
- Dead `.ds-code` CSS left by the retired onboarding page; a handful of stale comments naming onboarding.
