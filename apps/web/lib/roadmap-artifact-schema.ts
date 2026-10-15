import { z } from 'zod'

// pod-report · Sprint 1, Story 1.1 — the roadmap-push contract.
//
// The payload is the output of `node scripts/roadmap-extract.mjs --live` (board-sinks-and-scrumban D15), the epic's
// stated contract ("that JSON is the contract, version field validated on ingest"). The extract
// emits a BARE ARRAY of rows with no envelope and no version of its own, so this module defines the
// envelope the rail actually ships: a schema version, provenance, and the rows.
//
// ── Why a version the SENDER supplies rather than one we infer ────────────────────────────────
// Clients push this with their own API key from their own tooling on their own release cadence
// (the "clients push their extract" shape the epic locks in — the engine never reads anyone's git).
// So the payload's shape will drift out from under us, and an artifact stored today must still be
// interpretable in a year. An explicit, validated `schemaVersion` turns that drift into a clean 400
// at the boundary instead of a renderer crashing on a field that quietly changed meaning.
//
// No FRAMEWORK or server-only imports, on purpose (Roadmap/LEARNINGS.md — a unit-tested pure helper
// cannot share a file with a `server-only` / `next/*` import, because a plain test runner throws an
// opaque, unrelated-looking error the moment it loads the file at all). `zod` is a portable library
// and loads fine under `node --test`, which is why `roadmap-artifact-schema.test.ts` can assert this
// contract directly with no server, no Supabase and no Playwright. The Supabase read lives next
// door in `report-artifacts.ts`, which DOES import `server-only` — that split is the point.

/**
 * The only payload version this build accepts.
 *
 * Bump ONLY together with a migration of the renderer, and keep the previous version readable —
 * artifacts are immutable and old ones must keep rendering. A pushed artifact records the version
 * it was written under, so a future build can branch on it rather than guess.
 */
export const ROADMAP_SCHEMA_VERSION = 1

/** Grains the extract emits. Anything else is a generator we do not understand — reject, don't guess. */
export const ROADMAP_GRAINS = ['Epic', 'Sprint', 'Seed'] as const

/**
 * The six stages (board-sinks-and-scrumban D1), in board order.
 *
 * ⚠️ A COPY of `STAGES` in `scripts/lib/stage.mjs`, which is where a stage is decided. App code does not import
 * `scripts/` at runtime (lock D19 — the `ROADMAP_SCHEMA_VERSION` precedent), so `hub-board.test.ts` asserts the two
 * lists are identical: renaming a stage in one place turns that spec red instead of emptying a column.
 */
export const ROADMAP_STAGES = ['To groom', 'Grooming', 'Ready to build', 'Building', 'QA', 'Shipped'] as const
export type RoadmapStage = (typeof ROADMAP_STAGES)[number]

// A URL the hub renders as a link. Only https — a pushed `javascript:` URL would otherwise be one click from running
// in the viewer's session on our origin. Validated at ingest, never trusted at render (the slug's stance).
const httpsUrl = z
  .string()
  .max(500)
  .url()
  .refine((u) => u.startsWith('https://'), 'must be an https URL')

// A repo-relative doc path (`Roadmap/…/README.md`). The hub joins it onto the pushed repo base, so it must not be
// able to climb out of the repo or carry a scheme of its own.
const docPath = z
  .string()
  .max(300)
  .regex(/^[A-Za-z0-9_][A-Za-z0-9_./-]*\.md$/, 'must be a repo-relative .md path')
  .refine((p) => !p.split('/').includes('..'), 'must not climb out of the repo')

/** result-record D6 — the three verdicts, in the contract's order. ⚠️ A copy, pinned like `ROADMAP_STAGES`. */
export const ROADMAP_VERDICTS = ['proven', 'disproven', 'unclear'] as const
export type RoadmapVerdict = (typeof ROADMAP_VERDICTS)[number]

// A calendar day, `YYYY-MM-DD` — the result record's dates. A REAL day (codex review, #290): `2026-02-30` has the shape,
// and would otherwise be stored, rendered as "30 Feb" and fall due. Same rule as the contract's `isDay`.
const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be a day written YYYY-MM-DD')
  .refine((d) => isRealDay(d), 'must be a real calendar day')

