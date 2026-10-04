import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// think-skills #216 (cross-family review, Codex): the CLI gate must come before the request BODY as well as before the
// credential. Three POST routes parsed first, so with CLI_WRITE_API_ENABLED off a malformed body answered 400
// instead of the uniform 404. They read their body through `readCliBody` now.
//
// The e2e server always runs with the gate ON (born ON, `cli-api.spec.ts`), so the gate-off answer can't be asserted
// end to end. This pins it structurally instead: no CLI route reads a body itself, and the one reader gates first.

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI_ROUTES = join(HERE, '..', 'app', 'api', 'v1', 'cli')

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? routeFiles(full) : name === 'route.ts' ? [full] : []
  })
}

// cli-think-skills-followups S1.2 — the first version of this guard matched `req.` / `request.` and four methods, so
// `req.clone().json()`, a handler whose parameter is named `r`, `req.body` and `req.blob()` all read a body unseen.
// It now anchors on each exported handler's OWN parameter name, whatever it is.
const VERB = '(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)'
const IDENT = '[A-Za-z_$][\\w$]*'
const HANDLER_HEAD = new RegExp(`export\\s+(?:async\\s+)?(function|const|let|var)\\s+${VERB}\\b`, 'g')
// A parameter is a bare name followed by `:`, `,`, `)`, `=` or `?`; `()` is no parameter. Anything else (a
// destructured `{ body }`, a comment) is a shape this guard can't read, so it matches neither and is reported.
const PARAM = `\\(\\s*(?:(${IDENT})\\s*[:,)=?]|(\\)))`
const FUNCTION_PARAM = new RegExp(`^\\s*${PARAM}`)
const CONST_PARAM = new RegExp(
  `^\\s*(?::[^=]+)?=\\s*(?:async\\b\\s*)?(?:function\\b[^(]*)?(?:${PARAM}|(${IDENT})\\s*=>)`
)
// `export { handler as POST }`, `export const { POST } = …` and `export * from …` hide the handler from the parser.
const HIDDEN_EXPORT = new RegExp(
  `export\\s+(?:(?:const|let|var)\\s*)?\\{[^}]*\\b${VERB}\\b[^}]*\\}|export\\s*\\*`
)

/**
 * Each exported route handler's parameter: its name, `null` when it takes none, `undefined` when this parser can't
 * read the declaration (which the real-route test refuses, so an unread shape can't pass silently).
 */
function handlers(source: string): Array<string | null | undefined> {
  const found = [...source.matchAll(HANDLER_HEAD)].map((head) => {
    const rest = source.slice(head.index + head[0].length)
    const param = (head[1] === 'function' ? FUNCTION_PARAM : CONST_PARAM).exec(rest)
    if (!param) return undefined
    return param[1] ?? param[3] ?? (param[2] ? null : undefined)
  })
  return HIDDEN_EXPORT.test(source) ? [...found, undefined] : found
}

function handlerParams(source: string): string[] {
  return [...new Set(handlers(source).filter((name): name is string => typeof name === 'string'))]
}

/**
 * Every place `source` reads a request body through a handler's own parameter, including across a line break or
 * through `?.`. Accepted residuals, out of a regex's reach: an alias (`const r = req`), a cast (`(req as Request)`)
 * and a computed member (`req['json']`). A route that writes any of those is visibly not using `readCliBody`.
 */
function bodyReads(source: string): string[] {
  return handlerParams(source).flatMap((name) => {
    const escaped = name.replace(/\$/g, '\\$')
    const read = new RegExp(
      `(?<![\\w$.])${escaped}(?:\\s*\\??\\.clone\\(\\))?\\s*\\??\\.(?:(?:json|text|formData|arrayBuffer|blob)\\(|body\\b)`,
      'g'
    )
    return [...source.matchAll(read)].map((match) => match[0])
  })
}

