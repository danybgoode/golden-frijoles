---
title: "Delivery back on: a dispatch schedule the free Vercel plan allows"
slug: delivery-back-on
status: raw
area: "01"
type: feature
appetite: null
underwritten_by: null
risk: high
epic: null
build_order: null
updated: 2026-10-14
intent_ask: proxy
hypothesis: null
target_metric: null
target_from: null
target_to: null
read_date: null
flag_key: null
intent_match: null
---

# Raw — delivery back on (after delivery-stale-reclaim-uncounted, #87)

From verify-spike finding **F7**, re-checked 2026-10-14:

- `vercel crons ls` finds **no cron jobs** on the production project. The `*/5` dispatch cron lives only in
  `apps/web/vercel.json`; the project's Root Directory is `.`, and the repo-root `vercel.json` has no `crons`.
- `delivery.destinations_enabled` is **off** in production (one-product-project read on 2026-10-08: no attempts since
  2026-07-22, 320 pending).
- Daniel is on Vercel's free (Hobby) plan (2026-10-14), whose cron jobs run at most once a day as far as we know
  (confirm against Vercel's current docs before shaping). A webhook delivered a day late isn't delivery.

## The question

Does event delivery come back, and what calls the existing `CRON_SECRET`-gated route
(`/api/internal/dispatch-deliveries`) every few minutes on the free plan?

## Options to weigh when refining

1. **Supabase `pg_cron` + `pg_net`** calling the route with the secret from Supabase Vault: minute-level, on the
   database we already have, no new service.
2. **A GitHub Actions `schedule`** calling the route: free on a public repo, but GitHub delays or skips scheduled runs
   under load.
3. **Vercel's daily cron**: allowed, but too slow for webhooks.

Either way the route stays the one registered caller of `projects_with_due_work()` (AGENTS.md's scheduler exemption):
only the thing that wakes it changes. #87's fix must ship first, because the 320 pending rows would go out on the
first tick, and the stale-reclaim bug is on that path. Decide what happens to that backlog (send, or expire) before
switching on.
