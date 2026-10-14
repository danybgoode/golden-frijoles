import 'server-only'
import { randomBytes } from 'node:crypto'
import { getSupabaseServiceClient } from './supabase'
import { generateApiKey, hashApiKey } from './api-keys'
import { generateConnectorToken } from './connector-tokens'
import { slugFromEmail, normalizeSlug, isReservedSlug } from './tenant-slug'
import { recordAudit } from './audit'
import { DEMO_PROJECT_SLUG } from './public-demo'
import { claimWorkspace, releaseWorkspace, workspaceNameFor, type WorkspaceClaim } from './workspace-tenancy'
import { SELF_PROJECT_SLUG } from './self-track'
import { makerToStamp } from './connector-maker'

// multi-tenant-activation · Sprint 2, Story 2.1 — turning a CONFIRMED auth user into a working
// tenant: a project, an owner membership, a first API key, and a connector token for onboarding.
//
// Called from ONE place: app/auth/callback/route.ts, after a successful auth-code exchange. That
// placement is the acceptance criterion "unconfirmed accounts own no tenant" made structural
// rather than checked — an account that never completes the email round-trip never reaches this
// function at all, so there is no unconfirmed-but-provisioned state to guard against.

const MAX_SLUG_ATTEMPTS = 6
const PG_UNIQUE_VIOLATION = '23505'

export type ProvisionResult =
  | { ok: true; created: boolean; projectSlug: string; plaintextKey: string | null }
  | { ok: false; error: string }

// Slugs no self-serve tenant may take, ON TOP of tenant-slug.ts's structural reservations.
// Read at call time, not module load: these are env-driven (DEMO_PROJECT_SLUG, SELF_PROJECT_SLUG)
// and a stranger registering either one would inherit a publicly-readable dashboard
// (assertPublicAllowedSlug gates the demo BY SLUG — AGENTS rule #2) or start writing into the
// landing's own dogfood funnel.
function isForbiddenSlug(slug: string): boolean {
  return isReservedSlug(slug) || slug === DEMO_PROJECT_SLUG || slug === SELF_PROJECT_SLUG
}

/** The name of the partial unique index that enforces one self-serve project per creator. Must
 *  match the migration exactly — a rename there without a rename here silently turns the race
 *  handling back into the stranding bug, so both sides name it in a comment. */
const CREATOR_CONSTRAINT = 'projects_one_per_creator_idx'

function isCreatorConstraintViolation(error: { message?: string; details?: string } | null): boolean {
  const haystack = `${error?.message ?? ''} ${error?.details ?? ''}`
  return haystack.includes(CREATOR_CONSTRAINT)
}

/** The slug of the project this user CREATED, resolved without going through membership — the
 *  project row is what the unique violation proves exists, whereas the membership row may still
 *  be moments away from being written by the racing request. */
async function findProjectByCreator(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('created_by', userId)
    // many-products D1: only the SIGNUP product is unique per creator. Without this filter a founder with a second
    // product makes `.maybeSingle()` error, and the signup race this function resolves would strand them.
    .eq('from_signup', true)
    .maybeSingle()
  if (error) {
    console.error('[provisioning] created_by lookup failed:', error)
    return null
  }
  return (data?.slug as string | undefined) ?? null
}

/** Guarantees `userId` is an OWNER of `slug`, repairing the state where a project exists with no
 *  membership row (a previous attempt whose membership insert failed and whose compensating
 *  delete ALSO failed, leaving an orphan its creator cannot see). Idempotent: a row that already
 *  exists conflicts harmlessly, and this deliberately never DOWNGRADES an existing role. */
