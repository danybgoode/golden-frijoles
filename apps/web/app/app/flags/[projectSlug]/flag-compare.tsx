// design-system-rails · Sprint 4, Story 4.1 — the compare-environments view (reference state
// `ship-compare`).
//
// ── Why it ships with the list rather than after it ──────────────────────────────────────────
// The story's own rule: *a control that goes nowhere is worse than no control*. The approved
// `ship-features` state has a **Compare environments** button in its page head, so shipping the list
// without the view it opens would put a dead control in front of every operator — the defect Story
// 4.3's empty state exists to avoid one route along.
//
// ── Why it is a VIEW of this route, not a route of its own ───────────────────────────────────
// It answers the same question about the same set — *which of these are on, and where* — and it
// takes no input the list does not already have. A second route would need its own manifest row, its
// own reference state and its own coverage obligation for what is one screen's worth of the same
// data. `?view=compare` keeps it linkable, which is the only property a route would have bought.
//
// ── No query is added ────────────────────────────────────────────────────────────────────────
// `getFlagRegistryView()` already returns every definition and activation for the project; this
// projects the same array once per environment. The list page pays for one read either way.

import { FLAG_ENVIRONMENTS } from '@/lib/flag-definition'
import type { FlagRegistryRow } from '@/lib/flag-registry'
import { projectFlagRows, type FlagSwitchState } from '@/lib/flag-list-view'
import { FLAG_STATE_PRESENTATION } from './flag-vocabulary'

/**
 * The mark in a cell.
 *
 * ⚠️ A SHAPE and a `title`, never a colour alone: a filled disc for On, an empty ring for Off. Colour alone stops
 * being readable in a 126-cell grid.
 */
function Mark({ state }: { state: FlagSwitchState }) {
  return (
    <span
      className={`ds-mark ds-mark--${state}`}
      role="img"
      aria-label={FLAG_STATE_PRESENTATION[state].label}
      title={FLAG_STATE_PRESENTATION[state].label}
    />
  )
}

export function FlagCompare({ flags }: { flags: FlagRegistryRow[] }) {
  // One projection per environment, keyed by flag id, so a row can read three answers without
  // re-deriving them per cell.
  const byEnvironment = FLAG_ENVIRONMENTS.map((environment) => ({
    environment,
    states: new Map(projectFlagRows(flags, environment).map((row) => [row.id, row.state])),
  }))
  // The key order the list uses, so a reader moving between the two views sees the same sequence.
  const rows = [...flags].sort((a, b) => a.key.localeCompare(b.key))

  return (
    <>
      <div className="ds-legend">
        {(['on', 'off'] as const).map((state) => (
          <span key={state}>
            <Mark state={state} />
            {FLAG_STATE_PRESENTATION[state].label}
          </span>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="ds-listcard">
          <div className="ds-empty">
            <span className="ds-empty-title">There is nothing to compare yet</span>
            <span className="ds-empty-body">
              This project has no features. Create one from the list, and it will appear here against all
              three environments.
            </span>
          </div>
        </div>
      ) : (
        <div className="ds-listcard">
          {/* ⚠️ The GRID scrolls, never the page (Do-not #6, sprint contract #2). Both axes: three
              environment columns can exceed a narrow viewport, and 42 rows exceed any viewport. A
              page-level scroll here is what the gate's no-vertical-scroll assertion catches. */}
          <div className="ds-listcard-scroll ds-matrix-scroll">
            <table className="ds-matrix">
              <caption className="ds-label">Every feature, against all three environments</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {FLAG_ENVIRONMENTS.map((environment) => (
                    <th scope="col" className="ds-matrix-cell" key={environment}>
                      {environment}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((flag) => (
                  <tr key={flag.id}>
                    <td>
                      <span className="ds-matrix-key">{flag.key}</span>
                    </td>
                    {byEnvironment.map(({ environment, states }) => (
                      <td className="ds-matrix-cell" key={environment}>
                        {/* Off when the lookup misses: nothing served is Off (one-flag-switch D1). */}
                        <Mark state={states.get(flag.id) ?? 'off'} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
