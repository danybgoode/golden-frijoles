import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkQuarantine, entriesFromListJson } from './check-quarantine.mjs';

const TODAY = '2026-10-04';
const q = (description, tagged = true) => ({
  id: 'x.spec.ts:1 › t',
  tagged,
  notes: description == null ? [] : [description],
});

test('a future expiry within the cap passes and is listed', () => {
  const r = checkQuarantine([q('owner=Daniel expires=2026-11-03')], TODAY);
  assert.deepEqual(r.problems, []);
  assert.deepEqual(r.quarantined, [{ id: 'x.spec.ts:1 › t', owner: 'Daniel', expires: '2026-11-03' }]);
});

test('the expiry day itself still passes; the day after fails', () => {
  assert.deepEqual(checkQuarantine([q('owner=D expires=2026-10-04')], TODAY).problems, []);
  assert.match(checkQuarantine([q('owner=D expires=2026-10-03')], TODAY).problems[0], /expired 2026-10-03/);
});

test('more than 30 days out fails: a far date is a permanent quarantine', () => {
  assert.deepEqual(checkQuarantine([q('owner=D expires=2026-11-03')], TODAY).problems, []);
  assert.match(checkQuarantine([q('owner=D expires=2026-11-04')], TODAY).problems[0], /more than 30 days/);
});

test('a missing owner or date, a tag with no annotation, or an annotation with no tag all fail', () => {
  assert.match(checkQuarantine([q('expires=2026-10-10')], TODAY).problems[0], /is not "owner=/);
  assert.match(checkQuarantine([q(null)], TODAY).problems[0], /exactly one annotation/);
  assert.match(
    checkQuarantine([q('owner=D expires=2026-10-10', false)], TODAY).problems[0],
    /no @quarantine tag/
  );
});

test('ordinary tests are ignored', () => {
  assert.deepEqual(checkQuarantine([{ id: 'a', tagged: false, notes: [] }], TODAY), {
    quarantined: [],
    problems: [],
  });
});

test('entriesFromListJson merges one spec across projects and reads tags without the @', () => {
  const ann = { type: 'quarantine', description: 'owner=D expires=2026-10-10' };
  const json = {
    suites: [
      {
        specs: [],
        suites: [
          {
            specs: [
              {
                title: 't',
                file: 'a.spec.ts',
                line: 3,
                tags: ['quarantine'],
                tests: [
                  { projectName: 'api', annotations: [ann] },
                  { projectName: 'authed', annotations: [ann] },
                ],
              },
              { title: 'u', file: 'a.spec.ts', line: 9, tags: [], tests: [{ annotations: [] }] },
            ],
          },
        ],
      },
    ],
  };
  assert.deepEqual(entriesFromListJson(json), [
    { id: 'a.spec.ts:3 › t', tagged: true, notes: ['owner=D expires=2026-10-10'] },
    { id: 'a.spec.ts:9 › u', tagged: false, notes: [] },
  ]);
});
