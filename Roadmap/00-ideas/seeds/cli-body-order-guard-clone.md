---
title: "The CLI body-order guard misses req.clone().json()"
slug: cli-body-order-guard-clone
status: scaffolded
area: "09"
type: chore
appetite: S
underwritten_by: wave-backfill
risk: low
epic: "09-platform-infra/cli-think-skills-followups"
build_order: 57
consolidated_into: north-star-dry-run-sendable   # groomed together 2026-10-03; one epic (CLI surface)
updated: 2026-10-03
---

# Seed: the CLI body-order guard misses req.clone().json()

> **Consolidated 2026-10-03 into [`north-star-dry-run-sendable`](north-star-dry-run-sendable.md).** Daniel's call at
> grooming ("two tiny epics by surface"): this and the dry-run verdict both came from #216's review round 2 and both
> are about the CLI surface. That pitch carries the scope and acceptance; this seed is kept for the record.

Found by `think-skills` (#216, fresh pr-reviewer round 2).

## Problem

Every CLI POST route now reads its body through `readCliBody` (`apps/web/lib/cli-auth.ts`). That helper checks
`CLI_WRITE_API_ENABLED` first, so with the gate OFF every request gets the same 404. `apps/web/lib/cli-body-order.test.ts`
pins this structurally, but its regex only matches `req.json()` / `request.json()` directly. Three things get past it:
- `req.clone().json()`, which the reviewer tried in a scratch copy and saw stay green;
- a handler parameter with another name;
- reading `req.body` directly.

Any of those reintroduces the gate-off 400 the guard exists to prevent.

## Sketch

- Widen the check to any `.json(` / `.text(` / `.formData(` / `.arrayBuffer(` / `.body` reached from the handler's
  first parameter, whatever it's called (parse the `export async function POST(<name>` signature). Or forbid those
  calls in `app/api/v1/cli/**` outright.
- Add a fixture that must fire for each form (the clone, a renamed parameter, `.body`), and one that must not.

## Acceptance (draft)

- A route file containing `req.clone().json()` or `(r: NextRequest) … r.json()` turns the test red. The current six
  routes stay green.
