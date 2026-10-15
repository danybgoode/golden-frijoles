import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseRoadmapPush, type RoadmapRow } from './roadmap-artifact-schema.ts'
import { toCard } from './hub-board.ts'

// funnel-truth D13 (verifier, #379) — the segment a README names reaches the board along the REAL path: the extractor's
// betFields → the push schema → the board card. A spec that hand-builds the pushed row skips the extractor, which is
// exactly where a named segment was being turned into null (and then read as everyone).

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..')

test('a README’s target_segment survives extract → push → board; absent reads as everyone', async () => {
  const ext = (await import(pathToFileURL(join(REPO, 'scripts/roadmap-extract.mjs')).href)) as {
    betFields: (fm: Record<string, unknown>) => Record<string, unknown>
  }
  const card = (fm: Record<string, unknown>) => {
    const item = {
      name: 'Aimed',
      slug: 'aimed',
      grain: 'Epic',
      status: 'Building',
      stage: 'Building',
      area: '01 Growth Engine',
      flag_key: 'checkout.one_step_enabled',
      ...ext.betFields({ adopted_event: 'order_placed', ...fm }),
    }
    const parsed = parseRoadmapPush({
      schemaVersion: 1,
      generatedAt: '2026-10-15T00:00:00.000Z',
      source: { commit: 'abc1234', ref: 'main' },
      items: [item],
    })
    assert.equal(parsed.ok, true, JSON.stringify(parsed))
    if (!parsed.ok) throw new Error('push refused')
    return toCard(parsed.value.items[0] as RoadmapRow)
  }
  assert.equal(card({ target_segment: 'power-users' })?.measure?.targetSegment, 'power-users')
  assert.equal(card({})?.measure?.targetSegment, 'everyone')
})
