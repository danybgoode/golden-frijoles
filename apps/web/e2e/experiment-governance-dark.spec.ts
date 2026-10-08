import { test, expect } from '@playwright/test'
import { createGrowthEngineClient } from '@golden-frijoles/sdk'
import { isExperimentGovernanceEnabled } from './helpers/gates'

test('governance management is nonexistent while OFF and legacy experiments remain unchanged', async ({
  request,
}) => {
  test.skip(
    isExperimentGovernanceEnabled(),
    'dedicated dark-path pass requires EXPERIMENT_GOVERNANCE_ENABLED=false'
  )

  expect((await request.get('/app/experiments/golden-frijoles')).status()).toBe(404)
  // Legacy compare still authenticates normally; it is not hidden by the governance gate.
  expect(
    (
      await request.get('/api/v1/experiments/legacy-experiment/compare?metricEvent=checkout_completed')
    ).status()
  ).toBe(401)
  // The new version-explicit analysis seam disappears before authentication while the same
  // route's legacy metric comparison above remains available.
  expect((await request.get('/api/v1/experiments/legacy-experiment/compare?version=1')).status()).toBe(404)
  // result-record S3 (fresh review, #293): the CLI's decision read is a governed seam too — gone before authentication.
  const decision = await request.get('/api/v1/cli/experiments/decision?project=golden-frijoles&experiment=x')
  expect(decision.status()).toBe(404)
  expect((await decision.json()).code).toBe('disabled')
  const local = createGrowthEngineClient({
    baseUrl: 'http://unused.invalid',
    apiKey: 'unused',
    userId: 'legacy-dark-user',
  })
  expect(local.bucket('legacy-experiment', [{ key: 'control' }, { key: 'treatment' }]).ok).toBe(true)
  expect((await request.get('/llms.txt')).status()).toBe(200)
})
