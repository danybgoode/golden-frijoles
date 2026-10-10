'use client'

import { RecoveryScene } from '@/components/brand/RecoveryScene'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RecoveryScene
      code="500"
      title="A bean got stuck."
      message="This page couldn’t load right now. Give it another try, or head back home."
      onRetry={reset}
    />
  )
}
