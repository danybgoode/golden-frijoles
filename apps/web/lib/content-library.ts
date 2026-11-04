// traffic-relaunch · Sprint 2, Story 2.1 — the guides, comparisons and glossary, in ONE typed module (the
// `lib/methodology-chapters.ts` pattern, epic D9 + S2 build contract).
//
// Every surface derives from this array: the three index pages, the entry pages (`generateStaticParams`), the sitemap
// and llms.txt (`lib/public-routes.ts`), the JSON-LD (`lib/content-jsonld.ts`) and the beacon's tag validation. A new
// entry is one object here; a retired one disappears from all of them at once.
//
// The rules for what goes in an entry, because these pages travel without the landing around them:
//   · `answer` is the page's first line and the one an assistant quotes. One or two sentences, no hedging fog, no
//     capability a flag can switch off (the positioning.ts rule).
//   · Commands are the real ones (`lib/install-prompt.ts`, the CLI's own usage strings), never paraphrased.
//   · A comparison is fair and dated: it says what the other tool does well, and `updated` is a real date.
//   · `updated` is the day the entry's text was last edited by hand. It is what the sitemap may carry.
//
// Pure: no imports beyond other pure modules, so the unit layer reads it whole.

import { CATEGORY_DEFINITION } from './positioning'
import { PLUGIN_INSTALL, PLUGIN_MARKETPLACE_ADD } from './install-prompt'

export const LIBRARY_SECTIONS = ['guides', 'compare', 'glossary'] as const
export type LibrarySection = (typeof LIBRARY_SECTIONS)[number]

export const SECTION_META: Record<LibrarySection, { title: string; lede: string }> = {
  guides: {
    title: 'Guides',
    lede: 'How to run a product practice with agents: decide what to build, ship it behind a switch, and prove whether it paid off.',
  },
  compare: {
    title: 'Comparisons',
    lede: 'Where Golden Frijoles sits next to the tools you may already use, written to be fair and dated.',
  },
  glossary: {
    title: 'Glossary',
    lede: 'The few words this method uses, each defined once.',
  },
}

export type LibraryBlock =
  { kind: 'p'; text: string } | { kind: 'h2'; text: string } | { kind: 'code'; text: string }

export type LibraryEntry = {
  section: LibrarySection
  slug: string
  title: string
  /** One line for search results and link previews. */
  description: string
  /** The page's opening answer, the line an assistant quotes. */
  answer: string
  body: LibraryBlock[]
  /** Question/answer pairs: FAQPage JSON-LD on guides and comparisons. */
  faq: Array<{ q: string; a: string }>
  /** YYYY-MM-DD, the day the text was last edited by hand. */
  updated: string
}

const p = (text: string): LibraryBlock => ({ kind: 'p', text })
const h2 = (text: string): LibraryBlock => ({ kind: 'h2', text })
const code = (text: string): LibraryBlock => ({ kind: 'code', text })

