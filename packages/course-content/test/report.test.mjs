import assert from 'node:assert/strict';
import test from 'node:test';

import { buildReport, isRegisteredSource } from '../scripts/build-content-report.mjs';
import { videoEvidence } from '../src/index.mjs';

test('content report independently passes structure, coverage, sources, and duration', () => {
  const report = buildReport();
  assert.equal(report.status, 'pass');
  assert.deepEqual(
    {
      modules: report.modules,
      steps: report.steps,
      diagnostics: report.diagnostics,
      coverageRows: report.coverageRows,
    },
    { modules: 7, steps: 28, diagnostics: 4, coverageRows: 7 },
  );
  assert.deepEqual(report.coverage.missingSteps, []);
  assert.deepEqual(report.artifacts.missingModules, []);
  assert.deepEqual(report.artifacts.duplicateModules, []);
  assert.deepEqual(report.sourceTrace.invalid, []);
  assert.deepEqual(report.sourceTrace.unregistered, []);
  assert.deepEqual(report.sourceTrace.scopeViolations, []);
  assert.deepEqual(report.sourceTrace.unresolvedEvidence, []);
  assert.deepEqual(report.sourceTrace.numericVideoClaims, []);
  assert.ok(report.sourceTrace.reviewedLedgerClaims > 0);
  assert.equal(report.sourceTrace.references, 55);
  assert.equal(report.sourceTrace.videoCaseReferences, 4);
  assert.equal(report.sourceTrace.videoEvidenceClaims, 5);
  assert.ok(report.duration.totalMinutes <= 45);
  assert.ok(report.duration.longestStepWords <= 180);
});

test('case registration requires evidence IDs that resolve to the same source URL', () => {
  const evidence = videoEvidence['video-changed-process'];
  const base = {
    title: 'Видео-кейс',
    url: evidence.sourceUrl,
    checkedAt: '2026-07-15',
    type: 'case',
    usage: 'Используется как ограниченное наблюдение.',
  };

  assert.equal(isRegisteredSource({ ...base, evidenceIds: [] }), false);
  assert.equal(isRegisteredSource({ ...base, evidenceIds: [evidence.id] }), true);
  assert.equal(isRegisteredSource({ ...base, url: 'https://example.org/other', evidenceIds: [evidence.id] }), false);
  assert.equal(isRegisteredSource({ ...base, evidenceIds: ['missing-evidence'] }), false);
});
