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
  // Unix only, said rather than implied (verifier, #324): npm's Windows shims (`gf.cmd`, `gf.ps1`) start
  // `node …\\dist\\bin.js`, so argv[1] is the entry file and a Windows `gf` gets no notice. It still works until the
  // alias is removed; the CHANGELOG and the release notes carry the warning for everyone.
  if (name !== 'gf') return null
  return `gf is now frijoles. gf stops working on ${REMOVE_GF_BY} (or in CLI ${REMOVE_GF_IN_VERSION}).\n`
}
