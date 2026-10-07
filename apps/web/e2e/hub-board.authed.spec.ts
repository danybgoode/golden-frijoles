// The css-module shim must load before anything that could import a CSS module (see its own header).
import './helpers/css-module-shim'

import { test, expect } from '@playwright/test'
import { ROADMAP_SCHEMA_VERSION } from '@/lib/roadmap-artifact-schema'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readTenantRecord } from './helpers/authed-fixture'
import {
  extractSignature,
  signatureArgs,
  diffSignature,
  type Signature,
} from '@/design-system/state-contract-core.mjs'
import { EmptyBoard } from '../app/hub/[projectSlug]/board/board-components'

// board-sinks-and-scrumban · Sprint 2 — the Board tab, signed in, against its approved surfaces.
//
// The visual gate (`console-visual.authed.spec.ts`) measures the ROUTE against `hub-board` — one state per manifest
// row. The route has one more approved state, the empty board (`hub-board-empty`), measured here with the gate's own
// functions. The card view (`hub-board-card`) retired into the epic page (one-epic-page D4); its copy-button check
// moved with it, below, because "copies the exact text" is still the acceptance.

const CONTRACT = JSON.parse(
  readFileSync(join(__dirname, '..', 'design-system', 'STATE-CONTRACT.json'), 'utf8')
) as { states: Record<string, Signature> }

function slug(): string {
  const record = readTenantRecord()
  if (!record?.slug) throw new Error('the board spec needs the auth-setup project')
  return record.slug
}

test('the board: six columns in order, the answer names the next pull, filters live in the URL', async ({
  page,
}) => {
  await page.goto(`/hub/${slug()}/board`)
  await expect(page.locator('main h1')).toHaveText('Board')
  const columns = page.locator('.ds-tiles--board > .ds-tile .ds-tile-label')
  // one-header-one-name D8 — the columns SHOW the decision-2 words; `data-stage` keeps the stored key, and the cards
  // below are the same cards (no key was renamed, so no column emptied).
  await expect(columns).toHaveText(['Backlog', 'Grooming', 'Ready', 'Building', 'QA', 'Shipped'])
  await expect(page.locator('.ds-tiles--board > .ds-tile').first()).toHaveAttribute('data-stage', 'To groom')
  await expect(page.locator('.ds-answer')).toContainText('Next to pull: An idea nobody has bet on yet.')
  // one-header-one-name S1.2 — the board is IN the console: the header has Plan current, the Plan rail has Board current,
  // and the Hub's own bar and its "Back to the console" are gone (they were `HubFrame`'s, deleted).
  await expect(page.locator('nav[aria-label="Sections"] a[aria-current="page"]')).toHaveText('Plan')
  await expect(page.locator('nav[aria-label="Section"] a')).toHaveText(['Roadmap', 'Board', 'Horizon'])
  await expect(page.locator('nav[aria-label="Section"] a[aria-current="page"]')).toHaveText('Board')
  await expect(page.getByText('Back to the console')).toHaveCount(0)
  // A member has the rail, so the shell's no-rail fallback (D4) does not render.
  await expect(page.locator('[data-fallback-nav]')).toHaveCount(0)

  await page.getByRole('link', { name: 'Feature', exact: true }).click()
  await expect(page).toHaveURL(/\/board\?type=feature$/)
  await expect(page.getByRole('link', { name: 'Feature', exact: true })).toHaveAttribute(
    'aria-current',
    'true'
  )
  await page.reload() // a filtered board survives a reload — it is the URL
  // The fixture's four epics are Features; its two seeds carry no type, so the filter leaves exactly the epics.
  await expect(page.locator('.ds-board-card')).toHaveCount(4)
  for (const meta of await page.locator('.ds-board-card-meta').allTextContents())
    expect(meta).toContain('Feature')
})

// ── one-epic-page · Sprint 1 — every card opens ONE epic page (lock D1, D3, D4) ─────────────────────────────────────

