import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { isBillingCheckoutEnabled, isSignupEnabled } from '@/lib/flags'
import { getSessionUser } from '@/lib/supabase-auth'
import { GROWTH_CTA_NOTE, growthCta } from '@/lib/billing-view'

// landing-launch-experiment · S4.4 (D28) — the Growth tier's button and the sentence under it, ONE component for A and B so
// the two arms of the test make the same offer. The answer is lib/billing-view.ts → growthCta; this only renders it.
//
// Signed in, it is a POST form (a prefetch or crawler must never start a checkout, codex #412) and the checkout route
// resolves the workspace itself. The session read is cheap for a signed-out visitor: with no auth cookie there is nothing to
// verify. `waitlist` renders the page's own fallback, since A and B each have their own.
export async function GrowthCta({
  variant,
  className,
  formClassName,
  trailing,
  waitlist,
  note,
}: {
  variant: 'gold' | 'ghost'
  className?: string
  formClassName?: string
  /** A's buttons end in an arrow; B's do not. */
  trailing?: ReactNode
  waitlist: ReactNode
  note: (text: string) => ReactNode
}) {
  // Each gate awaited on its own line: a gate is a Promise, and lib/gates-guard.test.ts asks to SEE the await (rule #6).
  const checkoutOn = await isBillingCheckoutEnabled()
  const signupOn = await isSignupEnabled()
  const signedIn = checkoutOn ? await isSignedIn() : false
  const state = growthCta({ checkoutOn, signedIn, signupOn })

  const button =
    state === 'checkout' ? (
      <form method="post" action="/api/v1/billing/checkout" className={formClassName}>
        <Button type="submit" variant={variant} className={className}>
          Get Growth
          {trailing}
        </Button>
      </form>
    ) : state === 'waitlist' ? (
      waitlist
    ) : (
      <Button href="/signup" variant={variant} className={className}>
        {state === 'signup' ? 'Get Growth' : 'Start free'}
        {trailing}
      </Button>
    )
  return (
    <>
      {button}
      {note(GROWTH_CTA_NOTE[state])}
    </>
  )
}

/** "Signed out" when the auth config is missing: the landing must not 500 over a button, and this answer grants nothing —
 *  the button then goes to sign-up, and the checkout route checks the session again itself. Logged, so it is not silent. */
async function isSignedIn(): Promise<boolean> {
  try {
    return (await getSessionUser()) !== null
  } catch (err) {
    console.error(
      '[landing] could not read the session for the Growth tier:',
      err instanceof Error ? err.message : err
    )
    return false
  }
}
