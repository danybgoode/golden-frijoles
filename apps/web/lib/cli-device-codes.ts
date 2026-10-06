import 'server-only'
import { randomBytes } from 'node:crypto'
import { getSupabaseServiceClient } from './supabase'
import { hashCredential } from './credential-hash'
import { mintCliToken } from './cli-tokens'
import {
  DEVICE_CODE_FORMAT,
  deviceCodeFromBytes,
  normalizeUserCode,
  sanitizeDeviceLabel,
  userCodeFromBytes,
} from './cli-device-code-format'

// account-from-the-terminal · Sprint 2, Story 2.2 — `gf login` through the browser (epic D6–D8).
//
// Three operations, one per party:
//   • START   — the CLI, unauthenticated: a fresh pair (secret device code, display user code).
//   • DECIDE  — the signed-in person, on /cli/connect: approve or deny THEIR OWN pairing.
//   • COLLECT — the CLI again, holding the secret: the one poll that wins approved→consumed mints.
//
// The transitions are SQL functions (`20261006100000_cli_device_codes.sql`), so each is one guarded
// UPDATE judged in database time; this module maps their closed outcome vocabulary and never
// forwards a database error to a caller.

export type StartedDeviceCode = { deviceCode: string; userCode: string; expiresAt: string }

/**
 * Create a pairing. Retries on the (vanishingly rare) user-code collision rather than surfacing it:
 * a unique violation on 40 bits of code space is bad luck, not a client error.
 */
export async function startDeviceCode(label: unknown): Promise<StartedDeviceCode | null> {
  const safeLabel = sanitizeDeviceLabel(label)
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const deviceCode = deviceCodeFromBytes(randomBytes(32))
    const userCode = userCodeFromBytes(randomBytes(8))
    const { data, error } = await getSupabaseServiceClient()
      .from('cli_device_codes')
      .insert({ device_code_hash: hashCredential(deviceCode), user_code: userCode, label: safeLabel })
      .select('expires_at')
      .single()
    if (!error && data) return { deviceCode, userCode, expiresAt: data.expires_at as string }
    // 23505 = unique_violation: draw again. Anything else is an outage.
    if (error?.code !== '23505') {
      console.error('[cli-device-codes] start failed:', { code: error?.code ?? 'unknown' })
      return null
    }
  }
  return null
}

export type DeviceCodeView = {
  userCode: string
  label: string
  createdAt: string
  /** What the confirm page should show: only `pending` is actionable. */
  state: 'pending' | 'expired' | 'used'
}

/** What the confirm page needs to show before the person decides. The user code is the only key. */
export async function viewDeviceCode(rawUserCode: unknown): Promise<DeviceCodeView | null> {
  const userCode = normalizeUserCode(rawUserCode)
  if (!userCode) return null
  const { data, error } = await getSupabaseServiceClient()
    .from('cli_device_codes')
    .select('user_code, label, status, created_at, expires_at')
    .eq('user_code', userCode)
    .maybeSingle()
  if (error) {
    console.error('[cli-device-codes] view failed:', { code: error.code ?? 'unknown' })
    return null
  }
  if (!data) return null
  const state =
    data.status !== 'pending'
      ? 'used'
      : Date.parse(data.expires_at as string) <= Date.now()
        ? 'expired'
        : 'pending'
  return {
    userCode: data.user_code as string,
    label: data.label as string,
    createdAt: data.created_at as string,
    state,
  }
}

export type DecideOutcome = 'approved' | 'denied' | 'expired' | 'used' | 'unknown' | 'error'

/**
 * Approve or deny on behalf of `userId`, which the caller takes from `getSessionUser()` — never from
 * the request. The display state above may be stale by the time the person clicks; the SQL function
 * re-checks status and expiry in the same statement that writes.
 */
export async function decideDeviceCode(
  rawUserCode: unknown,
  userId: string,
  approve: boolean
): Promise<DecideOutcome> {
  const userCode = normalizeUserCode(rawUserCode)
  if (!userCode) return 'unknown'
  const { data, error } = await getSupabaseServiceClient().rpc('decide_cli_device_code', {
    p_user_code: userCode,
    p_user_id: userId,
    p_approve: approve,
  })
  if (error) {
    console.error('[cli-device-codes] decide failed:', { code: error.code ?? 'unknown' })
    return 'error'
  }
  return isDecideOutcome(data) ? data : 'error'
}

function isDecideOutcome(value: unknown): value is Exclude<DecideOutcome, 'error'> {
  return (
    value === 'approved' ||
    value === 'denied' ||
    value === 'expired' ||
    value === 'used' ||
    value === 'unknown'
  )
}

export type CollectOutcome =
  | { kind: 'pending' }
  | { kind: 'approved'; token: string; userId: string }
  | { kind: 'refused'; reason: 'expired' | 'used' | 'denied' | 'unknown' }
  | { kind: 'error' }

/**
 * The CLI's poll. A malformed device code is `unknown` without a query (not an oracle: an unknown
 * well-formed one answers the same). On `approved` the code is already consumed in the database, so
 * a failure to mint here burns it — the person runs `gf login` again, which is the safe direction.
 */
export async function collectDeviceCode(deviceCode: unknown): Promise<CollectOutcome> {
  if (typeof deviceCode !== 'string' || !DEVICE_CODE_FORMAT.test(deviceCode)) {
    return { kind: 'refused', reason: 'unknown' }
  }
  const { data, error } = await getSupabaseServiceClient().rpc('collect_cli_device_code', {
    p_device_code_hash: hashCredential(deviceCode),
  })
  if (error) {
    console.error('[cli-device-codes] collect failed:', { code: error.code ?? 'unknown' })
    return { kind: 'error' }
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    { outcome?: unknown; user_id?: unknown; label?: unknown } | undefined
  switch (row?.outcome) {
    case 'pending':
      return { kind: 'pending' }
    case 'expired':
    case 'used':
    case 'denied':
    case 'unknown':
      return { kind: 'refused', reason: row.outcome }
    case 'approved': {
      if (typeof row.user_id !== 'string') return { kind: 'error' }
      const minted = await mintCliToken({
        userId: row.user_id,
        label: `gf login · ${typeof row.label === 'string' ? row.label : 'a terminal'}`,
      })
      if (!minted.ok) return { kind: 'error' }
      return { kind: 'approved', token: minted.plaintext, userId: row.user_id }
    }
    default:
      return { kind: 'error' }
  }
}
