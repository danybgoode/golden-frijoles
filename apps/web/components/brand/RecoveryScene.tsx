'use client'

import { Frame, FrameLink } from '@/design-system/Frame'

type RecoverySceneProps = {
  code: '404' | '500'
  title: string
  message: string
  onRetry?: () => void
}

/** The same public face for a missing route and an unexpected rendering failure. */
export function RecoveryScene({ code, title, message, onRetry }: RecoverySceneProps) {
  return (
    <Frame variant="public" brandHref="/">
      <div className="ds-recovery" data-recovery-code={code}>
        <div className="ds-recovery-art" aria-hidden="true">
          <span className="ds-recovery-orbit" />
          <span className="ds-recovery-orbit ds-recovery-orbit--two" />
          <span className="ds-recovery-bean">✦</span>
        </div>
        <p className="ds-recovery-kicker">GOLDEN FRIJOLES / {code}</p>
        <h1>{title}</h1>
        <p className="ds-recovery-copy">{message}</p>
        <div className="ds-recovery-actions">
          {onRetry && (
            <button type="button" className="ds-btn ds-btn--secondary ds-btn--sm" onClick={onRetry}>
              Try again
            </button>
          )}
          <FrameLink href="/" variant="primary">Back to Golden Frijoles</FrameLink>
        </div>
        <p className="ds-recovery-footnote">Every good harvest has a stray bean.</p>
      </div>
    </Frame>
  )
}
