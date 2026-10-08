// one-product-project · Sprint 2, Story 2.1 — the gate table and the rule that resolves a gate.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GATES, envOverride, flagEnvironmentFor, resolveGate, servedValue, type Gate, type ServedCatalog } from './gates-decision.ts'

const row = (environment: string, serving: unknown, readable = true) => ({ environment, serving, readable })
const catalogOf = (key: string, rows: ReturnType<typeof row>[]): ServedCatalog => new Map([[key, rows]])
const ON: Gate = { key: 'x.on_enabled', envVar: 'X_ON_ENABLED', fallback: true }
const OFF: Gate = { key: 'x.off_enabled', envVar: 'X_OFF_ENABLED', fallback: false }

// D5 — each fallback IS the production value on 2026-10-08 (the epic README's gate table, masked values read from
// live behaviour). Pinned as a literal so changing a fallback is a decision that shows up in review, not a typo.
test('the gate table: 18 gates, their keys, the variables they replaced, and each fallback (D3, D5)', () => {
  const table = Object.values(GATES).map((gate) => [gate.key, gate.envVar, gate.fallback])
  assert.deepEqual(table.sort(), [
    ['auth.signup_enabled', 'SIGNUP_ENABLED', true],
    ['auth.terminal_sign_in_enabled', null, true],
    ['connector.mcp_enabled', 'CONNECTOR_ENABLED', true],
    ['connector.writes_enabled', 'CONNECTOR_WRITES_ENABLED', true],
    ['console.agent_rail_enabled', 'AGENT_RAIL_ENABLED', true],
    ['delivery.destinations_enabled', 'DESTINATION_DELIVERY_ENABLED', false],
    ['experiments.builder_enabled', 'EXPERIMENT_BUILDER_ENABLED', true],
    ['experiments.governance_enabled', 'EXPERIMENT_GOVERNANCE_ENABLED', true],
    ['flags.console_enabled', 'FLAG_CONSOLE_ENABLED', true],
    ['flags.definition_sync_enabled', 'FLAG_DEFINITION_SYNC_ENABLED', true],
    ['flags.rule_builder_enabled', 'FLAG_RULE_BUILDER_ENABLED', true],
    ['journeys.projections_enabled', 'JOURNEY_PROJECTIONS_ENABLED', true],
    ['ops.automatic_circuit_breakers_enabled', 'AUTOMATIC_CIRCUIT_BREAKERS_ENABLED', false],
    ['ops.resilience_scenarios_enabled', 'RESILIENCE_SCENARIOS_ENABLED', false],
    ['ops.scenario_authoring_enabled', 'SCENARIO_AUTHORING_ENABLED', false],
    ['ops.security_simulations_enabled', 'SECURITY_SIMULATIONS_ENABLED', false],
    ['reports.shares_enabled', 'REPORT_SHARES_ENABLED', true],
    ['signals.loop_enabled', 'SIGNALS_ENABLED', true],
  ])
})

test('the catalog answers only with a served boolean; a kill (false) always lands', () => {
  assert.equal(servedValue(ON, catalogOf(ON.key, [row('production', false)]), 'production'), false)
  assert.equal(servedValue(OFF, catalogOf(OFF.key, [row('production', true)]), 'production'), true)
})

test('every other catalog state serves the fallback — an outage changes nothing visible', () => {
  for (const gate of [ON, OFF]) {
    assert.equal(servedValue(gate, null, 'production'), gate.fallback, 'catalog unreadable')
    assert.equal(servedValue(gate, new Map(), 'production'), gate.fallback, 'flag absent')
    assert.equal(servedValue(gate, catalogOf(gate.key, []), 'production'), gate.fallback, 'no environments')
    assert.equal(servedValue(gate, catalogOf(gate.key, [row('production', null)]), 'production'), gate.fallback, 'serves nothing')
    assert.equal(servedValue(gate, catalogOf(gate.key, [row('production', !gate.fallback, false)]), 'production'), gate.fallback, 'unreadable row')
    assert.equal(servedValue(gate, catalogOf(gate.key, [row('production', 'false')]), 'production'), gate.fallback, 'not a boolean')
  }
})

test('one environment killed does not kill another', () => {
  const catalog = catalogOf(ON.key, [row('preview', false), row('production', true)])
  assert.equal(servedValue(ON, catalog, 'preview'), false)
  assert.equal(servedValue(ON, catalog, 'production'), true)
})

test('VERCEL_ENV maps to the flag environment; anything else is development', () => {
  assert.equal(flagEnvironmentFor('production'), 'production')
  assert.equal(flagEnvironmentFor('preview'), 'preview')
  assert.equal(flagEnvironmentFor(undefined), 'development')
  assert.equal(flagEnvironmentFor('development'), 'development')
})

test("off Vercel a SET env var wins with the old exact === 'true' reading (D6)", () => {
  for (const [raw, expected] of [['true', true], ['false', false], ['TRUE', false], ['1', false], ['true ', false], ['', false]] as const) {
    assert.equal(envOverride(ON, { X_ON_ENABLED: raw }), expected, JSON.stringify(raw))
  }
  assert.equal(envOverride(ON, {}), undefined, 'unset: the catalog answers')
  assert.equal(resolveGate(OFF, catalogOf(OFF.key, [row('development', true)]), { X_OFF_ENABLED: 'false' }), false)
})

test('ON Vercel the env is never read: a leftover Vercel variable cannot override the catalog', () => {
  const env = { VERCEL: '1', VERCEL_ENV: 'production', X_ON_ENABLED: 'true' }
  assert.equal(envOverride(ON, env), undefined)
  assert.equal(resolveGate(ON, catalogOf(ON.key, [row('production', false)]), env), false)
})

test('a gate that was never an env var has no override anywhere', () => {
  assert.equal(envOverride(GATES.terminalSignIn, { 'auth.terminal_sign_in_enabled': 'false' }), undefined)
})
