import { ChartUnreadable, SmallMultiple } from '@/design-system/charts'
import { PageTab, Table, TableCell, TableHead, TableRow } from '@/design-system/primitives'
import type { TrendBy } from '@/lib/flag-funnel'
import { trendByLinks, type FunnelTrendView } from '@/lib/flag-funnel-view'

// funnel-truth D5 — a funnel's trend by cohort period: one small chart per stage, then every period in words. The flag
// page's Funnel tab, /app/funnel and the Hub epic page render it, behind bets.funnel_trend_enabled (D6).
export function FunnelTrend({
  view,
  by,
  hrefFor,
}: {
  view: FunnelTrendView
  by: TrendBy
  /** The page's own URL for a grouping: it keeps the page's other params. */
  hrefFor: (by: TrendBy) => string
}) {
  return (
    <section className="ds-epic-section" aria-label="The funnel over time">
      <h2 className="ds-label">Over time, by when people first got it</h2>
      <nav className="ds-tabs" aria-label="Trend grouping">
        {trendByLinks(by).map((choice) => (
          <PageTab key={choice.by} current={choice.current} href={hrefFor(choice.by)}>
            {choice.label}
          </PageTab>
        ))}
      </nav>
      {view.kind !== 'measured' ? (
        <p className="ds-hint">{view.text}</p>
      ) : (
        <>
          {view.segment ? <p className="ds-hint">{view.segment}</p> : null}
          <div className="ds-chart-smalls">
            {view.stages.map((stage) => (
              <SmallMultiple
                key={stage.label}
                label={stage.label}
                value={stage.value}
                series={stage.series}
              />
            ))}
          </div>
          {view.unreadable.length ? (
            <ChartUnreadable>
              Not drawn, because the read couldn’t finish them (this is not a drop):{' '}
              {view.unreadable.join(' ')}
            </ChartUnreadable>
          ) : null}
          <Table>
            <TableHead>
              <TableCell header wide>
                {by === 'month' ? 'Month' : 'Week of'}
              </TableCell>
              <TableCell header>Got it</TableCell>
              <TableCell header>Adopted</TableCell>
              <TableCell header>Retained</TableCell>
              {view.rows[0]?.satisfied !== null ? <TableCell header>Satisfied</TableCell> : null}
            </TableHead>
            {view.rows.map((row) => (
              <TableRow key={row.period}>
                <TableCell wide>{row.period}</TableCell>
                <TableCell>{row.gotIt}</TableCell>
                <TableCell>{row.adopted}</TableCell>
                <TableCell>{row.retained}</TableCell>
                {row.satisfied !== null ? <TableCell>{row.satisfied}</TableCell> : null}
              </TableRow>
            ))}
          </Table>
        </>
      )}
    </section>
  )
}
