---
epic: off-vercel-hosting
sprint: 3
title: "Cutover and the rules"
risk: high
phase: Shaping
stories_total: 2
stories:
  - id: S3.1
    title: "DNS cutover and the production smoke"
    as_a: "a visitor, SDK, CLI or connector user of goldenfrijoles.com"
    i_want: "the same domain to answer from the VM"
    so_that: "the product works again without anyone changing a URL"
    risk: high
    status: planned
  - id: S3.2
    title: "The rules say where production lives"
    as_a: "an agent starting a session in this repo"
    i_want: "AGENTS.md, WAYS-OF-WORKING and LEARNINGS to describe the VM deploy, not Vercel"
    so_that: "nobody reaches for Vercel to deploy or fix production"
    risk: high
    status: planned
---
# Off Vercel: production on our own box — Sprint 3: Cutover and the rules

**Status:** ⬜ not started

**Needs Daniel:** the Cloudflare DNS change can be made with the API token in `.env.local`
(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) if its scope covers DNS edit on goldenfrijoles.com; otherwise Daniel
makes it. Disconnecting the Vercel Git integration is Daniel's (dashboard). The rule text is approved in the PR.

## Stories

### Story 3.1 — DNS cutover and the production smoke
**As a** a visitor, SDK, CLI or connector user of goldenfrijoles.com, **I want** the same domain to answer from the
VM, **so that** the product works again without anyone changing a URL.
**Acceptance:**
- Record the current DNS records first (the rollback). Then `goldenfrijoles.com` + `www` → the VM's IP, proxied,
  SSL mode **Full (strict)**.
- Smoke, all from the public domain: the landing renders; sign-in works; `/api/v1/track` accepts an event with a
  **one-use golden-frijoles key** (minted and revoked in the same session — the root `.env.local` self key is Miyagi's);
  the MCP connector answers for a valid token and 404/401s as before; a flag reads as `production`; the pg_cron
  waker's next run (≤ 5 min) reaches `/api/internal/dispatch-deliveries` (delivery log or the function's own log).
- The 🚀 Telegram message for the cutover merge names its SHA.
**Risk:** high (production, auth paths)

### Story 3.2 — The rules say where production lives
**As a** an agent starting a session in this repo, **I want** AGENTS.md, WAYS-OF-WORKING and LEARNINGS to describe the
VM deploy, not Vercel, **so that** nobody reaches for Vercel to deploy or fix production.
**Acceptance:**
- AGENTS.md: the Architecture line, *Workflow (gitflow)*, rule #4 and *Quick-reference / Key env vars* rewritten:
  merge to `main` is the deploy (the `deploy.yml` job); never deploy by hand from a laptop; a var change is an
  edit to the VM's `.env` **plus** a container restart, which the next merge (or `workflow_dispatch`) does; "which
  SHA is live" is still `gh api …/deployments`. Every sibling copy of the old wording found by grep and fixed
  (LEARNINGS: grep for its siblings). **Daniel approves the rule text in the PR.**
- WAYS-OF-WORKING *Shipping a merge* matches; LEARNINGS gains *One Hobby quota, nine projects* (never point CI at a
  metered preview; a shared free quota is a shared outage).
- The Vercel `golden-beans` project: Git integration disconnected (Daniel), project kept until the epic closes as
  the rollback. `standup.mjs` / `vercel-prune` config no longer names it.
- `check-brand-host` still green: the VM's IP appears in no committed file.
**Risk:** high (architecture rule)

## Sprint QA
- **api spec(s):** none new; the S3.1 production smoke is the proof.
- **browser smoke owed:** yes, to Daniel: sign-in on goldenfrijoles.com (auth path).
- **deterministic gate:** CI green; `check-brand-host` green.

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. Go to https://goldenfrijoles.com
   → the landing renders; `curl -sI https://goldenfrijoles.com` shows `server: cloudflare` and no `x-vercel-id` header.
2. (auth — owed to Daniel) Sign in at https://goldenfrijoles.com/login and open https://goldenfrijoles.com/app
   → your products are listed.
3. Run `frijoles flags ls --project golden-frijoles`
   → the flags list, read from the live site.
4. Wait 5 minutes after the cutover, then open the delivery log for golden-frijoles in the console
   → a dispatch run after the cutover time.
5. Open https://goldenfrijoles.com/api/v1/public/… (the live-proof section on the landing)
   → numbers load, as before the outage.

If any step fails, note the step number + what you saw — that's the bug report.
