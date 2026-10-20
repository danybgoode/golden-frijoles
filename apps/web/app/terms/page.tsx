import type { Metadata } from 'next'
import { TERMS } from '@/lib/legal'
import { LegalPage } from '@/components/legal/LegalPage'

// landing-launch-experiment · Sprint 4 — the Terms of Service, linked from the footer, sign-up and Stripe Checkout.
export const metadata: Metadata = {
  title: 'Golden Frijoles — Terms of Service',
  description:
    'The agreement for using Golden Frijoles: plans, billing, cancelling, your data and acceptable use.',
}

export default function TermsPage() {
  return <LegalPage doc={TERMS} other={{ href: '/privacy', label: 'Privacy' }} />
}
