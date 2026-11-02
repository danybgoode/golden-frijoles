import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deployEnv, isDeployed, isUndeclared } from './deploy-env.ts'

test('DEPLOY_ENV decides, VERCEL_ENV falls back, development otherwise', () => {
  assert.equal(deployEnv({ DEPLOY_ENV: 'production' }), 'production')
  assert.equal(deployEnv({ VERCEL_ENV: 'production' }), 'production')
  assert.equal(deployEnv({ VERCEL_ENV: 'preview' }), 'preview')
  assert.equal(deployEnv({ DEPLOY_ENV: 'preview', VERCEL_ENV: 'production' }), 'preview')
  assert.equal(deployEnv({ DEPLOY_ENV: 'production', VERCEL_ENV: 'preview' }), 'production')
  assert.equal(deployEnv({}), 'development')
  assert.equal(deployEnv({ DEPLOY_ENV: ' production ' }), 'production')
})

test('an unknown or blank value never becomes production', () => {
  assert.equal(deployEnv({ DEPLOY_ENV: 'prod' }), 'development')
  assert.equal(deployEnv({ DEPLOY_ENV: 'Production' }), 'development')
  assert.equal(deployEnv({ DEPLOY_ENV: 'prod', VERCEL_ENV: 'production' }), 'development')
  assert.equal(deployEnv({ DEPLOY_ENV: '   ', VERCEL_ENV: 'production' }), 'production')
  assert.equal(deployEnv({ VERCEL_ENV: 'staging' }), 'development')
})

test('isDeployed: Vercel, or a DEPLOY_ENV naming a deployment', () => {
  assert.equal(isDeployed({ VERCEL: '1' }), true)
  assert.equal(isDeployed({ DEPLOY_ENV: 'production' }), true)
  assert.equal(isDeployed({ DEPLOY_ENV: 'preview' }), true)
  assert.equal(isDeployed({ DEPLOY_ENV: 'development' }), false)
  assert.equal(isDeployed({ DEPLOY_ENV: 'prod' }), false)
  assert.equal(isDeployed({}), false)
  // VERCEL_ENV alone was never the "on Vercel" signal (VERCEL=1 was); a hand-set VERCEL_ENV in CI keeps CI overridable.
  assert.equal(isDeployed({ VERCEL_ENV: 'production' }), false)
})

test('isUndeclared: only when neither variable says anything', () => {
  assert.equal(isUndeclared({}), true)
  assert.equal(isUndeclared({ DEPLOY_ENV: '' }), true)
  assert.equal(isUndeclared({ DEPLOY_ENV: 'development' }), false)
  assert.equal(isUndeclared({ VERCEL_ENV: 'preview' }), false)
})
