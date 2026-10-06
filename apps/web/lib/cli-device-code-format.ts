// account-from-the-terminal · Sprint 2, Story 2.2 — the device-code SHAPES (epic D6), pure.
//
// No I/O and no `server-only`, so the CLI-facing contract is testable by `node --test` and the
// confirm page can normalise what a person typed. The database repeats the user-code and hash
// formats as CHECK constraints (`20261006100000_cli_device_codes.sql`); this is the app-side half.

/** 32 symbols: A–Z and 2–9 without 0/O/1/I — what a person can read aloud and retype. */
export const USER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const USER_CODE_FORMAT = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/

const DEVICE_CODE_PREFIX = 'gf_dev_'
/** 32 random bytes, base64url — the secret only the CLI holds. */
export const DEVICE_CODE_FORMAT = /^gf_dev_[A-Za-z0-9_-]{43}$/

/** How long a code lives, and how often the CLI may ask. The DB default must match the TTL. */
export const DEVICE_CODE_TTL_SECONDS = 600
export const DEVICE_POLL_INTERVAL_SECONDS = 5

/** `XXXX-XXXX` from 8 random bytes. 32 divides 256, so `byte % 32` is unbiased. */
export function userCodeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 8) throw new Error('userCodeFromBytes needs 8 bytes')
  let code = ''
  for (let i = 0; i < 8; i += 1) {
    if (i === 4) code += '-'
    code += USER_CODE_ALPHABET[bytes[i]! % USER_CODE_ALPHABET.length]
  }
  return code
}

export function deviceCodeFromBytes(bytes: Uint8Array): string {
  if (bytes.length !== 32) throw new Error('deviceCodeFromBytes needs 32 bytes')
  return `${DEVICE_CODE_PREFIX}${Buffer.from(bytes).toString('base64url')}`
}

/**
 * What a person typed or a link carried → the canonical code, or null.
 *
 * Forgiving where it is safe (case, spaces, a missing dash, the look-alikes a person reads off a
 * terminal: O→0 is NOT mapped, because 0 is not in the alphabet either — a code containing it is
 * simply not a code). Never forgiving in a way that could turn one valid code into another.
 */
export function normalizeUserCode(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const compact = input.toUpperCase().replace(/[\s-]/g, '')
  if (compact.length !== 8) return null
  const code = `${compact.slice(0, 4)}-${compact.slice(4)}`
  return USER_CODE_FORMAT.test(code) ? code : null
}

/**
 * The terminal's description of itself, made safe to store and show. It comes from an
 * unauthenticated caller, so it is bounded, stripped of control characters, and never empty.
 */
export function sanitizeDeviceLabel(input: unknown): string {
  const raw = typeof input === 'string' ? input : ''
  const cleaned = raw
    // C0/DEL, and the invisible ones a phishing label would use to look like something else: zero-width
    // and bidi controls (fresh reviewer, PR #280).
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (cleaned || 'a terminal').slice(0, 80)
}
