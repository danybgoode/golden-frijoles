import { Button } from '@/components/ui/Button'
import { WaitlistForm } from '@/components/landing/WaitlistForm'
import { GrowthCta } from '@/components/landing/GrowthCta'
import { isSignupEnabled } from '@/lib/flags'

// landing-launch-experiment · S3.3 — B's pricing: three tiers, prototype v3's copy. S4.4 (D28): Growth's button and its
// sentence come from GrowthCta, the same component A's tier uses, so the two arms make the same offer. "Longer history"
// was never built (Free has no history limit), so the line names the allowance in numbers instead (D22's debt).
// The signup gate is read per request, as A's PricingSection reads it: with `auth.signup_enabled` killed there is no
// `/signup` to send anyone to, so the two self-serve tiers offer A's waitlist instead of a button into a 404 (verifier,
// #409 — "read the flag", the same class Codex caught on A).
export async function PricingB() {
  const signupEnabled = await isSignupEnabled()
  const startFree = (variant: 'gold' | 'ghost') =>
    signupEnabled ? (
      <Button href="/signup" variant={variant}>
        Start free
      </Button>
    ) : (
      <WaitlistForm compact />
    )
  return (
    <section className="lb-band lb-band--alt" id="pricing">
      <div className="lb-wrap">
        <div className="lb-head">
          <p className="lb-kicker">Pricing</p>
          <h2>Start free. Pay when it’s earning.</h2>
          <p>One price per workspace. Add as many products and people as you like.</p>
        </div>
        <div className="lb-tiers">
          <div className="lb-tier">
            <p className="lb-kicker">Free</p>
            <p className="lb-price">$0</p>
            <ul>
              <li>One workspace</li>
              <li>Funnels, North Star, flags and tests</li>
              <li>Agent connection and CLI</li>
            </ul>
            {startFree('ghost')}
          </div>
          <div className="lb-tier lb-tier--feat">
            <p className="lb-kicker">Growth</p>
            <p className="lb-price">
              $49<small>/month</small>
            </p>
            <ul>
              <li>Unlimited products and seats</li>
              <li>2,000,000 events a month (Free: 200,000)</li>
              <li>Cancel any time from Plan &amp; billing</li>
            </ul>
            <GrowthCta
              variant="gold"
              waitlist={<WaitlistForm compact />}
              note={(text) => <p className="lb-note">{text}</p>}
            />
          </div>
          <div className="lb-tier">
            <p className="lb-kicker">Set up with us</p>
            <p className="lb-price">
              <small>from</small> $1,500
            </p>
            <ul>
              <li>We run your first bet with your team</li>
              <li>Half-day working session on a live project</li>
              <li>Written readout</li>
              <li>Growth included for 3 months</li>
            </ul>
            <Button href="/talk" variant="ghost">
              Book a conversation
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
