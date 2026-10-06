import { test, expect } from '@playwright/test'
import { installPrompt } from '@/lib/install-prompt'

// golden-frijoles-plugin · Sprint 3, Story 3.3/3.4 — the install prompt is ONE string on three
// surfaces: the landing (`/`, hero and closing CTA), `/install`, and the signed-in onboarding page.
// account-from-the-terminal D2: it is `installPrompt(getSiteUrl())`, and the test server's site URL
// is its own `baseURL` — the same assumption `landing-prompts.spec.ts` makes.
//
// ── Why this checks the RENDERED HTML rather than trusting the import ───────────────────────────
// `CopyPromptCard` renders `{prompt}` as a text child of a `<pre>`, so a real page load is the only
// thing that proves the string actually reached the reader rather than sitting unused in a module
// nobody imports — the same "presence is not execution" failure class
// `check-onboarding-parity.mjs` (golden-frijoles/skills) exists to catch on the plugin repo's own
// surfaces. Both unauthed routes are checked here, in the `api` project (no browser needed — the
// prompt is server-rendered). The onboarding page needs a session; see
// `install-prompt.authed.spec.ts`.
//
// React SSR escapes the apostrophe as `&#x27;` in the raw HTML; decoded back before comparing so
// this asserts the exact string a reader who copies the rendered `<pre>` actually gets.
function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

test('the landing (/) serves the install prompt verbatim', async ({ request, baseURL }) => {
  const res = await request.get('/')
  expect(res.status()).toBe(200)
  const html = decodeHtmlEntities(await res.text())
  // Presence only: the raw HTML repeats every string in the RSC payload, so a count here measures
  // React, not the page. That BOTH cards carry it is asserted on rendered text in
  // `landing.browser.spec.ts`.
  expect(html, '/ does not carry the install prompt verbatim').toContain(installPrompt(baseURL!))
})

test('/install serves the install prompt verbatim', async ({ request, baseURL }) => {
  const res = await request.get('/install')
  expect(res.status()).toBe(200)
  const html = decodeHtmlEntities(await res.text())
  expect(html, '/install does not carry the install prompt verbatim').toContain(installPrompt(baseURL!))
})

// account-from-the-terminal S1.1 — the page the prompt sends the agent to, served as Markdown.
test('/install.md is the plain page the prompt names', async ({ request, baseURL }) => {
  const res = await request.get('/install.md')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('text/markdown')
  const body = await res.text()
  for (const heading of [
    '## What installs',
    '## What changes on this machine',
    '## Which services it contacts',
    '## How to remove it',
  ]) {
    expect(body, `install.md is missing ${heading}`).toContain(heading)
  }
  // The URL the prompt NAMES must be a route that answers — taken from the prompt, not restated.
  const named = installPrompt(baseURL!).match(/https?:\/\/\S+?\/install\.md/)?.[0]
  expect(named, 'the prompt no longer names an install.md URL').toBeTruthy()
  const followed = await request.get(new URL(named!).pathname)
  expect(followed.status(), `${named} is named in the prompt but does not resolve`).toBe(200)
})
