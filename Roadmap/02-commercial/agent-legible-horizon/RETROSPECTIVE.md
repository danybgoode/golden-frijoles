# Agent-legible horizon and docs — Retrospective

_Closed: 2026-10-14_
_Quote vs actual: not quoted (a same-day appetite-S follow-up) → ≈$9.95 (—)_
_Crew (actual): claude-opus-5-5 ≈$9.48 (architect: route, connector tool, release) · claude-sonnet-5-5 ≈$0.47 (builder: docs, /agents.md, login wording) · reviewers: verifier (same family), agy gpt-oss (general, scoped), **Codex gpt-5.6-luna / xhigh (security — Clean on its first run)** · prose: the architect._

## What shipped
https://github.com/danybgoode/golden-frijoles/pull/366 (`0a7ece7`): `frijoles horizon` over a member-gated
`GET /api/v1/cli/horizon` and a `get_horizon` connector tool, both the /horizon page's own derivation; Codex MCP setup in
install.md + llms.txt; `/agents.md` — every feature's headless read / change / check path and the common errors, held to
the CLI command table and the registered MCP tools by a two-way guard; login says why a product is active. CLI 1.7.0,
plugin + kit 1.9.3.

## What went well
- The lock found the "sync" the other agent asked for already existed (`roadmap-push --dry-run`) — documented, not built.
- Codex on luna/xhigh worked first time on the review rail (the product owner's routing).

## What we learned
- A page of "check it worked" claims is a set of testable claims: the verifier found four false ones (a revoked
  connector URL answers 401, not 404; revoked keys stay listed). The guard pinned names, not behaviour — read each
  claim against the code path.
- A guard's "not landed yet" excuse must expire with the thing it excuses, or it hides that thing's removal.

## Gaps / follow-ups
- **Owed to the product owner:** `npm publish` of `@golden-frijoles/cli@1.7.0`; then `frijoles horizon` in a bound repo
  and the login line on a machine that remembers a product.
- Next (product owner, 2026-10-14): the outcome report for ANY product — ship `pod-report` in the kit, compute shipped
  dates from each revision's frontmatter (a fixture proving the validated numbers hold), fix the console's empty-state
  command and setup's claim. Refined first.
