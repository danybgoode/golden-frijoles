// agent-legible-horizon · Sprint 1, Story 1.4 (D6) — `/agents.md` is held to the code in both directions:
// everything it names exists, and everything that exists is named.
//
// The CLI's commands and the connector's tools are read from SOURCE (the command files' `path:` and the
// `registerTool('…')` calls), not imported: the CLI uses extensionless imports Node will not load, and
// reading source is what lets a command added tomorrow fail this test today.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Module from 'node:module'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// The extensionless-import hook `install-manifest.test.ts` uses (app source imports relatives without an extension).
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

const { AGENTS_MD } = await import('./agents-manifest.ts')

const WEB = join(import.meta.dirname, '..')
const COMMANDS_DIR = join(WEB, '..', '..', 'packages', 'cli', 'src', 'commands')
const MCP_SOURCES = [
  join(WEB, 'app', 'api', 'v1', 'public', 'mcp', 'c', '[token]', 'route.ts'),
  join(WEB, 'lib', 'mcp-flag-tools.ts'),
  join(WEB, 'lib', 'mcp-scenario-tools.ts'),
]

/**
 * Named here, and ONLY here, as "landing in this sprint" (agent-legible-horizon D1–D3, built in parallel).
 * An entry is excused solely while the source does not have it. The day `frijoles horizon` / `get_horizon`
 * land, the excuse stops applying and the page must name them like anything else — so this list needs no edit.
 */
const LANDING_CLI = ['horizon']
const LANDING_TOOLS = ['get_horizon']

/** Every command path in the CLI, from the `path: [...]` of each command file. */
function cliCommandPaths(): string[][] {
  const paths: string[][] = []
  for (const file of readdirSync(COMMANDS_DIR)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue
    const source = readFileSync(join(COMMANDS_DIR, file), 'utf8')
    for (const match of source.matchAll(/^\s*path: \[([^\]]*)\]/gm)) {
      const parts = match[1].split(',').map((part) => part.trim())
      const literal = parts.filter((part) => /^'[a-z-]+'$/.test(part)).map((part) => part.slice(1, -1))
      if (literal.length === parts.length) paths.push(literal)
      else {
        // `path: ['projects', verb]` — one shape built for several verbs by `lifecycleCommand('delete')`.
        for (const verb of source.matchAll(/lifecycleCommand\('([a-z-]+)'\)/g))
          paths.push([...literal, verb[1]])
      }
    }
  }
  return paths
}

function mcpToolNames(): string[] {
  const names: string[] = []
  for (const file of MCP_SOURCES)
    for (const match of readFileSync(file, 'utf8').matchAll(/registerTool\(\s*'([a-z_]+)'/g))
      names.push(match[1])
  return names
}

/** Each backticked `frijoles …` the page writes, as its leading plain words (stops at `<`, `--`, quotes, `|`). */
function namedCommands(): string[][] {
  const named: string[][] = []
  for (const match of AGENTS_MD.matchAll(/`frijoles ([^`]*)`/g)) {
    const words: string[] = []
    for (const word of match[1].split(/\s+/)) {
      if (!/^[a-z][a-z-]*$/.test(word)) break
      words.push(word)
    }
    if (words.length > 0) named.push(words)
  }
  return named
}

/** A tool is named as a backticked snake_case word starting with one of the verbs the connector's tools use. */
function namedTools(): string[] {
  return [
    ...new Set(
      [...AGENTS_MD.matchAll(/`((?:get|list|create|set|rollout|kill|compare|propose|apply)_[a-z_]+)`/g)].map(
        (match) => match[1]
      )
    ),
  ]
}

const paths = cliCommandPaths()
const tools = mcpToolNames()
const startsWith = (words: string[], path: string[]) => path.every((part, i) => words[i] === part)

test('the guard can see the source it holds the page to', () => {
  assert.ok(paths.length >= 35, `read only ${paths.length} CLI command paths`)
  assert.ok(
    paths.some((p) => p.join(' ') === 'projects delete'),
    'the lifecycle verbs were not expanded'
  )
  assert.ok(tools.length >= 17, `read only ${tools.length} registered MCP tools`)
  assert.ok(
    tools.includes('list_scenarios') && tools.includes('kill_flag') && tools.includes('apply_task_change')
  )
})

test('every `frijoles <verb …>` the page names is a real command', () => {
  for (const words of namedCommands()) {
    if (LANDING_CLI.includes(words[0]) && !paths.some((p) => p[0] === words[0])) continue
    assert.ok(
      paths.some((path) => startsWith(words, path)),
      `agents.md names \`frijoles ${words.join(' ')}\`, which is not a command in packages/cli/src/commands`
    )
  }
})

test('every MCP tool the page names is registered', () => {
  const named = namedTools()
  assert.ok(named.length >= 17, 'the page names too few tools to be the whole list')
  for (const name of named) {
    if (LANDING_TOOLS.includes(name) && !tools.includes(name)) continue
    assert.ok(tools.includes(name), `agents.md names ${name}, which no registerTool call registers`)
  }
})

test('every CLI command that exists is named on the page', () => {
  const named = namedCommands()
  for (const path of paths)
    assert.ok(
      named.some((words) => startsWith(words, path)),
      `\`frijoles ${path.join(' ')}\` exists but agents.md never names it`
    )
})

test('every registered MCP tool is named on the page', () => {
  const named = namedTools()
  for (const name of tools)
    assert.ok(named.includes(name), `${name} is registered but agents.md never names it`)
})

test('the landing-in-this-sprint excuse is used only for what the source does not have yet', () => {
  assert.ok(
    LANDING_CLI.some((verb) => namedCommands().some((words) => words[0] === verb)),
    'agents.md must name `frijoles horizon` (D1–D3)'
  )
  assert.ok(namedTools().includes('get_horizon'), 'agents.md must name `get_horizon` (D3)')
})

test('the page carries the D4 dry run and no real connector URL', () => {
  assert.match(AGENTS_MD, /roadmap-push --dry-run/)
  assert.match(AGENTS_MD, /codex mcp add golden-frijoles --url <your connector URL>/)
  assert.doesNotMatch(AGENTS_MD, /mcp\/c\/[A-Za-z0-9_-]{8,}/)
})
