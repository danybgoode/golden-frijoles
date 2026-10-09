// setup-instruments-connects D5 — the first-event kill switch, OFF. This spec has a dedicated CI pass against the server
// whose gates are all off (ci/gates.off.env); in the normal ON suite it skips.
import { test, expect } from '@playwright/test'
import { isFirstEventBandEnabled } from './helpers/gates'

test('with the first-event switch off, the status route does not exist, before any credential is asked for', async ({
  request,
}) => {
  test.skip(isFirstEventBandEnabled(), 'dedicated dark-path pass requires FIRST_EVENT_BAND_ENABLED=false')
  // No Authorization on purpose: the gate runs before auth, so a 401 here would mean the order changed.
  const res = await request.get('/api/v1/cli/status?project=project-one')
  expect(res.status()).toBe(404)
  expect(((await res.json()) as { code: string }).code).toBe('disabled')
})