async function ensureOwnerMembership(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  slug: string
): Promise<void> {
  const { data: project, error } = await supabase.from('projects').select('id').eq('slug', slug).maybeSingle()
  if (error || !project) {
    console.error('[provisioning] ensureOwnerMembership could not resolve project:', error)
    return
  }
  // ignoreDuplicates is safe HERE, unlike on a credential column: the conflict target is the
  // (user_id, project_id) primary key, so a conflicting row is by definition this same user on
  // this same project — never someone else's. That is the precise condition the S1 cross-tenant
  // bind lesson says to check before trusting an "insert or ignore" (Roadmap/LEARNINGS.md).
  const { error: insertError } = await supabase
    .from('project_members')
    .upsert(
      { user_id: userId, project_id: project.id, role: 'owner' },
      { onConflict: 'user_id,project_id', ignoreDuplicates: true }
    )
  if (insertError) console.error('[provisioning] ensureOwnerMembership insert failed:', insertError)
}

/** The slug of a tenant this user already belongs to, or null. `error` distinguishes "definitely
 *  no tenant" from "couldn't tell" — the caller must FAIL CLOSED on the latter rather than
 *  treating an outage as permission to mint a second tenant. */
async function findExistingTenant(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string
): Promise<{ slug: string | null; error: unknown }> {
  const { data, error } = await supabase
    .from('project_members')
    .select('project_id, projects(slug)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) return { slug: null, error }
  if (!data) return { slug: null, error: null }
  const project = data.projects as unknown as { slug: string } | null
  // `?? null`, never `?? ''`. The caller's existence test is `slug !== null`, so an empty string
  // would read as "this user already has a tenant" and short-circuit provisioning — then redirect
  // them to /app/onboarding/ with no slug. A membership row whose project relation is missing is
  // a broken row, not a tenant (cross-review, Agy 2026-07-20).
  return { slug: project?.slug ?? null, error: null }
}

/** Release a failed provision's workspace claim, logging what could not be undone rather than throwing into a login. */
async function logRelease(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  claim: Extract<WorkspaceClaim, { ok: true }>
): Promise<void> {
  const error = await releaseWorkspace(supabase, claim)
  if (error) console.error(`[provisioning] could not release workspace ${claim.workspaceId}:`, error)
}

/**
 * The owner membership of a project this call just inserted — or, when it cannot be written, the project rolled back.
 * Returns false after a rollback; the caller then releases its workspace claim.
 *
 * The project row exists but nobody can reach it until this lands. There is no transaction across these calls
 * (supabase-js speaks REST, not sessions), so the compensating delete is the cleanup.
 *
 * CHECKED, not fire-and-forget: if the delete also fails we have an orphan project owned by a user with no membership,
 * which is exactly the state that produced an infinite /app ↔ /app/provision redirect loop. We can't fix it here, but
 * the next signup attempt's ensureOwnerMembership() repairs it — and this log is what makes the state findable if it
 * somehow persists (cross-review, Codex 2026-07-20). The project delete has to land before the caller's release:
 * projects.workspace_id is ON DELETE RESTRICT, so while the orphan exists the release is refused — which is right,
 * since an orphan in a deleted tenant would be worse.
 */
async function insertOwnerOrRollback(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  projectId: string,
  projectSlug: string
): Promise<boolean> {
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ user_id: userId, project_id: projectId, role: 'owner' })
  if (!memberError) return true
  console.error('[provisioning] membership insert failed:', memberError)
  const { error: cleanupError } = await supabase.from('projects').delete().eq('id', projectId)
  if (cleanupError) {
    console.error(
      `[provisioning] ORPHAN project ${projectId} (${projectSlug}) — membership insert failed AND cleanup failed:`,
      cleanupError
    )
  }
  return false
}

/**
 * The connector URL a new product starts with. connect-page D1: it acts as its owner from the start, exactly like one
 * made with Create — the same rule, imported (`makerToStamp`), so the demo project never names anyone. Best-effort:
 * the MCP route is independently gated (AGENTS rule #3) and Connect renders an honest "not ready" state without one.
 */
async function insertConnectorToken(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  projectId: string,
  projectSlug: string
): Promise<boolean> {
  const { error } = await supabase.from('connector_tokens').insert({
    project_id: projectId,
    token: generateConnectorToken(),
    created_by: makerToStamp(projectSlug, DEMO_PROJECT_SLUG, userId),
  })
  if (error) console.error('[provisioning] connector token insert failed:', error)
  return !error
}

