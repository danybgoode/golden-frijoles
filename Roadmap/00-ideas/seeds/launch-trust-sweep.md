---
title: "Launch trust sweep: every public surface says Golden Frijoles, on goldenfrijoles.com"
slug: launch-trust-sweep
status: scaffolded
area: "02"
type: chore
appetite: S
underwritten_by: wave-2026-10
risk: low
epic: "02-commercial/launch-trust-sweep"
build_order: 71
updated: 2026-10-08
intent_ask: verbatim
---

# Pitch — launch trust sweep

## The ask, as given

> All repos public surfaces review. Reconcile the licensing. […] Make sure the repo's root README is a user README
> (one-line pitch, 30-second quickstart, screenshot) and point the landing's GitHub link at the repo rather than your
> profile. […] Remove vercel urls, only use our brand domain, goldenfrijoles.com, all mentions must be retired
> specially from public surfaces. The loader phrases arent rotating on first try, i always see percolating.
> — Daniel, 2026-10-08

Findings and the score: [`audits/launch-sweep-2026-10-08.md`](../audits/launch-sweep-2026-10-08.md) §4, §5, §12.

## Problem

A developer who finds the repo meets "golden-beans", a `vercel.app` URL, dobby-foundation lore and a licence section
that says "Private / internal. Not open-source", while `LICENSE` says Apache-2.0 and FSL. The landing's GitHub icon
opens a personal profile. Two workflows fall back to the Vercel host. The navigation loader always says
"Percolating…" because each navigation mounts it at index 0 and most finish before the first 1.5 s tick.

## Appetite
S. Text, two workflow lines, one small component fix, one CI guard. Fixed-scope lane.

## Acceptance criteria
- The public text speaks Golden Frijoles: a user README at the root, the poster's licence and host lines, the SDK and CLI READMEs, the landing's GitHub link
- No Vercel host is left in the repo outside the tests that check the rule, and CI keeps it that way
- The navigation loader opens on a different phrase each time, and a screen reader hears "Loading" once

## No-gos
- No change to `getSiteUrl()` or its tests. They already refuse the Vercel host; their `vercel.app` strings test that.
- No layout or design change (night garden is held).
- The GitHub repo descriptions and the Vercel domain redirect are account settings, not files: listed in the sprint's
  walkthrough, done outside the PR.

## Flag
None: risk low, no runtime behaviour changes beyond the loader's first phrase.