test('an old ?card= link lands on the epic page, and Back returns to the filtered board (S1.1)', async ({
  page,
}) => {
  await page.goto(`/hub/${slug()}/board?card=fixture-unbet&type=feature&risk=high`)
  await expect(page).toHaveURL(new RegExp(`/hub/${slug()}/epic/fixture-unbet\\?type=feature&risk=high$`))
  await expect(page.locator('main h1')).toHaveText('An idea nobody has bet on yet')
  await expect(page.locator('nav[aria-label="Breadcrumb"] a')).toHaveAttribute(
    'href',
    `/hub/${slug()}/board?type=feature&risk=high`
  )
  // Without filters, the bare board — and a filter that is not one of the two is dropped, never reflected.
  await page.goto(`/hub/${slug()}/board?card=fixture-unbet&type=%22%3E%3Cscript%3E`)
  await expect(page).toHaveURL(new RegExp(`/hub/${slug()}/epic/fixture-unbet$`))
  await expect(page.locator('nav[aria-label="Breadcrumb"] a')).toHaveAttribute('href', `/hub/${slug()}/board`)
})

test('a board card opens the epic page, carrying the filters (S1.1)', async ({ page }) => {
  await page.goto(`/hub/${slug()}/board?type=feature`)
  const card = page.locator('.ds-board-card', { hasText: 'An idea nobody has bet on yet' })
  await expect(card).toHaveAttribute('href', `/hub/${slug()}/epic/fixture-unbet?type=feature`)
})

test('the epic page: chips not tiles, the track lit at its stage, one command in the Now panel (S1.2, S1.3)', async ({
  page,
}) => {
  await page.goto(`/hub/${slug()}/epic/fixture-unbet`)
  await expect(page.locator('main .ds-epic-chip--stage')).toHaveText('Ready')
  // Risk high says who merges; no tiles and no stats remain.
  await expect(page.locator('main .ds-epic-chip[data-risk="high"]')).toHaveText('Risk high · you merge')
  await expect(page.locator('main .ds-tile, main .ds-summary')).toHaveCount(0)
  // Seven steps, the current one named by aria-current, and its stored key kept beside the word.
  const steps = page.locator('main .ds-epic-track li')
  await expect(steps).toHaveText(['Backlog', 'Grooming', 'Ready', 'Building', 'QA', 'Shipped', 'Read'])
  await expect(page.locator('main .ds-epic-track li[aria-current="step"]')).toHaveAttribute(
    'data-step',
    'Ready to build'
  )
  // Exactly one command outside More, in plain words naming the step, the epic and the product.
  const now = page.getByRole('region', { name: 'Now' })
  await expect(now.locator(':scope > .ds-epic-command')).toHaveCount(1)
  await expect(now.locator(':scope > .ds-epic-command code')).toHaveText(
    `Build the fixture-unbet epic in ${slug()}`
  )
  await expect(page.locator('main')).toContainText('Every number comes from the epic')
})

test('every copy button on the epic page copies its exact text', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`/hub/${slug()}/epic/fixture-unbet`)
  const read = () => page.evaluate(() => navigator.clipboard.readText())
  // The fixture's kickoff, byte for byte (auth.setup.ts seeds exactly this).
  const KICKOFF =
    'Start by pushing the epic branch, before anything else — it is what moves this card to Building on the board:\n' +
    '`git switch -c feat/fixture-unbet origin/main && git push -u origin feat/fixture-unbet`'
  const build = `Build the fixture-unbet epic in ${slug()}`
  const expected: Record<string, string> = {
    'Copy the kickoff prompt': KICKOFF,
    [`Copy: ${build}`]: build,
  }
  const buttons = page.locator('main button[aria-label^="Copy"]')
  const names = await buttons.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''))
  // EVERY copy button on the page is pressed — and every one is accounted for, so a new button cannot slip past.
  expect(names.sort()).toEqual(Object.keys(expected).sort())
  for (const name of names) {
    await page.getByRole('button', { name, exact: true }).click()
    expect(await read(), name).toBe(expected[name])
  }
})

