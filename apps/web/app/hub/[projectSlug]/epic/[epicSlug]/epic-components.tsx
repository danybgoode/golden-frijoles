/** @jsxImportSource react */
// Pragma: a no-op under Next, load-bearing for the test rail (Playwright's transform pins its own jsx runtime, which
// react-dom/server refuses to render) — the same line, for the same reason, as `board-components.tsx`.
import type { BoardCard } from '@/lib/hub-board'
import type { Freshness } from '@/lib/hub-freshness'
import type { IconName } from '@/components/ui/icon-names'
import { epicTrack, spendBar, sprintBar, type TrackKey } from '@/lib/epic-page'
import type { EpicFlag as EpicFlagView } from '@/lib/epic-flag'
import { BEAN_WORDS, epicResult, shortDay } from '@/lib/roadmap-result'
import { quoteActualLine, type EpicFinops } from '@/lib/roadmap-finops'
import { Bean } from '@/design-system/bean'
import { nowLine, stageCommands, stageWhen } from '@/lib/stage-commands'
import { stageLabel } from '@/lib/screen-words'
import { Icon } from '@/components/ui/Icon'
import { PageHead } from '@/design-system/primitives'
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
      ) : card.stage === 'Shipped' ? null : (
        // A shipped epic's Now line already says nothing is owed (seen live: it said so twice).
        <p className="ds-hint">Nothing to run from here at this stage.</p>
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

const figure = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100))

/**
 * S2.1 (D9) — why we're building it: the README's Why, then the bet — hypothesis, target from → to, read date — and,
 * once read, the Bean, the actual and what the target was. Every field through `epicResult`, the one derivation the
 * board's bean also reads. Gold is the Bean's own `proven` kind, never this component's choice.
 */
export function EpicWhy({ card }: { card: BoardCard }) {
  const seed = card.grain === 'Seed'
  const r = card.result ? epicResult(card.result) : null
  const target = r && r.metric !== null && r.from !== null && r.to !== null ? r : null
  return (
    <section className="ds-epic-section" aria-label={seed ? 'The idea' : "Why we're building this"}>
      <h2 className="ds-label">{seed ? 'The idea' : "Why we're building this"}</h2>
      <p className="ds-epic-why-goal">
        {card.goal ??
          (seed
            ? 'The idea is in its seed, below.'
            : 'No goal is written for this epic yet — its README has no Why paragraph.')}
      </p>
      {r?.hypothesis ? <p className="ds-epic-why-line">{r.hypothesis}</p> : null}
      {seed ? (
        <p className="ds-hint">No target yet: that comes with grooming.</p>
      ) : !target ? (
        <p className="ds-hint">No target set.</p>
      ) : (
        <p className="ds-epic-why-target" data-testid="epic-target">
          <span className="ds-mono">{target.metric}</span> {figure(target.from!)} → {figure(target.to!)}
          {target.readDate ? (
            <span className="ds-epic-now-when">
              {' '}
              · read {shortDay(target.readDate)}
              {target.readDateDerived ? ' (30 days after shipping)' : ''}
              {target.readDue ? ' · due' : ''}
            </span>
          ) : null}
        </p>
      )}
      {r?.verdict && r.bean ? (
        <p className="ds-epic-why-read" data-testid="epic-read">
          <Bean kind={r.bean} decorative />
          <b>{BEAN_WORDS[r.bean]}</b>
          {r.actual !== null ? <span>actual {figure(r.actual)}</span> : null}
          {r.to !== null ? <span className="ds-epic-now-when">target was {figure(r.to)}</span> : null}
          {r.evidenceHref ? (
            <a href={r.evidenceHref} rel="noreferrer">
              evidence
            </a>
          ) : r.evidence ? (
            <span className="ds-epic-now-when">{r.evidence}</span>
          ) : null}
          {r.late ? <span className="ds-epic-now-when">read late</span> : null}
        </p>
      ) : null}
    </section>
  )
}

/** A bar as SVG: inline `style` is forbidden by the drift guard, so the width is an attribute (D10). */
function Bar({ pct, state, band }: { pct: number; state: string; band?: { low: number; high: number } }) {
  return (
    <svg
      className="ds-epic-bar"
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-state={state}
    >
      <rect className="ds-epic-bar-track" x="0" y="0" width="100" height="6" rx="3" />
      {band ? (
        <rect
          className="ds-epic-bar-band"
          x={band.low}
          y="0"
          width={Math.max(0, band.high - band.low)}
          height="6"
        />
      ) : null}
      <rect className="ds-epic-bar-fill" x="0" y="0" width={pct} height="6" rx="3" data-pct={pct} />
    </svg>
  )
}

