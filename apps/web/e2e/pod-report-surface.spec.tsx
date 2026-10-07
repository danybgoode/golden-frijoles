/** @jsxImportSource react */
// The shim MUST be first: it declares the global `styles` that Playwright's transform strips out of
// every CSS-module import below it. See its own header for the measurement behind that.
import './helpers/css-module-shim'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from '@playwright/test'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildPodReportView, type PodReportView } from '@/lib/pod-report-view'
import { applyLens, applyPayingOffLens, type PodReportLens } from '@/lib/pod-report-lens'
import { buildPayingOff, type OutcomeEpic, type PayingOffView } from '@/lib/outcome-figures'
import { epicResult } from '@/lib/roadmap-result'
import { epicFinops } from '@/lib/roadmap-finops'
import { buildOutcomeSection } from '@/lib/pod-outcome'
import { formatFreshness } from '@/lib/hub-freshness'
import { PodReportBody, evidenceHref } from '../app/hub/report-components'

// pod-report · Sprint 2.5c — the Pod Report surface.
//
// ── Why this renders components instead of hitting HTTP ───────────────────────────────────────
// e2e/hub.spec.ts asserts the journey and horizon views over HTTP because it can PUSH the artifact
// it is about to read, in a serial file, against the one publicly-readable tenant. This surface
// cannot borrow that shape:
//
//   1. Report artifacts are append-only and the hub reads LATEST-WINS, so "push then read" is only
//      sound while nothing else pushes. The pod_report push rail (Story 2.5a) is being built in
//      parallel and any developer's `--push` against a local Supabase changes what this suite would
//      read. That is the shared-DB-state trap hub-components.tsx already documents.
//   2. The three assertions that matter here are about RENDERING LOGIC — does the page refuse a
//      dishonest artifact, does it keep the verdict welded to its coverage gap — and every one of
//      them needs a deliberately malformed view that no honest computation would ever push.
//
// So the input is the REAL artifact (regenerate with
// `node scripts/pod-report.mjs --repo ~/dobby/medusa-bonsai --out apps/web/e2e/_fixtures/pod-report.artifact.json`)
// run through the real `buildPodReportView` + `applyLens`, and the output is the real markup the
// route serves. Only the transport is skipped.

const ARTIFACT = JSON.parse(
  readFileSync(join(__dirname, '_fixtures', 'pod-report.artifact.json'), 'utf8')
) as Record<string, unknown>

const FRESHNESS = formatFreshness('2026-07-26T00:00:00.000Z', new Date('2026-07-26T01:00:00.000Z'), 'abc1234')

/** The outcome half a tenant with one registered feature and a registered North Star produces. */
const OUTCOME = buildOutcomeSection({
  tenant: 'golden-beans-demo',
  features: [{ key: 'setup_guide', tars: { targeted: 40, adopted: 10, retained: 4 } }],
  northStar: { metric: 'activated_merchants', inputCount: 3, latestValue: null },
})

/**
 * Decode the entities React escapes on the way out, so an assertion can be written with the same
 * apostrophe the artifact actually contains.
 *
 * Without this, `expect(html).toContain(caveat)` fails on any caveat holding a `'` — React emits
 * `&#x27;` — and the natural "fix" is to paste the escaped form into the test, which then stops
 * matching the source data it is supposed to be checking.
 */
