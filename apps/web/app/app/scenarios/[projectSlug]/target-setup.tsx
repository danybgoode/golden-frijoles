'use client'
import { useState, useTransition } from 'react'
import { Field, FormSection } from '@/components/ui/FormSection'
import { Panel } from '@/components/ui/Panel'
import { registerScenarioTargetAction } from './actions'

// scenarios-light-up S1.5 — a founder registers an app as a drill target here, copies its token once, and verifies it
// from the targets table. The rules (origin shape, one-time token, the check itself) live in
// `lib/scenario-owner-service.ts`; this only asks and shows what came back.

export const TARGET_VERIFY_REASON = 'Verified from the scenarios page'

const ROUTE_SNIPPET = `// app/api/internal/resilience/ownership/route.ts
import { createScenarioOwnershipHandler } from '@golden-frijoles/sdk'

const answer = createScenarioOwnershipHandler({ token: process.env.GOLDEN_FRIJOLES_TARGET_TOKEN! })

export async function POST(request: Request) {
  return (await answer(request)) ?? new Response(null, { status: 404 })
}`

type Issued = { targetKey: string; token: string }

export function TargetRegistration({
  projectSlug,
  onFeedback,
}: {
  projectSlug: string
  onFeedback: (message: string | null) => void
}) {
  const [targetKey, setTargetKey] = useState('')
  const [origin, setOrigin] = useState('')
  const [reason, setReason] = useState('')
  const [issued, setIssued] = useState<Issued | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <Panel>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          startTransition(async () => {
            const result = await registerScenarioTargetAction(projectSlug, targetKey, origin, reason)
            if (result.ok && typeof result.token === 'string') {
              setIssued({ targetKey, token: result.token })
              setTargetKey('')
              setOrigin('')
              setReason('')
              onFeedback(null)
            } else {
              setIssued(null)
              onFeedback(result.ok ? 'Could not register that target.' : result.error)
            }
          })
        }}
      >
        <FormSection
          title="Register an app as a target"
          description="A drill only runs against an app that has proved it is yours. Register it, put the token in the app, then press Verify on its row below."
        >
          <Field label="Target key" hint="Lowercase, for example site.probe." error={null}>
            {(control) => (
              <input
                {...control}
                value={targetKey}
                required
                placeholder="site.probe"
                onChange={(event) => setTargetKey(event.target.value)}
              />
            )}
          </Field>
          <Field
            label="Origin"
            hint="The app's address with no path, for example https://your.app."
            error={null}
          >
            {(control) => (
              <input
                {...control}
                type="url"
                value={origin}
                required
                placeholder="https://your.app"
                onChange={(event) => setOrigin(event.target.value)}
              />
            )}
          </Field>
          <Field label="Registration reason" hint="Written to the audit log." error={null}>
            {(control) => (
              <input
                {...control}
                value={reason}
                required
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
              />
            )}
          </Field>
          <button
            className="btn btn-gold"
            type="submit"
            disabled={pending || !targetKey || !origin || !reason.trim()}
          >
            {pending ? 'Registering…' : 'Register target'}
          </button>
        </FormSection>
      </form>

      {issued ? (
        <section className="notice" role="region" aria-label="Target token">
          <h3>{issued.targetKey} is registered, but not verified yet</h3>
          <p>
            <strong>Copy it now — it is not shown again.</strong> If you lose it, revoke the target and
            register it again under a new key.
          </p>
          <p>1. Put this line in your app&apos;s server environment:</p>
          <pre>
            <code>{`GOLDEN_FRIJOLES_TARGET_TOKEN=${issued.token}`}</code>
          </pre>
          <p>
            2. Add this route to your app and deploy it (it answers at /api/internal/resilience/ownership):
          </p>
          <pre>
            <code>{ROUTE_SNIPPET}</code>
          </pre>
          <p>
            3. Press Verify on the {issued.targetKey} row below, or from a terminal run{' '}
            <code>{`frijoles scenarios targets verify ${issued.targetKey}`}</code>.
          </p>
          <button className="btn btn-ghost" type="button" onClick={() => setIssued(null)}>
            I have copied it
          </button>
        </section>
      ) : null}
    </Panel>
  )
}
