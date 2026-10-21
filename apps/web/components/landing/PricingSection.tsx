import { isSignupEnabled } from '@/lib/flags'
import { getSection } from '@/lib/landing-sections'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Panel } from '@/components/ui/Panel'
import { WaitlistForm } from './WaitlistForm'
import { GrowthCta } from './GrowthCta'

// landing-redesign-v2 · Sprint 2, Story 2.5 — ⑩ Pricing. Replaces WaitlistSection.tsx.
//
// ── The $49 tier can be bought (landing-launch-experiment S4.4, D28) ────────────────────────
// Until Checkout existed the tier said plainly that nobody could be charged (epic D1, CODE-QUALITY
// #9: a price with no way to pay it is a claim the reader checks after signing up). Checkout is
// live now, so the tier's button and the sentence under it come from GrowthCta, shared with B.
//
// ── The free tier follows the live flag, exactly as the page it replaces did ──────────────────
// `isSignupEnabled()` is read fresh per request. With the gate off there is no `/signup` route to
// send anyone to, so the tier renders the waitlist form instead of a button into a 404. Note the
// event limits below are the ones the tier DESCRIBES, not a quota this code enforces — real
// per-tenant ceilings are data (`projects.monthly_event_quota`), not env and not copy.
export async function PricingSection() {
  const section = getSection('pricing')
  const signupEnabled = await isSignupEnabled()

  return (
    <>
      <section className="band" id="pricing">
        <div className="wrap pricing">
          <h2 className="section-title">Pricing that doesn&apos;t require a meeting</h2>
          {/* `.pricing__intro` is gone from this list, not just from the stylesheet. Its rule was
              fully inert (see globals.css) and deleting it left a class name in the markup with
              nothing behind it — a hook that reads as load-bearing to the next person who greps
              for it. Everything it meant to do is covered: `.measure--narrow` caps the width and
              `.pricing .measure` centres it. Mistral Vibe, round 4 of PR #102. */}
          {/* Epic D1 — no lock-in, said as a price rather than as a promise. The enterprise version
              of this line is a concession won at a negotiating table; ours is that there is
              nothing to escape in the first place. */}
          <p className="measure measure--narrow">
            Start with up to ten products for $0. Bring the rest of the company when they inevitably ask where
            you got the numbers. Nothing here locks you in — not the agent you use, and not a contract.
          </p>
          <p className="takeaway">Humans remain unmetered.</p>

          <div className="cards3 section-lead pricing__grid">
            <Panel className="tier">
              <p className="kicker">A handful</p>
              <p className="tier__price">$0</p>
              <p className="card-copy">
                Up to ten products. Enough Golden Frijoles to find out whether we&apos;re onto something.
              </p>
              <ul className="plain-list">
                <li>Full product context</li>
                <li>Experiments &amp; rollouts</li>
                <li>Agent connection</li>
              </ul>
              {signupEnabled ? (
                <Button href="/signup" variant="ghost" className="panel-tail">
                  Start free
                  <Icon name="arrow-right" />
                </Button>
              ) : (
                <div className="panel-tail">
                  <WaitlistForm compact />
                </div>
              )}
              <p className="note">
                {signupEnabled
                  ? 'No credit card. We checked.'
                  : 'Self-serve signup is gated off in this deployment — the queue is real, and tenants are provisioned by a human with a checklist.'}
              </p>
            </Panel>

            <Panel className="tier tier--featured">
              <p className="tier__flag">MOST PLANTED</p>
              <p className="kicker">The beanstalk</p>
              <p className="tier__price">
                $49<small>/mo</small>
              </p>
              <p className="card-copy">For products that kept growing.</p>
              <ul className="plain-list">
                <li>Higher-volume ingest</li>
                <li>Unlimited projects</li>
                <li>Unlimited seats</li>
              </ul>
              {/* S4.4 (D28): Get Growth — checkout signed in, sign-up first signed out, "paused" while the switch is off. The
                  gated-off branch still points at `/#start`, the closing section with the decision prompt (round 8, PR #100). */}
              <GrowthCta
                variant="ghost"
                className="panel-tail"
                formClassName="panel-tail"
                trailing={<Icon name="arrow-right" />}
                waitlist={
                  <Button href="/#start" variant="ghost" className="panel-tail">
                    Ask your agent first
                    <Icon name="arrow-right" />
                  </Button>
                }
                note={(text) => <p className="note">{text}</p>}
              />
            </Panel>

            {/* landing-launch-experiment S5.1 (Daniel, 2026-10-19) — the third tier is "Set up with us", from $1,500, the
                same offer B makes and /talk now describes. Changed in BOTH arms before launch, so the A/B test compares
                the story, not the offer; A's markup pin was regenerated for exactly this edit. */}
            <Panel className="tier">
              <p className="kicker">Set up with us</p>
              <p className="tier__price">
                <small>from</small> $1,500
              </p>
              <p className="card-copy">
                A half-day working session on a live project of yours: we run your first bet with your team.
              </p>
              <ul className="plain-list">
                <li>Half-day working session on a live project</li>
                <li>A written readout</li>
                <li>The beanstalk ($49 a month) included for 3 months</li>
              </ul>
              <Button href="/talk" variant="ghost" className="panel-tail">
                Book a conversation
                <Icon name="arrow-right" />
              </Button>
              <p className="note">A 20-minute first conversation to scope it.</p>
            </Panel>
          </div>

          <p className="note pricing__note">
            We meter events. Not coworkers. Per-tenant limits are set on the tenant, not by this page —
            raising one is a database change, never a redeploy. ({section.epic})
          </p>
        </div>
      </section>
    </>
  )
}