function decodeEntities(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// outcome-report-v2 — the "is it paying off" half, built through the real readers and the real lens, from a Ledgerly
// roadmap shaped like the seed's table: one Proven, one Disproven (overspent), one Growing, one spend-only.
const epicRow = (over: Record<string, unknown>): OutcomeEpic => {
  const r: Record<string, unknown> = { grain: 'Epic', status: 'Shipped', ...over }
  return {
    result: epicResult(r, { today: '2026-11-10' }),
    finops: epicFinops(r),
    shippedAt: (r.shipped_at as string | undefined) ?? null,
  }
}
const LEDGERLY_EPICS: OutcomeEpic[] = [
  epicRow({
    slug: 'overdue-reminders', name: 'Overdue reminders', hypothesis: 'a reminder gets invoices paid on time',
    shipped_at: '2026-09-01', target_metric: 'paid_on_time', target_from: 61, target_to: 70, read_date: '2026-10-01',
    verdict: 'proven', verdict_actual: 72, verdict_at: '2026-10-02', actual_usd: 9.8, quote_low_usd: 7, quote_high_usd: 16,
  }),
  epicRow({
    slug: 'smart-defaults', name: 'Smart defaults', hypothesis: 'sensible defaults finish setup',
    shipped_at: '2026-09-10', target_metric: 'paid_on_time', target_from: 70, target_to: 75, read_date: '2026-10-10',
    verdict: 'disproven', verdict_actual: 70, verdict_at: '2026-10-11', actual_usd: 11.3, quote_low_usd: 5, quote_high_usd: 8,
  }),
  epicRow({
    slug: 'export-csv', name: 'Export CSV', hypothesis: 'teams that export come back weekly',
    shipped_at: '2026-10-20', target_metric: 'paid_on_time', target_from: 75, target_to: 78, read_date: '2026-11-19',
  }),
  epicRow({ slug: 'the-cli', name: 'The CLI', shipped_at: '2026-09-18', actual_usd: 207.81 }),
]
const PAYING_OFF_TEAM = buildPayingOff({
  product: 'Ledgerly',
  epics: LEDGERLY_EPICS,
  sources: [
    {
      key: 'paid_on_time',
      name: 'Paid on time',
      isNorthStar: false,
      series: [
        { date: '2026-08-20', value: 60 },
        { date: '2026-10-25', value: 71 },
      ],
    },
  ],
})
const payingOffFor = (lens: PodReportLens): PayingOffView => applyPayingOffLens(PAYING_OFF_TEAM, lens)

function render(view: PodReportView, lens: PodReportLens = 'team', payingOff = payingOffFor(lens)): string {
  return decodeEntities(
    renderToStaticMarkup(
      <PodReportBody
        projectSlug="golden-beans-demo"
        view={view}
        outcome={OUTCOME}
        payingOff={payingOff}
        lens={lens}
        artifactVersion={3}
        freshness={FRESHNESS}
      />
    )
  )
}

function viewFor(lens: PodReportLens): PodReportView {
  return applyLens(buildPodReportView(ARTIFACT), lens)
}

/** The rendered markup of one element and its subtree, located by a `data-testid`. */
function slice(html: string, testId: string, span = 900): string {
  const i = html.indexOf(`data-testid="${testId}"`)
  expect(i, `${testId} did not render`).toBeGreaterThan(-1)
  return html.slice(i, i + span)
}

test('the fixture is a real artifact — if this fails, regenerate it rather than editing it', () => {
  // A fixture that has quietly drifted from what the script emits turns every assertion below into
  // a test of a shape nothing produces. LEARNINGS' realistic-input lesson, made checkable.
  const view = viewFor('team')
  expect(view.empty).toBe(false)
  expect(view.speed.length).toBeGreaterThan(0)
  expect(view.notInstrumented.length).toBeGreaterThan(0)
  expect(view.maturity?.verdict).not.toBeNull()
})

// ── The load-bearing three ────────────────────────────────────────────────────────────────────

test('the not-instrumented section is present whenever numbers are — Decision 4', () => {
  const html = render(viewFor('team'))

  // Numbers ARE on the page…
  expect(html).toContain('14 / week')
  expect(html).toContain('7.1 d')

  // …and so is every gap the computation named, each with its guardrail.
  const gaps = slice(html, 'delivery-not-instrumented', 6000)
  for (const row of viewFor('team').notInstrumented) {
    expect(gaps, `gap ${row.key} must render beside the numbers`).toContain(row.label)
    expect(gaps).toContain(row.guardrail)
  }
  expect(gaps).toContain('What would close it')

  // Adjacency is the point, not mere presence: the gaps panel is a sibling INSIDE the same section
  // as the speed table, so it cannot be relegated to a footer by a later edit. Assert the ordering
  // the layout depends on — table, then panel, then the section closes.
  const speedHeading = html.indexOf('id="speed-heading"')
  const table = html.indexOf('data-metric="deploy_frequency"')
  const panel = html.indexOf('data-testid="delivery-not-instrumented"')
  const sectionEnd = html.indexOf('</section>', speedHeading)
  expect(speedHeading).toBeGreaterThan(-1)
  expect(panel).toBeGreaterThan(table)
  expect(panel).toBeLessThan(sectionEnd)
})

test('the verdict and its not-instrumented count always appear together', () => {
  for (const lens of ['team', 'client', 'investor'] as const) {
    const view = viewFor(lens)
    const verdict = view.maturity!.verdict!
    const html = render(view, lens)

    // In the verdict card — one element, both numbers, same type size.
    const card = slice(html, 'maturity-verdict', 2500)
    expect(card, `${lens}: the step is missing`).toContain(`Step ${verdict.step}`)
    expect(card, `${lens}: the coverage gap is missing`).toContain(
      `${verdict.notInstrumentedCount} not instrumented`
    )

    // And in the agent window's headline, which is what a reader sees before scrolling at all.
    const headline = slice(html, 'agent-headline', 700)
    expect(headline).toContain(`step ${verdict.step}`)
    expect(headline).toContain(String(verdict.notInstrumentedCount))

    // Story 2.4 names the investor lens explicitly, so assert the lens that hides the ROWS still
    // shows the count.
    if (lens === 'investor') {
      expect(html).not.toContain('data-criterion=')
      expect(card).toContain(`${verdict.notInstrumentedCount} not instrumented`)
    }
  }
})

test('a view whose caveats did not survive refuses to render its numbers', () => {
  const stripped: PodReportView = { ...viewFor('team'), notInstrumented: [], caveats: [] }
  const html = render(stripped)

  expect(html).toContain('data-testid="pod-report-refused"')
  expect(html).toContain('refusing to render it as a report')
  // The actual guarantee: not "a warning is shown somewhere" but "no number reaches the page".
  expect(html).not.toContain('14 / week')
  expect(html).not.toContain('7.1 d')
  expect(html).not.toContain('data-metric=')
  expect(html).not.toContain('data-testid="maturity-verdict"')
  // And it names which part is missing, so the reader is sent to the artifact, not to a screenshot.
  expect(html).toContain('the not-instrumented rows')
  expect(html).toContain('the caveats')
})

test('a verdict with an unpinned ladder citation is also refused', () => {
  // isHonest()'s second condition: a score on a named external scale is uninterpretable without the
  // version of the scale it was scored against.
  const base = viewFor('team')
  const unpinned: PodReportView = {
    ...base,
    maturity: { ...base.maturity!, ladder: { title: 'Steps of AI Adoption' } },
  }
  const html = render(unpinned)
  expect(html).toContain('data-testid="pod-report-refused"')
  expect(html).toContain('the version-pinned ladder citation')
  expect(html).not.toContain('data-testid="maturity-verdict"')
})

// ── Everything else the story is accountable for ──────────────────────────────────────────────

test('every metric row renders its interpretation with the number, never on hover', () => {
  const view = viewFor('team')
  const html = render(view)

  for (const row of [...view.speed, ...view.composition]) {
    if (row.interpretation) {
      expect(html, `${row.key} lost its interpretation`).toContain(row.interpretation)
    } else if (row.value !== null) {
      // No interpretation and a real number: the renderer must say so rather than print it bare.
      expect(html).toContain('The computation attached no reading to this number')
    }
  }

  // Nothing is hidden behind a title/hover attribute on a metric cell.
  expect(html).not.toContain('title="Share of commits')
  // Proxy rows are visibly marked as proxies.
  const proxy = html.indexOf('data-metric="deploy_frequency"')
  expect(html.slice(proxy, proxy + 400)).toContain('proxy')
})

test('caveats render on the page, above the numbers — not as a footnote', () => {
  const view = viewFor('team')
  const html = render(view)

  const band = slice(html, 'pod-report-caveats', 2000)
  for (const caveat of view.caveats) expect(band).toContain(caveat)

  // Position is the acceptance criterion: the caveats precede the first delivery number.
  expect(html.indexOf('data-testid="pod-report-caveats"')).toBeLessThan(html.indexOf('data-metric='))
})

test('evidence pointers: a PR resolves to a real link, a CI check stays text, a composite stays text', () => {
  const html = render(viewFor('team'))

  // `pr` + whole-number ref → an openable object in the repo the artifact names.
  expect(html).toContain('https://github.com/danybgoode/miyagi-product-management/pull/92')
  // `ci_check` is not a URL and must not be dressed as one.
  const ciRow = html.indexOf('data-criterion="code_quality_enforcement"')
  expect(ciRow).toBeGreaterThan(-1)
  expect(html.slice(ciRow, ciRow + 900)).toContain('data-evidence="text"')

  // The unit-level truth table behind that, including the composite ref the lens legitimately emits.
  expect(evidenceHref('pr', 92, 'medusa-bonsai')).toBe(
    'https://github.com/danybgoode/miyagi-product-management/pull/92'
  )
  expect(evidenceHref('pr', '92', 'medusa-bonsai')).toBe(
    'https://github.com/danybgoode/miyagi-product-management/pull/92'
  )
  // "6+7" means "these two PRs overlapped" — there is no single page to open, so no link.
  expect(evidenceHref('pr', '6+7', 'medusa-bonsai')).toBeNull()
  expect(evidenceHref('ci_check', 'guards', 'medusa-bonsai')).toBeNull()
  // An unknown repo never gets a guessed URL — a 404 link is worse than plain text here.
  expect(evidenceHref('pr', 92, 'some-other-repo')).toBeNull()
  expect(evidenceHref('pr', 92, undefined)).toBeNull()
})

test('a withheld evidence pointer says withheld — not absent', () => {
  // The client lens strips pointers and sets evidenceWithheld. "A lens is standing between you and
  // this" and "no evidence exists" are opposite facts and must not render alike.
  const html = render(viewFor('client'), 'client')

  expect(html).toContain('data-evidence="withheld"')
  expect(html).toContain('does not receive it')
  expect(html).not.toContain('https://github.com/danybgoode/miyagi-product-management/pull/')
  // The row's own qualification survives the lens.
  expect(html).toContain('is a proxy for')
})

test('the ladder citation is version-pinned and visible on the page', () => {
  const cite = slice(render(viewFor('team')), 'ladder-citation', 700)
  expect(cite).toContain('Steps of AI Adoption')
  expect(cite).toContain('Boris Cherny')
  expect(cite).toContain('2026-07-16')
  expect(cite).toContain('never republished wholesale')
})

test('every benchmark carries its linked source', () => {
  const view = viewFor('team')
  const html = render(view)
  const list = slice(html, 'pod-report-benchmarks', 3000)

  expect(view.benchmarks.length).toBeGreaterThan(0)
  for (const b of view.benchmarks) {
    expect(list).toContain(b.label)
    expect(list).toContain(`href="${b.url}"`)
  }
  // Benchmark-anchored metric rows link out inline too, so the number and its source sit together.
  expect(html).toContain('read against:')
})

test('the outcome half renders TARS with its registry caveat, and admits what it cannot tell', () => {
  const html = render(viewFor('team'))

  expect(html).toContain('setup_guide')
  expect(html).toContain('REGISTRY-DECLARED')
  expect(html).toContain('lib/tars-query.ts')
  // A defined metric with no reading is not a reading of zero.
  expect(html).toContain('no value recorded')
  const gaps = slice(html, 'outcome-not-instrumented', 4000)
  expect(gaps).toContain('Revenue per feature')
  expect(gaps).toContain('North-Star movement over time')
})

test('a tenant with no registered features renders not-instrumented, never zeros', () => {
  const empty = buildOutcomeSection({ tenant: 'fresh-tenant', features: [], northStar: null })
  const html = decodeEntities(
    renderToStaticMarkup(
      <PodReportBody
        projectSlug="fresh-tenant"
        view={viewFor('team')}
        outcome={empty}
        payingOff={payingOffFor('team')}
        lens="team"
        artifactVersion={1}
        freshness={FRESHNESS}
      />
    )
  )
  const note = slice(html, 'outcome-empty', 500)
  expect(note).toContain('not instrumented')
  expect(note).not.toContain('>0<')
})

test('a metric table is a real table with row and column headers', () => {
  // Semantic HTML is an acceptance item, not a preference: a screen reader has to be able to say
  // "Deploy frequency, reading, 14 / week", which divs cannot express.
  const html = render(viewFor('team'))
  expect(html).toContain('<table')
  expect(html).toContain('<caption>')
  expect(html).toContain('<th scope="col">Metric</th>')
  expect(html).toMatch(/<th scope="row"[^>]*>Deploy frequency/)
})

test('an empty artifact renders a friendly no-delivery notice, not a refusal and not zeros', () => {
  // `delivery` absent → buildPodReportView marks the view empty; isHonest() lets it through because
  // an empty state claims nothing.
  const view = buildPodReportView({ generatedAt: '2026-07-26T00:00:00.000Z', caveats: ['nothing yet'] })
  const html = render(view)
  expect(html).toContain('data-testid="pod-report-no-delivery"')
  expect(html).not.toContain('data-testid="pod-report-refused"')
  expect(html).not.toContain('data-metric=')
})

// ── outcome-report-v2 · Sprint 1 ───────────────────────────────────────────────────────────────────────────────────

test('S1.1: the report opens with whether it is paying off, before the ladder headline and every number', () => {
  const html = render(viewFor('team'))
  const sentence = html.indexOf('data-testid="paying-off-sentence"')
  expect(sentence).toBeGreaterThan(-1)
  expect(sentence).toBeLessThan(html.indexOf('data-testid="agent-headline"'))
  expect(sentence).toBeLessThan(html.indexOf('data-metric='))
  // Expected 75.5 on 25 Oct (61 + 9 + 5, then 3 × 5/30 of export-csv), actual 71: behind.
  expect(slice(html, 'paying-off-sentence', 200)).toContain('Ledgerly is behind the pace you planned.')
  const chart = slice(html, 'outcome-chart', 4000)
  expect(chart).toContain('data-line="actual"')
  expect(chart).toContain('data-line="expected"')
  expect(chart).toContain('data-marker="overdue-reminders"')
})

test('S1.1: with no grounded epic, the chart shows the actual only and the page says it cannot tell yet', () => {
  const none = buildPayingOff({
    product: 'Ledgerly',
    epics: [LEDGERLY_EPICS[3]],
    sources: [{ key: 'paid_on_time', name: 'Paid on time', isNorthStar: false, series: [{ date: '2026-10-25', value: 71 }] }],
  })
  const html = render(viewFor('team'), 'team', none)
  expect(slice(html, 'paying-off-sentence', 200)).toContain("No targets yet, so we can't say if it's on pace.")
  const chart = slice(html, 'outcome-chart', 4000)
  expect(chart).toContain('data-line="actual"')
  expect(chart).not.toContain('data-line="expected"')
  expect(slice(html, 'figure-now', 400)).toContain('nothing is expected')
})

test('S1.2: four figures for the team, each with its expected value or saying there is none', () => {
  const html = render(viewFor('team'))
  expect(slice(html, 'figure-now', 400)).toContain('expected')
  expect(slice(html, 'figure-paid-off', 400)).toContain('1 of 2')
  expect(slice(html, 'figure-paid-off', 400)).toContain('1 not read yet')
  expect(slice(html, 'figure-spend', 500)).toContain('$229')
  expect(slice(html, 'figure-spend', 500)).toContain('$21.10 of it within $12–24 · 1 not quoted')
  expect(slice(html, 'figure-cost-per-win', 400)).toContain('$229')
})

test('S1.2 + S1.3: a client or investor link shows two figures, no spend, no table — and still counts the unread', () => {
  for (const lens of ['client', 'investor'] as const) {
    const html = render(viewFor(lens), lens)
    expect(html, lens).toContain('data-testid="figure-now"')
    expect(slice(html, 'figure-paid-off', 400), lens).toContain('1 not read yet')
    expect(html, lens).not.toContain('data-testid="figure-spend"')
    expect(html, lens).not.toContain('data-testid="figure-cost-per-win"')
    expect(html, lens).not.toContain('data-testid="outcome-epics-table"')
    expect(html, lens).not.toContain('$207')
    expect(html, lens).not.toContain('/epic/')
  }
  // An investor sees where epics landed, not which.
  expect(render(viewFor('investor'), 'investor')).not.toContain('Overdue reminders')
})

test('S1.3: the epics table — column names, the bet under the name, every row links to its epic page, overspend neutral', () => {
  const html = render(viewFor('team'))
  const table = slice(html, 'outcome-epics-table', 9000)
  for (const col of ['Epic · what we bet', 'Metric · expected → actual', 'Result', 'Spend · vs quote']) {
    expect(table).toContain(`<th scope="col">${col}</th>`)
  }
  expect(table).toContain('a reminder gets invoices paid on time')
  expect(table).toContain('Paid on time · 61 → 70 · actual 72 (▲ 2)')
  expect(table).toContain('▲ $3.30 over $5–8')
  for (const slug of ['overdue-reminders', 'smart-defaults', 'export-csv', 'the-cli']) {
    expect(table).toContain(`href="/hub/golden-beans-demo/epic/${slug}"`)
  }
  // Overspend is a marker, never Ember: no red class anywhere in this half.
  const half = html.slice(html.indexOf('data-testid="paying-off"'))
  expect(half.slice(0, half.indexOf('</section>'))).not.toMatch(/class="[^"]*(red|ember|danger|NotMet)/i)
})
