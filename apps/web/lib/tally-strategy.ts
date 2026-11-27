// What tally (the owner's analytics app) shows on Golden Frijoles' "North Star" tab, beside the live readings.
// Copied from Roadmap/00-strategy/north-star.md and the persona poster (one-pagers/persona-poster.html), which live
// outside git: the strategy folder is the owner's working copy, and this is the agreed text as of 2026-11-27. When
// the strategy changes, change it here too (tally shows `as_of` so a stale copy is visible).

export const STRATEGY_AS_OF = '2026-11-27'

export const NORTH_STAR = {
  game: 'Productivity: the job is turning intent into outcomes a maker can prove, not shipping output faster.',
  statement:
    'Our path to sustainable growth is a function of our ability to help product makers reach their product goals, ' +
    'and know that they reached them, with less manual work and more high-level thinking.',
  metric_plain:
    'Proven bets: bets recorded with an appetite that reach an evidenced verdict, win or loss, by the read date set ' +
    'when the bet was placed. Counted per calendar month across all workspaces. A verdict without evidence does not count.',
  // Lagging: what proven bets should move, over months (the "business results" row of the North Star map).
  lagging: [
    'Retained paying workspaces',
    'Net revenue per workspace',
    'Free-to-paid conversion',
    'Customer lifetime value',
  ],
}

// Amplitude's five levers: breadth, depth, frequency, efficiency (and the fifth, none here).
export const INPUT_CONTEXT: Record<string, { lever: string; plain: string; how: string }> = {
  proving_workspaces: {
    lever: 'Breadth',
    plain: 'Workspaces with at least one proven bet this month',
    how: 'Read from product events (workspace_proved_bet), distinct per month',
  },
  proving_landing_workspaces: {
    lever: 'Breadth',
    plain: 'Of those, workspaces that came in through the landing page',
    how: 'Read from product events (landing_workspace_proved_bet), distinct per month; our own workspaces never count',
  },
  grounded_bets_share: {
    lever: 'Depth',
    plain: 'Share of bets placed against a North Star input, with a target and a read date',
    how: 'Pushed from outside until the bet-verdict record exists',
  },
  bets_placed_per_workspace: {
    lever: 'Frequency',
    plain: 'Bets placed per active workspace per month',
    how: 'Pushed from outside (the bets ledger)',
  },
  cost_per_proven_bet: {
    lever: 'Efficiency',
    plain: 'Build spend divided by proven bets (lower is better)',
    how: 'Pushed from outside (FinOps actual spend ÷ proven bets)',
  },
}

export const PERSONA = {
  as_of: STRATEGY_AS_OF,
  name: 'Mara, the founder who owns the product',
  note: 'A composite, not a real person. Goals, frustrations and drivers agreed 2026-10-05; still a hypothesis (n=1).',
  quote: "Building is cheap now. Knowing what's worth building, and proving it worked, isn't.",
  facts: [
    ['Role', 'Founder (CEO or technical co-founder), or a PM, PO or designer building her own thing'],
    ['Stage', 'Solo (her plus agents) to mid-size (10–50 people)'],
    ['Builds', 'Solo: through coding agents herself. Mid-size: through a product team that uses agents'],
    ['Answers to', 'Herself, a co-founder, investors or a board'],
    [
      'Stack today',
      'Coding agents (Claude Code, Cursor), Jira or Linear, Notion, PostHog or Amplitude, a flag tool',
    ],
  ],
  goals: [
    'Reach product-market fit, or its next stage, before the runway ends',
    'Grow revenue with the smallest possible team; keep burn low',
    'Turn every unit of build spend into evidence of what works',
    'Show the board, investors or a co-founder auditable progress',
  ],
  frustrations: [
    "Output isn't outcomes: knowing what to build is the hard part now",
    'Spend with no attribution: what was built and what it cost never connect to revenue',
    'Process that serves itself: agile run on ceremony and red tape',
    "Long projects don't scale: one-off agent tasks are easy, a professional practice isn't",
  ],
  drivers: [
    'Ambition',
    'Runway and capital efficiency',
    'Conviction: evidence, not opinion',
    'Leverage',
    'Credibility',
  ],
  success: 'At least one proven bet a month, and a verdict she can put in front of her board.',
  not_her: [
    'Executives at large companies with a PMO already in place (later)',
    'Founders who want output, not evidence',
    'Studios building for clients (a separate segment)',
  ],
}
