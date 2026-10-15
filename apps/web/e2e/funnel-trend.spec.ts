// funnel-truth S1.2 (D3) — the trend's bounded read against real PostgREST. Each of the three reads is cut on its own
// (a spec-only cap per read) and the periods that cut could have touched come back `unreadable` with the reason, never
// short; the rest still read. The read module takes its client as a parameter, so this drives it with the service key.
import { test, expect } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { readFunnelTrend } from '../lib/flag-funnel-read'
import type { FunnelMeasure, TrendPeriod } from '../lib/flag-funnel'
import { specWorkspaceId } from './helpers/spec-workspace'

function db() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

const FLAG = 'checkout.trend_enabled'
const source = { kind: 'flag', flagKey: FLAG } as const
const measure: FunnelMeasure = {
  adoptedEvent: 'order_placed',
  retainedEvent: null,
  retentionDays: 7,
  satisfiedEvent: null,
}
const now = new Date('2026-10-15T12:00:00Z')
const day = (d: string) => `${d}T10:00:00Z`

type Seed = { user: string; event: string; at: string; on?: boolean }
async function project(client: SupabaseClient, rows: Seed[]): Promise<string> {
  const { data, error } = await client
    .from('projects')
    .insert({
      slug: `trend-spec-${randomBytes(4).toString('hex')}`,
      api_key_hash: null,
      workspace_id: await specWorkspaceId(client, 'trend'),
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`could not create a project: ${error?.message}`)
  const id = data.id as string
  const { error: seeded } = await client.from('events').insert(
    rows.map((r) => ({
      project_id: id,
      user_id: r.user,
      event: r.event,
      created_at: day(r.at),
      tags: r.on ? { flag_key: FLAG, variant: 'on' } : {},
      ...(r.on ? { feature_id: FLAG } : {}),
    }))
  )
  if (seeded) throw new Error(`could not seed events: ${seeded.message}`)
  return id
}
const on = (user: string, at: string): Seed => ({ user, event: 'flag_evaluated', at, on: true })
const order = (user: string, at: string): Seed => ({ user, event: 'order_placed', at })
const seen = (user: string, at: string): Seed => ({ user, event: 'page_viewed', at })

const shape = (periods: TrendPeriod[]) =>
  periods.map((p) =>
    p.state === 'read' ? [p.label, p.funnel.exposed, p.funnel.adopted] : [p.label, 'unreadable']
  )

test('funnel-truth D3: a whole life reads one row per month, gaps as zeros, the newest maturing', async () => {
  const client = db()
  const id = await project(client, [
    on('a', '2026-07-03'),
    order('a', '2026-07-04'),
    on('b', '2026-09-02'),
    on('c', '2026-10-01'),
  ])
  const read = await readFunnelTrend(client, id, source, measure, 'month', now)
  expect(read.state).toBe('measured')
  if (read.state !== 'measured') return
  expect(shape(read.periods)).toEqual([
    ['2026-07', 1, 1],
    ['2026-08', 0, 0],
    ['2026-09', 1, 0],
    ['2026-10', 1, 0],
  ])
  expect(read.periods.map((p) => p.maturing)).toEqual([false, false, false, true])
  const weeks = await readFunnelTrend(client, id, source, measure, 'week', now)
  expect(weeks.state === 'measured' && weeks.periods[0].label).toBe('2026-06-29')
  const none = await readFunnelTrend(client, id, { kind: 'flag', flagKey: 'never.on' }, measure, 'month', now)
  expect(none.state).toBe('not_exposed')
})

test('funnel-truth D3: exposures cut at T — every period ending after T is unreadable, earlier ones still read', async () => {
  const client = db()
  const id = await project(client, [
    on('a', '2026-07-01'),
    on('b', '2026-07-02'),
    on('c', '2026-08-10'),
    on('d', '2026-09-05'),
  ])
  const read = await readFunnelTrend(client, id, source, measure, 'month', now, { rowCap: { exposures: 3 } })
  if (read.state !== 'measured') throw new Error(read.state)
  expect(shape(read.periods)).toEqual([
    ['2026-07', 2, 0],
    ['2026-08', 'unreadable'],
    ['2026-09', 'unreadable'],
    ['2026-10', 'unreadable'],
  ])
  const cut = read.periods[1]
  expect(cut.state === 'unreadable' && cut.reason).toContain('after 2026-08-10')
  expect('funnel' in cut).toBe(false) // never a short number
})

test('funnel-truth D3: the measure’s events cut — every cohort is unreadable, since each is followed to now', async () => {
  const client = db()
  const id = await project(client, [
    on('a', '2026-08-01'),
    order('a', '2026-08-02'),
    on('b', '2026-09-01'),
    order('b', '2026-09-02'),
  ])
  const read = await readFunnelTrend(client, id, source, measure, 'month', now, { rowCap: { events: 1 } })
  if (read.state !== 'measured') throw new Error(read.state)
  expect(shape(read.periods)).toEqual([
    ['2026-08', 'unreadable'],
    ['2026-09', 'unreadable'],
    ['2026-10', 'unreadable'],
  ])
  expect(
    read.periods.every((p) => p.state === 'unreadable' && /adoption and retention events/.test(p.reason))
  ).toBe(true)
})

test('funnel-truth D3: the base cut at T (newest first) — every period starting at or before T is unreadable', async () => {
  const client = db()
  const id = await project(client, [
    on('a', '2026-07-01'),
    seen('x', '2026-07-05'),
    seen('y', '2026-07-06'),
    seen('z', '2026-08-20'),
    on('b', '2026-10-01'),
    order('b', '2026-10-03'),
  ])
  const read = await readFunnelTrend(client, id, source, measure, 'month', now, { rowCap: { base: 3 } })
  if (read.state !== 'measured') throw new Error(read.state)
  expect(shape(read.periods)).toEqual([
    ['2026-07', 'unreadable'],
    ['2026-08', 'unreadable'],
    ['2026-09', 0, 0],
    ['2026-10', 1, 1],
  ])
  const oct = read.periods[3]
  expect(oct.state === 'read' && oct.funnel.base).toBe(1)
  const jul = read.periods[0]
  expect(jul.state === 'unreadable' && jul.reason).toContain('before 2026-08-20')
})
