import 'server-only'
import type { NextRequest } from 'next/server'
import { cliError, cliOk, readCliBody } from '@/lib/cli-auth'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'
import { checkRateLimit, hashIp } from '@/lib/rate-limit'
import { getSiteUrl } from '@/lib/site-url'
import { startDeviceCode } from '@/lib/cli-device-codes'
import { DEVICE_CODE_TTL_SECONDS, DEVICE_POLL_INTERVAL_SECONDS } from '@/lib/cli-device-code-format'

// POST /api/v1/cli/device — account-from-the-terminal S2.2 (epic D7): `gf login` starts a browser
// sign-in. Unauthenticated by nature: the terminal has no credential yet, which is the point.
//
// ORDER IS THE CONTRACT: both gates, then the rate limit, then the body (LEARNINGS: a kill switch
// comes before the request BODY). Killed, this answers the uniform `disabled` 404 — and an old or
// killed server's 404 is exactly what makes the CLI fall back to the paste prompt.

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!(await isTerminalSignInEnabled())) {
    return cliError('disabled', 'Browser sign-in is not available here. Paste a token instead.')
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const limited = await checkRateLimit(`cli-device-start:${hashIp(ip)}`, {
    windowMs: 10 * 60 * 1000,
    max: 10,
  })
  if (!limited.ok) return cliError('invalid', 'Too many sign-in attempts from here. Wait a few minutes.')

  // The one body reader every CLI route uses (`lib/cli-body-order.test.ts`); it re-checks the gate.
  const body = await readCliBody(req)
  if (body instanceof Response) return body
  // `repo` (CLIs after 0.6.0): the terminal's word for its repo, to pre-select a product. Older CLIs omit it.
  const started = await startDeviceCode(body.label, body.repo)
  if (!started) return cliError('server_error', 'Could not start a browser sign-in right now.')

  return cliOk({
    deviceCode: started.deviceCode,
    userCode: started.userCode,
    // Lives ten minutes and is opened once, so a preview hostname here is correct, not a hazard
    // (`informational` in lib/site-url-callers.test.ts).
    verificationUrl: `${getSiteUrl()}/cli/connect?code=${encodeURIComponent(started.userCode)}`,
    expiresIn: DEVICE_CODE_TTL_SECONDS,
    interval: DEVICE_POLL_INTERVAL_SECONDS,
  })
}
