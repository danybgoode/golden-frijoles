import assert from 'node:assert/strict';
import test from 'node:test';
import { countStories, notionRequest } from './roadmap-to-notion.mjs';

test('story count recognizes status emoji before canonical Story headings', () => {
  const body = [
    '## Stories',
    '### ✅ Story 1.1 — complete',
    '### ✅ Story 1.2 — complete',
    '### Story 1.3 — planned',
    '### Story 1.4 — planned',
  ].join('\n');

  assert.deepEqual(countStories(body), { total: 4, done: 2 });
});

test('story count retains legacy heading variants without treating section headings as stories', () => {
  const body = ['## QA', '## ✅ US-1 shipped', '### 🟦 S2.1 (API) in review', '## C.3 planned'].join('\n');

  assert.deepEqual(countStories(body), { total: 3, done: 1 });
});

test('richText splits long text across ≤2000-char objects instead of failing or cutting it (the S1 kickoff regression)', async () => {
  const { richText, NOTION_TEXT_LIMIT } = await import('./roadmap-to-notion.mjs');
  assert.deepEqual(richText(null), { rich_text: [] });
  assert.deepEqual(richText('short'), { rich_text: [{ text: { content: 'short' } }] });
  const long = 'x'.repeat(2534);
  const parts = richText(long).rich_text;
  assert.equal(parts.length, 2);
  assert.ok(parts.every((p) => p.text.content.length <= NOTION_TEXT_LIMIT));
  assert.equal(parts.map((p) => p.text.content).join(''), long, 'nothing is cut');
});

test('richText never cuts an emoji in half at a chunk boundary', async () => {
  const { richText } = await import('./roadmap-to-notion.mjs');
  const text = 'a'.repeat(1999) + '🏗' + 'b'.repeat(10); // the surrogate pair sits at 1999–2000, across the cut
  const parts = richText(text).rich_text.map((p) => p.text.content);
  assert.equal(parts.join(''), text);
  for (const part of parts)
    assert.ok(!/[\uD800-\uDBFF]$/.test(part) && !/^[\uDC00-\uDFFF]/.test(part), 'a half pair');
});

function fakeResponse(status, body, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

test('notionRequest waits out a 429 for the retry_after Notion asked for, then succeeds', async () => {
  const answers = [
    fakeResponse(429, { status: 429, code: 'rate_limited', additional_data: { retry_after: '5' } }),
    fakeResponse(502, '<!DOCTYPE html><html>bad gateway</html>'),
    fakeResponse(200, { ok: 1 }),
  ];
  const waits = [];
  const out = await notionRequest('u', {}, { fetchImpl: async () => answers.shift(), sleep: async (ms) => waits.push(ms) });
  assert.deepEqual(out, { ok: 1 });
  assert.equal(waits[0], 5250);
  assert.equal(waits.length, 2);
});

test('notionRequest fails at once on a 4xx, with Notion body in the message', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return fakeResponse(400, { code: 'validation_error', message: 'nope' });
  };
  await assert.rejects(notionRequest('u', {}, { fetchImpl, sleep: async () => {} }), /validation_error/);
  assert.equal(calls, 1);
});

test('notionRequest gives up after its attempts and says what Notion last answered', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return fakeResponse(503, '<!DOCTYPE html>');
  };
  await assert.rejects(notionRequest('u', {}, { fetchImpl, sleep: async () => {}, attempts: 3 }), /Notion 503: <!DOCTYPE/);
  assert.equal(calls, 3);
});
