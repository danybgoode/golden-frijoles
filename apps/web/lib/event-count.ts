// traffic-relaunch D7 — the pure half of `countEvents` (lib/event-catalog-query.ts): limits, shapes and the bucketing,
// import-free so the unit layer pins it.

export const EVENT_COUNT_MAX_DAYS = 90
export const EVENT_COUNT_ROW_CAP = 100_000

export type EventCountRow = { day: string; value?: string; count: number }
export type EventCount = {
  event: string
  days: number
  from: string
  to: string
  byTag: string | null
  total: number
  truncated: boolean
  rows: EventCountRow[]
}

/** Pure: rows of `{ created_at, tags }` → counts per day (and per tag value), days oldest first, values by count. */
export function bucketEventCounts(
  rows: ReadonlyArray<{ created_at: string; tags: unknown }>,
  byTag: string | null
): EventCountRow[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    let key = day
    if (byTag) {
      const tags =
        typeof row.tags === 'object' && row.tags !== null ? (row.tags as Record<string, unknown>) : {}
      const raw = tags[byTag]
      const value = typeof raw === 'string' && raw.length > 0 ? raw : '(none)'
      key = `${day}\u0000${value}`
    }
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [day, value] = key.split('\u0000')
      return byTag ? { day, value, count } : { day, count }
    })
    .sort(
      (a, b) =>
        a.day.localeCompare(b.day) || b.count - a.count || (a.value ?? '').localeCompare(b.value ?? '')
    )
}

/** A tag name `--by` may group on: the shape tags are written in, nothing else. */
export function isGroupableTag(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9_]{1,40}$/.test(value)
}
