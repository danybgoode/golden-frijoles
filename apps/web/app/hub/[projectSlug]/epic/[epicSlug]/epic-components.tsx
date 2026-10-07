/** @jsxImportSource react */
// Pragma: a no-op under Next, load-bearing for the test rail (Playwright's transform pins its own jsx runtime, which
// react-dom/server refuses to render) — the same line, for the same reason, as `board-components.tsx`.
import type { BoardCard } from '@/lib/hub-board'
import type { Freshness } from '@/lib/hub-freshness'
import type { IconName } from '@/components/ui/icon-names'
import { epicTrack, type TrackKey } from '@/lib/epic-page'
import { nowLine, stageCommands, stageWhen } from '@/lib/stage-commands'
import { stageLabel } from '@/lib/screen-words'
import { Icon } from '@/components/ui/Icon'
import { PageHead, Step, Steps } from '@/design-system/primitives'
import { CopyButton } from '../../../copy-button'

// one-epic-page · Sprint 1 — the epic page's parts (lock D4: `CardView`'s parts, moved here; the card view is gone).
// Every part reads the ONE pushed row, as a `BoardCard` (D1); nothing here computes a stage (board lock D19).

const trackLabel = (key: TrackKey) => (key === 'Read' ? 'Read' : stageLabel(key))

/** S1.2 (D6) — title, the stage chip, and small chips instead of tiles. Risk high says who merges. */
export function EpicHead({ card }: { card: BoardCard }) {
  const high = card.risk?.toLowerCase() === 'high'
  const chips = [
    card.grain === 'Seed' ? 'Idea' : null,
    card.area,
    card.risk ? `Risk ${card.risk.toLowerCase()}${high ? ' · you merge' : ''}` : null,
    card.appetite ? `Appetite ${card.appetite}` : null,
    card.buildOrder !== null ? `#${card.buildOrder}` : null,
  ].filter((c): c is string => Boolean(c))
  return (
    <PageHead
      title={card.name}
      lede={
        <span className="ds-epic-chips">
          <span className="ds-epic-chip ds-epic-chip--stage" data-stage={card.stage}>
            {stageLabel(card.stage)}
          </span>
          {chips.map((chip) => (
            <span
              key={chip}
              className="ds-epic-chip"
              data-risk={chip.startsWith('Risk high') ? 'high' : undefined}
            >
              {chip}
            </span>
          ))}
        </span>
      }
      actions={
        // D8 — at Ready the kickoff copy stays the head action (the generator is unchanged, a no-go).
        card.stage === 'Ready to build' && card.kickoff ? (
          <CopyButton primary value={card.kickoff} label="Copy the kickoff prompt">
            Copy kickoff prompt
          </CopyButton>
        ) : undefined
      }
    />
  )
}

/** S1.2 (D6) — seven steps, Backlog to Read. The current step is the one `aria-current` names; colour is never alone. */
export function EpicTrack({ card }: { card: BoardCard }) {
  const hasVerdict = typeof card.result?.verdict === 'string'
  return (
    <ol className="ds-epic-track" aria-label="Where this is">
      {epicTrack(card.stage, hasVerdict).map((step) => (
        <li
          key={step.key}
          data-step={step.key}
          data-state={step.state}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <i aria-hidden="true" />
          <span>{trackLabel(step.key)}</span>
        </li>
      ))}
    </ol>
  )
}

const STAGE_ICON: Record<BoardCard['stage'], IconName> = {
  'To groom': 'sparkles',
  Grooming: 'list-checks',
  'Ready to build': 'route',
  Building: 'code',
  QA: 'check-circle',
  Shipped: 'rocket',
}

/**
 * S1.3 (D7, D8) — the Now panel: an icon, when, one line on what is happening, ONE command with Copy; every other
 * command and the shorthands under More.
 */
