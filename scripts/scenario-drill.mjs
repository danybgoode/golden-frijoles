#!/usr/bin/env node
// scenarios-light-up S2.2 (D7) — sends synthetic probes to a drill target and prints what each one got.
//
//   SCENARIO_PROBE_SECRET=… node scripts/scenario-drill.mjs [--origin https://goldenfrijoles.com] [--count 5] [--json]
//
// Each probe is a POST to <origin>/api/internal/resilience/probe for subject `synthetic:drill-<run>-<n>`, so no real
// person is ever in the cohort. The target decides the arm (control or fault) and applies the fault at its probe seam;
// this script only sends, times and reports. The secret comes from the environment, never an argument (it would land
// in shell history). Exit 0 when every probe got an answer, 1 when any could not be sent or was refused, 2 on usage.

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`)
  return at === -1 ? fallback : args[at + 1]
}
const origin = flag('origin', 'https://goldenfrijoles.com')
const count = Number(flag('count', '5'))
const json = args.includes('--json')
const secret = process.env.SCENARIO_PROBE_SECRET?.trim()

// https only, except a local server: the secret travels in a header and must never cross a network in clear text.
const originOk = /^https:\/\/[^/]+$/.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
if (!secret || !Number.isSafeInteger(count) || count < 1 || count > 100 || !originOk) {
  process.stderr.write(
    'usage: SCENARIO_PROBE_SECRET=… node scripts/scenario-drill.mjs [--origin https://host | http://localhost:port] [--count 1-100] [--json]\n'
  )
  process.exit(2)
}

const drill = Date.now().toString(36)
const results = []
for (let n = 1; n <= count; n += 1) {
  const subject = `synthetic:drill-${drill}-${n}`
  const started = Date.now()
  try {
    const response = await fetch(`${origin}/api/internal/resilience/probe`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({ subject }),
    })
    const body = response.status === 404 ? null : await response.json().catch(() => null)
    results.push({ n, subject, status: response.status, roundTripMs: Date.now() - started, ...(body ?? {}) })
  } catch (error) {
    results.push({ n, subject, status: null, error: error instanceof Error ? error.message : String(error) })
  }
}

if (json) {
  process.stdout.write(`${JSON.stringify({ origin, count, results }, null, 2)}\n`)
} else {
  process.stdout.write(`drill ${drill} → ${origin} (${count} probe${count === 1 ? '' : 's'})\n`)
  for (const r of results) {
    const what =
      r.status === 404
        ? 'refused (404: wrong secret, the resilience switch is off, or the probe is not configured)'
        : r.status === null
          ? `not sent: ${r.error}`
          : `${r.arm}${r.faultKind && r.faultKind !== 'none' ? ` (${r.faultKind})` : ''} · ${r.admitted ? 'admitted' : r.reason} · ${r.latencyMs ?? '?'} ms at the seam, ${r.roundTripMs} ms round trip`
    process.stdout.write(`  ${String(r.n).padStart(3)}  ${r.status ?? '—'}  ${what}\n`)
  }
  const tally = (arm) => results.filter((r) => r.arm === arm).length
  process.stdout.write(`  fault ${tally('fault')} · control ${tally('control')} · idle ${tally('idle')}\n`)
}
process.exit(results.every((r) => r.status === 200 || r.status === 503) ? 0 : 1)
