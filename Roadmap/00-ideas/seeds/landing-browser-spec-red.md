---
title: 'Five browser-project specs are red on main, and only the nightly run sees them'
slug: landing-browser-spec-red
status: shipped
area: '02'
type: bug
appetite: S
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-04
---

# Seed: five anonymous browser specs (mostly the landing) are red on `main`

**Found by** ci-diet: the seed's Problem section, and ci.yml's own old comment ("`landing.browser.spec.ts` is in this
repo right now, red on `main`, because the `browser` project runs nowhere"). It was out of ci-diet's scope, which
changes where tests run, never what they assert.

## Problem

The `browser` project ran in no pipeline until ci-diet S3.3 added `.github/workflows/browser-nightly.yml`. Its first
run ([37180389744](https://github.com/danybgoode/golden-frijoles/actions/runs/37180389744), 2026-10-04) was 59 passed, 1 skipped, **5 failed on both attempts**, in 4 files:
- `landing.browser.spec.ts:16`: "the landing renders the maker-ops narrative"
- `landing.browser.spec.ts:630`: "every in-page anchor on the landing page resolves to a section that exists"
- `design-system.browser.spec.ts:3`: "the landing renders the approved roast, foil, icon, and tactile system"
- `mobile-heuristics.browser.spec.ts:87`: "/talk is mobile-clean"
- `positioning-surfaces.browser.spec.ts:25`: "the landing states the category exactly once"

Their assertions have drifted from the landing that ships, and nobody knows which half is wrong: the spec or the page.

## Start here

Open the newest `browser-nightly` run (it pings Telegram when red), download `browser-nightly-failure`, and read each
failing trace. For each failure, decide whether the page regressed (fix the page) or the spec asserts a landing that
was deliberately redesigned (fix the spec, and cite the epic that changed it). The landing epics since
`landing-redesign-v2` are the likely sources.

## Done when

`browser-nightly` is green on `main` for three consecutive nights.

## Resolution (2026-10-04): fixed in #267, confirmed on `main`

Commit `43929e9` (merged in #267) settled each failure. Four specs still asserted the hero from before the Sep 2 redesign
(`24220da`: "Make more", the category definition, >3 in-page anchors), so the specs were wrong and now follow the
shipped page. `/talk` really did overflow a 360px screen by 3px with Linux fonts, so the page was wrong and was fixed.
`browser-nightly` then ran green twice: on the branch (run 37214267301) and on `main` at `31e397b` (run 37219943111),
both 64 passed and 1 skipped, the same skip as the first run. The seed's "three consecutive nights" is left to the
nightly itself, which pings Telegram if it goes red.

The Next 16 upgrade (portfolio-loop-flake) briefly turned four of these browser specs red again, through the new CSS
minifier. They are fixed in that same change, and the browser project is 64/1 on it.
