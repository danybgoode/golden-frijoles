import type { EpicResult } from '@/lib/roadmap-result'
import { shortDay } from '@/lib/roadmap-result'

// result-record · Story 2.2 (D10) — "Read due" under Today's Waiting on you.
//
// ── A derived line, not a task ────────────────────────────────────────────────────────────────
// A read falls due on a date written in the epic README, and it is answered by a verdict written in the same README.
// A task would be a write made by a page that only reads, and it would outlive the verdict that answers it. So the
// line is computed from the latest pushed roadmap (`readsDue` in `lib/roadmap-result.ts`) and is gone as soon as the
// push carrying the verdict lands.
//
// The row uses the task row's own classes, so it sits in the band like its neighbours, without the signal dot and the
// error/friction word: a due read is neither, and naming it one would be a guess (DD4: never colour alone).

export function ReadDueLines({ reads }: { reads: EpicResult[] }) {
  return (
    <>
      {reads.map((r) => (
        <div className="ds-task" key={r.slug}>
          <div className="ds-task-row">
            <div className="ds-task-body">
              <p className="ds-task-title">Read due: {r.name ?? r.slug}</p>
              <p className="ds-task-meta">
                <span>
                  since {r.readDate ? shortDay(r.readDate) : 'its read date'}
                  {r.readDateDerived ? ' (30 days after shipping)' : ''}
                </span>
                {r.metric ? <span className="ds-mono">{r.metric}</span> : null}
                <span className="ds-mono">node scripts/epic-read.mjs --epic {r.slug}</span>
              </p>
            </div>
            <p className="ds-task-by" data-held="false">
              <b>you</b>
            </p>
          </div>
        </div>
      ))}
    </>
  )
}
