import { PageTab } from '@/design-system/primitives'
import { periodLinks } from '@/lib/flag-funnel-view'
import type { FunnelPeriod } from '@/lib/flag-funnel'

// tars-one-model D2 — the funnel's period, as plain links that set `?period=`. `hrefFor` builds each link from the
// page's own query, so every other param survives; the choice is a URL worth sending, not client state.
export function PeriodChoice({
  period,
  hrefFor,
}: {
  period: FunnelPeriod
  hrefFor: (period: FunnelPeriod) => string
}) {
  return (
    <nav className="ds-tabs" aria-label="Funnel period">
      {periodLinks(period).map((choice) => (
        <PageTab key={choice.period} current={choice.current} href={hrefFor(choice.period)}>
          {choice.label}
        </PageTab>
      ))}
    </nav>
  )
}
