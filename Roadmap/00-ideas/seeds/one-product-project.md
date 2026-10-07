---
title: "One product project: golden-frijoles, built in the open"
slug: one-product-project
status: raw
area: "02-commercial"
type: chore
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-07
intent_ask: verbatim
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Pitch (seed) — One product project

## The ask, as given

> yeah the flags and projects are a mess need untangling. Thanks for surfacing. So we are building golden-frijoles
> using golden-frijoles right? im not sure why we need two project, one golden-beans and the other golden-beans-demo .
> i believe we should only have one, where we manage all, i mean all including flags roadmaps etc. So either lets
> consolidate on golden-beans or golden-beans-demo, whatever is easiest and update the name to golden-frijoles.

(Daniel, 2026-10-07, during the one-epic-page build. Answered the same day, both by his choice:)
- **Visibility: public, built in the open.** One project, `golden-frijoles`, made from `golden-beans-demo` (it is the
  demo, so rule #2 keeps working: the demo IS us). The Hub, funnels and North Star are public; flag administration
  stays members-only.
- **Sequencing: its own epic, groomed right after one-epic-page closes.** Risk high (tenancy, rule #2, prod data, env).

## Why it surfaced
one-epic-page D12 reads an epic's flag from the project's own registry. On prod the only project with a pushed roadmap
(`golden-beans-demo`) holds 0 flags, and Golden Frijoles' one real flag lives in `golden-beans`. So every flag line
says "not found" until roadmap and flags share one project.

## Facts at the time (prod, read-only, 2026-10-07)
| | `golden-beans-demo` | `golden-beans` |
|---|---|---|
| Role in code | `DEMO_PROJECT_SLUG` (`lib/public-demo.ts`): public showcase, `/install` connector, public API | `SELF_PROJECT_SLUG` (`lib/self-track.ts`): landing self-tracking; `lib/terminal-sign-in-flag.ts` reads its flag in-process |
| Holds | roadmap + pod_report (582 pushes, CI pushes with its key), 292 events, 1 feature, 1 North Star, 2 live keys, 1 connector | 1 flag (`auth.terminal_sign_in_enabled`), 3 features, 499 events, 1 North Star, 1 live key, 1 connector |
| Workspace | Daniel's products | Daniel's products |

## What the groom must settle (not decided here)
- The slug rename (`golden-beans-demo` → `golden-frijoles`): env vars `DEMO_PROJECT_SLUG`/`SELF_PROJECT_SLUG` (a commit
  to main is the redeploy), the constants' defaults, `tenant-slug.ts` reserved list, `golden-frijoles.config.json`
  `hubUrl`, shared Hub links (redirect old slug?), CI secrets/keys for the roadmap and Pod Report pushes.
- What moves from `golden-beans`: the flag (and its activations/history), the 3 features, the self-tracking key, the
  North Star; whether past events move or stay (append-only tables), and what happens to `golden-beans` after.
- What becomes public that was private (self-tracking funnels, North Star), checked against rule #2 and the tenancy
  invariant — the credentials stay project-scoped.
