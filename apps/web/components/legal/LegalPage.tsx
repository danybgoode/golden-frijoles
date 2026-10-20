import type { LegalDoc } from '@/lib/legal'
import { Frame, FrameLink } from '@/design-system/Frame'

// landing-launch-experiment · Sprint 4 — the Terms and the Privacy notice share one page shape: the public frame, the
// title, the date, and the sections from lib/legal.ts. Each links to the other, since a reader of one usually wants both.
export function LegalPage({ doc, other }: { doc: LegalDoc; other: { href: string; label: string } }) {
  return (
    <Frame
      variant="public"
      brandHref="/"
      actions={
        <>
          <FrameLink href={other.href}>{other.label}</FrameLink>
          <FrameLink href="/login">Sign in</FrameLink>
        </>
      }
    >
      <article className="ds-legal">
        <h1>{doc.title}</h1>
        <p className="ds-lede">{doc.lede}</p>
        <p className="ds-legal-updated">{`Last updated ${doc.updated}`}</p>
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </Frame>
  )
}
