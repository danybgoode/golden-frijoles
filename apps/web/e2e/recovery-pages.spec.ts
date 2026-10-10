import { test, expect } from '@playwright/test'

test('an unknown browser page remains an HTTP 404 with a recovery path', async ({ request }) => {
  const response = await request.get('/this-page-does-not-exist', { headers: { Accept: 'text/html' } })
  expect(response.status()).toBe(404)
  const body = await response.text()
  expect(body).toContain('This bean wandered off.')
  expect(body).toContain('href="/"')
})
