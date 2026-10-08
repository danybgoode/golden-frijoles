// account-from-the-terminal · Sprint 2, Story 2.2 — `frijoles login` through the browser (epic D9).
//
// Start a pairing, show the code, open the browser, poll until the person confirms in a signed-in
// page, and hand back the token the server minted for this machine. Everything that can go wrong
// before the person is involved — a server that predates these routes, the flag killed, no network —
// returns `fallback`, and `frijoles login` asks for a pasted token exactly as it always did.

import { execFileSync, spawn } from 'node:child_process'
import { hostname, platform } from 'node:os'
import { basename } from 'node:path'
import { createApiClient } from '../api'
import type { CommandContext } from '../command'
import { VERSION } from '../version'

type StartBody = {
  deviceCode: string
  userCode: string
  verificationUrl: string
  expiresIn: number
  interval: number
}
type PollBody = { status: 'pending' | 'slow_down' | 'approved'; token?: string; interval?: number }

export type DeviceLoginResult =
  | { kind: 'token'; token: string }
  | { kind: 'fallback'; why: string }
  | { kind: 'refused'; code: string; message: string }

/** Opens a URL in the default browser, best-effort and dependency-free. A failure is not an error. */
function openBrowser(url: string, env: NodeJS.ProcessEnv): void {
  if (env.GOLDEN_FRIJOLES_NO_BROWSER === '1') return
  const os = platform()
  const [command, args] =
    os === 'darwin'
      ? ['open', [url]]
      : os === 'win32'
        ? // NOT `cmd /c start`: cmd re-parses an unquoted argument, so a `&` in even a same-origin URL
          // runs a second command (fresh reviewer, PR #280 round 2). rundll32 hands the URL to the
          // protocol handler without a shell.
          ['rundll32', ['url.dll,FileProtocolHandler', url]]
        : ['xdg-open', [url]]
  try {
    const child = spawn(command, args as string[], { stdio: 'ignore', detached: true })
    child.on('error', () => undefined)
    child.unref()
  } catch {
    // The URL is printed either way; a machine with no browser just follows it by hand.
  }
}

export function isSameOriginHttp(url: string, apiUrl: string): boolean {
  try {
    const target = new URL(url)
    return (
      (target.protocol === 'https:' || target.protocol === 'http:') &&
      target.origin === new URL(apiUrl).origin
    )
  } catch {
    return false
  }
}

/** A finite, non-negative number (floored at 1 s), or the fallback. */
function positiveOr(value: unknown, fallback: number): number {
  const n = Number(value)
  // A 1 s floor: a buggy server answering `interval: 0` must not turn the poll into a tight loop.
  return Number.isFinite(n) && n >= 0 ? Math.max(1, n) : fallback
}

/**
 * The repo's name — the git top level's folder, else this folder's — so the approve page can pre-select the
 * product named after it. A suggestion only: the person picks among their own products.
 */
export function repoName(cwd: string): string {
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    if (top) return basename(top)
  } catch {
    // not a git repo, or no git: the folder name is the next best guess
  }
  return basename(cwd)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function deviceLogin(context: CommandContext, apiUrl: string): Promise<DeviceLoginResult> {
  // No credential yet — that is the point of this flow. The routes ignore Authorization.
  const client = createApiClient({
    baseUrl: apiUrl,
    token: '',
    userAgent: `golden-frijoles-cli/${VERSION}`,
    fetchImpl: context.fetchImpl,
  })

  const label = `${hostname()} (${platform()})`.slice(0, 80)
  const started = await client.post<StartBody>('api/v1/cli/device', { label, repo: repoName(context.cwd) })
  if (started.kind === 'network') return { kind: 'fallback', why: started.message }
  if (started.kind === 'error') {
    // 404 (`disabled`, `not_found`): an older server, or the kill switch. Anything else from the
    // START is also a reason to offer the paste path rather than strand the person.
    return { kind: 'fallback', why: started.message }
  }
  const { deviceCode, userCode, verificationUrl } = started.body
  let interval = positiveOr(started.body.interval, 5)
  const deadline = Date.now() + Math.max(1, Number(started.body.expiresIn) || 600) * 1000

  context.emit.note(
    `Your code: ${userCode}\n` +
      `Opening ${verificationUrl}\n` +
      'Check that the browser shows the same code, then confirm. (Not opening? Visit the link yourself.)'
  )
  // Only a URL on the deployment we are signing in to, over http(s), is handed to the OS opener —
  // `open`/`start` will run whatever a hostile `--api` server puts here (fresh reviewer, PR #280).
  // Anything else is printed above and left for the person to follow, or not.
  if (isSameOriginHttp(verificationUrl, apiUrl)) openBrowser(verificationUrl, context.env)

  while (Date.now() < deadline) {
    await sleep(interval * 1000)
    const polled = await client.post<PollBody>('api/v1/cli/device/token', { deviceCode })
    if (polled.kind === 'network') continue // a blip; the deadline still bounds the wait
    if (polled.kind === 'error') {
      if (polled.code === 'server_error') continue
      return { kind: 'refused', code: polled.code, message: polled.message }
    }
    if (polled.body.status === 'approved' && typeof polled.body.token === 'string') {
      return { kind: 'token', token: polled.body.token }
    }
    if (polled.body.status === 'slow_down')
      interval = Math.max(interval + 5, positiveOr(polled.body.interval, 0))
  }
  return {
    kind: 'refused',
    code: 'not_found',
    message: 'That sign-in code expired before it was confirmed. Run `frijoles login` again.',
  }
}
