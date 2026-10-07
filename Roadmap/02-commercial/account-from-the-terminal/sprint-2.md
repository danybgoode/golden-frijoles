---
epic: account-from-the-terminal
sprint: 2
title: "Sign in from the terminal"
risk: high
phase: Shaping
stories_total: 3
stories:
  - id: S2.1
    title: "Google, GitHub and email-link sign-in, and the flag"
    as_a: "a founder"
    i_want: "to sign in with Google, GitHub or an email link"
    so_that: "I don't make another password"
    risk: high
    status: done
  - id: S2.2
    title: "gf login through the browser"
    as_a: "a founder in my terminal"
    i_want: "gf login to open my browser, show a code and sign me in when I confirm it"
    so_that: "I never copy a token"
    risk: high
    status: done
  - id: S2.3
    title: "The account question, as the Account screen"
    as_a: "a founder running setup"
    i_want: "to hear what an account adds before I'm asked"
    so_that: "I can choose"
    risk: low
    status: done
---
# Account from the terminal — Sprint 2: Sign in from the terminal

**Status:** ✅ shipped 2026-10-06 — PR #280 (`0959d9f`), plugin + kit 0.30.0, CLI 0.5.0

## Build contract (locked by the architect before the builder started — README § Architecture lock)
- S2.1 → **D4** (Google only — the 2026-10-06 amendment cuts GitHub and the email link) + **D5** (the flag).
- S2.2 → **D6** (migration, applied BEFORE merge), **D7** (endpoints), **D8** (`/cli/connect`), **D9** (CLI).
- S2.3 → **D10**.
- Acceptance lines naming GitHub or the email link are void by the amendment; the remaining lines hold.

## Stories
<!-- Keep the heading shape `### Story 2.M — <title>`. When a story ships, append ✅ + its commit ref.
     The epic README frontmatter `status:` is the AUTHORITATIVE epic status. -->

### Story 2.1 — Google, GitHub and email-link sign-in, and the flag ✅ 08fde77 (Google only — the lock's amendment)
**As** a founder, **I want** to sign in with Google, GitHub or an email link, **so that** I don't make another password.
"Continue with Google", "Continue with GitHub" and "Email me a sign-in link" on `/login` and `/signup`, through
Supabase's own providers; the return lands on `/auth/callback`, which already provisions a new account. Password
sign-in stays. Includes the flag: `gf flags create auth.terminal_sign_in_enabled --kill-switch --all-envs` (born ON)
and its one seam, `isTerminalSignInEnabled()` in `lib/flags.ts`, server-side only. If the lock finds the web app
can't read its own flag without depending on its own sign-in, the seam uses the env gate pattern of `SIGNUP_ENABLED`
and the README says so.
**Owed by Daniel, day one:** Google Cloud OAuth client and consent screen, a GitHub OAuth app, both providers and the
redirect URLs in Supabase (preview and production).
**Acceptance:**
- A new person signs up with Google and lands in a provisioned account, as with a password today.
- An existing password account signing in with Google on the same verified email reaches the same account.
- An email link signs in; `next` is still guarded by `safe-redirect`.
- With the flag killed, none of the three buttons render and password sign-in works as before.
- `gf flags get auth.terminal_sign_in_enabled` shows `on` in every env.
**Risk:** high