test('a Building epic: Resume now, the Wrap under More (S1.3)', async ({ page }) => {
  await page.goto(`/hub/${slug()}/epic/fixture-mockups`)
  const now = page.getByRole('region', { name: 'Now' })
  await expect(now).toContainText('Sprint 2 of 2: The second sprint · 1 of 3 stories done.')
  await expect(now.locator(':scope > .ds-epic-command code')).toHaveText(
    `Resume the fixture-mockups epic in ${slug()} where its last session stopped`
  )
  await now.getByText('More', { exact: true }).click()
  await expect(now.locator('details .ds-epic-command code')).toHaveText([
    `Wrap sprint 2 of the fixture-mockups epic in ${slug()}`,
  ])
  await expect(now.locator('details')).toContainText('Resume · Wrap S2')
})

test("a seed's page: the idea, no target yet, no sprints (S1.1)", async ({ page }) => {
  await page.goto(`/hub/${slug()}/epic/fixture-seed-alerts`)
  await expect(page.locator('main h1')).toHaveText('Alerting on a signal that has stopped arriving')
  await expect(page.locator('main .ds-epic-track li[aria-current="step"]')).toHaveAttribute(
    'data-step',
    'To groom'
  )
  await expect(page.locator('main')).toContainText('No target yet: that comes with grooming')
  await expect(page.locator('main')).toContainText("Sprints appear once it's groomed")
})

test('a seed with a goal still says it has no target yet (fresh review, #295)', async ({ page }) => {
  await page.goto(`/hub/${slug()}/epic/fixture-seed-digest`)
  await expect(page.locator('main .ds-answer')).toHaveText(
    'So that a founder hears about the week without opening anything.'
  )
  await expect(page.locator('main')).toContainText('No target yet: that comes with grooming')
})

test('an unknown epic is a 404, by its own URL and by an old ?card= link', async ({ page }) => {
  expect((await page.goto(`/hub/${slug()}/epic/no-such-initiative`))?.status()).toBe(404)
  expect((await page.goto(`/hub/${slug()}/board?card=no-such-initiative`))?.status()).toBe(404)
})

test('the empty board matches the approved hub-board-empty state', async ({ page }) => {
  // The authed tenant always has a pushed board, so the empty state is rendered with the page's own component and
  // measured with the gate's own extractor — the same pair of functions, a different source of markup.
  await page.goto('/login') // any page of ours, for the design-system stylesheet's scope classes
  await page.setContent(
    `<div class="ds"><main>${renderToStaticMarkup(createElement(EmptyBoard))}</main></div>`
  )
  const built = await page.evaluate(extractSignature, signatureArgs('product'))
  const differences = diffSignature(CONTRACT.states['hub-board-empty'], built)
  expect(differences, differences.join('\n')).toEqual([])
})

// ── board-sinks-and-scrumban · Sprint 4, Story 4.2 — one board across a workspace (tenancy) ───────────────────────

function serviceDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY must be set to run this spec')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** The fixture tenant's workspace — read with the service role, the way the spec knows it; the PAGE never sees this. */
async function fixtureWorkspaceId(): Promise<string> {
  const { data, error } = await serviceDb()
    .from('projects')
    .select('workspace_id')
    .eq('slug', slug())
    .single()
  if (error || !data?.workspace_id)
    throw new Error(`could not read the fixture's workspace: ${error?.message}`)
  return data.workspace_id as string
}

