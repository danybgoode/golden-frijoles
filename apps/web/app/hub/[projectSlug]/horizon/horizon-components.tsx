import { Empty, PageHead } from '@/design-system/primitives'

// many-products S3.2 — the horizon's own head, shared by the page and its empty state so the two cannot drift.
export const HORIZON_LEDE = 'The end states this product is walking toward, and which epics light each one.'

/**
 * `hub-horizon-empty` (an approved SURFACE, `design-system/surfaces/hub-horizon-empty.surface`): a product that has
 * pushed no destinations. It says how to declare one — the horizon is the product's own data (D14), so there is no
 * default list to fall back to and no other product's end states to show.
 */
export function EmptyHorizon() {
  return (
    <>
      <PageHead title="Horizon" lede={HORIZON_LEDE} />
      <Empty
        title="No destinations yet."
        body={
          <>
            Declare them in Roadmap/00-strategy/horizon.md and name one in an epic&apos;s{' '}
            <code className="ds-mono">destination:</code>, then run roadmap-push.
          </>
        }
      />
    </>
  )
}
