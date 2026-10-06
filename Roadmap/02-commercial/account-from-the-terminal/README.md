---
status: shipped   # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Shipped                   # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
locked_at: "2026-10-06T13:44:02Z"
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
actual_usd: 55.44
actual_mtok: 204.1
actual_basis: "this machine · 2026-10-06 · 1 session · prices 2026-10-02"
---

# Epic: Account from the terminal ✅

> **Shipped 2026-10-06** — #277 (S1, `59dfa26`), #280 (S2, `0959d9f`), #282 (S3, `ff29242`); side fix #278. Plugin + kit
> 0.29.0–0.30.0, CLI 0.5.0, migrations `20261006100000` + `20261006110000` applied before their merges. See RETROSPECTIVE.md.

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

## Architecture lock (2026-10-06, verified against live code before any builder started)

**Amendment — Daniel, 2026-10-06 (scope corrected out loud).** At kickoff Daniel offered Clerk (app "Golden
Frijoles", dev + prod instances already created) as the sign-in provider. The lock found: every signed-in surface reads
the user through ONE Supabase seam (`getSessionUser()`, `lib/supabase-auth.ts`), every `project_members`,
`workspace_members` and `cli_tokens` row keys on `auth.users(id)`, and the Clerk prod instance's domain
(`clerk.goldenfrijoles.com`, DNS on Cloudflare) has no records yet. Put as an either/or, Daniel chose **Supabase's own
Google provider** (no bridge route, no second identity system, no DNS) over a Clerk front door. **Clerk is not used by
this epic.** He also chose **Google only**: "Continue with GitHub" and "Email me a sign-in link" are cut to named
follow-ups (S2.1 below is Google + the flag). Password sign-in and token paste stay, as scoped.

**Live data the lock could NOT read.** Production row counts (`connector_tokens`, `cli_tokens`, `auth.identities`) were
refused by the auto-mode classifier ("Production Reads") and were not pursued. They do not decide anything here: both
migrations are additive (one new table, nullable columns), which is free at any row count. Read live: `gf flags ls` on
`golden-beans` → **no flags at all** (this is the app's first flag in its own catalog); `vercel env ls production` →
no Clerk or Google variables, `SUPABASE_*` and `CONNECTOR_WRITES_ENABLED` present (Production-only, so previews have no
database — `site-url-callers.test.ts` header).

### Decisions (the builders cite these; nothing below is restated elsewhere)
- **D1 — `install.md` is a route, generated (S1.1).** `app/install.md/route.ts`, `text/markdown; charset=utf-8`,
  `force-dynamic`, built by a pure `installManifest(siteUrl)` in `lib/install-manifest.ts` from the constants in
  `lib/cli-install.ts` and `lib/install-prompt.ts` — never a hand-typed command. **Corrected at review (PR #277,
  fresh reviewer):** raw.githubusercontent.com is NOT contacted by any install path and is dropped; the list is
  github.com (download + Claude Code's marketplace auto-update), registry.npmjs.org, and — `npx skills` only —
  api.github.com and add-skill.vercel.sh (that tool's own telemetry, opt-out `DISABLE_TELEMETRY=1`), plus the site
  origin (this page, then only with an account). "What changes" names the `~/.claude` settings/marketplace entries,
  the plugin hook's `.golden-frijoles/` folder and transcript reads, and `gf init`'s `.gitignore` edit.
- **D2 — The prompt becomes `installPrompt(siteUrl)` (S1.2).** It names `<site>/install.md`, so it is a function of
  `getSiteUrl()` (AGENTS rule #5) and `INSTALL_PROMPT` is deleted. Classified `informational` in
  `site-url-callers.test.ts`. The skills transcription (`skills/template/scripts/lib/golden-onboarding.mjs`, README,
  umbrella SKILL.md) carries `installPrompt('https://goldenfrijoles.com')` — the production URL, never a preview.
  **The cross-repo weld moves into this repo's test:** `install-prompt.test.ts` reads the transcription off disk
  (`skills/` is in this monorepo) and asserts equality with `installPrompt(PRODUCTION_SITE_URL)`; the skills repo's own
  `check-onboarding-parity.mjs` keeps checking its surfaces against its transcription, unchanged.
- **D3 — The hero is one line + the copy box (S1.3).** `MakerHero` only; every other landing section byte-identical.
- **D4 — Google through Supabase, from the browser (S2.1).** `signInWithOAuth({ provider: 'google', options: {
  redirectTo } })` on the existing browser client; `redirectTo = <siteUrl>/auth/callback?next=<guarded path>`, with
  `siteUrl` handed down from the server page (`getSiteUrl()`, never `window.location`). The return is the EXISTING
  `/auth/callback` code exchange + `provisionTenantForUser` — no new callback. Account linking is Supabase's automatic
  linking of a verified email to the existing user (password account + Google on the same address = same `auth.users`
  row); nothing in this repo links accounts. `/login` shows the button whenever the flag is on; `/signup` only when
  `isSignupEnabled()` too. With signup off, a new Google identity still creates a projectless `auth.users` row (as
  Supabase's own `signUp()` already allows with the anon key) — it gets no tenant, since provisioning stays gated.
- **D5 — The flag lives in Golden Frijoles and the app reads its OWN catalog in-process (S2.1).**
  `auth.terminal_sign_in_enabled` in project `golden-beans` (`SELF_PROJECT_SLUG`), kill switch, born ON, created
  with `gf flags create … --kill-switch --all-envs`. Seam: `isTerminalSignInEnabled(): Promise<boolean>` in
  `lib/terminal-sign-in-flag.ts` (server-only; `lib/flags.ts` stays sync env gates). It reads
  `getFlagRegistryView(selfProjectId)` → `toCliFlagView` and is **killed only when the deployment's environment
  (`VERCEL_ENV` → production/preview, else development) serves `false`**. Absent flag, `off`/`never` activation, an
  unreadable row or any read error ⇒ `true` (the born-ON literal default — the SDK's own fallback rule), logged.
  Module-level 30 s cache (one global, non-tenant boolean; safe to share across requests). **No circularity:** the read
  is service-role and needs no sign-in. A kill reaches running functions within 30 s, no redeploy. ⚠️ **Kill with
  `gf flags kill` (serves `false`), never by deactivating:** a deactivated environment serves nothing, which this rule
  — like the SDK — reads as the born-ON literal (fresh reviewer, PR #280).
- **D6 — Device codes: a new table, the token minted at poll time (S2.2).** Migration
  `cli_device_codes(id, device_code_hash UNIQUE sha256, user_code UNIQUE, label, status pending|approved|denied|consumed,
  user_id → auth.users ON DELETE CASCADE, created_at, expires_at = +10 min, decided_at, consumed_at)` (built: `decided_at`
  covers approve AND deny), RLS on,
  service-role only (the `cli_tokens` grant shape). **Deviation from the seed:** the scope said "the minted token handed
  out once" (stored); instead NO token is stored — the poll that wins an atomic `UPDATE … SET status='consumed' WHERE
  status='approved' AND expires_at > now() RETURNING user_id, label` mints with `mintCliToken` and returns it once. The
  device code (secret, 32 bytes, CLI-held) only ever exists hashed; the user code (`XXXX-XXXX`, 8 of a 32-letter
  alphabet with no 0/O/1/I) is the display handle and grants nothing without a signed-in confirm.
- **D7 — Device endpoints (S2.2).** `POST /api/v1/cli/device` (start: `{label}` → `{deviceCode, userCode,
  verificationUrl, expiresIn, interval}`) and `POST /api/v1/cli/device/token` (poll: `{deviceCode}` → `ok {status:
  'pending'|'slow_down'}` · `ok {status:'approved', token}` (built without `account`: the CLI's own whoami probe names the account) · `cliError('not_found', …, {reason:
  'expired'|'used'|'denied'|'unknown'})`). Both check `isTerminalSignInEnabled()` AND `isCliWriteApiEnabled()` **before
  reading the body** (LEARNINGS: a kill switch comes before the body) and answer the uniform 404 `disabled` when off.
  Rate-limited through `lib/rate-limit.ts`: start per IP, poll per device code (interval 5 s ⇒ `slow_down`).
  `verificationUrl` from `getSiteUrl()` (`informational` in the caller registry: it lives 10 minutes).
- **D8 — `/cli/connect?code=` confirms, signed in (S2.2).** Signed out: Continue with Google (D4) and a password link to
  `/login?next=…`; `LoginForm` gains a `next` honoured through `safeRedirectPath` (pure, usable client-side). Signed
  in: the code, the device label, "Same code as your terminal?" → Confirm / "Not mine". Confirm is a Server Action:
  `UPDATE … SET status='approved', user_id=<session user> WHERE user_code=$1 AND status='pending' AND expires_at >
  now()`. Copy: "Didn't start this from your terminal? Close this page. Nothing happens." Flag killed ⇒ `notFound()`.
  `/auth/callback` honours a `/cli/connect` `next` even when it just provisioned a tenant (otherwise a brand-new Google
  user lands on onboarding and loses the code).
- **D9 — `gf login` with no token tries the browser first (S2.2).** TTY, no `--token`, nothing piped, no
  `GOLDEN_FRIJOLES_TOKEN`: start → print the code + URL → open the browser (`open`/`xdg-open`/`start`, no dependency;
  a failure just prints the URL) → poll → save through `credentials.ts` → print `whoami`. Start answering 404/`disabled`
  or a network error ⇒ the paste prompt, as today. `--token`, piping and `--json` are untouched. CLI minor release;
  npm publish is Daniel's 2FA step.
- **D10 — The account question is Q4 reworded (S2.3).** `skills/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md`
  only; the `project.account` key and its values (`later · now`) are unchanged so no config migration exists.
- **D11 — A connector URL can carry its maker (S3.1).** Migration: `connector_tokens.created_by uuid NULL REFERENCES
  auth.users ON DELETE SET NULL` + `last_used_at timestamptz NULL`. `mintConnectorToken(projectId, createdBy)` stamps
  the signed-in owner. In the route, with NO Bearer header, a URL whose `created_by` is set yields the existing
  `flagWriteActor` iff `isConnectorWritesEnabled() && isCliWriteApiEnabled()` and `created_by` is STILL an owner of the
  URL's project (`getMembershipByProjectId`, re-resolved per request — removed ⇒ read-only). Writes go through the
  existing flag tools and RPCs, so history records that user id. **Scope corrected:** flag writes only — the task write
  tools stay behind their `agent_write` key (their staging layer binds to a key id; the acceptance names flags only).
  Pre-existing URLs (`created_by` NULL) are unchanged: read-only.
  **Corrected at build (S3.1, scope corrected out loud):** the public `/install` page serves the DEMO project's URL
  (AGENTS rule #2), so a demo URL must never act as anyone, whoever rotates it. `makerToStamp` (`lib/connector-maker.ts`)
  never stamps a maker on `DEMO_PROJECT_SLUG`, and the route's `makerMayWrite` ignores one there anyway (an e2e
  stamps a maker on the demo URL and asserts read-only). CI's gate env had `CONNECTOR_WRITES_ENABLED` absent while
  production has it ON; `ci/gates.on.env` now matches production so the lit path is tested.
  **Decided at review (PR #282): one URL per project, so co-owners share it — and it acts as its MAKER.** An owner
  B who uses owner A's URL acts with A's identity in `flag_lifecycle_audit`. Accepted: B gains no authority (every
  owner already holds the same flag rights), the page names whose URL it is ("as you" / "as the owner who made it"),
  and "Get a new URL" re-stamps it to whoever presses it. The plaintext URL is OWNER-only everywhere it renders
  (Setup › Connect, and since this review the onboarding page too — a member could otherwise copy a write
  credential). With writes on in CI, "connector on, writes off" exists on no test server, so that branch is pinned
  in `lib/connector-maker.test.ts` (rule + a structural check on the route).
- **D12 — "Turns green when first used" is `last_used_at` (S3.2).** Touched on resolve, throttled to once a minute
  (the `touchCliToken` shape). Setup › Connections composes the existing connect + CLI managers; Disconnect =
  `revokeCliToken`, Get a new URL = a new `rotateConnectorAction` (revoke, then mint; owner-only, connector-gated).

### Routing
The architect builds every story in place (auth, migrations and a credential path are never delegated); S1 is low risk
but shares `site-url-callers.test.ts` with S2. Reviews: `review-route.mjs` + the mandatory fresh `pr-reviewer` per PR.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 `install.md`: what it installs, changes and contacts | low |
| 1 | S1.2 The prompt reads first and waits | low |
| 1 | S1.3 The landing hero in one line | low |
| 2 | S2.1 Google sign-in, and the flag (GitHub + email link cut 2026-10-06, see the lock) | high |
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
1. Owed by Daniel before S2 can be smoke-tested (amended 2026-10-06, Google only): a Google Cloud OAuth client (web)
   with authorized redirect URI `https://slweidgffcfndnskcskc.supabase.co/auth/v1/callback` and its consent screen;
   its client id + secret in Supabase › Authentication › Providers › Google; `https://goldenfrijoles.com/auth/callback**`
   in Supabase › Authentication › URL Configuration › Redirect URLs.
2. Sprint 1 (low risk, no data): merge on green.
3. Sprint 2: the device-code migration applied first (expand-only, AGENTS rule #4), then the web change with the flag
   created on, then the CLI release. Old CLIs keep working (paste). High risk: Daniel merges.
4. Sprint 3: the connector migration first (a nullable person column; existing URLs stay project-only and
   read-only), then the route and Setup change. High risk: Daniel merges.
5. The skills repo release for S1.2 and S2.3 follows `skills/RELEASING.md`.

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
