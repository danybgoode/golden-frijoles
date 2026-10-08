// account-from-the-terminal · Sprint 1, Story 1.2 (amended 2026-10-05, canvas First run frames 2–3) — the
// claims install.md's "Security review" asks an agent to check against the release.
//
// ── Every claim has a test, and the test reads the release ───────────────────────────────────────
// A security review is only worth something if the page it checks against is true. Each claim below has an
// `id`, and `install-security-claims.test.ts` holds one test per id that reads the shipped code off disk
// (`skills/plugins/…`, `skills/kit/…`, `packages/cli/…`) and fails when the release stops matching the
// sentence. A claim without a test fails that file too, so a new sentence cannot be added on trust.
//
// The wording is narrower than the canvas draft where the code is: the status line does go online, through
// your own `git` and `gh`, and the spend push goes to the engine you configure — so the page says that.

import { CLI_BIN } from './cli-install'
import { KIT_PACKAGE } from './install-prompt'
import { PLUGIN_VERSION } from './plugin-release.generated'

export type SecurityClaim = { id: string; text: string }

export function securityClaims(siteUrl: string): SecurityClaim[] {
  const site = new URL(siteUrl).host
  return [
    {
      id: 'nothing-at-install',
      text:
        'Nothing runs at install time: installing copies files. The plugin registers no install hooks (its only ' +
        'code that runs by itself is the status line below, which starts with a Claude Code session), and the ' +
        `kit, the \`${CLI_BIN}\` CLI and its SDK have no npm install scripts.`,
    },
    {
      id: 'cli-talks-to-site',
      text:
        `The \`${CLI_BIN}\` CLI talks only to ${site} (or the URL you give it with \`--api\` or ` +
        `\`GOLDEN_FRIJOLES_URL\`), plus registry.npmjs.org when \`${CLI_BIN} doctor\` checks for a newer version.`,
    },
    {
      id: 'keys-in-env-local',
      text:
        `\`${CLI_BIN}\` writes your project's key only to \`.env.local\` (mode 0600), and only once \`.gitignore\` ` +
        'covers it; its own sign-in token goes only to `~/.config/golden-frijoles/credentials.json` (mode 0600).',
    },
    {
      id: 'kit-pinned',
      text:
        `The skills run the kit through \`npx\`, pinned to this release: \`npx -y ${KIT_PACKAGE}@${PLUGIN_VERSION}\`. ` +
        '(Hand-off commands refine prints for you to copy name the kit without a version.)',
    },
    {
      id: 'status-line',
      text:
        "The status line reads `Roadmap/`, git and this project's Claude Code transcripts. It goes online only " +
        "through your own `git` and `gh`, to read this branch's pull request, and sends usage only if you turn " +
        'spend telemetry on — then only to the engine URL you set.',
    },
  ]
}
