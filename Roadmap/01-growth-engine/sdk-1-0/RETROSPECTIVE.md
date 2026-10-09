# SDK 1.0: one line to start, who the user is, and North Star inputs — Retrospective

_Closed: 2026-10-09_
_Intent: yes_
_Quote vs actual: $16–32 (M, n=16, p25–p75) → ≈$29.55 (inside the quote; Claude only, reviewers not measured)_

## What shipped
- **One PR, both sprints** (#331, merge `37adc9f`; `@golden-frijoles/sdk` 1.0.0 on npm). A default URL
  (`createGrowthEngineClient({ apiKey })`), `identify`/`reset` with `NO_USER`, `pushInputValues` for North Star inputs,
  a dual ESM/CommonJS build, one-line quickstarts on `/install` and Connect, and a test that freezes the 0.6.0 surface
  (66 exports read from a build of `main`, every client method, a byte-identical 0.6.0 request, and the 0.6.0 config
  shapes: getter, inherited, filled in later).

## What went well
- **One PR, no stack:** the plugin-1-0 lesson applied; nothing merged into a base branch by mistake.
- **The verifier found the break the freeze test could not see:** reading the config once at construction (and testing
  the key with `hasOwnProperty`) would have sent a getter, inherited or filled-in-later `baseUrl`, and the flag read key,
  to production. The freeze test only exercised a literal object. Fixed by reading per call; the shapes are now pinned.
- **Default-URL safety held from the lock:** a present-but-empty `baseUrl` never defaults, so an unset env var fails
  instead of reaching production.

## What we learned
- **"Additive" has to be checked against how 0.6.0 READ its inputs, not only what it exported.** The surface list and a
  literal-object call were green while a construction-time read broke three real config shapes.
- **A rename on one surface can switch off a reader elsewhere.** The snippets' new env-var name was not read by the
  plugin's roadmap push and FinOps hooks; following the snippet would have silently disabled them.
- **A root script must not import a workspace package's build output** (`dist/` is not committed); the seed scripts
  already knew this, the revenue sync relearned it.
- **When every other family is unavailable, say so on the PR and ask.** The security status stays red as "no
  cross-family lens ran", the verifier stood in, and Daniel accepted it explicitly.

## Gaps / follow-ups
- **Owed to Daniel:** walkthrough step 3 (a real `identify` + `track` seen in the catalog).
- **agy in worktrees** reports "not logged in", and in the main checkout it fails on untracked `.claude/skills/`
  symlinks; a cross-family security lens needs one of the two fixed.
- **CLI:** its next release picks up the widened SDK range (<2.0.0) and the kit 1.0.x pin (plugin-1-0 D9).
