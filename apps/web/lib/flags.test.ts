// one-product-project · Sprint 2 — the product's gates are wired to the right catalog entries.
//
// The resolution rule is executed in gates-decision.test.ts. This file reads flags.ts as SOURCE, because flags.ts
// imports the seam (lib/gates.ts) without a `.ts` extension, as production code here does, and node's test runner
// cannot load that chain. What it pins is what flags.ts itself decides: which table entry each function reads, and
// which gates each composite requires.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GATES } from './gates-decision.ts'

const source = readFileSync(new URL('./flags.ts', import.meta.url), 'utf8')

function body(name: string): string {
  const start =
    source.indexOf(`export function ${name}(`) + 1 || source.indexOf(`export async function ${name}(`) + 1
  assert.ok(start > 0, `${name} is exported`)
  return source.slice(start, source.indexOf('\n}\n', start))
}

const singles: Record<string, keyof typeof GATES> = {
  isConnectorEnabled: 'connector',
  isSignupEnabled: 'signup',
  isDestinationDeliveryEnabled: 'destinationDelivery',
  isJourneyProjectionsEnabled: 'journeyProjections',
  isExperimentGovernanceEnabled: 'experimentGovernance',
  isExperimentBuilderEnabled: 'experimentBuilder',
  isReportSharesEnabled: 'reportShares',
  isSignalsEnabled: 'signals',
  isConnectorWritesEnabled: 'connectorWrites',
  isFlagDefinitionSyncEnabled: 'flagDefinitionSync',
  isResilienceScenariosEnabled: 'resilienceScenarios',
  isSecuritySimulationsEnabled: 'securitySimulations',
  isAutomaticCircuitBreakersEnabled: 'automaticCircuitBreakers',
  isScenarioAuthoringEnabled: 'scenarioAuthoring',
  isAgentRailEnabled: 'agentRail',
  isFlagRuleBuilderEnabled: 'flagRuleBuilder',
  isFlagConsoleEnabled: 'flagConsole',
}

test('every gate in GATES but terminal sign-in (its own seam) has exactly one function here, reading its own entry', () => {
  assert.deepEqual(
    Object.values(singles).sort(),
    Object.keys(GATES)
      .filter((name) => name !== 'terminalSignIn')
      .sort()
  )
  for (const [fn, gate] of Object.entries(singles)) {
    assert.match(body(fn), new RegExp(`return gate\\(GATES\\.${gate}\\)`), fn)
  }
})

const composites: Record<string, string[]> = {
  isExperimentBuilderWritable: ['isExperimentGovernanceEnabled', 'isExperimentBuilderEnabled'],
  isJourneyMcpToolEnabled: ['isConnectorEnabled', 'isJourneyProjectionsEnabled'],
  isTaskMcpToolEnabled: ['isConnectorEnabled', 'isSignalsEnabled'],
  isConnectorWriteToolEnabled: ['isConnectorEnabled', 'isSignalsEnabled', 'isConnectorWritesEnabled'],
  isExperimentGovernanceMcpToolEnabled: ['isConnectorEnabled', 'isExperimentGovernanceEnabled'],
}

test('each composite ANDs exactly the gates it needs, each one awaited', () => {
  for (const [fn, needs] of Object.entries(composites)) {
    const expression = body(fn).split('return ')[1] ?? ''
    const called = [...expression.matchAll(/\(await (\w+)\(\)\)/g)].map((match) => match[1])
    assert.deepEqual(called, needs, fn)
    assert.equal(expression.split('&&').length, needs.length, `${fn} is a plain AND`)
  }
})

test('the two control-plane gates are retired, not moved (D2), and flags.ts reads no env var', () => {
  assert.doesNotMatch(source, /isFlagServingEnabled|isCliWriteApiEnabled/)
  assert.doesNotMatch(source, /process\.env/)
})
