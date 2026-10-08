// The product's gates. Each one is a flag in Golden Frijoles' own catalog, in the `golden-frijoles` project
// (one-product-project D1/D3), read through the ONE seam, lib/gates.ts. `gf flags kill <key> --env production` is
// the switch: no Vercel variable and no redeploy. The keys, the variables they replaced and each gate's fallback are
// in lib/gates-decision.ts (`GATES`) and the epic README's gate table.
//
// Every function is async because a catalog read is, and every caller awaits it. A bare `isXEnabled()` in a
// condition is a Promise and therefore always truthy, so a forgotten `await` silently opens the gate. The guard in
// lib/gates-guard.test.ts fails CI on any call that is not awaited.
//
// Deliberately NOT `import 'server-only'`: the Playwright process imports these to decide which suites run, and
// there the off-Vercel env override answers without loading the database (lib/gates.ts, D6).
//
// Two gates are gone, not moved (D2). `FLAG_SERVING_ENABLED` gated activation itself, and `CLI_WRITE_API_ENABLED`
// gated the CLI that would turn it back on. Killed through the catalog, either one would have locked the operator
// out of the switch that restores it, so both paths are simply always on. The rollback is `git revert`, and the CLI
// stays the recovery path for every flag below.
//
// Each comment below says what its gate gates. That is the contract worth keeping when a gate's surface changes.

import { gate } from './gates'
import { GATES } from './gates-decision'

/** The MCP connector (commercial-shell 2.1). One of two independent kill switches with the per-project revocable
 * token (AGENTS rule #3): the route must 404 while this is off, whatever the token. */
export function isConnectorEnabled(): Promise<boolean> {
  return gate(GATES.connector)
}

/** Self-serve signup (multi-tenant-activation 2.1): the `/signup` page, `POST /api/v1/public/signup`, tenant
 * provisioning in `/auth/callback`, and the landing's CTA flip. */
export function isSignupEnabled(): Promise<boolean> {
  return gate(GATES.signup)
}

/** The destination dispatcher only (event-destination-router 1.2, lib/delivery-dispatch.ts). Ingest and OUTBOX
 * PERSISTENCE stay active while it is off: turning delivery off must lose no events, only stop them moving. If this
 * is ever read on the /track path, ingest has been coupled to delivery, which is the thing the outbox removes. */
export function isDestinationDeliveryEnabled(): Promise<boolean> {
  return gate(GATES.destinationDelivery)
}

/** Every journey seam (entity-journeys-projections 1.1): definition management, projections, UI/API and MCP reads.
 * Ingest, TARS, experiments and delivery do not read it. */
export function isJourneyProjectionsEnabled(): Promise<boolean> {
  return gate(GATES.journeyProjections)
}

/** Experiment registry/lifecycle management (experiment-governance-v2 S1). Local SDK bucketing, exposure ingest and
 * v1 comparison never consult it: governance must be removable without changing assignment or losing telemetry. */
export function isExperimentGovernanceEnabled(): Promise<boolean> {
  return gate(GATES.experimentGovernance)
}

/** The guided experiment builder (experiments-for-humans D9, A5): the "+ New experiment" dialog's builder content
 * and every builder server action. Off ⇒ the door is drawn blocked with its reason, never hidden. */
export function isExperimentBuilderEnabled(): Promise<boolean> {
  return gate(GATES.experimentBuilder)
}

/** The builder's WRITES need both gates: they write governed experiments, so with governance off the page they live
 * on is gone and so are they (fresh reviewer, PR #170). */
export async function isExperimentBuilderWritable(): Promise<boolean> {
  return (await isExperimentGovernanceEnabled()) && (await isExperimentBuilderEnabled())
}

/** Share links, `/s/<token>` (pod-report 3.1). The one gate whose OFF state protects data from ANONYMOUS readers:
 * while it is off every token 404s, valid, revoked or invented. Revoking a row is the fine-grained kill; the two are
 * independent by design (rule #3's shape). */
export function isReportSharesEnabled(): Promise<boolean> {
  return gate(GATES.reportShares)
}

/** The signals loop (signals-loop 1.0). GATED: grouping into `signals`, friction evaluation, signal→task promotion,
 * the task views, the connector's task READ tools. NOT gated: ingest of a `$error` event and its redaction. A
 * `$error` event is an ordinary event, and a kill switch whose OFF position stored raw credentials would be less safe
 * than its ON position (lib/signals.ts → scrubReservedEventPayload). */
