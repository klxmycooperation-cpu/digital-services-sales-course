import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const expectedSlideCount = 32;

export const DEFAULT_DECK_PATHS = Object.freeze({
  artifacts: resolve(root, 'apps/deck/build'),
  report: resolve(root, 'qa/deck-report.json'),
});

function expectedSlideFiles(suffix) {
  return Array.from({ length: expectedSlideCount }, (_, index) => (
    `slide-${String(index + 1).padStart(2, '0')}${suffix}`
  ));
}

function parseInspectRows(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\n+/).map(JSON.parse) : [];
}

export async function verifyDeckOutput({
  artifactsPath = DEFAULT_DECK_PATHS.artifacts,
  reportPath = DEFAULT_DECK_PATHS.report,
  minimumPptxBytes = 100_000,
  writeReport = true,
} = {}) {
  const layoutDir = resolve(artifactsPath, 'layout');
  const previewDir = resolve(artifactsPath, 'preview');
  const inspectPath = resolve(artifactsPath, 'systema-prodazh-cifrovyh-uslug-2026.pptx.inspect.ndjson');
  const pptxPath = resolve(artifactsPath, 'systema-prodazh-cifrovyh-uslug-2026.pptx');

  const [layoutNames, previewNames, inspectText, pptxStats] = await Promise.all([
    readdir(layoutDir),
    readdir(previewDir),
    readFile(inspectPath, 'utf8'),
    stat(pptxPath),
  ]);
  const layoutFiles = layoutNames.filter((name) => name.endsWith('.layout.json')).sort();
  const previewFiles = previewNames.filter((name) => name.endsWith('.png')).sort();

  assert.equal(layoutFiles.length, expectedSlideCount, `expected ${expectedSlideCount} slide layouts`);
  assert.deepEqual(layoutFiles, expectedSlideFiles('.layout.json'), 'slide layout names are incomplete or non-canonical');
  assert.equal(previewFiles.length, expectedSlideCount, `expected ${expectedSlideCount} rendered slide previews`);
  assert.deepEqual(previewFiles, expectedSlideFiles('.png'), 'slide preview names are incomplete or non-canonical');
  assert.ok(pptxStats.size >= minimumPptxBytes, `PPTX is unexpectedly small: ${pptxStats.size} bytes`);

  const geometryErrors = [];
  const textLayoutErrors = [];
  const intentionalBleedElements = [];
  for (const file of layoutFiles) {
    const layout = JSON.parse(await readFile(resolve(layoutDir, file), 'utf8'));
    assert.ok(Array.isArray(layout.elements), `${file}: layout.elements must be an array`);
    for (const element of layout.elements) {
      const [left, top, width, height] = element.bbox || [];
      if (![left, top, width, height].every(Number.isFinite)) {
        geometryErrors.push({ file, name: element.name, reason: 'non-finite bbox' });
        continue;
      }
      const leavesCanvas = left < 0 || top < 0 || left + width > 1280 || top + height > 720;
      if (leavesCanvas) {
        const isNamedGalaxyBleed = element.kind === 'shape'
          && /^galaxy-\d+-nebula-[ab]$/.test(element.name || '');
        const intersectsCanvas = left + width > 0 && top + height > 0 && left < 1280 && top < 720;
        if (isNamedGalaxyBleed && intersectsCanvas) {
          intentionalBleedElements.push({ file, name: element.name, bbox: element.bbox });
        } else {
          geometryErrors.push({ file, name: element.name, bbox: element.bbox });
        }
      }
      const isLine = element.kind === 'line' || element.geometry === 'line';
      if (!isLine && (width <= 0 || height <= 0)) {
        geometryErrors.push({ file, name: element.name, reason: 'non-positive size', bbox: element.bbox });
      }
      if (element.text && (!element.textLayout || element.textLayout.lineCount < 1)) {
        textLayoutErrors.push({ file, name: element.name });
      }
    }
  }

  assert.deepEqual(geometryErrors, [], 'one or more slide elements leave the canvas');
  assert.deepEqual(textLayoutErrors, [], 'one or more text boxes have no rendered text layout');

  const inspectRows = parseInspectRows(inspectText);
  const count = (kind) => inspectRows.filter((row) => row.kind === kind).length;
  const counts = {
    slide: count('slide'),
    notes: count('notes'),
    shape: count('shape'),
    textbox: count('textbox'),
    image: count('image'),
  };
  assert.equal(counts.slide, expectedSlideCount, `PPTX inspect must report ${expectedSlideCount} slides`);
  assert.equal(counts.notes, expectedSlideCount, `PPTX inspect must report ${expectedSlideCount} speaker-note blocks`);
  assert.ok(counts.shape + counts.textbox > 0, 'PPTX inspect must report editable shapes or text boxes');

  const report = {
    status: 'PASS',
    slides: counts.slide,
    speakerNotes: counts.notes,
    editableShapes: counts.shape + counts.textbox,
    embeddedImages: counts.image,
    layoutFiles: layoutFiles.length,
    renderedPreviews: previewFiles.length,
    geometryErrors,
    textLayoutErrors,
    intentionalBleedElements: intentionalBleedElements.length,
    pptxBytes: pptxStats.size,
  };

  if (writeReport) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  return report;
}

function parseArguments(argv) {
  const options = {
    artifactsPath: DEFAULT_DECK_PATHS.artifacts,
    reportPath: DEFAULT_DECK_PATHS.report,
    minimumPptxBytes: 100_000,
  };
  const mapping = {
    '--artifacts': 'artifactsPath',
    '--report': 'reportPath',
    '--min-pptx-bytes': 'minimumPptxBytes',
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!(flag in mapping) || value === undefined) {
      throw new Error('Usage: verify-deck-output.mjs [--artifacts PATH] [--report PATH] [--min-pptx-bytes N]');
    }
    if (flag === '--min-pptx-bytes') {
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error('--min-pptx-bytes must be a positive integer');
      options.minimumPptxBytes = parsed;
    } else {
      options[mapping[flag]] = resolve(value);
    }
  }
  return options;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const report = await verifyDeckOutput(parseArguments(process.argv.slice(2)));
    console.log(`Deck verified: ${report.slides} slides, ${report.speakerNotes} notes, ${report.editableShapes} editable elements, no canvas overflow.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
