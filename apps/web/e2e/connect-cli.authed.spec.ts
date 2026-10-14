import { test, expect } from '@playwright/test'
import { CLI_GLOBAL_INSTALL, CLI_HELP, cliPinnedLogin } from '../lib/cli-install'
import { CLI_VERSION } from '../lib/plugin-release.generated'
import { disposableSession } from './helpers/disposable-session'

// many-products · Sprint 2, Story 2.3 (D11) — /connect shows how to install the CLI, with the version this build ships.
test('Connect: shows the three CLI lines, the login pinned to CLI_VERSION', async ({ browser }) => {
  test.setTimeout(60_000)
  const session = await disposableSession(browser, 'owner')
  try {
    const mine = await session.addProject('owner', 'connect-cli')
    await session.page.goto(`/app/setup/connect/${mine.slug}`)
    const main = session.page.locator('main')
    await expect(main).toContainText(CLI_GLOBAL_INSTALL)
    // The version is spelled out here on purpose: a page that drifted to another version must fail.
    await expect(main).toContainText(`npx -y @golden-frijoles/cli@${CLI_VERSION} login`)
    await expect(main).toContainText(cliPinnedLogin(CLI_VERSION))
    await expect(main).toContainText(CLI_HELP)
  } finally {
    await session.cleanup()
  }
})
