// scenarios-light-up D2 — the engine's half of the `owner_token_v1` check, kept free of `server-only` and the database
// so the whole exchange (engine → the SDK handler → engine) is unit-tested with an injected sender.
import type { GuardedHttpOwnershipProofResult, GuardedHttpPost } from './guarded-http'
import {
  SCENARIO_TARGET_REQUEST_HEADER,
  createScenarioOwnerTokenProof,
  createScenarioOwnerTokenSignature,
  createScenarioTargetChallenge,
  scenarioTargetProofMatches,
} from './scenario-target-proof'

export const SCENARIO_OWNERSHIP_PATH = '/api/internal/resilience/ownership'

export type OwnerTargetCheck =
  | { ok: true }
  | { ok: false; reason: 'unreachable' | 'not_answered' | 'wrong_answer'; detail: string }

export async function checkOwnerTargetAnswer(
  send: (input: GuardedHttpPost) => Promise<GuardedHttpOwnershipProofResult>,
  target: { targetKey: string; origin: string; tokenHash: string }
): Promise<OwnerTargetCheck> {
  const challenge = createScenarioTargetChallenge()
  const signed = { tokenHash: target.tokenHash, challenge, targetKey: target.targetKey, origin: target.origin }
  const response = await send({
    targetUrl: `${target.origin}${SCENARIO_OWNERSHIP_PATH}`,
    headers: {
      'Content-Type': 'application/json',
      [SCENARIO_TARGET_REQUEST_HEADER]: createScenarioOwnerTokenSignature(signed),
    },
    body: JSON.stringify({ contractVersion: 2, challenge, targetKey: target.targetKey, origin: target.origin }),
    timeoutMs: 5_000,
  })
  if (response.outcome !== 'response') {
    // One wording for every failure to connect: the classification (DNS, a private address, a timeout) would tell an
    // owner how a hostname resolves inside our network (verifier, #348).
    return { ok: false, reason: 'unreachable', detail: `${target.origin} could not be reached. Is the app deployed there?` }
  }
  if (response.status !== 204) {
    return {
      ok: false,
      reason: 'not_answered',
      detail:
        `${target.origin}${SCENARIO_OWNERSHIP_PATH} answered ${response.status}. Serve createScenarioOwnershipHandler ` +
        `there with this target's token (@golden-frijoles/sdk), deploy, then verify again.`,
    }
  }
  if (!scenarioTargetProofMatches(createScenarioOwnerTokenProof(signed), response.proof)) {
    return {
      ok: false,
      reason: 'wrong_answer',
      detail: `${target.origin} answered, but not with this target's token. Check the token the app is given.`,
    }
  }
  return { ok: true }
}
