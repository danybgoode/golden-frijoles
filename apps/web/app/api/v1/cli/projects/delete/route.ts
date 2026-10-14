import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliAccount, withinScope } from '@/lib/cli-auth'
import { getMembership } from '@/lib/membership'
import { deleteProductForUser } from '@/lib/product-lifecycle'

// POST /api/v1/cli/projects/delete { slug, confirm } — `frijoles projects delete <slug> --confirm <slug>`
// (many-products S2.1, lock D9). Owner only; a member, a stranger and a token made for another product all get the one
// `not_found`. `confirm` must repeat the slug: the CLI sends what the person typed, so a script cannot delete by accident
// with a stale variable. Gone at once: every credential view filters `deleted_at`, and the data waits 30 days for purge.

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const account = await requireCliAccount(req)
  if (account instanceof NextResponse) return account
  const body = await readCliBody(req)
  if (body instanceof NextResponse) return body
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug)
    return cliError('invalid', 'Name the product: `frijoles projects delete <slug> --confirm <slug>`.')
  if (body.confirm !== slug)
    return cliError('invalid', `To delete ${slug}, repeat its name: --confirm ${slug}. Nothing was changed.`)

  const notYours = () => cliError('not_found', `No project \`${slug}\` is available to this account.`)
  const membership = await getMembership(account.userId, slug)
  if (!membership || !withinScope(account, membership.projectId)) return notYours()

  const outcome = await deleteProductForUser(account.userId, slug)
  if (outcome === 'deleted') return cliOk({ deleted: true, slug })
  if (outcome === 'protected')
    return cliError(
      'invalid',
      `${slug} is the public product the landing page reads, so it cannot be deleted.`
    )
  if (outcome === 'not_found') return notYours()
  return cliError('server_error', 'Could not delete that product right now. Nothing was changed.')
}