test('the body-read matcher fires on every way a handler can read its body', () => {
  const firing: Record<string, string> = {
    clone: 'export async function POST(req: NextRequest) {\n  const input = await req.clone().json()\n}',
    'renamed arrow': 'export const POST = async (r: NextRequest) => {\n  const input = await r.json()\n}',
    'request.text':
      'export async function POST(request: NextRequest) {\n  const raw = await request.text()\n}',
    '.body': 'export async function POST(req: NextRequest) {\n  const stream = req.body\n}',
    blob: 'export function PUT(req: NextRequest) {\n  return req.blob()\n}',
    'const function': 'export const POST = async function (rq: NextRequest) {\n  return rq.formData()\n}',
    'bare arrow': 'export const POST = async rq => rq.arrayBuffer()',
    'multi-line chain':
      'export async function POST(req: NextRequest) {\n  return req\n    .clone()\n    .json()\n}',
    'optional chain': 'export async function POST(req: NextRequest) {\n  return req?.text()\n}',
    'let export': 'export let POST = async (r: NextRequest) => r.json()',
    'clone().body': 'export async function POST(req: NextRequest) {\n  const stream = req.clone().body\n}',
  }
  for (const [name, source] of Object.entries(firing)) {
    assert.ok(bodyReads(source).length > 0, `${name} must fire: ${source}`)
  }
})

test('the body-read matcher stays quiet on a route that reads through readCliBody', () => {
  const clean = `export async function POST(req: NextRequest) {
  const input = await readCliBody(req)
  if (input instanceof NextResponse) return input
  if (req.bodyUsed) return NextResponse.json({ ok: false })
  return NextResponse.json({ ok: true, input })
}
export async function GET() {
  return NextResponse.json({ ok: true })
}`
  assert.deepEqual(bodyReads(clean), [])
  assert.deepEqual(handlers(clean), ['req', null])
})

test('a handler declared in a shape the parser cannot read is reported, never skipped', () => {
  assert.deepEqual(handlers('const post = async (req: NextRequest) => req.json()\nexport { post as POST }'), [
    undefined,
  ])
  assert.deepEqual(handlers('export const POST = handler'), [undefined])
  assert.deepEqual(handlers('export async function POST({ body }: NextRequest) {}'), [undefined])
  assert.deepEqual(handlers('export async function POST(/* the request */ req: NextRequest) {}'), [undefined])
  assert.deepEqual(handlers('export const POST = async ({ body }: NextRequest) => body'), [undefined])
  assert.deepEqual(handlers('export async function POST(...args: [NextRequest]) {}'), [undefined])
  assert.deepEqual(handlers('export const POST = (async (req: NextRequest) => req.json())'), [undefined])
  assert.deepEqual(handlers("export async function GET(req: NextRequest) {}\nexport * from './impl'"), [
    'req',
    undefined,
  ])
})

test('no CLI route parses a request body itself — every body goes through readCliBody', () => {
  const files = routeFiles(CLI_ROUTES)
  assert.ok(files.length >= 5, `found only ${files.length} CLI routes — the walk is wrong`)
  // Pointing the other way: a handler shape the parser can't read would yield no name and pass silently.
  const unread = files.filter((file) => {
    const found = handlers(readFileSync(file, 'utf8'))
    return found.length === 0 || found.includes(undefined)
  })
  assert.deepEqual(unread, [], 'every CLI route handler must be declared in a shape this guard can read')
  const offenders = files.filter((file) => bodyReads(readFileSync(file, 'utf8')).length > 0)
  assert.deepEqual(offenders, [])
})

test('readCliBody checks the gate before it touches the body', () => {
  const source = readFileSync(join(HERE, 'cli-auth.ts'), 'utf8')
  const fn = source.slice(source.indexOf('export async function readCliBody'))
  const gate = fn.indexOf('if (!isCliWriteApiEnabled()) return gateClosed()')
  const parse = fn.indexOf('await req.json()')
  assert.ok(gate !== -1 && parse !== -1, 'readCliBody must gate and then parse')
  assert.ok(gate < parse, 'the gate must come first')
})
