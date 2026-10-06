// golden-frijoles-plugin · Sprint 3, Story 3.3 — a sanity floor on the one string every install
// surface renders; account-from-the-terminal D2 made it a function of the site URL and moved the
// cross-repo weld HERE.
//
// ── The weld ────────────────────────────────────────────────────────────────────────────────────
// `skills/` (mirrored to golden-frijoles/skills) transcribes the prompt in
// `template/scripts/lib/golden-onboarding.mjs`, against the PRODUCTION URL, and that repo's own
// `check-onboarding-parity.mjs` holds its README and umbrella SKILL.md to the transcription. What
// that repo cannot see is THIS file — a template cannot import a product's web app. The reverse is
// free: both live in this monorepo, so this test imports the transcription and asserts it equals
// `installPrompt(PRODUCTION_SITE_URL)`. A one-word edit on either side, without the other, goes red.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  installPrompt,
  PRODUCTION_SITE_URL,
  PLUGIN_INSTALL,
  PLUGIN_MARKETPLACE_ADD,
  SKILLS_ADD,
} from './install-prompt.ts'
// @ts-expect-error — a plain .mjs module with no type declarations; only its string export is read.
import { INSTALL_PROMPT as SKILLS_TRANSCRIPTION } from '../../../skills/template/scripts/lib/golden-onboarding.mjs'

test('the skills repo transcribes the production prompt, byte for byte', () => {
  assert.equal(SKILLS_TRANSCRIPTION, installPrompt(PRODUCTION_SITE_URL))
})

test('the prompt sends the agent to install.md FIRST and makes it wait', () => {
  const prompt = installPrompt('https://example.test')
  assert.match(prompt, /1\. Read https:\/\/example\.test\/install\.md before installing anything\./)
  assert.match(prompt, /wait for my go-ahead/)
  // The order is the whole point: read, summarise, wait, THEN install.
  assert.ok(prompt.indexOf('install.md') < prompt.indexOf('3. Install it'))
})

test('the only URL in the prompt is the site it was built for', () => {
  const urls = installPrompt('https://example.test').match(/https?:\/\/\S+/g) ?? []
  assert.deepEqual(urls, ['https://example.test/install.md'])
})

test('the plugin commands are the published names', () => {
  assert.equal(PLUGIN_MARKETPLACE_ADD, 'claude plugin marketplace add golden-frijoles/skills')
  assert.equal(PLUGIN_INSTALL, 'claude plugin install golden-frijoles@golden-frijoles')
  // Every skill, not just the umbrella: with `--skill golden-frijoles` alone only the umbrella installs and its
  // hand-off to groom dead-ends (measured, golden-frijoles-plugin X12).
  assert.equal(SKILLS_ADD, "npx skills add golden-frijoles/skills --skill '*'")
})
