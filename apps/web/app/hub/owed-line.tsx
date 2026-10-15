/** @jsxImportSource react */
import type { OwedRow } from '@/lib/owed'
import { owedKindWords } from '@/lib/owed'

// owed-on-screen — one owed check, as the epic page's section and the board's band both draw it. One component so the
// two cannot disagree about the words (CODE-QUALITY §2). It reuses the task band's row classes: no new CSS, and the
// kind is a sentence beside the text, never a colour alone.

/** `file:line`, linked through the pushed repo base the way `EpicDocs` links a doc; the path alone when none was pushed. */
export function OwedWhere({ item, repo }: { item: OwedRow; repo: string | null }) {
  const label = `${item.file}:${item.line}`
  // The base is validated https at ingest and `file` has no scheme or `..` (roadmap-artifact-schema); without a base the
  // location is shown, never guessed.
  return repo ? (
    <a className="ds-mono" href={`${repo}${item.file}#L${item.line}`} title={label}>
      {label}
    </a>
  ) : (
    <span className="ds-mono">{label}</span>
  )
}

/** `epicHref` set: the line names its epic and links to it (the board). Unset: it names where it was written (the epic page). */
export function OwedLine({
  item,
  repo,
  epicHref,
}: {
  item: OwedRow
  repo: string | null
  epicHref?: string
}) {
  return (
    <div className="ds-task" data-owed-kind={item.kind}>
      <div className="ds-task-row">
        <div className="ds-task-body">
          <p className="ds-task-title">{item.text}</p>
          <p className="ds-task-meta">
            <span>{owedKindWords(item.kind)}</span>
            {epicHref && item.epic ? (
              <a href={epicHref} data-owed-epic={item.epic}>
                {item.epic}
              </a>
            ) : null}
            {/* An unattached check has no epic to name, so it names its file; on the epic page the location is the point. */}
            {!epicHref || !item.epic ? <OwedWhere item={item} repo={repo} /> : null}
          </p>
        </div>
      </div>
    </div>
  )
}