test('the workspace board matches the approved hub-workspace-board state and shows the viewer’s projects', async ({
  page,
}) => {
  const ws = await fixtureWorkspaceId()
  await page.goto(`/hub/w/${ws}/board`)
  const built = await page.evaluate(extractSignature, signatureArgs('product'))
  const differences = diffSignature(CONTRACT.states['hub-workspace-board'], built)
  expect(differences, differences.join('\n')).toEqual([])
  // Every card names its project and opens THAT project's epic page (one-epic-page D3).
  const first = page.locator('.ds-board-card').first()
  await expect(first).toContainText(slug())
  await expect(first).toHaveAttribute('href', new RegExp(`^/hub/${slug()}/epic/`))
  // The project filter is the viewer's projects, and it carries in the URL.
  await page.getByRole('link', { name: slug(), exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/hub/w/${ws}/board\\?project=${slug()}$`))
})

test('tenancy: another workspace, a malformed id, and a project from another workspace are all 404 (S4.2)', async ({
  page,
}) => {
  const db = serviceDb()
  // A workspace that exists and that the viewer does NOT belong to, holding a project that also exists.
  const { data: other, error } = await db
    .from('workspaces')
    .insert({ name: 'not yours' })
    .select('id')
    .single()
  if (error || !other) throw new Error(`could not create a foreign workspace: ${error?.message}`)
  const foreignSlug = `foreign-${Date.now()}`
  const { data: foreign, error: pErr } = await db
    .from('projects')
    .insert({ workspace_id: other.id, slug: foreignSlug })
    .select('id')
    .single()
  if (pErr || !foreign) throw new Error(`could not create a foreign project: ${pErr?.message}`)
  try {
    for (const url of [
      `/hub/w/${other.id}/board`,
      '/hub/w/not-a-uuid/board',
      `/hub/w/${await fixtureWorkspaceId()}/board?project=${foreignSlug}`,
    ]) {
      const response = await page.goto(url)
      expect(response?.status(), url).toBe(404)
      await expect(page.locator('body')).not.toContainText(foreignSlug)
    }
  } finally {
    // Leave nothing behind: the fixture teardown deletes ITS workspace, and a stray project would block it.
    const { error: dp } = await db.from('projects').delete().eq('id', foreign.id)
    const { error: dw } = await db.from('workspaces').delete().eq('id', other.id)
    if (dp || dw) throw new Error(`cleanup failed: ${dp?.message ?? ''} ${dw?.message ?? ''}`)
  }
})

test('access model A: a project in the SAME workspace that the viewer is not a member of stays off the board (S4.2)', async ({
  page,
}) => {
  // The boundary that matters most: the workspace is a boundary, not a grant. A sibling project in the viewer's own
  // workspace, with a real pushed board, must not reach the page — not its chip, not its cards, not via `?project=`.
  // Swap getWorkspaceProjects() for "every project in the workspace" and this goes red.
  const db = serviceDb()
  const ws = await fixtureWorkspaceId()
  const siblingSlug = `sibling-${Date.now()}`
  const secret = `Sibling secret initiative ${Date.now()}`
  const { data: sibling, error } = await db
    .from('projects')
    .insert({ workspace_id: ws, slug: siblingSlug })
    .select('id')
    .single()
  if (error || !sibling) throw new Error(`could not create a sibling project: ${error?.message}`)
  try {
    const { error: pushErr } = await db.rpc('push_report_artifact', {
      p_project_id: sibling.id,
      p_kind: 'roadmap',
      p_schema_version: ROADMAP_SCHEMA_VERSION,
      p_payload: {
        items: [
          {
            name: secret,
            slug: 'sibling-secret',
            grain: 'Epic',
            status: 'in-progress',
            area: '02-commercial',
            epic_slug: null,
            stage: 'Building',
          },
        ],
      },
      p_generated_at: new Date().toISOString(),
      p_source_commit: null,
      p_source_ref: null,
    })
    if (pushErr) throw new Error(`could not push the sibling's board: ${pushErr.message}`)

    await page.goto(`/hub/w/${ws}/board`)
    await expect(page.locator('.ds-board-card').first()).toBeVisible()
    await expect(page.locator('body')).not.toContainText(secret)
    await expect(page.locator('body')).not.toContainText(siblingSlug)
    const response = await page.goto(`/hub/w/${ws}/board?project=${siblingSlug}`)
    expect(response?.status()).toBe(404)
  } finally {
    // Deleting the project removes its artifact (the artifact's own trigger permits it once the project is gone).
    const { error: dp } = await db.from('projects').delete().eq('id', sibling.id)
    if (dp) throw new Error(`cleanup failed: ${dp.message}`)
  }
})

test('signed out, a workspace board sends you to sign in — a workspace is never public', async ({
  browser,
}) => {
  const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await anonymous.newPage()
  await page.goto(`/hub/w/${await fixtureWorkspaceId()}/board`)
  await expect(page).toHaveURL(/\/login/)
  await anonymous.close()
})