/** S2.2 (D10) — one row per sprint: number, title, done/total and a bar. */
export function EpicBars({ card }: { card: BoardCard }) {
  if (card.sprints.length === 0)
    return (
      <p className="ds-hint">
        {card.grain === 'Seed'
          ? "Sprints appear once it's groomed."
          : 'No sprints recorded for this epic yet.'}
      </p>
    )
  return (
    <ol className="ds-epic-bars" aria-label="Progress by sprint">
      {card.sprints.map((sprint) => {
        const bar = sprintBar(sprint.done, sprint.total)
        return (
          <li key={sprint.n} data-state={bar.state}>
            <span className="ds-epic-bars-n">S{sprint.n}</span>
            <span className="ds-epic-bars-title">{sprint.title ?? `Sprint ${sprint.n}`}</span>
            <Bar pct={bar.pct} state={bar.state} />
            <span className="ds-epic-bars-count">{`${sprint.done}/${sprint.total}`}</span>
          </li>
        )
      })}
    </ol>
  )
}

const ENV_WORD: Record<string, string> = { on: 'serving', off: 'switched off', never: 'never activated' }

/** S2.3 (D12) — the flag's state, from this project's registry; changed in Ship, never here. */
export function EpicFlag({ flag, projectSlug }: { flag: EpicFlagView; projectSlug: string }) {
  if (flag.kind === 'none')
    return (
      <p className="ds-epic-row" data-flag="none">
        <span className="ds-epic-row-icon">
          <Icon name="flag" size={14} />
        </span>
        <b>No flag</b>
        {flag.note ? <span className="ds-epic-now-when">{flag.note}</span> : null}
      </p>
    )
  const href = `/app/flags/${encodeURIComponent(projectSlug)}/${encodeURIComponent(flag.key)}`
  return (
    <p className="ds-epic-row" data-flag={flag.kind}>
      <span className="ds-epic-row-icon">
        <Icon name="flag" size={14} />
      </span>
      {flag.kind === 'found' ? (
        <>
          <b>
            Flag <span className="ds-mono">{flag.key}</span>
          </b>
          <span className="ds-epic-flag-envs">
            {/* D12 — production is the headline: first, then the others in their usual order. */}
            {[...flag.environments]
              .sort((a, b) => Number(b.environment === 'production') - Number(a.environment === 'production'))
              .map((env) => (
                <span key={env.environment} data-env={env.environment} data-state={env.state}>
                  {env.environment}: {ENV_WORD[env.state] ?? env.state}
                  {env.state === 'on' && env.serving !== null ? ` ${JSON.stringify(env.serving)}` : ''}
                </span>
              ))}
          </span>
          <a className="ds-epic-row-action" href={href}>
            Open in Ship
          </a>
        </>
      ) : flag.kind === 'not_found' ? (
        <b>
          Flag <span className="ds-mono">{flag.key}</span> not found
        </b>
      ) : (
        <b>
          Flag <span className="ds-mono">{flag.key}</span>: its state could not be read
        </b>
      )}
    </p>
  )
}

/** S2.3 (D13) — spend against the quote, with the way to its FinOps row. */
export function EpicSpend({
  finops,
  projectSlug,
  slug,
}: {
  finops: EpicFinops
  projectSlug: string
  slug: string
}) {
  const bar = spendBar(finops)
  const line = quoteActualLine(finops)
  return (
    <p className="ds-epic-row" data-testid="epic-finops">
      <span className="ds-epic-row-icon">
        <Icon name="gauge" size={14} />
      </span>
      <b>Spend</b>
      {bar ? (
        <Bar
          pct={bar.actualPct}
          state={bar.over ? 'over' : 'progress'}
          band={{ low: bar.lowPct, high: bar.highPct }}
        />
      ) : null}
      <span className="ds-epic-now-when">
        {line ?? 'Not quoted · not measured yet'}
        {/* The unit marks a figure that was measured, so it sits only beside an actual (seen live on S1). */}
        {finops.actualUsd !== null ? <span className="ds-mono"> ≈ API $</span> : null}
      </span>
      <a
        className="ds-epic-row-action"
        href={`/app/finops/${encodeURIComponent(projectSlug)}#epic-${encodeURIComponent(slug)}`}
      >
        FinOps
      </a>
    </p>
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
