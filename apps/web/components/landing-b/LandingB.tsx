import { Footer } from '@/components/landing/Footer'
import { NavB } from './NavB'
import { HeroB } from './HeroB'
import { StepsB } from './StepsB'
import { AgentStripB } from './AgentStripB'
import { FounderNoteB } from './FounderNoteB'
import { PricingB } from './PricingB'
import { ClosingB } from './ClosingB'
import './landing-b.css'
// close.css styles four sections (agent strip, note, pricing, closing CTA), so it is owned here, not by one of them.
import './close.css'

// landing-launch-experiment · Sprint 3 (epic D18) — variant B of the landing, the story under test: the founder's job
// first ("did any of it pay off?"), then the six things that happen to a bet, in the order they happen. The contract is
// the approved prototype v3 (`references/landing-b-prototype-v3.html`, local-only). Everything is scoped under `.lb`,
// so nothing here can restyle A, which stays the control. The footer is A's (it carries "Cookie settings", D8).
export function LandingB() {
  return (
    <div className="lb">
      <NavB />
      <HeroB />
      <StepsB />
      <AgentStripB />
      <FounderNoteB />
      <PricingB />
      <ClosingB />
      <Footer />
    </div>
  )
}
