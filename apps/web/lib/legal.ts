// landing-launch-experiment · Sprint 4 — the Terms and the Privacy notice, as data: one place each sentence lives, read by
// app/terms and app/privacy, and pinned by lib/legal.test.ts against the facts the code itself decides (the plan limits,
// the price, the analytics that need consent), so a page cannot quietly drift from what the product does.
//
// ⚠️ DRAFT for Daniel's approval (2026-10-20). Plain-language terms written from what the code does; not legal advice.
// The operator's legal name and the governing law are the two facts only Daniel can state (OPERATOR below).

export type LegalSection = { heading: string; paragraphs: string[] }
export type LegalDoc = { title: string; updated: string; lede: string; sections: LegalSection[] }

export const LEGAL_UPDATED = '2026-10-20'

/** Who runs the service and where disputes go. Daniel's to confirm before this ships. */
export const OPERATOR = {
  name: 'Golden Frijoles',
  // ⚠️ Daniel: replace with your full legal name (or your company's) before this ships.
  operatedBy: 'its founder, Daniel, an individual based in Mexico City, Mexico',
  contact: 'miyagi@despachobonsai.com',
  law: 'the laws of Mexico, with the courts of Mexico City',
} as const

/** What the plans give, in the same numbers the database trigger sets (migration 20261022100000). */
export const PLAN_FACTS = {
  freeProducts: 10,
  freeEvents: 200_000,
  growthEvents: 2_000_000,
  growthPriceUsd: 49,
} as const

const n = (value: number) => value.toLocaleString('en-US')

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  updated: LEGAL_UPDATED,
  lede: `These terms are the agreement between you and ${OPERATOR.name}, operated by ${OPERATOR.operatedBy}. By creating an account or using the service you accept them. If you use it for a company, you accept them for that company.`,
  sections: [
    {
      heading: 'The service',
      paragraphs: [
        `${OPERATOR.name} records the events your products send, and turns them into funnels, a North Star metric, feature flags and experiments, with a console, a command-line tool and an agent connection on top. We run it on third-party infrastructure (listed in our Privacy notice) and change it often.`,
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You need an account to use the console. Keep your password, API keys, connector tokens and share links secret: anyone holding one acts as you within what it allows. Revoke a credential you think has leaked; you can do it from the console or the CLI at any time.',
        'Each account owns one workspace. The person who creates a workspace is its owner and the only one who can buy or cancel its plan.',
      ],
    },
    {
      heading: 'Plans and limits',
      paragraphs: [
        `Free: up to ${n(PLAN_FACTS.freeProducts)} products and ${n(PLAN_FACTS.freeEvents)} events a month, shared by every product in the workspace.`,
        `Growth: $${PLAN_FACTS.growthPriceUsd} a month per workspace, unlimited products and seats, and ${n(PLAN_FACTS.growthEvents)} events a month shared by every product.`,
        'When a workspace reaches its monthly events, further events are refused until the first of the next month (UTC). We never charge for events over a limit.',
      ],
    },
    {
      heading: 'Payment, renewal and cancelling',
      paragraphs: [
        `Growth is billed monthly in US dollars, in advance, through Stripe, and renews each month until you cancel. Taxes are added where we are required to collect them.`,
        'Cancel any time from Plan & billing → Manage billing. The workspace keeps Growth until the end of the month you paid for, then returns to Free; nothing is deleted. We do not refund part of a month, but if we charged you in error, we refund it.',
        'If a payment fails, Stripe retries it. A subscription that stays unpaid ends, and the workspace returns to Free.',
        'We may change the price. A new price applies from your next renewal after we tell you at least 30 days ahead, and you can cancel before it does.',
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'The events, flags and other data your products send stay yours. You give us the right to store and process them only to run the service for you. Do not send us data you have no right to share, or special-category data (health, biometrics and the like) about the people who use your products.',
        `You can delete a product from the console; it disappears at once and its data is purged after. To close your account and delete everything, write to ${OPERATOR.contact}.`,
      ],
    },
    {
      heading: 'Acceptable use',
      paragraphs: [
        'Do not use the service to break the law, to send malware, to probe or overload it, to get around its limits or another workspace’s boundaries, or to resell it as your own. We may suspend an account that does, and will tell you why unless the law or a security risk prevents it.',
      ],
    },
    {
      heading: 'Availability and changes',
      paragraphs: [
        'We work to keep the service up, but it is provided as it is, without a guaranteed uptime. We may change or stop features; if we stop the service altogether we will give you at least 30 days to export your data.',
      ],
    },
    {
      heading: 'Liability',
      paragraphs: [
        'To the extent the law allows, we are not liable for indirect or consequential losses (lost profits, revenue or data), and our total liability for any claim is limited to what you paid us in the 12 months before it. Nothing here limits liability that the law does not allow to be limited.',
      ],
    },
    {
      heading: 'Ending, changes and law',
      paragraphs: [
        'You can stop using the service at any time. We may end these terms if you materially break them.',
        'We may update these terms. For a material change we will tell account owners at least 30 days ahead; using the service after that means you accept it.',
        `These terms are governed by ${OPERATOR.law}. Questions: ${OPERATOR.contact}.`,
      ],
    },
  ],
}

