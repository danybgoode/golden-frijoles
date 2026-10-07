/** @jsxImportSource react */
// Pragma: see report-components.tsx — the test rail renders these with react-dom/server.
import type { MetricLine, SeriesPoint } from '@/lib/outcome-expected'
import {
  dollars,
  figure,
  gapMark,
  metricCell,
  spendVsQuote,
  type EpicTableRow,
  type PayingOffView,
} from '@/lib/outcome-figures'
import { Bean } from '@/design-system/bean'
import { BEAN_WORDS } from '@/lib/roadmap-result'

// outcome-report-v2 · Sprint 1 — "is it paying off": the chart, the four figures and the epics table. Kept out of
// report-components.tsx (already the report's largest file) and free of server imports, like it, so
// e2e/pod-report-surface.spec.tsx renders the real markup. Every number arrives already lensed from getPodReport —
// nothing here decides who may see what; it renders what it is handed (null figure → no figure, [] → no table).
//
// Colour: the actual line is --blue, the expected line a dashed --dim-2; the Bean carries the result, so gold appears
// only where an epic is Proven, and no part of this half is ever red (overspend is "▲ … over …", D3/D4).

const W = 640
const H = 200
const PAD = { top: 16, right: 16, bottom: 28, left: 44 }
const BEAN = 18

const ms = (d: string) => Date.parse(`${d}T00:00:00Z`)

function scale(lines: SeriesPoint[][], markerDays: string[]) {
  const points = lines.flat()
  const days = [...points.map((p) => p.date), ...markerDays]
  let x0 = Math.min(...days.map(ms))
  let x1 = Math.max(...days.map(ms))
  if (x0 === x1) {
    x0 -= 86_400_000
    x1 += 86_400_000
  }
  const values = points.map((p) => p.value)
  let y0 = values.length ? Math.min(...values) : 0
  let y1 = values.length ? Math.max(...values) : 1
  const pad = (y1 - y0 || Math.abs(y1) || 1) * 0.1
  y0 -= pad
  y1 += pad
  const x = (d: string) => PAD.left + ((ms(d) - x0) / (x1 - x0)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom)
  return {
    x,
    y,
    y0,
    y1,
    first: new Date(x0).toISOString().slice(0, 10),
    last: new Date(x1).toISOString().slice(0, 10),
  }
}

