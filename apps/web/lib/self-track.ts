import 'server-only'
import { createGrowthEngineClient } from '@golden-frijoles/sdk'
import { getSiteUrl } from './site-url'
import { DEMO_PROJECT_SLUG } from './public-demo'

// Story 3.1 (commercial-shell/sprint-3.md) — the landing dogfoods the engine: Golden Frijoles is its
// OWN tenant (since one-product-project D1, the one public `golden-frijoles` project; never Miyagi's), and its
// visitor→waitlist funnel is measured by the engine itself, through the real customer-facing SDK
// (AGENTS.md rule #1 — no parallel telemetry pipeline, no direct events insert from app code).
//
// This helper is the one seam that fires those two funnel events. It is deliberately total: it
// NEVER throws into a request path and NEVER breaks the page/route if it can't send. CI's
// `typecheck-build` job runs `npm run build` with zero Supabase/tracking env vars, and the `e2e`
// job may not have this new project seeded — so an unset key or a failed call must degrade to a
// clean no-op, not a 500 on the landing or the waitlist route.

import {
  EVENT_FEATURE,
  LANDING_SIGNAL_KEY,
  VISITOR_SUBJECT_TYPE,
  SIGNUP_STARTED_EVENT as SIGNUP_STARTED_EVENT_NAME,
  ACCOUNT_CONFIRMED_EVENT as ACCOUNT_CONFIRMED_EVENT_NAME,
  type SelfTrackEvent,
} from './self-track-events'
import { flagEnvironmentFor } from './gates-decision'
import {
  EXPERIMENT_FLAGS,
  isVisitorId,
  type ExperimentFlagName,
  type VariantAnswer,
} from './variant-decision'

// Re-exported so every existing caller keeps importing the vocabulary from here — the split is an
// implementation detail of making the constants testable, not a new seam for callers to learn.
export {
  LANDING_VISITED_EVENT,
  WAITLIST_JOINED_EVENT,
  SIGNUP_STARTED_EVENT,
  ACCOUNT_CONFIRMED_EVENT,
  FIRST_EVENT_INGESTED_EVENT,
  REPORT_VIEWED_EVENT,
  SHARE_VIEWED_EVENT,
  METHODOLOGY_VISITED_EVENT,
  METHODOLOGY_CHAPTER_OPENED_EVENT,
  OWED_VIEWED_EVENT,
  FUNNEL_TREND_VIEWED_EVENT,
  WORKSPACE_PROVED_BET_EVENT,
  START_PROMPT_COPIED_EVENT,
  LANDING_WORKSPACE_PROVED_BET_EVENT,
  LANDING_SIGNAL_KEY,
  VISITOR_SUBJECT_TYPE,
  WAITLIST_SIGNAL_KEY,
  ACTIVATION_SIGNAL_KEY,
  HUB_ENGAGEMENT_SIGNAL_KEY,
  METHODOLOGY_SIGNAL_KEY,
  type SelfTrackEvent,
} from './self-track-events'

// The self tenant's slug. one-product-project D1 (2026-10-08): Golden Frijoles is ONE project, the public
// `golden-frijoles` (DEMO_PROJECT_SLUG), so self-tracking lands there by default. It used to be a separate
// `golden-beans` project, kept apart from the demo; the demo IS us now, built in the open. The tenant is
// still chosen entirely by SELF_PROJECT_API_KEY, resolved server-side from the Authorization header
// (lib/auth.ts), so events physically cannot land against any project but that key's.
export const SELF_PROJECT_SLUG = process.env.SELF_PROJECT_SLUG?.trim() || DEMO_PROJECT_SLUG

// The per-visitor identity cookie. A visit (Server Components can't set cookies, so the visited
// beacon is a Route Handler — see app/api/v1/public/self-visit/route.ts) mints/returns this id;
// the waitlist route reads the SAME cookie on the client's later join, so one visitor's visit and
// conversion count as the same user progressing through the funnel (TARS counts DISTINCT users per
// event — lib/tars.ts), not two disconnected anonymous events.
// landing-launch-experiment D2: named once, in lib/marketing-paths.ts, which the middleware also reads.
export { VISITOR_COOKIE } from './marketing-paths'

