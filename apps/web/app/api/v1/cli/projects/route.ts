import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, cliUserProjects, readCliBody, requireCliAccount } from '@/lib/cli-auth'
import { createProductForUser } from '@/lib/provisioning'
import { getSupabaseServiceClient } from '@/lib/supabase'
import { displayNameFrom } from '@/lib/display-name'

// golden-frijoles-cli · Sprint 1, Story 1.3 — `frijoles projects ls` and `frijoles projects create`.
//
// ── many-products D3 — `create` really creates (it was an ENSURE) ──────────────────────────────
// Until 2026-10-14 `projects_one_per_creator_idx` allowed one product per account, so POST could only report the one the
// signup made. The index now covers only the signup product (D1), and POST makes the product it is NAMED:
//   created      → `{ created: true, slug }`
//   already yours (you OWN that slug) → `{ created: false, slug }` — idempotent for an agent that re-runs
//   anyone else's (incl. one you are only a member of) → `conflict`; a malformed or reserved name → `invalid`
// It lands in the caller's OWN workspace (`createProductForUser` → `claimWorkspace`), never one the request names.
//
// A token made for ONE product (`scopeProjectId`) reaches that product and nothing else, so it may not make siblings:
// any other name answers the same `not_found` a stranger's slug does anywhere in this API.
//
// The ingest key is deliberately NOT minted or returned: `frijoles keys create --type ingest` and `frijoles init --ingest`
// do that, with their own confirmation and audit row.
//
// `frijoles projects use` is a CLIENT-side concept: it records the active project in the credentials file. There is
// nothing to store server-side, which is why there is no route for it.

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const account = await requireCliAccount(req)
  if (account instanceof NextResponse) return account
  try {
    const projects = await cliUserProjects(account)
    return cliOk({
      projects: projects
        .map((project) => ({ slug: project.slug, role: project.role }))
        .sort((left, right) => left.slug.localeCompare(right.slug)),
    })
  } catch (err) {
    console.error('[cli/projects] list failed:', err)
    return cliError('server_error', 'Could not read your projects right now.')
  }
}

/** The account's email and name, read from the auth record by id — only to NAME a workspace the person has none of. */
async function accountNaming(userId: string): Promise<{ email: string | null; displayName: string | null }> {
  const { data, error } = await getSupabaseServiceClient().auth.admin.getUserById(userId)
  if (error) console.error('[cli/projects] account lookup failed:', error)
  // displayNameFrom refuses invisible and bidi characters — the rule workspaceNameFor's callers follow.
  return { email: data?.user?.email ?? null, displayName: displayNameFrom(data?.user?.user_metadata) }
}

export async function POST(req: NextRequest) {
  const account = await requireCliAccount(req)
  if (account instanceof NextResponse) return account
  const body = await readCliBody(req)
  if (body instanceof NextResponse) return body
  const slug = body.slug
  if (typeof slug !== 'string' || slug.trim() === '')
    return cliError('invalid', 'Name the product: `frijoles projects create <slug>`.')

  if (account.scopeProjectId !== null) {
    try {
      const [scoped] = await cliUserProjects(account)
      if (scoped && scoped.slug === slug.trim()) return cliOk({ created: false, slug: scoped.slug })
      return cliError(
        'not_found',
        'This credential was made for one product and cannot create others. Run `frijoles login` again for one that can.'
      )
    } catch (err) {
      console.error('[cli/projects] scoped read failed:', err)
      return cliError('server_error', 'Could not read your projects right now.')
    }
  }

  const result = await createProductForUser(account.userId, slug, await accountNaming(account.userId))
  if (!result.ok) {
    if (result.reason === 'invalid') return cliError('invalid', result.error)
    if (result.reason === 'taken' || result.reason === 'limit') return cliError('conflict', result.error, { reason: result.reason })
    return cliError('server_error', result.error)
  }
  return cliOk({ created: result.created, slug: result.projectSlug })
}
