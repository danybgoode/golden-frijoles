import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliAccount } from '@/lib/cli-auth'
import { purgeProductForUser } from '@/lib/product-lifecycle'

// POST /api/v1/cli/projects/purge { slug, confirm } — `frijoles projects purge <slug> --confirm <slug>` (many-products
// S2.2, lock D10). Removes a product deleted at least 30 days ago, and everything that points at it, for good. The owner
// runs it; there is no scheduler (Plan gate decision b), so nothing here reads across products.
//
// A token made for ONE product cannot purge: a deleted product is outside every scope it could name, and the account-wide
// token is the one that answers for the account.

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const account = await requireCliAccount(req)
  if (account instanceof NextResponse) return account
  const body = await readCliBody(req)
  if (body instanceof NextResponse) return body
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!slug)
    return cliError('invalid', 'Name the product: `frijoles projects purge <slug> --confirm <slug>`.')
  if (body.confirm !== slug)
    return cliError('invalid', `To purge ${slug}, repeat its name: --confirm ${slug}. Nothing was changed.`)

  const notFound = () => cliError('not_found', `No deleted product \`${slug}\` of yours to purge.`)
  if (account.scopeProjectId !== null) return notFound()

  const outcome = await purgeProductForUser(account.userId, slug)
  if (outcome.kind === 'purged') return cliOk({ purged: true, slug })
  if (outcome.kind === 'too_soon')
    return cliError(
      'conflict',
      `${slug} was deleted less than 30 days ago. It can be purged from ${outcome.purgeAfter.slice(0, 10)}.`,
      { purgeAfter: outcome.purgeAfter }
    )
  if (outcome.kind === 'not_found') return notFound()
  return cliError('server_error', 'Could not purge that product right now. Nothing was changed.')
}
