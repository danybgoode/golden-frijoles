// The spike's Jev triage inputs, shared by the spike's re-run (run.mjs) and the nightly's shadow router
// (scripts/verify-shadow.mjs, verify-module D9). One copy: the router asks exactly what the spike measured.
export const PATHS = [
  'apps/web/supabase/migrations/*deliver*',
  'apps/web/supabase/migrations/*fanout*',
  'apps/web/supabase/migrations/*destination*',
  'apps/web/app/api/internal/dispatch-deliveries/route.ts', // maxDuration + TICK_BUDGET_MS (F3)
  'apps/web/lib/delivery-dispatch.ts',
  'apps/web/lib/deliveries.ts',
  'apps/web/lib/webhook-delivery.ts',
  'apps/web/lib/retry-policy.ts',
  'packages/sdk/src/flags.ts',
];
export const DIFF_BUDGET = 60_000;

export const SPECS = {
  outbox:
    'Quint model of the event-delivery outbox (event_deliveries status machine pending → in_flight → delivered | failed | dead; ' +
    'claim_deliveries with stale reclaim; settle_delivery guarded by a claim token; release; replay; delete_destination). ' +
    'Invariants: no delivery row vanishes; no re-queueable row points at a deleted destination; attempt_count stays within the ' +
    'retry budget; real sends per row stay within the budget; nothing is sent after delivered/dead; no in_flight row is stranded.',
  flagEvaluator:
    'Lean 4 model of evaluateFlag and explainFlagEvaluation in packages/sdk/src/flags.ts (clause matching, rollout outcome with an ' +
    'uninterpreted hash, first-match-by-priority). Theorems: the explanation names the same variant, reason and rule as the verdict ' +
    'for a type-correct call; a type-incorrect call always disagrees; one explanation line per rule; at most one matched rule.',
};

export const QUESTIONS = {
  touches_spec: {
    type: 'noul',
    instructions:
      'Two formal specs describe parts of this codebase (see state.specs). Does this pull request change behaviour that either spec describes — so that the spec could now be wrong, or a checked property could now fail?',
    criteria: {
      true: 'Yes: the diff changes logic, SQL, state transitions, matching or ordering that a spec models.',
      false:
        'No: the diff only changes comments, docs, names, types, UI copy or code the specs do not model.',
    },
  },
  counterexample_class: {
    type: 'choice',
    instructions:
      'If this change introduced a defect in the specified behaviour, which kind of counterexample would a checker most likely produce?',
    criteria: {
      none: 'The change cannot affect the specified behaviour.',
      lost_or_orphaned_delivery: 'A delivery row vanishes or can never be claimed again.',
      duplicate_or_unbounded_send:
        'The same event is sent more times than the budget allows, or after it finished.',
      stuck_row: 'A row is stranded in_flight or in a state nothing advances.',
      budget_violation:
        'attempt_count exceeds the retry budget, or dead-lettering happens too early or never.',
      explain_verdict_disagreement: 'The flag explanation disagrees with the value actually served.',
      other: 'A different class of defect.',
    },
  },
  obligation_difficulty: {
    type: 'choice',
    instructions: 'What would it take to keep the formal verification honest after this change?',
    criteria: {
      none: 'Nothing: the specs are unaffected.',
      rerun: 'Re-run the existing checks; the specs still describe the code.',
      update_spec: 'Edit the spec to mirror the change, then re-run the checks.',
      new_property: 'Add a new invariant or theorem the change introduces.',
      new_technique: 'The change needs a modelling or proof technique the specs do not use yet.',
    },
  },
  verify_depth: {
    type: 'choice',
    instructions: 'How much verification does this pull request deserve before merge?',
    criteria: {
      off: 'None — it cannot affect specified behaviour.',
      light: 'Re-run the existing model checks and proofs in CI.',
      standard: 'Update the spec and run a bounded model check or differential test.',
      deep: 'New invariants or proofs, plus a human reading the counterexamples.',
    },
  },
};
