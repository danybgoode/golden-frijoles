import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  READ_CAP_DAYS,
  READ_DEFAULT_DAYS,
  RESULT_VERDICTS,
  epicResult,
  epicResultsFromArtifact,
  readsDue,
  resultLine,
} from './roadmap-result.ts'
import { ROADMAP_VERDICTS } from './roadmap-artifact-schema.ts'

// App code does not import `scripts/` (lock D19's precedent, `hub-board.test.ts`), so the pins read the source.
const scriptsLib = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'scripts', 'lib')
const source = (file: string) => readFileSync(join(scriptsLib, file), 'utf8')
const constant = (src: string, name: string) =>
  Number(src.match(new RegExp(`export const ${name} = (\\d+);`))?.[1])

// result-record · Story 1.3 (D7) — the target and verdict off the roadmap artifact.

const epic = (over: Record<string, unknown> = {}) => ({
  grain: 'Epic',
  slug: 'overdue-reminders',
  name: 'Overdue reminders',
  status: 'Shipped',
  target_metric: 'invoices_paid_on_time',
  target_from: 61,
  target_to: 70,
  read_date: '2026-11-04',
  ...over,
})

test('the copies agree with the scripts: the day rule and the verdict words', () => {
  const dates = source('result-dates.mjs')
  assert.equal(READ_DEFAULT_DAYS, constant(dates, 'READ_DEFAULT_DAYS'))
  assert.equal(READ_CAP_DAYS, constant(dates, 'READ_CAP_DAYS'))
  const m = source('roadmap-contract.mjs').match(/export const VERDICTS = \[([^\]]+)\]/)
  assert.ok(m, 'VERDICTS not found in scripts/lib/roadmap-contract.mjs')
  assert.deepEqual(
    [...ROADMAP_VERDICTS],
    [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  )
})

test('a read verdict: the bean is the verdict, the line is from → actual (target)', () => {
  const r = epicResult(
    epic({
      verdict: 'proven',
      verdict_actual: 72,
      verdict_evidence: 'north-star:invoices_paid_on_time@2026-11-04',
      verdict_at: '2026-11-04',
    }),
    { today: '2026-11-05' }
  )
  assert.equal(r.bean, 'proven')
  assert.equal(r.readDue, false)
  assert.equal(resultLine(r), '61 → 72 (target 70)')
  const late = epicResult(
    epic({ verdict: 'disproven', verdict_actual: 43.5, verdict_at: '2027-02-01', read_late: true })
  )
  assert.equal(resultLine(late), '61 → 43.5 (target 70) · read late')
  const unclear = epicResult(epic({ verdict: 'unclear', verdict_evidence: 'traffic too low (n = 18)' }))
  assert.equal(resultLine(unclear), 'traffic too low (n = 18)')
})

test('growing until read; due on the read date; never due before shipping or without a target', () => {
  const before = epicResult(epic(), { today: '2026-11-03' })
  assert.equal(before.bean, 'growing')
  assert.equal(before.readDue, false)
  assert.equal(resultLine(before), '61 → 70 · read 4 Nov')
  const due = epicResult(epic(), { today: '2026-11-04' })
  assert.equal(due.readDue, true)
  assert.equal(resultLine(due), '61 → 70 · read due')
  assert.equal(epicResult(epic({ status: 'In progress' }), { today: '2027-01-01' }).readDue, false)
  assert.equal(epicResult(epic({ status: 'In progress' })).bean, null)
  const none = epicResult(epic({ target_metric: null, target_from: null, target_to: null, read_date: null }))
  assert.equal(none.bean, null, 'a shipped epic with no target shows no bean')
  assert.equal(resultLine(none), null)
})

test('a derived read date says so; grounded only when the caller names the inputs', () => {
  const r = epicResult(epic({ read_date: '2026-11-03', read_date_derived: true }))
  assert.equal(r.readDateDerived, true)
  assert.equal(r.grounded, null)
  assert.equal(epicResult(epic(), { inputKeys: ['invoices_paid_on_time'] }).grounded, true)
  assert.equal(epicResult(epic({ target_metric: 'happier users' }), { inputKeys: ['x'] }).grounded, false)
})

test('bad values from someone else’s push read as absent, never as a verdict', () => {
  const r = epicResult(epic({ verdict: 'provn', verdict_actual: 'lots', read_date: '4 Nov' }))
  assert.equal(r.verdict, null)
  assert.equal(r.actual, null)
  assert.equal(r.readDate, null)
  assert.deepEqual(epicResultsFromArtifact(null), [])
  assert.deepEqual(epicResultsFromArtifact({ items: 'x' }), [])
})

test('readsDue lists only due epics, oldest read date first', () => {
  const payload = {
    items: [
      epic({ slug: 'b', read_date: '2026-11-04' }),
      epic({ slug: 'a', read_date: '2026-10-20' }),
      epic({ slug: 'read', read_date: '2026-10-01', verdict: 'proven', verdict_actual: 72 }),
      epic({ slug: 'later', read_date: '2026-12-01' }),
      { grain: 'Sprint', slug: 'a--s1', status: 'Shipped', target_metric: 'x', read_date: '2026-01-01' },
    ],
  }
  assert.deepEqual(
    readsDue(payload, '2026-11-05').map((r) => r.slug),
    ['a', 'b']
  )
})

test('impossible days are absent, not due (codex review, #290)', () => {
  const r = epicResult(epic({ read_date: '2026-02-30' }), { today: '2026-12-01' })
  assert.equal(r.readDate, null)
  assert.equal(r.readDue, false)
})

test('evidence becomes a link only when it is an https URL (security lens, #290)', () => {
  const read = (verdict_evidence: string) =>
    epicResult(epic({ verdict: 'proven', verdict_actual: 72, verdict_evidence })).evidenceHref
  assert.equal(read('https://example.com/r/12'), 'https://example.com/r/12')
  assert.equal(read('javascript:alert(1)'), null)
  assert.equal(read('http://example.com'), null)
  assert.equal(read('north-star:x@2026-11-04'), null)
  assert.equal(read('https://'), null)
})

test('a partial target is no target: no bean, never due (codex review, #290)', () => {
  const r = epicResult(epic({ target_from: null, target_to: null }), { today: '2027-01-01' })
  assert.equal(r.bean, null)
  assert.equal(r.readDue, false)
})
