// traffic-relaunch S2.2 — every library entry's structured data has the shape search engines accept.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LIBRARY, LIBRARY_SECTIONS, entriesIn, entryLanguages, findEntry } from './content-library.ts'
import { entryJsonLd, serializeJsonLd } from './content-jsonld.ts'

const SITE = 'https://goldenfrijoles.com'

test('every guide and comparison is a FAQPage with at least one answered question', () => {
  for (const entry of LIBRARY.filter((e) => e.section !== 'glossary')) {
    const ld = entryJsonLd(entry, SITE)
    assert.equal(ld['@type'], 'FAQPage', entry.slug)
    assert.equal(ld.url, `${SITE}/${entry.section}/${entry.slug}`)
    const qs = ld.mainEntity as Array<{
      '@type': string
      name: string
      acceptedAnswer: { '@type': string; text: string }
    }>
    assert.ok(qs.length >= 1, entry.slug)
    for (const q of qs) {
      assert.equal(q['@type'], 'Question')
      assert.ok(String(q.name).trim().length > 0, entry.slug)
      assert.equal(q.acceptedAnswer['@type'], 'Answer')
      assert.ok(String(q.acceptedAnswer.text).trim().length > 0, entry.slug)
    }
    assert.match(String(ld.dateModified), /^\d{4}-\d{2}-\d{2}$/)
  }
})

test('every glossary entry is a DefinedTerm in the glossary set', () => {
  for (const entry of entriesIn('glossary')) {
    const ld = entryJsonLd(entry, SITE)
    assert.equal(ld['@type'], 'DefinedTerm', entry.slug)
    assert.equal(ld.name, entry.title)
    assert.ok(String(ld.description).length > 0)
    assert.deepEqual((ld.inDefinedTermSet as Record<string, unknown>)['@type'], 'DefinedTermSet')
  }
})

test('the module is well-formed: unique slugs per section, real dates, an answer on every entry', () => {
  for (const section of LIBRARY_SECTIONS) {
    const slugs = entriesIn(section).map((e) => e.slug)
    assert.equal(new Set(slugs).size, slugs.length, section)
    for (const slug of slugs) assert.match(slug, /^[a-z0-9-]{1,80}$/, slug)
  }
  for (const entry of LIBRARY) {
    assert.match(entry.updated, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(!Number.isNaN(Date.parse(entry.updated)), entry.slug)
    assert.ok(entry.answer.trim().length > 20, entry.slug)
    assert.doesNotMatch(JSON.stringify(entry), /TODO|TBD|\[__\]/, entry.slug)
  }
  assert.ok(
    entriesIn('guides').length >= 3 && entriesIn('compare').length >= 2 && entriesIn('glossary').length >= 6
  )
})

test('serialised JSON-LD cannot close its script tag', () => {
  assert.ok(!serializeJsonLd({ x: '</script><script>alert(1)</script>' }).includes('</script>'))
})

// seo-library-batch-2 D2 — every Spanish entry names a twin that exists, and the hreflang map is symmetric.
test('every lang entry has a real twin, and both sides point at each other', () => {
  const spanish = LIBRARY.filter((entry) => entry.lang === 'es')
  assert.ok(spanish.length >= 2)
  for (const entry of spanish) {
    assert.ok(entry.twin, entry.slug)
    const twin = findEntry(entry.twin.section, entry.twin.slug)
    assert.ok(twin, `${entry.slug} names a twin that does not exist`)
    const own = `/${entry.section}/${entry.slug}`
    const other = `/${twin.section}/${twin.slug}`
    assert.deepEqual(entryLanguages(entry), { es: own, en: other })
    assert.deepEqual(entryLanguages(twin), { en: other, es: own })
  }
  assert.deepEqual(entryLanguages(findEntry('glossary', 'kill-switch')!), {}, 'no twin, no alternates')
})
