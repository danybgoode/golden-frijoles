#!/usr/bin/env bash
# The flag evaluator's proofs and its differential test (verify-module S1.4, D5; rule 4 in verify/README.md).
#   bash verify/lean/check.sh          # lake build · axioms · diff-test seeds 1–3 · the whitespace mutant must disagree
# Needs elan (lake reads lean-toolchain) and Node 22+ (the diff test imports packages/sdk/src/flags.ts directly).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
node_run() { node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON "$@"; }

echo "── lake build"
(cd "$here" && lake build)

echo "── axioms: every theorem rests only on the standard axioms (propext, Classical.choice, Quot.sound), never sorryAx"
axioms=$(cd "$here" && lake env lean Axioms.lean)
echo "$axioms"
theorems=$(grep -c '^#print axioms' "$here/Axioms.lean")
# One line per theorem, each either axiom-free or listing a subset of the three; any other name (sorryAx) fails.
clean=$(AX="$axioms" node -e 'const ok=new Set(["propext","Classical.choice","Quot.sound"]);
  const lines=process.env.AX.split("\n").filter(Boolean);
  const good=lines.filter(l=>/^.Flageval\.[A-Za-z_]+. does not depend on any axioms$/.test(l)||
    ((m)=>m&&m[1].split(",").map(s=>s.trim()).every(a=>ok.has(a)))(/^.Flageval\.[A-Za-z_]+. depends on axioms: \[([^\]]*)\]$/.exec(l)));
  console.log(good.length===lines.length?good.length:-1)')
if [ "$clean" != "$theorems" ]; then
  echo "axioms: expected $theorems theorem(s) on the standard axioms only, got $clean (-1 = a line names another axiom)"
  exit 1
fi
# Every theorem in the proofs is printed above: a new theorem nobody added to Axioms.lean is not checked.
declared=$(grep -cE '^(private )?(theorem|lemma) ' "$here/Flageval/Proofs.lean")
[ "$declared" = "$theorems" ] || { echo "axioms: Proofs.lean declares $declared theorem(s), Axioms.lean prints $theorems"; exit 1; }

echo "── differential test, seeds 1 2 3"
for seed in 1 2 3; do node_run "$root/verify/diff-test/run.mjs" 2000 "$seed" >/dev/null || {
  node_run "$root/verify/diff-test/run.mjs" 2000 "$seed" | tail -8
  echo "diff-test: seed $seed disagrees — the model and the code no longer say the same thing"
  exit 1
}; done
echo "seeds 1–3: 0 disagreements"

echo "── teeth: Lean's own whitespace in place of JS trim() must disagree (F6)"
mutant=$(mktemp -d)
trap 'rm -rf "$mutant"' EXIT
cp -R "$here/." "$mutant/"
needle='def nonBlank (s : String) : Bool := s.toList.any (fun c => !jsWhitespace c)'
[ "$(grep -cF "$needle" "$mutant/Flageval/Model.lean")" = 1 ] || { echo "teeth: the mutation site moved; update check.sh"; exit 1; }
NEEDLE="$needle" node -e 'const fs=require("fs");const f=process.argv[1];const s=fs.readFileSync(f,"utf8");
  fs.writeFileSync(f,s.replace(process.env.NEEDLE,process.env.NEEDLE.replace("!jsWhitespace c","!c.isWhitespace")))' \
  "$mutant/Flageval/Model.lean"
grep -qF "$needle" "$mutant/Flageval/Model.lean" && { echo "teeth: the mutation did not apply"; exit 1; }
(cd "$mutant" && lake build >/dev/null)
if FLAGEVAL_BIN="$mutant/.lake/build/bin/flageval" node_run "$root/verify/diff-test/run.mjs" 2000 1 >"$mutant/out.json"; then
  echo "teeth: the whitespace mutant PASSED the differential test — it has lost its teeth"
  exit 1
fi
grep '"disagreements"' "$mutant/out.json"
echo "teeth: the mutant was caught; every proof still holds on it, which is why rule 4 exists"