const path = (pts: SeriesPoint[], s: ReturnType<typeof scale>) =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${s.x(p.date).toFixed(1)},${s.y(p.value).toFixed(1)}`).join(' ')

/** One metric's chart: actual against expected, each grounded epic's bean where it shipped (D7). */
export function OutcomeChart({ line }: { line: MetricLine }) {
  const s = scale(
    [line.actual, line.expected],
    line.markers.map((m) => m.date)
  )
  const latest = line.actual.at(-1)
  return (
    <figure className="ds-outcome-chart" data-testid="outcome-chart" data-outcome-metric={line.metric}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`outcome-chart-${line.metric}`}>
        <line
          className="ds-outcome-axis"
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
        />
        <text className="ds-outcome-tick" x={PAD.left - 6} y={s.y(s.y1) + 4} textAnchor="end">
          {figure(Math.round(s.y1))}
        </text>
        <text className="ds-outcome-tick" x={PAD.left - 6} y={s.y(s.y0)} textAnchor="end">
          {figure(Math.round(s.y0))}
        </text>
        <text className="ds-outcome-tick" x={PAD.left} y={H - 8}>
          {s.first}
        </text>
        <text className="ds-outcome-tick" x={W - PAD.right} y={H - 8} textAnchor="end">
          {s.last}
        </text>
        {line.expected.length > 0 && (
          <path className="ds-outcome-expected" d={path(line.expected, s)} data-line="expected" />
        )}
        {line.actual.length > 0 && (
          <path className="ds-outcome-actual" d={path(line.actual, s)} data-line="actual" />
        )}
        {line.markers.map((m, i) => (
          <g
            key={`${m.date}-${i}`}
            transform={`translate(${(s.x(m.date) - BEAN / 2).toFixed(1)},${(H - PAD.bottom - BEAN - 2).toFixed(1)})`}
            data-marker={m.slug ?? 'epic'}
          >
            <Bean kind={m.bean ?? 'growing'} decorative />
          </g>
        ))}
      </svg>
      <figcaption className="ds-hint" id={`outcome-chart-${line.metric}`}>
        <b>{line.name}</b>
        {line.isNorthStar ? ' (the North Star)' : ''}:{' '}
        {latest ? `actual ${figure(latest.value)} on ${latest.date}` : 'no recorded value'}
        {line.latest ? `, expected ${figure(line.latest.expected)} (${gapMark(line.latest.gap)})` : ''}
        {line.expected.length === 0 ? ' — no epic targets it, so there is no expected line.' : '.'}
        {line.markers.length > 0 && (
          <>
            {' '}
            Epics shipped:{' '}
            {line.markers
              .map((m) => `${m.name ?? 'an epic'} (${m.date}, ${m.bean ? BEAN_WORDS[m.bean] : 'no result'})`)
              .join('; ')}
            .
          </>
        )}
      </figcaption>
    </figure>
  )
}

function Figure({
  value,
  label,
  line,
  testId,
}: {
  value: string
  label: string
  line: string
  testId: string
}) {
  return (
    <div className="ds-outcome-figure" data-testid={testId}>
      <b className="ds-outcome-figure-value">{value}</b>
      <span className="ds-outcome-figure-label">{label}</span>
      <span className="ds-outcome-figure-line">{line}</span>
    </div>
  )
}

/** The four figures (D3) — or two, when the lens withheld spend. Each says its expected value or that it has none. */
export function OutcomeFigures({ figures }: { figures: PayingOffView['figures'] }) {
  const { now, paidOff, spend, costPerWin } = figures
  return (
    <div className="ds-outcome-figures" data-testid="outcome-figures">
      <Figure
        testId="figure-now"
        value={now.actual === null ? '—' : figure(now.actual)}
        label={now.name ? `${now.name} now` : 'North Star now'}
        line={
          now.none ??
          `expected ${figure(now.expected as number)} (${gapMark(now.gap as number)}) — where the plan said it would be today`
        }
      />
      <Figure
        testId="figure-paid-off"
        value={`${paidOff.proven} of ${paidOff.read}`}
        label="epics paid off, of those read"
        line={`${paidOff.unread} not read yet — an epic counts once its result is read against its target`}
      />
      {spend && (
        <Figure
          testId="figure-spend"
          value={dollars(spend.spent)}
          label={`spent on ${spend.measured} epic${spend.measured === 1 ? '' : 's'}`}
          line={
            spend.quotedSpent === null
              ? 'no quote to read it against'
              : `${dollars(spend.quotedSpent)} of it ${spendVsQuote(spend.quotedSpent, spend.quoteLow, spend.quoteHigh)}` +
                (spend.unquoted > 0 ? ` · ${spend.unquoted} not quoted` : '')
          }
        />
      )}
      {costPerWin && (
        <Figure
          testId="figure-cost-per-win"
          value={costPerWin.perWin === null ? '—' : dollars(costPerWin.perWin)}
          label="per epic that paid off"
          line={
            costPerWin.perWin === null
              ? 'no epic has paid off yet, so there is no cost per one'
              : 'all spend over the epics proven — nothing sets an expected value for it'
          }
        />
      )}
    </div>
  )
}

/** The epics table (D4). Team-only: under another lens `rows` is [] and nothing renders. */
export function EpicsTable({
  rows,
  projectSlug,
  showLinks,
}: {
  rows: EpicTableRow[]
  projectSlug: string
  showLinks: boolean
}) {
  if (rows.length === 0) return null
  return (
    <div className="ds-outcome-table-wrap">
      <table className="ds-outcome-table" data-testid="outcome-epics-table">
        <caption>Each epic’s bet, what it was expected to move and what it moved, and what it cost</caption>
        <thead>
          <tr>
            <th scope="col">Epic · what we bet</th>
            <th scope="col">Metric · expected → actual</th>
            <th scope="col">Result</th>
            <th scope="col">Spend · vs quote</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.slug} data-epic={r.slug}>
              <th scope="row">
                {showLinks ? (
                  <a href={`/hub/${encodeURIComponent(projectSlug)}/epic/${encodeURIComponent(r.slug)}`}>
                    {r.name}
                  </a>
                ) : (
                  r.name
                )}
                {r.hypothesis && <span className="ds-outcome-bet">{r.hypothesis}</span>}
              </th>
              <td>{metricCell(r)}</td>
              <td>
                {r.bean ? (
                  <span className="ds-outcome-result">
                    <Bean kind={r.bean} decorative />
                    {BEAN_WORDS[r.bean]}
                  </span>
                ) : (
                  <span className="ds-hint">no target</span>
                )}
              </td>
              <td data-spend>
                {r.spend === null ? 'not measured' : dollars(r.spend)}
                <span className="ds-outcome-bet">{spendVsQuote(r.spend, r.quoteLow, r.quoteHigh)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * outcome-report-v2 S2.3 (D10) — the links under a section's line. Console pages need a sign-in, so under a share lens
 * (`show` false) nothing renders: a visitor is never handed a link that asks them to log in.
 */
export function SectionLinks({
  show,
  links,
  testId,
  signedIn = true,
}: {
  show: boolean
  links: Array<{ href: string; label: string }>
  testId: string
  /** Signed out, the `/app/` pages would only ask for a sign-in — they are left off. */
  signedIn?: boolean
}) {
  links = signedIn ? links : links.filter((l) => !l.href.startsWith('/app/'))
  if (!show || links.length === 0) return null
  return (
    <p className="ds-outcome-links" data-testid={testId}>
      Open{' '}
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 ? ' · ' : ''}
          <a href={l.href}>{l.label}</a>
        </span>
      ))}
    </p>
  )
}

/** Console URLs for a project's report sections — one place, so the team view and its spec agree. */
export function sectionHrefs(projectSlug: string) {
  const p = encodeURIComponent(projectSlug)
  return {
    northStar: { href: `/app/north-star/${p}`, label: 'North Star' },
    finops: { href: `/app/finops/${p}`, label: 'FinOps' },
    board: { href: `/hub/${p}/board`, label: 'Board' },
  }
}

/** Sprint 1's half of the document: the chart(s), the figures and the table, under one heading. */
export function PayingOffSection({
  payingOff,
  projectSlug,
  showLinks,
  signedIn = true,
}: {
  payingOff: PayingOffView
  projectSlug: string
  showLinks: boolean
  signedIn?: boolean
}) {
  const drawable = payingOff.lines.filter((l) => l.actual.length > 0 || l.expected.length > 0)
  return (
    <section className="ds-report-section" aria-labelledby="paying-off-heading" data-testid="paying-off">
      <h2 className="ds-report-heading" id="paying-off-heading">
        Is it paying off
      </h2>
      <p className="ds-lede">
        The North Star’s inputs as they actually moved, against the line the shipped epics’ own targets drew —
        so you can see whether the work is landing where you planned.
      </p>
      <SectionLinks
        show={showLinks}
        signedIn={signedIn}
        links={[sectionHrefs(projectSlug).northStar]}
        testId="links-paying-off"
      />
      {payingOff.unavailable ? (
        <p className="ds-hint" data-testid="paying-off-unavailable">
          <strong>The plan and its readings could not be read just now.</strong> This is a failure to reach
          them, not a report that nothing was targeted.
        </p>
      ) : drawable.length === 0 ? (
        <p className="ds-hint" data-testid="paying-off-no-lines">
          {payingOff.lines.length === 0
            ? 'No North Star or input is registered, so there is nothing to chart yet.'
            : 'No input has a recorded value and no epic targets one, so there is nothing to chart yet.'}
        </p>
      ) : (
        drawable.map((line) => <OutcomeChart key={line.metric} line={line} />)
      )}
      {/* An unread plan has no figures to show — "0 of 0 paid off" would be the outage speaking as a fact. */}
      {!payingOff.unavailable && <OutcomeFigures figures={payingOff.figures} />}
      <SectionLinks
        show={showLinks}
        signedIn={signedIn}
        links={[sectionHrefs(projectSlug).finops, sectionHrefs(projectSlug).board]}
        testId="links-figures"
      />
      <EpicsTable rows={payingOff.epics} projectSlug={projectSlug} showLinks={showLinks} />
    </section>
  )
}
