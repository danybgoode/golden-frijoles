import { Table, TableCell, TableHead, TableRow } from '@/design-system/primitives'
import type { FunnelView } from '@/lib/flag-funnel-view'

// one-bet-wired D7 — a measured flag's funnel, read-only: the epic page and Journeys' From your flags render this.
export function FlagFunnel({ view }: { view: FunnelView }) {
  if (view.kind !== 'measured') return <p className="ds-hint">{view.text}</p>
  return (
    <>
      <Table>
        <TableHead>
          <TableCell header wide>
            Stage
          </TableCell>
          <TableCell header>People</TableCell>
          <TableCell header>Of the stage before</TableCell>
        </TableHead>
        {view.rows.map((row) => (
          <TableRow key={row.stage}>
            <TableCell wide>{row.stage}</TableCell>
            <TableCell>{row.people}</TableCell>
            <TableCell>{row.share}</TableCell>
          </TableRow>
        ))}
      </Table>
      <p className="ds-hint">{view.beside}</p>
      {view.note ? <p className="ds-hint">{view.note}</p> : null}
    </>
  )
}
