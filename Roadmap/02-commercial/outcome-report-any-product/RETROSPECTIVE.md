# The outcome report for any product — Retrospective

_Closed: 2026-10-14_
_Intent: yes_
_Quote vs actual: $6–16 (S, n=8, p25–p75) → ≈$22.51 (+41% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$22.36 (architect: date source, rework, kit packaging, every review fix) · claude-sonnet-5-5 ≈$0.15 (builder: report line, copy) · reviewers: verifier ×2 (same family), agy (general, default model, 3 files), **vibe security ×2 (funded again; needed VIBE_MAX_TURNS=60 and a 1–2 file scope; its first Blocking found a real key-pairing hole)** · prose: the architect — over the quote because the lock's "identical baselines" disproved the old method, and the security fix + mirror CI took two rounds._

## What shipped
https://github.com/danybgoode/golden-frijoles/pull/368 (`9781756`): `npx -y @golden-frijoles/kit pod-report --push` in any
product's repo (its `.env.local` key, the hosted engine by default; a tracked `.env.local` is never read and the URL and
key always come from one source). Shipped dates from each epic's parsed `status:` history; rework (re-opened after
shipping) as its own number and one report line; every screen names the kit command. Kit 1.9.4.

## What went well
- Locking against two real repos turned "make it robust" into evidence: the old search matched the epic template's own
  "`status: shipped`" DoD line at README creation, filing most epics as "documented after the work".
- The product owner's rule — "ship corrected and say so" — put a caveat in the artifact, not just a changelog line.

## What we learned
- A text search over docs can match the docs' TEMPLATE: our own template carried the very string we searched for.
- Auto-loading a repo's env file creates a new trust boundary: never pair a file's URL with a key from elsewhere.

## Gaps / follow-ups
- **Owed to the product owner:** the first aomx push and its signed-in report; re-push medusa-bonsai's report (median
  7 → 3.4 days, with the caveat); ~~`npm publish` of CLI 1.7.0 (from agent-legible-horizon)~~ (published 2026-10-14).
- A headless read of the outcome report (CLI/MCP) — /agents.md says "No headless read yet".
- A renamed epic folder restarts its dates (no `--follow`); none matter today.
