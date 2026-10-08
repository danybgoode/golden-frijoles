# Contributing to Golden Frijoles

Golden Frijoles is built with its own method: every change starts as an idea in `Roadmap/00-ideas/`, becomes an epic
with a reason to build it, and ships through a pull request to `main`. Merging to `main` deploys.

## Start here

- [`AGENTS.md`](AGENTS.md): the architecture and the rules that cannot be broken. Read it before building.
- [`CODE-QUALITY.md`](CODE-QUALITY.md): the house style.
- [`Roadmap/README.md`](Roadmap/README.md): every feature by area, with its status.
- [`Roadmap/WAYS-OF-WORKING.md`](Roadmap/WAYS-OF-WORKING.md): the cadence, gitflow, Definition of Done, QA and review.
- [`Roadmap/LEARNINGS.md`](Roadmap/LEARNINGS.md): what past epics taught us. Read it at the start of a session.
- [`Roadmap/00-ideas/`](Roadmap/00-ideas/README.md): the ideas, audits and the generated `BUILD-ORDER.md`.

The plugin, kit and template under `skills/` have their own guide: [`skills/CONTRIBUTING.md`](skills/CONTRIBUTING.md).
An edit there is a plugin release ([`skills/RELEASING.md`](skills/RELEASING.md)).

## Running it

```bash
npm ci
npm run dev                 # the app at http://localhost:3000 (needs a local Supabase: supabase start)
npm run typecheck && npm run build
npm run test:unit
npm run test:e2e            # the Playwright api project, the always-on gate
```

## Guards worth knowing

- **Template drift:** the project was spawned from a template that left `TEMPLATE FILL-IN` markers in load-bearing
  docs; they must stay filled. `npm run check:template-drift` fails on an unfilled placeholder (the phrase in angle
  brackets, or followed by a colon), so a plain prose mention like this one is allowed.
- **Brand host:** `node scripts/check-brand-host.mjs` fails on a Vercel deployment host anywhere in the repo. Use
  `https://goldenfrijoles.com`.
- **Build order:** `Roadmap/00-ideas/BUILD-ORDER.md` is generated (`node scripts/build-order.mjs`); never edit it by
  hand.

## Licence

By contributing you agree that your contribution is licensed under the licence of the folder it lands in (see
[`LICENSE`](LICENSE)).
