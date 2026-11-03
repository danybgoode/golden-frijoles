// traffic-relaunch · Sprint 2, Story 2.2 — structured data search engines and assistants can quote.
//
// Guides and comparisons carry FAQPage (their FAQ pairs, plus the opening answer as the first question when there are
// none); glossary entries carry a DefinedTerm inside the glossary's DefinedTermSet. Built from `lib/content-library.ts`
// only, and pure, so `content-jsonld.test.ts` validates the shape for EVERY entry: a new entry cannot ship malformed.

import type { LibraryEntry } from './content-library'

export type JsonLd = Record<string, unknown>

export function entryJsonLd(entry: LibraryEntry, siteUrl: string): JsonLd {
  const url = `${siteUrl}/${entry.section}/${entry.slug}`
  if (entry.section === 'glossary') {
    return {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      '@id': url,
      name: entry.title,
      description: entry.answer,
      url,
      inDefinedTermSet: {
        '@type': 'DefinedTermSet',
        name: 'Golden Frijoles glossary',
        url: `${siteUrl}/glossary`,
      },
    }
  }
  const pairs = entry.faq.length > 0 ? entry.faq : [{ q: entry.title, a: entry.answer }]
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': url,
    url,
    name: entry.title,
    dateModified: entry.updated,
    mainEntity: pairs.map((pair) => ({
      '@type': 'Question',
      name: pair.q,
      acceptedAnswer: { '@type': 'Answer', text: pair.a },
    })),
  }
}

/** Safe to drop into a <script type="application/ld+json">: `<` can never close the tag. */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
