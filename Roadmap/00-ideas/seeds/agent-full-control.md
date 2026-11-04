---
title: "Agent full control: every project, every verb, keys that do not silently expire"
slug: agent-full-control
status: raw
area: "09"
type: feature
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-11-04
intent_ask: verbatim
hypothesis: null
---

# Raw seed — Agent full control

## Intent (Daniel, 2026-11-04, verbatim)

> "everything must be manageable by agents, in full, delete, update, create, everything"
> "the cli should allow to have portfolio access, meaning access to all projects in the account of golden-frijoles
> … the whole point of that project is that it is fully operable by an agent and it is not"

## What happened

On 2026-11-04 an agent working on Miyagi Sánchez read flag values through the claude.ai Golden Frijoles connector
and reported Miyagi Sánchez flags as "not defined". The connector is minted for the `golden-frijoles` project
only, so it answered for the wrong project, with no hint that another project existed. The product owner, reading
the report, reasonably concluded that his Golden Frijoles flags might not be reaching his site at all.

## Gaps, checked against the code (`origin/main` 86068a9, CLI 1.5.1)

1. **The MCP connector reaches one project.** `app/api/v1/public/mcp/c/[token]/route.ts` resolves the token to
   one `project_id`, and no tool accepts a project ("a token minted for project A has no way to even ask for
   project B"). That isolation is right for a connector shared with someone else. The owner has no account-wide
   connector, so an agent working in the claude.ai app sees one product out of four.
2. **Flag read keys always expire after 30 days, and nobody chose 30.** `FLAG_KEY_EXPIRY_DAYS = 30`
   (`apps/web/lib/credential-inventory.ts`) was inherited from an old button label, and neither the console nor
   `frijoles keys create` lets the owner choose an expiry. When a key expires, the site falls back to its last
   saved snapshot and stops seeing changes, without telling anyone. Miyagi Sánchez lost flag control this way
   twice (2026-08-27 and 2026-10-22).
3. **The CLI cannot do everything the product can.**
   - No `flags archive` or `flags delete`.
   - `projects delete` and `projects purge` exist as API routes (`api/v1/cli/projects/delete`,
     `projects/purge`) but have no CLI verb.
   - No CLI verb to mint, list or revoke a connector link (`lib/connector-tokens.ts` has `mintConnectorToken` and
     `revokeConnectorToken`; only the console reaches them).
   - Still to audit: segments, experiments (only `experiments decision` exists), journeys, tasks, North Star
     editing, and project rename and settings.
4. **The saved active project is a trap.** `frijoles projects ls` shows `activeProject: aomx` on the owner's
   machine. Any command an agent runs without `--project` acts on aomx. Nothing in the output names the project it
   acted on unless the agent asks.

## Direction (proposal)

- **Owner connector:** an account-scoped connector whose tools take a `project` argument and list the projects
  first. Keep per-project connectors for sharing.
- **Read keys the owner can choose not to expire:** `flag_read` minted with an explicit "never" (read-only, one
  environment, revocable at any time). Keys that can write keep their expiry. Every key shows its expiry in the
  console and warns 7 days before.
- **CLI parity:** every create, update and delete the console offers, the CLI offers too. Add a test that compares
  the console's actions with the CLI's verb table, so a new console action without a verb fails CI.
- **Every write says which project it changed:** the `--json` output and the human output both name the project.

## Open questions for refine

- Should destructive verbs (`projects purge`, `flags delete`) need a confirmation flag, so an agent's typo cannot
  delete a project?
- Does the owner connector need its own audit trail, separate from the CLI's?
