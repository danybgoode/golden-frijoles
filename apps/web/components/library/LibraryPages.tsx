import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Frame, FrameLink } from '@/design-system/Frame'
import { SelfTrackBeacon } from '@/components/landing/SelfTrackBeacon'
import { getSiteUrl } from '@/lib/site-url'
import {
  LIBRARY_SECTIONS,
  SECTION_META,
  entriesIn,
  entryLanguages,
  findEntry,
  type LibraryBlock,
  type LibrarySection,
} from '@/lib/content-library'
import { entryJsonLd, serializeJsonLd } from '@/lib/content-jsonld'

// traffic-relaunch · Sprint 2, Story 2.1 — the one page shape for /guides, /compare and /glossary (index and entry).
// The routes are thin; everything they show comes from `lib/content-library.ts`. The public frame and `ds-legal` prose
// are the legal pages' (one reading shape for plain text pages, not a new one). Each page opens with its answer.

function LibraryFrame({ children }: { children: React.ReactNode }) {
  return (
    <Frame
      variant="public"
      brandHref="/"
      actions={
        <>
          {LIBRARY_SECTIONS.map((section) => (
            <FrameLink key={section} href={`/${section}`}>
              {SECTION_META[section].title}
            </FrameLink>
          ))}
          <FrameLink href="/methodology">Methodology</FrameLink>
        </>
      }
    >
      {children}
    </Frame>
  )
}

function Block({ block }: { block: LibraryBlock }) {
  if (block.kind === 'h2') return <h2>{block.text}</h2>
  if (block.kind === 'code')
    return (
      <pre className="ds-codeblock">
        <code>{block.text}</code>
      </pre>
    )
  return <p>{block.text}</p>
}

export function sectionMetadata(section: LibrarySection): Metadata {
  const url = `${getSiteUrl()}/${section}`
  const title = `${SECTION_META[section].title} — Golden Frijoles`
  const description = SECTION_META[section].lede
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Golden Frijoles', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function LibraryIndexPage({ section }: { section: LibrarySection }) {
  const entries = entriesIn(section)
  return (
    <LibraryFrame>
      <SelfTrackBeacon surface="library" section={section} />
      <article className="ds-legal">
        <h1>{SECTION_META[section].title}</h1>
        <p className="ds-lede">{SECTION_META[section].lede}</p>
        {entries.map((entry) => (
          <section key={entry.slug}>
            <h2>
              <Link href={`/${section}/${entry.slug}`}>{entry.title}</Link>
            </h2>
            <p>{entry.description}</p>
          </section>
        ))}
      </article>
    </LibraryFrame>
  )
}

export async function entryMetadata(section: LibrarySection, slug: string): Promise<Metadata> {
  // An unknown slug returns EMPTY metadata, never a throw: metadata runs before the page, and a throw would be a 500
  // for a URL whose answer is a 404 (the methodology chapter's rule).
  const entry = findEntry(section, slug)
  if (!entry) return {}
  const siteUrl = getSiteUrl()
  const url = `${siteUrl}/${section}/${slug}`
  const title = `${entry.title} — Golden Frijoles`
  // seo-library-batch-2 D2 — hreflang to the twin in the other language, both ways.
  const languages = Object.fromEntries(
    Object.entries(entryLanguages(entry)).map(([lang, path]) => [lang, `${siteUrl}${path}`])
  )
  return {
    title,
    description: entry.description,
    alternates: { canonical: url, ...(Object.keys(languages).length ? { languages } : {}) },
    openGraph: {
      title,
      description: entry.description,
      url,
      siteName: 'Golden Frijoles',
      type: 'article',
      modifiedTime: entry.updated,
    },
    twitter: { card: 'summary_large_image', title, description: entry.description },
  }
}

export function LibraryEntryPage({ section, slug }: { section: LibrarySection; slug: string }) {
  const entry = findEntry(section, slug)
  if (!entry) notFound()
  const jsonLd = serializeJsonLd(entryJsonLd(entry, getSiteUrl()))
  return (
    <LibraryFrame>
      <SelfTrackBeacon surface="library" section={section} slug={slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <article className="ds-legal" lang={entry.lang ?? 'en'}>
        <p className="ds-legal-updated">
          <Link href={`/${section}`}>{SECTION_META[section].title}</Link>
          {` · Updated ${entry.updated}`}
        </p>
        <h1>{entry.title}</h1>
        <p className="ds-lede">{entry.answer}</p>
        {entry.body.map((block, index) => (
          <Block key={index} block={block} />
        ))}
        {entry.faq.length > 0 ? (
          <section>
            <h2>Questions</h2>
            {entry.faq.map((pair) => (
              <div key={pair.q}>
                <p>
                  <strong>{pair.q}</strong>
                </p>
                <p>{pair.a}</p>
              </div>
            ))}
          </section>
        ) : null}
        <p>
          <Link href="/install">Install Golden Frijoles</Link> ·{' '}
          <Link href="/methodology">Read the methodology</Link>
        </p>
      </article>
    </LibraryFrame>
  )
}

export function staticSlugs(section: LibrarySection) {
  return entriesIn(section).map((entry) => ({ slug: entry.slug }))
}
