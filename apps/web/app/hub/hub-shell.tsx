import type { ReactNode } from 'react'
import { ProductShell } from '@/components/product/ProductShell'
import { PROJECT_ROUTE_INVENTORY } from '@/lib/project-route-inventory'
import type { ShellSection } from '@/lib/console-shell'

// one-header-one-name · Sprint 1, Story 1.2 — the Hub inside the console (epic README D3, D4, D11).
//
// `HubFrame` gave the Hub its own bar, its own tabs and a "Back to the console" button: a second product
// (`design-system-rails` DD2). Audit decision 3 reverses DD2, so every Hub page now renders in `ProductShell` with Plan
// current (Measure for the report) and its own rail item marked. The URLs are the Hub's and do not change.
//
// The tabs below are NOT a second nav. They are the inventory's own rows (label and href), handed to the shell as its
// `fallbackNav`, which renders only for a viewer who has no rail — see `ProductShell` for who that is and why.

export type HubTab = 'roadmap' | 'board' | 'horizon' | 'report'

const TABS = [
  { id: 'roadmap', segment: 'hub', section: 'plan' },
  { id: 'board', segment: 'hub/board', section: 'plan' },
  { id: 'horizon', segment: 'hub/horizon', section: 'plan' },
  { id: 'report', segment: 'hub/report', section: 'measure' },
] as const satisfies readonly { id: HubTab; segment: string; section: ShellSection }[]

function surfaceOf(segment: (typeof TABS)[number]['segment']) {
  const surface = PROJECT_ROUTE_INVENTORY.find((row) => row.routeSegment === segment)
  // The inventory carries all four (D2, pinned by `project-route-inventory.test.ts`); a missing one is a build defect.
  if (!surface) throw new Error(`hub-shell: no inventory row for ${segment}`)
  return surface
}

export function HubShell({
  projectSlug,
  tab,
  children,
}: {
  projectSlug: string
  tab: HubTab
  children: ReactNode
}) {
  const current = TABS.find((entry) => entry.id === tab)!
  const slug = encodeURIComponent(projectSlug)
  return (
    <ProductShell
      projectSlug={projectSlug}
      section={current.section}
      railActive={current.segment}
      fallbackNav={TABS.map((entry) => {
        const surface = surfaceOf(entry.segment)
        return (
          <a
            key={entry.id}
            href={surface.href(slug)}
            className="ds-shell-tab"
            aria-current={entry.id === tab ? 'page' : undefined}
          >
            {surface.label}
          </a>
        )
      })}
    >
      <main>{children}</main>
    </ProductShell>
  )
}
