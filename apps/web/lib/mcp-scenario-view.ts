import type { ScenarioDashboardView } from './scenario-dashboard'
import { scenarioRunImpactState } from './scenario-run-impact.ts'

// scenarios-light-up S2.1 — the field selection behind the connector's read-only `list_scenarios`.
// Types only on purpose: no `server-only`, so the unit test can load it. The selection is an
// ALLOW-list; anything not named here (actor ids, audit entries, policies, trips, security
// results, impacts, row ids, definition hashes) cannot reach a connector reply.

export const SCENARIO_RUN_STATUSES = ['draft', 'running', 'stopped', 'aborted', 'expired'] as const

export const SCENARIO_TOOL_NOTE =
  'Read-only. Scenario writes (register, start, stop) go through the `frijoles scenarios` CLI, not the connector.'

export function toScenarioToolView(view: ScenarioDashboardView, status?: string) {
  return {
    targets: view.targets.map((t) => ({
      key: t.key,
      origin: t.origin,
      status: t.status,
      verifiedAt: t.verifiedAt,
    })),
    definitions: view.definitions.map((d) => ({
      scenarioKey: d.scenarioKey,
      version: d.version,
      kind: d.definition.kind,
      cohort: d.definition.cohort,
      environment: d.definition.environment,
      targetKey: d.definition.targetKey,
      startAt: d.definition.startAt,
      expiresAt: d.definition.expiresAt,
      flag: { key: d.definition.flag.key, definitionVersion: d.definition.flag.definitionVersion },
      limits: d.definition.limits,
    })),
    runs: view.runs
      .filter((r) => !status || r.status === status)
      .map((r) => ({
        id: r.id,
        scenarioKey: r.scenarioKey,
        definitionVersion: r.definitionVersion,
        kind: r.kind,
        cohort: r.cohort,
        targetKey: r.targetKey,
        environment: r.environment,
        status: r.status,
        requestCount: r.requestCount,
        successCount: r.successCount,
        failureCount: r.failureCount,
        startedAt: r.startedAt,
        stoppedAt: r.stoppedAt,
        stopReason: r.stopReason,
        // drill-impact-for-agents D13 — the STATE only; the evidence body never reaches a connector reply.
        impact: scenarioRunImpactState(view, r.id),
      })),
    note: SCENARIO_TOOL_NOTE,
  }
}
