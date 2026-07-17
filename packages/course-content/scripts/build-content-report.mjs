import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { course, coverageMatrix, modules, steps, validation } from '../src/index.mjs';
import { SOURCES, videoEvidence } from '../src/sources.mjs';

const WPM = 180;
const checkedAt = '2026-07-15';
const timestampWindowPattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/u;
const numericRevenuePattern = /(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))[^.!?]{0,40}\d|\d[^.!?]{0,40}(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))/iu;
const researchLedger = JSON.parse(readFileSync(
  new URL('../../../research/source-ledger.json', import.meta.url),
  'utf8',
));
const registeredUrls = new Set(researchLedger.claims.map((claim) => claim.url));
const words = (value) => String(value).trim().split(/\s+/u).filter(Boolean).length;

function stepWordCount(step) {
  return words([
    step.title,
    step.why,
    ...step.understand,
    step.action.label,
    step.action.task,
    step.action.output,
    step.action.doneWhen,
    step.example.title,
    step.example.body,
    step.focusPhrase,
    ...step.tools.flatMap((tool) => [tool.title, tool.description, tool.content]),
  ].join(' '));
}

function validEvidenceRecord(evidence, sourceUrl) {
  return evidence
    && evidence.sourceUrl === sourceUrl
    && typeof evidence.summary === 'string'
    && evidence.summary.trim().length > 0
    && Array.isArray(evidence.timestampWindows)
    && evidence.timestampWindows.length > 0
    && evidence.timestampWindows.every((window) => timestampWindowPattern.test(window));
}

export function isRegisteredSource(source) {
  if (source.type === 'case') {
    if (!Array.isArray(source.evidenceIds) || source.evidenceIds.length === 0) return false;
    return source.evidenceIds.every((id) => validEvidenceRecord(videoEvidence[id], source.url));
  }
  return registeredUrls.has(source.url);
}

function sourceProblems() {
  const invalid = [];
  const unregistered = [];
  const unresolvedEvidence = [];
  const scopeViolations = [];
  const numericVideoClaims = [];

  for (const step of steps) {
    for (const source of step.sources) {
      try {
        const url = new URL(source.url);
        if (!['http:', 'https:'].includes(url.protocol)
          || source.checkedAt !== checkedAt
          || !source.title?.trim()
          || !source.usage?.trim()
          || !['official', 'method', 'policy', 'law', 'case'].includes(source.type)
          || (source.type === 'case' && (!Array.isArray(source.evidenceIds) || source.evidenceIds.length === 0))) {
          invalid.push(`${step.id}:${source.url}`);
        }
      } catch {
        invalid.push(`${step.id}:${source.url}`);
      }

      if (!isRegisteredSource(source)) {
        unregistered.push(`${step.id}:${source.url}`);
      }

      if (source.type === 'case') {
        for (const evidenceId of source.evidenceIds ?? []) {
          if (!validEvidenceRecord(videoEvidence[evidenceId], source.url)) {
            unresolvedEvidence.push(`${step.id}:${evidenceId}`);
          }
        }
      }

      if (source.url === SOURCES.market.url && ['deal', 'repeat'].includes(step.moduleId)) {
        scopeViolations.push(`${step.id}:market-segmentation-source`);
      }
    }

    if (step.sources.some((source) => source.type === 'case') && numericRevenuePattern.test(JSON.stringify(step))) {
      numericVideoClaims.push(step.id);
    }
  }

  for (const evidence of Object.values(videoEvidence)) {
    if (numericRevenuePattern.test(evidence.summary)) numericVideoClaims.push(evidence.id);
  }

  return { invalid, unregistered, unresolvedEvidence, scopeViolations, numericVideoClaims };
}

export function buildReport() {
  const covered = coverageMatrix.flatMap((row) => row.stepIds);
  const coverageCounts = new Map();
  covered.forEach((id) => coverageCounts.set(id, (coverageCounts.get(id) ?? 0) + 1));
  const missingSteps = steps
    .map((step) => step.id)
    .filter((id) => coverageCounts.get(id) !== 1);
  const unknownCoveredSteps = covered.filter((id) => !steps.some((step) => step.id === id));
  missingSteps.push(...unknownCoveredSteps.map((id) => `unknown:${id}`));

  const sourceTrace = sourceProblems();
  const artifactOwners = new Map();
  const missingModules = modules
    .filter((module) => typeof module.artifact !== 'string' || !module.artifact.trim())
    .map((module) => module.id);
  const duplicateModules = [];
  for (const module of modules) {
    const artifact = module.artifact?.trim().toLocaleLowerCase('ru');
    if (!artifact) continue;
    if (artifactOwners.has(artifact)) duplicateModules.push(artifactOwners.get(artifact), module.id);
    else artifactOwners.set(artifact, module.id);
  }
  const totalWords = steps.reduce((total, step) => total + stepWordCount(step), 0);
  const totalMinutes = Number((totalWords / WPM).toFixed(1));
  const longestStepWords = Math.max(...steps.map(stepWordCount));
  const structurePass = validation.moduleCount === 7
    && validation.stepCount === 28
    && validation.diagnosticCount === 4
    && course.moduleIds.length === 7
    && modules.every((module) => module.stepIds.length === 4);
  const coveragePass = coverageMatrix.length === 7 && missingSteps.length === 0;
  const sourcesPass = sourceTrace.invalid.length === 0
    && sourceTrace.unregistered.length === 0
    && sourceTrace.unresolvedEvidence.length === 0
    && sourceTrace.scopeViolations.length === 0
    && sourceTrace.numericVideoClaims.length === 0;
  const artifactsPass = missingModules.length === 0 && duplicateModules.length === 0;
  const durationPass = totalMinutes <= 45 && longestStepWords <= 180;

  return {
    status: structurePass && coveragePass && sourcesPass && artifactsPass && durationPass ? 'pass' : 'fail',
    checkedAt,
    modules: validation.moduleCount,
    steps: validation.stepCount,
    diagnostics: validation.diagnosticCount,
    coverageRows: coverageMatrix.length,
    coverage: { missingSteps },
    artifacts: { missingModules, duplicateModules: [...new Set(duplicateModules)] },
    sourceTrace: {
      reviewedLedgerClaims: researchLedger.claims.length,
      references: validation.sourceReferenceCount,
      videoCaseReferences: steps.reduce(
        (total, step) => total + step.sources.filter((source) => source.type === 'case').length,
        0,
      ),
      videoEvidenceClaims: Object.keys(videoEvidence).length,
      invalid: sourceTrace.invalid,
      unregistered: sourceTrace.unregistered,
      unresolvedEvidence: sourceTrace.unresolvedEvidence,
      scopeViolations: sourceTrace.scopeViolations,
      numericVideoClaims: sourceTrace.numericVideoClaims,
    },
    duration: {
      wordsPerMinute: WPM,
      totalWords,
      totalMinutes,
      longestStepWords,
    },
  };
}

export async function writeReport() {
  const report = buildReport();
  const output = new URL('../tmp/content-report.json', import.meta.url);
  await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'w' });
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await writeReport();
  console.log(JSON.stringify(report));
  if (report.status !== 'pass') process.exitCode = 1;
}
