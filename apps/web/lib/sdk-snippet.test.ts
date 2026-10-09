import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sdkClientLine, sdkQuickstart, SDK_API_KEY_ENV } from './sdk-snippet.ts'

test('on goldenfrijoles.com the client is one line with no baseUrl', () => {
  assert.equal(
    sdkClientLine('https://goldenfrijoles.com/'),
    `const engine = createGrowthEngineClient({ apiKey: process.env.${SDK_API_KEY_ENV} })`
  )
})

test('anywhere else the snippet names baseUrl, so a preview copy never reaches production', () => {
  assert.match(sdkClientLine('https://preview.example'), /baseUrl: 'https:\/\/preview\.example', apiKey/)
  assert.match(sdkClientLine('http://localhost:3000'), /baseUrl: 'http:\/\/localhost:3000'/)
})

test('the quickstart identifies after sign-in and ends with the page\'s own calls', () => {
  const text = sdkQuickstart('https://goldenfrijoles.com', ["await engine.track('signup')"])
  assert.match(text, /engine\.identify\(currentUser\.id\)/)
  assert.ok(text.endsWith("await engine.track('signup')"))
  assert.doesNotMatch(text, /userId:/)
})
