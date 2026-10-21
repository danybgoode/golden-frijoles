// landing-launch-experiment · S4.3 follow-up — the Stripe ↔ workspace comparison (scripts/lib/reconcile-growth.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileGrowth, GROWTH_PRICE_LOOKUP_KEY } from './reconcile-growth.mjs';

const sub = (id, customer, status = 'active', keys = [GROWTH_PRICE_LOOKUP_KEY]) => ({
  id,
  customer,
  status,
  priceLookupKeys: keys,
});
const ws = (id, plan, customer = null, subscription = null) => ({ id, plan, customer, subscription });
const kinds = (findings) => findings.map((f) => f.kind).sort();

test('in step: one live subscription held by a Growth workspace, a Free one with a canceled history', () => {
  assert.deepEqual(
    reconcileGrowth(
      [sub('sub_1', 'cus_1'), sub('sub_old', 'cus_2', 'canceled')],
      [ws('w1', 'growth', 'cus_1', 'sub_1'), ws('w2', 'free', 'cus_2', null), ws('w3', 'comped')]
    ),
    []
  );
});

test('two live Growth subscriptions on one customer: the second is paid for nothing', () => {
  const findings = reconcileGrowth(
    [sub('sub_1', 'cus_1'), sub('sub_2', 'cus_1')],
    [ws('w1', 'growth', 'cus_1', 'sub_1')]
  );
  assert.deepEqual(kinds(findings), ['paid-not-held', 'two-subscriptions']);
  assert.match(findings.find((f) => f.kind === 'paid-not-held').text, /sub_2.*w1 holds sub_1/);
});

test('a workspace on Growth whose subscription Stripe no longer charges', () => {
  assert.deepEqual(
    kinds(reconcileGrowth([sub('sub_1', 'cus_1', 'canceled')], [ws('w1', 'growth', 'cus_1', 'sub_1')])),
    ['growth-not-paid']
  );
  assert.deepEqual(kinds(reconcileGrowth([], [ws('w1', 'growth', 'cus_1', null)])), ['growth-not-paid']);
});

test('a lost webhook: paid in Stripe, the workspace still Free and holding nothing — replay, never refund', () => {
  const findings = reconcileGrowth([sub('sub_1', 'cus_1')], [ws('w1', 'free', 'cus_1', null)]);
  assert.deepEqual(kinds(findings), ['paid-still-free']);
  assert.match(findings[0].text, /resend/);
  assert.doesNotMatch(findings[0].text, /refund/);
  assert.deepEqual(kinds(reconcileGrowth([sub('sub_9', 'cus_9')], [])), ['no-workspace']);
});

test('past_due is still paid for: held by a Growth workspace it is in step, and two of them are two subscriptions', () => {
  assert.deepEqual(
    reconcileGrowth([sub('sub_1', 'cus_1', 'past_due')], [ws('w1', 'growth', 'cus_1', 'sub_1')]),
    []
  );
  assert.deepEqual(
    kinds(
      reconcileGrowth(
        [sub('sub_1', 'cus_1'), sub('sub_2', 'cus_1', 'past_due')],
        [ws('w1', 'growth', 'cus_1', 'sub_1')]
      )
    ),
    ['paid-not-held', 'two-subscriptions']
  );
});

test('an unpaid subscription is never "live": beside a live one it is not a second charge, and it does not pay for Growth', () => {
  assert.deepEqual(
    reconcileGrowth(
      [sub('sub_1', 'cus_1'), sub('sub_old', 'cus_1', 'unpaid')],
      [ws('w1', 'growth', 'cus_1', 'sub_1')]
    ),
    []
  );
  assert.deepEqual(
    kinds(reconcileGrowth([sub('sub_1', 'cus_1', 'unpaid')], [ws('w1', 'growth', 'cus_1', 'sub_1')])),
    ['growth-not-paid']
  );
});

test("the script's lookup key is the app's", async () => {
  const { readFileSync } = await import('node:fs');
  const app = readFileSync(new URL('../../apps/web/lib/billing-decision.ts', import.meta.url), 'utf8');
  assert.match(app, new RegExp(`GROWTH_PRICE_LOOKUP_KEY = '${GROWTH_PRICE_LOOKUP_KEY}'`));
});

test('unpaid is Free by design, and another price is not ours to judge', () => {
  assert.deepEqual(
    reconcileGrowth([sub('sub_1', 'cus_1', 'unpaid')], [ws('w1', 'free', 'cus_1', 'sub_1')]),
    []
  );
  assert.deepEqual(reconcileGrowth([sub('sub_x', 'cus_x', 'active', ['other_price'])], []), []);
});
