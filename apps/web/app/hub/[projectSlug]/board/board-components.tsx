/** @jsxImportSource react */
import type { ReactNode } from 'react'
// Pragma: a no-op under Next, load-bearing for the test rail (Playwright's transform pins its own jsx runtime, which
// react-dom/server refuses to render) — the same line, for the same reason, as `report-components.tsx`.
import type { Freshness } from '@/lib/hub-freshness'
import { BOARD_TYPES, boardQuery, type Board, type BoardCard, type BoardFilters } from '@/lib/hub-board'
import { stageLabel } from '@/lib/screen-words'
import { BEAN_WORDS, epicResult, resultLine } from '@/lib/roadmap-result'
import { Bean } from '@/design-system/bean'
import { Answer, Empty, PageHead } from '@/design-system/primitives'

// board-sinks-and-scrumban · Sprint 2 — the board's approved states, as components (the third, `hub-board-card`, retired
// with the card view into the epic page — one-epic-page D4):
//   hub-board        head → answer → toolbar → tiles (6) → note
//   hub-board-empty  head → empty
// Every block is a DIRECT child of `<main>`, because that is what the visual gate reads (state-contract-core.mjs:
// "direct children only"); a label lives inside its block (`ListCard`'s `label`), never between blocks.

const TYPE_LABEL: Record<(typeof BOARD_TYPES)[number], string> = {
  feature: 'Feature',
  spike: 'Spike',
  bug: 'Bug',
  chore: 'Chore',
}

/**
 * result-record D11 — a shipped epic's result under its name: the Bean, its word, and `from → actual (target)`. Only
 * an epic that carries a target shows one (growing until read), so the 54 epics shipped before the record show none.
 */
export function CardResult({ card }: { card: BoardCard }) {
  if (!card.result) return null
  const r = epicResult(card.result)
  if (!r.bean) return null
  const line = resultLine(r)
  return (
    <span className="ds-board-card-result">
      <Bean kind={r.bean} decorative />
      <b>{BEAN_WORDS[r.bean]}</b>
      {line ? <span>{line}</span> : null}
    </span>
  )
}