/**
 * Idempotent by design — the auth callback runs on EVERY confirmation link click, and a user who
 * clicks their link twice (or whose browser prefetches it) must not end up with two tenants.
 *
 * Returns `created: false` with a null key when the user already owns a project: the plaintext of
 * their original key is unrecoverable by construction (only its hash was stored), so a repeat
 * call cannot re-show it. The onboarding page handles that null by pointing at "issue a new key"
 * rather than pretending to have one.
 */
export async function provisionTenantForUser(
  userId: string,
  email: string,
  displayName?: string | null
): Promise<ProvisionResult> {
  // Every caller is a Route Handler and can therefore set the one-time key cookie, so there is no
  // "provision without revealing a key" mode. An earlier version had one, for a retry path that
  // lived in a Server Component — it produced tenants with a phantom credential nobody held and
  // no starter feature. The retry moved to a Route Handler instead (app/app/provision/route.ts),
  // which deleted the special case rather than accommodating it.
  const supabase = getSupabaseServiceClient()

  // ── idempotency gate ──────────────────────────────────────────────────────────────────────
  // Keyed on MEMBERSHIP, not on `projects.created_by`: a user hand-seeded into an existing
  // project (the three pre-self-serve tenants, or any future invite path) already has somewhere
  // to work and must not be handed a second, empty tenant on their next sign-in.
  const existing = await findExistingTenant(supabase, userId)
  if (existing.error) {
    console.error('[provisioning] membership pre-check failed:', existing.error)
    // FAIL CLOSED. Continuing here would risk minting a duplicate tenant on what may simply be a
    // transient DB blip — and a spurious extra tenant is unrecoverable-by-user, whereas a failed
    // provision is retried on the user's next visit to /app.
    return { ok: false, error: 'Could not verify your account state — try signing in again.' }
  }
  if (existing.slug !== null) {
    return { ok: true, created: false, projectSlug: existing.slug, plaintextKey: null }
  }

  // ── slug selection ────────────────────────────────────────────────────────────────────────
  // The email is only a SUGGESTION; a short/punctuation-only local part, or one that collides
  // with a reserved name, falls through to a generated slug. A confirmed signup must never fail
  // because of the shape of someone's email address.
  const suggested = slugFromEmail(email)
  const base =
    suggested && !isForbiddenSlug(suggested) ? suggested : `tenant-${randomBytes(4).toString('hex')}`

  // ── the tenant (workspaces · Story 1.3) ───────────────────────────────────────────────────
  // Claimed BEFORE the project, so the project is born inside it and there is never a project without a workspace
  // (lock D4: the column becomes NOT NULL once this code is live). Every `ok: false` below releases the claim, and
  // releaseWorkspace only ever deletes a workspace THIS call created — a retry never removes a tenant that exists.
  const claim = await claimWorkspace(supabase, userId, workspaceNameFor(displayName, email))
  if (!claim.ok) {
    console.error('[provisioning] workspace claim failed:', claim.error)
    return { ok: false, error: 'Could not set up your workspace — try signing in again.' }
  }
  const fail = async (error: string): Promise<ProvisionResult> => {
    await logRelease(supabase, claim)
    return { ok: false, error }
  }

  const plaintextKey = generateApiKey()
  let projectId: string | null = null
  let projectSlug = ''

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS && !projectId; attempt++) {
    // First attempt uses the clean slug; later ones disambiguate with random entropy rather than
    // an incrementing counter — a counter leaks how many tenants share a name and turns a
    // collision into a probe. normalizeSlug re-runs so the suffix can't push it out of shape.
    const candidate = attempt === 0 ? base : normalizeSlug(`${base}-${randomBytes(2).toString('hex')}`)
    if (!candidate || isForbiddenSlug(candidate)) continue

    // A PLAIN INSERT, never an upsert on `slug`. This is the exact bug class cross-review caught
    // in S1's seed scripts (Roadmap/LEARNINGS.md): an `onConflict: 'slug', ignoreDuplicates`
    // upsert would report success while writing nothing when the slug already belongs to SOMEONE
    // ELSE — and this function would then hand back a plaintext key for a project the caller does
    // not own. A unique-violation must be a visible collision we retry, never a silent bind.
    const { data, error } = await supabase
      .from('projects')
      .insert({
        slug: candidate,
        created_by: userId,
        workspace_id: claim.workspaceId,
        // api_key_hash is the retired single-key column (nullable as of this sprint's migration).
        // A self-serve tenant's credentials live ONLY in api_keys.
        api_key_hash: null,
      })
      .select('id, slug')
      .single()

    if (!error && data) {
      projectId = data.id as string
      projectSlug = data.slug as string
      break
    }
    if (error?.code === PG_UNIQUE_VIOLATION) {
      // TWO different unique constraints can fire here and Postgres reports both as 23505, so the
      // CONSTRAINT NAME is the only thing that distinguishes them:
      //   • projects_slug_key            → the NAME is taken; retry with another.
      //   • projects_one_per_creator_idx → a concurrent callback already created this user's
      //                                    project; we lost the race. Never retry — adopt it.
      //
      // Conflating them strands the user, and doing so is subtle enough that it survived one
      // review round: an earlier version claimed in a comment to inspect the constraint but
      // actually just re-read MEMBERSHIP. The winner writes its project row and its
      // project_members row in two separate round-trips, so during that gap membership is still
      // empty — the loser would read null, conclude "slug taken", retry, hit the creator
      // constraint again, and burn every attempt before failing (cross-review, Agy 2026-07-20).
      //
      // So: resolve by `created_by`, which is the row that CAUSED the violation and is therefore
      // guaranteed to exist, rather than by membership, which may not be written yet.
      if (isCreatorConstraintViolation(error)) {
        const winner = await findProjectByCreator(supabase, userId)
        if (winner) {
          // SELF-HEAL before adopting. The project row exists, but its membership row may not:
          // either the racing request hasn't written it yet, or an earlier attempt's membership
          // insert failed AND its compensating delete also failed, leaving an orphan project this
          // user owns but cannot see. Returning `created: false` in that state produced an
          // infinite /app ↔ /app/provision redirect loop — /app sees zero projects and bounces to
          // provision, provision adopts the orphan and bounces back (cross-review, Codex
          // 2026-07-20). Ensuring membership makes the adoption real rather than nominal.
          await ensureOwnerMembership(supabase, userId, winner)
          return { ok: true, created: false, projectSlug: winner, plaintextKey: null }
        }
        // Constraint fired but the row is unreadable — bail rather than loop into the same wall.
        console.error('[provisioning] creator constraint fired but no project resolved')
        return fail('Could not create your project — please try again.')
      }
      continue // the slug was taken by someone else — try another name
    }
    console.error('[provisioning] project insert failed:', error)
    return fail('Could not create your project.')
  }

  if (!projectId) {
    console.error(`[provisioning] exhausted ${MAX_SLUG_ATTEMPTS} slug attempts for base "${base}"`)
    return fail('Could not create your project — please try again.')
  }

  // ── owner membership ──────────────────────────────────────────────────────────────────────
  // OWNER, not member: this user must be able to administer their own credentials (S1 made
  // credential admin owner-only — lib/roles.ts). A self-serve tenant provisioned as `member`
  // would 404 on its own API-keys page, which is exactly the trap the S1 rollout note warns about.
  if (!(await insertOwnerOrRollback(supabase, userId, projectId, projectSlug))) {
    return fail('Could not set up your account.')
  }

  // ── first credential ──────────────────────────────────────────────────────────────────────
  const { error: keyError } = await supabase.from('api_keys').insert({
    project_id: projectId,
    key_hash: hashApiKey(plaintextKey),
    label: 'first key',
  })
  if (keyError) {
    console.error('[provisioning] first key insert failed:', keyError)
    // Deliberately NOT fatal, and deliberately NOT rolled back: the user has a project and an
    // owner membership, so they can mint a key themselves from /app/keys. Tearing down a working
    // tenant over a recoverable missing credential would be the worse outcome.
    await recordAudit({
      action: 'tenant_provisioned',
      projectId,
      actorUserId: userId,
      metadata: { slug: projectSlug, firstKey: false },
    })
    return { ok: true, created: true, projectSlug, plaintextKey: null }
  }

  // ── connector token (Story 2.3's "copy your MCP URL") ──────────────────────────────────────
  const tokenOk = await insertConnectorToken(supabase, userId, projectId, projectSlug)

  await recordAudit({
    action: 'tenant_provisioned',
    projectId,
    actorUserId: userId,
    metadata: { slug: projectSlug, firstKey: true, connectorToken: tokenOk },
  })

  return { ok: true, created: true, projectSlug, plaintextKey }
}

