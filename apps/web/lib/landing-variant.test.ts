// landing-launch-experiment D3, D5, D11 — the landing A/B's small rules.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ACQUISITION_VARIANT_COOKIE,
  forcedVariant,
  isLikelyBot,
  parseAcquisitionVariant,
  variantLetter,
} from './landing-variant.ts'

test('the letter follows the answer: B only when the flag served true', () => {
  assert.equal(variantLetter({ b: true }), 'b')
  assert.equal(variantLetter({ b: false }), 'a')
  assert.equal(ACQUISITION_VARIANT_COOKIE, 'gb_variant')
})

test('a workspace records a or b, and nothing else a cookie might carry (D5)', () => {
  assert.equal(parseAcquisitionVariant('a'), 'a')
  assert.equal(parseAcquisitionVariant('b'), 'b')
  for (const raw of [undefined, null, '', 'A', 'c', 'b ', 1, ['b']])
    assert.equal(parseAcquisitionVariant(raw), null)
})

test('crawlers, previews and scripts are bots; real browsers are not (rabbit hole 5)', () => {
  const browsers = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  ]
  const bots = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/130.0.0.0 Safari/537.36',
    'facebookexternalhit/1.1',
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'curl/8.7.1',
    'python-requests/2.32.3',
    'node',
    '',
    null,
    undefined,
  ]
  for (const ua of browsers) assert.equal(isLikelyBot(ua), false, ua)
  for (const ua of bots) assert.equal(isLikelyBot(ua), true, String(ua))
})

test('?variant= forces the tree off production only (D11)', () => {
  assert.equal(forcedVariant('b', 'preview'), 'b')
  assert.equal(forcedVariant('a', undefined), 'a')
  assert.equal(forcedVariant(['b', 'a'], 'preview'), 'b')
  assert.equal(forcedVariant('b', 'production'), null)
  assert.equal(forcedVariant('x', 'preview'), null)
  assert.equal(forcedVariant(undefined, 'preview'), null)
})
