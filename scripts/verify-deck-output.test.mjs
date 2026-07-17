import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const verifierPath = join(scriptsDirectory, 'verify-deck-output.mjs');
let temporaryDirectory;

function writeDeckFixture(name, { slideCount = 32, overflow = false, noteCount = 32 } = {}) {
  const root = join(temporaryDirectory, name);
  const layout = join(root, 'layout');
  const preview = join(root, 'preview');
  mkdirSync(layout, { recursive: true });
  mkdirSync(preview, { recursive: true });

  for (let index = 1; index <= slideCount; index += 1) {
    const stem = `slide-${String(index).padStart(2, '0')}`;
    writeFileSync(join(layout, `${stem}.layout.json`), JSON.stringify({
      elements: [{
        name: `${stem}-panel`,
        geometry: 'rect',
        bbox: overflow && index === 1 ? [1270, 20, 40, 20] : [40, 40, 1200, 640],
      }, {
        name: `${stem}-rule`,
        kind: 'line',
        bbox: [40, 680, 1200, 0],
      }, {
        name: `galaxy-${index}-nebula-a`,
        kind: 'shape',
        bbox: [-20, 500, 100, 100],
      }],
    }));
    writeFileSync(join(preview, `${stem}.png`), Buffer.from([137, 80, 78, 71]));
  }

  const rows = [];
  for (let index = 1; index <= slideCount; index += 1) {
    rows.push({ kind: 'slide', slide: index });
    rows.push({ kind: 'shape', slide: index });
    if (index <= noteCount) rows.push({ kind: 'notes', slide: index, text: 'Useful notes.' });
  }
  writeFileSync(
    join(root, 'systema-prodazh-cifrovyh-uslug-2026.pptx.inspect.ndjson'),
    `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`,
    'utf8',
  );
  writeFileSync(join(root, 'systema-prodazh-cifrovyh-uslug-2026.pptx'), Buffer.alloc(64));
  return root;
}

function runVerifier(artifacts, report = join(temporaryDirectory, 'deck-report.json')) {
  return spawnSync(process.execPath, [
    verifierPath,
    '--artifacts', artifacts,
    '--report', report,
    '--min-pptx-bytes', '1',
  ], {
    cwd: temporaryDirectory,
    encoding: 'utf8',
  });
}

before(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'sales-course-deck-v2-'));
});

after(() => {
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('accepts the 32-slide v2 deck with one preview, layout, and note block per slide', () => {
  const artifacts = writeDeckFixture('valid');
  const report = join(temporaryDirectory, 'valid-report.json');
  const result = runVerifier(artifacts, report);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /32 slides, 32 notes/i);
  assert.deepEqual(JSON.parse(readFileSync(report, 'utf8')), {
    status: 'PASS',
    slides: 32,
    speakerNotes: 32,
    editableShapes: 32,
    embeddedImages: 0,
    layoutFiles: 32,
    renderedPreviews: 32,
    geometryErrors: [],
    textLayoutErrors: [],
    intentionalBleedElements: 32,
    pptxBytes: 64,
  });
});

test('rejects legacy or stale slide files beyond slide 32', () => {
  const result = runVerifier(writeDeckFixture('legacy', { slideCount: 60, noteCount: 60 }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /expected 32 slide layouts/i);
});

test('rejects canvas overflow', () => {
  const result = runVerifier(writeDeckFixture('overflow', { overflow: true }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /leave the canvas/i);
});

test('rejects a missing speaker-note block', () => {
  const result = runVerifier(writeDeckFixture('missing-note', { noteCount: 31 }));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /32 speaker-note blocks/i);
});
