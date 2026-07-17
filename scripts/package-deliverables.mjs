import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import {
  chmod,
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { verifyContentParity } from './verify-content-parity.mjs';
import { verifyDeckOutput } from './verify-deck-output.mjs';

const execFileAsync = promisify(execFile);
const defaultProjectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutputRoot = resolve(defaultProjectRoot, 'release');
const pptxName = 'systema-prodazh-cifrovyh-uslug-2026.pptx';
const siteName = 'systema-prodazh-cifrovyh-uslug-site';
const zipName = `${siteName}.zip`;

const finalNames = Object.freeze([
  pptxName,
  siteName,
  zipName,
  'previews',
  'QA-REPORT.md',
  'README.md',
  'CHECKSUMS.sha256',
]);

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function refuseExistingTargets(outputRoot) {
  for (const name of finalNames) {
    const target = resolve(outputRoot, name);
    if (await exists(target)) throw new Error(`Refusing to overwrite existing output: ${target}`);
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

function finalReadme() {
  return [
    '# Система продаж цифровых услуг',
    '',
    `- \`${pptxName}\` — презентация: 32 слайда и заметки спикера.`,
    `- \`${siteName}/\` — готовый локальный сайт с 7 модулями и 28 шагами.`,
    `- \`${zipName}\` — переносимая копия сайта.`,
    '- `previews/` — контрольные изображения презентации.',
    '- `QA-REPORT.md` — проверка v2 parity и deck output.',
    '- `CHECKSUMS.sha256` — SHA-256 основных артефактов.',
    '',
  ].join('\n');
}

function finalQaReport(parity, deck) {
  return [
    '# Final QA Report',
    '',
    '**Status:** PASS',
    '',
    `- Content parity: PASS — schemaVersion ${parity.schemaVersion}; ${parity.moduleCount} модулей, ${parity.stepCount} шагов; canonical \`course/modules/steps\` совпадают.`,
    `- Manifest files: ${parity.exactFileMatch ? 'PASS — JSON-файлы сайта и презентации byte-equivalent.' : 'PASS — данные совпадают; форматирование JSON различается.'}`,
    `- Deck structure: PASS — ${deck.slides} слайда, ${deck.speakerNotes} блока заметок, ${deck.layoutFiles} layout-файла, ${deck.renderedPreviews} preview-файла.`,
    `- Deck geometry: PASS — ${deck.geometryErrors.length} выходов за canvas; ${deck.textLayoutErrors.length} ошибок text layout.`,
    `- Intentional full-bleed: ${deck.intentionalBleedElements} именованных Galaxy-nebula elements проверены отдельно.`,
    `- Editability: ${deck.editableShapes} editable shape/textbox records; embedded images: ${deck.embeddedImages}.`,
    '- Package safety: PASS — существующие final-targets не перезаписываются.',
    '- Local license files: included — third-party notices и React Bits license находятся в папке сайта.',
    '',
    'Browser QA и production build запускаются отдельно перед окончательной передачей; этот отчёт их не подменяет.',
    '',
  ].join('\n');
}

async function buildStagedPackage({ projectRoot, stagingRoot, parity, deck }) {
  const deckRoot = resolve(projectRoot, 'apps/deck/build');
  const siteSource = resolve(projectRoot, 'apps/site/dist');
  const stagedPptx = resolve(stagingRoot, pptxName);
  const stagedSite = resolve(stagingRoot, siteName);
  const stagedZip = resolve(stagingRoot, zipName);
  const stagedPreviews = resolve(stagingRoot, 'previews');
  const stagedQa = resolve(stagingRoot, 'QA-REPORT.md');

  await copyFile(resolve(deckRoot, pptxName), stagedPptx);
  await cp(siteSource, stagedSite, { recursive: true });
  await copyFile(resolve(projectRoot, 'apps/site/package/README.md'), resolve(stagedSite, 'README.md'));
  await copyFile(resolve(projectRoot, 'apps/site/package/start.command'), resolve(stagedSite, 'start.command'));
  await chmod(resolve(stagedSite, 'start.command'), 0o755);
  await copyFile(resolve(projectRoot, 'apps/site/THIRD_PARTY_NOTICES.md'), resolve(stagedSite, 'THIRD_PARTY_NOTICES.md'));
  await mkdir(resolve(stagedSite, 'licenses'), { recursive: true });
  await copyFile(
    resolve(projectRoot, 'apps/site/licenses/React-Bits-LICENSE.md'),
    resolve(stagedSite, 'licenses/React-Bits-LICENSE.md'),
  );

  await mkdir(stagedPreviews, { recursive: true });
  await copyFile(resolve(deckRoot, 'deck-contact-sheet.png'), resolve(stagedPreviews, 'deck-contact-sheet.png'));
  await copyFile(resolve(deckRoot, 'deck-montage.webp'), resolve(stagedPreviews, 'deck-montage.webp'));

  await execFileAsync('/usr/bin/ditto', ['-c', '-k', '--keepParent', stagedSite, stagedZip]);
  await writeFile(resolve(stagingRoot, 'README.md'), finalReadme(), 'utf8');
  await writeFile(stagedQa, finalQaReport(parity, deck), 'utf8');

  const packagedManifest = JSON.parse(await readFile(resolve(stagedSite, 'course-manifest.json'), 'utf8'));
  if (packagedManifest.schemaVersion !== 2 || packagedManifest.moduleCount !== 7 || packagedManifest.stepCount !== 28) {
    throw new Error('Packaged site manifest must contain schemaVersion 2, 7 modules, and 28 steps.');
  }
  const [pptxStats, zipStats, indexStats] = await Promise.all([
    stat(stagedPptx),
    stat(stagedZip),
    stat(resolve(stagedSite, 'index.html')),
  ]);
  if (pptxStats.size <= 0 || zipStats.size <= 0 || indexStats.size <= 0) {
    throw new Error('Packaged deliverable size check failed.');
  }

  const checksumPaths = [
    stagedPptx,
    stagedZip,
    stagedQa,
    resolve(stagedSite, 'course-manifest.json'),
  ];
  const checksumLines = [];
  for (const path of checksumPaths) {
    const relative = path.startsWith(`${stagingRoot}/`) ? path.slice(stagingRoot.length + 1) : basename(path);
    checksumLines.push(`${await sha256(path)}  ${relative}`);
  }
  await writeFile(resolve(stagingRoot, 'CHECKSUMS.sha256'), `${checksumLines.join('\n')}\n`, 'utf8');
}

export async function packageDeliverables({
  projectRoot = defaultProjectRoot,
  outputRoot = defaultOutputRoot,
  minimumPptxBytes = 100_000,
} = {}) {
  const deckRoot = resolve(projectRoot, 'apps/deck/build');
  const qaRoot = resolve(projectRoot, 'qa');

  await refuseExistingTargets(outputRoot);
  const parity = await verifyContentParity({
    sitePath: resolve(projectRoot, 'apps/site/dist/course-manifest.json'),
    deckPath: resolve(deckRoot, 'course-manifest.json'),
    reportPath: resolve(qaRoot, 'parity-report.json'),
  });
  const deck = await verifyDeckOutput({
    artifactsPath: deckRoot,
    reportPath: resolve(qaRoot, 'deck-report.json'),
    minimumPptxBytes,
  });

  await mkdir(outputRoot, { recursive: true });
  const stagingRoot = await mkdtemp(resolve(outputRoot, '.deliverables-v2-'));
  try {
    await buildStagedPackage({ projectRoot, stagingRoot, parity, deck });
    await refuseExistingTargets(outputRoot);
    for (const name of finalNames) {
      await rename(resolve(stagingRoot, name), resolve(outputRoot, name));
    }
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }

  return { outputRoot, parity, deck };
}

function parseArguments(argv) {
  const options = {
    projectRoot: defaultProjectRoot,
    outputRoot: defaultOutputRoot,
    minimumPptxBytes: 100_000,
  };
  const mapping = {
    '--project-root': 'projectRoot',
    '--output-dir': 'outputRoot',
    '--min-pptx-bytes': 'minimumPptxBytes',
  };

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!(flag in mapping) || value === undefined) {
      throw new Error('Usage: package-deliverables.mjs [--project-root PATH] [--output-dir PATH] [--min-pptx-bytes N]');
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
    const result = await packageDeliverables(parseArguments(process.argv.slice(2)));
    console.log(`Packaged deliverables: ${result.outputRoot}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
