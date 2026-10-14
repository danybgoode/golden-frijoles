---
epic: agent-legible-horizon
sprint: 1
title: "Read it headless, and say so"
risk: high
phase: Shaping
stories_total: 5
stories:
  - id: S1.1
    title: "frijoles horizon reads it headless"
    as_a: "a founder's agent"
    i_want: "to read a product's horizon from the terminal"
    so_that: "it can check a horizon without a browser"
    risk: high
    status: planned
  - id: S1.2
    title: "The connector has get_horizon"
    as_a: "a founder's agent connected over MCP"
    i_want: "a get_horizon tool"
    so_that: "the horizon is readable wherever the funnel is"
    risk: high
    status: planned
  - id: S1.3
    title: "Codex MCP setup in the docs agents read"
    as_a: "a founder using Codex"
    i_want: "the codex mcp add step in install.md and llms.txt"
    so_that: "Codex connects without the signed-in page"
    risk: low
    status: planned
  - id: S1.4
    title: "One page for agents debugging"
    as_a: "a founder's agent"
    i_want: "one page naming every headless read, change and check path"
    so_that: "it can debug without guessing"
    risk: low
    status: planned
  - id: S1.5
    title: "Login says where the product came from"
    as_a: "a founder"
    i_want: "login to say why a product is active"
    so_that: "a remembered product isn't read as a choice"
    risk: low
    status: planned
---
# Agent-legible horizon and docs — Sprint 1: Read it headless, and say so

**Status:** ⬜ not started

## Stories
<!-- One block per story. Thinnest shippable slice first.
     Each story ALSO has an entry in the frontmatter `stories:` list above — that entry is what tools
     read (the build view, build-state.mjs); the prose below is what people read. Add both, and keep
     `stories_total` (here and in the epic README) equal to the number of entries.
     Story `status:` is planned | in-progress | done. The sprint's `phase:` is the executive ladder
     (Shaping | Locking architecture | Building | Verifying | In review | Shipped), WRITTEN at each
     cadence event. Name the story in each commit subject (`S1.1 …`): that is how the build view
     knows which story is in flight.
     Keep the heading shape `### Story 1.M — <title>` (this is what the status board counts).
     When a story ships, append ✅ + its commit ref to the heading, e.g.
       ## Build contract (locked by the architect before the builder started)
Cites the epic README's Architecture lock. 1.1 → D1, D2 · 1.2 → D3 · 1.3 → D5 · 1.4 → D4, D6 · 1.5 → D7.

### Story 1.1 — `frijoles horizon` reads it headless
**As a** founder's agent, **I want** to read a product's horizon from the terminal, **so that** it can check a horizon without a browser.
**Acceptance:** `frijoles horizon` (bound repo) or `--project <slug>` prints each destination with lit / partly lit / on
the way and its epics; a product with no horizon prints how to declare one; a non-member gets the uniform not-found.
**Risk:** high (a new CLI route on the auth seam)

### Story 1.2 — The connector has `get_horizon`
**As a** founder's agent connected over MCP, **I want** a `get_horizon` tool, **so that** the horizon is readable wherever the funnel is.
**Acceptance:** `tools/list` names `get_horizon`; it returns the D1 payload for the token's own product only.
**Risk:** high (connector surface)

### Story 1.3 — Codex MCP setup in the docs agents read
**As a** founder using Codex, **I want** the `codex mcp add` step in install.md and llms.txt, **so that** Codex connects without the signed-in page.
**Acceptance:** both files show the command with a placeholder URL and say where the URL comes from.
**Risk:** low

### Story 1.4 — One page for agents debugging
**As a** founder's agent, **I want** one page naming every headless read, change and check path, **so that** it can debug without guessing.
**Acceptance:** `/agents.md` serves; `llms.txt` links it; the guard test fails when a named command/tool doesn't exist
or an existing one isn't named.
**Risk:** low

### Story 1.5 — Login says where the product came from
**As a** founder, **I want** login to say why a product is active, **so that** a remembered product isn't read as a choice.
**Acceptance:** a kept product prints "(remembered on this machine; a repo's golden-frijoles.config.json overrides it)";
the only product prints "(your only product)".
**Risk:** low

## Sprint QA
- **api spec(s):** `e2e/cli-horizon.spec.ts` (member / non-member / empty / pushed), the connector tools/list spec, the agents.md guard (unit), CLI goldens
- **browser smoke owed:** no
- **deterministic gate:** `tsc --noEmit` + `npm run build` + Playwright `api` green before merge

## Sprint 1 — Smoke walkthrough (do these in order)
Env: production · https://goldenfrijoles.com

1. In a repo bound to a product, run `npx -y @golden-frijoles/cli@<new version> horizon`.
   → One line per destination with its status and epics, or "No destinations yet…" naming Roadmap/horizon.md.
2. Run `… horizon --project golden-frijoles --json`.
   → Six destinations, all `lit`.
3. In an agent connected over MCP, call `get_horizon`.
   → The same destinations for that connector's product.
4. Go to https://goldenfrijoles.com/install.md and https://goldenfrijoles.com/agents.md
   → The Codex `codex mcp add` step; the per-feature headless paths.
5. Run `… login` on a machine that already remembers a product.
   → "Product: <slug> (remembered on this machine; …)".
