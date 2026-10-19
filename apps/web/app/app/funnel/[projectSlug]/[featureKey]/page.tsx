import { notFound } from 'next/navigation'
import { getFeatureFunnel, getFeatureFunnelTrend } from '@/lib/tars-query'
import { asTrendBy, parsePeriod, unknownPeriodError } from '@/lib/flag-funnel'
import { isFunnelTrendEnabled } from '@/lib/flags'
import { funnelTrendView } from '@/lib/flag-funnel-view'
import { noteFunnelTrendViewed } from '@/lib/funnel-trend-screen'
import { FunnelTrend } from '@/components/product/FunnelTrend'
import { requireDashboardAccess } from '@/lib/dashboard-auth'
import { ProductShell } from '@/components/product/ProductShell'
import { Answer, Crumb, Crumbs, PageHead } from '@/design-system/primitives'
import { FunnelPane } from '@/app/app/flags/[projectSlug]/[flagKey]/feature-panes'
import { SCREEN_WORDS } from '@/lib/screen-words'

// Growth Engine v1 · Sprint 2, Story 2.3 — the funnel page for a registered feature
// (v1's headline case: /app/funnel/miyagisanchez/setup_guide). Behind per-tenant authorization
// (multi-tenant-activation Story 1.2): the demo project renders anonymously; every other slug
// requires a signed-in member (unauthed → /login, non-member → 404).
//
// ── design-system-rails · Sprint 5, Story 5.3 — reference state `funnel-standalone` (DD5) ─────
// It rendered a `<dl>` of three numbers. It is now the SAME `FunnelPane` the feature page's Funnel
// tab renders, wrapped in the page chrome a standalone route needs: a crumb back to the feature, a
// head, and the answer line the approved state opens with.
//
// **One design, two mounts — and it is one because there is one component, not because two of them
// currently agree.** The page's own words say so out loud, which is the design's answer to "why does
// this exist if the tab does the same thing": the URL is shareable, and the tab is where you will
// actually find it.
//
// ProductShell now reads the session cookie on every render (lib/shell-nav.ts), so this route is
// request-time by nature. Declared rather than inferred: LEARNINGS records a feature gate's required
// 404 turning into a 200 when a parent streamed, and an implicit-dynamic route is the same class of
// surprise — the behaviour should be in the file, not in a rule about generateStaticParams.
export const dynamic = 'force-dynamic'

export default async function FunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectSlug: string; featureKey: string }>
  searchParams: Promise<{ period?: string | string[]; by?: string | string[] }>
}) {
  const { projectSlug, featureKey } = await params
  await requireDashboardAccess(projectSlug)
  const rawPeriod = (await searchParams).period
  const periodParam = Array.isArray(rawPeriod) ? rawPeriod[0] : rawPeriod
  const parsedPeriod = parsePeriod(periodParam)
  const period = parsedPeriod ?? 'all'
  const result = await getFeatureFunnel(projectSlug, featureKey, period)
  // ⚠️ `query_failed` THROWS and everything else 404s — unchanged. A failed read must not render as
  // an absent feature: `FunnelPane`'s own empty states say which absence they are, and a database
  // outage is not one of them.
  if (!result.ok && result.reason === 'query_failed') throw new Error('Funnel lookup failed')
  if (!result.ok) notFound()
  // funnel-truth D5/D6/D7 — the trend under the funnel, behind its switch; counted only for a signed-in member.
  const rawBy = (await searchParams).by
  const by = asTrendBy(Array.isArray(rawBy) ? rawBy[0] : rawBy)
  const trend = (await isFunnelTrendEnabled())
    ? await getFeatureFunnelTrend(projectSlug, featureKey, by)
    : null
  if (trend?.projectId) await noteFunnelTrendViewed(trend.projectId)
  const base = `/app/funnel/${encodeURIComponent(projectSlug)}/${encodeURIComponent(featureKey)}`

  return (
    <ProductShell projectSlug={projectSlug} section="ship" railActive={'flags'}>
      <main>
        <Crumbs back={{ href: `/app/flags/${projectSlug}`, label: SCREEN_WORDS.flags }}>
          <Crumb mono>{featureKey}</Crumb>
          <Crumb>Funnel</Crumb>
        </Crumbs>
        <PageHead
          title={
            <>
              Funnel · <span className="ds-mono">{featureKey}</span>
            </>
          }
          lede="How far people get once this is switched on."
        />
        <Answer>
          <strong>This page is a view of a feature, so it also lives on the feature.</strong> The link is
          shareable and the tab is where you will actually find it — same design, two mounts, not two designs.
        </Answer>
        {parsedPeriod === null ? (
          <p className="ds-hint" role="status">
            {unknownPeriodError(periodParam)} Showing all time.
          </p>
        ) : null}
        <FunnelPane
          flagKey={featureKey}
          result={result}
          period={period}
          hrefFor={(p) => `${base}?period=${p}${trend ? `&by=${by}` : ''}`}
          trend={
            trend ? (
              <FunnelTrend
                view={funnelTrendView(trend.ok ? trend.trend : null)}
                by={by}
                hrefFor={(b) => `${base}?period=${period}&by=${b}`}
              />
            ) : undefined
          }
        />
      </main>
    </ProductShell>
  )
}
