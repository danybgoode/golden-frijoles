// agent-legible-horizon · Sprint 1, Story 1.4 (D4, D6) — `/agents.md`, the one page an agent reads when it
// is debugging: per feature, the headless way to read it, change it and check that it worked.
//
// Static prose on purpose (no site URL, so no `getSiteUrl()` caller): what keeps it honest is
// `agents-md.test.ts`, which reads the CLI's command table and the MCP tool registrations and fails
// when this page names something that does not exist, or when something exists that it does not name.
// Write a command as `frijoles <verb …>` and a tool as `tool_name` in backticks, so the guard can see it.

export const AGENTS_MD = `# Golden Frijoles — for an agent debugging

Every feature below can be read, changed and checked without a browser. For each one: what you want, the
headless way (the \`frijoles\` CLI, an MCP tool on the connector, or an API route), and how to check it worked.
Add \`--json\` to any \`frijoles\` command for a machine-readable answer. If something fails, start at
\`frijoles doctor\` (why is it not working, every check in order), then read "Common errors" at the end.

The CLI is the \`frijoles\` command (\`npx -y @golden-frijoles/cli\` runs it without installing). The MCP tools are
on the connector URL an owner makes under Setup › Connect; they read one product only, the one that URL belongs
to, and take no project argument.

## Account and login

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Sign this machine in | \`frijoles login\` (browser), or pipe a token: \`frijoles login --token <token>\` | \`frijoles whoami\` prints the account, the credential and the products it reaches |
| Sign out | \`frijoles logout\` | \`frijoles whoami\` answers \`unauthorized\` |
| Find out why nothing works | \`frijoles doctor\` | Every check passes; each module line says configured or the command that fixes it |
| Answer the setup questions | \`frijoles setup\`; read or change one answer with \`frijoles config list\`, \`frijoles config get <key>\` and \`frijoles config set <key> <value>\` | \`frijoles config get <key>\` prints the effective value |

## Products and repo binding

| You want | The headless way | Check it worked |
| --- | --- | --- |
| See your products | \`frijoles projects ls\` (API: \`GET /api/v1/cli/projects\`) | The slug is in the list |
| Make a product | \`frijoles projects create <slug>\` (idempotent) | \`frijoles projects ls\` lists it |
| Pick the product for this machine | \`frijoles projects use <slug>\` (a bound repo's own product still wins) | \`frijoles whoami\` shows \`active project: <slug> (remembered on this machine)\` |
| Bind this repo to a product | \`frijoles init --project <slug>\`, or \`frijoles init --create <slug>\` for a new one; it writes \`golden-frijoles.config.json\` | Later commands in this repo print \`Product: <slug> (from this repo's golden-frijoles.config.json)\` |
| Delete a product you own | \`frijoles projects delete <slug> --confirm <slug>\`; the data is kept 30 days, then \`frijoles projects purge <slug> --confirm <slug>\` | \`frijoles projects ls\` no longer lists it |

## Keys

| You want | The headless way | Check it worked |
| --- | --- | --- |
| See every credential that reaches a product | \`frijoles keys ls\` (API: \`GET /api/v1/cli/keys\`) | The key's id and kind are listed |
| Mint a key (the kind and a label are required) | \`frijoles keys create --type ingest --label "my app"\`, or \`--type flag_read --env production --label "my app"\` | The key is printed once; \`frijoles keys ls\` lists it |
| Kill a key | \`frijoles keys revoke <id> --type ingest\` | \`frijoles keys ls\` shows it as \`revoked\`, and the key stops working at once |
| Send the product's events | The SDK (\`createGrowthEngineClient\`) with an ingest key, or \`POST /api/v1/track\` | \`frijoles status\` says events are arriving, with the first and latest event |

## Flags

| You want | The headless way | Check it worked |
| --- | --- | --- |
| List flags and what each environment serves | \`frijoles flags ls\`; MCP \`list_flags\` | The flag and its environments are listed |
| Read one flag | \`frijoles flags get <key>\`; MCP \`get_flag\` | It prints \`on vN\` or \`off vN\` per environment |
| Create a flag | \`frijoles flags create <key> --kill-switch --all-envs\`; MCP \`create_flag\` | \`frijoles flags get <key>\` shows it |
| Change what it serves by default | \`frijoles flags set <key> --value true --env production\`; MCP \`set_flag\` | \`frijoles flags get <key>\` shows the new version |
| Serve it to a percentage | \`frijoles flags rollout <key> --percent 25 --env production\`; MCP \`rollout_flag\` | \`frijoles flags get <key>\` shows the percentage |
| Replace its targeting rules | \`frijoles flags rules <key> --rules-file rules.json --env production\` | \`frijoles flags diff\` shows the change in words |
| Switch it off now (the 3am verb) | \`frijoles flags kill <key> --env production\`; MCP \`kill_flag\` | \`frijoles flags get <key>\` prints \`off vN\` |
| See who changed what | \`frijoles flags history <key>\`, then \`frijoles flags diff <key> --from 3 --to 4\` | Each version has its author |
| Publish a catalog from source control | \`frijoles flags sync --file flags.json --dry-run\`, then the same without \`--dry-run\` and with a flag_sync key (\`--sync-key\` or \`GOLDEN_FRIJOLES_FLAG_SYNC_KEY\`) (API: \`POST /api/v1/flags/sync\`) | \`frijoles flags ls\` shows the catalog |
| Create the flag for a bet from its epic | \`frijoles bet sync <epic README>\` | \`frijoles flags get <flag_key>\` shows it, off until rolled out |

Writes by a person-made connector URL or a \`frijoles\` token run as that person; a read-only URL cannot change a flag.

## Experiments

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Compare variants | MCP \`compare_experiment\` (API: \`GET /api/v1/experiments/<key>/compare\`) | Exposures, conversions, rate and lift per variant |
| Read the recorded decision | \`frijoles experiments decision <key>\`; MCP \`get_experiment_decision\` | The decision and when it was made |
| Read the analysis behind it | MCP \`get_experiment_analysis\` | Effect, interval and sample size |

## North Star

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Read the North Star | MCP \`get_north_star\` (API: \`GET /api/v1/north-star\`) | The metric and its inputs are returned |
| Read an input's values over time | \`frijoles north-star readings <input>\`; MCP \`get_input_readings\` | One reading per period |
| Send a workshop's metric and inputs | \`frijoles north-star set <file>\` (a dry run until you add \`--yes\`) (API: \`POST /api/v1/cli/north-star\`) | The dry run says sendable or lists blockers; then \`get_north_star\` returns it |

## TARS funnel

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Read Targeted, Adopted, Retained | MCP \`get_tars_funnel\` (API: \`GET /api/v1/features/<key>/funnel\`) | The three stages have counts |
| Read a feature's funnel by month or week | \`frijoles funnel <feature-key> --by month\`; MCP \`get_tars_funnel\` with \`by\` (API: \`GET /api/v1/cli/funnel\`) | One row per cohort period; a young one says maturing, an unreadable one says why |
| Define or list a project's segments | \`frijoles segments define <key> --event <e> --min <n> --days <d>\` (owner) · \`frijoles segments ls\` (API: \`/api/v1/cli/segments\`) | Each segment's rule and its share of the last 30 days' active people; a bet names one in \`target_segment:\` |
| Read a journey's cohort | MCP \`get_journey_cohort\` (API: \`GET /api/v1/journeys/<key>/cohort\`) | Cohort periods are returned |
| Check events reach the funnel | \`frijoles status\` | "Events are arriving", with the latest event |

## Scenarios

| You want | The headless way | Check it worked |
| --- | --- | --- |
| List targets, definitions and runs | \`frijoles scenarios ls\`; MCP \`list_scenarios\` | The target or scenario is listed |
| Register or remove a drill target | \`frijoles scenarios targets add <key> --origin <https-origin>\`, then \`frijoles scenarios targets verify <key>\`; remove with \`frijoles scenarios targets revoke <key>\` | Verify says the app answers with the target token |
| Define a drill | \`frijoles scenarios define\` (\`--experiment <key>@<version>\` to compare its impact) | \`frijoles scenarios ls\` shows the new version |
| Run and stop a drill | \`frijoles scenarios launch <scenario-key>\`, \`frijoles scenarios stop <run-id>\` | \`frijoles scenarios runs --watch\` follows it to its end |
| Capture a stopped drill's impact | A stop captures it; retry with \`frijoles scenarios impact <run-id> --capture\` | It answers \`impact: captured\` |

## Roadmap, push and horizon

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Check a push before sending it (no new tool: this is the dry run) | \`npx -y @golden-frijoles/kit roadmap-push --dry-run\` | It prints the JSON it would send (the \`horizon\` key and each epic's \`destinations\` included) and sends nothing; an epic naming an undeclared destination fails here, naming the epic |
| Push the roadmap | \`npx -y @golden-frijoles/kit roadmap-push\` (API: \`POST /api/v1/roadmap/push\`) | \`frijoles horizon\` lists the destinations; the console Plan page shows the epics |
| Read where the product is heading | \`frijoles horizon\`; MCP \`get_horizon\` | One line per destination with its status and epics |
| Read tasks | MCP \`list_tasks\` and \`get_task\` | The task and its state |
| Change a task | MCP \`propose_task_change\`, then \`apply_task_change\` (a project write key; previewed and confirmed first) | \`get_task\` shows the change |

## Outcome report

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Make and push the outcome report | In the product's own repo, with its ingest key (\`GROWTH_ENGINE_API_KEY\`) in \`.env.local\`: \`npx -y @golden-frijoles/kit pod-report --push\` (API: \`POST /api/v1/reports/pod/push\`) | It prints \`✓ pod_report pushed\` |
| Read it | No headless read yet: the console page \`/hub/<product>/report\` (or a share link) | The report renders; with nothing pushed yet it shows the empty state that names this command |

## Connector and MCP

| You want | The headless way | Check it worked |
| --- | --- | --- |
| Connect Claude or Codex to a product | An owner makes the URL under Setup › Connect; in Codex, \`codex mcp add golden-frijoles --url <your connector URL>\` | \`codex mcp list\` shows golden-frijoles, and the tools above answer |
| Stop a leaked URL | "Get a new URL" on Connect revokes the old one for Claude and Codex both | The old URL answers 401 (refused), like any unknown one |
| Read it as a visitor | The public demo project has a connector with the read tools (its drills, \`list_scenarios\`, are members-only) and no person ids | A tool call answers without sign-in |

## Common errors and what they mean

- **\`unauthorized\`** (exit code for a missing or refused credential) — this machine is not signed in, or the token was
  revoked or truncated. Run \`frijoles login\`, then \`frijoles whoami\`. In CI set \`GOLDEN_FRIJOLES_TOKEN\`.
- **\`not_found\`** — you are not a member of that product, or it is the wrong product. A product you cannot see is
  reported as missing, never as forbidden. Run \`frijoles whoami\` to see which products your credential reaches.
- **Acting on the wrong product** — the product is chosen in this order: \`GOLDEN_FRIJOLES_PROJECT\`, this repo's
  \`golden-frijoles.config.json\`, then the one remembered on this machine. A bound repo announces
  \`Product: X (from this repo's golden-frijoles.config.json)\`; login says whether the product is remembered or your
  only one. Pass \`--project <slug>\` to override for one command.
- **No product chosen** — an account with several products picks none. Name one: \`frijoles init --project <slug>\` in
  a repo, or \`frijoles projects use <slug>\` for this machine.
- **The horizon is empty** — nothing has been declared or pushed. Declare \`Roadmap/horizon.md\` with a
  \`destination:\`, check it with \`npx -y @golden-frijoles/kit roadmap-push --dry-run\`, then push it with
  \`npx -y @golden-frijoles/kit roadmap-push\`. \`frijoles horizon\` then lists the destinations.
- **\`frijoles status\` says "waiting for the first event"** — nothing the product sent has arrived. Check the ingest key
  is set where the app runs (\`GROWTH_ENGINE_API_KEY\`), then \`frijoles keys ls\`.
- **A connector answers 401** — the URL was revoked, or was never real. Make a new one under Setup › Connect.
- **A connector answers 404** — the connector is switched off for this deployment; no URL works until it is on.
`
