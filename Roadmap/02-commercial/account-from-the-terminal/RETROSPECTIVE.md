# Account from the terminal — Retrospective

_Closed: 2026-10-06_
_Intent: mostly_
<!-- Did we build what the product owner meant? One word, THEIR answer: yes, mostly or no. Required by `epic-dod` only
     when the epic's seed or README carries a numeric `intent_match:` (intent-match D17); the calibration learns from
     it. Keep the line and leave exactly one of the three words between `_Intent: ` and the closing underscore. -->
_Quote vs actual: $67–144 (L, n=3, p25–p75) → ≈$55.44 (−62% vs the quote's top)_
<!-- The actual is STAMPED, never typed: `node scripts/epic-actuals.mjs --epic <slug> --write` writes actual_* into
     the README (finops S2.5); copy its numbers here. -->

> _Intent_ is provisional ("mostly"), owed to Daniel: GitHub and the email link were cut at the lock, and the Google
> round trip worked end to end only after he fixed Supabase's URL settings. His own answer replaces this word.

## What shipped
- **S1 · Read before installing** — #277 (`59dfa26`), plugin + kit 0.29.0. `GET /install.md` (generated from the
  constants the site renders: what installs, what changes on the machine, which services it contacts — including
  `npx skills`' own telemetry — and how to remove it); the install prompt now reads it first and waits for a
  go-ahead (`installPrompt(getSiteUrl())`, transcribed into the skills repo against the production URL and welded by
  a test); the hero is "Plan, ship and *prove it paid off*" with the prompt beside it.
- **S2 · Sign in from the terminal** — #280 (`0959d9f`), plugin + kit 0.30.0, CLI 0.5.0 (published by Daniel).
  "Continue with Google" through Supabase's own provider (Clerk offered, declined at the lock); `gf login` opens the
  browser, shows a code and signs in on confirm (`cli_device_codes`, every transition one guarded UPDATE in DB time,
  no token stored, every device mint audited); kill switch `auth.terminal_sign_in_enabled`, created and activated in
  Golden Frijoles in all three environments; setup's account question says what an account adds before asking.
- **S3 · The Claude app can change things** — #282 (`ff29242`), migration `20261006110000` applied before merge. A connector URL
  an owner makes acts as them (flag writes, recorded under their id), never the public demo URL; Setup › Connections
  shows whether Claude has used the URL, your signed-in machines with Disconnect, and Get a new URL.
- Side fix #278 (`b64fc7a`), 0.29.1: agy pinned to 1.3.0, and a test fixture that had rewritten the real repo's git
  config from a worktree hook is sealed, with the guard that should have caught it widened.

## What went well
- The lock disproved the plan's central premise before code: Clerk would have meant a second identity system and a
  bridge route; one either/or with the costs stated got a decision in a minute.
- The fresh reviewer earned its place on every PR: three rounds on `install.md` each found a sentence a careful
  founder would have caught us in; on S3 it found the one real authorization defect (a member could copy a URL that
  now writes as an owner), on a file outside the diff that both external passes never saw.
- Mutation checks on the two riskiest new guards (the maker path, the member payload) were run, not claimed.

## What we learned
- **A capability change silently re-classifies every surface that DISPLAYS the old credential.** Making the connector
  URL writable turned the onboarding page's "show the URL to any member" into a privilege leak, in a file the PR never
  touched. When a credential gains power, grep every renderer of it, not only the files you change.
- **"Read-only" claims rot when write paths are added elsewhere.** `llms.txt` said "the connector is read-only" for
  weeks after task and flag writes shipped; the first correction overclaimed the other way. State the boundary as the
  list of write paths and the credential each needs, and point the guard at that list.
- **A trust page is a set of checkable claims.** `install.md` was wrong three times in ways no unit test of its own
  text could see (third-party telemetry, `~/.claude` writes, a 404 link). Its test now holds every named host to one
  list, but completeness can only be checked against the tools themselves.
- **A test fixture can rewrite the repository it runs in.** Under a worktree's pre-push hook git exports `GIT_DIR`,
  which beats `cwd`; an unsealed `git init --bare` flipped `core.bare=true` in the main checkout. The sealing guard
  missed the cwd-first call shape.
- **Supabase falls back to its Site URL, silently, when `redirectTo` isn't allow-listed.** The symptom (a `?code=` on an
  old domain) points at the wrong place.

## Gaps / follow-ups
- **Owed to Daniel:** the sprint walkthroughs on production — S1 steps 4–5 (an agent reading install.md and waiting),
  S2 steps 2 and 4–6 (Google with a fresh account, `gf login` on a clean machine, expiry), S3 steps 2–5 (the Claude app
  turning a flag off, Get a new URL, Disconnect).
- GitHub and email-link sign-in (cut at the lock).
- A default expiry for device-minted CLI tokens; widening the git-fixture guard to `packages/`; an e2e for "a valid
  maker URL plus a foreign Bearer key stays read-only".
- The canvas SignIn frame for `/cli/connect` is not an approved state yet (dated deferral to 2026-12-31).
