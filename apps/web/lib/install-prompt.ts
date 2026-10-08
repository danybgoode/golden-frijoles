// golden-frijoles-plugin · Sprint 3, Story 3.3 — the ONE install prompt, named once.
//
// ── Why this is a module and not three hand-typed copy blocks ─────────────────────────────────
// S3.3's acceptance is that the landing, `/install` and the signed-in onboarding page all hand
// the reader the SAME prompt, character for character. Three hand-written copies of "run `claude
// plugin install golden-frijoles@golden-frijoles`" agree right up until one of them is edited, and
// the one that drifts is always the one nobody re-reads.
//
// ── Why this is a FUNCTION of `getSiteUrl()` now (account-from-the-terminal D2) ────────────────
// It used to be a constant, because it named only the plugin's own github.com URLs. Since S1.2 the
// prompt tells the agent to read `<site>/install.md` FIRST — the page that says what installs, what
// changes on the machine and which services it contacts — so it names this site, and AGENTS.md rule
// #5 makes every such URL a `getSiteUrl()` value. Callers pass `getSiteUrl()`; nothing here reads env.
//
// ── Where this is the SOURCE ────────────────────────────────────────────────────────────────────
// This is the canonical text. `skills/template/scripts/lib/golden-onboarding.mjs` (mirrored to
// golden-frijoles/skills) TRANSCRIBES `installPrompt(PRODUCTION_SITE_URL)` — the production URL,
// never a preview one — and its own `scripts/check-onboarding-parity.mjs` asserts the README and the
// umbrella SKILL.md carry it verbatim. The weld between this file and that transcription is
// `install-prompt.test.ts`, which reads the transcription off disk (the two live in one monorepo).
//
// Text: the canvas Landing frame (account-from-the-terminal S1.2), verbatim, as one paragraph.

/** The origin the skills repo's transcription is written against. Never used to build a live URL. */
export const PRODUCTION_SITE_URL = 'https://goldenfrijoles.com'

export function installPrompt(siteUrl: string): string {
  return (
    'Set up Golden Frijoles in this project. ' +
    `1. Read ${siteUrl}/install.md before installing anything. ` +
    '2. Tell me in a few lines what it installs, what changes on this machine and which services it contacts. ' +
    'Offer me a security review, and wait for my go-ahead. ' +
    '3. Install it the way install.md says for the agent you are. ' +
    '4. Run the golden-frijoles skill and start its setup.'
  )
}

// ── The plugin install commands, named once (account-from-the-terminal D1) ─────────────────────
// They used to live INSIDE the prompt. The prompt now sends the agent to `install.md` instead, and
// `install.md` (`lib/install-manifest.ts`) and `/install` both render these — so the commands the
// agent runs are the commands a person can read on the site, from one definition.

export const PLUGIN_MARKETPLACE_ADD = 'claude plugin marketplace add golden-frijoles/skills'
export const PLUGIN_INSTALL = 'claude plugin install golden-frijoles@golden-frijoles'
/** Every skill, not just the umbrella: with `--skill golden-frijoles` alone refine's hand-off dead-ends (X12). */
export const SKILLS_ADD = "npx skills add golden-frijoles/skills --skill '*'"
export const PLUGIN_REMOVE = 'claude plugin uninstall golden-frijoles@golden-frijoles'
/** `uninstall` leaves the marketplace registered, and it keeps auto-updating — this removes it. */
export const PLUGIN_MARKETPLACE_REMOVE = 'claude plugin marketplace remove golden-frijoles'
/** The `npx skills` CLI's own documented opt-out from its install telemetry. */
export const SKILLS_TELEMETRY_OPT_OUT = 'DISABLE_TELEMETRY=1'
/** The planning kit the skills run through `npx` (never installed globally). */
export const KIT_PACKAGE = '@golden-frijoles/kit'
export const SKILLS_REPO_URL = 'https://github.com/golden-frijoles/skills'
export const UMBRELLA_SKILL_URL =
  'https://github.com/golden-frijoles/skills/blob/main/plugins/golden-frijoles/skills/golden-frijoles/SKILL.md'
