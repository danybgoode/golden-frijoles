---
title: "Agent-legible horizon and docs"
slug: agent-legible-horizon
status: scaffolded
area: "02-commercial"
type: feature
appetite: S
risk: high
updated: 2026-10-14
intent_ask: verbatim
hypothesis: null
persona: "A founder's coding agent (Claude Code, Codex) setting up or debugging a product without a browser."
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
underwritten_by: wave-2026-10
build_order: 85
epic: "02-commercial/agent-legible-horizon"
---

# Pitch — Agent-legible horizon and docs

## The ask, as given

> [the other agent] "I could not verify or diagnose Horizon through the available headless tools. Neither the pinned nor
> newer CLI exposes a Horizon read or sync command, the available MCP tools do not expose one, and a headless request
> redirects to login. … I need Golden Frijoles' documented authenticated CLI, MCP, or API path for reading Horizon."
>
> "we dont have instructions to setup the mcp on codex so lets add that as well or a dedicated docs which would be
> helpful for agents when debugging" — and the login line "Product: aomx" read as if login had picked the product.
>
> Approved 2026-10-14: all four parts (horizon read headless, Codex MCP docs, one agent debugging doc, login wording).

## Problem
After many-products, a product's horizon is data in its roadmap artifact, but an agent can only see it in a browser. No
`frijoles` command, no MCP tool and no unauthenticated route reads it, and nothing checks `Roadmap/horizon.md` +
`destination:` before a push. The Codex connector command exists only on the signed-in Connect page; the docs agents
fetch (`install.md`, `llms.txt`) never mention Codex. And `frijoles login` prints a remembered product as if it chose it.

## Appetite
S — one sprint, no migration.

## Scope
**In:** `frijoles horizon [--project]` over a member-gated CLI route; a `get_horizon` MCP connector tool; `roadmap-push
--dry-run` printing the horizon it would send; Codex MCP setup in `install.md` + `llms.txt`; one agent debugging page
listing each feature's headless read / change / check path and common errors; login says where the product came from.
**Out:** editing destinations from the CLI or console (they're repo-declared); a portfolio-wide horizon.
