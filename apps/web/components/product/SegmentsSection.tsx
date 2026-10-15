import { EVERYONE } from '@/lib/flag-funnel'
import { getSegmentShare, listSegments, type Segment } from '@/lib/segments'
import { Table, TableCell, TableHead, TableRow } from '@/design-system/primitives'

// funnel-truth S2.4 (D14, amended) — a project's segments, each with its rule and its share of the last 30 days' active
// people, on Journeys (Measure) beside the bets' funnels. It renders only when the project has defined one, so a project
// without segments sees Journeys exactly as before. Segments are defined from the CLI; this section reads. One project:
// `projectId` is the caller's, resolved by the page's membership check.

async function shareText(projectId: string, segment: Segment): Promise<string> {
  try {
    const read = await getSegmentShare(projectId, segment)
    if (read.state === 'unreadable') return `can’t be told: ${read.reason}`
    if (read.share === null) return 'nobody was active in the last 30 days'
    return `${Math.round(read.share * 100)}% (${read.members} of ${read.base})`
  } catch {
    return 'couldn’t be read right now (not a zero)'
  }
}

export async function SegmentsSection({ projectId }: { projectId: string }) {
  const segments = await listSegments(projectId)
  if (segments === null)
    return (
      <section aria-label="Segments">
        <h2 className="ds-label">Segments</h2>
        <p className="ds-hint">The segments could not be read right now.</p>
      </section>
    )
  if (segments.length === 0) return null
  const rows = await Promise.all(
    segments.map(async (s) => ({
      key: s.key,
      rule: `${s.event} at least ${s.minCount}× in ${s.days} days`,
      share: await shareText(projectId, s),
    }))
  )
  return (
    <section aria-label="Segments">
      <h2 className="ds-label">Segments</h2>
      <p className="ds-hint">
        Who a bet is for. A bet names one in <code>target_segment:</code>, and its funnel&apos;s Targeted
        becomes that segment&apos;s share of the active people. Define one with{' '}
        <code>frijoles segments define</code>.
      </p>
      <Table>
        <TableHead>
          <TableCell header wide>
            Segment
          </TableCell>
          <TableCell header>Who is in it</TableCell>
          <TableCell header>Of active people, last 30 days</TableCell>
        </TableHead>
        <TableRow>
          <TableCell wide>{EVERYONE}</TableCell>
          <TableCell>everyone active</TableCell>
          <TableCell>100%</TableCell>
        </TableRow>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell wide>{row.key}</TableCell>
            <TableCell>{row.rule}</TableCell>
            <TableCell>{row.share}</TableCell>
          </TableRow>
        ))}
      </Table>
    </section>
  )
}
