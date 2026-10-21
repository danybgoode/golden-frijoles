#!/usr/bin/env node
// landing-launch-experiment · S4.3 follow-up (verifier r7, #412) — are Stripe's live Growth subscriptions and the workspaces
// on Growth in step? Read-only on both sides: the Stripe CLI's live login (`stripe subscriptions list --live`) and the
// linked production database (`supabase db query --linked`). Prints ids only and exits 1 when anything is out of step, so it
// can run from a schedule later. The comparison is scripts/lib/reconcile-growth.mjs.
//
// Usage:   node scripts/stripe-reconcile-growth.mjs   (from the checkout `supabase link`ed to production, with `stripe login` on
//          the live account). Exit 0 in step, 1 out of step, 2 could not read a side.
import { execFileSync } from 'node:child_process';
import { isMain } from './lib/is-main.mjs';
import { reconcileGrowth } from './lib/reconcile-growth.mjs';

// stderr is dropped (the Stripe CLI prints a banner there), so a failure is named here instead: which side, and the usual cause.
function json(cmd, args, hint) {
  try {
    return JSON.parse(
      execFileSync(cmd, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
      })
    );
  } catch (err) {
    throw new Error(`${cmd} ${args[0]} failed (status ${err.status ?? '?'}): ${hint}`);
  }
}

function stripeSubscriptions() {
  const all = [];
  let after = null;
  for (;;) {
    const page = json(
      'stripe',
      [
        'subscriptions',
        'list',
        '--live',
        '--status',
        'all',
        '--limit',
        '100',
        ...(after ? ['--starting-after', after] : []),
      ],
      'is the Stripe CLI logged in to the live account (`stripe login`)?'
    );
    for (const s of page.data)
      all.push({
        id: s.id,
        customer: typeof s.customer === 'string' ? s.customer : s.customer?.id,
        status: s.status,
        priceLookupKeys: (s.items?.data ?? []).map((item) => item.price?.lookup_key ?? null),
      });
    if (!page.has_more || page.data.length === 0) return all;
    after = page.data.at(-1).id;
  }
}

function workspaces() {
  const out = json(
    'supabase',
    [
      'db',
      'query',
      '--linked',
      '-o',
      'json',
      'select id, plan, stripe_customer_id as customer, stripe_subscription_id as subscription from workspaces',
    ],
    'run it from the checkout that is `supabase link`ed to production'
  );
  return out.rows;
}

export function main() {
  const subscriptions = stripeSubscriptions();
  const rows = workspaces();
  const findings = reconcileGrowth(subscriptions, rows);
  process.stdout.write(
    `stripe-reconcile-growth: ${subscriptions.length} live-mode subscriptions, ${rows.length} workspaces\n`
  );
  if (findings.length === 0) {
    process.stdout.write(
      'in step: every live Growth subscription is held by its workspace, and every Growth workspace is paid.\n'
    );
    return 0;
  }
  for (const f of findings) process.stdout.write(`✗ ${f.kind}: ${f.text}\n`);
  return 1;
}

if (isMain(import.meta.url)) {
  try {
    process.exitCode = main();
  } catch (err) {
    process.stderr.write(`stripe-reconcile-growth: ${err.message}\n`);
    process.exitCode = 2;
  }
}