function selfApiKey(): string | undefined {
  return process.env.SELF_PROJECT_API_KEY?.trim() || undefined
}

/** Whether self-tracking is wired (a key is present). Callers use this only to decide whether to
 *  bother minting a visitor id — never to gate correctness; trackSelfEvent no-ops safely anyway. */
export function isSelfTrackingConfigured(): boolean {
  return !!selfApiKey()
}

// A cross-review catch (commercial-shell Sprint 3 PR): the SDK's own fetch has no timeout, so a
// slow/hung self-call could otherwise hold this promise open indefinitely. Callers already run
// this via `after()` (never inline-awaited before a response), but a bounded timeout here is
// cheap, load-bearing defense-in-depth against a genuinely hung request.
const TRACK_TIMEOUT_MS = 3000

function timeoutFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, signal: AbortSignal.timeout(TRACK_TIMEOUT_MS) })
}

/**
 * satisfied-ask S1.4 — a member's answer to the console's satisfaction ask, through the REAL SDK's rating call (rule #1:
 * the same `satisfaction_rated` a customer sends, never a direct insert). Same contract as trackSelfEvent: no key is a
 * no-op, never throws, returns whether it landed; callers run it in `after()`.
 */
export async function trackSelfSatisfaction(
  userId: string,
  flagKey: string,
  answer: number | 'dismissed'
): Promise<boolean> {
  const apiKey = selfApiKey()
  if (!apiKey) return false
  try {
    const engine = createGrowthEngineClient({
      baseUrl: getSiteUrl(),
      apiKey,
      userId,
      fetchImpl: timeoutFetch,
    })
    const result =
      answer === 'dismissed'
        ? await engine.dismissSatisfaction(flagKey)
        : await engine.rateSatisfaction(flagKey, answer)
    if (!result.ok) console.warn(`[self-track] satisfaction for ${userId} did not land: ${result.error}`)
    return result.ok
  } catch (err) {
    console.warn('[self-track] satisfaction threw unexpectedly:', err)
    return false
  }
}

// Fire one funnel event for `userId` through the REAL SDK (POST /api/v1/track, Bearer=self key).
// Total by construction: no key -> no-op; the SDK returns {ok:false} on any HTTP/network error (it
// never throws) and we swallow+log; the surrounding try/catch is belt-and-suspenders for anything
// unexpected (including an AbortSignal.timeout() abort). Returns nothing meaningful — callers must
// not branch on success in the request path.
//
// Callers must invoke this via `next/server`'s `after()`, never inline-`await`ed before building a
// response — a cross-review catch: the SDK call is a real network round-trip (this app calling its
// own public URL), and awaiting it directly in a route handler would delay that route's response
// (and, for self-visit specifically, delay delivering the Set-Cookie the waitlist route depends on
// for a shared visitor identity) by however long the call takes, timeout included.
// Returns whether the event actually LANDED. Callers that use the send as a one-shot state
// transition (the ingest route stamping projects.first_event_at) must branch on this: committing
// the "already sent" marker on a send that silently failed loses that funnel stage permanently,
// because no later event ever retries it (cross-review, Codex 2026-07-20).
export async function trackSelfEvent(
  event: SelfTrackEvent,
  userId: string,
  /**
   * Optional non-identifying detail, e.g. which chapter was opened (Story 4.1).
   *
   * Deliberately `tags` and not `metadata`: tags are the dimension the query layer can group by,
   * which is the whole reason to carry the chapter at all. Callers must pass only values that are
   * already public route segments — the story's rule is "an id and a route segment", never PII and
   * never the chapter's CONTENT, and nothing here would stop a caller ignoring that, so the check
   * lives at the call site where the value is chosen.
   */
  tags?: Record<string, string>,
  /**
   * landing-launch-experiment D4 — the visitor-keyed copies. `featureId` overrides the event's `EVENT_FEATURE` row (a
   * `signup_started` under the visitor belongs to `landing_conversion`, not `activation`, so the activation funnel never
   * sees it); `subject` is the event's subject, which the governed A/B analysis joins on. Absent: exactly as before.
   */
  options?: { featureId?: string; subject?: { type: string; id: string } }
): Promise<boolean> {
  const apiKey = selfApiKey()
  if (!apiKey) return false // unset in CI/local-without-config — dogfooding is a prod-config concern

  try {
    const engine = createGrowthEngineClient({
      baseUrl: getSiteUrl(),
      apiKey,
      userId,
      fetchImpl: timeoutFetch,
    })
    // featureId is REQUIRED for this event to appear in any funnel — see EVENT_FEATURE above.
    const result = await engine.track(event, {
      featureId: options?.featureId ?? EVENT_FEATURE[event],
      ...(tags ? { tags } : {}),
      ...(options?.subject ? { context: { version: 1, subject: options.subject } } : {}),
    })
    if (!result.ok) {
      console.warn(`[self-track] ${event} for ${userId} did not land: ${result.error}`)
      return false
    }
    return true
  } catch (err) {
    // Should be unreachable (the SDK catches its own network errors), but the request path must
    // survive even a programming/config error here — log, never rethrow.
    console.warn(`[self-track] ${event} threw unexpectedly:`, err)
    return false
  }
}

