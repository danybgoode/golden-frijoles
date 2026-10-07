import 'server-only'
import { getFlagRegistryView } from './flag-registry'
import { toCliFlagView, type CliFlagEnvironmentView } from './cli-flag-view'

// one-epic-page · Story 2.3 (lock D12) — the epic's flag, read from THIS project's registry only, by key, read-only.
//
// The project id is the one `getHubRoadmap` resolved after the page's access gate (D2) — never another project's,
// never re-derived from the URL — so a key that exists only in a sibling project is "not found", exactly like a typo.
// The per-environment state comes from `toCliFlagView`, the console's and the CLI's own projection: "on" means a
// version is SERVED, and `serving` says what it resolves to — the two are not the same, and this page does not guess.

export type EpicFlag =
  | { kind: 'none'; note: string | null }
  | { kind: 'found'; key: string; environments: CliFlagEnvironmentView[] }
  | { kind: 'not_found'; key: string }
  /** The registry could not be read. Said as such — a broken read must never read as "not found" (CODE-QUALITY #8). */
  | { kind: 'unreadable'; key: string }

export async function readEpicFlag(
  projectId: string,
  flagKey: string | null,
  flagNote: string | null
): Promise<EpicFlag> {
  if (!flagKey) return { kind: 'none', note: flagNote }
  try {
    const { flags } = await getFlagRegistryView(projectId)
    const flag = flags.find((candidate) => candidate.key === flagKey)
    if (!flag) return { kind: 'not_found', key: flagKey }
    return { kind: 'found', key: flagKey, environments: toCliFlagView(flag).environments }
  } catch (error) {
    // The message only, not the object: the registry's own errors are generic, and a log line has no use for a stack
    // trace that could carry anything else (security lens, #297).
    console.error(
      '[epic-flag] registry read failed:',
      error instanceof Error ? error.message : 'unknown error'
    )
    return { kind: 'unreadable', key: flagKey }
  }
}
