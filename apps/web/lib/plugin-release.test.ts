// account-from-the-terminal · Sprint 1, Story 1.1 — install.md's release and sums are the repo's, never hand-typed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// @ts-expect-error — a root .mjs script with no type declarations
import { renderPluginRelease } from '../../../scripts/render-plugin-release.mjs'

test('plugin-release.generated.ts matches skills/SHA256SUMS and the versions it names', () => {
  const current = readFileSync(join(import.meta.dirname, 'plugin-release.generated.ts'), 'utf8')
  assert.equal(current, renderPluginRelease(), 'stale — run: node scripts/render-plugin-release.mjs')
})
