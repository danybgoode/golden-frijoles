import type { Metadata } from 'next'
import { PRIVACY } from '@/lib/legal'
import { LegalPage } from '@/components/legal/LegalPage'

// landing-launch-experiment · Sprint 4 — the Privacy notice, linked from the footer, sign-up and Stripe Checkout.
export const metadata: Metadata = {
  title: 'Golden Frijoles — Privacy notice',
  description: 'What Golden Frijoles collects, why, who else handles it, and what you can ask for.',
}

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} other={{ href: '/terms', label: 'Terms' }} />
}
