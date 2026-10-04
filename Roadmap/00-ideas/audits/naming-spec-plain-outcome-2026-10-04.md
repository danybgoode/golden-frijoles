# Naming spec: Plain · Outcome (2026-10-04)

**Status:** decided by the PO on 2026-10-04 (system: Plain · Outcome; product name: Golden Frijoles, kept). This is the
input to `shape` (today `groom`) for the rename work. Source of the options: the Naming Workbench artifact and
`naming-inventory-2026-10-04.md`. Rows marked **(refined)** changed from the workbench after review; they are the
facilitator's proposal, so the PO confirms them with this spec.

**Rules it follows (brand platform):** plain verbs for what you type; one lifecycle, one set of words; the signature
concept is the **proven bet**, closed by a **verdict**; no vendor, customer or legacy names on stranger surfaces; keep
`AGENTS.md`, `Roadmap/`, North Star and `gf`; change addresses only where they are wrong; every new word retires one.

---

## 1. The lifecycle (replaces seven vocabularies)

One enum in front matter. The board, reports, console and build view derive labels from it.

| State | Label | Replaces |
|---|---|---|
| `idea` | Idea | seed `raw`; board *To groom* |
| `shaping` | Shaping | seed `ready`; board *Grooming*; phase *Shaping* |
| `ready` | Ready | seed `queued`; epic `scaffolded`; board *Ready to build*; phase *Locking architecture* (once the plan check passes) |
| `building` | Building | epic `in-progress`; phase *Building*; board *Building* |
| `review` | Review | phase *Verifying*, *In review*; board *QA* |
| `live` | Live | epic `shipped`; phase *Shipped*; board *Shipped*; seed `shipped` |
| `proven` · `disproven` · `unclear` | Proven · Disproven · Unclear | **new**: the verdict, written by its read date (North Star "Proven bets") |
| `archived` | Archived | seed and epic `archived` |

Not part of the lifecycle, and unchanged: a product's own stage (`consider · operate · exit`), a strategy file's
`draft · agreed`, a slice's checklist.

**Compatibility:** the extract/stage scripts read the old values for one release and map them (the table above), so
existing files stay valid until the move script rewrites them.

## 2. Work objects

| Today | Plain · Outcome | Note |
|---|---|---|
| seed | **idea** | |
| epic | **bet** | A funded piece of work. Matches the North Star unit |
| sprint | **slice** | A shippable part of a bet |
| story | **task** | |
| wave | **cycle** | The funding decision; records what each bet displaced |
| appetite | **appetite** (kept) | Already plain in Shape Up; S / M / L |
| architecture lock | **plan check** | |
| *(none)* | **verdict** | New record: target, read date, evidence, result (dogfood F16) |
| retrospective | **retro** (kept as a separate file) **(refined)** | A retro is about how we worked; a verdict is about whether it paid off. Both stay |
| poster | **roadmap** | `Roadmap/README.md` |

## 3. Skills, coaches, agent, hook

