# Handoff: UX/UI audit of the human GUI (fresh session)

Paste everything below the line into a new session that is **linked to this computer's `golden-frijoles` folder**
(the strategy files are local-only and git-excluded, so a cloud-only clone won't see them). Use the Claude desktop app
with Claude in Chrome connected, so the signed-in console can be walked.

---

We're preparing Golden Frijoles for launch and dogfooding it on itself. Today's job is a **UX/UI audit of the human
GUI**: the signed-in console and its reports, plus the public landing only where it hands a visitor into the product.
Many features were built disconnected, but the primitives are solid; the goal is a cohesive experience in the decided
vocabulary and brand, ending in groomed, funded bets. Planning and audit only: no code.

**Read first (in this order), and state in one line what you loaded:**
1. `Roadmap/00-strategy/brand-platform.md` (agreed): category *outcome-driven development*, personality, voice,
   naming rules, visual principles (gold means proven, evidence on screen, calm dark mode).
2. `Roadmap/00-ideas/audits/naming-spec-plain-outcome-2026-10-04.md`: the decided Plain · Outcome vocabulary and the
   one lifecycle (Idea → Shaping → Ready → Building → Review → Live → Proven · Disproven · Unclear). Console labels
   §5: Board, Outcome report, Adoption funnel (Reached · Adopted · Retained), semantic check.
3. `Roadmap/00-ideas/audits/naming-inventory-2026-10-04.md`: where every name lives today.
4. `Roadmap/00-strategy/pmf-narrative.md`, `north-star.md`, `risk-validation.md` (all agreed) and
   `Roadmap/00-strategy/one-pagers/` (persona poster = the user you audit for: "Mara, the experienced maker").
5. `Roadmap/00-ideas/audits/dogfood-launch-2026-10.md`: the running findings log (F1–F33). Continue numbering there.
6. Prior UX work, to build on rather than redo: `Roadmap/00-ideas/audits/app-ux-audit-2026-08-01.md` (+ its concept
   HTML), seeds `console-ia-overhaul` (scaffolded: "Four destinations"), `app-shell-and-agent-rail`,
   `app-component-kit-adoption`, `design-system-rails`; `apps/web/brand/tokens.css` (the legacy Golden Beans
   roastery world, F24); `apps/web/lib/project-route-inventory.ts` (every surface, label and audience).
7. `Roadmap/00-ideas/BUILD-ORDER.md`: what's funded now (#60 fund-at-approval, #61 plain-outcome-rename,
   #62 coaches-v2). Don't duplicate bet A's slice 5 (console and report labels); audit around it.

**Method**
- Walk the real product as Mara would, in order: landing → signup → onboarding/connect your agent → Today → Ship
  (features, flags, Board, scheduled changes) → Measure (North Star, experiments, funnels, Outcome report) → Setup.
  Use the demo project for public paths and the PO's own project signed in. Screenshot each screen.
- For each surface record: what it's for (in Mara's words), what it calls things vs the naming spec, where it breaks
  the brand platform, state coverage (the ten: idle · hover · focus · pressed · loading · success · error · empty ·
  disabled · unbuilt), mobile at 400px, and whether it connects to the next step of the loop (intent → ship → verdict).
- Score each finding: severity (blocker / friction / polish) and effort (S/M/L). Group them by journey, not by screen.
- Draw the target information architecture once (a flow of the loop across surfaces) and the 3–5 screens that matter
  most as `surface` blocks rendered with `node scripts/sketch-render.mjs` for the PO to approve.

**Deliverables**
1. `Roadmap/00-ideas/audits/ux-ui-audit-2026-10.md`: findings, the target IA, the before/after vocabulary per
   surface, screenshots referenced.
2. A visual review page (an artifact) the PO can click through: current vs proposed per surface.
3. Then `groom` the fixes into bets. If `fund-at-approval` has shipped, the approval gate funds them; if not, place them
   in `Roadmap/bets/` by hand at the gate in the same answer (the rule since 2026-10-04: nothing leaves grooming
   unfunded).

**Constraints and house rules**
- Name is Golden Frijoles; vocabulary is Plain · Outcome; no customer names in copy (F25); no vendor names on stranger
  surfaces; gold only for proven outcomes.
- Strategy stays local (git-excluded); audits and seeds are fine in the public repo but must not carry pricing or
  commercial strategy (AGENTS.md D7: those go to the private `golden-frijoles/internal`).
- AGENTS.md rules apply; never deploy; planning only.
- Environment gotchas from the last session: git in the Cowork VM needs the PO's identity per command
  (`git -c user.name="Daniel" -c user.email="champion327@gmail.com" …`) and delete permission for lock files (F30);
  pushing needs a bundle into a cloud workspace or a push from the PO's machine (F31); Jev's intent score can't reach
  TypeSafe from the VM (F28).

Start by confirming what you loaded, then propose the walk order and the surfaces you'll cover before taking
screenshots.
