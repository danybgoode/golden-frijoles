/** @jsxImportSource react */
// The shim MUST be first: see its own header.
import './helpers/css-module-shim'

import { test, expect } from '@playwright/test'
import { renderToStaticMarkup } from 'react-dom/server'
import { Bean, BEAN_SIZES } from '@/design-system/bean'
import { CardResult } from '../app/hub/[projectSlug]/board/board-components'
import type { BoardCard } from '@/lib/hub-board'

// result-record · Story 2.3 (D11) — the Bean, and the result line on a shipped board card.
//
// Rendered, not browsed: the board fixture's epics carry no target (the record starts from now), so no route renders a
// bean yet. Every claim here is about markup and words — the kind, the screen-reader word, the line.

const card = (result: Record<string, unknown> | null): BoardCard => ({
  project: null,
  slug: 'reminders',
  name: 'Overdue reminders',
  grain: 'Epic',
  stage: 'Shipped',
  stageSource: null,
  type: 'Feature',
  risk: 'Low',
  area: null,
  buildOrder: 1,
  appetite: null,
  bet: null,
  sprintProgress: null,
  goal: null,
  sprints: [],
  links: { readme: null, seed: null, sprints: [], retro: null },
  pr: null,
  kickoff: null,
  shippedAt: '2026-10-04',
  result,
  finops: null,
  flagKey: null,
  flagNote: null, grounded: null, groundedReason: null,
})

const shipped = {
  slug: 'reminders',
  name: 'Overdue reminders',
  status: 'Shipped',
  target_metric: 'invoices_paid_on_time',
  target_from: 61,
  target_to: 70,
  read_date: '2099-01-01',
}

test('each kind, at each size, carries its word for a screen reader', () => {
  for (const [kind, word] of [
    ['proven', 'Proven'],
    ['growing', 'Growing'],
    ['disproven', 'Disproven'],
    ['unclear', 'Unclear'],
  ] as const) {
    for (const size of BEAN_SIZES) {
      const html = renderToStaticMarkup(<Bean kind={kind} size={size} />)
      expect(html).toContain(`data-kind="${kind}"`)
      expect(html).toContain('role="img"')
      expect(html).toContain(`aria-label="${word}"`)
      expect(html).toContain(`width="${size}"`)
    }
  }
  // Beside its visible word the bean is decorative, so the word is heard once.
  const decorative = renderToStaticMarkup(<Bean kind="proven" decorative />)
  expect(decorative).toContain('aria-hidden="true"')
  expect(decorative).not.toContain('aria-label')
})

test('a shipped card shows its bean, its word and from → actual (target)', () => {
  const proven = renderToStaticMarkup(
    <CardResult
      card={card({
        ...shipped,
        verdict: 'proven',
        verdict_actual: 72,
        verdict_evidence: 'north-star:invoices_paid_on_time@2026-11-04',
        verdict_at: '2026-11-04',
      })}
    />
  )
  expect(proven).toContain('data-kind="proven"')
  expect(proven).toContain('<b>Proven</b>')
  expect(proven).toContain('61 → 72 (target 70)')
  // The word is visible beside it, so the bean is decorative here: a screen reader hears "Proven" once.
  expect(proven).toContain('aria-hidden="true"')
  expect(proven).not.toContain('aria-label')

  const growing = renderToStaticMarkup(<CardResult card={card(shipped)} />)
  expect(growing).toContain('data-kind="growing"')
  expect(growing).toContain('<b>Growing</b>')
  expect(growing).toContain('61 → 70 · read 1 Jan')

  const disproven = renderToStaticMarkup(
    <CardResult
      card={card({ ...shipped, verdict: 'disproven', verdict_actual: 43, verdict_evidence: 'ab:reminders' })}
    />
  )
  expect(disproven).toContain('<b>Disproven</b>')
  const unclear = renderToStaticMarkup(
    <CardResult
      card={card({ ...shipped, verdict: 'unclear', verdict_evidence: 'traffic too low (n = 18)' })}
    />
  )
  expect(unclear).toContain('<b>Unclear</b>')
  expect(unclear).toContain('traffic too low (n = 18)')
})

test('no target, no bean: the epics shipped before the record show nothing new', () => {
  expect(renderToStaticMarkup(<CardResult card={card({ slug: 'old', status: 'Shipped' })} />)).toBe('')
  expect(renderToStaticMarkup(<CardResult card={card(null)} />)).toBe('')
})
