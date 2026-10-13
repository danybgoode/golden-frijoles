---
title: "One flag switch: on or off, the same in the CLI, the SDK, MCP and the page"
slug: one-flag-switch
status: scaffolded
area: "01"
type: bug
appetite: M
underwritten_by: wave-2026-10
risk: high
epic: "01-growth-engine/one-flag-switch"
build_order: 80
updated: 2026-10-13
intent_ask: verbatim
hypothesis: null
persona: "a founder who owns the product, switching a feature on or off, often through an agent"
grounded: null
grounded_reason: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
intent_match: null
---

# Pitch — One flag switch

Moves · Tests: neither — a bug: the flags page and the CLI disagree about whether a feature is on.

## The ask, as given

> I want to turn on or off features or whatever is covered by a flag by clcicking on or off switch. Thats it. I do not
> want an activated state at all or anything else.

> You must always use the cli, all agents must always use the cli, sdk or mcp. No. We must fix what happened so anyone
> else using the tool always do the same. So if they do a change via cli it is the same on the gui. Always. No
> alternative, no extra state, no activated no, nothing.

### Claims
1. A flag has one switch per environment: on or off. Nothing else is shown.
2. A change made through the CLI, the SDK or MCP is exactly what the page shows, and the reverse.
3. The page switch and the agents' commands change the same thing.
4. No "activated" state, anywhere a person or agent reads.

**Teach-back:** yes — "One switch, on or off; the page and the CLI change and show the same thing." (2026-10-13.)

## Problem

On 2026-10-13 `frijoles flags kill ops.scenario_authoring_enabled` turned drills off in production, and the flags page
still said **On**. Two causes:

- **The page shows activation, not the switch.** Its "On / off" is whether a version is activated in the environment
  (`resolveActivationState`, `lib/flag-list-view.ts`): a flag activated with a `false` default reads "On". 
- **The page's switch and the CLI write different things.** The page activates/deactivates a version
  (`activateFlagAction` / `deactivateFlagAction`); the CLI and MCP write a new version serving on or off
  (`executeCliFlagWrite`: `set`, `kill`). A page "off" removes the flag from the environment (a customer's app then
  falls back to its own literal, which can be on); a CLI "off" serves `false` and the page still says "On".

## Appetite

M — one state, one write path, the list, the feature page and the CLI's view.
quote: $15–32 (M, n=21, p25–p75)

## Bill of materials (What / Why)

| What | Why |
|---|---|
| One pure rule: a boolean flag is On when what it serves is true, else Off | one answer for every surface |
| The page switch writes through `executeCliFlagWrite` (`set` on / `kill` off) | one write path for the page, the CLI and MCP |
| The list and the feature page show On / Off from that rule; no "never", no "activated" | the ask |
| No deactivate control on the page | it is the second "off" |
| A parity spec: CLI off → page Off; page off → CLI serving false | so it never splits again |

## Scope

**In v1:** boolean flags' switch, list, feature page, the page's write path, the CLI's read of the same rule, a parity
spec. Non-boolean flags show the value they serve and have no switch.
**Out of v1 (no-gos):** the database model (activation rows stay underneath, unseen); the SDK snapshot contract; the
gates seam (already reads deactivated as off); rollout/rules editing.

## What already exists (reuse, don't rebuild)

- `lib/cli-flag-write.ts` → `executeCliFlagWrite` (CLI + MCP), `planFlagSet` / `planFlagKill` (`packages/sdk`).
- `lib/flag-list-view.ts`, `lib/flag-environment-view.ts`, `lib/cli-flag-view.ts`, `app/app/flags/[projectSlug]/`.

## Acceptance criteria

- `frijoles flags kill <key> --env production` → the list and the feature page say **Off** for production.
- Clicking the page switch off → `frijoles flags get <key>` shows production serving `false`; on → `true`.
- Neither the list nor the feature page shows "never", "dormant" or "activated".
- A flag activated with a `false` default shows **Off**.

## Open risks / research

- Older data: a flag deactivated from the page before this fix shows Off, which is what the gates already read; golden-frijoles
  has none (CLI read, 2026-10-13).
