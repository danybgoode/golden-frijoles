---
status: in-progress  # AUTHORITATIVE epic status (SSOT) — scaffolded | in-progress | shipped | archived. Set shipped at epic close.
phase: Building      # the executive ladder — Shaping | Locking architecture | Building | Verifying | In review | Shipped.
                     # WRITTEN at each cadence event, never inferred. Shipped = merged AND deployed.
slug: screensavers
title: "Claude Code screensavers, the hook to the rest"
area: 09-platform-infra
risk: low
type: feature
sprints_total: 1
stories_total: 3   # the sum of every sprint's stories_total — keep it in step when a story is added
intent_match: null   # copied from the seed by scaffold-epic (intent-match); the reader at the lock may update it
quote_low_usd: null    # ≈ API $ — copied from the seed's `quote:` by scaffold-epic (finops); null = not quoted, never 0
quote_high_usd: null
quote_basis: null
hypothesis: "People who build with Claude Code leave it running while an agent works, and an idle terminal shows nothing worth sharing. A screensaver worth a screenshot gives them something to post, and every post carries the one line that installs Golden Frijoles. We'll know when more people install the plugin after we post it."   # the result record; null = no target (never an error)
target_metric: "unique cloners of golden-frijoles/skills, 14 days"   # free text (not grounded): GitHub's clone traffic for the skills repo
target_from: 244   # 2026-10-19, `gh api repos/golden-frijoles/skills/traffic/clones` → uniques (existing users' auto-updates included)
target_to: 400
read_date: 2026-11-30       # YYYY-MM-DD; 14 days after the post has had two weeks to travel
verdict: null        # proven | disproven | unclear — stamped by `node scripts/epic-read.mjs --epic <slug> --write`
verdict_actual: null
verdict_evidence: null   # https:// link · north-star:<input>@YYYY-MM-DD · ab:<experiment> (unclear: the reason)
verdict_at: null
persona: "Builders who run Claude Code all day, leave it working while they step away, and share their setups."   # for whom, doing which job
grounded: false   # true = traced to a North Star input · false = funded anyway (reason below) · null = Bug/Chore or never asked
grounded_reason: "No North Star input counts plugin installs, and the plugin sends nothing home without opt-in telemetry; GitHub's clone traffic for the skills repo is the one install signal there is."   # only with grounded: false
flag_key: null   # the screensaver runs in the plugin, on the person's machine: its switch is `/screensaver off`, not a catalog flag (no network on a hook's path)
target_segment: null
adopted_event: null
retained_event: null
retention_days: null
satisfied_event: null
satisfied_min_score: null
build_order: 102     # integer position in the ONE global build sequence — the SSOT once the epic
                     # exists (the seed's value is only a fallback). Fill it in at the betting
                     # table; plain integers, no "#2a" suffixes. See 00-ideas/README.md → Ordering.
underwritten_by: wave-2026-10
appetite: S
---

# Epic: Claude Code screensavers, the hook to the rest

> **Area:** 09-platform-infra · **Risk:** low · **Class:** Feature · **Scope seed:** none — refined in the session that
> built it (2026-10-19); this README is the record.

## Why
People who build with Claude Code leave it running while an agent works, and an idle terminal shows nothing worth
sharing. A screensaver worth a screenshot gives them something to post, and every post carries the one line that
installs Golden Frijoles. We'll know when more people install the plugin after we post it.

## Platform-first note
The plugin already draws a band above the prompt (the build-view mod). The screensaver is a `Client` region under that
band, not a second mod, and installing it is installing the plugin: the same marketplace, the same two `claude plugin`
commands `install.md` already gives. Once installed, the band names the next step itself: in a repo with no
`Roadmap/`, `→ Next /golden-frijoles:setup`; outside any repo, the caption points at goldenfrijoles.com.

## What already exists (reuse, don't rebuild)
- `skills/plugins/golden-frijoles/hooks/index.tsx` — the band; the screensaver draws under it.
- `skills/plugins/golden-frijoles/hooks/build-view.mjs` — `headerOf`, `bandRowsFrom`: the screensaver reads the view the way the band does.
- `apps/web/lib/install-manifest.ts` — the install commands (`PLUGIN_MARKETPLACE_ADD`, `PLUGIN_INSTALL`).
- `references/golden-frijoles-screensaver.patch` — the first draft (an earlier session), reviewed in full and landed with the fixes in S1.1.

## Decisions
- **D1 — when it plays.** Away = no typing, no submit, no main-conversation turn running, no question waiting. 3 minutes
  away with nothing in flight; 9 with an epic in flight (the band is the useful thing then, so it waits longer and stays
  above the picture). A turn is never "away": an agent's long turn streams output the person is reading. Quiet time is
  counted on the engine's clock, so a machine asleep is not "away". `/screensaver <minutes>` moves the base.
- **D2 — what ends it.** The first keystroke, submit, turn or question; the work changing under it (an epic going in or
  out of flight).
- **D3 — aspect ratio.** Never scaled: a piece is drawn at its own size, centred. A short band crops it by at most a
  quarter of its height from the side it keeps (a fire its base, a tree its pot); below that, or wider than the band,
  it is skipped. A terminal with room for none draws the band alone.
- **D4 — a surface that cannot draw it** leaves the region out and keeps the band; the engine does not retry a failed
  region. No `ui.fault` hook: the engine the plugin's CI pins has no such event, and an unknown event refuses the whole
  hooks module — the band included.
- **D5 — the switch** is `/screensaver on|off|now|stop|<minutes>`, saved in the plugin's store. No catalog flag: the
  plugin never calls the network from a hook.
- **D6 — standalone.** It plays in any folder the plugin is loaded in; outside a Golden Frijoles repo the band names
  the step that lights it up.

## Scope — stories
| Sprint | Story | Risk |
|---|---|---|
| 1 | S1.1 It plays when you are away, at its own size | low |
| 1 | S1.2 One line installs it, and the band shows the rest | low |
| 1 | S1.3 The post goes out, and the read is taken | low |

## The install line (S1.2)
```
claude plugin marketplace add golden-frijoles/skills && claude plugin install golden-frijoles@golden-frijoles
```
Then `/screensaver now` to see one. The post: a screenshot of the band with a piece playing under it, "Claude Code
screensavers — get yours:" and the line above.

## Deploy order
The plugin ships from `main` through the skills mirror and the release job (`skills/RELEASING.md`): merge, and
`v1.14.0` is tagged and published. Nothing in `apps/web` depends on it.

## Definition of Done (epic)
- [ ] All sprints merged to `main` + smoke-tested (gaps stated — `node scripts/owed-ledger.mjs` counts what is still owed)
- [ ] Each `sprint-N.md` has its smoke walkthrough (real URLs)
- [ ] This README marked ✅; every sprint status ticked with commit refs
- [ ] `RETROSPECTIVE.md` written
- [ ] Product poster (`Roadmap/README.md`) updated
- [ ] Team memory + `MEMORY.md` index updated
- [ ] Durable learnings promoted to `Roadmap/LEARNINGS.md` (dedupe — sharpen, don't append)
- [ ] Feature branch deleted; **this README's frontmatter `status: shipped`** (the SSOT — the board & Notion derive from it; run `node scripts/build-order.mjs`)
