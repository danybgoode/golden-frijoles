// plugin-1-0 D2 — the CLI answers to `frijoles`; `gf` still runs it until the date below, with a notice.
//
// `gf` is shadowed on most oh-my-zsh machines (its git plugin defines `alias gf='git fetch'`), so the command
// was renamed. The old name keeps working so scripts and CI jobs don't break overnight, and says so on every run.
// The notice goes to STDERR only: an agent parsing `--json` on stdout must see byte-identical output.
// `scripts/check-deprecations.mjs` turns CI red once REMOVE_GF_BY has passed, so the alias cannot stay forever.

export const REMOVE_GF_BY = '2026-12-31'
export const REMOVE_GF_IN_VERSION = '1.1.0'

/** The notice to print when the CLI was started under its old name, or null. `invokedPath` is `process.argv[1]`. */
export function deprecatedNameNotice(invokedPath: string | undefined): string | null {
  const name = (invokedPath ?? '').split(/[\\/]/).pop() ?? ''
  // npm's Windows shims are `gf.cmd` / `gf.ps1`; strip a known script extension before comparing.
  const bare = name.replace(/\.(cmd|ps1|js|mjs|cjs)$/i, '')
  if (bare !== 'gf') return null
  return `gf is now frijoles. gf stops working on ${REMOVE_GF_BY} (or in CLI ${REMOVE_GF_IN_VERSION}).\n`
}
