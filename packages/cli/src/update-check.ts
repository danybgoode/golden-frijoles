// `frijoles update` and the once-a-day "a newer frijoles is out" notice — the pure parts, so the unit layer pins them.
//
// ── Why a notice at all ───────────────────────────────────────────────────────────────────────
// The plugin's skills pin an exact CLI (`npx -y @golden-frijoles/cli@<v>`), so plugin users move with the plugin. A
// person who ran `npm i -g @golden-frijoles/cli` never hears about a release: the CLI never said, and `doctor` never
// checked. Daniel, 2026-10-21: "do we have a frijoles update command? or how do users update?"
//
// ── What it must never do ─────────────────────────────────────────────────────────────────────
// Slow a command down, or write anything an agent parses. So: at most one registry call a day (cached), a short
// timeout, stderr only, and never under `--json`, in CI, or when GOLDEN_FRIJOLES_NO_UPDATE_CHECK / NO_UPDATE_NOTIFIER
// is set. `run()` only checks when the executable asks it to (an interactive terminal), so no test ever reaches npm.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const PACKAGE = '@golden-frijoles/cli'
export const REGISTRY_LATEST = 'https://registry.npmjs.org/@golden-frijoles%2fcli/latest'
const DAY_MS = 24 * 60 * 60 * 1000

