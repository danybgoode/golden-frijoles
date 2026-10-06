'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Callout, Field } from '@/design-system/primitives'
import { formatUtc } from '@/lib/format-utc'
import type { CliTokenRow } from '@/lib/cli-tokens'
import { revokeCliTokenAction } from '../../cli/[projectSlug]/actions'

// account-from-the-terminal · Sprint 3, Story 3.2 — "Your coding agent and gf", the first row of
// Setup › Connections' "who and what is connected". Each row is one of YOUR CLI tokens — the
// credential `gf login` saves, which your coding agent uses through `gf` — so Disconnect is
// `revokeCliTokenAction`, scoped to your own account in `revokeCliToken`. The next `gf whoami` on
// that machine is refused and says to sign in again.
//
// Rendered as a `Field` INSIDE the page's first card: the approved `setup-connect` state is a fixed
// block sequence, and a field inside a card adds no block.
export function CodingAgents({ slug, tokens }: { slug: string; tokens: readonly CliTokenRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function onDisconnect(tokenId: string) {
    setError(null)
    startTransition(async () => {
      const result = await revokeCliTokenAction(slug, tokenId).catch(() => ({
        ok: false as const,
        error: 'Could not reach the server. Check your connection and retry.',
      }))
      setConfirming(null)
      if (!result.ok) setError(result.error)
      router.refresh()
    })
  }

  return (
    <Field
      label="Your coding agent and gf"
      hint={
        tokens.length === 0
          ? 'Nothing connected yet. Run `gf login` in your terminal; it signs this account in through the browser.'
          : 'Each one is a machine signed in with `gf login`. Disconnect signs it out: its next command asks to sign in again.'
      }
    >
      {tokens.map((token) => (
        <span className="ds-copyrow" key={token.id}>
          <span>
            <b>{token.label}</b>{' '}
            <span className="ds-hint">
              connected {formatUtc(token.createdAt)} ·{' '}
              {token.lastUsedAt ? `last active ${formatUtc(token.lastUsedAt)}` : 'not used yet'}
            </span>
          </span>
          <button
            type="button"
            className="ds-btn ds-btn--secondary"
            onClick={() => setConfirming(token.id)}
            disabled={pending}
          >
            Disconnect
          </button>
          <ConfirmDialog
            open={confirming === token.id}
            verb="Disconnect"
            noun="coding agent"
            subject={token.label}
            consequence="That machine is signed out at once: its next gf command asks to sign in again."
            details="Run gf login there to connect it again."
            pending={pending}
            onConfirm={() => onDisconnect(token.id)}
            onCancel={() => setConfirming(null)}
          />
        </span>
      ))}
      {error && <Callout tone="warn">{error}</Callout>}
    </Field>
  )
}
