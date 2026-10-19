import Link from 'next/link'
import { BrandLockup } from '@/components/brand/BrandLockup'
import { Button } from '@/components/ui/Button'
import './nav-hero.css'

// landing-launch-experiment · Sprint 3, S3.1 (epic D18) — B's nav, from the approved prototype v3. Root-relative links
// (`/#loop`), not bare fragments, for the reason recorded in landing/Nav.tsx. The brand is the shared lockup, not the
// prototype's drawn bean. "Sign in" is a `Button` (a bare `<a>` to a page fails `no-html-link-for-pages`) styled as a
// plain link; the gold CTA is the in-page jump to the hero's prompt card.
export function NavB() {
  return (
    <nav className="lb-nav">
      <div className="lb-wrap lb-nav__row">
        <BrandLockup compact />
        <div className="lb-nav__links">
          <Link className="lb-nav__plain" href="/#loop">
            Product
          </Link>
          <Link className="lb-nav__plain" href="/#pricing">
            Pricing
          </Link>
          <Link className="lb-nav__plain" href="/#note">
            Why we built it
          </Link>
          <Button className="lb-nav__plain lb-nav__signin" variant="ghost" href="/login">
            Sign in
          </Button>
          <Link className="btn btn-gold" href="/#start">
            Start free
          </Link>
        </div>
      </div>
    </nav>
  )
}
