import 'server-only'
import type { NextRequest } from 'next/server'
import { cliError, cliOk, readCliBody } from '@/lib/cli-auth'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'
import { checkRateLimit, hashIp } from '@/lib/rate-limit'
import { hashCredential } from '@/lib/credential-hash'
import { collectDeviceCode } from '@/lib/cli-device-codes'
import { DEVICE_CODE_FORMAT, DEVICE_POLL_INTERVAL_SECONDS } from '@/lib/cli-device-code-format'

// POST /api/v1/cli/device/token — account-from-the-terminal S2.2 (epic D7): the CLI's poll.
//
// Gates before the body, as in the start route. The secret device code travels in the BODY, never
// the URL (a URL lands in logs). Pending and slow_down are 200s the CLI keeps polling on; every
// refusal is one `not_found` with a machine-readable `reason`, so the terminal can say WHY ("that
// code expired") — the reasons are about a code this caller already holds, so they reveal nothing.

export const runtime = 'nodejs'

const REFUSAL_MESSAGES = {
  expired: 'That sign-in code expired. Run `frijoles login` again.',
  used: 'That sign-in code was already used. Run `frijoles login` again.',
  denied: 'That sign-in was declined in the browser. Nothing was signed in.',
  unknown: 'That sign-in code is not one this server issued. Run `frijoles login` again.',
} as const

export async function POST(req: NextRequest) {
  if (!(await isTerminalSignInEnabled())) {
    return cliError('disabled', 'Browser sign-in is not available here. Paste a token instead.')
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const perIp = await checkRateLimit(`cli-device-poll-ip:${hashIp(ip)}`, { windowMs: 60 * 1000, max: 60 })
  if (!perIp.ok) return cliOk({ status: 'slow_down', interval: DEVICE_POLL_INTERVAL_SECONDS * 2 })

  // The one body reader every CLI route uses (`lib/cli-body-order.test.ts`); it re-checks the gate.
  const body = await readCliBody(req)
  if (body instanceof Response) return body
  const deviceCode = body.deviceCode
  if (typeof deviceCode !== 'string' || !DEVICE_CODE_FORMAT.test(deviceCode)) {
    return cliError('not_found', REFUSAL_MESSAGES.unknown, { reason: 'unknown' })
  }

  // One poll per interval per code: a fixed bucket of the interval's length, two allowed so a
  // client whose timer lands on a bucket edge is not told to slow down for being on time.
  const perCode = await checkRateLimit(`cli-device-poll:${hashCredential(deviceCode)}`, {
    windowMs: DEVICE_POLL_INTERVAL_SECONDS * 1000,
    max: 2,
  })
  if (!perCode.ok) return cliOk({ status: 'slow_down', interval: DEVICE_POLL_INTERVAL_SECONDS * 2 })

  const outcome = await collectDeviceCode(deviceCode)
  switch (outcome.kind) {
    case 'pending':
      return cliOk({ status: 'pending', interval: DEVICE_POLL_INTERVAL_SECONDS })
    case 'approved':
      // The plaintext exists for this one response; only its hash is stored (`cli_tokens`).
      return cliOk({ status: 'approved', token: outcome.token })
    case 'refused':
      return cliError('not_found', REFUSAL_MESSAGES[outcome.reason], { reason: outcome.reason })
    default:
      return cliError(
        'server_error',
        'Could not check the sign-in right now. Keep waiting, or run `frijoles login` again.'
      )
  }
}
