import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { getSupabaseServiceClient } from '@/lib/supabase'

// The operator's members view in tally (tally.goldenfrijoles.com, the owner's own analytics app). tally calls
// GET /api/internal/tally/{summary|members|log} server-side with `Authorization: Bearer $TALLY_CONNECTOR_KEY` and
// renders the answer for the master-key holder only; it stores nothing. Daniel asked for it on 2026-11-27 ("members
// lists have to be available in all projects"). It is an operator read, never a tenant read: no session, API key or
// page reaches it, and every request without the exact key (or with the key unset) is a plain 404.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = Record<string, string | number | null>
type Col = { key: string; label: string; type?: 'text' | 'number' | 'date'; sort?: boolean }

const notFound = () => new Response(null, { status: 404 })

function authorized(request: Request): boolean {
  const secret = process.env.TALLY_CONNECTOR_KEY?.trim()
  const header = request.headers.get('authorization')
  if (!secret || secret.length < 32 || !header?.startsWith('Bearer ')) return false
  const given = Buffer.from(header.slice('Bearer '.length).trim())
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

const json = (body: unknown) => Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
const int = (v: string | null, d: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.parseInt(v ?? '', 10) || d))
const dayKey = (iso: string) => iso.slice(0, 10)

// Sort, filter and page a small in-memory list (the operator's member list is hundreds, not millions).
function page(rows: Row[], cols: Col[], url: URL) {
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
  const sort = url.searchParams.get('sort') ?? ''
  const dir = url.searchParams.get('dir') === 'asc' ? 1 : -1
  const size = int(url.searchParams.get('size'), 25, 5, 200)
  let list = q
    ? rows.filter((r) =>
        Object.values(r).some((v) =>
          String(v ?? '')
            .toLowerCase()
            .includes(q)
        )
      )
    : rows
  if (cols.some((c) => c.key === sort && c.sort)) {
    list = [...list].sort((a, b) => {
      const x = a[sort],
        y = b[sort]
      if (x === y) return 0
      if (x === null || x === undefined) return 1
      if (y === null || y === undefined) return -1
      return (x < y ? -1 : 1) * dir
    })
  }
  const pageNo = int(url.searchParams.get('page'), 1, 1, 100000)
  return { total: list.length, rows: list.slice((pageNo - 1) * size, pageNo * size), columns: cols }
}

type AuthUser = { id: string; email?: string | null; created_at: string; last_sign_in_at?: string | null }

async function allUsers(): Promise<AuthUser[]> {
  const db = getSupabaseServiceClient()
  const out: AuthUser[] = []
  for (let p = 1; p <= 50; p++) {
    const { data, error } = await db.auth.admin.listUsers({ page: p, perPage: 1000 })
    if (error) throw error
    out.push(...(data.users as AuthUser[]))
    if (data.users.length < 1000) break
  }
  return out
}

async function memberRows(): Promise<Row[]> {
  const db = getSupabaseServiceClient()
  const [users, ws, wm, pr] = await Promise.all([
    allUsers(),
    db.from('workspaces').select('id, name, stripe_subscription_id, created_by'),
    db.from('workspace_members').select('workspace_id, user_id, role'),
    db.from('projects').select('id, workspace_id, first_event_at, deleted_at'),
  ])
  for (const r of [ws, wm, pr]) if (r.error) throw r.error
  const wsById = new Map((ws.data ?? []).map((w) => [w.id as string, w]))
  const projects = (pr.data ?? []).filter((p) => !p.deleted_at)
  return users.map((u) => {
    const m = (wm.data ?? []).find((x) => x.user_id === u.id)
    const w = m ? wsById.get(m.workspace_id as string) : undefined
    const mine = w ? projects.filter((p) => p.workspace_id === w.id) : []
    return {
      email: u.email ?? '—',
      workspace: (w?.name as string) ?? '—',
      role: (m?.role as string) ?? '—',
      plan: w ? (w.stripe_subscription_id ? 'growth' : 'free') : '—',
      products: mine.length,
      live: mine.filter((p) => p.first_event_at).length,
      created_at: u.created_at,
      last_seen: u.last_sign_in_at ?? null,
    }
  })
}

const MEMBER_COLS: Col[] = [
  { key: 'email', label: 'Email', sort: true },
  { key: 'workspace', label: 'Workspace', sort: true },
  { key: 'role', label: 'Role', sort: true },
  { key: 'plan', label: 'Plan', sort: true },
  { key: 'products', label: 'Products', type: 'number', sort: true },
  { key: 'live', label: 'Sending events', type: 'number', sort: true },
  { key: 'created_at', label: 'Joined', type: 'date', sort: true },
  { key: 'last_seen', label: 'Last sign-in', type: 'date', sort: true },
]

