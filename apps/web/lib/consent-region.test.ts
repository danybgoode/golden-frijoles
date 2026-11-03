// traffic-relaunch D2 — the banner asks first in the opt-in regions and for anything unknown; nowhere else.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  OPT_IN_COUNTRIES,
  consentMode,
  consentRequiredFromCookie,
  readConsentRegionCookie,
} from './consent-region.ts'

test('every opt-in region asks first', () => {
  for (const c of ['DE', 'FR', 'ES', 'IT', 'IE', 'SE', 'PL', 'NO', 'IS', 'LI', 'GB', 'CH', 'BR', 'CA'])
    assert.equal(consentMode(c), 'ask', c)
  assert.equal(OPT_IN_COUNTRIES.size, 27 + 3 + 4)
})

test('elsewhere analytics load without the banner', () => {
  for (const c of ['MX', 'US', 'JP', 'AR', 'IN', 'AU']) assert.equal(consentMode(c), 'load', c)
  assert.equal(consentMode(' mx '), 'load', 'trimmed and case-folded')
})

test('anything that is not a known country fails closed', () => {
  for (const c of [null, undefined, '', 'XX', 'T1', 'x', 'MEX', '12', 'M1', 'de;load'])
    assert.equal(consentMode(c), 'ask', String(c))
})

test('only the exact cookie value "load" skips the banner', () => {
  assert.equal(consentRequiredFromCookie('load'), false)
  for (const v of [null, undefined, '', 'ask', 'LOAD', 'load ', 'yes', 'true'])
    assert.equal(consentRequiredFromCookie(v), true, String(v))
})

test('the cookie is read by exact name', () => {
  assert.equal(readConsentRegionCookie('gb_vid=abc; gf_cr=load; x=1'), 'load')
  assert.equal(readConsentRegionCookie('gf_cr=ask'), 'ask')
  assert.equal(readConsentRegionCookie('xgf_cr=load; gf_crx=load'), null)
  assert.equal(readConsentRegionCookie(''), null)
  assert.equal(readConsentRegionCookie(null), null)
})
