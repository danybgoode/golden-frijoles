// The css-module shim must load before anything that could import a CSS module (see its own header).
import './helpers/css-module-shim'

import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  extractSignature,
  signatureArgs,
  diffSignature,
  type Signature,
} from '@/design-system/state-contract-core.mjs'
import { EmptyHorizon } from '../app/hub/[projectSlug]/horizon/horizon-components'

// many-products · Sprint 3, Story 3.2 — the horizon of a product that has pushed no destinations, against its approved
// surface `hub-horizon-empty` (`design-system/surfaces/hub-horizon-empty.surface`).
//
// The authed tenant always has a pushed horizon (auth.setup.ts), so the empty state is rendered with the page's own
// component and measured with the gate's own extractor — the same pair of functions as `hub-board-empty`
// (hub-board.authed.spec.ts), a different source of markup.
//
// ⚠️ The state is in STATE-CONTRACT.json only once the product owner has approved it (a line in APPROVED.md →
// `## Approved surfaces`) and `node apps/web/design-system/state-contract.mjs` has been re-run. Until then this test is
// SKIPPED, loudly, with that reason — not green on nothing.

const CONTRACT = JSON.parse(
  readFileSync(join(__dirname, '..', 'design-system', 'STATE-CONTRACT.json'), 'utf8')
) as { states: Record<string, Signature> }

test('the empty horizon matches the approved hub-horizon-empty state', async ({ page }) => {
  test.skip(
    !CONTRACT.states['hub-horizon-empty'],
    'hub-horizon-empty is not in STATE-CONTRACT.json yet: its approval by the product owner is owed (APPROVED.md → Approved surfaces)'
  )
  await page.goto('/login') // any page of ours, for the design-system stylesheet's scope classes
  await page.setContent(
    `<div class="ds"><main>${renderToStaticMarkup(createElement(EmptyHorizon))}</main></div>`
  )
  const built = await page.evaluate(extractSignature, signatureArgs('product'))
  const differences = diffSignature(CONTRACT.states['hub-horizon-empty'], built)
  expect(differences, differences.join('\n')).toEqual([])
})
