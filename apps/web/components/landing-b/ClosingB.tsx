import Link from 'next/link'
import { CopyPromptCard } from '@/components/landing/CopyPromptCard'
import { installPrompt } from '@/lib/install-prompt'
import { getSiteUrl } from '@/lib/site-url'

// landing-launch-experiment · S3.3 — B's closing CTA: the SHARED prompt card (same copy, same event as A).
export function ClosingB() {
  return (
    <section className="lb-band lb-closing" id="close">
      <div className="lb-wrap">
        <h2>
          Your next epic could be <span className="lb-foil">the one that pays off</span>
        </h2>
        <p className="lb-copy">
          Paste this into Claude Code, Codex or Cursor. Your agent reads the install page, tells you what it
          will change, and waits for your go-ahead.
        </p>
        <CopyPromptCard
          label="Paste this into your agent"
          prompt={installPrompt(getSiteUrl())}
          trackSurface="landing-copy"
        />
        <p className="lb-note">
          Free for one workspace. Rather have it set up with your team?{' '}
          <Link href="/talk">Book a conversation</Link>.
        </p>
      </div>
    </section>
  )
}
