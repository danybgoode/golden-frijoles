import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkQuarantine, entriesFromListJson, offServerFiles } from './check-quarantine.mjs';

const TODAY = '2026-10-04';
const q = (description, tagged = true) => ({
  id: 'x.spec.ts:1 › t',
  file: 'x.spec.ts',
  projects: ['authed'],
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
    {
      id: 'a.spec.ts:3 › t',
      file: 'a.spec.ts',
      projects: ['api', 'authed'],
      tagged: true,
      notes: ['owner=D expires=2026-10-10'],
    },
    { id: 'a.spec.ts:9 › u', file: 'a.spec.ts', projects: [], tagged: false, notes: [] },
  ]);
});

test('the description must be the whole string, with a real date', () => {
  assert.match(checkQuarantine([q('x owner=D expires=2026-10-10')], TODAY).problems[0], /is not "owner=/);
  assert.match(checkQuarantine([q('owner=D expires=2026-10-10 x')], TODAY).problems[0], /is not "owner=/);
  assert.match(checkQuarantine([q('owner=D expires=2026-10-32')], TODAY).problems[0], /a real date/);
  assert.match(checkQuarantine([q('owner=D expires=2026-02-30')], TODAY).problems[0], /a real date/);
});

test('two quarantine annotations on one test are refused', () => {
  const e = {
    ...q('owner=D expires=2026-10-10'),
    notes: ['owner=D expires=2026-10-10', 'owner=E expires=2026-10-11'],
  };
  assert.match(checkQuarantine([e], TODAY).problems[0], /exactly one annotation/);
});

test('only quarantine annotations count: another annotation type is not a quarantine', () => {
  const json = {
    suites: [
      {
        specs: [
          {
            title: 't',
            file: 'a.spec.ts',
            line: 1,
            tags: [],
            tests: [
              {
                projectName: 'api',
                annotations: [{ type: 'issue', description: 'owner=D expires=2026-10-10' }],
              },
            ],
          },
        ],
      },
    ],
  };
  assert.deepEqual(checkQuarantine(entriesFromListJson(json), TODAY), { quarantined: [], problems: [] });
});

test('a test the quarantine job cannot run is refused: browser project, or an OFF-server file', () => {
  const browser = { ...q('owner=D expires=2026-10-10'), projects: ['browser'] };
  assert.match(checkQuarantine([browser], TODAY).problems[0], /project browser/);
  const dark = { ...q('owner=D expires=2026-10-10'), file: 'journey-dark.spec.ts' };
  assert.match(
    checkQuarantine([dark], TODAY, { forbiddenFiles: ['journey-dark.spec.ts'] }).problems[0],
    /OFF server/
  );
});

test('offServerFiles reads the files ci.yml names', () => {
  const yml =
    'run: |\n  x \\\n    apps/web/e2e/journey-dark.spec.ts \\\n    apps/web/e2e/signup.spec.ts \\\n';
  assert.deepEqual(offServerFiles(yml), ['journey-dark.spec.ts', 'signup.spec.ts']);
});

test('the 30-day cap is computed in UTC, whatever the machine timezone', () => {
  const tz = process.env.TZ;
  process.env.TZ = 'Asia/Tokyo';
  try {
    assert.deepEqual(checkQuarantine([q('owner=D expires=2026-11-03')], TODAY).problems, []);
    assert.match(checkQuarantine([q('owner=D expires=2026-11-04')], TODAY).problems[0], /more than 30 days/);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});
