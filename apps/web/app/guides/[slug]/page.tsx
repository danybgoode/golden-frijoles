import { LibraryEntryPage, entryMetadata, staticSlugs } from '@/components/library/LibraryPages'

// traffic-relaunch S2.1 — one guides entry. An unknown slug is a 404, never a 500. force-dynamic: the canonical URL and the
// JSON-LD read SITE_URL.
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return staticSlugs('guides')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return entryMetadata('guides', slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LibraryEntryPage section="guides" slug={slug} />
}
