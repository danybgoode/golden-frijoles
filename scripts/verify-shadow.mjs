// verify-shadow — Jev routes verify depth, in SHADOW (verify-module S2.2/S2.3, epic README D8–D10).
//
// For every PR merged into main, the nightly asks Jev the spike's one question (verify depth) and logs its answer
// next to the builder's label from the PR body, and a PR touching no spec path is labelled `off` by rule
// (verify-labels D1; `rule_label`, never written into `builder_label`). Nothing here gates, comments or decides anything: it measures the
// router before anyone relies on it. The log is verify/jev-shadow.jsonl — a header line `{"since": …}` (PRs merged
// before it are never asked), then one row per PR.
//
// Imported by scripts/verify-nightly.mjs (the writer) and verify/jev-triage/run.mjs --report (the reader).
import { QUESTIONS, SPECS, PATHS, DIFF_BUDGET } from '../verify/jev-triage/questions.mjs';

export const LOG_PATH = 'verify/jev-shadow.jsonl';
export const MARKER_PATH = 'verify/jev-shadow-30.json';
export const THRESHOLD = 30;
export const DEPTHS = ['off', 'light', 'standard', 'deep'];
export const SHADOW_BRANCH = 'claude/verify-jev-shadow';

/**
 * The builder's label: exactly one of the four depths after `Verify depth:`. The unfilled template line
 * (`off | light | standard | deep`), two values, or anything else is unlabelled (null) and doesn't count.
 */