/**
 * landing-launch-experiment D4 — send `event` under the VISITOR, into the landing funnel, with the visitor as its subject.
 * A no-op without a usable visitor id: a missing cookie means this person never visited the landing in this browser,
 * and inventing an id would join them to nothing while counting them as a new visitor.
 */
export function trackVisitorEvent(event: SelfTrackEvent, visitorId: unknown): Promise<boolean> {
  if (!isVisitorId(visitorId)) return Promise.resolve(false)
  return trackSelfEvent(event, visitorId, undefined, {
    featureId: LANDING_SIGNAL_KEY,
    subject: { type: VISITOR_SUBJECT_TYPE, id: visitorId },
  })
}

/**
 * landing-launch-experiment D3 — ONE exposure, through the SDK's bound-experiment path (`trackFlagEvaluation` with
 * `experiment` → `experiment_exposed`, feature = the experiment key). Only for a visitor a running experiment's rule
 * assigned (`answer.experiment`); the SDK's idempotency key (subject, flag, version, variant, …) makes a reload the same
 * event, so this is one per visitor per version. Same contract as trackSelfEvent: never throws, no key is a no-op.
 */
export async function trackSelfExposure(
  name: ExperimentFlagName,
  visitorId: string,
  answer: VariantAnswer
): Promise<boolean> {
  const apiKey = selfApiKey()
  if (!apiKey || !answer.experiment || answer.variant === null) return false
  if (answer.flagVersion === null || answer.snapshotVersion === null) return false
  try {
    const engine = createGrowthEngineClient({
      baseUrl: getSiteUrl(),
      apiKey,
      userId: visitorId,
      fetchImpl: timeoutFetch,
    })
    const result = await engine.trackFlagEvaluation({
      flagKey: EXPERIMENT_FLAGS[name].key,
      flagVersion: answer.flagVersion,
      variant: answer.variant,
      reason: answer.reason,
      snapshotVersion: answer.snapshotVersion,
      environment: flagEnvironmentFor(process.env.VERCEL_ENV),
      subject: { type: VISITOR_SUBJECT_TYPE, id: visitorId },
      experiment: answer.experiment,
    })
    if (!result.ok) console.warn(`[self-track] exposure for ${visitorId} did not land: ${result.error}`)
    return result.ok
  } catch (err) {
    console.warn('[self-track] exposure threw unexpectedly:', err)
    return false
  }
}

/**
 * landing-launch-experiment D4 — a signup that came through the landing CREATED its account: the two guardrail events,
 * under the visitor. `signup_started` is sent here as well as from the signup route because a Google sign-up never
 * reaches that route; every read counts distinct ids, so the second copy for a password signup changes nothing.
 */
export async function trackVisitorSignupCreated(visitorId: unknown): Promise<void> {
  await trackVisitorEvent(SIGNUP_STARTED_EVENT_NAME, visitorId)
  await trackVisitorEvent(ACCOUNT_CONFIRMED_EVENT_NAME, visitorId)
}