/** Whether `YYYY-MM-DD` names a day that exists, in UTC. */
export function isRealDay(d: string): boolean {
  const t = new Date(`${d}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d
}

// Rows are validated structurally but NOT exhaustively: `.passthrough()` keeps unknown fields.
// That is deliberate. The extract gains columns as the roadmap tooling grows, and a strict schema
// would reject a NEWER, RICHER payload from a client who upgraded before we did — turning an
// additive change into an outage. We pin the fields the hub actually renders and let the rest ride.
/** many-products D14 — a destination id is lowercase-kebab. ⚠️ A copy of `HORIZON_ID_RE` / `HORIZON_MAX` in `scripts/lib/horizon.mjs`; `horizon-destinations.test.ts` pins both. */
export const HORIZON_ID_PATTERN = /^[a-z][a-z0-9-]*$/
export const HORIZON_MAX = 50
const destinationId = z
  .string()
  .regex(HORIZON_ID_PATTERN, 'a destination id is lowercase-kebab (a-z, 0-9, -)')
  .max(100)

/**
 * owed-on-screen D4 — who can clear an owed check, and what it touches. ⚠️ COPIES of `KINDS` / `CATEGORIES` in
 * `scripts/owed-ledger.mjs`, where an item is classified; `roadmap-artifact-schema.test.ts` asserts each pair is
 * identical, so a kind added there is a red spec here instead of a 400 on every push.
 */
export const OWED_KINDS = [
  'publish',
  'credential',
  'ops',
  'judgment',
  'signed-in',
  'interactive',
  'unsorted',
] as const
export type OwedKind = (typeof OWED_KINDS)[number]
export const OWED_CATEGORIES = ['money-path', 'auth-path', 'admin-only', 'other'] as const
/** The push's bounds: in total, and per epic (the epic page and the board draw every line). */
export const OWED_MAX = 1000
export const OWED_MAX_PER_EPIC = 100

const owedItemSchema = z.object({
  // An epic slug the push carries as an Epic row (checked on the push below), or null: a spec, or a doc outside any epic.
  epic: z
    .string()
    .max(200)
    .regex(/^[a-z0-9][a-z0-9-]*$/i, 'owed epic must be an epic slug')
    .nullable(),
  text: z.string().min(1).max(500),
  kind: z.enum(OWED_KINDS, {
    errorMap: () => ({ message: `owed kind must be one of ${OWED_KINDS.join(' | ')}` }),
  }),
  category: z.enum(OWED_CATEGORIES, {
    errorMap: () => ({ message: `owed category must be one of ${OWED_CATEGORIES.join(' | ')}` }),
  }),
  // Where the check was written, repo-relative (a doc or a spec). Rendered as `file:line` and joined onto the pushed repo
  // base, so the same stance as `docPath`: no scheme, no climbing out of the repo.
  file: z
    .string()
    .max(300)
    .regex(/^[A-Za-z0-9_][A-Za-z0-9_./-]*$/, 'owed file must be a repo-relative path')
    .refine((p) => !p.split('/').includes('..'), 'owed file must not climb out of the repo'),
  line: z.number().int().positive().max(1_000_000),
})
export type OwedItem = z.infer<typeof owedItemSchema>

const roadmapRowSchema = z
  .object({
    name: z.string().min(1).max(500),
    slug: z
      .string()
      .min(1)
      .max(200)
      // Slugs address a doc and end up in a URL path segment on the drill-down view. Constrain them
      // at the boundary so a hostile or malformed slug can never become a traversal or an injection
      // further down — the same "validate at ingest, not at render" stance as lib/tenant-slug.ts.
      .regex(/^[a-z0-9][a-z0-9-]*(--s[0-9]+)?$/i, 'slug must be url-safe'),
    grain: z.enum(ROADMAP_GRAINS),
    status: z.string().min(1).max(100),
    area: z.string().min(1).max(200),
    // Everything below is genuinely optional in the real extract — a Seed has no sprint_progress,
    // an Epic has no epic_slug. `.nullish()` accepts null AND absent; the extract emits null.
    status_derived: z.string().max(100).nullish(),
    status_date: z.string().max(40).nullish(),
    priority: z.string().max(40).nullish(),
    type: z.string().max(100).nullish(),
    risk: z.string().max(40).nullish(),
    sprint_progress: z.string().max(100).nullish(),
    // Current roadmap-to-notion extracts emit the numeric frontmatter value. Older client extracts
    // sent the display form as a string, and schema v1 artifacts remain valid, so accept both.
    build_order: z.union([z.string().max(40), z.number().int()]).nullish(),
    build_order_num: z.number().int().nullish(),
    doc_link: z.string().max(500).nullish(),
    epic_slug: z.string().max(200).nullish(),
    // ── board-sinks-and-scrumban (D21) — every field optional, so a v1 payload from before the board still parses
    // and no ROADMAP_SCHEMA_VERSION bump is needed. Validated where the hub renders them (a link, a column).
    stage: z.enum(ROADMAP_STAGES).nullish(),
    stage_source: z.string().max(300).nullish(),
    goal: z.string().max(2000).nullish(),
    sprints: z
      .array(
        z.object({
          n: z.number().int().nonnegative(),
          title: z.string().max(300).nullish(),
          done: z.number().int().nonnegative(),
          total: z.number().int().nonnegative(),
        })
      )
      .max(50)
      .nullish(),
    links: z
      .object({
        readme: docPath.nullish(),
        seed: docPath.nullish(),
        sprints: z.array(docPath).max(50).nullish(),
        retro: docPath.nullish(),
      })
      .nullish(),
    pr: z
      .object({
        number: z.number().int().positive(),
        url: httpsUrl,
        state: z.string().max(20),
        draft: z.boolean(),
      })
      .nullish(),
    kickoff: z.string().max(20000).nullish(),
    shipped_at: z.string().max(40).nullish(),
    appetite: z.string().max(10).nullish(),
    underwritten_by: z.string().max(200).nullish(),
    // finops · Story 3.2 (D6) — an epic's quote (refined) and actual (stamped at close), in ≈ API $. Nullish, so an
    // older pusher that never sends them stays valid: absent is "not quoted / not measured", never zero. Declared
    // rather than left to `.passthrough()` so a malformed value is refused instead of stored and rendered.
    quote_low_usd: z.number().nonnegative().max(1e7).nullish(),
    quote_high_usd: z.number().nonnegative().max(1e7).nullish(),
    quote_basis: z.string().max(300).nullish(),
    actual_usd: z.number().nonnegative().max(1e7).nullish(),
    actual_mtok: z.number().nonnegative().max(1e9).nullish(),
    actual_basis: z.string().max(300).nullish(),
    // result-record · Story 1.3 (D6) — what the epic should move, and the verdict on it. Nullish for the same reason as
    // FinOps: an older pusher that never sends them stays valid, and absent is "no target", never a zero. Declared so a
    // bad value — a typo'd verdict above all — is a 400 naming the field, not a row the board renders. The verdict
    // words are `VERDICTS` in `scripts/lib/roadmap-contract.mjs`; `roadmap-result.test.ts` pins this copy to it.
    hypothesis: z.string().max(1000).nullish(),
    target_metric: z.string().max(200).nullish(),
    target_from: z.number().finite().nullish(),
    target_to: z.number().finite().nullish(),
    read_date: isoDay.nullish(),
    read_date_derived: z.boolean().nullish(),
    // The message names the field: flattened issues drop the path, and "Invalid enum value" alone leaves a pusher
    // guessing which of a row's forty fields was wrong.
    verdict: z
      .enum(ROADMAP_VERDICTS, {
        errorMap: () => ({ message: `verdict must be one of ${ROADMAP_VERDICTS.join(' | ')}` }),
      })
      .nullish(),
    verdict_actual: z.number().finite().nullish(),
    verdict_evidence: z.string().max(500).nullish(),
    verdict_at: isoDay.nullish(),
    read_late: z.boolean().nullish(),
    // one-epic-page · Story 2.3 (D11) — the epic's flag, decided at refining, and the README's own line on it. Nullish:
    // an older pusher never sends them, and absent is "no flag". The key is held to the SDK's grammar here too, so a
    // malformed key is a 400 naming the field rather than a lookup the epic page makes against the registry.
    flag_key: z
      .string()
      .regex(/^[a-z][a-z0-9_.-]{0,127}$/, {
        message: 'flag_key must be a flag key (a-z first, then a-z 0-9 _ . -)',
      })
      // The STRING "null" fits the grammar but means "no flag" in the frontmatter — the extract already sends it as null
      // (`flagFields`); a hand-written push saying it is refused rather than drawn as "Flag null not found" (codex, #297).
      .refine((key) => key !== 'null', { message: 'flag_key: write null, not the string "null"' })
      .nullish(),
    flag_note: z.string().max(300).nullish(),
    // grounded-bets D9 — the founder's grounding at Stage 1.5. Nullish so an older pusher stays valid; absent is "never
    // asked" (a Bug, a Chore, or an epic refined before it), never "no".
    grounded: z.boolean({ invalid_type_error: 'grounded must be true, false or null' }).nullish(),
    grounded_reason: z.string().max(300).nullish(),
    // one-bet-wired D1 — the bet's measurement, nullish so an older pusher stays valid.
    target_segment: z
      .enum(['everyone'], { errorMap: () => ({ message: 'target_segment must be everyone (or null)' }) })
      .nullish(),
    adopted_event: z
      .string()
      .regex(/^[A-Za-z0-9_.:$-]{1,200}$/, 'adopted_event must be an event name')
      .nullish(),
    retained_event: z
      .string()
      .regex(/^[A-Za-z0-9_.:$-]{1,200}$/, 'retained_event must be an event name')
      .nullish(),
    retention_days: z
      .number({ invalid_type_error: 'retention_days must be a number' })
      .int()
      .min(1)
      .max(90)
      .nullish(),
    satisfied_event: z
      .string()
      .regex(/^[A-Za-z0-9_.:$-]{1,200}$/, 'satisfied_event must be an event name')
      .nullish(),
    // many-products D14 — the destinations this epic lights, by id into the push's `horizon`. Nullish so an older
    // pusher stays valid; whether each id is DECLARED is checked on the push (the row cannot see its siblings).
    destinations: z.array(destinationId).max(HORIZON_MAX).nullish(),
  })
  .passthrough()
  // The contract's own rule (validateGrounded), held here too so a hand-written push cannot store a reason the board
  // would silently drop (codex, #334).
  .refine((row) => row.grounded_reason == null || row.grounded === false, {
    message: 'grounded_reason is only for grounded: false',
  })

export const roadmapPushSchema = z
  .object({
    // Rejected with a clear message when it does not match — see the refinement below.
    schemaVersion: z.number().int().positive(),
    // ISO 8601. Coerced to a Date so an unparseable string fails here rather than as a Postgres error.
    generatedAt: z.coerce.date(),
    source: z
      .object({
        // Matches the migration's CHECK so a bad SHA is a 400 at the edge, not a 500 from the database.
        commit: z
          .string()
          .regex(/^[0-9a-f]{7,40}$/i, 'commit must be a 7-40 char hex sha')
          .nullish(),
        ref: z.string().min(1).max(200).nullish(),
      })
      .nullish(),
    // The migration also rejects an empty array; asserting it here makes the failure a 400 with a
    // readable message instead of a constraint violation the caller cannot act on.
    items: z.array(roadmapRowSchema).min(1).max(5000),
    // board-sinks-and-scrumban D6/D21 — optional, additive. Before this field existed an extra `board` key passed this
    // (non-strict) object and was silently STRIPPED (lock C6); now it is declared, and the route stores it.
    board: z
      .object({
        wip: z
          .object({
            Building: z.number().int().positive().max(99).nullish(),
            QA: z.number().int().positive().max(99).nullish(),
          })
          .nullish(),
        // The base a card's repo-relative doc links resolve against: `https://github.com/<o>/<r>/blob/<branch>/`.
        repo: httpsUrl.nullish(),
      })
      .nullish(),
    // many-products D14 — the product's own destinations, optional and additive: a push without it still parses and the
    // horizon page shows its empty state. Display order is the array's order.
    horizon: z
      .array(
        z.object({
          id: destinationId,
          title: z.string().min(1).max(200),
          description: z.string().min(1).max(500),
        })
      )
      .max(HORIZON_MAX)
      .nullish(),
    // owed-on-screen D4 — the project's open owed checks, one top-level block. Nullish: an older pusher never sends it,
    // and absent means "keeps no ledger", while [] means "nothing owed". Member-only on every read (lib/owed.ts).
    owed: z
      .array(owedItemSchema)
      .max(OWED_MAX, { message: `owed carries at most ${OWED_MAX} checks` })
      .nullish(),
  })
  // An epic may only light a destination the push declares — the extractor refuses it too; this is the same rule held
  // for a hand-written push. The message names the epic, because a flattened issue drops its path.
  .superRefine((push, ctx) => {
    const ids = new Set((push.horizon ?? []).map((d) => d.id))
    if (ids.size !== (push.horizon ?? []).length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'horizon declares the same destination id twice' })
    for (const item of push.items) {
      for (const id of item.destinations ?? []) {
        if (!ids.has(id))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `epic "${item.slug}" names destination "${id}" that the push's horizon does not declare`,
          })
      }
    }
    // owed-on-screen D4 — an owed check names an epic this push carries, and no epic carries more than the page draws.
    const epics = new Set(push.items.filter((i) => i.grain === 'Epic').map((i) => i.slug))
    const perEpic = new Map<string, number>()
    for (const o of push.owed ?? []) {
      if (o.epic === null) continue
      if (!epics.has(o.epic))
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `owed names epic "${o.epic}" that the push does not carry`,
        })
      perEpic.set(o.epic, (perEpic.get(o.epic) ?? 0) + 1)
    }
    for (const [epic, n] of perEpic)
      if (n > OWED_MAX_PER_EPIC)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `owed carries ${n} checks for epic "${epic}" (at most ${OWED_MAX_PER_EPIC})`,
        })
  })

