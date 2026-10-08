// one-product-project S1.1 (fresh review of #318, Blocking) — the demo seed deletes every event and feature in the
// public project, which is Golden Frijoles' real project now. It may only ever run against a local Supabase.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLocalSupabaseUrl, assertLocalTarget } from './seed-demo-project.mjs';

test('a local Supabase is the only accepted target', () => {
  for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321']) {
    assert.equal(isLocalSupabaseUrl(url), true, url);
  }
});

test('production, a look-alike host and garbage are all refused', () => {
  for (const url of [
    'https://slweidgffcfndnskcskc.supabase.co',
    'https://localhost.evil.example',
    'http://127.0.0.1.nip.io:54321',
    'not a url',
    '',
  ]) {
    assert.equal(isLocalSupabaseUrl(url), false, url);
    assert.throws(() => assertLocalTarget(url), /Refusing to seed/);
  }
});