async function summary(days: number) {
  const db = getSupabaseServiceClient()
  const since = new Date(Date.now() - days * 864e5).toISOString()
  const day = new Date(Date.now() - 864e5).toISOString()
  const [users, ws, pr, wl, ev, evAll] = await Promise.all([
    allUsers(),
    db.from('workspaces').select('id, stripe_subscription_id, checkout_started_at'),
    db.from('projects').select('id, first_event_at, deleted_at, created_at'),
    db.from('waitlist').select('id', { count: 'exact', head: true }),
    db.from('events').select('id', { count: 'exact', head: true }).gte('created_at', since),
    db.from('events').select('id', { count: 'exact', head: true }).gte('created_at', day),
  ])
  for (const r of [ws, pr, wl, ev, evAll]) if (r.error) throw r.error
  const projects = (pr.data ?? []).filter((p) => !p.deleted_at)
  const live = projects.filter((p) => p.first_event_at)
  const paying = (ws.data ?? []).filter((w) => w.stripe_subscription_id).length
  const checkout = (ws.data ?? []).filter((w) => w.checkout_started_at).length
  const newUsers = users.filter((u) => u.created_at >= since)
  const signedIn = users.filter((u) => (u.last_sign_in_at ?? '') >= since).length
  const daily = new Map<string, number>()
  for (const u of newUsers) daily.set(dayKey(u.created_at), (daily.get(dayKey(u.created_at)) ?? 0) + 1)
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
  return {
    tiles: [
      {
        label: 'Members',
        value: users.length,
        sub: `+${users.filter((u) => u.created_at >= day).length} today · +${newUsers.length} in range`,
      },
      { label: 'Signed in, in range', value: signedIn, sub: `of ${users.length} members` },
      { label: 'Products', value: projects.length, sub: `${live.length} sending events` },
      {
        label: 'Activation',
        value: pct(live.length, projects.length),
        sub: 'products that sent a first event',
      },
      { label: 'Paying workspaces', value: paying, sub: `${checkout} started a checkout` },
      { label: 'Events ingested', value: ev.count ?? 0, sub: `${evAll.count ?? 0} in 24 h` },
      { label: 'Waitlist', value: wl.count ?? 0, sub: 'emails waiting' },
    ],
    sections: [
      {
        title: 'Members',
        kind: 'kv',
        rows: [
          ['Total', users.length],
          ['New in range', newUsers.length],
          ['Signed in, in range', signedIn],
          ['Workspaces', (ws.data ?? []).length],
          ['Paying (Growth)', paying],
          ['Started a checkout', checkout],
        ],
      },
      {
        title: 'Products',
        kind: 'kv',
        rows: [
          ['Products', projects.length],
          ['New in range', projects.filter((p) => p.created_at >= since).length],
          ['Sending events', live.length],
          ['Went live in range', live.filter((p) => (p.first_event_at as string) >= since).length],
        ],
      },
    ],
    daily: [...daily.entries()].sort().map(([d, n]) => ({ d, n })),
    daily_label: 'New members per day',
  }
}

const ACTOR = new Map<string, string>()

async function log(url: URL) {
  const db = getSupabaseServiceClient()
  const size = int(url.searchParams.get('size'), 25, 5, 200)
  const pageNo = int(url.searchParams.get('page'), 1, 1, 100000)
  const q = (url.searchParams.get('q') ?? '').trim()
  let query = db.from('audit_log').select('action, actor_user_id, project_id, created_at', { count: 'exact' })
  if (q) query = query.ilike('action', `%${q.replace(/[%_\\]/g, '')}%`)
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((pageNo - 1) * size, pageNo * size - 1)
  if (error) throw error
  if (!ACTOR.size || (data ?? []).some((r) => r.actor_user_id && !ACTOR.has(r.actor_user_id as string))) {
    for (const u of await allUsers()) ACTOR.set(u.id, u.email ?? u.id)
  }
  const { data: pr } = await db.from('projects').select('id, slug')
  const slug = new Map((pr ?? []).map((p) => [p.id as string, p.slug as string]))
  return {
    total: count ?? 0,
    rows: (data ?? []).map((r) => ({
      at: r.created_at as string,
      name: r.action as string,
      who: r.actor_user_id ? (ACTOR.get(r.actor_user_id as string) ?? '—') : 'system',
      product: r.project_id ? (slug.get(r.project_id as string) ?? '—') : '—',
    })),
    columns: [
      { key: 'at', label: 'When', type: 'date' },
      { key: 'name', label: 'Action' },
      { key: 'who', label: 'Who' },
      { key: 'product', label: 'Product' },
    ],
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ what: string }> }) {
  if (!authorized(request)) return notFound()
  const { what } = await params
  const url = new URL(request.url)
  if (what === 'summary') return json(await summary(int(url.searchParams.get('days'), 30, 1, 400)))
  if (what === 'members') return json(page(await memberRows(), MEMBER_COLS, url))
  if (what === 'log') return json(await log(url))
  return notFound()
}
