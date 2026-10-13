// scenarios-light-up S2.2 (D7) — our site's two drill-target routes say nothing to anyone but the drill: without the
// token and the probe secret (CI sets neither) both are a plain 404, in either switch state. The signed sequence is
// lib/scenario-probe.test.ts's; the ownership answer is scenario-owner-target-check.spec.ts's.
import { test, expect } from '@playwright/test'

test('the probe is a plain 404 to an unsigned, wrongly signed or non-synthetic request', async ({
  request,
}) => {
  const attempts: Array<Record<string, string>> = [
    {},
    { authorization: 'Bearer nope' },
    { authorization: `Bearer ${'x'.repeat(40)}` },
  ]
  for (const headers of attempts) {
    const response = await request.post('/api/internal/resilience/probe', {
      headers,
      data: { subject: 'synthetic:spec' },
    })
    expect(response.status()).toBe(404)
    expect(await response.text()).toBe('')
  }
  expect((await request.get('/api/internal/resilience/probe')).status()).toBe(405)
})

test('the ownership route is a plain 404 with no token configured, and never a proof', async ({
  request,
}) => {
  const response = await request.post('/api/internal/resilience/ownership', {
    headers: { 'x-golden-beans-ownership-request': 'a'.repeat(64) },
    data: {
      contractVersion: 2,
      challenge: 'b'.repeat(64),
      targetKey: 'site.probe',
      origin: 'https://goldenfrijoles.com',
    },
  })
  expect(response.status()).toBe(404)
  expect(response.headers()['x-golden-beans-ownership-proof']).toBeUndefined()
})
