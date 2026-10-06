---
status: scaffolded   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shaping       # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: account-from-the-terminal
title: "Account from the terminal"
area: 02-commercial
risk: high
type: feature
sprints_total: 3
stories_total: 8   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: 67    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: 144
quote_basis: "L, n=3, p25–p75"
build_order: 62      # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
---

# Epic: Account from the terminal

> **Area:** 02-commercial · **Risk:** high · **Class:** Feature · **Scope seed:** [`00-ideas/seeds/account-from-the-terminal.md`](../../00-ideas/seeds/account-from-the-terminal.md)
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
At launch, a stranger arrives from the landing and has to get from "this looks right" to a signed-in terminal. Today
four things lose them: the install prompt installs before anything is read, `gf login` asks them to mint and paste a
token in the console, sign-in is email and password only, and the Claude app connector can read a project but not
change it. This epic makes the front door one prompt, one browser click and one URL: the agent reads `install.md`
and waits for a go-ahead, `gf login` signs in through the browser with Google, GitHub or an email link, and a
connector URL made by a person acts as that person. Launch epic 2 of
[`audits/ux-ui-audit-2026-10.md`](../../00-ideas/audits/ux-ui-audit-2026-10.md), dogfood F38, F39, F40.
Moves: proving_workspaces · Tests: Value proposition (the landing's one line).

**Amended 2026-10-05:** three gaps against the canvas First run flow closed in place, no new stories: checksums in
`install.md` (S1.1, frame 2), the security review the agent runs (S1.2, frames 2–3), and the approve page that names
the device, the product and what the agent can do (S2.2, frame 6). Appetite stays L; if it runs short, sprint 3 is cut
first, as before.

**Signal:** Daniel, on a clean machine with a fresh Google account, on production: copy the prompt, the agent
summarises `install.md` and waits, installs, setup asks "sign in now?", the browser opens once, the code matches, the
terminal prints who he is; then one URL pasted into the Claude app turns a flag off, recorded as him.

## Platform-first note
Identity is Supabase Auth (the system of record for accounts): Google, GitHub and email links are its own providers,
and `/auth/callback` already exchanges the code and provisions the tenant. CLI credentials are `cli_tokens`
(`lib/cli-tokens.ts`, minted per user); the device code only decides *when* to mint one. Connector URLs are
`connector_tokens`; the person who made the URL is a new column on it, not a new credential store. The flag is
Golden Frijoles's own (never a parallel store), with the `lib/flags.ts` env gate as the named fallback if the lock
finds a circular dependency on its own sign-in.

## What already exists (reuse, don't rebuild)
- `apps/web/lib/install-prompt.ts` (`INSTALL_PROMPT`) and `lib/cli-install.ts` (package, bin, install commands);
  `/install`, `components/landing/MakerHero.tsx`, `MakerClosingCta.tsx`, `app/app/onboarding/[projectSlug]`;
  `skills/scripts/check-onboarding-parity.mjs` and the transcriptions it checks.
- `app/llms.txt/route.ts`: the plain-text route pattern built on `getSiteUrl()`; `install.md` follows it.
- `app/login/login-form.tsx`, `app/signup/signup-form.tsx`, `app/auth/callback/route.ts` (`provisionTenantForUser`,
  idempotent), `lib/safe-redirect.ts`, `lib/flags.ts` (`isSignupEnabled` as the gate pattern), `lib/rate-limit.ts`.
- `lib/cli-tokens.ts` (`mintCliToken`, `resolveCliToken`, `revokeCliToken`, `listCliTokens`), `app/app/setup/cli`
  (`cli-tokens-manager.tsx`), `packages/cli/src/commands/auth.ts` (`gf login`, stdin, `--token`), `credentials.ts`.
- `lib/connector-tokens.ts`, `app/app/setup/connect` (`connector-manager.tsx`),
  `app/api/v1/public/mcp/c/[token]/route.ts` (write tools, `authorizeAgentWrite`, `resolveFlagWriteActor`,
  `isConnectorWritesEnabled`, `isCliWriteApiEnabled`).
- `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md`, setup Q4 (`project.account`: later · now).
- Design source: the private canvas, Landing, SignIn, Account and Setup-Connections frames.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `install.md`: what it installs, changes and contacts | low |
| 1 | S1.2 The prompt reads first and waits | low |
| 1 | S1.3 The landing hero in one line | low |
| 2 | S2.1 Google, GitHub and email-link sign-in, and the flag | high |
| 2 | S2.2 `gf login` through the browser | high |
| 2 | S2.3 The account question, as the Account screen | low |
| 3 | S3.1 A connector URL that acts as you | high |
| 3 | S3.2 Setup › Connections: who and what is connected | low |

**No-gos:** OAuth sign-in through Claude's connector flow (after launch) · any landing section below the hero ·
Setup's "How epics ship" (F46, after launch) · removing password sign-in or token-paste login · the Claude connector
directory listing · digest channels · night garden styling (epic 1 owns it).

**Rabbit holes** (detail in the seed): the prompt stops being a github-only constant, so `getSiteUrl()` applies here
while the skills repo carries the production URL · `install.md` generated, never hand-typed · device codes are a
credential (10 minutes, single use, rate-limited, the confirm step matters) · Google's consent screen has days of lead
time · account linking by email across password and Google · a secret URL that writes (path only, revocable, rate-
limited, audited as the person; old URLs stay read-only) · two additive migrations applied apart from deploy · the
skills repo release flow.

## Kill-switch
`auth.terminal_sign_in_enabled`, **kill switch, born ON** (Daniel, 2026-10-05: "it must be on"): default `true`,
created enabled in every env (`gf flags create auth.terminal_sign_in_enabled --kill-switch --all-envs`). Seam: one
resolver, `isTerminalSignInEnabled()` in `lib/flags.ts`, read by the new sign-in buttons, `/cli/connect` and the
device endpoints. Killed: the buttons don't render, `/cli/connect` and the device endpoints answer 404, `gf login`
falls back to the paste prompt; password sign-in and token paste untouched. Server-side only. Connector writes keep
their existing switch (`isConnectorWritesEnabled`). Activation check: `gf flags get auth.terminal_sign_in_enabled`
shows `on` in every env.

## Deploy order
1. Day one, owed by Daniel: Google Cloud OAuth client and consent screen, a GitHub OAuth app, both providers and the
   redirect URLs in Supabase for preview and production.
2. Sprint 1 (low risk, no data): merge on green.
3. Sprint 2: the device-code migration applied first (expand-only, AGENTS rule #4), then the web change with the flag
   created on, then the CLI release. Old CLIs keep working (paste). High risk: Daniel merges.
4. Sprint 3: the connector migration first (a nullable person column; existing URLs stay project-only and
   read-only), then the route and Setup change. High risk: Daniel merges.
5. The skills repo release for S1.2 and S2.3 follows `skills/RELEASING.md`.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] **Kill-switch (only if one was planned at grooming — Stage 6b):** the flag slice shipped, the flag
      exists **in Golden Frijoles, in every env**, with the stated polarity, **and is ACTIVATED there** —
      `gf flags get <key>` must not print `—` in its PRODUCTION row. Creating a definition is not
      turning it on, and a flag that is synced but never activated serves compile-time defaults while
      every dashboard says it exists. *Verify-only — not a new gate; whether a high-risk epic needs one
      is decided at grooming, not here.*
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
