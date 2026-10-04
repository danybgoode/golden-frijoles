# Audit: naming inventory: every name the product uses, and what it costs to change (2026-10-04)

**Scope:** step 1 of the brand and naming workstream (dogfood-launch-2026-10). Every named thing a builder, a stranger
or an agent meets: product and legacy names, skills and coaches, CLI verbs, folders and files, lifecycle states,
console labels, internal jargon, package and wire addresses, and the existing brand world. Counts are `grep` hits on
2026-10-04, excluding `node_modules`, `dist`, `.git`, `test-results` and `00-strategy`. Case-insensitive counts of short
words (`bet`, `seed`, `lock`, `Hub`) include noise (alphabet, block, GitHub) and are shown only as a rough size.
**This is an inventory, not a decision.**

---

## 0. What matters most

1. **Seven lifecycle vocabularies describe one journey** (§2). A seed's `ready` shows on the board as *Grooming*;
   46 seeds sit at `scaffolded` and 10 at `shipped`, neither of which is in the seed status enum. This is the largest
   naming problem, and it is in exactly what a stranger watches move.
2. **The brand world broke at the rename** (§8). The Golden Beans identity is a coffee roastery (dark roast, kraft and
   foil, brass, "the cupping score"); *frijoles* are not coffee beans. The tokens, the mark and the landing still speak
   roastery under a name that now means something else.
3. **The legacy names are nearly gone from stranger surfaces, but not quite** (§1): `golden-beans` in 7 plugin and 54
   template places, `GOLDEN_BEANS_*` env vars in the CLI and SDK, `dobby` in 38 template places, `ways-of-work` in 467
   plugin and template places, and the demo project slug `golden-beans-demo`.
4. **The jargon a stranger meets on day one is dense** (§6): groom, seed, appetite, bet, wave, lock, lane, kickoff,
   poster, Jev, TARS, Hub, Pod Report, cross-review, build order, underwritten. Each is defensible alone; together they
   are the "ceremony" the blind run named as the riskiest assumption.
5. **Addresses are cheap to keep and expensive to move** (§9). Package names, the plugin id, `gf`, config files, DB enum
   values and API paths need aliases and deprecation windows. Words on screens and in docs do not.

---

## 1. Product and identity names

