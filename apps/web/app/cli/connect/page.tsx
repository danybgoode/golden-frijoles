import { notFound } from 'next/navigation'
import { Frame } from '@/design-system/Frame'
import { Button } from '@/design-system/primitives'
import { GoogleSignIn } from '@/components/auth/GoogleSignIn'
import { getSessionUser } from '@/lib/supabase-auth'
import { getSiteUrl } from '@/lib/site-url'
import { isTerminalSignInEnabled } from '@/lib/terminal-sign-in-flag'
import { viewDeviceCode } from '@/lib/cli-device-codes'
import { normalizeUserCode } from '@/lib/cli-device-code-format'
import { confirmDeviceCode, denyDeviceCode } from './actions'

// account-from-the-terminal · Sprint 2, Story 2.2 — `/cli/connect?code=KQ7M-3RTX` (epic D8, the
// canvas SignIn frame). `gf login` opens this page; the person compares the code with their terminal
// and confirms. Signed out, it offers sign-in and comes back here with the code.
//
// Nothing on this page writes except the two Server Actions in `./actions.ts`, and both take the
// person from the session. Rendering the page — even signed in — decides nothing.
export const dynamic = 'force-dynamic'

const DONE_MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: 'You are signed in',
    body: 'Your terminal will say who you are in a few seconds. You can close this page.',
  },
  denied: { title: 'Nothing was signed in', body: 'The code was declined. You can close this page.' },
  expired: {
    title: 'That code expired',
    body: 'Codes last ten minutes. Run `gf login` again for a new one.',
  },
  used: {
    title: 'That code was already used',
    body: 'Each code works once. Run `gf login` again if you need to.',
  },
  unknown: {
    title: 'That is not a code we issued',
    body: 'Check the code in your terminal, or run `gf login` again.',
  },
  error: {
    title: 'Something went wrong',
    body: 'Nothing was signed in. Try again, or run `gf login` again.',
  },
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
          Run <span className="ds-mono">gf login</span> in your terminal. It opens this page with its code.
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

  return (
    <Frame variant="door" brandHref="/">
      <h1>Same code as your terminal?</h1>
      <p className="ds-doorlede">
        <span className="ds-mono">{code}</span> — requested by <b>{view.label}</b>. Confirming signs that
        terminal in as <b>{user.email ?? 'you'}</b>.
      </p>
      <div className="ds-doorform">
        <form action={confirmDeviceCode}>
          <input type="hidden" name="code" value={code} />
          <Button type="submit" variant="primary">
            Yes, sign my terminal in
          </Button>
        </form>
        <form action={denyDeviceCode}>
          <input type="hidden" name="code" value={code} />
          <Button type="submit">No, this isn&apos;t mine</Button>
        </form>
      </div>
      <div className="ds-doornote">
        <b>Didn&apos;t start this from your terminal?</b> Close this page. Nothing happens.
      </div>
    </Frame>
  )
}
