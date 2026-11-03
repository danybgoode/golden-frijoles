import { LibraryIndexPage, sectionMetadata } from '@/components/library/LibraryPages'

// traffic-relaunch S2.1 — the guides index, from lib/content-library.ts. force-dynamic: the canonical URL reads SITE_URL.
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return sectionMetadata('guides')
}

export default function Page() {
  return <LibraryIndexPage section="guides" />
}
