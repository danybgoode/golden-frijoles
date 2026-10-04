---
epic: cli-think-skills-followups
sprint: 1
title: "S1 Dry-run verdict as data, and a body-order guard that can fail"
risk: low
phase: Shipped
stories_total: 2
stories:
  - id: S1.1
    title: "The north-star dry run says sendable and blockers (CLI 0.4.1)"
    as_a: "an agent driving gf"
    i_want: "gf north-star set --json to state whether --yes would be accepted, and why not"
    so_that: "I branch on data instead of parsing the human sentence"
    risk: low
    status: done
  - id: S1.2
    title: "The body-order guard catches clone, renamed parameters and .body"
    as_a: "the product owner"
    i_want: "the gate-before-body guard to fail on every way a route can read its body"
    so_that: "a gate-off 400 can't come back unnoticed"
    risk: low
    status: done
---
# CLI follow-ups from think-skills — Sprint 1: S1 Dry-run verdict as data, and a body-order guard that can fail

**Status:** ✅ shipped — merged #265 `86cfbdb` · S1.1 `7e1cc2a` (CLI 0.4.1), S1.2 `4f850d8` + review fixes `0539ecf`, `621dfd0`, `77fe805`. Smoke steps 1–3 run against prod (golden-beans) from the packed 0.4.1 tarball and again from merged `main`, under a real TTY: all pass. Steps 4–5 (npm publish, 2FA) are owed to Daniel.

## Build contract (the architect locks this before the builder starts)
Cite, don't restate: the epic README's **D1–D5**. Verify against live code first: `nextStep`'s two refusal branches
(`north-star.ts:163`) are the complete set of blockers, and every route under `app/api/v1/cli/**` names its handler
parameter in a form D4's parser reads.

## Stories

### Story 1.1 — The north-star dry run says `sendable` and `blockers` (CLI 0.4.1)
**As an** agent driving `gf`, **I want** `gf north-star set --json` to state whether `--yes` would be accepted, and why
not, **so that** I branch on data instead of parsing the human sentence.
**Acceptance:**
- An unfilled template prints `"sendable": false`, `"blockers": [{ "kind": "placeholders", "paths": [...] }]`.
- A file that changes an existing input's value source prints `"sendable": false`,
  `"blockers": [{ "kind": "value-source", "keys": ["<that key>"] }]`.
- A clean file prints `"sendable": true, "blockers": []`.
- The human dry run's last sentence is unchanged for all three cases (rendered from the verdict); `golden.test.ts` is
  unchanged.
- `packages/cli/package.json` is 0.4.1 (the CLI keeps no CHANGELOG; the PR title names the version, as #216 did); `version.test.ts` is green.
**Risk:** low

### Story 1.2 — The body-order guard catches clone, renamed parameters and `.body`
**As the** product owner, **I want** the gate-before-body guard to fail on every way a route can read its body,
**so that** a gate-off 400 can't come back unnoticed.
**Acceptance:**
- `cli-body-order.test.ts` checks the matcher against inline fixtures. These must fire: `req.clone().json()`,
  `(r: NextRequest) => … r.json()`, `request.text()`, `req.body`, `req.blob()`. This must not: a route that calls
  `readCliBody(req)` and returns `NextResponse.json(...)`.
- The real CLI routes still pass, and the existing "readCliBody gates first" test is unchanged.
**Risk:** low

## Sprint QA
- **specs:** `packages/cli/src/cli-write.test.ts` (three verdict cases), `golden.test.ts` (unchanged),
  `apps/web/lib/cli-body-order.test.ts` (fixtures).
- **browser smoke owed:** no.
- **deterministic gate:** `npm run typecheck` + `npm run test:unit` + the CI `api` suite green before merge.
- **release check:** `npm pack` the CLI and run the packed `gf north-star set <fixture> --json` under a real TTY.

## Sprint 1 — Smoke walkthrough (do these in order)
Env: your terminal, signed in (`gf login`) with a project you own linked: the dry run reads that project's current North
Star, and sends nothing. Steps 1–3 use the merged `main` build (`npm run build --workspace=@golden-frijoles/cli`), step 4
is the publish, and step 5 uses the published CLI. ⚠️ `gf` is aliased to `git fetch` on Daniel's machine, so use
`node packages/cli/dist/bin.js` or `npx @golden-frijoles/cli`.

1. `node packages/cli/dist/bin.js north-star set skills/plugins/golden-frijoles/skills/north-star/templates/north-star.md --json`
   → JSON with `"sendable": false` and a `placeholders` blocker listing the `<…>` paths.
2. Copy that template to `/tmp/ns.md`, fill every `<…>` in its `## Sync payload` block with real values, and run the
   same command on `/tmp/ns.md`
   → `"sendable": true, "blockers": []`. If one of your keys already exists with another value source, you get a
   `value-source` blocker naming that key instead.
3. Step 1 without `--json`
   → the same human sentence as before: "Fill in the placeholders first: --yes refuses a file that still has them."
4. **(owed to Daniel by name: npm 2FA)** `cd packages/cli && npm publish`
   → `npm view @golden-frijoles/cli version` prints `0.4.1`.
5. `npx -y @golden-frijoles/cli@0.4.1 north-star set /tmp/ns.md --json`
   → same output as step 2.

If any step fails, note the step number + what you saw — that's the bug report.
