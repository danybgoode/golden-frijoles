import { test, expect } from '@playwright/test'
import { LIBRARY, LIBRARY_SECTIONS } from '@/lib/content-library'

// traffic-relaunch S2.1/S2.2 — every entry in lib/content-library.ts is a page that answers 200, opens with its
// answer, carries its structured data, and is listed in the sitemap and llms.txt. An unknown slug is a 404.

test('every section index and every entry renders, with its answer and JSON-LD', async ({ request }) => {
  for (const section of LIBRARY_SECTIONS) {
    const index = await request.get(`/${section}`, { headers: { Accept: 'text/html' } })
    expect(index.status(), section).toBe(200)
  }
  for (const entry of LIBRARY) {
    const res = await request.get(`/${entry.section}/${entry.slug}`, { headers: { Accept: 'text/html' } })
    expect(res.status(), entry.slug).toBe(200)
    const html = await res.text()
    expect(html, entry.slug).toContain('application/ld+json')
    expect(html, entry.slug).toContain(entry.section === 'glossary' ? '"DefinedTerm"' : '"FAQPage"')
    expect(html, entry.slug).toContain(entry.title)
  }
})

test('an unknown slug is a 404, never a 500', async ({ request }) => {
  for (const section of LIBRARY_SECTIONS) {
    const res = await request.get(`/${section}/no-such-entry`, { headers: { Accept: 'text/html' } })
    expect(res.status(), section).toBe(404)
  }
})

test('the sitemap and llms.txt list every entry', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  const llms = await (await request.get('/llms.txt')).text()
  for (const entry of LIBRARY) {
    const path = `/${entry.section}/${entry.slug}`
    expect(sitemap, path).toContain(`${path}</loc>`)
    expect(llms, path).toContain(path)
  }
})
