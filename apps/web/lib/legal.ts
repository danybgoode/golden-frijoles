// landing-launch-experiment · Sprint 4 — the Terms and the Privacy notice, as data: one place each sentence lives, read by
// app/terms and app/privacy, and pinned by lib/legal.test.ts against the facts the code itself decides (the plan limits,
// the price, the analytics that need consent), so a page cannot quietly drift from what the product does.
//
// Approved by Daniel 2026-10-20 (PR #416). Plain-language terms written from what the code does; not legal advice.
// His decisions: no personal name, operated from Mexico City; contact, law, refunds and notice periods as drafted; gb_vid and
// gb_variant stay as they are (no consent gate), disclosed below.

/** Cookie and storage names, as the modules that set them spell them. Literals, because this module is imported by the
 *  unit layer and stays import-free; lib/legal.test.ts asserts each equals its source constant, so a rename fails CI. */
export const STORAGE_NAMES = {
  visitorCookie: 'gb_vid', // lib/marketing-paths.ts → VISITOR_COOKIE
  variantCookie: 'gb_variant', // lib/landing-variant.ts → ACQUISITION_VARIANT_COOKIE
  consentKey: 'gf_consent', // lib/consent.ts → CONSENT_STORAGE_KEY
  progressKey: 'gf.methodology.read.v1', // lib/methodology-progress.ts → PROGRESS_STORAGE_KEY
} as const
const VISITOR_COOKIE_NAME = STORAGE_NAMES.visitorCookie
const VARIANT_COOKIE_NAME = STORAGE_NAMES.variantCookie
const CONSENT_KEY = STORAGE_NAMES.consentKey
const PROGRESS_KEY = STORAGE_NAMES.progressKey

export type LegalSection = { heading: string; paragraphs: string[] }
export type LegalDoc = { title: string; updated: string; lede: string; sections: LegalSection[] }

export const LEGAL_UPDATED = '2026-10-20'

/** Who runs the service and where disputes go. Daniel, 2026-10-20: no personal name, only where it is operated from. */
export const OPERATOR = {
  name: 'Golden Frijoles',
  operatedBy: 'from Mexico City, Mexico',
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
  lede: `These terms are the agreement between you and ${OPERATOR.name}, operated ${OPERATOR.operatedBy}. By creating an account or using the service you accept them. If you use it for a company, you accept them for that company.`,
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
        `You can delete a product from the console; it disappears at once, and 30 days later you can purge its data for good with \`frijoles projects purge\`, or ask us to. To close your account and delete everything, write to ${OPERATOR.contact}.`,
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
        `${OPERATOR.name}, operated ${OPERATOR.operatedBy}. Write to ${OPERATOR.contact} about anything on this page.`,
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: [
        'Your account: your email address, a password (stored hashed by our authentication provider) or your Google sign-in, the name you choose to show, your workspace and its products, and the credentials you create. API keys and share links are stored only as hashes; connector tokens and webhook signing secrets are stored as issued, because the service has to present them.',
        'Billing: when you buy Growth we give Stripe your account email, and Stripe collects your card and billing details. We keep only the Stripe customer and subscription identifiers and your plan; we never see your card number.',
        'Your products’ data: the events, flags and settings your products send. For this data you decide what is sent and why; we process it on your behalf to run the service, and send it on only to the destinations (webhooks) you configure.',
        'Our own product use: we record what visitors do on our site (visits to the home page and the methodology, which landing version they saw, joining the waitlist, starting a sign-up) and what accounts do in the product (for example signing up, creating a product, a product sending its first event, opening a shared report), in our own Golden Frijoles project, to improve the product. These records carry a random visitor id or an account id, never your name or email.',
        `Cookies and browser storage: ${VISITOR_COOKIE_NAME}, a random visitor id kept for a year, so a visit and a later sign-up count as the same visitor; ${VARIANT_COOKIE_NAME}, which version of the home page you were shown, kept for 90 days; and, when you sign in, the session cookies that keep you signed in. Your browser also stores your analytics answer (${CONSENT_KEY}) and which methodology chapters you have read (${PROGRESS_KEY}); neither leaves your device.`,
        'Abuse protection: we keep a one-way hash of your IP address for a short time to rate-limit sign-ups, the waitlist and other public forms.',
        'The waitlist and booking: if you join the waitlist we keep your email. The /talk page embeds the Cal.com calendar, so opening it sends your browser’s request (your IP address and browser details) to Cal.com, and booking a session gives Cal.com your booking details.',
      ],
    },
    {
      heading: 'Analytics, only with your yes',
      paragraphs: [
        'On our public pages (the home page, the methodology, /talk, sign-up and sign-in) we ask before loading Google Analytics and Microsoft Clarity. Clarity records how the page is used, including clicks and scrolling. Nothing loads until you say yes, it never loads inside the console, and you can change your answer at any time from “Cookie settings” in the footer of our home page.',
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
        'Account and workspace data: while your account is open. Your products’ data: until you purge a deleted product or close your account. Billing records: as long as tax law requires. Server logs: as long as our hosting providers keep them, typically days to weeks.',
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
