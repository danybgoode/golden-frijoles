---
epic: off-vercel-hosting
sprint: 3
title: "Cutover and the rules"
risk: high
phase: Shipped
stories_total: 2
stories:
  - id: S3.1
    title: "DNS cutover and the production smoke"
    as_a: "a visitor, SDK, CLI or connector user of goldenfrijoles.com"
    i_want: "the same domain to answer from the VM"
    so_that: "the product works again without anyone changing a URL"
    risk: high
    status: done
  - id: S3.2
    title: "The rules say where production lives"
    as_a: "an agent starting a session in this repo"
    i_want: "AGENTS.md, WAYS-OF-WORKING and LEARNINGS to describe the VM deploy, not Vercel"
    so_that: "nobody reaches for Vercel to deploy or fix production"
    risk: high
    status: done
---
# Off Vercel: production on our own box — Sprint 3: Cutover and the rules

**Status:** ✅ shipped 2026-11-02. Cutover evidence below; the rules PR is this sprint's.

### Cutover record (2026-11-02, ~23:10 UTC)
- **Rollback record:** `goldenfrijoles.com` and `www` were proxied CNAMEs to the Vercel project's `vercel-dns` target
  (the Vercel project's DNS target is in the project's Vercel domain settings; restore = PUT both records back as
  proxied CNAMEs to it).
- **Order kept:** zone `tls_client_auth` ON and SSL `full` → **`strict`** first; the site still answered from Vercel (402,
  not 525). Then both records → proxied A records to the VM.
- **Smoke (public domain):** `/`, `/llms.txt`, `/login`, `/install.md`, `/hub/golden-frijoles`, `/signup` 200 with
  `x-gf-revision: f8595a8` and no `x-vercel-id` after ~80 s of edge propagation; `/app` 307 → `/login`; `www` 301 →
  apex; rule #2: `/api/v1/public/north-star?project=miyagisanchez` **403**; `frijoles flags ls` reads the live
  catalog; `/api/internal/dispatch-deliveries` 401 without the secret. Neighbours on the VM: 200 throughout.
- **The merge's own Deploy run (41542219589) failed as expected:** it timed out at 23:11 UTC still seeing Vercel's 402,
  before DNS moved (the Production Deployment list shows that `failure` before the `success`).
- **Pipeline end to end:** a dispatched Deploy built + boot-probed arm64, the VM pulled it, the rollout saw
  `x-gf-revision` + `x-gf-site` + 200, and the GitHub Deployment (`github-actions[bot]`) closed as **success**.

**Needs Daniel:** the Cloudflare DNS change can be made with the API token in `.env.local`
(`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) if its scope covers DNS edit on goldenfrijoles.com; otherwise Daniel
makes it. Disconnecting the Vercel Git integration is Daniel's (dashboard). The rule text is approved in the PR.

## Stories

### Story 3.1 — DNS cutover and the production smoke ✅ cutover
**As a** a visitor, SDK, CLI or connector user of goldenfrijoles.com, **I want** the same domain to answer from the
VM, **so that** the product works again without anyone changing a URL.
**Acceptance:**
- **Order matters (S2's origin pulls):** BEFORE the DNS change, turn the zone's Authenticated Origin Pulls
  (`tls_client_auth`) ON and SSL mode to **Full (strict)** (Daniel's yes: a production TLS setting), and prove a
  proxied request still works on the current origin. The VM's site block refuses any TLS client without Cloudflare's
  origin-pull certificate: flipping DNS first would answer every visitor with a 525.
- Record the current DNS records first (the rollback). Then `goldenfrijoles.com` + `www` → the VM's IP, proxied,
  SSL mode **Full (strict)**.
- Smoke, all from the public domain: the landing renders; sign-in works; `/api/v1/track` accepts an event with a
  **one-use golden-frijoles key** (minted and revoked in the same session — the root `.env.local` self key is Miyagi's);
  the MCP connector answers for a valid token and 404/401s as before; a flag reads as `production`; the pg_cron
  waker's next run (≤ 5 min) reaches `/api/internal/dispatch-deliveries` (delivery log or the function's own log).
- The 🚀 Telegram message for the cutover merge names its SHA.
**Risk:** high (production, auth paths)

### Story 3.2 — The rules say where production lives ✅ this PR
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

## Owed
- Owed to Daniel: confirm the delivery waker's calls succeed after the cutover (Supabase → `net._http_response`, the
  rows after 23:10 UTC on 2026-11-02 should be 2xx; agents' production reads are blocked by auto mode).
- Owed to Daniel: the signed-in browser smoke (step 2 below).
- Owed to Daniel: disconnect the Vercel Git integration for `golden-beans` (dashboard → Settings → Git), keeping the
  project until this epic is a week old, so a quota reset cannot deploy a second production.

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
