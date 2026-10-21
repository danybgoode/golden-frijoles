import 'server-only'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cliError, cliOk, readCliBody, requireCliMember, requireCliOwner } from '@/lib/cli-auth'
import { isExperimentBuilderWritable, isExperimentGovernanceEnabled } from '@/lib/flags'
import { getSupabaseServiceClient } from '@/lib/supabase'
import { createBuilderIo } from '@/lib/experiment-builder-io'
import {
  BUILDER_PAUSED,
  deleteExperimentCommand,
  pauseExperimentCommand,
  resumeExperimentCommand,
  saveExperimentDraftCommand,
  startExperimentCommand,
  type BuilderDependencies,
} from '@/lib/experiment-builder-command'
import { rolloutExperimentCommand } from '@/lib/experiment-rollout-command'
import {
  listExperimentSummaries,
  latestExperimentVersion,
  readExperiment,
  recordDecisionCommand,
  stopExperimentCommand,
  type ExperimentOwner,
} from '@/lib/experiment-owner-commands'
import type { Readout } from '@/lib/experiment-readout'
import { sentenceText } from '@/lib/experiment-builder-plan'

// landing-launch-experiment · Sprint 6, Story 6.4 — `frijoles experiments`: an agent launches, reads and decides an A/B
// test in minutes, through the SAME commands the console uses (the builder's save/start, the shared stop/decide in
// lib/experiment-owner-commands.ts, the roll-out command), so every rule — S6.1's "traffic never blocks Start", S6.2's
// end dates, S6.3's "roll out or keep at any time" — holds for agents exactly as for people.
//
// Reads (`ls`, `show`) are member-gated; writes are OWNER-gated (`requireCliOwner`, the same question the console's
// `requireProjectOwnership` asks), and the database functions underneath re-check ownership themselves. The project is
// resolved from the credential's memberships, never trusted from the body.

export const runtime = 'nodejs'

const KEY = /^[a-z][a-z0-9_-]{0,63}$/

function readoutBody(readout: Readout | null) {
  if (!readout) return null
  return {
    state: readout.state,
    answer: sentenceText(readout.answer),
    control: readout.control,
    treatment: readout.treatment,
    chance: readout.chance,
    lift: readout.lift,
    verdict: readout.verdict,
    progress: readout.progress,
  }
}

export async function GET(req: NextRequest) {
  if (!(await isExperimentGovernanceEnabled()))
    return cliError('disabled', 'Experiments are not switched on here.')
  const url = new URL(req.url)
  const context = await requireCliMember(req, url.searchParams.get('project'))
  if (context instanceof NextResponse) return context
  const key = url.searchParams.get('experiment')?.trim()
  if (!key)
    return cliOk({
      project: context.projectSlug,
      experiments: await listExperimentSummaries(context.projectId),
    })
  if (!KEY.test(key)) return cliError('invalid', 'Name the experiment by its key.')
  const read = await readExperiment(
    context.projectId,
    context.projectSlug,
    key,
    createBuilderIo(getSupabaseServiceClient())
  )
  if (!read.ok)
    return read.reason === 'not_found'
      ? cliError('not_found', `No experiment "${key}" in ${context.projectSlug}.`)
      : cliError('server_error', 'Could not read this experiment right now.')
  return cliOk({
    project: context.projectSlug,
    key: read.key,
    version: read.version,
    status: read.status,
    readout: readoutBody(read.readout),
  })
}

/** A command's refusal, as the CLI's exit code family: no such experiment is not_found (exit 3), a paused builder is
 *  disabled, anything else a conflict with the current state. */
function codeFor(error: string): 'not_found' | 'disabled' | 'conflict' {
  if (error.startsWith('No experiment') || error.startsWith('Only a running experiment')) return 'not_found'
  if (error === BUILDER_PAUSED) return 'disabled'
  return 'conflict'
}

const OUTCOMES = {
  ship: 'ship_treatment',
  keep: 'keep_control',
  inconclusive: 'inconclusive',
  iterate: 'iterate',
  invalid: 'invalid',
} as const