export type RoadmapPush = z.infer<typeof roadmapPushSchema>
export type RoadmapRow = z.infer<typeof roadmapRowSchema>

/**
 * Parse a push payload, enforcing the accepted schema version.
 *
 * Version is checked SEPARATELY from shape so the caller can tell the two apart: a wrong version is
 * "your generator is newer/older than this engine" (actionable — upgrade one side), while a shape
 * failure is "your payload is malformed" (actionable — fix the generator). Collapsing both into one
 * 400 would leave a client guessing which.
 */
export function parseRoadmapPush(
  input: unknown
): { ok: true; value: RoadmapPush } | { ok: false; error: string; issues?: unknown } {
  const parsed = roadmapPushSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Malformed roadmap payload', issues: parsed.error.flatten() }
  }
  if (parsed.data.schemaVersion !== ROADMAP_SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        `Unsupported schemaVersion ${parsed.data.schemaVersion} — this engine accepts ` +
        `${ROADMAP_SCHEMA_VERSION}. Regenerate with a matching generator.`,
    }
  }
  return { ok: true, value: parsed.data }
}

/**
 * JSON with every object's keys sorted, recursively — so two payloads compare by content, not by key order.
 *
 * Needed because Postgres `jsonb` does not keep the order a client sent: reading a stored payload back and
 * `JSON.stringify`-ing it gives different bytes for the same data.
 */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Whether a push would store exactly what the latest artifact already holds (board-sinks-and-scrumban D16).
 *
 * The board re-pushes on every branch and PR event, ~60 a day at this repo's pace, and most of those leave every
 * card where it was. Each artifact is immutable and kept, so an identical push is growth with no information.
 * `generatedAt` and `source` live outside `payload`, so they never make two identical boards look different.
 */
