import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseSatisfactionAnswer, shouldAskSatisfaction } from './satisfaction-ask.ts'

test('satisfied-ask S1.4: the ask shows only with the switch on, a trend on screen, and no answer yet', () => {
  const ask = (gateOn: boolean, trendShown: boolean, answeredCookie?: string) =>
    shouldAskSatisfaction({ gateOn, trendShown, answeredCookie })
  assert.equal(ask(true, true), true)
  assert.equal(ask(false, true), false, 'switch off: never asked')
  assert.equal(ask(true, false), false, 'no trend on screen: nothing to rate')
  assert.equal(ask(true, true, '4'), false, 'answered in this browser')
  assert.equal(ask(true, true, 'dismissed'), false, 'declined in this browser')
})

test('satisfied-ask S1.4: only what the buttons send is an answer', () => {
  assert.deepEqual(['1', '3', '5', 4, 'dismissed'].map(parseSatisfactionAnswer), [1, 3, 5, 4, 'dismissed'])
  for (const bad of ['0', '6', '4.5', ' 4', '', null, undefined, 4.5, 'not now'])
    assert.equal(parseSatisfactionAnswer(bad), null, String(bad))
})