/** Compare two `x.y.z` versions numerically (a pre-release suffix counts as older than its release). */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core, pre] = v.trim().replace(/^v/, '').split('-', 2)
    return { parts: core.split('.').map((n) => Number.parseInt(n, 10) || 0), pre: pre ?? null }
  }
  const x = parse(a)
  const y = parse(b)
  for (let i = 0; i < 3; i++) {
    const d = (x.parts[i] ?? 0) - (y.parts[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  if (x.pre === y.pre) return 0
  if (x.pre === null) return 1
  if (y.pre === null) return -1
  // Identifier by identifier, numerically where both are numbers (rc.2 < rc.10), as semver orders them.
  const xs = x.pre.split('.')
  const ys = y.pre.split('.')
  for (let i = 0; i < Math.max(xs.length, ys.length); i++) {
    if (xs[i] === undefined) return -1
    if (ys[i] === undefined) return 1
    const xn = /^\d+$/.test(xs[i]) ? Number(xs[i]) : null
    const yn = /^\d+$/.test(ys[i]) ? Number(ys[i]) : null
    if (xn !== null && yn !== null) {
      if (xn !== yn) return xn < yn ? -1 : 1
    } else if (xs[i] !== ys[i]) return xs[i] < ys[i] ? -1 : 1
  }
  return 0
}

/**
 * A whole version string and nothing else: `x.y.z` with an optional `-pre.release`. ANCHORED — the version from the
 * registry is put on `npm i -g`'s command line, which Windows runs through cmd.exe, so a trailing `& …` must never pass
 * (verifier, #428; the same class device-login.ts closed in #280).
 */
export function isPlainVersion(value: string): boolean {
  return /^\d{1,6}\.\d{1,6}\.\d{1,6}(?:-[0-9A-Za-z.-]{1,64})?$/.test(value)
}

/** The script that is really running: npm's global and `.bin` entries are SYMLINKS, and Node keeps the link's path in
 *  argv[1] — so a global install looked like a checkout until it was resolved (verifier, #428). */
export function resolveScriptPath(
  path: string | undefined,
  realpath: (p: string) => string
): string | undefined {
  if (!path) return undefined
  try {
    return realpath(path)
  } catch {
    return path
  }
}

export type InstallMethod = 'global' | 'npx' | 'local' | 'source'

/**
 * How this copy was installed, from the path of the running script. npx runs from its cache (`…/_npx/…`); a global
 * install lives under the npm prefix's `lib/node_modules` (or `node_modules` straight under the prefix on Windows); a
 * project dependency under a project's `node_modules`; anything else is a checkout run from source.
 */
export function installMethodFor(scriptPath: string | undefined, globalRoot?: string | null): InstallMethod {
  if (!scriptPath) return 'source'
  const path = scriptPath.replace(/\\/g, '/')
  if (path.includes('/_npx/')) return 'npx'
  const root = globalRoot?.replace(/\\/g, '/').replace(/\/$/, '')
  if (root && path.startsWith(`${root}/`)) return 'global'
  if (path.includes('/lib/node_modules/@golden-frijoles/cli/')) return 'global'
  if (path.includes('/node_modules/@golden-frijoles/cli/')) return 'local'
  return 'source'
}

/** What to run to get `latest`, for each way of installing. `global` is the only one `frijoles update` runs itself. */
export function updateAdvice(method: InstallMethod, latest: string): { command: string; note: string } {
  switch (method) {
    case 'global':
      return { command: `npm i -g ${PACKAGE}@${latest}`, note: 'Updates the global install.' }
    case 'npx':
      return {
        command: `npx -y ${PACKAGE}@${latest} --version`,
        note: `npx reuses the copy it cached first; name the version (or @latest) to get ${latest}.`,
      }
    case 'local':
      return {
        command: `npm i -D ${PACKAGE}@${latest}`,
        note: 'Run it in the project that depends on the CLI.',
      }
    case 'source':
      return {
        command: 'git pull && npm run build --workspace=@golden-frijoles/cli',
        note: 'This copy runs from a checkout.',
      }
  }
}

/** The registry's newest version, or null on any failure (offline, slow, odd answer) — never thrown. */
export async function fetchLatestVersion(fetchImpl: typeof fetch, timeoutMs = 1500): Promise<string | null> {
  try {
    const response = await fetchImpl(REGISTRY_LATEST, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const body = (await response.json()) as { version?: unknown }
    return typeof body.version === 'string' && isPlainVersion(body.version) ? body.version : null
  } catch {
    return null
  }
}

/** `$XDG_CONFIG_HOME/golden-frijoles/update-check.json`, beside the credentials. */
export function updateCachePath(env: NodeJS.ProcessEnv): string {
  const base = env.XDG_CONFIG_HOME?.trim() || join(env.HOME || homedir(), '.config')
  return join(base, 'golden-frijoles', 'update-check.json')
}

/** Whether this run may check at all. */
export function updateCheckAllowed(env: NodeJS.ProcessEnv, json: boolean): boolean {
  if (json) return false
  if (env.CI && env.CI !== '0' && env.CI !== 'false') return false
  if (env.GOLDEN_FRIJOLES_NO_UPDATE_CHECK || env.NO_UPDATE_NOTIFIER) return false
  return true
}

/**
 * The notice line, or null. Reads the day-old cache first; only when it is stale does it ask the registry (and
 * remembers the answer, or the failure, for a day — so an offline machine is not slowed on every command).
 */
export async function updateNotice(input: {
  current: string
  env: NodeJS.ProcessEnv
  fetchImpl: typeof fetch
  now?: number
}): Promise<string | null> {
  const now = input.now ?? Date.now()
  const path = updateCachePath(input.env)
  let latest: string | null = null
  let fresh = false
  try {
    const cached = JSON.parse(readFileSync(path, 'utf8')) as { checkedAt?: number; latest?: string | null }
    if (typeof cached.checkedAt === 'number' && now - cached.checkedAt < DAY_MS) {
      fresh = true
      latest = typeof cached.latest === 'string' ? cached.latest : null
    }
  } catch {
    // No cache yet, or unreadable: ask below.
  }
  if (!fresh) {
    latest = await fetchLatestVersion(input.fetchImpl)
    try {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify({ checkedAt: now, latest }))
    } catch {
      // A read-only home: the notice still works, it just asks again next time.
    }
  }
  if (!latest || compareVersions(latest, input.current) <= 0) return null
  return `frijoles ${latest} is out (you have ${input.current}). Update: frijoles update`
}
