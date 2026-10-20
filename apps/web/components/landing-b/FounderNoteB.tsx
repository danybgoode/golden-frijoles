import Link from 'next/link'

// landing-launch-experiment · S3.3 — B's founder note: the kraft letter, text verbatim from prototype v3.
export function FounderNoteB() {
  return (
    <section className="lb-band" id="note">
      <div className="lb-wrap">
        <div className="lb-letter">
          <p className="lb-kicker">Why we built it</p>
          <p>I built Golden Frijoles because I needed it.</p>
          <p>
            Agents made the building fast. That makes the loop around it matter more than ever: planning,
            shipping and reviewing. That loop needs people who aren’t the engineers.
          </p>
          <p>
            Once an agent starts on something bigger than a tweak, someone has to know where it stands. What’s
            solved, what isn’t, which decisions are waiting and on whom, how much is left. And they need it in
            a form that someone whose domain knowledge is other than code can work with.
          </p>
          <p>
            That’s what this is. If you’d rather I set it up with your team,{' '}
            <Link href="/talk">that’s a conversation</Link>.
          </p>
          <p>
            <Link href="/methodology">Read the methodology →</Link>
          </p>
          <p className="lb-sig">Daniel Vásquez · founder</p>
        </div>
      </div>
    </section>
  )
}
