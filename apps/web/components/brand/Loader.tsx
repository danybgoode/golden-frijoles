'use client'

import { useEffect, useState } from 'react'
import { LOADER_PHRASES, pickLoaderPhraseIndex } from '@/lib/loader-phrases'

// The phrase the last loader showed, across mounts: the navigation loader mounts once per navigation, so without this
// two navigations in a row could open on the same phrase.
let lastPhraseIndex: number | null = null

export function GoldenFrijolesLoader({ compact = false }: { compact?: boolean }) {
  // A random start is safe from hydration mismatches: this loader only mounts after a click or a submit
  // (NavigationLoader renders nothing at hydration), so it never renders on the server.
  const [phraseIndex, setPhraseIndex] = useState(() => pickLoaderPhraseIndex(lastPhraseIndex))

  useEffect(() => {
    lastPhraseIndex = phraseIndex
  }, [phraseIndex])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIndex((current) => (current + 1) % LOADER_PHRASES.length)
    }, 1500)
    return () => window.clearInterval(timer)
  }, [])

  // The rotating phrase is decoration: hidden from assistive tech, so a screen reader hears "Loading" once
  // instead of a new word every 1.5 s.
  return (
    <div className={`gb-loader${compact ? ' gb-loader--compact' : ''}`} role="status">
      <span className="gb-loader__dot" aria-hidden="true" />
      <p aria-hidden="true">{LOADER_PHRASES[phraseIndex]}</p>
      <span className="sr-only">Loading Golden Frijoles</span>
    </div>
  )
}