export function isSameRoadmapPayload(stored: unknown, next: unknown): boolean {
  return canonicalJson(stored) === canonicalJson(next)
}

/**
 * Whether a raw extract `status` string means "shipped" — the ONE place this is decided (poster
 * rule: ✅ only for shipped work, never claimed for anything else). Status strings come from the
 * generator, not from us, so compare case-insensitively and treat anything unrecognised as
 * not-shipped: over-claiming ✅ is the one failure the poster rule explicitly forbids;
 * under-claiming is merely untidy.
 *
 * Exported (not just a local of `summarizeRoadmap` below) so the epic drill-down view (Story 1.2)
 * can apply the exact same rule to SPRINT rows' ✅ ticks instead of re-deriving "is it shipped"
 * with its own string comparison — "shipped" has to mean one thing everywhere a ✅ can appear, at
 * every grain, not just at the epic grain `summarizeRoadmap` itself needs.
 */
export function isRoadmapStatusShipped(status: string | null | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'shipped'
}

/**
 * The hub's derived view of an artifact: counts and the epic→sprint tree, computed once.
 *
 * Lives here rather than in the page so it is unit-testable without rendering, and so the drill-down
 * (1.2) and the horizon (1.3) read the SAME derivation instead of each re-deriving "what is shipped"
 * slightly differently — the poster rule (✅ means shipped) has to mean one thing everywhere.
 */
export function summarizeRoadmap(items: RoadmapRow[]) {
  const epics = items.filter((i) => i.grain === 'Epic')
  const sprints = items.filter((i) => i.grain === 'Sprint')
  const seeds = items.filter((i) => i.grain === 'Seed')
  const isShipped = isRoadmapStatusShipped

  return {
    counts: {
      epics: epics.length,
      sprints: sprints.length,
      seeds: seeds.length,
      shippedEpics: epics.filter((e) => isShipped(e.status)).length,
    },
    epics: [...epics]
      // build_order_num is the road's running order; a missing one sorts last rather than first, so
      // an unrefined row never jumps the queue on the journey view.
      .sort(
        (a, b) =>
          (a.build_order_num ?? Number.MAX_SAFE_INTEGER) - (b.build_order_num ?? Number.MAX_SAFE_INTEGER)
      )
      .map((epic) => ({
        ...epic,
        shipped: isShipped(epic.status),
        sprints: sprints.filter((s) => s.epic_slug === epic.slug),
      })),
    seeds,
  }
}
