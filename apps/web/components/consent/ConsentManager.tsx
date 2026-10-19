'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { GoogleAnalytics } from '@next/third-parties/google'
import { CLARITY_PROJECT_ID, GA4_MEASUREMENT_ID } from '@/lib/analytics-ids'
import {
  CONSENT_OPEN_EVENT,
  CONSENT_STORAGE_KEY,
  analyticsAllowed,
  parseStoredConsent,
  serializeConsent,
  type ConsentChoice,
  type StoredConsent,
} from '@/lib/consent'
import { isMarketingPath } from '@/lib/marketing-paths'

// landing-launch-experiment · Sprint 1, Story 1.1 (epic D8) — the consent banner, and the only place GA4 and Clarity
// can load from.
//
// ── Two gates, both required ─────────────────────────────────────────────────────────────────
// 1. The PATH: only the marketing allow-list (lib/marketing-paths.ts). Clarity records the screen, so a member's
//    console, a share link or /install's minted connector URL must never be on a page that can load it. Off the list
//    this component renders nothing at all — no banner, no script — whatever the visitor once answered.
// 2. The VISITOR: deny by default (lib/consent.ts). Before an explicit yes there is no third-party script tag in the
//    document, which is what the spec asserts; "denied" is the same as "never asked", minus the banner.
//
// Withdrawing consent reloads the page: a script already running cannot be unloaded, and the honest way to stop it is
// a fresh document without it.

function readStored(): StoredConsent | null {
  try {
    return parseStoredConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
  } catch {
    return null // storage blocked (private mode, a policy): deny, and keep asking.
  }
}

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] }

function loadClarity() {
  const w = window as unknown as { clarity?: ClarityFn }
  if (!w.clarity) {
    const queue: ClarityFn = Object.assign((...args: unknown[]) => (queue.q = queue.q ?? []).push(args), {})
    w.clarity = queue
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`
    document.head.appendChild(script)
  }
  // Clarity needs an explicit consent signal for EEA/UK/CH traffic (required since 31 Oct 2025). Analytics only: we
  // run no ads.
  w.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' })
}

export function ConsentManager() {
  const pathname = usePathname()
  const onMarketing = isMarketingPath(pathname ?? '')
  // `undefined` until mounted: the server cannot read localStorage, so nothing renders before hydration and the
  // server HTML never carries a third-party tag.
  const [stored, setStored] = useState<StoredConsent | null | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const current = readStored()
    setStored(current)
    setOpen(current === null)
    const reopen = () => setOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen)
  }, [])

  const allowed = onMarketing && analyticsAllowed(stored ?? null)

  // Whether THIS document has third-party scripts running. They cannot be unloaded, and a client-side navigation keeps
  // the document: a soft link from the landing to /install or /app would carry Clarity's recorder onto a page that must
  // never be recorded. So leaving the allow-list after they loaded costs a full load, which starts a clean document.
  const thirdPartiesLoaded = useRef(false)
  useEffect(() => {
    if (allowed) {
      loadClarity()
      thirdPartiesLoaded.current = true
    } else if (!onMarketing && thirdPartiesLoaded.current) {
      window.location.reload()
    }
  }, [allowed, onMarketing])

  const choose = useCallback(
    (choice: ConsentChoice) => {
      const wasAllowed = analyticsAllowed(stored ?? null)
      try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, serializeConsent(choice, new Date()))
      } catch {
        // Not stored: the answer holds for this page only, and the banner asks again next time.
      }
      setStored({ choice, at: new Date().toISOString() })
      setOpen(false)
      if (wasAllowed && choice === 'denied') window.location.reload()
    },
    [stored]
  )

  if (!onMarketing || stored === undefined) return null

  return (
    <>
      {allowed ? <GoogleAnalytics gaId={GA4_MEASUREMENT_ID} /> : null}
      {open ? (
        <div className="consent-banner" role="dialog" aria-live="polite" aria-label="Cookie settings">
          <p className="consent-banner__text">
            We count visits ourselves, without third-party cookies. With your OK we also use Google Analytics
            and Microsoft Clarity to see where visitors come from and where this page loses them.
          </p>
          <div className="consent-banner__actions">
            <button type="button" className="btn btn-ghost" onClick={() => choose('denied')}>
              Decline
            </button>
            <button type="button" className="btn btn-gold" onClick={() => choose('granted')}>
              Accept
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

/** The footer's way back to the banner. */
export function CookieSettingsLink({ className = 'icon-link' }: { className?: string }) {
  return (
    <button
      type="button"
      className={`${className} consent-settings-link`}
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
    >
      Cookie settings
    </button>
  )
}
