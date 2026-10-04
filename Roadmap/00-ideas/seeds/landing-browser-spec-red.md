---
title: 'landing.browser.spec.ts is red on main, and only the nightly run sees it'
slug: landing-browser-spec-red
status: raw
area: '02'
type: bug
priority: unranked
appetite: S
underwritten_by: null
risk: low
epic: null
build_order: null
updated: 2026-10-04
---

# Seed: the anonymous landing browser spec is red on `main`

**Found by** ci-diet: the seed's Problem section, and ci.yml's own old comment ("`landing.browser.spec.ts` is in this
repo right now, red on `main`, because the `browser` project runs nowhere"). It was out of ci-diet's scope, which
changes where tests run, never what they assert.

## Problem

`apps/web/e2e/landing.browser.spec.ts` (23 tests) belongs to the `browser` project, which no pipeline ran until
ci-diet S3.3 added `.github/workflows/browser-nightly.yml`. Its assertions have drifted from the landing that ships,
and nobody knows which half is wrong: the spec or the page.

## Start here

Open the newest `browser-nightly` run (it pings Telegram when red), download `browser-nightly-failure`, and read each
failing trace. For each failure, decide whether the page regressed (fix the page) or the spec asserts a landing that
was deliberately redesigned (fix the spec, and cite the epic that changed it). The landing epics since
`landing-redesign-v2` are the likely sources.

## Done when

`browser-nightly` is green on `main` for three consecutive nights.