export function isSignalsEnabled(): Promise<boolean> {
  return gate(GATES.signals)
}

/** The staged connector WRITE tools only, claim/resolve/dismiss (signals-loop 1.0): the engine's first public
 * mutation surface. One of three independent kill switches with the project's connector token and the agent_write
 * credential (Amendment 2); none is checked in place of another. */
export function isConnectorWritesEnabled(): Promise<boolean> {
  return gate(GATES.connectorWrites)
}

/** Project catalog registration, `/api/v1/flags/sync` (flag-serving-and-prd-g S4). Separate from serving on
 * purpose: an incident may stop publishers without interrupting the snapshots already being served. */
export function isFlagDefinitionSyncEnabled(): Promise<boolean> {
  return gate(GATES.flagDefinitionSync)
}

/** Resilience scenario execution (flag-serving-and-prd-g). Off stops fault payload delivery but keeps the record
 * needed to understand and safely stop a scenario already created. */
export function isResilienceScenariosEnabled(): Promise<boolean> {
  return gate(GATES.resilienceScenarios)
}

/** The defensive-simulation runner (flag-serving-and-prd-g), separate from resilience scenarios: an owner may allow
 * an internal fault drill without authorizing an active security probe. */
export function isSecuritySimulationsEnabled(): Promise<boolean> {
  return gate(GATES.securitySimulations)
}

/** Automatic breakers' pre-authorized protective transition (flag-serving-and-prd-g). Manual, staged breaker actions
 * stay available while it is off. */
export function isAutomaticCircuitBreakersEnabled(): Promise<boolean> {
  return gate(GATES.automaticCircuitBreakers)
}

/** PM-authored scenario writes (scenarios-pm-operable): create/start/stop/revoke fail before auth or payload work
 * while it is off; evidence stays readable. */
export function isScenarioAuthoringEnabled(): Promise<boolean> {
  return gate(GATES.scenarioAuthoring)
}

/** The agent rail, components/product/AgentRail.tsx, and nothing else (app-shell-and-agent-rail 2.2). It does not
 * gate the section nav, Command Center's stat strip or its funnel. Not a tenancy control: both reads it renders are
 * project-scoped either way. If an agent strip is ever added to Command Center, it MUST check this gate. */
export function isAgentRailEnabled(): Promise<boolean> {
  return gate(GATES.agentRail)
}

/** The visual rule builder, rollout bars, version diff and "preview as a user" on /app/flags/[projectSlug]
 * (flags-visual-rule-builder D6). With it off the page renders as before that epic, textarea included. Not an
 * authorization control: writes resolve ownership through `requireProjectOwnership` either way. */
export function isFlagRuleBuilderEnabled(): Promise<boolean> {
  return gate(GATES.flagRuleBuilder)
}

/** The flag console: its feature list, environment selector, per-feature destination, credentials and
 * lifecycle-audit routes (flags-console-parity D6 + Amendment 1). Off ⇒ the legacy flags page, which keeps every
 * activate/deactivate control. Not an authorization control: membership is resolved server-side either way. */
export function isFlagConsoleEnabled(): Promise<boolean> {
  return gate(GATES.flagConsole)
}

/** Registration predicate for journey-only MCP tools: the connector route enforces its own gate before token
 * resolution, and a journey tool needs BOTH gates. */
export async function isJourneyMcpToolEnabled(): Promise<boolean> {
  return (await isConnectorEnabled()) && (await isJourneyProjectionsEnabled())
}

/** Registration predicate for the task READ tools: the connector gate and the signals seam. */
export async function isTaskMcpToolEnabled(): Promise<boolean> {
  return (await isConnectorEnabled()) && (await isSignalsEnabled())
}

/** Registration predicate for the staged WRITE tools. Deliberately all three gates in one expression rather than
 * delegating to isTaskMcpToolEnabled(): "can this agent mutate?" should be readable in one place. The credential
 * checks (connector token + agent_write key, same project) are enforced separately at call time; a gate decides only
 * whether the tool EXISTS. */
export async function isConnectorWriteToolEnabled(): Promise<boolean> {
  return (await isConnectorEnabled()) && (await isSignalsEnabled()) && (await isConnectorWritesEnabled())
}

/** Governed experiment reads are independently removable while the legacy compare tool stays available. */
export async function isExperimentGovernanceMcpToolEnabled(): Promise<boolean> {
  return (await isConnectorEnabled()) && (await isExperimentGovernanceEnabled())
}