export async function POST(req: NextRequest) {
  if (!(await isExperimentGovernanceEnabled()))
    return cliError('disabled', 'Experiments are not switched on here.')
  const body = await readCliBody(req)
  if (body instanceof NextResponse) return body
  const context = await requireCliOwner(req, typeof body.project === 'string' ? body.project : null)
  if (context instanceof NextResponse) return context
  const owner: ExperimentOwner = {
    projectId: context.projectId,
    userId: context.userId,
    slug: context.projectSlug,
  }
  // The builder's commands resolve ownership through a callback; here it is already resolved from the CLI credential,
  // and a slug other than the one resolved is refused (it can only be a bug).
  const deps: BuilderDependencies = {
    builderEnabled: isExperimentBuilderWritable,
    servingEnabled: async () => true,
    requireOwnership: async (slug) => {
      if (slug !== owner.slug) throw new Error('project mismatch')
      return { projectId: owner.projectId, userId: owner.userId }
    },
    io: createBuilderIo(getSupabaseServiceClient()),
  }
  const experiment = typeof body.experiment === 'string' ? body.experiment.trim() : ''

  switch (body.command) {
    case 'create': {
      const continuing = experiment || null
      if (continuing && !KEY.test(continuing)) return cliError('invalid', 'Name the experiment by its key.')
      const saved = await saveExperimentDraftCommand(owner.slug, body.answers, continuing, deps)
      if (!saved.ok)
        return cliError('invalid', saved.error, saved.checks ? { checks: saved.checks } : undefined)
      const read = await readExperiment(owner.projectId, owner.slug, saved.experimentKey, deps.io)
      return cliOk({ project: owner.slug, ...saved, status: read.ok ? read.status : 'draft' })
    }
    case 'start': {
      if (!KEY.test(experiment)) return cliError('invalid', 'Name the experiment by its key.')
      const started = await startExperimentCommand(owner.slug, experiment, deps)
      if (!started.ok)
        return cliError('conflict', started.error, started.checks ? { checks: started.checks } : undefined)
      return cliOk({ project: owner.slug, ...started })
    }
    case 'stop': {
      if (!KEY.test(experiment)) return cliError('invalid', 'Name the experiment by its key.')
      const stopped = await stopExperimentCommand(owner, experiment)
      if (!stopped.ok) return cliError('conflict', stopped.error)
      return cliOk({
        project: owner.slug,
        experimentKey: experiment,
        version: stopped.version,
        status: 'stopped',
      })
    }
    // S6.6 — pause takes the split off (the test keeps running and its people); resume serves it again; delete takes it
    // off Production and retires every live version. Each is the console's own command.
    case 'pause':
    case 'resume':
    case 'delete': {
      if (!KEY.test(experiment)) return cliError('invalid', 'Name the experiment by its key.')
      if (body.command === 'pause') {
        const paused = await pauseExperimentCommand(owner.slug, experiment, deps)
        if (!paused.ok) return cliError(codeFor(paused.error), paused.error)
        return cliOk({ project: owner.slug, ...paused, status: 'paused' })
      }
      if (body.command === 'resume') {
        const resumed = await resumeExperimentCommand(owner.slug, experiment, deps)
        if (!resumed.ok) return cliError(codeFor(resumed.error), resumed.error)
        // Not serving after a resume is the partial state, not "paused" (verifier, #425).
        return cliOk({ project: owner.slug, ...resumed, status: resumed.serving ? 'running' : 'not_serving' })
      }
      const deleted = await deleteExperimentCommand(owner.slug, experiment, deps)
      if (!deleted.ok) return cliError(codeFor(deleted.error), deleted.error)
      return cliOk({ project: owner.slug, ...deleted, status: 'deleted' })
    }
    case 'decide': {
      if (!KEY.test(experiment)) return cliError('invalid', 'Name the experiment by its key.')
      const choice = typeof body.outcome === 'string' ? body.outcome : ''
      if (!Object.hasOwn(OUTCOMES, choice))
        return cliError('invalid', 'The outcome is ship, keep, inconclusive, iterate or invalid.')
      const outcome = OUTCOMES[choice as keyof typeof OUTCOMES]
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (!reason) return cliError('invalid', 'Say why, with --reason.')
      // Deciding a live test stops it first, exactly as the console's decide flow does (S6.3: any time, any volume).
      const latest = await latestExperimentVersion(owner.projectId, experiment)
      if (!latest) return cliError('not_found', `No experiment "${experiment}" in ${owner.slug}.`)
      // A named version is checked BEFORE a live test is stopped, so a typo never stops it (verifier, #424).
      const named = typeof body.variant === 'string' && body.variant ? body.variant : null
      // Shipping the control is "keep" (the contract refuses it as a ship) — said before anything is stopped.
      if (named !== null && choice === 'ship' && named === latest.definition.controlVariantKey)
        return cliError('invalid', `"${named}" is the current version; to keep it, use --keep.`)
      if (named !== null && !latest.definition.variants.some((v) => v.key === named))
        return cliError(
          'invalid',
          `${experiment} has no version "${named}" (it has ${latest.definition.variants.map((v) => v.key).join(', ')}).`
        )
      let stoppedNow = false
      if (latest.status === 'running') {
        const stopped = await stopExperimentCommand(owner, experiment)
        if (!stopped.ok) return cliError('conflict', stopped.error)
        stoppedNow = true
      }
      // After a stop, a failure must say the test IS stopped — as the console's decide flow does.
      const afterStop = (message: string) =>
        stoppedNow ? `It is stopped, but the decision was not recorded: ${message}` : message
      const read = await readExperiment(owner.projectId, owner.slug, experiment, deps.io)
      if (!read.ok || !read.readout)
        return cliError('conflict', afterStop(`${experiment} has nothing to decide yet.`))
      const definitionControl = read.readout.control.key
      const variant =
        outcome === 'ship_treatment'
          ? (named ?? read.readout.treatment.key)
          : outcome === 'keep_control'
            ? definitionControl
            : null
      const recorded = await recordDecisionCommand(owner, experiment, read.version, {
        recordKind: 'decision',
        supersedesRecordId: null,
        outcome,
        chosenVariantKey: variant,
        rationale: reason,
        idempotencyKey: crypto.randomUUID(),
      })
      if (!recorded.ok) return cliError('conflict', afterStop(recorded.error))
      let rollout: { ok: boolean; error?: string } | null = null
      if (body.rollout === true && variant !== null) {
        const result = await rolloutExperimentCommand(owner.slug, experiment, read.version, variant, deps)
        rollout = result.ok ? { ok: true } : { ok: false, error: result.error }
      }
      return cliOk({
        project: owner.slug,
        experimentKey: experiment,
        version: read.version,
        outcome,
        chosenVariantKey: variant,
        rollout,
      })
    }
    default:
      return cliError('invalid', 'The command is create, start, pause, resume, stop, decide or delete.')
  }
}