| Name | All files | Hits | Plugin | Template | CLI + SDK | Web UI | Web lib | Status |
|---|---|---|---|---|---|---|---|---|
| Golden Frijoles / golden-frijoles | 637 | 5,335 | — | — | — | — | — | **Current** |
| Golden Beans | 87 | 245 | 0 | 0 | 0 | 1 | 1 | Legacy |
| golden-beans | 435 | 1,245 | 7 | 54 | 0 | 4 | 27 | Legacy (repo, demo slug, Vercel host) |
| GOLDEN_BEANS_* (env) | 12 | 20 | 0 | 0 | 6 | 0 | 1 | Legacy, kept deliberately as "caller-owned integration addresses" |
| dobby / dobby-foundation | 157 | 1,865 | 1 | 38 | 0 | 0 | 0 | Legacy (template's origin, local folder `~/dobby/`) |
| ways-of-work | 115 | 281 | 47 | 420 | 0 | 1 | 3 | Legacy repo name, live in skill and template text |
| Miyagi | 212 | 658 | 0 | 0 | 13 | 48 | 123 | A customer's name, in user-visible copy (flag audit, design-system specimen, "Revoke key 'Miyagi Cloud Run'?") |
| `gf` / `gf-kit` | — | — | — | — | — | — | — | Current CLI binaries |

## 2. Lifecycle vocabularies: one journey, seven sets of words

| # | Where | Values | Notes |
|---|---|---|---|
| 1 | Seed `status:` (documented enum) | `raw · ready · queued · archived` | In practice also `scaffolded` (46 seeds) and `shipped` (10): outside the enum |
| 2 | Epic `status:` (SSOT) | `scaffolded · in-progress · shipped · archived` | 51 shipped, 3 in progress, 2 scaffolded |
| 3 | Epic `phase:` (executive ladder) | `Shaping · Locking architecture · Building · Verifying · In review · Shipped` | Written by hand at cadence events |
| 4 | Board stage (`scripts/lib/stage.mjs`) | `To groom · Grooming · Ready to build · Building · QA · Shipped` | Seed `ready` → *Grooming*; `queued`, `scaffolded`, `in-progress` → *Ready to build* |
| 5 | Sprint status | `Planned · …` (153 sprint files carry `**Status:**`) | Free text |
| 6 | Project loop stage (`lib/loop-stage.ts`) | `Consider · Operate · Exit` | The portfolio's stage per product |
| 7 | Strategy files (`kind:` docs) | `draft · agreed` | The coaches' contract |

The same piece of work is a *seed* that is *ready*, shown as *Grooming*, becomes an *epic* that is *scaffolded*, in
phase *Shaping*, shown as *Ready to build*. A stranger has to learn the mapping before the board makes sense.

## 3. Skills, coaches, agents and hooks (the plugin, 0.27.2)

| Kind | Names |
|---|---|
| Front door | `golden-frijoles` |
| Plan | `groom`, `build-order-sync` |
| Coaches | `pmf-narrative`, `north-star`, `risk-validation` |
| Build and verify | `babysit-pr`, `live-smoke`, `doc-hygiene` |
| Operate and report | `pmo-report`, `standup-post`, `weekly-recap`, `prose-draft`, `vercel-prune` |
| Agent | `pr-reviewer` |
| Hook | `build-view` (the live build band in Claude Code) |
| Duplicates on claude.ai | `pmf-narrative-facilitator`, `deliberate-risk-validation`, `groom` (dogfood F3) |

The names are descriptive labels written at different times; they follow no theme. One is a vendor name
(`vercel-prune`), one a job title (`pmo-report`), one a ritual (`standup-post`), one a slang verb (`babysit-pr`).

## 4. CLI verbs

`gf`: `login · logout · whoami · doctor · setup · init · config {list,get,set} · projects {ls,create,use} ·
flags {ls,get,create,set,rollout,rules,kill,diff,history,sync} · north-star set`. `gf-kit`: `init` (adopts a bare
repo). These are plain verbs and already pass a day-one legibility test; `flags kill` is "the 3am verb".

## 5. Folders and files

| Path | Role | Notes |
|---|---|---|
| `Roadmap/` | Product source of truth | Agents and searchers expect it |
| `Roadmap/README.md` | "The poster" | The word *poster* is internal |
| `Roadmap/00-ideas/` → `seeds/`, `audits/`, `BUILD-ORDER.md` | The idea funnel | |
| `Roadmap/00-strategy/` | The coaches' output | New; git-excluded in this run (F2) |
| `Roadmap/01-growth-engine/`, `02-commercial/`, `09-platform-infra/` | Epic areas | Numbered areas; names are this product's, not generic |
| `Roadmap/bets/wave-<date>.md` | The underwriting record | *Bet* and *wave* are two more words for one decision |
| Epic folder: `README.md · sprint-N.md · RETROSPECTIVE.md · IN-FLIGHT.md · SCOPE.md` | One epic | 55 epics, 156 sprint files |
| `WAYS-OF-WORKING.md`, `LEARNINGS.md`, `SESSION-KICKOFFS.md`, `fill-ins.yml` | Cadence and memory | |
| `AGENTS.md`, `CODE-QUALITY.md` | Agent rules | `AGENTS.md` is a cross-tool convention; keep |
| `.golden-frijoles/`, `.jev/` | Local state | |
| `golden-frijoles.config.json`, `jev.config.json`, `live-smoke.config.json`, `reporting.config.json` | Config | Four config files; a new section-per-module file already exists |

## 6. Internal concepts a stranger meets

| Term | Hits (all files) | What it means | Day-one? |
|---|---|---|---|
| groom | 1,683 | Shape a raw ask into sliced work | Yes, the front door |
| seed | (noisy) | An idea file in the funnel | Yes |
| appetite | 819 | The size you're willing to spend (S/M/L) | Yes |
| bet / wave | (noisy) / 697 | A funded piece of work / the batch it was funded in | Yes |
| kickoff | 1,367 | The builder's start prompt | Yes |
| lock | (noisy) | The architecture lock before build | Yes |
| lane | (noisy) | Parallel build tracks | Soon |
| poster | 239 | The roadmap README | Soon |
| Jev | 1,268 | TypeSafe's semantic judge (a vendor product) | Soon |
| TARS | 375 | Targeted · Adopted · Retained funnel | In the console |
| Hub / Pod Report | (noisy) / 201 | The roadmap board / the delivery report | In the console |
| lens | 2,208 | Report audience views; also AI-adoption lens | Later |
| build order, underwritten, cross-review, shadow | — | Sequencing, funding pointer, cross-model review, observe-only mode | Later |

## 7. Console labels (signed-in product)

Sections **Today · Ship · Measure · Setup**. Labels: Activity, CLI access, Connect your agent, Destinations,
Experiments, Features, FinOps, Journeys, Keys, North Star, Onboarding, Scenarios & drills, Scheduled changes, Setup,
Share links, Tasks, Today. Routes add Portfolio, Impact, Funnel, Flag audit, Hub, the Pod Report and `/talk`.

## 8. The existing brand world

- **Golden Beans era (July 2026):** `references/design-direction.md` sets the world as *a specialty roastery* (raw
  events are green beans; the engine roasts them; North Star = the cupping score; experiments = batch A / batch B),
  framed in *an agent window*. `apps/web/brand/tokens.css` encodes three material families: **dark roast** (the
  product), **kraft and foil** (packaging), **brass** (instruments), with gold as the accent.
- **Rename to Golden Frijoles (August):** `landing-frijoles-rebrand` and `frijoles-rebrand-closeout` changed the name and
  the public addresses, not the world. Frijoles are cooked beans, not coffee, so the roastery metaphor no longer belongs
  to the name.
- **Blind run (October):** proposes giving the name a meaning ("most features are beans; find the golden ones") and a
  kitchen world (brigade service: prep, fire, the pass, 86), with gold reserved for golden outcomes. The kitchen
  inherits most of the roastery's material language (kraft, tickets, warmth, gold) without the coffee.

## 9. Blast radius: what a change costs

| Tier | What | Examples | Cost to change |
|---|---|---|---|
| **0: words in docs** | Prose, headings, internal docs, retros | `poster`, `wave` in docs, epic READMEs | Free; history stays as written |
| **1: words on surfaces** | What a stranger reads: skill names, console labels, board stages, report titles, landing copy | `groom`, *To groom → Shipped*, *Pod Report*, *TARS* | Low to medium; a skill rename needs an alias for one release |
| **2: addresses** | What code or agents call: package names, plugin id, `gf`, config file names, env vars, DB enum values, API paths, frontmatter keys | `@golden-frijoles/sdk`, `golden-frijoles` plugin id, `status: scaffolded`, `GOLDEN_BEANS_FLAG_READ_KEY`, `/api/v1/…` | High; needs aliases, a deprecation window and migrations. Keep unless the name is actively wrong |

Recommendation for the theme decision: **change Tier 1 freely, change Tier 2 only where it is wrong (legacy names), and
let one canonical lifecycle drive all seven state vocabularies** (one enum in frontmatter, one display label set).

## 10. Findings raised to the dogfood log

F23 (seven lifecycle vocabularies), F24 (the brand world broke at the rename), F25 (a customer's name in product copy).
