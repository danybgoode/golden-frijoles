// account-from-the-terminal · Sprint 1, Story 1.1 — `install.md` says exactly what it contacts.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'

// The extensionless-import hook `cli-flag-view.test.ts` uses: app source imports relatives without
// an extension and Node's native TS loader demands one, so only this test opts into the looser rule.
type ResolveHook = (
  specifier: string,
  context: Record<string, unknown>,
  nextResolve: (specifier: string, context: Record<string, unknown>) => unknown
) => unknown
;(Module as typeof Module & { registerHooks: (hooks: { resolve: ResolveHook }) => void }).registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      typeof context.parentURL === 'string' &&
      context.parentURL.includes('/apps/web/lib/') &&
      specifier.startsWith('./') &&
      !specifier.endsWith('.ts')
    ) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { installManifest, installServices } = await import('./install-manifest.ts')
const { CLI_GLOBAL_INSTALL, CLI_NPX_INIT, CLI_NPX_LOGIN } = await import('./cli-install.ts')
const {
  PLUGIN_INSTALL,
  PLUGIN_MARKETPLACE_ADD,
  PLUGIN_MARKETPLACE_REMOVE,
  PLUGIN_REMOVE,
  SKILLS_ADD,
  SKILLS_TELEMETRY_OPT_OUT,
} = await import('./install-prompt.ts')

const SITE = 'https://site.example'
const page = installManifest(SITE)

test('every install command on the page is a named constant the site renders', () => {
  for (const command of [
    PLUGIN_MARKETPLACE_ADD,
    PLUGIN_INSTALL,
    SKILLS_ADD,
    CLI_NPX_LOGIN,
    CLI_NPX_INIT,
    CLI_GLOBAL_INSTALL,
  ]) {
    assert.ok(page.includes(command), `install.md is missing \`${command}\``)
  }
  assert.ok(page.includes(PLUGIN_REMOVE), 'install.md must say how to remove it')
  // `uninstall` alone leaves the marketplace registered and auto-updating (fresh reviewer, PR #277).
  assert.ok(
    page.includes(PLUGIN_MARKETPLACE_REMOVE),
    'install.md must say how to stop the marketplace updating'
  )
})

test('every host the page names is in the services list, and every listed service is named', () => {
  const listed = new Set(installServices(SITE).map((service) => service.host))
  // Hosts as they appear: inside URLs, and in the bolded services list.
  const named = new Set<string>()
  for (const url of page.match(/https?:\/\/[^\s)`]+/g) ?? []) named.add(new URL(url).host)
  for (const bold of page.match(/\*\*([a-z0-9.-]+\.[a-z]{2,})\*\*/g) ?? [])
    named.add(bold.replaceAll('*', ''))
  for (const host of named)
    assert.ok(listed.has(host), `install.md names ${host} but it is not in installServices()`)
  for (const host of listed)
    assert.ok(page.includes(`**${host}**`), `${host} is a listed service the page does not show`)
})

test('the site itself is contacted only for this page, and otherwise only with an account', () => {
  const site = installServices(SITE).find((service) => service.host === 'site.example')
  assert.ok(site)
  assert.match(site.when, /reading this page; after that, only once you sign in/)
})

test("`npx skills`'s own telemetry is named, with its opt-out", () => {
  // The third-party CLI posts install telemetry to add-skill.vercel.sh unless opted out (its
  // `dist/cli.mjs`, read during PR #277's review). A trust page that omits it is wrong.
  const telemetry = installServices(SITE).find((service) => service.host === 'add-skill.vercel.sh')
  assert.ok(telemetry)
  assert.ok(telemetry.when.includes(SKILLS_TELEMETRY_OPT_OUT))
})

test('no relative console link that 404s: revocation points at the console root', () => {
  // `/app/setup/cli` has no index route (only `/app/setup/cli/[projectSlug]`) and answered 404 in
  // production when PR #277 named it.
  assert.ok(!page.includes('/app/setup/cli'))
})

test('the four sections the story names, in order', () => {
  const headings = page.match(/^## .+$/gm) ?? []
  assert.deepEqual(headings, [
    '## What installs',
    '## This release',
    '## How, per agent',
    '## What changes on this machine',
    '## Which services it contacts',
    '## Security review',
    '## How to remove it',
  ])
})

test('it names the release and lists a SHA-256 for every plugin file, from the release itself', async () => {
  const { PLUGIN_SHA256SUMS, PLUGIN_VERSION, CLI_VERSION } = await import('./plugin-release.generated.ts')
  assert.ok(page.includes(`plugin v${PLUGIN_VERSION}`))
  assert.ok(page.includes(`--branch v${PLUGIN_VERSION}`))
  assert.ok(page.includes(`@golden-frijoles/cli@${CLI_VERSION}`))
  const lines = PLUGIN_SHA256SUMS.split('\n').filter(Boolean)
  assert.ok(lines.length > 0)
  for (const line of lines) assert.ok(page.includes(`${line}\n`), `install.md is missing ${line}`)
})

test('every security claim is on the page, under the security review', async () => {
  const { securityClaims } = await import('./install-security-claims.ts')
  const review = page.slice(page.indexOf('## Security review'), page.indexOf('## How to remove it'))
  for (const claim of securityClaims(SITE)) assert.ok(review.includes(claim.text), claim.id)
  for (const choice of ['Review it before installing', 'Also ask a second model (Codex), if installed', 'Install it now', 'Not now'])
    assert.ok(review.includes(choice), choice)
})
