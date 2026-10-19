import { Button } from '@/components/ui/Button'

// landing-launch-experiment · S3.3 — B's pricing: three tiers, prototype v3's copy. Growth links to /signup (there is
// no checkout) and says so on the card, as A's PricingSection does.
export function PricingB() {
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
            <Button href="/signup" variant="ghost">
              Start free
            </Button>
          </div>
          <div className="lb-tier lb-tier--feat">
            <p className="lb-kicker">Growth</p>
            <p className="lb-price">
              $49<small>/month</small>
            </p>
            <ul>
              <li>Unlimited products and seats</li>
              <li>Larger event allowance</li>
              <li>Longer history</li>
            </ul>
            <Button href="/signup">Start free</Button>
            <p className="lb-note">
              Billing is not live yet: nobody can be charged today. Start free; we will ask before moving you.
            </p>
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
