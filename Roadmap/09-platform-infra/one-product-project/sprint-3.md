---
epic: one-product-project
sprint: 3
title: "Move the flags and delete the env vars"
risk: high
phase: Verifying
stories_total: 3
stories:
  - id: S3.1
    title: "17 flags created and activated at today's values"
    as_a: "the product owner"
    i_want: "every env gate as a golden-frijoles flag, activated per env"
    so_that: "gf flags kill is the switch"
    risk: high
    status: done
  - id: S3.2
    title: "Verify on prod, then delete the Vercel env vars"
    as_a: "the product owner"
    i_want: "zero *_ENABLED vars in Vercel"
    so_that: "there is one source of truth"
    risk: high
    status: planned
  - id: S3.3
    title: "The docs say the catalog is the gate"
    as_a: "an agent"
    i_want: "AGENTS, LEARNINGS and the flags comments to say gf flags, not Vercel"
    so_that: "nobody adds an env-var flag again"
    risk: low
    status: done
---
# One product project, and every flag in it — Sprint 3: Move the flags and delete the env vars

**Status:** 🟡 built and reviewed; merge + prod step owed to Daniel (README → Cutover runbook)

## Stories

### Story 3.1 — 17 flags created and activated at today's values
**As** the product owner, **I want** every env gate as a `golden-frijoles` flag, activated per env, **so that**
`gf flags kill` is the switch.
**Acceptance:**
- The six masked values (`DESTINATION_DELIVERY`, `FLAG_RULE_BUILDER`, `FLAG_SERVING`, `RESILIENCE_SCENARIOS`,
  `SECURITY_SIMULATIONS`, `AUTOMATIC_CIRCUIT_BREAKERS`) are read from live behaviour (the route each gates: 404 vs not)
  and written into the epic README's gate table before anything is created. `FLAG_SERVING` must read ON (D2).
- 17 flags are created in `golden-frijoles`, each with its production value activated in production, preview and
  development.
- `gf flags get <key>` shows no `—` in the production row for any of them.
**Risk:** high

### Story 3.2 — Verify on prod, then delete the Vercel env vars
**As** the product owner, **I want** zero `*_ENABLED` vars in Vercel, **so that** there is one source of truth.
**Acceptance:**
- After S2's deploy, each gate's route behaves as before on prod (the same probes as S3.1).
- Kill test: `gf flags kill console.agent_rail_enabled --env production` removes the rail on `/app` within a minute.
  Turning it back on brings the rail back.
- The 18 production vars and 5 preview vars are removed. `vercel env ls | grep _ENABLED` prints only Vercel's own
  `TURBO_DOWNLOAD_LOCAL_ENABLED`.
**Risk:** high

### Story 3.3 — The docs say the catalog is the gate
**As** an agent, **I want** AGENTS, LEARNINGS and the `flags.ts` comments to say `gf flags`, not Vercel, **so that**
nobody adds an env-var flag again.
**Acceptance:** AGENTS rule #4's env paragraph and the "Key env vars → Gates" list are rewritten to the catalog.
LEARNINGS gets the lesson. Grep finds no "set the Vercel variable" instruction for a gate. AGENTS rule #2 and the
Key env vars wording say the public project IS Golden Frijoles' own (not "the demo tenant" / "the self-dogfood
tenant"), and `scripts/cross-review.prompt.md` agrees (fresh review of #318).
**Risk:** low

## Sprint QA
- **api spec(s):** none new (data + docs); the S2 guard stays green
- **browser smoke owed:** yes, to Daniel: the kill test, signed in
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 3 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. In a terminal: `npx -y @golden-frijoles/cli flags ls --project golden-frijoles`
   → 18 flags, none reading "never turned on" in production
2. (signed in, owed to Daniel) `npx -y @golden-frijoles/cli flags kill console.agent_rail_enabled --env production`, then reload https://goldenfrijoles.com/app
   → within a minute, the agent rail is gone
3. Turn it back on (`flags set … on` / the console's switch) and reload
   → the rail is back
4. `vercel env ls production | grep _ENABLED`
   → only TURBO_DOWNLOAD_LOCAL_ENABLED

If any step fails, note the step number + what you saw — that's the bug report.
