import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/supabase-auth'
import { getUserProjects } from '@/lib/membership'
import { isBillingCheckoutEnabled } from '@/lib/flags'
import { ownWorkspaceForBilling } from '@/lib/billing'
import { BILLING_PAGE, billingMessage, billingView } from '@/lib/billing-view'
import { SCREEN_WORDS } from '@/lib/screen-words'
import { ProductShell } from '@/components/product/ProductShell'
import { Button, Callout, Empty, ListCard, PageHead, Stat, Summary } from '@/design-system/primitives'

// landing-launch-experiment · Sprint 4 (epic D27, D28's order) — Plan & billing: the caller's OWN workspace's plan, and the
// two ways to Stripe. It ships before the checkout switch goes on: it is how the first real purchase is made, and the only
// way to reach the portal, which is the only way to cancel.
//
// Tenancy: the workspace is the one the session's user created AND owns (lib/billing.ts → ownWorkspaceForBilling), never
// one the URL names; nothing from inside any project is read. Both buttons are POST forms (a prefetch must never create a
// Stripe customer), and both routes resolve the workspace again themselves.
export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string | string[] }>
}) {
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(BILLING_PAGE)}`)

  const [workspace, projects, query] = await Promise.all([
    ownWorkspaceForBilling(user.id),
    getUserProjects(user.id),
    searchParams,
  ])
  // Awaited on its own line: a gate is a Promise, and lib/gates-guard.test.ts asks to SEE the await (rule #6).
  const checkoutOn = await isBillingCheckoutEnabled()
  const message = billingMessage(query.billing, workspace?.plan)
  // The frame names a project from THIS workspace, so the chrome and the page describe the same tenant.
  const slug = (workspace && projects.find((p) => p.workspace.id === workspace.id)?.slug) ?? projects[0]?.slug

  return (
    <ProductShell projectSlug={slug} section="home" railActive={null}>
      <main data-billing-plan={workspace?.plan ?? 'none'}>
        {workspace === null ? (
          <>
            <PageHead title={SCREEN_WORDS.billing} lede="Your plan and how you pay for it." />
            {message ? <Callout tone={message.tone}>{message.text}</Callout> : null}
            <Empty
              title="Only a workspace's owner manages its plan."
              body="You are a member of someone else's workspace. Its owner can buy Growth or change billing from this page."
            />
          </>
        ) : (
          <BillingBody
            name={workspace.name}
            message={message}
            view={billingView({
              plan: workspace.plan,
              productLimit: workspace.productLimit,
              monthlyEventPool: workspace.monthlyEventPool,
              hasStripeCustomer: workspace.stripeCustomerId !== null,
              checkoutOn,
            })}
          />
        )}
      </main>
    </ProductShell>
  )
}

function BillingBody({
  name,
  message,
  view,
}: {
  name: string
  message: ReturnType<typeof billingMessage>
  view: ReturnType<typeof billingView>
}) {
  return (
    <>
      <PageHead
        title={SCREEN_WORDS.billing}
        lede={`${name}: one plan for the whole workspace, every product and every person in it.`}
        actions={
          view.canBuy || view.canManage ? (
            <>
              {view.canManage ? (
                <form method="post" action="/api/v1/billing/portal">
                  <Button type="submit" variant={view.canBuy ? 'secondary' : 'primary'}>
                    Manage billing
                  </Button>
                </form>
              ) : null}
              {view.canBuy ? (
                <form method="post" action="/api/v1/billing/checkout">
                  <Button type="submit" variant="primary">
                    Get Growth · $49/month
                  </Button>
                </form>
              ) : null}
            </>
          ) : undefined
        }
      />
      {message ? <Callout tone={message.tone}>{message.text}</Callout> : null}
      <Summary>
        <Stat {...view.plan} />
        <Stat {...view.products} />
        <Stat {...view.events} />
      </Summary>
      {view.note ? <Callout>{view.note}</Callout> : null}
      {view.canBuy ? (
        <ListCard plain>
          <p>
            Growth lifts the product limit and raises the shared event pool to 2,000,000 a month. You pay
            through Stripe; cancel any time from Manage billing, and the workspace keeps Growth until the end
            of the month you paid for.
          </p>
        </ListCard>
      ) : null}
    </>
  )
}
