import { test, expect } from '@playwright/test'
import { CATEGORY, CATEGORY_DEFINITION } from '@/lib/positioning'

// agentic-pm-public-surface · Sprint 3, Stories 3.2 and 3.4 (epic D2).
//
// `lib/positioning.ts` exists so one category name and one definition reach five outward surfaces
// without being retyped on any of them. That is a claim about the SURFACES, not about the module —
// the module's own unit test cannot tell you whether anybody imported it, and four of the five
// could drift to a hand-typed variant while every existing spec stayed green.
//
// The RENDERED half. Its `api` sibling (`positioning-surfaces.spec.ts`) covers the two markdown
// surfaces; these three need a real page. NOTE: the `browser` project is not in the blocking gate,
// so this file must be run on purpose — `node scripts/run-local-e2e.mjs --browser`.
//
// So this asserts the round trip: the string in the module is the string a stranger reads. It is
// the guard that makes that module load-bearing rather than decorative, and `positioning.ts`'s
// header names this file by path — a promise this file has to keep.
//
// ── Why "identically" and not "mentions the category" ────────────────────────────────────────
// A near-copy is the failure mode, not an absence. Nobody ships a surface that forgets to describe
// the product; what happens is that one surface says "the whole product discipline" and another
// says "the entire product discipline", and the difference survives for a year because both read
// fine in isolation. Exact containment is the only assertion that catches that.

// The hero copy edit (24220da, 2026-09-02) took the definition off the landing on purpose, so this no
// longer asks for it there. What still holds: if it comes back, it comes back once. A definition
// repeated on one page stops being a definition and becomes a slogan.
test('the landing never states the category more than once', async ({ page }) => {
  await page.goto('/')
  const text = await page.locator('body').innerText()

  const occurrences = text.split(CATEGORY_DEFINITION).length - 1
  expect(occurrences, 'the definition should not be repeated on the landing').toBeLessThanOrEqual(1)
})

test('/methodology opens on the same category as the landing', async ({ page }) => {
  await page.goto('/methodology')
  const text = await page.locator('body').innerText()
  expect(text).toContain(CATEGORY_DEFINITION)
})

test('the link preview names the category and carries a description', async ({ page }) => {
  await page.goto('/')

  const title = await page.title()
  expect(title.toLowerCase()).toContain(CATEGORY.toLowerCase())

  const description = await page
    .locator('meta[name="description"], meta[property="og:description"]')
    .first()
    .getAttribute('content')
  expect(description, 'the page should carry a description').toBeTruthy()

  // This test used to also require that the description name NO capability. The product owner
  // overrode that rule on 2026-10-21 (5a0ed57, for search and answer-engine visibility): the
  // description now names capabilities, each one live today. Keeping them live is now a copy
  // review duty at `app/layout.tsx` (see its header), not something this spec can check. The
  // no-capability rule still holds for CATEGORY_DEFINITION, asserted by `lib/positioning.test.ts`.
})
