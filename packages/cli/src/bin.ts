#!/usr/bin/env node
// The executable. The ONLY place in this package that touches `process.exit` or `process.argv`.
//
// Everything else returns an exit code, which is what lets the whole CLI run in-process in a test
// with a captured writer and an injected `fetch`.
import { spawnSync } from 'node:child_process'
import { run } from './run'

// The old name `gf` was retired in CLI 1.1.0, as plugin-1-0 promised (scripts/check-deprecations.mjs keeps it gone).

run({
  argv: process.argv.slice(2),
  scriptPath: process.argv[1],
  // `frijoles update` runs `npm i -g` for a global install — the one program this CLI ever starts.
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
