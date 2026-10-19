import Link from 'next/link'
import { CopyPromptCard } from '@/components/landing/CopyPromptCard'
import { installPrompt } from '@/lib/install-prompt'
import { getSiteUrl } from '@/lib/site-url'

// landing-launch-experiment · Sprint 3, S3.1 (epic D18) — B's hero: the founder's question first, then the one
// action. The prompt card is the SHARED CopyPromptCard (same copy behaviour and `landing-copy` tracking as A), wrapped
// in `#start` so the nav's "Start free" lands on it.
export function HeroB() {
  return (
    <header className="lb-hero" id="top">
      <div className="lb-wrap lb-hero__wrap">
        <p className="lb-kicker">Product management for teams that ship with agents</p>
        <h1>
          Ship work <span className="lb-foil">that matters</span>
        </h1>
        <p className="lb-hero__sub">Thousands of PRs a day. Did any of them pay off?</p>
        <p className="lb-hero__copy">
          Golden Frijoles keeps the reason for every bet, its numbers and what it cost in one place. Your
          agents work from it, and so does everyone on your team who doesn’t read code.
        </p>
        <div id="start" className="lb-hero__prompt">
          <CopyPromptCard
            label="Paste this into your agent"
            prompt={installPrompt(getSiteUrl())}
            trackSurface="landing-copy"
          />
        </div>
        <div className="lb-hero__row">
          <Link href="#loop">See how it works →</Link>
          <span className="lb-note">
            Free for one workspace. No credit card. Your agent reads the install page before it touches
            anything.
          </span>
        </div>
      </div>
    </header>
  )
}
