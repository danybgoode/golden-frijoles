import type { Metadata } from 'next'
import { BOOKING_URL, bookingEmbedUrl } from '@/lib/booking'
import { Icon } from '@/components/ui/Icon'
import { Frame, FrameLink } from '@/design-system/Frame'

export const metadata: Metadata = {
  title: 'Golden Frijoles — Set up with us',
  description:
    'A half-day working session with Daniel on a live project of yours: we run your first bet with your team. From $1,500, growth included for 3 months.',
}

// landing-maker-ops · Sprint 5 — the Pods booking flow; since landing-launch-experiment S5.1, "Set up with us": the
// white-glove offer, priced from $1,500, booked through a 20-minute first conversation (the `quick-chat` event).
//
// ── Why this is a ROUTE and not an embed on the pricing tier ──────────────────────────────────
// The obvious build is Cal.com's own embed script dropped into `PricingSection`, which opens the
// booker in a modal. It was rejected for three reasons, in increasing order of importance:
//
//   1. It puts a third-party <script> on the landing page — the page every visitor loads — to serve
//      a control that a small fraction of them will ever press.
//   2. That script executes in OUR origin. An <iframe> does not: it is a cross-origin document, and
//      the same-origin policy alone stops it reading this page, its cookies or its DOM. (That is
//      ISOLATION, not sandboxing — there is no `sandbox` attribute here, deliberately; see the note
//      on the element itself.)
//   3. A modal gives the reader no room to be told what the conversation actually is. The reader
//      arriving here has exactly one question — "what am I agreeing to?" — and a calendar grid does not
//      answer it: the page says what the session is, what you leave with and what it costs.
//
// ── The frame is NEVER the only way through ───────────────────────────────────────────────────
// An iframe to a third party has a failure mode a local test will never show you: it renders as a
// blank rectangle. A tracking blocker, a corporate proxy, an offline Cal.com, a future
// `X-Frame-Options` on their side — every one of those produces a page that looks finished and
// books nobody, and the reader cannot tell whether it is broken or still loading.
//
// CODE-QUALITY #8 ("a zero and a broken read are indistinguishable") is normally about numbers; it
// is the same failure. So the direct link is rendered UNCONDITIONALLY, as ordinary copy rather than
// as an error state — it costs one line for everyone and it is the whole feature for anyone the
// frame fails. It is not conditional on the frame failing, because nothing in this page can detect
// that: a cross-origin iframe's load event fires for a blocked frame too.
//
// ── design-system-rails · Sprint 6, Story 6.2 — the approved `public-talk` state ───────────────
//
// It moves from the landing's `Nav`/`Footer` to DD3's PUBLIC frame, at the 1080px measure the
// approved state uses. Two corrections were forced by the product's own facts, and both are the
// D10 class — the prototype's data is not the product's:
//
//   · The approved lede says **"Thirty minutes, no deck."** The shipped page, and the Cal.com event
//     it books (`quick-chat`), are **twenty**. The number the product can keep is the one that
//     ships; a mock's round number is not a scheduling change.
//   · The approved aside had three items. Since landing-launch-experiment S5.1 it has five (the session, what
//     you leave with, the price, the direct booking link, the demo). The direct booking link is kept because
//     it is the escape hatch above, and the header comment explains why it cannot be conditional.
//     Dropping it to match a mock would delete the only path through for every reader whose browser
//     blocks the frame.
//
// `force-dynamic` no longer has a flag to read — `Nav` (and its `isSignupEnabled()` call) is gone
// with the landing chrome — but the page still renders a THIRD-PARTY embed URL and nothing here
// should be frozen into a build. Kept deliberately rather than dropped as now-unused.
export const dynamic = 'force-dynamic'

export default function TalkPage() {
  return (
    <Frame
      variant="public"
      wide
      brandHref="/"
      agentFooter
      actions={
        <>
          <FrameLink href="/install">Try the demo</FrameLink>
          <FrameLink href="/login">Sign in</FrameLink>
        </>
      }
    >
      <h1>Set up with us</h1>
      <p className="ds-lede">
        A half-day working session with Daniel on a live project of yours, where we run your first bet with
        your team. From $1,500. The calendar books a 20-minute first conversation to scope it.
      </p>

      <div className="ds-talkgrid">
        {/* A third-party embed cannot be made to match the design system, so it is not pretended
            into one: it gets a bordered slot that says "this is somebody else's frame". Styling
            around an iframe until it almost matches is worse than admitting the seam.

            `title` is required, not decorative: it is the accessible name of the frame, and an
            unnamed iframe is announced as "frame" with no indication of what is in it. No `sandbox`
            attribute — a booking flow needs scripts, forms and same-origin storage to function, so a
            sandbox tight enough to be worth having would break the thing it is protecting. The
            isolation that matters (it cannot read this page) is inherent to cross-origin framing and
            is not something sandbox adds. */}
        <div className="ds-talkslot">
          <iframe src={bookingEmbedUrl()} title="Book a time with Daniel on Cal.com" loading="lazy" />
        </div>

        <div className="ds-talkaside">
          <div className="ds-talkitem">
            <b>What the session is</b>
            <span>
              Half a day, working with Daniel on a live project of yours. We run your first bet with your
              team.
            </span>
          </div>
          <div className="ds-talkitem">
            <b>What you leave with</b>
            <span>
              A first bet placed with its why, target and read date, so it can be proved by that date. A
              written readout. Golden Frijoles set up in your repo.
            </span>
          </div>
          <div className="ds-talkitem">
            <b>Price</b>
            <span>The session is from $1,500. Growth included for 3 months.</span>
          </div>
          {/* Unconditional, and deliberately not styled as an error. See the header comment: this
              page cannot detect a blocked frame, so the escape hatch has to be ordinary copy that is
              always there rather than a fallback waiting for a signal that never arrives. */}
          <div className="ds-talkitem">
            <b>Or book it directly</b>
            <span>
              The calendar is Cal.com. If it does not load — a blocker, a proxy, a bad connection — this is
              the same booking page, opened on its own.
              <FrameLink href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Open the booking page
                <Icon name="external" size={13} />
              </FrameLink>
            </span>
          </div>
          <div className="ds-talkitem">
            <b>Would rather just look?</b>
            <span>
              The demo connector is live and needs no call.
              <FrameLink href="/install">Point Claude at it</FrameLink>
            </span>
          </div>
        </div>
      </div>
    </Frame>
  )
}