export function parseLabel(body) {
  const lines = String(body ?? '')
    .split('\n')
    .map((l) => /^\s*(?:[-*]\s*)?\**verify depth\**\s*:\s*\**\s*(.*?)\s*\**\s*$/i.exec(l))
    .filter(Boolean);
  if (lines.length !== 1) return null;
  const value = lines[0][1].toLowerCase().replace(/[`*.]/g, '').trim();
  return DEPTHS.includes(value) ? value : null;
}

/** Parse the log: { since, rows }. A missing file is an empty log with no start (the writer creates one). */
export function parseLog(text) {
  const out = { since: null, rows: [] };
  for (const line of String(text ?? '').split('\n')) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    if ('since' in obj && !('pr' in obj)) out.since = obj.since;
    else out.rows.push(obj);
  }
  return out;
}

export const serialiseLog = ({ since, rows }) =>
  [JSON.stringify({ since }), ...rows.map((r) => JSON.stringify(r))].join('\n') + '\n';

/**
 * The merged PRs still to ask: merged at or after `since`, not an agent's `claude/` data PR (D9), and not
 * already logged (on main or on the open shadow branch). Oldest first, so the log reads in merge order.
 */
export function pendingPrs(merged, { since, logged }) {
  const seen = new Set(logged.map((r) => r.pr));
  return merged
    .filter((p) => since && p.mergedAt && p.mergedAt >= since)
    .filter((p) => !String(p.headRefName ?? '').startsWith('claude/'))
    .filter((p) => !seen.has(p.number))
    .sort((a, b) => (a.mergedAt < b.mergedAt ? -1 : 1));
}

/** The Jev request for one PR: the spike's specs, its one verify-depth question, the PR's title, stat and diff. */
export function jevRequest({ title, stat, diff }) {
  const truncated = diff.length > DIFF_BUDGET;
  const shown = truncated
    ? `${diff.slice(0, DIFF_BUDGET)}\n… [diff truncated at ${DIFF_BUDGET} chars]`
    : diff;
  return {
    truncated,
    req: {
      state: { specs: SPECS, pullRequest: { title, filesChanged: stat, diff: shown } },
      questions: { verify_depth: QUESTIONS.verify_depth },
    },
  };
}

export { PATHS };

/**
 * The rule label (verify-labels D1): a PR whose diff touches no `PATHS` file is `off` by the template's own rubric
 * ("off = can't affect the outbox or the flag evaluator"). `specFiles` is the list of `PATHS` files it changed; null
 * when that could not be computed, which labels nothing (unknown is never `off`). A PR that touches the spec gets
 * null: only a person's judgment labels it.
 */
export const ruleLabel = (specFiles) => (Array.isArray(specFiles) && specFiles.length === 0 ? 'off' : null);

/** One log row from Jev's reply (askJev never throws; a failure is `jev: null` with the reason). */
export function shadowRow(pr, res, builderLabel, specFiles) {
  const jev = res?.ok ? (res.answers?.verify_depth?.choice ?? null) : null;
  return {
    pr: pr.number,
    merged_at: pr.mergedAt,
    jev: DEPTHS.includes(jev) ? jev : null,
    builder_label: builderLabel,
    ...(Array.isArray(specFiles) ? { rule_label: ruleLabel(specFiles) } : {}),
    ...(res?.ok ? {} : { jev_error: String(res?.error ?? res?.state ?? 'no answer') }),
  };
}

/** The label a row is scored against: the builder's own call wins; else the rule's (D1). null = unlabelled. */
export const labelOf = (r) =>
  DEPTHS.includes(r.builder_label) ? r.builder_label : DEPTHS.includes(r.rule_label) ? r.rule_label : null;

const agreement = (rows, label) => {
  const counted = rows.filter((r) => DEPTHS.includes(label(r)) && DEPTHS.includes(r.jev));
  const gap = (r) => Math.abs(DEPTHS.indexOf(r.jev) - DEPTHS.indexOf(label(r)));
  return {
    counted: counted.length,
    exact: counted.filter((r) => gap(r) === 0).length,
    withinOne: counted.filter((r) => gap(r) <= 1).length,
  };
};

/**
 * Counted = a label (builder, else rule) AND a Jev call. Split by source so a rule label never reads as a judgment
 * (verify-labels S1.3), plus Jev's non-off rate on PRs that touch no spec path.
 */
export function report(rows) {
  const byBuilder = rows.filter((r) => DEPTHS.includes(r.builder_label));
  const byRule = rows.filter((r) => !DEPTHS.includes(r.builder_label) && DEPTHS.includes(r.rule_label));
  const zeroSpec = rows.filter((r) => r.rule_label === 'off' && DEPTHS.includes(r.jev));
  return {
    logged: rows.length,
    unlabelled: rows.filter((r) => labelOf(r) === null).length,
    jevMissing: rows.filter((r) => !DEPTHS.includes(r.jev)).length,
    ...agreement(rows, labelOf),
    builder: agreement(byBuilder, (r) => r.builder_label),
    rule: agreement(byRule, (r) => r.rule_label),
    zeroSpec: zeroSpec.length,
    zeroSpecNonOff: zeroSpec.filter((r) => r.jev !== 'off').length,
  };
}

const part = (a) => `${a.exact}/${a.counted} exact, ${a.withinOne}/${a.counted} within one`;

export const formatReport = (r) =>
  `Jev verify-depth shadow log: ${r.logged} PR(s) logged, ${r.counted} labelled with a Jev call ` +
  `(${r.unlabelled} unlabelled, ${r.jevMissing} without a Jev answer). ` +
  `Agreement: ${r.exact}/${r.counted} exact, ${r.withinOne}/${r.counted} within one level` +
  (r.builder && r.rule
    ? `; by builder label ${part(r.builder)}; off by rule (no spec path) ${part(r.rule)}. ` +
      `On PRs touching no spec path Jev said something other than off ${r.zeroSpecNonOff}/${r.zeroSpec} times.`
    : '.');

/** "N labelled PRs (B by the builder, R off by rule)", the share the ping and the owed line must name (D1). */
const labelled = (r) =>
  `${r.counted} labelled PRs` +
  (r.builder && r.rule ? ` (${r.builder.counted} by the builder, ${r.rule.counted} off by rule)` : '');

/** Ping once: the first time the counted rows reach the threshold, and only while no marker exists. */
export const decidePing = ({ counted, markerExists, threshold = THRESHOLD }) =>
  counted >= threshold && !markerExists;

export const pingText = (r) =>
  `Jev's verify-depth log has ${labelled(r)}; ${r.exact} exact, ${r.withinOne} within one: ` +
  'verify-for-projects can be refined';

/** The owed line (judgment) the ping adds to verify-module's RETROSPECTIVE.md, under Gaps / follow-ups. */
export const owedLine = (r, date) =>
  `- **Owed to the product owner:** decide whether to refine \`verify-for-projects\` — Jev's verify-depth shadow log ` +
  `reached ${labelled(r)} on ${date} (${r.exact} exact, ${r.withinOne} within one level; ` +
  '`node verify/jev-triage/run.mjs --report`).';

/** Insert the owed line at the end of the Gaps / follow-ups section (or append the section). Idempotent. */
export function addOwedLine(retro, line) {
  if (retro.includes(line)) return retro;
  const heading = /^## Gaps \/ follow-ups[^\n]*\n/m.exec(retro);
  if (!heading) return `${retro.replace(/\n*$/, '\n')}\n## Gaps / follow-ups\n\n${line}\n`;
  const after = heading.index + heading[0].length;
  const next = retro.slice(after).search(/^## /m);
  const end = next < 0 ? retro.length : after + next;
  const section = retro.slice(after, end).replace(/\n*$/, '\n');
  return `${retro.slice(0, after)}${section}${line}\n${next < 0 ? '' : '\n'}${retro.slice(end)}`;
}

// ── The historical backtest (verify-labels S1.2, D2) ─────────────────────────────────────────────────────────────
// verify/jev-backtest.jsonl: a header, then one row per spec-touching commit on main before the shadow log's `since`,
// labelled with hindsight by a person BEFORE Jev is asked. The header's `signed_off` is the product owner's sign-off
// of those labels; until it is set, Jev is never asked, so its answers cannot shape the labels they are scored against.

export const BACKTEST_PATH = 'verify/jev-backtest.jsonl';

export function parseBacktest(text) {
  const [head, ...rest] = String(text ?? '')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
  return { header: head ?? null, rows: rest };
}

export const serialiseBacktest = ({ header, rows }) =>
  [header, ...rows].map((r) => JSON.stringify(r)).join('\n') + '\n';

/** Jev may be asked only once the labels are signed off, and only for rows it has not answered. */
export function backtestToAsk({ header, rows }) {
  if (!header?.signed_off) return { refuse: `${BACKTEST_PATH}: the hindsight labels are not signed off yet` };
  return { rows: rows.filter((r) => !DEPTHS.includes(r.jev)) };
}

/** Scored against the hindsight label; a `?` (or any non-depth) label is dropped and reported as dropped. */
export function backtestReport(rows) {
  const labelled = rows.filter((r) => DEPTHS.includes(r.hindsight_label));
  return {
    rows: rows.length,
    dropped: rows.length - labelled.length,
    jevMissing: labelled.filter((r) => !DEPTHS.includes(r.jev)).length,
    ...agreement(labelled, (r) => r.hindsight_label),
  };
}

export const formatBacktest = (b, header) =>
  `Backtest (spec-touching commits before the log, hindsight labels ${header?.signed_off ? `signed off ${header.signed_off}` : 'NOT signed off'}): ` +
  `${b.rows} row(s), ${b.dropped} dropped as unjudgeable, ${b.jevMissing} without a Jev answer. ` +
  `Agreement: ${part(b)}.`;
