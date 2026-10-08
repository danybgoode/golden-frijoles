import { notFound } from 'next/navigation'
import { Frame } from '@/design-system/Frame'
import { Button } from '@/design-system/primitives'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'
import { viewDeviceCode } from '@/lib/cli-device-codes'
import { defaultProjectSlug, normalizeUserCode } from '@/lib/cli-device-code-format'
import { getUserProjects } from '@/lib/membership'
import { confirmDeviceCode, denyDeviceCode } from './actions'

// account-from-the-terminal · Sprint 2, Story 2.2 — `/cli/connect?code=KQ7M-3RTX` (epic D8, the
// canvas SignIn frame). `frijoles login` opens this page; the person compares the code with their terminal
// and confirms. Signed out, it offers sign-in and comes back here with the code.
//
// Nothing on this page writes except the two Server Actions in `./actions.ts`, and both take the
// person from the session. Rendering the page — even signed in — decides nothing.
export const dynamic = 'force-dynamic'

const DONE_MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: 'Your agent is connected',
    body: 'Your terminal will say who you are and which product in a few seconds. You can close this page.',
  },
  not_member: {
    title: 'Nothing was signed in',
    body: 'That product is not one of yours. Run `frijoles login` again and pick one you belong to.',
  },
  denied: { title: 'Nothing was signed in', body: 'The code was declined. You can close this page.' },
  expired: {
    title: 'That code expired',
    body: 'Codes last ten minutes. Run `frijoles login` again for a new one.',
  },
  used: {
    title: 'That code was already used',
    body: 'Each code works once. Run `frijoles login` again if you need to.',
  },
  unknown: {
    title: 'That is not a code we issued',
    body: 'Check the code in your terminal, or run `frijoles login` again.',
  },
  error: {
    title: 'Something went wrong',
    body: 'Nothing was signed in. Try again, or run `frijoles login` again.',
  },
}

/** Whole minutes since `iso`, for "Requested N minutes ago". A request-time read, outside the render body. */
function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000))
}

export default async function CliConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[]; done?: string | string[] }>
}) {
  if (!(await isTerminalSignInEnabled())) notFound()

  const params = await searchParams
  const code = normalizeUserCode(typeof params.code === 'string' ? params.code : null)
  const done = typeof params.done === 'string' ? DONE_MESSAGES[params.done] : undefined

  if (done) {
    return (
      <Frame variant="door" brandHref="/">
        <h1>{done.title}</h1>
        <p className="ds-doorlede">{done.body}</p>
      </Frame>
    )
  }

  const view = code ? await viewDeviceCode(code) : null
  if (!code || !view) {
    return (
      <Frame variant="door" brandHref="/">
        <h1>Sign in from your terminal</h1>
        <p className="ds-doorlede">
          Run <span className="ds-mono">frijoles login</span> in your terminal. It opens this page with its code.
        </p>
      </Frame>
    )
  }
  if (view.state !== 'pending') {
    const message = DONE_MESSAGES[view.state]
    return (
      <Frame variant="door" brandHref="/">
        <h1>{message.title}</h1>
        <p className="ds-doorlede">{message.body}</p>
      </Frame>
    )
  }

  const here = `/cli/connect?code=${encodeURIComponent(code)}`
  const user = await getSessionUser()

  if (!user) {
    return (
      <Frame variant="door" brandHref="/">
        <h1>Sign in to connect your terminal</h1>
        <p className="ds-doorlede">
          Your terminal is showing <span className="ds-mono">{code}</span>. Sign in, then confirm it is the
          same code.
        </p>
        <div className="ds-doorform">
          <GoogleSignIn siteUrl={getSiteUrl()} next={here} />
          <a className="ds-btn ds-btn--secondary" href={`/login?next=${encodeURIComponent(here)}`}>
            Sign in with email and password
          </a>
        </div>
        <div className="ds-doornote">
          <b>Didn&apos;t start this from your terminal?</b> Close this page. Nothing happens.
        </div>
      </Frame>
    )
  }

  // ── Written against remote phishing (RFC 8628 §5.4; the security lens on PR #280) ─────────────
  // Anyone can start a `frijoles login` and send this link to someone signed in. Nothing in a device flow
  // can tell that apart from the real thing, so this page has to: the label is the requester's OWN
  // words (shown as such, never as a fact), the request's age is shown, what allowing grants is
  // stated in full, and "if someone sent you this link" is said before the button, not after.
  //
  // Since the 2026-10-05 amendment (canvas First run, frame 6) Allow binds the token to ONE product, picked
  // from the person's own memberships; the repo name the terminal sent only pre-selects one.
  const minutesAgo = minutesSince(view.createdAt)
  const projects = [...(await getUserProjects(user.id))].sort((a, b) => a.slug.localeCompare(b.slug))
  const preselected = defaultProjectSlug(projects, view.repoHint)
  return (
    <Frame variant="door" brandHref="/">
      <h1>Let your agent work on your product?</h1>
      <p className="ds-doorlede">
        Your coding agent and <span className="ds-mono">frijoles</span>, on the terminal that calls itself “
        {view.label}” (its own name, not something we checked), showing{' '}
        <span className="ds-mono">{code}</span>. Requested{' '}
        {minutesAgo === 0 ? 'less than a minute' : `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'}`} ago,
        as <b>{user.email ?? 'you'}</b>.
      </p>
      <form action={confirmDeviceCode} className="ds-doorform">
        <input type="hidden" name="code" value={code} />
        {projects.length > 0 ? (
          <div className="ds-field">
            <label className="ds-label" htmlFor="cli-connect-product">
              Product
            </label>
            <select
              id="cli-connect-product"
              name="product"
              className="ds-input"
              defaultValue={preselected ?? ''}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.slug}>
                  {project.slug}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="ds-hint">
            You have no product yet. Allow makes your first one, the way{' '}
            <span className="ds-mono">frijoles init</span> does.
          </p>
        )}
        <p className="ds-hint">
          It will be able to: plan, flag and measure for that product — read and change its feature flags,
          record A/B decisions and North Star readings, and, if you own it, make keys for your app&apos;s
          events. Only that product: not your others. Your code never comes here.
        </p>
        <Button type="submit" variant="primary">
          Allow
        </Button>
      </form>
      <form action={denyDeviceCode} className="ds-doorform">
        <input type="hidden" name="code" value={code} />
        <Button type="submit">Cancel</Button>
      </form>
      <div className="ds-doornote">
        <b>If someone sent you this link, choose Cancel.</b> Didn&apos;t start this from your terminal? Close
        this page. Nothing happens. Disconnect it any time in Setup › CLI access.
      </div>
    </Frame>
  )
}
