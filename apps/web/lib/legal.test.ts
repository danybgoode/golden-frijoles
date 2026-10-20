// landing-launch-experiment · Sprint 4 — the Terms and Privacy notice say what the product does (lib/legal.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PLAN_FACTS, PRIVACY, STORAGE_NAMES, TERMS } from './legal.ts'
import { CONSENT_STORAGE_KEY } from './consent.ts'
import { PROGRESS_STORAGE_KEY } from './methodology-progress.ts'
import { CLARITY_PROJECT_ID, GA4_MEASUREMENT_ID } from './analytics-ids.ts'
import { GROWTH_PRICE } from './billing-decision.ts'
import { BOOKING_URL } from './booking.ts'
import { VISITOR_COOKIE } from './marketing-paths.ts'
import { ACQUISITION_VARIANT_COOKIE } from './landing-variant.ts'
import { readdirSync } from 'node:fs'

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
  assert.equal(PLAN_FACTS.growthPriceUsd * 100, GROWTH_PRICE.unitAmount)
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

test('every cookie the app sets by name, and the booking host, are disclosed (read from the code, not a list)', () => {
  const privacy = text(PRIVACY)
  for (const cookie of [VISITOR_COOKIE, ACQUISITION_VARIANT_COOKIE])
    assert.ok(privacy.includes(cookie), cookie)
  assert.ok(
    privacy.includes(new URL(BOOKING_URL).hostname.replace(/^www\./, '').replace('cal.com', 'Cal.com'))
  )
  // Any OTHER cookie name set with cookies().set / response.cookies.set in app/ must be added to the notice.
  const root = join(import.meta.dirname, '..')
  const names = new Set<string>()
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
        for (const m of readFileSync(path, 'utf8').matchAll(/cookies\.set\(\s*(['"]?)([A-Za-z_]+)\1/g))
          names.add(m[2])
      }
    }
  }
  walk(join(root, 'app'))
  walk(join(root, 'lib'))
  // A constant must be one of the two disclosed above; a literal name must appear in the notice itself.
  const disclosedConstants = new Set(['VISITOR_COOKIE', 'ACQUISITION_VARIANT_COOKIE'])
  assert.ok(names.size >= 2, 'the scan found the cookie writes it exists to watch')
  for (const name of names)
    assert.ok(
      disclosedConstants.has(name) || privacy.includes(name),
      `cookie "${name}" is set in code but not in the Privacy notice`
    )
})

test('the storage names in the notice are the ones the code uses', () => {
  assert.deepEqual(STORAGE_NAMES, {
    visitorCookie: VISITOR_COOKIE,
    variantCookie: ACQUISITION_VARIANT_COOKIE,
    consentKey: CONSENT_STORAGE_KEY,
    progressKey: PROGRESS_STORAGE_KEY,
  })
})