export type CreateProductResult =
  | { ok: true; created: boolean; projectSlug: string }
  | { ok: false; reason: 'invalid' | 'taken' | 'error'; error: string }

/**
 * many-products D2 — a product the caller asked for BY NAME, beside the one their signup made: `frijoles projects create`,
 * `frijoles init --create` and the console's New product all land here.
 *
 * It lives in the caller's OWN workspace (`claimWorkspace` — the one they created, made if they have none), never one a
 * request names: AGENTS § The tenancy invariant. `from_signup: false` is what lets it coexist with their signup product
 * under `projects_one_per_creator_idx` (D1). It mints no ingest key — `frijoles keys create` and `init --ingest` do, with
 * their own confirmation — but it does mint the owner-stamped connector URL every other mint path mints (LEARNINGS: list
 * the mint paths, not just the renderers).
 *
 * Idempotent for its owner: a slug the caller already OWNS answers `created: false`. A slug anyone else holds — a
 * stranger's, one the caller is only a member of, or one soft-deleted and not yet purged — is `taken`, with no hint of
 * which (the slug is the only thing a caller learns, and "it exists" is all a public signup form would tell them too).
 */
export async function createProductForUser(
  userId: string,
  requestedSlug: unknown,
  naming: { email?: string | null; displayName?: string | null } = {}
): Promise<CreateProductResult> {
  const slug = typeof requestedSlug === 'string' ? normalizeSlug(requestedSlug) : null
  if (!slug || slug !== String(requestedSlug).trim().toLowerCase() || isForbiddenSlug(slug)) {
    return {
      ok: false,
      reason: 'invalid',
      error:
        'A product name is 3–40 lowercase letters, digits and dashes (not starting or ending with one), and not a reserved name.',
    }
  }

  const supabase = getSupabaseServiceClient()
  const owned = await ownsSlug(supabase, userId, slug)
  if (owned === null) return { ok: false, reason: 'error', error: 'Could not check that name right now.' }
  if (owned) return { ok: true, created: false, projectSlug: slug }

  const claim = await claimWorkspace(supabase, userId, workspaceNameFor(naming.displayName, naming.email))
  if (!claim.ok) {
    console.error('[provisioning] workspace claim failed:', claim.error)
    return { ok: false, reason: 'error', error: 'Could not find your workspace right now.' }
  }
  const fail = async (reason: 'taken' | 'error', error: string): Promise<CreateProductResult> => {
    await logRelease(supabase, claim)
    return { ok: false, reason, error }
  }

  // A PLAIN INSERT, never an upsert on `slug` (the rule provisionTenantForUser states): a conflict must be a visible
  // "taken", never a silent bind to somebody else's product.
  const { data, error } = await supabase
    .from('projects')
    .insert({ slug, created_by: userId, workspace_id: claim.workspaceId, api_key_hash: null, from_signup: false })
    .select('id')
    .single()
  if (error || !data) {
    if (error?.code === PG_UNIQUE_VIOLATION) {
      // Two creates of one name racing: the loser re-checks, so its retry (or this answer) says "already yours".
      if (await ownsSlug(supabase, userId, slug)) {
        await logRelease(supabase, claim)
        return { ok: true, created: false, projectSlug: slug }
      }
      return fail('taken', `The name \`${slug}\` is taken. Pick another.`)
    }
    console.error('[provisioning] product insert failed:', error)
    return fail('error', 'Could not create that product.')
  }

  const projectId = data.id as string
  if (!(await insertOwnerOrRollback(supabase, userId, projectId, slug))) {
    return fail('error', 'Could not create that product.')
  }
  const tokenOk = await insertConnectorToken(supabase, userId, projectId, slug)
  await recordAudit({
    action: 'product_created',
    projectId,
    actorUserId: userId,
    metadata: { slug, connectorToken: tokenOk },
  })
  return { ok: true, created: true, projectSlug: slug }
}

