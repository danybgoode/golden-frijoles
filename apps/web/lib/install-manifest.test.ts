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
const { PLUGIN_INSTALL, PLUGIN_MARKETPLACE_ADD, PLUGIN_REMOVE, SKILLS_ADD } =
  await import('./install-prompt.ts')

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

test('the site itself is contacted only with an account', () => {
  const site = installServices(SITE).find((service) => service.host === 'site.example')
  assert.ok(site)
  assert.match(site.when, /only once you sign in/)
})

test('the four sections the story names, in order', () => {
  const headings = page.match(/^## .+$/gm) ?? []
  assert.deepEqual(headings, [
    '## What installs',
    '## How, per agent',
    '## What changes on this machine',
    '## Which services it contacts',
    '## How to remove it',
  ])
})
