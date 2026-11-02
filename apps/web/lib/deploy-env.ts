// off-vercel-hosting D1/D2 — the ONE place the app decides which deployment it is.
//
// Production used to be "whatever Vercel says" (`VERCEL_ENV`, `VERCEL=1`). Off Vercel those are unset, and every
// reader quietly took the non-production branch: development flags, no operator pings, the sandbox Stripe key, the
// localhost-webhook carve-out open. `DEPLOY_ENV` says it on any host; `VERCEL_ENV` is still honoured so a Vercel
// deployment behaves exactly as before. A deploy-env-guard test keeps new readers going through here.

export type DeployEnv = 'production' | 'preview' | 'development'

// `process.env` (an index signature) or a narrowed env interface like SiteUrlEnv / NotifyEnv (named fields only).
type Env =
  | Readonly<Record<string, string | undefined>>
  | { readonly DEPLOY_ENV?: string; readonly VERCEL_ENV?: string; readonly VERCEL?: string }

const KNOWN: ReadonlySet<string> = new Set<DeployEnv>(['production', 'preview', 'development'])

function parse(raw: string | undefined): DeployEnv | null {
  const value = raw?.trim()
  if (!value) return null
  // An unknown value fails toward development: a typo must never make a box believe it is production.
  return KNOWN.has(value) ? (value as DeployEnv) : 'development'
}

/**
 * On Vercel (`VERCEL=1`) the platform's own `VERCEL_ENV` decides, whatever `DEPLOY_ENV` says: a `DEPLOY_ENV=production`
 * set in Vercel's all-environments scope must never turn a preview into production (live Stripe key, operator pings,
 * production flags — verifier, #444). Anywhere else `DEPLOY_ENV` decides, then `VERCEL_ENV`, then `development`.
 */
export function deployEnv(env: Env = process.env): DeployEnv {
  if (env.VERCEL === '1') return parse(env.VERCEL_ENV) ?? 'development'
  return parse(env.DEPLOY_ENV) ?? parse(env.VERCEL_ENV) ?? 'development'
}

/**
 * Whether this process is a real deployment (production or a preview), as opposed to a laptop or a CI server.
 * Replaces `isOnVercel()`: the off-deployment `*_ENABLED` override (rule #6) must never apply on a deployed box,
 * on Vercel (`VERCEL=1`) or anywhere `DEPLOY_ENV` names a deployment.
 */
export function isDeployed(env: Env = process.env): boolean {
  if (env.VERCEL === '1') return true
  const declared = parse(env.DEPLOY_ENV)
  return declared === 'production' || declared === 'preview'
}

/**
 * Whether neither variable says anything — the plain local shell. `notify-policy`'s escape hatch is allowed only
 * here, exactly as it was allowed only when `VERCEL_ENV` was absent.
 */
export function isUndeclared(env: Env = process.env): boolean {
  return !env.DEPLOY_ENV?.trim() && !env.VERCEL_ENV?.trim()
}
