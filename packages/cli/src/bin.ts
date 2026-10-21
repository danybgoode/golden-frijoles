#!/usr/bin/env node
// The executable. The ONLY place in this package that touches `process.exit` or `process.argv`.
//
// Everything else returns an exit code, which is what lets the whole CLI run in-process in a test
// with a captured writer and an injected `fetch`.
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { run } from './run'
import { resolveScriptPath } from './update-check'

// The old name `gf` was retired in CLI 1.1.0, as plugin-1-0 promised (scripts/check-deprecations.mjs keeps it gone).

run({
  argv: process.argv.slice(2),
  // Resolved: a global or `.bin` entry is a symlink, and the link's own path cannot say how this copy was installed.
  scriptPath: resolveScriptPath(process.argv[1], realpathSync),
  // `frijoles version` / `update` run `npm root -g`, and `update` runs `npm i -g` for a global install. (Other
  // programs the CLI starts — the browser opener and `git` — are in device-login.ts and init.ts.)
  exec: (command, args, options) => {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      shell: process.platform === 'win32',
    })
    return { status: result.status, stdout: typeof result.stdout === 'string' ? result.stdout : undefined }
  },
  // The once-a-day update notice, only in an interactive terminal (never in a pipe or CI).
  updateCheck: Boolean(process.stderr.isTTY),
})
  .then((code) => {
    process.exitCode = code
  })
  .catch((err) => {
    // `run()` already catches a handler throwing. Reaching here means the dispatcher itself failed —
    // a broken install, an unreadable module. Say so plainly rather than printing a bare stack.
    process.stderr.write(`frijoles failed to start: ${err instanceof Error ? err.message : String(err)}\n`)
    process.exitCode = 6
  })
