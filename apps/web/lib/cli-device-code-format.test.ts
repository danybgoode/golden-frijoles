// account-from-the-terminal · Sprint 2, Story 2.2 — the device-code shapes (epic D6).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  DEVICE_CODE_FORMAT,
  DEVICE_CODE_TTL_SECONDS,
  USER_CODE_ALPHABET,
  USER_CODE_FORMAT,
  deviceCodeFromBytes,
  normalizeUserCode,
  sanitizeDeviceLabel,
  userCodeFromBytes,
} from './cli-device-code-format.ts'

test('the alphabet is 32 symbols with no 0, O, 1 or I', () => {
  assert.equal(USER_CODE_ALPHABET.length, 32)
  assert.equal(new Set(USER_CODE_ALPHABET).size, 32)
  for (const confusable of ['0', 'O', '1', 'I']) assert.ok(!USER_CODE_ALPHABET.includes(confusable))
})

test('generated codes always match both formats', () => {
  for (let i = 0; i < 500; i += 1) {
    assert.match(userCodeFromBytes(randomBytes(8)), USER_CODE_FORMAT)
    assert.match(deviceCodeFromBytes(randomBytes(32)), DEVICE_CODE_FORMAT)
  }
})

test('every byte value maps into the alphabet (no out-of-range index)', () => {
  const all = new Uint8Array(256).map((_, i) => i)
  for (let i = 0; i < 256; i += 8) assert.match(userCodeFromBytes(all.slice(i, i + 8)), USER_CODE_FORMAT)
})

test('normalising forgives case, spaces and a missing dash — and nothing that changes the code', () => {
  assert.equal(normalizeUserCode('kq7m-3rtx'), 'KQ7M-3RTX')
  assert.equal(normalizeUserCode(' KQ7M 3RTX '), 'KQ7M-3RTX')
  assert.equal(normalizeUserCode('KQ7M3RTX'), 'KQ7M-3RTX')
  assert.equal(normalizeUserCode('KQ0M-3RTX'), null, '0 is not in the alphabet, so this is not a code')
  assert.equal(normalizeUserCode('KQ7M-3RT'), null)
  assert.equal(normalizeUserCode(undefined), null)
})

test('a device label from an unauthenticated caller is bounded, single-line and never empty', () => {
  assert.equal(sanitizeDeviceLabel('mac\n\tbook\u0007'), 'mac book')
  assert.equal(sanitizeDeviceLabel(''), 'a terminal')
  assert.equal(sanitizeDeviceLabel(42), 'a terminal')
  assert.equal(sanitizeDeviceLabel('x'.repeat(500)).length, 80)
})

test("the TTL matches the migration's column default", () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20261006100000_cli_device_codes.sql', import.meta.url),
    'utf8'
  )
  assert.match(sql, new RegExp(`now\\(\\) \\+ interval '${DEVICE_CODE_TTL_SECONDS / 60} minutes'`))
  // And the DB's own user-code CHECK is the same expression as the app's.
  assert.ok(sql.includes(USER_CODE_FORMAT.source.replace(/^\^|\$$/g, '')))
})
