#!/usr/bin/env node
// sdk-1-0 D5 — build the SDK twice, CommonJS (dist/cjs) and ESM (dist/esm), from one source.
//
// The source keeps extensionless relative imports (`./flags`), which bundlers and CommonJS resolve but Node's ESM loader
// does not. So after the ESM compile this adds the `.js` Node needs to every relative specifier in dist/esm, and marks
// each half with its own package.json `type`. Nothing is module-level state in the SDK, so the two copies a project may
// load (one per condition) cannot disagree.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const tsc = join(ROOT, 'node_modules', '.bin', 'tsc');
const tscBin = existsSync(tsc) ? tsc : join(ROOT, '..', '..', 'node_modules', '.bin', 'tsc');

/** Pure: a relative specifier with the `.js` (or `/index.js`) Node's ESM loader needs; anything else unchanged. */
export function withExtension(specifier, exists) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier;
  if (/\.(m?js|json)$/.test(specifier)) return specifier;
  if (exists(`${specifier}.js`)) return `${specifier}.js`;
  if (exists(`${specifier}/index.js`)) return `${specifier}/index.js`;
  return specifier;
}

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function main() {
  rmSync(DIST, { recursive: true, force: true });
  execFileSync(tscBin, ['-p', join(ROOT, 'tsconfig.build.json')], { stdio: 'inherit' });
  execFileSync(tscBin, ['-p', join(ROOT, 'tsconfig.esm.json')], { stdio: 'inherit' });
  const esm = join(DIST, 'esm');
  for (const file of walk(esm).filter((f) => f.endsWith('.js') || f.endsWith('.d.ts'))) {
    const dir = dirname(file);
    const text = readFileSync(file, 'utf8');
    const out = text.replace(/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g, (whole, lead, q, spec) => {
      const next = withExtension(spec, (rel) => existsSync(join(dir, rel)));
      return next === spec ? whole : `${lead}${q}${next}${q}`;
    });
    if (out !== text) writeFileSync(file, out);
  }
  writeFileSync(join(esm, 'package.json'), '{ "type": "module" }\n');
  writeFileSync(join(DIST, 'cjs', 'package.json'), '{ "type": "commonjs" }\n');
  console.log('sdk: built dist/cjs and dist/esm');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
