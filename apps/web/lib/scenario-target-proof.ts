import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const SCENARIO_TARGET_CHALLENGE_BYTES = 32
export const SCENARIO_TARGET_PROOF_HEADER = 'x-golden-beans-ownership-proof'
export const SCENARIO_TARGET_REQUEST_HEADER = 'x-golden-beans-ownership-request'
const HEX_64 = /^[0-9a-f]{64}$/
const TARGET_KEY = /^[a-z][a-z0-9_.-]{0,127}$/

function canonicalTarget(targetKey: string, origin: string): string {
  if (!TARGET_KEY.test(targetKey)) throw new Error('Invalid scenario target key')
  const parsed = new URL(origin)
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    parsed.origin !== origin
  ) {
    throw new Error('Scenario target origin must be an exact HTTPS origin')
  }
  return `${targetKey}\n${origin}`
}

function hmac(secret: string, message: string): string {
  if (secret.length < 16) throw new Error('Scenario target proof secret is unavailable')
  return createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

export function createScenarioTargetChallenge(): string {
  return randomBytes(SCENARIO_TARGET_CHALLENGE_BYTES).toString('hex')
}

/** Stable per credential/target so a lost registration response can be retried idempotently. */
export function createScenarioTargetRegistrationChallenge(input: {
  secret: string
  targetKey: string
  origin: string
}): string {
  return hmac(
    input.secret,
    `golden-beans-target-registration-v1\n${canonicalTarget(input.targetKey, input.origin)}`
  )
}

export function hashScenarioTargetChallenge(challenge: string): string {
  if (!HEX_64.test(challenge)) throw new Error('Invalid scenario target challenge')
  return createHash('sha256').update(challenge, 'utf8').digest('hex')
}

export function createScenarioTargetRequestSignature(input: {
  secret: string
  challenge: string
  targetKey: string
  origin: string
}): string {
  if (!HEX_64.test(input.challenge)) throw new Error('Invalid scenario target challenge')
  return hmac(
    input.secret,
    `golden-beans-target-request-v1\n${input.challenge}\n${canonicalTarget(input.targetKey, input.origin)}`
  )
}

export function createScenarioTargetResponseProof(input: {
  secret: string
  challenge: string
  targetKey: string
  origin: string
}): string {
  if (!HEX_64.test(input.challenge)) throw new Error('Invalid scenario target challenge')
  return hmac(
    input.secret,
    `golden-beans-target-response-v1\n${input.challenge}\n${canonicalTarget(input.targetKey, input.origin)}`
  )
}

export function scenarioTargetProofMatches(expected: string, received: unknown): boolean {
  if (!HEX_64.test(expected) || typeof received !== 'string' || !HEX_64.test(received)) return false
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'))
}

// scenarios-light-up D2 — the `owner_token_v1` contract. The owner's app holds a one-time token; the engine keeps only
// its SHA-256 (`ownership_challenge_hash`). Both sides key their HMACs with that hash, so the token never travels
// after registration, and a fresh challenge per verify means an answer cannot be replayed. The SDK's
// `createScenarioOwnershipHandler` is the app's side; `scenario-target-proof.test.ts` pins both to the same vectors.
export const SCENARIO_OWNER_TOKEN_PREFIX = 'gf_target_'
const OWNER_TOKEN = /^gf_target_[0-9a-f]{64}$/

export function createScenarioOwnerToken(): string {
  return `${SCENARIO_OWNER_TOKEN_PREFIX}${randomBytes(SCENARIO_TARGET_CHALLENGE_BYTES).toString('hex')}`
}

/** The stored hash, and the key both sides sign with. */
export function hashScenarioOwnerToken(token: string): string {
  if (!OWNER_TOKEN.test(token)) throw new Error('Invalid scenario owner token')
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function ownerTokenMessage(kind: 'request' | 'response', challenge: string, targetKey: string, origin: string): string {
  if (!HEX_64.test(challenge)) throw new Error('Invalid scenario target challenge')
  return `golden-frijoles-target-${kind}-v2\n${challenge}\n${canonicalTarget(targetKey, origin)}`
}

export function createScenarioOwnerTokenSignature(input: {
  tokenHash: string
  challenge: string
  targetKey: string
  origin: string
}): string {
  if (!HEX_64.test(input.tokenHash)) throw new Error('Invalid scenario owner token hash')
  return hmac(input.tokenHash, ownerTokenMessage('request', input.challenge, input.targetKey, input.origin))
}

export function createScenarioOwnerTokenProof(input: {
  tokenHash: string
  challenge: string
  targetKey: string
  origin: string
}): string {
  if (!HEX_64.test(input.tokenHash)) throw new Error('Invalid scenario owner token hash')
  return hmac(input.tokenHash, ownerTokenMessage('response', input.challenge, input.targetKey, input.origin))
}
