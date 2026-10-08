import { requireProjectMembership } from '@/lib/dashboard-auth'
import { isConnectorEnabled, isConnectorWritesEnabled } from '@/lib/flags'
import { listCliTokens } from '@/lib/cli-tokens'
import { DEMO_PROJECT_SLUG } from '@/lib/public-demo'
import { installPrompt, PLUGIN_INSTALL, PLUGIN_MARKETPLACE_ADD, SKILLS_ADD } from '@/lib/install-prompt'
import { STARTER_FEATURE_KEY, STARTER_TARGET_EVENT } from '@/lib/provisioning'
import { CopyPromptCard } from '@/components/landing/CopyPromptCard'
import { getSiteUrl } from '@/lib/site-url'
import { CopyField } from '@/design-system/copy-field'
import { CodingAgents } from './coding-agents'
import { isOwner } from '@/lib/roles'
import { getConnectorStatus } from '@/lib/connector-tokens'
import { formatUtc } from '@/lib/format-utc'
import { Callout, Field, ListCard, PageHead, Pill } from '@/design-system/primitives'
import { ProductShell } from '@/components/product/ProductShell'
import { ConnectorManager, ConnectorSteps } from './connector-manager'

// Setup › Connect — your own project's connector URL, inside the product.
//
// ── The defect this fixed ─────────────────────────────────────────────────────────────────────
// The signed-in shell's `Connect` link pointed at `/install`, a public marketing page that serves
// the DEMO project's connector token (correctly — AGENTS rule #2 requires public routes to serve
// only the demo project). So an operator who followed it got a working URL for somebody else's
// data. `/install` is untouched; what changed is where the product's own link goes.
//
// ── design-system-rails · Sprint 4, Story 4.4 — the page teaches, then hands over the control ──
// Reference state `setup-connect`: the connector URL in a mono field WITH Copy, a status pill, and a
// numbered three-step card ending in `Add to Claude ↗`. The credential half already shipped and
// shipped well — the status, the multi-token warning, and the server-side filtering below — and
// **all of it is kept** (sprint contract #9). What this story adds is the half that makes setup a
// task rather than a credential screen.
//
// ── The console gate is GONE — mockups-as-built Story 3.3 ─────────────────────────────────────
// This page opened with `if (!isConsoleShellEnabled()) notFound()`, so that while the console was
// dark it 404'd for everyone before auth rather than leaking its existence through a login
// redirect. `CONSOLE_SHELL_ENABLED` is deleted from the repository and from every Vercel
// environment; the console is the console. Nothing about AUTHORIZATION changed — the flag never was
// one, and `requireProjectMembership` below is untouched.
export const dynamic = 'force-dynamic'

