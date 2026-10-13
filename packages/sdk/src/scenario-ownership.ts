// scenarios-light-up D5 — the app's side of making it a drill target.
//
// `frijoles scenarios targets add <key> --origin https://your.app` (or the scenarios page) prints a one-time token.
// The app keeps it in a server-side env var and answers the ownership check with this handler; then
// `frijoles scenarios targets verify <key>` marks the target verified. The engine keeps only the token's SHA-256, and
// both sides sign with that hash, so the token itself never travels again. Web Crypto only: no Node import, so the
// handler runs on Node 18+, edge runtimes, Bun and Deno alike.

/** The one path the engine calls. Serve the handler there (or let it see every request: it ignores the rest). */
export const SCENARIO_OWNERSHIP_PATH = '/api/internal/resilience/ownership'

const REQUEST_HEADER = 'x-golden-beans-ownership-request'
const PROOF_HEADER = 'x-golden-beans-ownership-proof'
const TOKEN = /^gf_target_[0-9a-f]{64}$/
const HEX_64 = /^[0-9a-f]{64}$/
const TARGET_KEY = /^[a-z][a-z0-9_.-]{0,127}$/
const MAX_BODY_BYTES = 1024

export type ScenarioOwnershipHandlerConfig = {
  /** The `gf_target_…` token printed once at registration. Server-side only: never ship it to a browser. */
  token: string
}

/**
 * A Fetch-API handler for the ownership check. It returns `null` for any request that is not the check (so it can sit
 * in front of other routes), and `404` for a check that is not signed by your token, so the path gives nothing away.
 *
 * ```ts
 * // app/api/internal/resilience/ownership/route.ts (Next.js)
 * import { createScenarioOwnershipHandler } from '@golden-frijoles/sdk'
 * const answer = createScenarioOwnershipHandler({ token: process.env.GOLDEN_FRIJOLES_TARGET_TOKEN! })
 * export async function POST(request: Request) {
 *   return (await answer(request)) ?? new Response(null, { status: 404 })
 * }
 * ```
 */
export function createScenarioOwnershipHandler(
  config: ScenarioOwnershipHandlerConfig
): (request: Request) => Promise<Response | null> {
  if (!config || typeof config.token !== 'string' || !TOKEN.test(config.token)) {
    throw new Error(
      'createScenarioOwnershipHandler needs the gf_target_… token printed when the target was added'
    )
  }
  const keyPromise = sha256Hex(config.token).then((tokenHash) => importHmacKey(tokenHash))

  return async (request: Request): Promise<Response | null> => {
    let url: URL
    try {
      url = new URL(request.url)
    } catch {
      return null
    }
    if (url.pathname !== SCENARIO_OWNERSHIP_PATH) return null
    if (request.method !== 'POST') return notFound()

    const signature = request.headers.get(REQUEST_HEADER)
    if (!signature || !HEX_64.test(signature)) return notFound()
    const body = await readBoundedJson(request)
    if (!body) return notFound()
    const { contractVersion, challenge, targetKey, origin } = body
    if (
      contractVersion !== 2 ||
      typeof challenge !== 'string' ||
      !HEX_64.test(challenge) ||
      typeof targetKey !== 'string' ||
      !TARGET_KEY.test(targetKey) ||
      typeof origin !== 'string' ||
      !isExactHttpsOrigin(origin)
    ) {
      return notFound()
    }

    const key = await keyPromise
    const expected = await hmacHex(key, message('request', challenge, targetKey, origin))
    if (!constantTimeEqual(expected, signature)) return notFound()
    const proof = await hmacHex(key, message('response', challenge, targetKey, origin))
    return new Response(null, {
      status: 204,
      headers: { [PROOF_HEADER]: proof, 'Cache-Control': 'no-store' },
    })
  }
}

function notFound(): Response {
  return new Response(null, { status: 404 })
}

function message(kind: 'request' | 'response', challenge: string, targetKey: string, origin: string): string {
  return `golden-frijoles-target-${kind}-v2\n${challenge}\n${targetKey}\n${origin}`
}

function isExactHttpsOrigin(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'https:' &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === '/' &&
      !parsed.search &&
      !parsed.hash &&
      parsed.origin === value
    )
  } catch {
    return false
  }
}

async function readBoundedJson(request: Request): Promise<Record<string, unknown> | null> {
  // Bounded BEFORE the signature is checked: anyone can reach this path, so a declared length over the cap is refused
  // unread, and the stream is cut the moment it passes the cap whatever the header said (verifier, #348).
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null
  if (!request.body) return null
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => undefined)
        return null
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

// Typed from the runtime value, not the DOM's `SubtleCrypto` / `CryptoKey` names: the SDK builds against ES2022 + Node
// types only, and a consumer's types must not need the DOM library either.
type Subtle = typeof globalThis.crypto.subtle
type HmacKey = Awaited<ReturnType<Subtle['importKey']>>

function subtle(): Subtle {
  const value = globalThis.crypto?.subtle
  if (!value) throw new Error('Web Crypto is unavailable in this runtime (Node 18+ provides it)')
  return value
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await subtle().digest('SHA-256', new TextEncoder().encode(value)))
}

function importHmacKey(secret: string): Promise<HmacKey> {
  return subtle().importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

async function hmacHex(key: HmacKey, value: string): Promise<string> {
  return toHex(await subtle().sign('HMAC', key, new TextEncoder().encode(value)))
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
