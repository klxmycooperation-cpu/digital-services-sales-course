import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { course, modules, steps } from '@sales-course/content';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const verifierPath = join(scriptsDirectory, 'verify-content-parity.mjs');
let temporaryDirectory;

function canonicalManifest() {
  return {
    schemaVersion: 2,
    courseId: course.id,
    title: course.title,
    moduleCount: modules.length,
    stepCount: steps.length,
    course,
    modules,
    steps,
  };
}

function writeJson(name, value) {
  const path = join(temporaryDirectory, name);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path;
}

function runVerifier(site, deck, report = join(temporaryDirectory, 'report.json')) {
  return spawnSync(process.execPath, [
    verifierPath,
    '--site', site,
    '--deck', deck,
    '--report', report,
  ], {
    cwd: temporaryDirectory,
    encoding: 'utf8',
  });
}

before(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'sales-course-parity-v2-'));
});

after(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('accepts byte-equivalent canonical v2 site and deck manifests', () => {
  const site = writeJson('site.json', canonicalManifest());
  const deck = writeJson('deck.json', canonicalManifest());
  const report = join(temporaryDirectory, 'canonical-report.json');
  const result = runVerifier(site, deck, report);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /7 modules, 28 steps/i);
  const parsed = JSON.parse(readFileSync(report, 'utf8'));
  assert.deepEqual({ ...parsed, siteSha256: '<hash>', deckSha256: '<hash>' }, {
    status: 'PASS',
    schemaVersion: 2,
    moduleCount: 7,
    stepCount: 28,
    comparedSections: ['course', 'modules', 'steps'],
    siteSha256: '<hash>',
    deckSha256: '<hash>',
    exactFileMatch: true,
  });
  assert.match(parsed.siteSha256, /^[a-f0-9]{64}$/);
  assert.equal(parsed.deckSha256, parsed.siteSha256);
});

test('rejects a deck manifest whose learner-visible step differs', () => {
  const siteManifest = canonicalManifest();
  const deckManifest = structuredClone(siteManifest);
  deckManifest.steps[0].why = 'Изменённая версия, которой нет на сайте.';
  const result = runVerifier(
    writeJson('site-mismatch.json', siteManifest),
    writeJson('deck-mismatch.json', deckManifest),
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /deck manifest differs|canonical course content/i);
});

test('rejects the legacy schemaVersion 1 lessons manifest', () => {
  const legacy = {
    schemaVersion: 1,
    courseId: 'digital-services-sales-system-2026',
    title: 'Система продаж цифровых услуг',
    lessonCount: 60,
    lessons: [],
  };
  const result = runVerifier(
    writeJson('site-legacy.json', legacy),
    writeJson('deck-legacy.json', legacy),
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /schemaVersion|canonical course content/i);
});
