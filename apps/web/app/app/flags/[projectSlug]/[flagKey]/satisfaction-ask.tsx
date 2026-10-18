'use client'
// satisfied-ask S1.4 — the console asks a member, once, whether the funnel trend helped. The page decides whether to
// render this (lib/satisfaction-ask.ts → shouldAskSatisfaction); the action re-checks and remembers the answer.
//
// ⚠️ The in-flight lock is our own (flag-switch.tsx records why: useTransition's isPending does not span an async
// action), so a double click cannot send two ratings.

import { useState } from 'react'
import { Button } from '@/design-system/primitives'
import { answerSatisfactionAsk } from './satisfaction-actions'

const SCORES = ['1', '2', '3', '4', '5'] as const

export function SatisfactionAsk({ slug }: { slug: string }) {
  const [state, setState] = useState<'asking' | 'sending' | 'thanks' | 'gone'>('asking')
  if (state === 'gone') return null
  if (state === 'thanks') return <p className="ds-hint">Thanks, that helps us judge this bet.</p>

  async function answer(value: string) {
    if (state !== 'asking') return
    setState('sending')
    const result = await answerSatisfactionAsk(slug, value).catch(() => ({ ok: false }))
    // A failed send hides the ask too: asking again in the same view would read as the click not working.
    setState(result.ok && value !== 'dismissed' ? 'thanks' : 'gone')
  }

  const busy = state === 'sending' ? 'loading' : 'idle'
  return (
    <section className="ds-epic-section" aria-label="Rate the funnel trend">
      <p className="ds-label">Did the funnel trend help you judge this bet?</p>
      <div
        role="group"
        aria-label="From 1 (not at all) to 5 (a lot)"
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        {SCORES.map((score) => (
          <Button key={score} state={busy} onClick={() => void answer(score)}>
            {score}
          </Button>
        ))}
        <Button state={busy} onClick={() => void answer('dismissed')}>
          Not now
        </Button>
      </div>
    </section>
  )
}
