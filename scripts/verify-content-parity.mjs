import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { course, modules, steps } from '@sales-course/content';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_PARITY_PATHS = Object.freeze({
  site: resolve(root, 'apps/site/dist/course-manifest.json'),
  deck: resolve(root, 'apps/deck/build/course-manifest.json'),
  report: resolve(root, 'qa/parity-report.json'),
});

export function createExpectedManifest() {
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

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export async function verifyContentParity({
  sitePath = DEFAULT_PARITY_PATHS.site,
  deckPath = DEFAULT_PARITY_PATHS.deck,
  reportPath = DEFAULT_PARITY_PATHS.report,
  writeReport = true,
} = {}) {
  const expected = createExpectedManifest();
  const [siteText, deckText] = await Promise.all([
    readFile(sitePath, 'utf8'),
    readFile(deckPath, 'utf8'),
  ]);
  const site = JSON.parse(siteText);
  const deck = JSON.parse(deckText);

  assert.deepEqual(site, expected, 'site manifest differs from canonical course content');
  assert.deepEqual(deck, expected, 'deck manifest differs from canonical course content');
  assert.deepEqual(site, deck, 'site and deck manifests differ');

  const report = {
    status: 'PASS',
    schemaVersion: expected.schemaVersion,
    moduleCount: expected.moduleCount,
    stepCount: expected.stepCount,
    comparedSections: ['course', 'modules', 'steps'],
    siteSha256: sha256(siteText),
    deckSha256: sha256(deckText),
    exactFileMatch: siteText === deckText,
  };

  if (writeReport) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  return report;
}

function parseArguments(argv) {
  const options = {
    sitePath: DEFAULT_PARITY_PATHS.site,
    deckPath: DEFAULT_PARITY_PATHS.deck,
    reportPath: DEFAULT_PARITY_PATHS.report,
  };
  const mapping = {
    '--site': 'sitePath',
    '--deck': 'deckPath',
    '--report': 'reportPath',
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!(flag in mapping) || !value) {
      throw new Error('Usage: verify-content-parity.mjs [--site PATH] [--deck PATH] [--report PATH]');
    }
    options[mapping[flag]] = resolve(value);
  }
  return options;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const report = await verifyContentParity(parseArguments(process.argv.slice(2)));
    console.log(`Content parity verified: ${report.moduleCount} modules, ${report.stepCount} steps, exactFileMatch=${report.exactFileMatch}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