### Story 2.2 — gf login through the browser ✅ ff5b1be, 52e3ff2, ff00603
**As** a founder in my terminal, **I want** `gf login` to open my browser, show a code and sign me in when I confirm
it, **so that** I never copy a token.
A device-code table (additive migration: code, user code like `KQ7M-3RTX`, status, user, expiry, the minted token
handed out once). `POST` start → user code, link, expiry; the CLI opens `/cli/connect?code=…`; the page (canvas
SignIn frame) signs the person in if needed and asks "Same code as your terminal?"; on confirm the server mints a CLI
token with `mintCliToken` labelled with the device; the CLI polls, saves through `credentials.ts`, prints `whoami`.
Codes live 10 minutes, work once, and both endpoints are rate-limited. `gf login --token` and stdin keep working; with
the flag killed or an older server, `gf login` falls back to the paste prompt.
*Amended 2026-10-05 (canvas First run, frame 6):* after the code matches, the page asks "Let your agent work on your
product?": which agent and device ("Your coding agent and gf, on this Mac", from the CLI's device label); the product,
new and named after the repo (editable) or one you already belong to; "It will be able to": plan, flag and measure for
that product, get a key for your app's events when an epic needs measuring, send you links that open already signed
in; "Your code never comes here"; Allow · Cancel; "Disconnect it any time in Setup". Allow mints the token for that
product, creating it the way `gf init` does (idempotent); Cancel mints nothing. Only products the person belongs to
can be picked.
*As built (2026-10-07, Daniel's calls):* the token is **scoped to the picked product** (`cli_tokens.project_id`,
enforced in `lib/cli-auth.ts` and the connector's write actor; console-minted tokens stay account-wide). The picker
offers **existing products only**, pre-selecting the one named after the repo the CLI reports; a "new product per repo"
would break `projects_one_per_creator_idx`, so a person with no product gets their first one on Allow, the `gf init`
way. "Send you links that open already signed in" is not on the page: no such capability exists yet.
**Acceptance:**
- `gf login` with no token opens the browser, the code matches the terminal, and on confirm the terminal prints who
  you are within a few seconds.
- An expired or used code is refused, and says so in both places.
- "Didn't start this from your terminal? Close this page. Nothing happens." is true: no token is minted without confirm.
- `gf login --token`, piping and `GOLDEN_FRIJOLES_TOKEN` behave as today.
- The approve page names the device, the product (new from the repo name, or an existing one of yours) and what the
  agent will be able to do; Cancel mints nothing; a product you don't belong to can't be chosen.
**Risk:** high

### Story 2.3 — The account question, as the Account screen ✅ 851f840
**As** a founder running setup, **I want** to hear what an account adds before I'm asked, **so that** I can choose.
Setup's Q4 in the golden-frijoles skill, reworded as the canvas Account frame: works on this machine with no account
(planning, coaches, build and review, all in `Roadmap/`); an account adds flags you can roll out and turn off, each
bet measured on its read date, every product in one place, and an outcome report you can send. "Sign in now
(recommended)" runs `gf login` then `gf init`; "Later" carries on and asks again when a bet needs a flag.
**Acceptance:**
- The question reads in four short lines plus the two choices.
- "Later" finishes setup with no account and no error.
- The skill's own checks pass.
**Risk:** low

## Sprint QA
- **api spec(s):** S2.1 → an auth spec on `/auth/callback` for each provider's return and on the flag-killed render;
  S2.2 → pure-logic specs on code expiry, single use and poll states, an api spec on start → confirm → poll, and
  `cli.test.ts` for the fallback; S2.3 → the skill checks.
- **browser smoke owed:** yes, to Daniel by name: Google and GitHub sign-in, and `gf login` on a clean machine. Auth
  steps can't be fully covered by an automated browser.
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge. High risk: Daniel
  merges. Migration applied before the deploy that reads it.

## Sprint 2 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com   (or the preview URL while testing pre-merge)

1. Signed out, go to https://goldenfrijoles.com/signup
   → Continue with Google, Continue with GitHub and Email me a sign-in link, above the password form.
2. (auth — owed to Daniel) Click Continue with Google with a fresh Google account
   → Back on goldenfrijoles.com, signed in, a new account set up.
3. Sign out, go to https://goldenfrijoles.com/login and click Email me a sign-in link
   → The email arrives; its link signs you in.
4. (auth — owed to Daniel) In a terminal on a clean machine, run `npx @golden-frijoles/cli login`
   → The terminal shows a code and opens https://goldenfrijoles.com/cli/connect with the same code.
5. Confirm the code in the browser
   → "Let your agent work on your product?", with this Mac, the product named after the repo and what it will be able to do.
6. Click Allow
   → The terminal prints who you are and the product. The page says you can close it.
7. Run `gf login` again and close the browser without confirming; wait 10 minutes
   → The terminal says the code expired. Nothing was signed in.

If any step fails, note the step number + what you saw — that's the bug report.

**Run 2026-10-06:** step 1 ✅ (agent: production `/login` and `/signup` serve "Continue with Google"). Step 2 ✅ (Daniel,
after fixing Supabase's Site URL + Redirect URLs — the first attempt landed `?code=` on the old vercel domain): a
Google sign-up landed on `/app/onboarding/<new project>`. Step 3 is void (email link cut at the lock). Kill switch:
`gf flags get auth.terminal_sign_in_enabled` → `true v1` in development, preview and production. Steps 4–6
(`gf login` on a clean machine, confirm, expiry) **owed to Daniel** — CLI 0.5.0 is published and both migrations are
applied.
