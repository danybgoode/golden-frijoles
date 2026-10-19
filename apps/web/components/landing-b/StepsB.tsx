// landing-launch-experiment · Sprint 3 S3.2 (epic D18/D19) — B's six steps. Every window is the approved mockup's drawn
// branding shot, labelled "Illustration · sample data" (Daniel, 2026-10-19: branding shots, not screenshots — D19
// amended). The sample numbers belong to an invented shop, never to us, and every window says so (CODE-QUALITY #9).
import './steps.css'

function WinBar({ title }: { title: string }) {
  return (
    <div className="lb-win-bar">
      <span className="lb-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {title}
    </div>
  )
}

const Illus = () => <p className="lb-illus">Illustration · sample data</p>

function Txt({
  no,
  title,
  children,
  items,
}: {
  no: string
  title: string
  children: string
  items: string[]
}) {
  return (
    <div className="lb-txt">
      <span className="lb-stepno">{no}</span>
      <h3>{title}</h3>
      <p>{children}</p>
      <ul>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

type Tone = 'g' | 'w' | 'r' | 'p'
type SignalProps = { tone: Tone; mark: string; value: string; of: string; note: string }

// The cost window's two signals per row — spend vs quote, result vs target — each a symbol, a value, what it is read
// against, and the words. Kept apart on purpose: an epic can be over budget and on target, and one merged colour would
// hide which.
function Signal({ tone, mark, value, of, note }: SignalProps) {
  return (
    <>
      <span className={`lb-sig lb-sig-${tone}`}>{mark}</span>
      <span className="lb-m">{value}</span>
      <span className="lb-of">{of}</span>
      <span className={`lb-d lb-sig-${tone}`}>{note}</span>
    </>
  )
}

const COST_ROWS: Array<{
  epic: string
  spend: SignalProps
  result: SignalProps
  call: { label: string; tone: string }
}> = [
  {
    epic: 'One-step checkout',
    spend: { tone: 'w', mark: '▲', value: '$44', of: 'of $38', note: '16% over' },
    result: { tone: 'g', mark: '✓', value: '50%', of: 'of 50%', note: 'on target' },
    call: { label: 'Keep', tone: 'lb-chip--g' },
  },
  {
    epic: 'Seller onboarding',
    spend: { tone: 'g', mark: '▼', value: '$19', of: 'of $22', note: '14% under' },
    result: { tone: 'p', mark: '◷', value: '—', of: 'of 30 sellers', note: 'reads 2 Nov' },
    call: { label: 'Waiting', tone: '' },
  },
  {
    epic: 'Saved searches',
    spend: { tone: 'r', mark: '▲', value: '$31', of: 'of $15', note: '107% over' },
    result: { tone: 'r', mark: '✕', value: '3%', of: 'of 10%', note: 'below target' },
    call: { label: 'Kill', tone: 'lb-chip--r' },
  },
]

export function StepsB() {
  return (
    <section className="lb-band" id="loop">
      <div className="lb-wrap">
        <div className="lb-head">
          <p className="lb-kicker">The product</p>
          <h2>
            From why to <span className="lb-foil">paid off</span>
          </h2>
          <p>
            Every piece of work is a bet. These are the six things that happen to a bet, in order, and what
            Golden Frijoles gives you at each one.
          </p>
        </div>

        <div className="lb-steps">
          <article className="lb-step">
            <Txt
              no="01 · WHY"
              title="Keep the reason in front of everyone"
              items={[
                'Why, target and hypothesis written before any code',
                'What’s solved, what isn’t, what’s waiting on whom',
                'Works in Claude Code and on the web, for people who don’t code',
              ]}
            >
              Every epic carries its why, the target it should move, the hypothesis behind it and the date
              you’ll check. Agents build against it. Your team reads it without opening a pull request.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Epic · checkout-in-one-step" />
                <div className="lb-win-body">
                  <div className="lb-row">
                    <span className="lb-chip lb-chip--y">Building · sprint 2 of 3</span>
                    <span className="lb-chip">Read date 14 Nov</span>
                  </div>
                  <p className="lb-why">
                    Half of mobile buyers leave at the address step. One step should keep them.
                  </p>
                  <dl className="lb-kv">
                    <dt>Target</dt>
                    <dd>
                      Checkout completion <span className="lb-num">41% → 50%</span>
                    </dd>
                    <dt>Hypothesis</dt>
                    <dd>Fewer fields on mobile means fewer abandoned carts</dd>
                    <dt>Decision owed</dt>
                    <dd>
                      Keep guest checkout? · <b>Ana, Product</b>
                    </dd>
                  </dl>
                  <div>
                    <div className="lb-row lb-between">
                      <span className="lb-lbl">Stories done</span>
                      <span className="lb-num">7 / 11</span>
                    </div>
                    <div className="lb-prog">
                      <b style={{ width: '64%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <Illus />
            </div>
          </article>

          <article className="lb-step">
            <Txt
              no="02 · MEASURE"
              title="Track every feature you launch"
              items={[
                'Targeted, adopted, retained, for every feature',
                'A North Star metric and the inputs that drive it',
                'A verdict on the read date: keep, change or kill',
              ]}
            >
              Each launch gets a funnel: how many people it targeted, how many adopted it, how many came back.
              It also shows which North Star input it was meant to move, and whether that input moved.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Measure · one-step checkout" />
                <div className="lb-win-body">
                  <div className="lb-split">
                    <div className="lb-funnel" aria-label="Funnel">
                      <span className="lb-lbl">Funnel · last 30 days</span>
                      <div className="lb-fr">
                        <span>Targeted</span>
                        <span className="lb-track">
                          <b style={{ width: '100%' }} />
                        </span>
                        <span>4,820</span>
                      </div>
                      <div className="lb-fr">
                        <span>Adopted</span>
                        <span className="lb-track">
                          <b style={{ width: '52%' }} />
                        </span>
                        <span>2,506</span>
                      </div>
                      <div className="lb-fr">
                        <span>Retained</span>
                        <span className="lb-track">
                          <b style={{ width: '31%' }} />
                        </span>
                        <span>1,494</span>
                      </div>
                    </div>
                    <div className="lb-ns">
                      <span className="lb-lbl">North Star · weekly orders</span>
                      <div className="lb-ns-big">
                        <b>1,212</b>
                        <span className="lb-chip lb-chip--g">+9% vs target pace</span>
                      </div>
                      <svg
                        className="lb-spark"
                        viewBox="0 0 200 56"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          className="lb-spark-fill"
                          d="M0 44 L25 42 L50 40 L75 38 L100 33 L125 30 L150 24 L175 20 L200 14 L200 56 L0 56 Z"
                        />
                        <path
                          d="M0 44 L25 42 L50 40 L75 38 L100 33 L125 30 L150 24 L175 20 L200 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle cx="198" cy="14" r="3" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                  <div className="lb-inputs">
                    <div className="lb-inp">
                      <span>Checkout rate</span>
                      <b>47%</b>
                      <i>▲ 6 pts</i>
                    </div>
                    <div className="lb-inp">
                      <span>Repeat buyers</span>
                      <b>22%</b>
                      <i>▲ 1 pt</i>
                    </div>
                    <div className="lb-inp">
                      <span>New sellers</span>
                      <b>38</b>
                      <i>▲ 4</i>
                    </div>
                  </div>
                </div>
              </div>
              <Illus />
            </div>
          </article>

          <article className="lb-step">
            <Txt
              no="03 · COST"
              title="Know what your agents cost, and what they earned"
              items={[
                'Agent spend quoted per epic, then measured',
                'Expected payout next to the actual result',
                'An outcome report you can send to whoever pays',
              ]}
            >
              Each epic is quoted before it starts and read against what the agents actually spent. Set that
              next to the payout you expected and decide what to fund next on numbers, not on momentum.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Outcome report · October" />
                <div className="lb-win-body">
                  <div className="lb-tableclip">
                    <table className="lb-cost">
                      <thead>
                        <tr>
                          <th>Epic</th>
                          <th>Spend vs quote</th>
                          <th>Result vs target</th>
                          <th>Call</th>
                        </tr>
                      </thead>
                      <tbody>
                        {COST_ROWS.map((row) => (
                          <tr key={row.epic}>
                            <td>{row.epic}</td>
                            <td>
                              <Signal {...row.spend} />
                            </td>
                            <td>
                              <Signal {...row.result} />
                            </td>
                            <td>
                              <span className={`lb-chip ${row.call.tone}`}>{row.call.label}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="lb-legend">
                    <span>
                      <span className="lb-sig-g">✓ ▼</span> on target or under budget
                    </span>
                    <span>
                      <span className="lb-sig-w">▲</span> over budget
                    </span>
                    <span>
                      <span className="lb-sig-r">✕ ▲</span> missed, or far over
                    </span>
                  </p>
                  <div className="lb-row lb-between">
                    <span className="lb-lbl">Spent this month</span>
                    <span className="lb-num">$94 of $120 funded</span>
                  </div>
                  <div className="lb-prog">
                    <b style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
              <Illus />
            </div>
          </article>

          <article className="lb-step">
            <Txt
              no="04 · REHEARSE"
              title="Simulate the day before it happens"
              items={[
                'Launch, event and campaign scenarios',
                'Agent-planned outages: providers down, traffic floods, servers pulled',
                'Hard limits, a stop button, and a record of what broke and what held',
              ]}
            >
              Get ready for a launch, an event or a campaign by living through its worst hour first. Start a
              mutiny: your agent plans an attack on your own product. It takes down the payment provider,
              floods the site with ten times the traffic and pulls a server out from under it, all inside
              limits you set. You find out what breaks while it’s still cheap.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Mutiny · launch-day drill" />
                <div className="lb-win-body">
                  <div className="lb-row">
                    <span className="lb-chip lb-chip--r">2 failures found</span>
                    <span className="lb-chip">Limit: staging + 5% of live traffic, 15 min</span>
                  </div>
                  <div className="lb-timeline">
                    <div className="lb-ev lb-ev--bad">
                      <time>00:00</time>Agent cut off the payment provider at peak checkout
                    </div>
                    <div className="lb-ev lb-ev--ok">
                      <time>01:10</time>Checkout switched to “pay on delivery” and kept taking orders
                    </div>
                    <div className="lb-ev lb-ev--bad">
                      <time>04:30</time>Traffic flooded to 10× and a database server was pulled
                    </div>
                    <div className="lb-ev lb-ev--bad">
                      <time>05:00</time>Search went blank for 6 minutes. 1,180 shoppers saw “no results”
                    </div>
                    <div className="lb-ev lb-ev--bad">
                      <time>07:20</time>Stock counts froze. 37 items sold that weren’t in the warehouse
                    </div>
                    <div className="lb-ev lb-ev--ok">
                      <time>15:00</time>Drill hit its limit. Everything restored in 40 s
                    </div>
                  </div>
                  <p className="lb-why" style={{ fontSize: 14 }}>
                    Before launch: show saved results when search is down, and stop selling when stock can’t
                    be confirmed.
                  </p>
                </div>
              </div>
              <Illus />
            </div>
          </article>

          <article className="lb-step">
            <Txt
              no="05 · DECIDE"
              title="Several good ideas? Test them"
              items={[
                'A/B tests your agent can set up and read',
                'Results with a confidence range',
                'A decision record nobody has to rewrite',
              ]}
            >
              Ask your agent to set up an A/B test. It splits the traffic, picks the metric and the read date,
              and shows the result with how sure it is. The decision is recorded next to the evidence.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Experiment · pricing page headline" />
                <div className="lb-win-body">
                  <div className="lb-row">
                    <span className="lb-chip lb-chip--g">Decided · ship B</span>
                    <span className="lb-chip">9,410 visitors</span>
                  </div>
                  <div className="lb-variants">
                    <span className="lb-lbl">Signup rate, 95% range</span>
                    <div className="lb-var">
                      <span className="lb-key">A</span>
                      <div className="lb-ci">
                        <span className="lb-ci-band" style={{ left: '18%', width: '22%' }} />
                        <span className="lb-ci-pt" style={{ left: '29%' }} />
                      </div>
                      <span className="lb-num">2.9%</span>
                    </div>
                    <div className="lb-var">
                      <span className="lb-key">B</span>
                      <div className="lb-ci">
                        <span className="lb-ci-band" style={{ left: '38%', width: '24%' }} />
                        <span className="lb-ci-pt" style={{ left: '50%' }} />
                      </div>
                      <span className="lb-num">3.8%</span>
                    </div>
                  </div>
                  <p className="lb-note">
                    Decision by Ana on 12 Oct: ship B. Guardrail held: refunds unchanged.
                  </p>
                </div>
              </div>
              <Illus />
            </div>
          </article>

          <article className="lb-step">
            <Txt
              no="06 · RELEASE"
              title="Release to the people it’s for"
              items={[
                'Feature flags with cohorts and percentage rollouts',
                'Kill switch from the console, the terminal or your agent',
                'Every change versioned, with who made it',
              ]}
            >
              Launching something experimental? Put it behind a flag and turn it on for one cohort: beta
              users, one country, 10% of traffic. If it goes wrong, one command turns it off everywhere.
            </Txt>
            <div className="lb-shot">
              <div className="lb-win">
                <WinBar title="Feature · New search" />
                <div className="lb-win-body lb-cohorts">
                  <div className="lb-row lb-between">
                    <span className="lb-row">
                      <span className="lb-toggle" aria-hidden="true" />
                      <b>On for 1,830 people</b>
                    </span>
                    <span className="lb-note">Changed by Daniel, 2 hours ago</span>
                  </div>
                  <span className="lb-lbl">Who sees it</span>
                  <ul className="lb-aud">
                    <li>
                      <span className="lb-aud-dot lb-aud-dot--on" />
                      <span className="lb-aud-name">
                        Beta testers<small>Everyone who joined the beta</small>
                      </span>
                      <span className="lb-aud-share">All of them</span>
                      <span className="lb-aud-n">412</span>
                    </li>
                    <li>
                      <span className="lb-aud-dot lb-aud-dot--part" />
                      <span className="lb-aud-name">
                        Shoppers in Mexico<small>Picked at random, same people each visit</small>
                      </span>
                      <span className="lb-aud-share">1 in 10</span>
                      <span className="lb-aud-n">1,418</span>
                    </li>
                    <li>
                      <span className="lb-aud-dot lb-aud-dot--off" />
                      <span className="lb-aud-name">Everyone else</span>
                      <span className="lb-aud-share">Not yet</span>
                      <span className="lb-aud-n">0</span>
                    </li>
                  </ul>
                  <div className="lb-row lb-between">
                    <span className="lb-note">Something wrong? One click turns it off for everyone.</span>
                    <span className="lb-offbtn">Turn off for everyone</span>
                  </div>
                </div>
              </div>
              <Illus />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
