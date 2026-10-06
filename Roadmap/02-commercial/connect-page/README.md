---
status: shipped   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shipped       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-06T20:06:26Z"
slug: connect-page
title: "Connect: start where you are"
area: 02-commercial
risk: high
type: feature
sprints_total: 2
stories_total: 6   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 25    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 60
quote_basis: "M, architect estimate"
build_order: 61      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
actual_usd: 17.38
actual_mtok: 74.4
actual_basis: "this machine · 2026-10-06 · 1 session · prices 2026-10-02"
---

# Epic: Connect: start where you are ✅

> **Shipped 2026-10-06** — #284 (`b8f5231`), both sprints in one PR. See RETROSPECTIVE.md.

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/connect-page.md`](../../00-ideas/seeds/connect-page.md)
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
After signup a founder lands on a page whose first element is a one-time API key with "copy this now" — urgency
about a credential they do not need yet — and the page they actually need, Connect, is a different screen in a
different order, with a connector URL that is read-only for every new account. This epic makes signup land on
Connect, makes that URL able to change things from the start, and orders Connect by the path of least resistance:
the install prompt, do it yourself, the Claude app, Codex, the SDK, and your signed-in machines. Follow-up to
[`account-from-the-terminal`](../account-from-the-terminal/README.md), from Daniel's feedback on it (2026-10-06).


## Platform-first note
Nothing new is modelled. The URL's maker is `connector_tokens.created_by` (account-from-the-terminal D11); the
landing is a redirect target; the page composes what Connect, onboarding and `/install` already render.


## What already exists (reuse, don't rebuild)
- `lib/provisioning.ts` (`provisionTenantForUser` mints the first connector token and ingest key), `lib/connector-maker.ts`
  (`makerToStamp`), `app/auth/callback/route.ts`, `app/app/provision/route.ts`, `lib/onboarding-key.ts`.
- `app/app/setup/connect/[projectSlug]/` (page, `connector-manager.tsx`, `coding-agents.tsx`, actions), the onboarding
  page's SDK snippet and first-event block, `lib/install-prompt.ts` (prompt + plugin command constants),
  `lib/cli-install.ts`, `CopyPromptCard`, `CopyField`.
- The design contract: `setup-connect` (approved state), `design-system/route-manifest.ts`, the console visual gate.


## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 A new account's connector URL can already change things | high |
| 1 | S1.2 Signup lands on Connect | high |
| 1 | S1.3 No one-time key at signup | high |
| 2 | S2.1 Connect, in order | low |
| 2 | S2.2 Connect Codex | low |
| 2 | S2.3 The SDK, said plainly | low |

**No-gos:** new MCP tools, OAuth for the connector, `/install` and the landing, a backfill of signup-minted URLs.

## Kill-switch
None, by Daniel's standing rule (2026-08-31: no flag, ship straight to prod; rollback is `git revert`). The write
path itself keeps its existing gates (`CONNECTOR_WRITES_ENABLED`, `CLI_WRITE_API_ENABLED`).

## Architecture lock (2026-10-06, verified against live code)
- **D1 — Signup stamps the maker.** `provisionTenantForUser` inserts the connector token with
  `created_by: makerToStamp(slug, DEMO_PROJECT_SLUG, userId)` — the rule `mintConnectorToken` uses, imported, not
  restated. No migration. URLs already minted at signup stay `NULL` (read-only) until Get a new URL: changing the
  authority of existing credentials is not done without a decision, and the page already offers the one-click path.
- **D2 — One landing.** The callback and `/app/provision` redirect a newly provisioned account to
  `/app/setup/connect/<slug>`; a `/cli/connect` `next` still wins. `/app/onboarding/<slug>` becomes a redirect to the
  same place (old links, bookmarks); its page and the one-time key cookie are deleted.
- **D3 — The signup key stays, unseen.** Provisioning still mints the first ingest key, because the starter feature is
  registered through the SDK with it (AGENTS rule #1: no direct inserts). It is no longer handed to the browser
  (`setOnboardingKeyCookie` and `lib/onboarding-key.ts` go). It stays listed and revocable under Setup › Keys.
- **D4 — Connect, in six blocks, titled Connect.** Order as S2.1. The prompt and the plugin commands come from
  `lib/install-prompt.ts` (the constants `install.md` renders), the CLI's from `lib/cli-install.ts`. The plaintext URL
  and the Codex command carrying it stay owner-only (account-from-the-terminal D11 review).
- **D5 — Codex.** `codex mcp add golden-frijoles --url <url>` (verified against codex-cli 0.160.0 `codex mcp add --help`:
  `--url` = streamable HTTP). The token is in the URL path, so the command is the whole setup.
- **D6 — The design contract (corrected at build).** The lock planned a deferral; the coverage ratchet
  (`scripts/design-coverage.mjs`) forbids coverage falling and, by design, has no override. The approved `setup-connect`
  state measures STRUCTURE (head → card → card → note), so the six groups sit in two cards — **your agent** (1–2) and
  **connections** (3–6) — plus a closing note: Daniel's order, the same contract, Connect still covered. The retired
  onboarding row leaves the denominator (it borrowed `setup-connect`): 29 of 33 at close.
  ⚠️ **Daniel's call, owed:** the contract measures block SEQUENCE only, so "still covered" means "same skeleton".
  The approved picture draws card 1 = URL + status and card 2 = the three steps; the page now draws card 1 = your
  agent and card 2 = connections. Accept the two-card grouping, or approve a new `setup-connect` picture.
- **One PR for both sprints (deviation from the stack rule):** S1's landing target is the page S2 rebuilds, so
  reviewing them apart would review a landing on a page about to change; the PR is reviewed at the higher tier.
- **Routing:** the architect builds in place. Reviews: `review-route.mjs` + the fresh `pr-reviewer` on each PR.

## Deploy order
No migration. One PR for both sprints (see the lock's deviation); merge = deploy.

## Definition of Done (epic)
- [x] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [x] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [x] This README marked ✅; every sprint status ticked with commit refs
- [x] `RETROSPECTIVE.md` written
- [x] Product poster (`Roadmap/README.md`) updated
- [x] Team memory + `MEMORY.md` index updated
- [x] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [x] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [x] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