export const LIBRARY: readonly LibraryEntry[] = [
  // ── Guides ────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    section: 'guides',
    slug: 'after-spec-driven-development',
    title: 'What comes after spec-driven development',
    description:
      'Spec-driven development gets an agent from intent to merged code. The next step is proving whether that code paid off.',
    answer:
      'Spec-driven development stops at the merge. What comes after it is outcome-driven development: every change ships as a bet with a target, behind a switch, and gets a verdict from real usage — proven, disproven or unclear.',
    body: [
      p(
        'Spec-driven tools give a coding agent a persistent plan: a spec, then tasks, then code, with a person reviewing between steps. That fixed the first problem of agentic building — agents drifting from intent. It did not fix the second: nobody can say whether the feature they shipped mattered.'
      ),
      h2('The missing half'),
      p(
        'Building is cheap now. Knowing what was worth building is not. A spec says what to build; it says nothing about how you will know it worked, what it cost, or what to do if it did not. Those questions live in analytics, flags and experiment tools that never see the spec.'
      ),
      h2('Outcome-driven development in practice'),
      p(
        'Each piece of work is shaped as a bet: the number it should move, for whom, and by when. It ships behind a flag you can switch off without a deploy. Usage is measured against the bet, and the bet gets a verdict. The verdict feeds the next decision.'
      ),
      p('With Golden Frijoles, your own coding agent runs that loop. In Claude Code:'),
      code(`${PLUGIN_MARKETPLACE_ADD}\n${PLUGIN_INSTALL}`),
    ],
    faq: [
      {
        q: 'Is outcome-driven development a replacement for spec-driven development?',
        a: 'No. It starts where a spec ends: the spec says what to build, the outcome loop says whether building it paid off.',
      },
      {
        q: 'What does an outcome loop need that a spec tool lacks?',
        a: 'A target for each change, a switch to turn it off, measurement of real usage, and a recorded verdict.',
      },
    ],
    updated: '2026-11-03',
  },
  {
    section: 'guides',
    slug: 'measure-feature-adoption-rate',
    title: 'How to measure feature adoption rate',
    description:
      'Adoption rate is the share of the people who could use a feature who actually did. Here is how to measure it honestly.',
    answer:
      'Feature adoption rate is the number of people who used a feature divided by the number who were given it, over the same period. Count the denominator from who got the feature, not from everyone, or a new feature will always look like a failure.',
    body: [
      h2('Pick the three events first'),
      p(
        'Before shipping, name three events: the one that means someone was given the feature (targeted), the one that means they used it (adopted), and the one that means they came back to it (retained). Without them, “adoption” is whatever a dashboard happens to count.'
      ),
      h2('Use the right denominator'),
      p(
        'Divide by the people who were given the feature, not your whole user base. A feature rolled out to 10% of users with 5% of everyone using it is a 50% adoption rate, not 5%.'
      ),
      h2('Read it by cohort'),
      p(
        'Group people by when they first got the feature. A cohort that has not had time to come back yet is maturing, not failing. Golden Frijoles reads this funnel per month or week:'
      ),
      code('frijoles funnel <feature-key> --by month'),
    ],
    faq: [
      {
        q: 'What is a good feature adoption rate?',
        a: 'It depends on the feature and who it was given to. Set the target before you ship, then compare against it, rather than against an industry average.',
      },
      {
        q: 'What is the difference between adoption and retention?',
        a: 'Adoption is using a feature once; retention is coming back to it within a set number of days.',
      },
    ],
    updated: '2026-11-03',
  },
  {
    section: 'guides',
    slug: 'ab-tests-and-feature-flags-from-claude-code',
    title: 'A/B tests and feature flags from Claude Code',
    description:
      'Create a flag, roll it out and run an A/B test from the terminal, where your coding agent already works.',
    answer:
      'With the Golden Frijoles CLI, a coding agent can create a feature flag, roll it out to a percentage of users, kill it in one command, and start an A/B test on it, all from the terminal.',
    body: [
      h2('A flag with a kill switch'),
      code(
        'frijoles flags create <key> --kill-switch --all-envs\nfrijoles flags rollout <key> --percent 25 --env production\nfrijoles flags kill <key> --env production'
      ),
      p(
        'A kill switch is on until you turn it off; an enablement flag is off until you roll it out. Either way, switching it changes what your app serves without a deploy.'
      ),
      h2('An A/B test on that flag'),
      code('frijoles experiments create --flag <key> --metric <event>\nfrijoles experiments start <key>'),
      p(
        'A test can start at any traffic level. Low traffic is a warning about how long a clear answer will take, never a reason to block the start.'
      ),
    ],
    faq: [
      {
        q: 'Can Claude Code run an A/B test by itself?',
        a: 'Yes. With the Golden Frijoles CLI installed, the agent can create the flag, create and start the experiment, and read the result.',
      },
      {
        q: 'Does turning a flag off need a deploy?',
        a: 'No. Killing or rolling out a flag changes what your app serves without a deploy.',
      },
    ],
    updated: '2026-11-03',
  },
  // ── Comparisons ───────────────────────────────────────────────────────────────────────────────────────────────────
  {
    section: 'compare',
    slug: 'spec-driven-vs-outcome-driven-development',
    title: 'Spec-driven vs outcome-driven development',
    description:
      'Spec-driven tools keep an agent on plan until the merge. Outcome-driven development keeps going until the change has a verdict.',
    answer:
      'Spec-driven development (Spec Kit, Superpowers, BMAD, Kiro and others) governs how an agent turns intent into code. Outcome-driven development governs whether that code was worth it. They are complements: use a spec tool to build, and an outcome loop to decide what to build next.',
    body: [
      h2('What spec-driven tools do well'),
      p(
        'They make the plan a persistent artifact, so an agent does not drift between sessions, and they put a human review between spec, plan and code. For long builds that is a real improvement over prompting.'
      ),
      h2('Where they stop'),
      p(
        'At the merge. None of them asks what number the change should move, ships it behind a switch, or records whether it worked. That work lands in separate analytics and flag tools that never see the spec.'
      ),
      h2('Where Golden Frijoles fits'),
      p(
        'It runs the whole practice in one loop your agent drives: shape the bet, build and review it, ship it behind a flag, measure it, record the verdict. If you already like a spec tool for the build step, keep it.'
      ),
    ],
    faq: [
      {
        q: 'Do I need to stop using Spec Kit or Superpowers?',
        a: 'No. They cover the build; an outcome loop covers what happens after the merge.',
      },
    ],
    updated: '2026-11-03',
  },
  {
    section: 'compare',
    slug: 'golden-frijoles-vs-posthog',
    title: 'Golden Frijoles vs PostHog for a solo founder',
    description:
      'PostHog is a broad open-source product analytics suite. Golden Frijoles is a product practice an agent runs. Which you need depends on the job.',
    answer:
      'Choose PostHog if you want a broad analytics suite: event analytics, session replay, flags, experiments and more, with a generous free tier. Choose Golden Frijoles if you want your coding agent to run the product practice itself, from shaping a bet to its verdict, with flags, A/B tests and funnels built into that loop.',
    body: [
      h2('Where PostHog is strong'),
      p(
        'Breadth. Session replay, product analytics, dashboards, surveys, flags and experiments in one open-source product, self-hostable or cloud. If your question is “what are users doing?”, it answers a lot of it.'
      ),
      h2('Where Golden Frijoles is different'),
      p(
        'It starts before the code. Each change is shaped as a bet with a target, built and reviewed by your agent, shipped behind a flag and read back as a verdict, with what it cost. It does not do session replay or general-purpose dashboards.'
      ),
      h2('Using both'),
      p(
        'Nothing stops you sending events to both. Many teams keep a replay tool and add an outcome loop for decisions.'
      ),
    ],
    faq: [
      {
        q: 'Does Golden Frijoles have session replay?',
        a: 'No. It focuses on bets, flags, experiments, funnels and verdicts.',
      },
      {
        q: 'Is PostHog open source?',
        a: 'Yes, PostHog is open source and can be self-hosted or used as a cloud service. Check its site for current plans.',
      },
    ],
    updated: '2026-11-03',
  },
  // ── Glossary ──────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    section: 'glossary',
    slug: 'north-star-metric',
    title: 'North Star metric',
    description: 'The one number that says whether the product is creating the value it exists for.',
    answer:
      'A North Star metric is the single number that best captures the value a product delivers to its customers, together with the few input metrics a team can move to grow it.',
    body: [
      p(
        'Golden Frijoles’ own North Star is proven bets: changes that met their target. Its inputs include the share of bets grounded in a target and the cost per proven bet.'
      ),
    ],
    faq: [],
    updated: '2026-11-03',
  },
  {
    section: 'glossary',
    slug: 'tars-funnel',
    title: 'TARS funnel',
    description: 'Targeted, Adopted, Retained, Satisfied: the four steps a feature’s users move through.',
    answer:
      'A TARS funnel follows the people a feature was meant for through four steps: Targeted (given the feature), Adopted (used it), Retained (came back to it) and Satisfied (rated it well).',
    body: [p('Read it per cohort period, so a young cohort reads as maturing rather than as a drop.')],
    faq: [],
    updated: '2026-11-03',
  },
  {
    section: 'glossary',
    slug: 'kill-switch',
    title: 'Kill switch',
    description: 'A feature flag that is on by default and can turn a feature off without a deploy.',
    answer:
      'A kill switch is a feature flag that serves a feature by default and can switch it off for everyone without a deploy, when something goes wrong.',
    body: [code('frijoles flags kill <key> --env production')],
    faq: [],
    updated: '2026-11-03',
  },
  {
    section: 'glossary',
    slug: 'outcome-driven-development',
    title: 'Outcome-driven development',
    description: 'The step after spec-driven development: every change is a bet that ends in a verdict.',
    answer:
      'Outcome-driven development treats every change as a bet with a target: it ships behind a switch, its real usage is measured, and it ends in a verdict of proven, disproven or unclear.',
    body: [p('Specs get you code. Outcomes get you a product.')],
    faq: [],
    updated: '2026-11-03',
  },
  {
    section: 'glossary',
    slug: 'proven-bet',
    title: 'Proven bet',
    description: 'A change that met the target it was shaped to move, by its read date.',
    answer:
      'A proven bet is a change that moved its target metric to the level it promised by its read date. The others are disproven, or unclear when the data cannot tell.',
    body: [p('Gold is reserved for proven bets: a golden bean is one that paid off.')],
    faq: [],
    updated: '2026-11-03',
  },
  {
    section: 'glossary',
    slug: 'agentic-product-management',
    title: 'Agentic product management',
    description: CATEGORY_DEFINITION,
    answer: CATEGORY_DEFINITION,
    body: [
      p(
        'It is not product management of AI agents. It is the product discipline itself, run by one person and the agents that work for them.'
      ),
    ],
    faq: [],
    updated: '2026-11-03',
  },
]

export function entriesIn(section: LibrarySection): LibraryEntry[] {
  return LIBRARY.filter((entry) => entry.section === section)
}

export function findEntry(section: string, slug: string): LibraryEntry | undefined {
  return LIBRARY.find((entry) => entry.section === section && entry.slug === slug)
}

export function isLibrarySection(value: unknown): value is LibrarySection {
  return typeof value === 'string' && (LIBRARY_SECTIONS as readonly string[]).includes(value)
}
