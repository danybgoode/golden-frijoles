#!/usr/bin/env bash
# The outbox model check — the ONE table of expected results (verify-module D2; born in verify-spike S1.1).
#   bash verify/quint/check.sh quick     # per PR: the simulator over 7 invariants × 2 timing modes (~1.5 min)
#   bash verify/quint/check.sh teeth     # per PR: a mutant model whose delete no longer drains MUST mismatch
#   bash verify/quint/check.sh           # nightly: quick + the exhaustive runs (~50 min; Java 17+ for Apalache)
# Options (after the mode): --itf-dir DIR writes each row's counterexample trace there (a violation only);
#                           --rows FILE appends one tab-separated line per row: mode module invariant depth expected
#                           got status seconds itf — what scripts/verify-nightly.mjs reads.
# Needs Quint: QUINT=/path/to/quint or `npx -y @informalsystems/quint@0.33.0`.
#
# Every row states the result it must reproduce. A row whose result differs, OR that produced no result at all (a
# missing tool, a missing spec, a checker crash), prints MISMATCH and the script exits 1. A blank row must never
# read as a pass: that exact failure happened while the spike ran.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
mode=${1:-full}
[ $# -gt 0 ] && shift
itf_dir=""
rows=""
while [ $# -gt 0 ]; do
  case "$1" in
    --itf-dir) itf_dir="$2"; shift 2 ;;
    --rows) rows="$2"; shift 2 ;;
    *) echo "check.sh: unknown argument $1"; exit 2 ;;
  esac
done
[ -n "$itf_dir" ] && mkdir -p "$itf_dir" && itf_dir="$(cd "$itf_dir" && pwd)"
[ -n "$rows" ] && rows="$(cd "$(dirname "$rows")" && pwd)/$(basename "$rows")"
QUINT=${QUINT:-"npx -y @informalsystems/quint@0.33.0"}
spec_dir="$here"
failures=0

report() { # mode module invariant depth expected result seconds output itf
  local status=match
  if [ "$6" != "$5" ]; then
    status=MISMATCH
    failures=$((failures + 1))
  fi
  printf '%-20s %-20s %-4s %-9s expected %-11s got %-11s %-8s %4ss\n' "$2" "$3" "$1" "$4" "$5" "${6:-<none>}" "$status" "$7"
  if [ "$status" = MISMATCH ] && [ -z "$6" ]; then
    printf '  └ no result; last output:\n'
    tail -5 <<<"$8" | sed 's/^/    /'
  fi
  if [ -n "$rows" ]; then
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "$5" "${6:-none}" "$status" "$7" "$9" >>"$rows"
  fi
}

# The trace path for a row. `quint run` writes a sample trace even on [ok], so a row names its trace only when the
# result is a violation (itf_of's $4).
itf_arg() { [ -n "$itf_dir" ] && printf -- '--out-itf=%s/%s-%s-%s.itf.json' "$itf_dir" "$1" "$2" "$3"; }
itf_of() {
  local f="$itf_dir/$1-$2-$3.itf.json"
  [ -n "$itf_dir" ] && [ "$4" = '[violation]' ] && [ -f "$f" ] && printf '%s' "$f"
}

last=""  # the last row's result: teeth needs to know the mutant was CAUGHT, not that the row merely failed

sim() { # module invariant expected — random simulation, 10k traces of ≤25 steps, fixed seed
  local s=$SECONDS out r
  out=$(cd "$spec_dir" && $QUINT run outbox.qnt --main "$1" --invariant "$2" --max-steps 25 --max-samples 10000 \
    --seed 0x1 $(itf_arg sim "$1" "$2") 2>&1)
  r=$(grep -oE '^\[(ok|violation)\]' <<<"$out" | head -1)
  last=$r
  report sim "$1" "$2" "≤25" "$3" "$r" "$((SECONDS - s))" "$out" "$(itf_of sim "$1" "$2" "$r")"
}

bmc() { # module invariant depth expected — Apalache bounded model check, EXHAUSTIVE to that depth
  local s=$SECONDS out r
  out=$(cd "$spec_dir" && $QUINT verify outbox.qnt --main "$1" --invariant "$2" --max-steps "$3" \
    $(itf_arg bmc "$1" "$2") 2>&1)
  r=$(grep -oE '^\[(ok|violation)\]' <<<"$out" | head -1)
  report bmc "$1" "$2" "$3" "$4" "$r" "$((SECONDS - s))" "$out" "$(itf_of bmc "$1" "$2" "$r")"
}

[ -f "$spec_dir/outbox.qnt" ] || { echo "outbox.qnt not found in $spec_dir"; exit 1; }

if [ "$mode" = teeth ]; then
  # Does the per-PR check have teeth? Stop delete_destination draining pending/failed rows: a re-queueable row then
  # points at a deleted destination two steps in, and the simulator must say so. The mutation must apply, or this
  # is a pass for the wrong reason.
  mutant_dir=$(mktemp -d)
  trap 'rm -rf "$mutant_dir"' EXIT
  needle='if (k._2 == d and (rows.get(k).status == "pending" or rows.get(k).status == "failed"))'
  [ "$(grep -cF "$needle" "$spec_dir/outbox.qnt")" = 1 ] || { echo "teeth: the mutation site moved; update check.sh"; exit 1; }
  NEEDLE="$needle" node -e 'const fs=require("fs");const [i,o]=process.argv.slice(1);
    fs.writeFileSync(o,fs.readFileSync(i,"utf8").replace(process.env.NEEDLE,"if (false)"))' \
    "$spec_dir/outbox.qnt" "$mutant_dir/outbox.qnt"
  grep -qF "$needle" "$mutant_dir/outbox.qnt" && { echo "teeth: the mutation did not apply"; exit 1; }
  spec_dir="$mutant_dir"
  rows=""
  itf_dir=""
  sim outbox_timed noOrphan '[ok]'
  # A crash or an unparseable mutant also MISMATCHes (no result); only a found violation is the mutant caught.
  if [ "$last" = '[violation]' ]; then
    echo "teeth: the mutant was caught (the MISMATCH above is the expected result)"
    exit 0
  fi
  echo "teeth: the mutant PASSED the check — the per-PR model check has lost its teeth"
  exit 1
fi

# The shipped code (#373 included). F1 is an accepted residual and W1 a witness; F3 holds only with the timing order.
for m in outbox_timed outbox_untimed; do
  for i in noVanish noOrphan attemptsBounded sendsBounded; do sim "$m" "$i" '[ok]'; done
  sim "$m" noStrandedInFlight '[violation]' # F1
  sim "$m" noDeadByExhaustion '[violation]' # W1: a sink down longer than the budget dead-letters
done
sim outbox_timed noSendAfterTerminal '[ok]'
sim outbox_untimed noSendAfterTerminal '[violation]' # F3: without the timing order

if [ "$mode" != quick ]; then
  # Exhaustive to depth: the shipped code under the production timing assumption.
  for i in noVanish noOrphan attemptsBounded noSendAfterTerminal; do bmc outbox_timed "$i" 10 '[ok]'; done
  bmc outbox_timed sendsBounded 14 '[ok]' # F2 is gone past the depth it appeared at
  # Teeth: the pre-#373 code still shows F2 at 12 steps, or the exhaustive check has lost its reach.
  bmc outbox_timed_prefix sendsBounded 12 '[violation]'
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures row(s) did not reproduce the expected table"
  exit 1
fi
echo "all rows reproduce the expected table"