| Today | Plain · Outcome |
|---|---|
| `golden-frijoles` (front door) | `start` |
| `groom` | `shape` |
| kickoff (`/build` prompt) | `build` |
| `build-order-sync` | `sync-roadmap` |
| `babysit-pr` | `watch-pr` |
| `live-smoke` | `verify` |
| `doc-hygiene` | `tidy-docs` |
| `pmo-report` | `portfolio-report` |
| `prose-draft` | `draft` |
| `standup-post` | `daily` |
| `weekly-recap` | `weekly` |
| `vercel-prune` | `prune-previews` (a Vercel adapter, optional; dogfood F20) |
| `pr-reviewer` (agent) | `reviewer` |
| build view (hook) | build view (kept) |
| `pmf-narrative` (coach) | `narrative` → writes `strategy/narrative.md` |
| `north-star` (coach) | `north-star` (kept) → `strategy/north-star.md` |
| `risk-validation` (coach) | **`riskiest-assumption`** **(refined**: the workbench said `riskiest-bet`, but the coach tests the narrative's riskiest assumption, not a bet) → `strategy/riskiest-assumption.md` |
| *(none)* | `cold-read` (coach): the sealed independent read before coaching (dogfood F22) → `strategy/cold-read/` |

In Claude Code a plugin's skills are namespaced (`golden-frijoles:start`), so short names like `start` and `daily` don't
collide with other plugins. Each old skill name stays as an alias for one plugin release, then is removed.

## 4. Folders and files

| Today | Plain · Outcome |
|---|---|
| `Roadmap/README.md` (the poster) | `Roadmap/README.md` (the roadmap) |
| `Roadmap/00-ideas/seeds/` | `Roadmap/ideas/` |
| `Roadmap/00-ideas/audits/` | `Roadmap/audits/` |
| `Roadmap/00-ideas/BUILD-ORDER.md` | `Roadmap/ORDER.md` |
| `Roadmap/00-strategy/` | `Roadmap/strategy/` (git-ignored by default, opt in to commit; dogfood F2) |
| `Roadmap/bets/wave-<date>.md` | `Roadmap/cycles/<date>.md` |
| `Roadmap/01-growth-engine/<epic>/` etc. | `Roadmap/bets/<slug>/` with `area:` in front matter **(refined:** the numbered area folders become a tag, so a stranger's repo starts flat) |
| `README.md · sprint-N.md · RETROSPECTIVE.md · IN-FLIGHT.md · SCOPE.md` | `README.md · slice-N.md · retro.md · verdict.md · in-flight.md` (`SCOPE.md` folds into README) |
| `WAYS-OF-WORKING.md` | `HOW-WE-WORK.md` |
| `SESSION-KICKOFFS.md` | `SESSION-PROMPTS.md` |
| `LEARNINGS.md`, `AGENTS.md`, `CODE-QUALITY.md` | kept |

## 5. Console and reports

| Today | Plain · Outcome |
|---|---|
| Hub | **Board** |
| Pod Report | **Outcome report** |
| TARS funnel: Targeted · Adopted · Retained | **Adoption funnel: Reached · Adopted · Retained** |
| Jev | **semantic check** (TypeSafe stays named only where you configure its key) |
| Sections Today · Ship · Measure · Setup | kept |
| `flags kill` | kept |
| "Miyagi Cloud Run" and other customer names in copy | generic examples ("Production server") (dogfood F25) |

## 6. Addresses (Tier 2)

| Address | Decision |
|---|---|
| Product name, plugin id `golden-frijoles`, `gf`, `gf-kit`, `@golden-frijoles/*`, domain | **Kept** |
| `GOLDEN_BEANS_FLAG_READ_KEY` / `…_SYNC_KEY` | → `GOLDEN_FRIJOLES_FLAG_READ_KEY` / `…_SYNC_KEY`; the old names are read as a fallback for one SDK minor version, with a warning |
| Demo slug `golden-beans-demo` | → `golden-frijoles-demo`, old slug redirects |
| `jev.config.json`, `live-smoke.config.json`, `reporting.config.json` | Fold into `golden-frijoles.config.json` (sections per module, already started); old files read as fallback |
| DB enum values and API paths | Unchanged unless a value is user-visible; labels are mapped in the UI |
| Legacy text: `dobby`, `ways-of-work`, `golden-beans`, "Golden Beans" | Retired from plugin, template, README and roadmap |

## 7. Words retired (the "every new word retires one" check)

New: idea, bet, slice, task, cycle, plan check, verdict, proven/disproven/unclear, start, shape, build, verify, board,
outcome report, cold read. Retired: seed, epic, sprint, story, wave, lock, lane, poster, kickoff, groom, grooming,
scaffolded, queued, raw, phase, QA, Hub, Pod Report, TARS, Jev (on surfaces), babysit, smoke, hygiene, PMO, standup,
recap, prose, dobby, ways-of-work, Golden Beans. Net: about 15 words in, 30 out.