export const PRIVACY: LegalDoc = {
  title: 'Privacy notice',
  updated: LEGAL_UPDATED,
  lede: `What ${OPERATOR.name} collects about you, why, who else handles it, and what you can ask for. Written for people who use the console and people who visit our site.`,
  sections: [
    {
      heading: 'Who is responsible',
      paragraphs: [
        `${OPERATOR.name}, operated by ${OPERATOR.operatedBy}. Write to ${OPERATOR.contact} about anything on this page.`,
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: [
        'Your account: your email address, a password (stored hashed by our authentication provider) or your Google sign-in, the name you choose to show, your workspace and its products, and the credentials you create (stored only as hashes).',
        'Billing: when you buy Growth, Stripe collects your card and billing details. We keep only the Stripe customer and subscription identifiers and your plan; we never see your card number.',
        'Your products’ data: the events, flags and settings your products send. For this data you decide what is sent and why; we process it on your behalf to run the service.',
        'Our own product use: we record what accounts do in the console (for example, that an account signed up or created a product) in our own Golden Frijoles project, to improve the product. Our site sets one first-party cookie, gb_vid, a random visitor id kept for a year, so a visit and a later sign-up count as the same visitor.',
        'The waitlist and booking: if you join the waitlist we keep your email. If you book a session on /talk, Cal.com collects your booking details.',
      ],
    },
    {
      heading: 'Analytics, only with your yes',
      paragraphs: [
        'On our public pages (the home page, the methodology, /talk, sign-up and sign-in) we ask before loading Google Analytics and Microsoft Clarity. Clarity records how the page is used, including clicks and scrolling. Nothing loads until you say yes, it never loads inside the console, and you can change your answer at any time from “Cookie settings” in the footer.',
      ],
    },
    {
      heading: 'Who else handles it',
      paragraphs: [
        'Supabase (database and sign-in; stored in the United States, AWS us-east-1), Vercel (hosting; United States), Cloudflare (network), Stripe (payments), Google (sign-in with Google, and Google Analytics with your consent), Microsoft (Clarity, with your consent) and Cal.com (bookings). Each processes data under its own terms and only for the service it provides us. We do not sell personal data, and we do not use your products’ data for advertising.',
      ],
    },
    {
      heading: 'Public numbers',
      paragraphs: [
        'Golden Frijoles is built in the open: aggregate numbers about our own product (funnels, North Star, roadmap, flags) are public. They never name or identify a person, and they never include your products’ data.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Account and workspace data: while your account is open. Your products’ data: until you delete the product or close your account. Billing records: as long as tax law requires. Server logs: a few days to weeks, as our hosts keep them.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        `You can ask to see, correct, export or delete your personal data, or object to how we use it, by writing to ${OPERATOR.contact}. We answer within 30 days. Depending on where you live (for example under Mexico’s data-protection law, the GDPR in Europe or the CCPA in California), you can also complain to your data-protection authority.`,
        'Our servers are in the United States. By using the service from elsewhere you understand your data is processed there, under the safeguards our providers offer.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'We will update this notice when what we collect or who handles it changes, and tell account owners about a material change before it applies.',
      ],
    },
  ],
}
