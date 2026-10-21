'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/design-system/primitives'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteExperimentAction, pauseExperimentAction } from './builder-actions'

// landing-launch-experiment · Sprint 6, Story 6.6 — Pause (no confirmation: Resume undoes it) and Delete (confirmed: it
// takes the split off Production and retires the test for good).

export function PauseExperiment({ slug, experimentKey }: { slug: string; experimentKey: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function pause() {
    setPending(true)
    setError(null)
    try {
      const result = await pauseExperimentAction(slug, experimentKey)
      if (!result.ok) setError(result.error)
      else router.refresh()
    } catch {
      setError('That didn’t reach the server. Nothing changed; try again.')
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <Button variant="secondary" className="ds-btn--sm" state={pending ? 'loading' : 'idle'} onClick={pause}>
        Pause
      </Button>
      {error ? (
        <span className="ds-state-detail" role="alert">
          {error}
        </span>
      ) : null}
    </>
  )
}

export function DeleteExperiment({ slug, experimentKey }: { slug: string; experimentKey: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function remove() {
    setPending(true)
    setError(null)
    try {
      const result = await deleteExperimentAction(slug, experimentKey)
      if (!result.ok) setError(result.error)
      else {
        setOpen(false)
        router.push(`/app/experiments/${encodeURIComponent(slug)}`)
      }
    } catch {
      setError('That didn’t reach the server. Nothing changed; try again.')
    } finally {
      setPending(false)
    }
  }
  return (
    <>
      <Button variant="secondary" className="ds-btn--sm" onClick={() => setOpen(true)}>
        Delete experiment
      </Button>
      <ConfirmDialog
        open={open}
        verb="Delete"
        noun="experiment"
        subject={experimentKey}
        consequence="Its split comes off Production — everyone sees what they saw before the test — and it leaves the list. Its record is kept."
        details={
          error ? (
            <p className="ds-chart-note" role="alert">
              {error}
            </p>
          ) : undefined
        }
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => void remove()}
      />
    </>
  )
}
