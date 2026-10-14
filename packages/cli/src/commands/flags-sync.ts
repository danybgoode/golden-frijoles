// golden-frijoles-cli · Sprint 2, Story 2.5 — `frijoles flags sync`, the catalog bridge.
//
// ── It uses a DIFFERENT credential, and that is the whole design of this verb ─────────────────
// Every other write verb rides the CLI's PAT. This one rides a `flag_sync` key, because the thing
// it is bridging is a CI job publishing a catalog out of source control — a job that must not hold
// a credential that can also roll out or kill a flag. `lib/credential-inventory.ts` models exactly
// that difference: "create flag definitions from an outside catalog; a new flag goes live as written; CANNOT turn
// an existing flag on or off." (one-flag-switch S1.5.)
//
// So the key comes from `--sync-key` or `GOLDEN_FRIJOLES_FLAG_SYNC_KEY`, and the PAT is not a
// fallback. Falling back would quietly hand a pipeline the wider credential the moment someone
// forgot to set the narrower one — which is the failure mode the split exists to prevent.
//
// ── It wraps the SHIPPED client, it does not reimplement the protocol ─────────────────────────
// `createFlagDefinitionSyncClient` from `@golden-frijoles/sdk` owns the request shape, the entry
// cap and the body limit. A second implementation here would drift from the route the first time
// either changed.
//
// ── What a sync switches, and this verb says so ───────────────────────────────────────────────
// one-flag-switch S1.5 (the product owner, 2026-10-13): a NEW flag goes live as written in the source file, default
// and rules, in every environment; an EXISTING flag's switch is never changed by a sync. So the output says, for each
// new flag, what it now serves and to whom (`flagSwitchState` / `flagReach`, the SDK's one rule, the same the flags
// page uses), and that nothing existing was switched.

import { readFileSync } from 'node:fs'
import { createFlagDefinitionSyncClient, flagReach, flagSwitchState } from '@golden-frijoles/sdk'
import { boolFlag, flagValue } from '../args'
import type { Command } from '../command'
import { EXIT, type ExitCode } from '../exit-codes'
import { table } from '../output'

/** What a NEW flag serves after this sync, by the flags page's own rule: `on (everyone)`, `on (25% of people)`, `off`. */
export function nowServes(definition: unknown): string {
  if (flagSwitchState(definition) === 'off') return 'off'
  const reach = flagReach(definition)
  return reach ? `on (${reach})` : 'its value'
}

function definitionOf(catalog: unknown, key: string): unknown {
  return Array.isArray(catalog)
    ? (catalog as Array<{ key?: unknown; definition?: unknown }>).find((entry) => entry?.key === key)
        ?.definition
    : undefined
}