function cardMeta(card: BoardCard): string {
  return [
    card.grain === 'Seed' ? 'seed' : null,
    card.type,
    card.risk ? `risk ${card.risk.toLowerCase()}` : null,
    card.buildOrder !== null ? `#${card.buildOrder}` : null,
    card.stage === 'Building' || card.stage === 'QA' ? card.sprintProgress : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function BoardView({
  board,
  filters,
  base,
  freshness,
  version,
  title = 'Board',
  lede = 'Every initiative on six stages, from an idea to shipped. Open a card for its goal, its docs and the next command.',
  action,
  leadingChips,
  carry = {},
  cardHref,
  note,
  showAnswer = true,
}: {
  board: Board
  filters: BoardFilters
  base: string
  freshness: Freshness | null
  version: number | null
  title?: string
  lede?: string
  /** The head's primary action (the workspace board's "Open a project's board", S4.2). */
  action?: ReactNode
  /** Chips drawn BEFORE the type chips (the workspace board's project filter, S4.2). */
  leadingChips?: ReactNode
  /** Query kept on every chip and card link (the workspace board's `project`). */
  carry?: Record<string, string>
  /** Where a card opens — its epic page on this project (one-epic-page D3) unless the caller says otherwise. */
  cardHref?: (card: BoardCard) => string
  /** The closing note, replacing the project board's provenance sentence (the workspace board has one per project). */
  note?: ReactNode
  /** The approved `hub-workspace-board` state draws no answer line (head → toolbar → tiles → note). */
  showAnswer?: boolean
}) {
  const chip = (label: string, next: BoardFilters, current: boolean) => (
    <a
      key={label}
      className="ds-chip"
      href={`${base}${boardQuery(next, carry)}`}
      aria-current={current ? 'true' : undefined}
    >
      {label}
    </a>
  )
  // The filters ride along so the epic page's Back returns to this board as it was (one-epic-page D3).
  const href =
    cardHref ??
    ((card: BoardCard) =>
      `${base.replace(/\/board$/, '')}/epic/${encodeURIComponent(card.slug)}${boardQuery(filters)}`)
  return (
    <>
      <PageHead title={title} lede={lede} actions={action} />
      {showAnswer ? <Answer freshnessTone={freshness?.tone}>{board.answer}</Answer> : null}

      {/* S2.4 — the filters are links, so they live in the URL and a filtered board is a shareable link. */}
      <nav className="ds-toolbar" aria-label="Filter the board">
        {leadingChips}
        {chip('All types', { ...filters, type: null }, filters.type === null)}
        {BOARD_TYPES.map((type) => chip(TYPE_LABEL[type], { ...filters, type }, filters.type === type))}
        {chip('High risk', { ...filters, highRisk: !filters.highRisk }, filters.highRisk)}
      </nav>

      <div className="ds-tiles ds-tiles--board">
        {board.columns.map((column) => (
          <section
            key={column.stage}
            className="ds-tile ds-board-col"
            aria-label={stageLabel(column.stage)}
            data-stage={column.stage}
          >
            {/* one-header-one-name D8 — the column SHOWS its screen word; `data-stage` and the key stay the stored value. */}
            <p className="ds-tile-label">{stageLabel(column.stage)}</p>
            <p className="ds-tile-value">{column.cards.length}</p>
            {column.wip ? (
              <p className="ds-board-wip" data-over={column.wip.over ? 'true' : 'false'}>
                {column.wip.over
                  ? `over its WIP limit of ${column.wip.limit}`
                  : column.wip.at
                    ? `at its WIP limit of ${column.wip.limit}`
                    : `WIP limit ${column.wip.limit}`}
                {/* The tile's number is what the filters show; WIP is the whole column's (round-2 review, #226). */}
                {column.wip.count !== column.cards.length ? ` (${column.wip.count} in the whole column)` : ''}
              </p>
            ) : null}
            {column.cards.length > 0 ? (
              <ul className="ds-board-cards">
                {column.cards.map((card) => (
                  // A slug is unique within ONE project; the workspace board mixes several (S4.2).
                  <li key={`${card.project ?? ''}/${card.slug}`}>
                    <a className="ds-board-card" href={href(card)}>
                      {card.name}
                      <span className="ds-board-card-meta">
                        {card.project ? `${card.project} · ` : ''}
                        {cardMeta(card)}
                      </span>
                      <CardResult card={card} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {note ?? (
        <p className="ds-hint" data-freshness-tone={freshness?.tone}>
          Generated from each initiative&apos;s frontmatter, git and GitHub. A view, never ticked by hand.{' '}
          {freshness?.tone === 'stale' ? <strong>Possibly stale — </strong> : null}
          Pushed{' '}
          {freshness?.iso ? (
            <time dateTime={freshness.iso} title={freshness.iso}>
              {freshness.age}
            </time>
          ) : (
            (freshness?.age ?? 'at an unknown time')
          )}
          {freshness?.shortCommit ? ` as of ${freshness.shortCommit}` : ''}
          {version !== null ? ` (push #${version})` : ''}.
          {board.shippedOutsideWindow > 0
            ? ` Shipped shows the last 30 days; ${board.shippedOutsideWindow} older shipped initiative${
                board.shippedOutsideWindow === 1 ? ' is' : 's are'
              } on the Roadmap tab.`
            : ''}
        </p>
      )}
    </>
  )
}

export function EmptyBoard() {
  return (
    <>
      <PageHead title="Board" lede="Every initiative on six stages, from an idea to shipped." />
      <Empty
        title="Nothing on the board yet."
        body={
          <>
            Push your roadmap with:{' '}
            <code className="ds-mono">npx -y @golden-frijoles/kit roadmap-extract --sink hub</code>
          </>
        }
      />
    </>
  )
}