/** Does `userId` OWN the product called `slug`? null = could not tell (the caller fails closed). */
async function ownsSlug(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  userId: string,
  slug: string
): Promise<boolean | null> {
  const { data: project, error } = await supabase.from('projects').select('id').eq('slug', slug).maybeSingle()
  if (error) {
    console.error('[provisioning] slug lookup failed:', error)
    return null
  }
  if (!project) return false
  const { data: member, error: memberError } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', project.id)
    .maybeSingle()
  if (memberError) {
    console.error('[provisioning] ownership lookup failed:', memberError)
    return null
  }
  return member?.role === 'owner'
}

/** The feature key the onboarding snippet's event is tagged with. Exported so the onboarding page
 *  and this provisioner name it from ONE place — a stringly-typed drift between what we register
 *  and what the snippet fires would produce exactly the empty funnel this exists to prevent. */
export const STARTER_FEATURE_KEY = 'first_integration'
export const STARTER_TARGET_EVENT = 'integration_connected'
export const STARTER_ADOPTED_EVENT = 'first_event_sent'

/**
 * Registers a starter feature so the new tenant's funnel page has SHAPE the moment their first
 * event lands. Without it they paste the onboarding snippet, the event ingests fine, and the
 * funnel they're sent to renders nothing — a TARS funnel is computed for a REGISTERED feature and
 * they have none. "Reaches their first ingested event; the funnel page shows it" would be half
 * true, which is the kind of half-true this project's honesty rules exist to stop.
 *
 * Goes through the REAL SDK against our own public API — AGENTS rule #1: no direct write to the
 * `features` table from app code, not even from the provisioner. Same seam lib/self-track.ts uses.
 *
 * MUST be scheduled via `after()`, never inline-awaited: it is a real network round-trip (this app
 * calling its own public URL) sitting inside a login redirect, and awaiting it would hold a user
 * who just clicked their confirmation link for up to the full timeout. That is the exact
 * inline-await bug cross-review caught on the waitlist and self-visit routes (Roadmap/LEARNINGS.md).
 */
export async function registerStarterFeature(apiKey: string): Promise<void> {
  try {
    const { createGrowthEngineClient } = await import('@golden-frijoles/sdk')
    const { getSiteUrl } = await import('./site-url')
    const engine = createGrowthEngineClient({
      baseUrl: getSiteUrl(),
      apiKey,
      userId: 'provisioner',
      fetchImpl: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(3000) }),
    })
    const result = await engine.syncFeatures([
      {
        key: STARTER_FEATURE_KEY,
        enabled: true,
        targetEvent: STARTER_TARGET_EVENT,
        adoptedEvent: STARTER_ADOPTED_EVENT,
        description: 'Your first integration — registered automatically so the funnel has shape.',
      },
    ])
    if (!result.ok) console.warn('[provisioning] starter feature sync did not land:', result.error)
  } catch (err) {
    // Total by construction, like lib/self-track.ts: this runs inside a login redirect and must
    // never throw into it.
    console.warn('[provisioning] starter feature sync threw:', err)
  }
}
