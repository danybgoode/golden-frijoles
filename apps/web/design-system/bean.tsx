/** @jsxImportSource react */
// The pragma is a no-op for Next and load-bearing for the test rail (`e2e/bean.spec.tsx` renders this file): see
// `app/hub/hub-components.tsx` for why.
import type { BeanKind } from '@/lib/roadmap-result'
import { BEAN_WORDS } from '@/lib/roadmap-result'

// result-record · Story 2.3 (D11) — the Bean: a result at a glance.
//
// Built here to `night-garden-design-system` S2.1's own spec because that epic had not shipped when the result record
// needed it (amendment, Daniel 2026-10-06): four kinds, three sizes, its word for screen readers, **gold only on
// proven**. Night garden re-skins it with its own values and adds the specimen; this file is the one Bean either way.
//
// ── Never colour alone ────────────────────────────────────────────────────────────────────────
// Every kind is the same shape, so the colour is the only visual difference — DD4 forbids that being the only signal.
// Standalone, the Bean is `role="img"` named by its word. Beside its word in visible text (the board card), pass
// `decorative` so a screen reader hears the word once, not twice.

export const BEAN_SIZES = [18, 24, 36] as const
export type BeanSize = (typeof BEAN_SIZES)[number]

export function Bean({
  kind,
  size = 18,
  decorative = false,
}: {
  kind: BeanKind
  size?: BeanSize
  decorative?: boolean
}) {
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': BEAN_WORDS[kind] } as const)
  return (
    <svg className="ds-bean" data-kind={kind} width={size} height={size} viewBox="0 0 24 24" {...a11y}>
      <ellipse className="ds-bean-body" cx="12" cy="12" rx="7" ry="10" transform="rotate(-28 12 12)" />
      <path className="ds-bean-crease" d="M9.5 6.5c2.6 2.4 2.9 7.4 0.6 10.6" />
    </svg>
  )
}
