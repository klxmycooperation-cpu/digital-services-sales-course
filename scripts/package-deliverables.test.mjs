import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { course, modules, steps } from '@sales-course/content';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const packagerPath = join(scriptsDirectory, 'package-deliverables.mjs');
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

function write(path, content = 'fixture') {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function writeDeckArtifacts(projectRoot, manifest = canonicalManifest()) {
  const root = join(projectRoot, 'apps/deck/build');
  for (let index = 1; index <= 32; index += 1) {
    const stem = `slide-${String(index).padStart(2, '0')}`;
    write(join(root, 'layout', `${stem}.layout.json`), JSON.stringify({
      elements: [{ name: `${stem}-panel`, geometry: 'rect', bbox: [20, 20, 1240, 680] }],
    }));
    write(join(root, 'preview', `${stem}.png`), Buffer.from([137, 80, 78, 71]));
  }
  const inspectRows = [];
  for (let index = 1; index <= 32; index += 1) {
    inspectRows.push({ kind: 'slide', slide: index });
    inspectRows.push({ kind: 'shape', slide: index });
    inspectRows.push({ kind: 'notes', slide: index, text: 'Useful notes.' });
  }
  write(
    join(root, 'systema-prodazh-cifrovyh-uslug-2026.pptx.inspect.ndjson'),
    `${inspectRows.map((row) => JSON.stringify(row)).join('\n')}\n`,
  );
  write(join(root, 'systema-prodazh-cifrovyh-uslug-2026.pptx'), Buffer.alloc(64));
  write(join(root, 'course-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  write(join(root, 'deck-contact-sheet.png'), Buffer.from([137, 80, 78, 71]));
  write(join(root, 'deck-montage.webp'), Buffer.from('RIFFfixtureWEBP'));
}

function writeProjectFixture(name, { deckManifest = canonicalManifest() } = {}) {
  const projectRoot = join(temporaryDirectory, name);
  const manifest = canonicalManifest();
  write(join(projectRoot, 'apps/site/dist/index.html'), '<!doctype html><title>Course</title>');
  write(join(projectRoot, 'apps/site/dist/404.html'), '<!doctype html><title>404</title>');
  write(join(projectRoot, 'apps/site/dist/course-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  write(join(projectRoot, 'apps/site/package/README.md'), '# Local site\n');
  write(join(projectRoot, 'apps/site/package/start.command'), '#!/bin/zsh\n');
  write(join(projectRoot, 'apps/site/THIRD_PARTY_NOTICES.md'), '# Notices\n');
  write(join(projectRoot, 'apps/site/licenses/React-Bits-LICENSE.md'), 'MIT\n');
  writeDeckArtifacts(projectRoot, deckManifest);
  return projectRoot;
}

function runPackager(projectRoot, outputRoot) {
  return spawnSync(process.execPath, [
    packagerPath,
    '--project-root', projectRoot,
    '--output-dir', outputRoot,
    '--min-pptx-bytes', '1',
  ], {
    cwd: temporaryDirectory,
    encoding: 'utf8',
  });
}

before(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'sales-course-package-v2-'));
});

after(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('packages the v2 deck and site without legacy stills or lesson claims', () => {
  const projectRoot = writeProjectFixture('project-valid');
  const outputRoot = join(temporaryDirectory, 'outputs-valid');
  const result = runPackager(projectRoot, outputRoot);

  assert.equal(result.status, 0, result.stderr);
  const expected = [
    'systema-prodazh-cifrovyh-uslug-2026.pptx',
    'systema-prodazh-cifrovyh-uslug-site/index.html',
    'systema-prodazh-cifrovyh-uslug-site/course-manifest.json',
    'systema-prodazh-cifrovyh-uslug-site.zip',
    'previews/deck-contact-sheet.png',
    'previews/deck-montage.webp',
    'QA-REPORT.md',
    'README.md',
    'CHECKSUMS.sha256',
  ];
  for (const relativePath of expected) {
    assert.ok(statSync(join(outputRoot, relativePath)).size > 0, relativePath);
  }

  const readme = readFileSync(join(outputRoot, 'README.md'), 'utf8');
  const qa = readFileSync(join(outputRoot, 'QA-REPORT.md'), 'utf8');
  assert.match(readme, /32 слайда/i);
  assert.match(qa, /7 модулей, 28 шагов/i);
  assert.doesNotMatch(`${readme}\n${qa}`, /60 урок|13 изображ|site-stills|MacBook/i);
});

test('refuses to overwrite an existing final target', () => {
  const projectRoot = writeProjectFixture('project-overwrite');
  const outputRoot = join(temporaryDirectory, 'outputs-overwrite');
  mkdirSync(outputRoot, { recursive: true });
  const pptx = join(outputRoot, 'systema-prodazh-cifrovyh-uslug-2026.pptx');
  writeFileSync(pptx, 'keep me', 'utf8');

  const result = runPackager(projectRoot, outputRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing to overwrite existing output/i);
  assert.equal(readFileSync(pptx, 'utf8'), 'keep me');
});

test('fails parity before creating final output files', () => {
  const badManifest = canonicalManifest();
  badManifest.steps = structuredClone(badManifest.steps);
  badManifest.steps[0].title = 'Different deck title';
  const projectRoot = writeProjectFixture('project-mismatch', { deckManifest: badManifest });
  const outputRoot = join(temporaryDirectory, 'outputs-mismatch');

  const result = runPackager(projectRoot, outputRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /deck manifest differs|canonical course content/i);
  assert.equal(existsSync(join(outputRoot, 'systema-prodazh-cifrovyh-uslug-2026.pptx')), false);
});
