import { LibraryEntryPage, entryMetadata, staticSlugs } from '@/components/library/LibraryPages'

// traffic-relaunch S2.1 — one glossary entry. An unknown slug is a 404, never a 500. force-dynamic: the canonical URL and the
// JSON-LD read SITE_URL.
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return staticSlugs('glossary')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return entryMetadata('glossary', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LibraryEntryPage section="glossary" slug={slug} />
}
