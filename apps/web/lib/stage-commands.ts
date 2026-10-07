import type { BoardCard } from './hub-board'

// board-sinks-and-scrumban · Sprint 2, Story 2.3 — the commands a card offers, by stage.
// one-epic-page · Sprint 1, Story 1.3 (lock D7) — rewritten as PLAIN LINES any agent understands.
//
// ONE map keyed by stage. Each line names the step, the epic (its slug — what every script and skill takes) and the
// product (its slug: a project has no other name), and BEGINS WITH THE VERB of its `Roadmap/SESSION-KICKOFFS.md`
// shorthand (Groom, Bet, Build, Resume, Wrap, Review, Close), so an agent that knows the table still lands on the same
// step and one that does not can read the sentence. The shorthand rides along on every entry and stays valid. The two
// `node scripts/…` lines stay commands (a spec holds each to the template). The Hub only SHOWS them to copy — it runs
// nothing (board D8). Pure and import-free at runtime (a type import is erased), so `node --test` loads it directly.

export type StageCommand = {
  /** What the command does, in a few words ("Wrap the sprint"). */
  label: string
  /** The line to paste: plain words, or a script. */
  text: string
  /** The `SESSION-KICKOFFS.md` shorthand it expands from — null for a script line, which IS the command. */
  shorthand: string | null
}

/** `Roadmap/<macro>/<slug>/README.md` → `<macro>/<slug>`, the key `epic-dod` takes. */
function epicKey(card: BoardCard): string | null {
  const m = (card.links.readme ?? '').match(/^Roadmap\/([^/]+\/[^/]+)\/README\.md$/)
  return m ? m[1] : null
}

const COMMANDS: Record<BoardCard['stage'], (card: BoardCard, product: string) => StageCommand[]> = {
  'To groom': (card, p) => [
    { label: 'Groom it', text: `Groom the ${card.slug} idea in ${p}`, shorthand: `Groom: ${card.name}` },
  ],
  Grooming: (card, p) => [
    {
      label: 'Resume the groom at its approval gate',
      text: `Groom the ${card.slug} idea in ${p}, resuming at its approval gate`,
      shorthand: `Groom: ${card.slug}`,
    },
    {
      label: 'Bet it at the wave boundary',
      text: `Bet the ${card.slug} idea at the wave boundary in ${p}`,
      shorthand: 'Bet the wave',
    },
  ],
  'Ready to build': (card, p) =>
    card.grain === 'Epic'
      ? // The kickoff itself is the page's head action. No "regenerate" command: the generator's path depends on where
        // the plugin is installed, and a copied command that fails is worse than none (fresh review, #226).
        [
          {
            label: 'Build it',
            text: `Build the ${card.slug} epic in ${p}`,
            shorthand: `Build epic ${card.slug}`,
          },
        ]
      : [
          {
            label: 'Build it (fixed scope)',
            text: `Build ${card.slug} in ${p}, fixed scope`,
            shorthand: `Build: ${card.slug}`,
          },
        ],
  Building: (card, p) => {
    const n = currentSprint(card)?.n ?? null
    return [
      // No `session-trail` command: the template does not ship that script (round-2 review, #226). `Resume` expands to it
      // where it exists.
      {
        label: 'Resume a session that died',
        text: `Resume the ${card.slug} ${card.grain === 'Epic' ? 'epic' : 'work'} in ${p} where its last session stopped`,
        shorthand: 'Resume',
      },
      ...(card.grain === 'Epic' && n !== null
        ? [
            {
              label: 'Wrap the sprint',
              text: `Wrap sprint ${n} of the ${card.slug} epic in ${p}`,
              shorthand: `Wrap S${n}`,
            },
          ]
        : []),
    ]
  },
  QA: (card, p) => {
    const key = epicKey(card)
    const open = card.pr && card.pr.state === 'OPEN'
    return [
      ...(open
        ? [
            {
              label: 'Review it',
              text: `Review pull request #${card.pr!.number} for the ${card.slug} ${card.grain === 'Epic' ? 'epic' : 'work'} in ${p}`,
              shorthand: `Review PR #${card.pr!.number}`,
            },
            {
              label: 'Route the review',
              text: `node scripts/review-route.mjs --builder <who-wrote-it> ${card.pr!.number}`,
              shorthand: null,
            },
          ]
        : []),
      ...(card.grain === 'Epic'
        ? [
            {
              label: 'Close it',
              text: `Close the ${card.slug} epic in ${p}`,
              shorthand: `Close epic ${card.slug}`,
            },
            ...(key
              ? [
                  {
                    label: 'Check the Definition of Done',
                    text: `node scripts/epic-dod.mjs --check ${key}`,
                    shorthand: null,
                  },
                ]
              : []),
          ]
        : []),
    ]
  },
  Shipped: () => [],
}

/**
 * The commands for this card's stage, the one to run now FIRST (the Now panel's head; the rest go under More). Empty
 * for Shipped: nothing is owed. `product` is the project's slug.
 */
export function stageCommands(card: BoardCard, product: string): StageCommand[] {
  return COMMANDS[card.stage](card, product)
}

// one-epic-page D8 — the Now panel's other two parts, beside the command they introduce.

/** The first sprint that is not done — what the epic is working on now, and what a Resume or a Wrap is about. */
export function currentSprint(card: Pick<BoardCard, 'sprints'>): BoardCard['sprints'][number] | null {
  return card.sprints.find((s) => s.total === 0 || s.done < s.total) ?? card.sprints.at(-1) ?? null
}

/**
 * The Now panel's "when": where the stage was read from, without the pusher's machine timestamp (`· snapshot@…`), which
 * is an implementation detail of the build view, not a date anyone reads.
 */
export function stageWhen(card: Pick<BoardCard, 'stageSource' | 'pr' | 'shippedAt'>): string | null {
  if (card.shippedAt) return `shipped ${card.shippedAt}`
  if (card.pr)
    return `pull request #${card.pr.number} · ${card.pr.draft ? 'draft' : card.pr.state.toLowerCase()}`
  const source = card.stageSource?.replace(/\s*·\s*snapshot@\S+$/, '').trim()
  return source ? `read from ${source}` : null
}

/** The Now panel's one line on what is happening at this stage. */
export function nowLine(card: BoardCard): string {
  switch (card.stage) {
    case 'To groom':
      return 'An idea, not groomed yet: no appetite, no slices, no target.'
    case 'Grooming':
      return 'Being shaped into a pitch: appetite, slices and a target, then the approval gate.'
    case 'Ready to build':
      return card.bet
        ? `Funded (${card.bet})${card.buildOrder !== null ? `, #${card.buildOrder} in the build order` : ''}. Ready to build.`
        : 'Groomed and ready to build, not funded yet.'
    case 'Building': {
      const sprint = currentSprint(card)
      if (!sprint) return 'Being built.'
      return `Sprint ${sprint.n} of ${card.sprints.length}${sprint.title ? `: ${sprint.title}` : ''} · ${sprint.done} of ${sprint.total} stories done.`
    }
    case 'QA':
      if (card.pr?.state === 'OPEN')
        return `Pull request #${card.pr.number} is ${card.pr.draft ? 'in draft' : 'open for review'}.`
      return card.grain === 'Epic' ? 'Merged. The close-out is owed.' : 'Merged.'
    case 'Shipped':
      return 'Shipped. Nothing is owed.'
  }
}
