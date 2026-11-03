# Off Vercel: production on our own box — Retrospective

_Closed: 2026-11-02_
_Intent: yes_
_Quote vs actual: $15–33 (M, n=27, p25–p75) → ≈$32.57 (−1% vs the quote's top)_
_Crew (actual): claude-opus-5-5 ≈$32.57 (orchestrated and built everything) · reviewers: the fresh verifier (2 rounds on #444, 2 on #446), Codex gpt-5.6-luna xhigh (1 on #444, 4 on #446), Mistral Vibe security (clean on both; agy was blocked on its version pin) · prose: the builder — the plan routed S1 to Sonnet builders; S2/S3 needed live VM access, and S1 was small enough that a cold builder would have cost more than it saved._

## What shipped
- **S1 · Portable build** (#444, `0897040`): `lib/deploy-env.ts` declares production (`DEPLOY_ENV`, Vercel's own
  variable only on Vercel); all eleven readers route through it, a guard refuses new ones. A standalone Docker image,
  booted against a seeded database in CI (container-smoke) with a canary proving no env file reaches a layer.
- **S2 · The box and the pipeline** (#446, `f8595a8`): golden-frijoles as a tenant of the shared Oracle VM under its
  own contract (compose, a site file on the shared proxy, Origin CA cert, Authenticated Origin Pulls); `deploy.yml`
  builds arm64 natively, boots it under the cap, and waits on the live `x-gf-revision` + `x-gf-site`; the VM's timer
  pulls by digest, health-checks, rolls back and skips a failed digest.
- **S3 · Cutover and the rules** (this PR): zone origin pulls + strict SSL, then DNS to the VM; production smoke green;
  a dispatched deploy proved the pipeline end to end (Deployment success). AGENTS rule #4 and Workflow, WAYS-OF-WORKING
  and LEARNINGS rewritten.
- goldenfrijoles.com back online on 2026-11-02 after three days of 402.

## What went well
- **The lock disproved scope twice before anyone built it** (the `*_ENABLED` override and the webhook carve-out off
  Vercel), and the re-lock against the VM's tenant contract replaced two of the plan's own decisions (tunnel → shared
  proxy, push → pull) instead of building around them.
- **CI caught the one bug that would have shipped broken**: the image 500'd every session read; only the
  container-smoke job, with a seeded database, exercised that path.
- **The fresh verifier earned its keep every round**: the runtime env, a branch-dispatch path to production, the
  spoofable client IP, a re-try loop that would have stopped the good container every two minutes.

## What we learned
Promoted to LEARNINGS ("Leaving a platform, and what it had been deciding for you"): grep every "am I production?"
before leaving a platform; boot the real image against a real database in CI; a trusted header is only as trustworthy
as the path to the proxy; `GITHUB_TOKEN` events start no workflow; a pull deploy is proved only by what the live site
says. Local, not promoted: zsh does not word-split `$VAR`, which broke two shell one-liners mid-cutover (no harm, both
caught before any write).

## Gaps / follow-ups
- ✅ Owed to Daniel: confirm the delivery waker's calls after the cutover are 2xx (`net._http_response`). — done: 200 every tick after propagation
- ✅ Owed to Daniel: the signed-in browser smoke on goldenfrijoles.com — Daniel signed in, 2026-11-02.
- ✅ Owed to Daniel: disconnect the Vercel Git integration for `golden-beans` — disconnected 2026-11-02.
- Owed to Daniel: delete the paused `golden-beans` Vercel project after a quiet week (from 2026-11-09).
- ✅ Owed to Daniel: the `_Intent:_` word above — yes, 2026-11-02.
- Owed to Daniel: a password-manager copy of the VM's `web.env` (including the
  `SELF_SUBJECT_SECRET` generated on the VM).
- ✅ A row for golden-frijoles in the VM's private tenant table — merged in that repo's own PR.
- Three scenario-drill secrets are blank on the VM: drills stay off until they are minted.
- The same playbook for despachobonsai and panfleto.com.mx (their own repos); Coolify previews were left out on purpose.
