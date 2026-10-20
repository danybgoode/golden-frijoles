// landing-launch-experiment · Sprint 4 — the Terms and Privacy notice say what the product does (lib/legal.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PLAN_FACTS, PRIVACY, TERMS } from './legal.ts'
import { CLARITY_PROJECT_ID, GA4_MEASUREMENT_ID } from './analytics-ids.ts'
import { GROWTH_UNIT_AMOUNT } from '../../../scripts/stripe-ensure-growth-price.mjs'

const text = (doc: typeof TERMS) => doc.sections.flatMap((s) => s.paragraphs).join('\n')

test('the plan numbers are the ones the database trigger sets', () => {
  const sql = readFileSync(
    join(import.meta.dirname, '../supabase/migrations/20261022100000_workspace_plans.sql'),
    'utf8'
  )
  assert.match(
    sql,
    new RegExp(
      `'free' THEN NEW.product_limit := ${PLAN_FACTS.freeProducts}; NEW.monthly_event_pool := ${PLAN_FACTS.freeEvents};`
    )
  )
  assert.match(
    sql,
    new RegExp(
      `'growth' THEN NEW.product_limit := NULL; NEW.monthly_event_pool := ${PLAN_FACTS.growthEvents};`
    )
  )
})

test('the price is the one checkout sells', () => {
  assert.equal(PLAN_FACTS.growthPriceUsd * 100, GROWTH_UNIT_AMOUNT)
  assert.match(text(TERMS), /\$49 a month per workspace/)
})

test('the Terms say the things the money path does', () => {
  const terms = text(TERMS)
  assert.match(terms, /200,000 events a month/)
  assert.match(terms, /2,000,000 events a month/)
  assert.match(terms, /We never charge for events over a limit/)
  assert.match(terms, /keeps Growth until the end of the month you paid for/)
  assert.match(terms, /Plan & billing → Manage billing/)
})

test('the Privacy notice names every third-party script the site can load, and says they wait for consent', () => {
  // The two analytics ids exist, so the two products are named; both are opt-in (lib/consent.ts denies by default).
  assert.ok(GA4_MEASUREMENT_ID && CLARITY_PROJECT_ID)
  const privacy = text(PRIVACY)
  for (const name of [
    'Google Analytics',
    'Microsoft Clarity',
    'Cal.com',
    'Stripe',
    'Supabase',
    'Vercel',
    'Cloudflare',
  ])
    assert.ok(privacy.includes(name), `${name} is named`)
  assert.match(privacy, /Nothing loads until you say yes/)
  assert.match(privacy, /gb_vid/)
})

test('every section has a heading and at least one paragraph, and no draft marker leaks into the copy', () => {
  for (const doc of [TERMS, PRIVACY]) {
    for (const section of doc.sections) {
      assert.ok(section.heading.trim())
      assert.ok(section.paragraphs.length > 0)
    }
    assert.doesNotMatch(text(doc) + doc.lede, /TODO|TBD|\[[A-Z ]+\]/)
  }
})