export const flagsSyncCommand: Command = {
  path: ['flags', 'sync'],
  summary: 'publish a flag catalog from source control',
  usage: 'frijoles flags sync --file flags.json [--dry-run]',
  needsAuth: false,
  detail: `Uses a flag_sync key — NOT your CLI token — from --sync-key or
  GOLDEN_FRIJOLES_FLAG_SYNC_KEY. There is deliberately no fallback to the CLI token: a
  pipeline that forgot to set the narrow credential must fail, not quietly get the wide one.

  Mint one with: frijoles keys create --type flag_sync --source <name> --label <text>

  ⚠️ A NEW flag goes live as written in your source file (default and rules), in every
  environment, and the output says what it now serves. An existing flag's switch is never changed by a sync, and a sync never deletes a flag. A key
  that already exists with an identical definition reports created: false; semantic drift from
  an existing version is a conflict for an owner to resolve through the normal version lifecycle.`,
  flags: [
    { name: 'file', value: '<path>', describe: 'a JSON array of { key, definition } entries' },
    { name: 'sync-key', value: '<key>', describe: 'the flag_sync credential (or set the env var)' },
    { name: 'dry-run', describe: 'parse and report, send nothing' },
  ],
  async run(context): Promise<ExitCode> {
    const path = flagValue(context.args, 'file')
    if (!path) {
      context.emit.fail('invalid', 'Usage: `frijoles flags sync --file flags.json`.')
      return EXIT.USAGE
    }

    let catalog: unknown
    try {
      catalog = JSON.parse(readFileSync(path, 'utf8'))
    } catch (err) {
      context.emit.fail(
        'invalid',
        `Could not read ${path}: ${err instanceof Error ? err.message : String(err)}`
      )
      return EXIT.USAGE
    }
    if (!Array.isArray(catalog)) {
      context.emit.fail('invalid', `${path} must contain a JSON ARRAY of { key, definition } entries.`)
      return EXIT.USAGE
    }

    if (boolFlag(context.args, 'dry-run')) {
      // Reports what WOULD be sent and sends nothing — including no credential, which is why the
      // key check is below this branch: a dry run is useful precisely when you have not wired the
      // credential up yet.
      context.emit.ok(
        {
          dryRun: true,
          file: path,
          entries: catalog.length,
          keys: catalog.map((entry) => (entry as { key?: string }).key ?? null),
        },
        `${catalog.length} entr${catalog.length === 1 ? 'y' : 'ies'} in ${path}. Nothing was sent.`
      )
      return EXIT.OK
    }

    const syncKey =
      flagValue(context.args, 'sync-key')?.trim() || context.env.GOLDEN_FRIJOLES_FLAG_SYNC_KEY?.trim()
    if (!syncKey) {
      context.emit.fail(
        'unauthorized',
        'A flag_sync credential is required — pass --sync-key or set GOLDEN_FRIJOLES_FLAG_SYNC_KEY. ' +
          'Your CLI token is deliberately NOT accepted here: catalog publishing gets the narrower key.'
      )
      return EXIT.AUTH
    }

    const client = createFlagDefinitionSyncClient({ baseUrl: context.auth.apiUrl, flagSyncKey: syncKey })
    const result = await client.syncFlagDefinitions(
      catalog as Parameters<typeof client.syncFlagDefinitions>[0]
    )

    if (!result.ok) {
      // `kind` is the SDK's own vocabulary for what went wrong, and it is deliberately NOT the same
      // vocabulary as this CLI's exit codes — mapping between them is this file's job.
      //
      // The mapping turns on the HTTP status for `kind: 'http'`, because that is where the two
      // outcomes an agent can act on differently live: a 409 is catalog DRIFT (an existing immutable
      // version disagrees with the file — resolvable by the caller, exit 4), and a 401 is the sync
      // credential (exit 2). Everything else is exit 6. `validation` is the caller's file and never
      // reached the network at all, so it is a usage error.
      const code =
        result.kind === 'validation'
          ? EXIT.USAGE
          : result.kind === 'http' && result.status === 409
            ? EXIT.CONFLICT
            : result.kind === 'http' && result.status === 401
              ? EXIT.AUTH
              : EXIT.SERVER
      context.emit.fail(
        result.kind,
        result.error,
        // The parser's own messages, verbatim, when it has any. An agent branches on these; folding
        // them into the sentence would turn a list into prose.
        'issues' in result && result.issues !== undefined ? { issues: result.issues } : undefined
      )
      return code
    }

    const created = result.entries.filter((entry) => entry.created)
    context.emit.ok(
      { file: path, entries: result.entries },
      [
        `${created.length} new definition version${created.length === 1 ? '' : 's'} from ${result.entries.length} entr${result.entries.length === 1 ? 'y' : 'ies'}.`,
        '',
        table(
          ['FLAG', 'VERSION', 'RESULT', 'NOW SERVES (every environment)'],
          result.entries.map((entry) => [
            entry.key,
            `v${entry.definitionVersion}`,
            // `created: false` is an identical no-op, NOT a failure — the route is idempotent by
            // design and re-running a pipeline must not read as "nothing worked".
            entry.created ? 'created' : 'unchanged',
            // A new flag is live as written in the file; an existing one was not switched by this sync.
            entry.created ? nowServes(definitionOf(catalog, entry.key)) : 'not switched',
          ])
        ),
        '',
        // Said every time, so nobody concludes a sync switched an EXISTING flag.
        created.length > 0
          ? 'New flags are live as written in the file, in every environment. Existing flags were not switched — use `frijoles flags set` for that.'
          : 'No new flags. Existing flags were not switched — use `frijoles flags set` for that.',
      ].join('\n')
    )
    return EXIT.OK
  },
}