export default async function SetupConnectPage({ params }: { params: Promise<{ projectSlug: string }> }) {
  const { projectSlug } = await params
  // MEMBER gate. Reading your own project's connector URL is how its operators point an agent at
  // their data — that is not credential administration. MINTING one is, and the action re-checks
  // ownership server-side; `canManage` below only decides whether the control renders.
  const membership = await requireProjectMembership(projectSlug)

  // AGENTS rule #3: the connector is gated by TWO independent switches. With the env flag off we do
  // not even look for a token — there is nothing to offer, and a disabled-looking control would
  // imply the surface exists and is merely unavailable to you.
  const connectorEnabled = await isConnectorEnabled()
  // ⚠️ Read the status EVEN WHEN the connector is switched off, so an existing token stays visible
  // and revocable. `actions.ts` says in words that revoke is deliberately ungated — "if
  // CONNECTOR_ENABLED were flipped off mid-incident, an owner must still be able to permanently kill
  // the credential rather than wait for the flag to come back". The action honoured that; the only
  // UI reaching it did not, because this line skipped the read entirely.
  const status = await getConnectorStatus(membership.projectId)
  const canManage = isOwner({ projectId: membership.projectId, role: membership.role })
  // account-from-the-terminal S3.2 — the viewer's OWN signed-in machines (CLI tokens are per account,
  // not per project, so every member sees their own and nobody else's). Active ones only.
  // `listCliTokens` throws on a failed read by design ("could not check" is not "none"). Caught HERE so a
  // CLI-token outage cannot 500 the page that revokes connector URLs (fresh reviewer, PR #282).
  const codingAgents = await listCliTokens(membership.userId).then(activeCliTokens, () => null)
  // D11: whether a URL made by a person may write here at all. Never on the public demo project.
  const writesOn = (await isConnectorWritesEnabled()) && projectSlug !== DEMO_PROJECT_SLUG
  const firstUse = status.state === 'active' ? status.tokens[0].lastUsedAt : null
  // D5: the Codex command carries the newest URL — owner-only, like the URL itself.
  const codexUrl = canManage && status.state === 'active' ? status.tokens[0].url : null

  return (
    <ProductShell projectSlug={projectSlug} section="setup" railActive={'setup/connect'}>
      <main>
        {/* connect-page D4 — titled Connect (the section is Set up), in six groups ordered by the path of
            least resistance: the prompt, do it yourself, the Claude app, Codex, the SDK, your machines. */}
        <PageHead
          title="Connect"
          lede={
            <>
              Pick one way in. The first is the easiest: your agent reads what it installs, tells you, and
              waits for your go-ahead. Everything here works on <strong>{projectSlug}</strong> only.
            </>
          }
        />

        <ListCard plain>
          <h2 className="ds-label">1 · Set up with your agent</h2>
          <p className="ds-hint">
            Paste this into Claude Code, Codex, Cursor or any agent. It plans and builds in your repo, and
            asks before it installs anything.
          </p>
          <CopyPromptCard label="Paste this into your agent" prompt={installPrompt(getSiteUrl())} />

          <h2 className="ds-label">2 · Or do it yourself</h2>
          <Field
            label="Claude Code"
            hint="Two commands, then run the setup skill from the golden-frijoles plugin."
          >
            <CopyField value={PLUGIN_MARKETPLACE_ADD} label="Copy the marketplace command" />
            <CopyField value={PLUGIN_INSTALL} label="Copy the install command" />
          </Field>
          <Field label="Codex, Cursor and other agents" hint="Pick your agent when it asks.">
            <CopyField value={SKILLS_ADD} label="Copy the npx skills command" />
          </Field>
        </ListCard>

        <ListCard plain>
          <h2 className="ds-label">3 · Connect the Claude app</h2>
          {!connectorEnabled && (
            <Callout tone="warn">
              The MCP connector is switched off for this deployment (<code>CONNECTOR_ENABLED</code>). Nothing
              can connect through a URL until it is enabled in a new deployment
              {status.state === 'active' ? ', but an existing URL can still be revoked below.' : '.'}
            </Callout>
          )}
          {status.state === 'active' && status.tokens.length > 1 && canManage && (
            <Callout tone="warn">
              <b>More than one connector URL is active.</b> Each one below can reach this project until it is
              revoked. Revoke the ones you are not using.
            </Callout>
          )}
          {/* The plaintext URL is OWNER-only and filtered on the server: props crossing into a client
              component are serialized into the HTML, so a conditional render would not hide it. */}
          <ConnectorManager
            slug={projectSlug}
            tokens={canManage && status.state === 'active' ? status.tokens : []}
            hasConnector={status.state === 'active'}
            canManage={canManage}
            canMint={status.state === 'absent' && connectorEnabled}
            viewerUserId={membership.userId}
            writesOn={writesOn}
          />
          {/* `last_used_at` is stamped on use (account-from-the-terminal D12), so "used" is recorded,
              never guessed: "Not added yet" until the first request, then green with the time. */}
          <Field
            label="Status"
            hint={
              status.state === 'active' && !firstUse
                ? 'This turns green the first time Claude uses the URL.'
                : undefined
            }
          >
            {status.state === 'unreadable' && (
              <p role="alert">
                <Pill state="off">Could not check</Pill>{' '}
                <span className="ds-hint">
                  This project&apos;s connector state could not be read. Reload in a moment. Nothing has been
                  changed, and no URL is being offered until we can check.
                </span>
              </p>
            )}
            {status.state === 'active' && (
              <p role="status">
                {firstUse ? (
                  <Pill state="on">Connected · last used {formatUtc(firstUse)}</Pill>
                ) : (
                  <Pill state="never">Not added yet</Pill>
                )}{' '}
                <span className="ds-hint">
                  URL created {formatUtc(status.tokens[0].createdAt)}
                  {status.tokens.length > 1 ? ' (most recent)' : ''}.
                </span>
              </p>
            )}
            {status.state === 'absent' && (
              <p role="status">
                <Pill state="never">Not connected yet</Pill>{' '}
                <span className="ds-hint">
                  {canManage
                    ? 'Create a URL above, then add it to Claude.'
                    : 'An owner of this project can create one.'}
                </span>
              </p>
            )}
          </Field>
          <ConnectorSteps canManage={canManage} hasConnector={status.state === 'active'} />

          <h2 className="ds-label">4 · Connect Codex</h2>
          {/* connect-page D5. The command carries the URL, so it is owner-only for the same reason the URL is. */}
          {canManage && codexUrl ? (
            <Field
              label="One command"
              hint="Run it once in a terminal with Codex installed; “codex mcp list” then shows golden-frijoles. It uses the same URL as the Claude app, so Get a new URL above stops both."
            >
              <CopyField
                value={`codex mcp add golden-frijoles --url ${codexUrl}`}
                label="Copy the Codex command"
              />
            </Field>
          ) : (
            <p className="ds-hint">
              {canManage
                ? 'Create a connector URL above; the command to add it to Codex appears here.'
                : 'An owner of this project can connect Codex — the command carries the project’s URL, so only owners see it.'}
            </p>
          )}

          <h2 className="ds-label">5 · Send your product&apos;s events</h2>
          {/* connect-page S2.3. The key's real sources: `frijoles keys create --type ingest` or Setup › Keys —
              NOT `frijoles init`, which writes a flag-read key only. */}
          <p className="ds-hint">
            Your product reports what its users do; your agent reads it back as funnels and your North Star.
            Add the SDK where your app runs, with an <b>ingest key</b> in <code>GROWTH_ENGINE_API_KEY</code> —
            an owner gets one with <code>frijoles keys create --type ingest --label &quot;my app&quot;</code> or
            under <a href={`/app/setup/keys/${projectSlug}`}>Setup › Keys</a>. It is shown once; keep it in
            your environment, never in code.
          </p>
          <pre className="ds-mono ds-codeblock">
            {`npm install @golden-frijoles/sdk

import { createGrowthEngineClient } from '@golden-frijoles/sdk'

const engine = createGrowthEngineClient({
  baseUrl: '${getSiteUrl()}',
  apiKey: process.env.GROWTH_ENGINE_API_KEY,
  userId: currentUser.id,
})

await engine.track('${STARTER_TARGET_EVENT}', { featureId: '${STARTER_FEATURE_KEY}' })`}
          </pre>
          {/* Hedged (fresh reviewer, #284): the starter feature is registered best-effort at signup, and
              projects made another way never had one. An unregistered feature's funnel is a 404
              (`tars-query.ts` → feature_not_found → notFound()); `/api/v1/track` accepts the event either
              way, so a ZERO means the event never arrived, not that the feature is missing. */}
          <p className="ds-hint">
            Run it once, then look for it on{' '}
            <a href={`/app/funnel/${projectSlug}/${STARTER_FEATURE_KEY}`}>the {STARTER_FEATURE_KEY} funnel</a>
            . New accounts get that starter feature at signup. If the link says Not found, the feature was not
            registered — track an event of a feature you have registered instead. If it reads zero after the
            event fired, the event did not arrive: check the key and the base URL.
          </p>

          <h2 className="ds-label">6 · Your signed-in machines</h2>
          <CodingAgents slug={projectSlug} tokens={codingAgents} />
        </ListCard>

        {/* The approved `setup-connect` structure is head → card → card → note (D6): your agent (1–2), then
            connections (3–6), then this closing note. Six groups, two cards — Daniel's order, the same contract. */}
        <p className="ds-hint">
          Not sure where to start? Use the first prompt — your agent reads what it installs and asks before it
          does.
        </p>
      </main>
    </ProductShell>
  )
}

/** Live CLI tokens only (S3.2). Outside the component: reading the clock is not a render concern. */
function activeCliTokens<T extends { revokedAt: string | null; expiresAt: string | null }>(tokens: T[]): T[] {
  const now = Date.now()
  return tokens.filter(
    (token) => token.revokedAt === null && (token.expiresAt === null || Date.parse(token.expiresAt) > now)
  )
}
