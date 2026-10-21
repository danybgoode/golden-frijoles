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

test('a paid subscription whose workspace is still Free (a lost webhook), and one with no workspace at all', () => {
  assert.deepEqual(kinds(reconcileGrowth([sub('sub_1', 'cus_1')], [ws('w1', 'free', 'cus_1', 'sub_1')])), [
    'paid-not-growth',
  ]);
  assert.deepEqual(kinds(reconcileGrowth([sub('sub_9', 'cus_9')], [])), ['no-workspace']);
});

test('unpaid is Free by design, and another price is not ours to judge', () => {
  assert.deepEqual(
    reconcileGrowth([sub('sub_1', 'cus_1', 'unpaid')], [ws('w1', 'free', 'cus_1', 'sub_1')]),
    []
  );
  assert.deepEqual(reconcileGrowth([sub('sub_x', 'cus_x', 'active', ['other_price'])], []), []);
});
