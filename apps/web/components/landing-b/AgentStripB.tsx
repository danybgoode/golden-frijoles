// landing-launch-experiment · S3.3 — B's agent strip. All three commands are real `frijoles` verbs
// (flags rollout, north-star readings, scenarios launch); the output lines are examples, not our own metrics.
export function AgentStripB() {
  return (
    <section className="lb-band lb-band--alt">
      <div className="lb-wrap lb-agentgrid">
        <div>
          <p className="lb-kicker">Built for agents</p>
          <h3>Everything on screen is also a command</h3>
          <p>
            Your agent can read the funnel, open the epic, roll out the flag and run the drill, from the
            terminal or through the connector. People get the same facts in the console.
          </p>
        </div>
        <pre className="lb-term">
          <span className="lb-p">$</span>{' '}
          <span className="lb-o">frijoles flags rollout new-search --percent 10 --env production</span>
          {'\n'}new-search · production · v8 · 10% of contexts{'\n'}
          <span className="lb-p">$</span>{' '}
          <span className="lb-o">frijoles north-star readings checkout_rate</span>
          {'\n'}2026-10-12 47% 2026-10-05 44% 2026-09-28 41%{'\n'}
          <span className="lb-p">$</span> <span className="lb-o">frijoles scenarios launch black-friday</span>
          {'\n'}Launched black-friday · stop with: frijoles scenarios stop 4
        </pre>
      </div>
    </section>
  )
}
