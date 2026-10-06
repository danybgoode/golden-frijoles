// account-from-the-terminal · Sprint 2, Story 2.1 — the kill-switch DECISION, pure (epic D5).
//
// The app reads its own flag from its own catalog (`lib/terminal-sign-in-flag.ts` does the I/O).
// This is the rule, with no I/O, so every branch is a unit test:
//
//   KILLED only when this deployment's environment SERVES `false`. Every other state — the flag
//   missing, an environment that serves nothing (`off`/`never`: the SDK falls back to the app's
//   literal), an unreadable row, a value that is not a boolean — is the born-ON literal default.
//
// Failing to ON is deliberate and bounded: the switch gates a sign-in METHOD (Google, the device
// flow); password sign-in and token paste stay regardless. A flag outage must not take sign-in
// away, and a kill that IS read lands within the cache window.

export const TERMINAL_SIGN_IN_FLAG_KEY = 'auth.terminal_sign_in_enabled'

export type FlagEnvironmentName = 'development' | 'preview' | 'production'

/** The shape of `CliFlagView['environments'][number]` this rule reads — nothing more. */
export type ServedEnvironment = { environment: string; serving: unknown; readable: boolean }

/** `VERCEL_ENV` → the flag environment this deployment evaluates in. */
export function flagEnvironmentFor(vercelEnv: string | undefined): FlagEnvironmentName {
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'development'
}

export function isTerminalSignInOn(
  environments: readonly ServedEnvironment[] | undefined,
  environment: FlagEnvironmentName
): boolean {
  const served = environments?.find((row) => row.environment === environment)
  if (!served || !served.readable) return true
  return served.serving !== false
}
