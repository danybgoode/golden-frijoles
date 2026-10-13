'use client'
// one-flag-switch (D1, D2) — the feature's On / Off switch, per environment.
//
// ONE switch, two states, and ONE way to change it: `setFlagSwitchAction`, which runs the same core as
// `frijoles flags set` / `kill` and the MCP tools (`executeCliFlagWrite`). On serves the flag's `true` variant; Off
// serves `false` to everyone. So a change an agent makes through the CLI, the SDK or MCP is exactly what this switch
// shows, and the reverse. There is no "activated" state and no second off.
//
// ⚠️ THE MONEY PATH. Turning `checkout.stripe_enabled` off in production removes the card rail from a live checkout, so
// the destructive direction confirms (naming the feature and the environment) and the safe one does not: a dialog on
// every click is how a dialog stops being read.
//
// ⚠️ `useTransition`'s isPending does not span an async action (React 18 sets it false before the callback runs), so
// the in-flight lock is our own. Without it the confirm stays clickable during the request, a second click lands, and
// a conflict renders AFTER the switch actually worked: mid-incident that reads as "the kill didn't work".

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { FlagEnvironment } from '@/lib/flag-definition'
import type { FlagSwitchState } from '@/lib/flag-list-view'
import { Callout, Pill } from '@/design-system/primitives'
import { FLAG_STATE_PRESENTATION } from '../flag-vocabulary'
import { setFlagSwitchAction } from '../actions'
import { describeTurnOffConsequence } from '@/lib/flag-console-copy'

export type FlagSwitchEnvironment = {
  environment: FlagEnvironment
  state: FlagSwitchState
}

export function FlagSwitch({
  slug,
  flagKey,
  environments,
  switchable,
  canManage,
  servingEnabled,
  variant = 'panel',
}: {
  slug: string
  flagKey: string
  environments: FlagSwitchEnvironment[]
  /** False for a flag whose value is not on/off (a string, a number, JSON): it shows its value and has no switch. */
  switchable: boolean
  canManage: boolean
  servingEnabled: boolean
  /** `panel`: one row per environment on the feature page. `switch`: one environment, in a list row. */
  variant?: 'panel' | 'switch'
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const inFlight = busy || pending
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<FlagSwitchEnvironment | null>(null)

  const flip = (row: FlagSwitchEnvironment, on: boolean) => {
    setError(null)
    setNotice(null)
    setBusy(true)
    startTransition(async () => {
      try {
        const result = await setFlagSwitchAction(slug, flagKey, row.environment, on)
        if (result.ok) {
          setNotice(`${flagKey} is ${on ? 'on' : 'off'} in ${row.environment}.`)
          router.refresh()
        } else {
          // The server's own sentence: a conflict ("someone else changed this") must reach the operator as itself.
          setError(result.error)
        }
      } catch {
        setError('The change could not be applied. Try again.')
      }
      setBusy(false)
      setConfirming(null)
    })
  }

  const press = (row: FlagSwitchEnvironment) => (row.state === 'on' ? setConfirming(row) : flip(row, true))

  const dialog = (
    <ConfirmDialog
      open={confirming !== null}
      verb="Turn off"
      noun="feature"
      subject={confirming ? `${flagKey} in ${confirming.environment}` : ''}
      consequence={confirming ? describeTurnOffConsequence(flagKey, confirming.environment) : ''}
      pending={inFlight}
      onCancel={() => setConfirming(null)}
      onConfirm={() => confirming && flip(confirming, false)}
    />
  )

  const control = (row: FlagSwitchEnvironment) => (
    <button
      type="button"
      // `role="switch"` + `aria-checked`: two states, and a screen reader says which one it is in.
      role="switch"
      aria-checked={row.state === 'on'}
      className="ds-switch"
      data-state={row.state}
      disabled={inFlight || !servingEnabled}
      aria-label={`Turn ${flagKey} ${row.state === 'on' ? 'off' : 'on'} in ${row.environment}`}
      onClick={() => press(row)}
    />
  )

  if (!canManage || !switchable) {
    // In a list row there is nowhere to put a sentence; the list says "read-only" once, above the table.
    if (variant === 'switch') return null
    if (!switchable) return null
    return (
      <p>
        <strong>Read-only access.</strong> A project owner turns this feature on and off.
      </p>
    )
  }

  if (variant === 'switch') {
    const row = environments[0]
    if (row === undefined) return null
    return (
      <>
        {control(row)}
        {error !== null && (
          <span className="ds-row-alert" role="alert">
            {error}
          </span>
        )}
        {dialog}
      </>
    )
  }

  return (
    <div className="ds-envlist">
      {!servingEnabled && (
        <Callout tone="warn">
          <b>Flag serving is currently switched off.</b> Features can be prepared, but turning them on and off
          is unavailable until <code>FLAG_SERVING_ENABLED</code> is enabled in a new deployment.
        </Callout>
      )}
      {error && (
        <p className="ds-row-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ds-hint" role="status">
          {notice}
        </p>
      )}
      {environments.map((row) => (
        <div className="ds-envrow" key={row.environment}>
          <span className="ds-envname">
            <span className="ds-env-dot" data-env={row.environment} />
            {row.environment}
          </span>
          <Pill state={row.state}>{FLAG_STATE_PRESENTATION[row.state].label}</Pill>
          {control(row)}
        </div>
      ))}
      {dialog}
    </div>
  )
}
