'use client'

import { RecoveryScene } from '@/components/brand/RecoveryScene'
import './globals.css'
import '../design-system/system.css'

// Replaces the root layout when it fails, so it must supply its own document and styles.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <RecoveryScene
          code="500"
          title="The pot needs a reset."
          message="We couldn’t open Golden Frijoles right now. Try again or return home."
          onRetry={reset}
        />
      </body>
    </html>
  )
}
