import { expect, test } from '@playwright/test'

// ci-diet S3.1 proof: S2's mutation (a), re-run on the S3 branch, must upload a trace.zip. Scratch PR, closed after.
test('gate mutation (a): this fails on purpose', async ({ request }) => {
  const res = await request.get('/llms.txt')
  expect(res.status()).toBe(418)
})
