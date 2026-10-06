import { installPrompt } from '@/lib/install-prompt'
import { getSiteUrl } from '@/lib/site-url'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { CopyPromptCard } from './CopyPromptCard'
import { RunYourFirstBet } from './RunYourFirstBet'

// landing-maker-ops · Sprint 2, Story 2.1 — the repositioned hero, rebuilt by
// agentic-pm-public-surface · Sprint 2, Story 2.1 (epic D3.1 and D5).
//
// The headline opens on a buyer who may not be inside a company: agents made it possible for one
// person to hold a product that used to need a department, and what that person lacks is not the
// ability to ship — it is somewhere for the shipping to go.
//
// ── The right column is now a thing you can use, not a picture of one ────────────────────────
// It used to carry two objects: a kraft bag listing the four Ops surfaces, and an illustrated agent
// window showing a conversation that never happened. Both were arguments made in pictures, on a
// page whose whole claim is evidence over assertion — and the reader had to take both on trust.
//
// A `CopyPromptCard` carrying `handoffPrompt` replaces them. The reader pastes it into their own
// agent, which reads `/llms.txt`, explains us plainly (the prompt explicitly tells it NOT to sell),
// and offers to run the North Star workshop. That is a stronger opening than a stat tile, because
// it does not require being believed: a stranger's own agent goes and checks.
//
// ── Nothing honest was lost with the bag, and that was checked rather than hoped ──────────────
// The bag's rows were DERIVED from `MAKER_OPS_SURFACES` with each gate resolved per request — the
// fix for three separate review findings that were all one defect (a gated capability listed
// without its qualification, found once per surface because fixing one list never reached the
// other). Deleting it removes a second copy of that derivation, not the derivation: §ops resolves
// the same surfaces from the same module, per request, and the long note explaining why it must
// stay derived now lives in `OpsSection.tsx`, which is its only remaining site.
//
// This component therefore reads NO flags. If a future hero needs to make a capability claim, it
// resolves it from `lib/maker-ops.ts` — it does not write one down here.
//
// ── Why the page now carries TWO prompt cards (epic D5) ──────────────────────────────────────
// `landing-readability-pass` D1 cut the old §try on the grounds that two copy-a-prompt blocks read
// as a pattern rather than an invitation. That ruling stands for two blocks asking the SAME thing.
// These ask different things at different moments: the top offers to teach you something, and the
// closing CTA asks your own agent whether to bother with us at all. The page also now has a
// graphic-free hero, which needs a reason to exist.
//
// `handoffPrompt` had been written, documented, specced and CALL-SITE-FREE for two epics — dead
// code that every test in `e2e/landing-prompts.spec.ts` was faithfully exercising. This is its
// first real call site since §try was cut.
//
// ── account-from-the-terminal · Sprint 1, Story 1.3 — one line and the install prompt ──────────
// The canvas Landing frame: the hero says what the product does in ONE line, with the prompt that
// installs it right there. The two `.hero-sub` paragraphs and the `handoffPrompt` card are gone; the
// card now carries `installPrompt(getSiteUrl())` — the same string `/install`, onboarding and the
// closing CTA carry. Everything below the hero is untouched (the story's acceptance). The comments
// above are kept as the history of what this hero argued before; `handoffPrompt` stays exported and
// pinned by `e2e/landing-prompts.spec.ts`, as `decisionPrompt` already was.
export function MakerHero() {
  return (
    <section className="hero" id="hero">
      <div className="wrap hero-grid">
        <div>
          {/* No terminal full stop: headings are titles, not sentences — the D7 rule
              `scripts/check-design-drift.mjs` enforces, which reads only the final character. The
              foil half is the payoff, which is the whole typographic idea of this hero. */}
          <h1 className="display">
            Plan, ship and <em className="foil">prove it paid off</em>
          </h1>

          <div className="hero-cta">
            <RunYourFirstBet />
            {/* methodology-experience · Story 2.4 — the real route, not an in-page anchor. */}
            <Button href="/methodology" variant="ghost">
              See how the method works
              <Icon name="arrow-right" />
            </Button>
          </div>
        </div>

        {/* The install prompt names `<site>/install.md`, so it takes `getSiteUrl()` (AGENTS rule #5). */}
        <div className="hero-magic">
          <CopyPromptCard label="Paste this into your agent" prompt={installPrompt(getSiteUrl())} />
        </div>
      </div>
    </section>
  )
}