export function NowPanel({ card, product }: { card: BoardCard; product: string }) {
  const [primary, ...rest] = stageCommands(card, product)
  const when = stageWhen(card)
  const shorthands = [primary, ...rest].filter((c) => c?.shorthand).map((c) => c!.shorthand!)
  return (
    <section className="ds-epic-now" aria-label="Now">
      <p className="ds-epic-now-head">
        <span className="ds-epic-now-icon">
          <Icon name={STAGE_ICON[card.stage]} size={16} />
        </span>
        <b>Now</b>
        {when ? <span className="ds-epic-now-when">{when}</span> : null}
      </p>
      <p className="ds-epic-now-line">{nowLine(card)}</p>
      {primary ? (
        <div className="ds-epic-command" data-primary="true">
          <code>{primary.text}</code>
          <CopyButton value={primary.text} label={`Copy: ${primary.text}`} />
        </div>
      ) : (
        <p className="ds-hint">Nothing is owed — it shipped.</p>
      )}
      {rest.length > 0 || shorthands.length > 0 ? (
        <details className="ds-disclosure">
          <summary>More</summary>
          <div className="ds-disclosure-body">
            {rest.map((command) => (
              <div key={command.text} className="ds-epic-command">
                <code>{command.text}</code>
                <CopyButton value={command.text} label={`Copy: ${command.text}`} />
              </div>
            ))}
            {shorthands.length > 0 ? (
              <p className="ds-hint">
                Shorthand, if your agent knows ours: <span className="ds-mono">{shorthands.join(' · ')}</span>
              </p>
            ) : null}
          </div>
        </details>
      ) : null}
    </section>
  )
}

/** The sprints, as the card listed them (moved with `CardView`, D4). Sprint 2 draws them as bars (S2.2). */
export function EpicSprints({ card }: { card: BoardCard }) {
  return (
    <Steps>
      {card.sprints.length > 0 ? (
        card.sprints.map((sprint) => (
          <Step key={sprint.n} note={`${sprint.done} of ${sprint.total} stories`}>
            {`Sprint ${sprint.n}${sprint.title ? ` — ${sprint.title}` : ''}`}
          </Step>
        ))
      ) : (
        <Step note="A seed is sliced into sprints when it is groomed and scaffolded.">
          {card.grain === 'Seed' ? "Sprints appear once it's groomed" : 'No sprints recorded yet'}
        </Step>
      )}
    </Steps>
  )
}

/** The documents (D14): The idea, The epic, each sprint, the retrospective — opened on the pushed repo base. */
export function epicDocs(card: BoardCard): { label: string; path: string }[] {
  return [
    card.links.seed ? { label: 'The idea', path: card.links.seed } : null,
    card.links.readme ? { label: 'The epic', path: card.links.readme } : null,
    ...card.links.sprints.map((path, i) => ({ label: `Sprint ${card.sprints[i]?.n ?? i + 1}`, path })),
    card.links.retro ? { label: 'Retrospective', path: card.links.retro } : null,
  ].filter((d): d is { label: string; path: string } => d !== null)
}

export function EpicDocs({ card, repo }: { card: BoardCard; repo: string | null }) {
  const docs = epicDocs(card)
  // An honest empty state (CODE-QUALITY #8): an empty list would read as "the documents failed to load".
  if (docs.length === 0) return <p className="ds-hint">No documents were pushed for this one.</p>
  return (
    <section className="ds-epic-section" aria-label="Documents">
      <h2 className="ds-label">Documents</h2>
      <ul className="ds-epic-docs">
        {docs.map((doc) => (
          <li key={doc.path}>
            {/* The pushed repo base is validated https at ingest; without one the path is shown, never guessed. */}
            {repo ? (
              <a href={`${repo}${doc.path}`} title={doc.path}>
                {doc.label}
              </a>
            ) : (
              <span title={doc.path}>
                {doc.label} <span className="ds-mono">{doc.path}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** D6 — where the numbers come from, and how fresh the push is. */
export function EpicFreshness({ freshness }: { freshness: Freshness | null }) {
  return (
    <p className="ds-hint" data-freshness-tone={freshness?.tone}>
      Every number comes from the epic&apos;s README and git ·{' '}
      {freshness?.tone === 'stale' ? <strong>possibly stale — </strong> : null}
      updated{' '}
      {freshness?.iso ? (
        <time dateTime={freshness.iso} title={freshness.iso}>
          {freshness.age}
        </time>
      ) : (
        (freshness?.age ?? 'at an unknown time')
      )}
      {freshness?.shortCommit ? ` as of ${freshness.shortCommit}` : ''}
    </p>
  )
}
