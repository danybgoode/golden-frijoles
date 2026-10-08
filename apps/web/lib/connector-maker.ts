// account-from-the-terminal · Sprint 3, Story 3.1 — when a connector URL acts AS the person who made
// it (epic D11). Pure: the route gathers the facts, this decides, and every branch is a unit test.
//
// ALL of these must hold, and each is its own kill switch:
//   • the URL names a maker (`connector_tokens.created_by`; every URL minted before this sprint is NULL),
//   • the URL is not the DEMO project's — `/install` shows that URL to the public (AGENTS rule #2), so it
//     must never write as anybody, whoever happened to rotate it,
//   • `connector.writes_enabled` is on (the CLI write seam it also needed is always on since one-product-project D2),
//   • the maker is STILL an owner of the URL's project — re-resolved per request, so removing them
//     from the project (or demoting them) turns their URL read-only at once.
//
// Any failure is silent at the route: the write tools are simply absent from tools/list, exactly as
// for a missing Bearer key.

export type MakerFacts = {
  createdBy: string | null
  projectSlug: string
  demoProjectSlug: string
  connectorWritesEnabled: boolean
  cliWritesEnabled: boolean
}

/** Whether to even look the maker up. Cheap checks first, so the membership read is skipped when moot. */
export function makerMayWrite(facts: MakerFacts): facts is MakerFacts & { createdBy: string } {
  return (
    facts.createdBy !== null &&
    facts.projectSlug !== facts.demoProjectSlug &&
    facts.connectorWritesEnabled &&
    facts.cliWritesEnabled
  )
}

/** What the mint stamps: the signed-in owner, except on the public demo project. */
export function makerToStamp(
  projectSlug: string,
  demoProjectSlug: string,
  ownerUserId: string
): string | null {
  return projectSlug === demoProjectSlug ? null : ownerUserId
}
