// traffic-relaunch D5 — a visit's source survives only as clean, short tags; anything else is dropped.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { referrerHost, sanitizeSource } from './visit-source.ts'

const OWN = 'goldenfrijoles.com'

test('utm params become tags, and utm_source is the source', () => {
  assert.deepEqual(
    sanitizeSource(
      { utm_source: 'TikTok', utm_medium: 'video', utm_campaign: 'relaunch', utm_content: 'postmortem-1' },
      OWN
    ),
    {
      utm_source: 'tiktok',
      utm_medium: 'video',
      utm_campaign: 'relaunch',
      utm_content: 'postmortem-1',
      source: 'tiktok',
    }
  )
})

test('with no utm, the referring host is the source', () => {
  assert.deepEqual(sanitizeSource({ referrer: 'https://www.google.com/search?q=x' }, OWN), {
    ref_host: 'google.com',
    source: 'google.com',
  })
})

test('our own host, a missing referrer or junk is a direct visit', () => {
  for (const raw of [
    {},
    null,
    'nope',
    { referrer: 'https://goldenfrijoles.com/methodology' },
    { referrer: 'https://www.goldenfrijoles.com/' },
    { referrer: 'javascript:alert(1)' },
    { referrer: 'not a url' },
  ])
    assert.deepEqual(sanitizeSource(raw, OWN), { source: 'direct' }, JSON.stringify(raw))
})

test('a value that is too long or carries other characters is dropped, never stored', () => {
  const tags = sanitizeSource(
    {
      utm_source: '<script>',
      utm_medium: 'x'.repeat(65),
      utm_campaign: 'ok_1',
      utm_content: 'a b',
      evil: 'y',
    },
    OWN
  )
  assert.deepEqual(tags, { utm_campaign: 'ok_1', source: 'direct' })
  assert.equal(JSON.stringify(tags).includes('evil'), false)
})

test('referrerHost keeps only the host', () => {
  assert.equal(referrerHost('https://news.ycombinator.com/item?id=1', OWN), 'news.ycombinator.com')
  assert.equal(referrerHost('https://sub.goldenfrijoles.com/x', OWN), undefined)
  assert.equal(referrerHost(42, OWN), undefined)
})
