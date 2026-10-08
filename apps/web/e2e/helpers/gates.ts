// one-product-project S2.2 — what the server under test serves for each gate, read synchronously in the Playwright
// process so a spec can decide which branch to assert. Same names as lib/flags.ts, which is async now.
//
// The test process never reads the catalog: it answers exactly as the server does off Vercel, which is where every
// e2e server runs — the env override first (ci/gates.*.env set every gate, D6), else the gate's fallback.
import { GATES, envOverride, type Gate } from '../../lib/gates-decision'

const on = (gate: Gate): boolean => envOverride(gate, process.env) ?? gate.fallback

export const isConnectorEnabled = () => on(GATES.connector)
export const isSignupEnabled = () => on(GATES.signup)
export const isJourneyProjectionsEnabled = () => on(GATES.journeyProjections)
export const isExperimentGovernanceEnabled = () => on(GATES.experimentGovernance)
export const isSignalsEnabled = () => on(GATES.signals)
export const isConnectorWritesEnabled = () => on(GATES.connectorWrites)
export const isAgentRailEnabled = () => on(GATES.agentRail)
export const isFlagConsoleEnabled = () => on(GATES.flagConsole)
export const isFlagRuleBuilderEnabled = () => on(GATES.flagRuleBuilder)
export const isScenarioAuthoringEnabled = () => on(GATES.scenarioAuthoring)
export const isJourneyMcpToolEnabled = () => isConnectorEnabled() && isJourneyProjectionsEnabled()
export const isTaskMcpToolEnabled = () => isConnectorEnabled() && isSignalsEnabled()
export const isConnectorWriteToolEnabled = () => isTaskMcpToolEnabled() && isConnectorWritesEnabled()
