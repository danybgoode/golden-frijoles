import { gate } from './gates'
import { GATES } from './gates-decision'

// account-from-the-terminal · Sprint 2, Story 2.1 — the ONE seam for `auth.terminal_sign_in_enabled` (epic D5).
// Read by the Google buttons, `/cli/connect` and both device endpoints; nothing else decides whether terminal
// sign-in is on. Since one-product-project S2.1 it is one gate among the others in lib/gates-decision.ts, read from
// the `golden-frijoles` catalog, born ON: `gf flags kill auth.terminal_sign_in_enabled --env production` is the
// kill, with no env var and no redeploy, landing within the seam's 30 s cache.
export function isTerminalSignInEnabled(): Promise<boolean> {
  return gate(GATES.terminalSignIn)
}
