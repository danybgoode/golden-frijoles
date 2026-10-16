import Flageval
-- `lake env lean Axioms.lean` — proves no theorem rests on `sorryAx`. Lists EVERY theorem in Proofs.lean
-- (verify/lean/check.sh fails when the counts differ).
#print axioms Flageval.agreement
#print axioms Flageval.callSite_gap
#print axioms Flageval.explain_covers_every_rule
#print axioms Flageval.at_most_one_matched
#print axioms Flageval.explainLoop_some_fst
#print axioms Flageval.explainLoop_none_fst
#print axioms Flageval.mem_ordered
#print axioms Flageval.explainLoop_length
#print axioms Flageval.explainLoop_some_count
#print axioms Flageval.explainLoop_none_count
