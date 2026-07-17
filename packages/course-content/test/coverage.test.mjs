import assert from 'node:assert/strict';
import test from 'node:test';

import { coverageMatrix, modules, steps } from '../src/index.mjs';

const expectedRequirements = {
  system: ['client-value', 'action-chain', 'b2b-decision', 'pipeline-diagnosis'],
  offer: ['30-day-niche', 'icp-trigger', 'minimal-solution', 'safe-proof'],
  companies: ['channel-roles', 'signals-base', 'regional-channel', 'seven-day-test-plan'],
  response: ['observation', 'first-message', 'channel-format', 'follow-up-stop-execution'],
  diagnosis: ['six-questions', 'budget-boundaries', 'process-behind-feature', 'decision-brief'],
  deal: ['proposal', 'pricing-payment', 'packages-objections', 'contract-prepayment'],
  repeat: ['handoff-acceptance', 'case-repeat-referral', 'crm-metrics-rhythm', '30-day-system'],
};

test('coverage matrix maps every module to four required learning outcomes', () => {
  assert.equal(coverageMatrix.length, 7);
  assert.deepEqual(coverageMatrix.map((row) => row.moduleId), modules.map((module) => module.id));

  for (const row of coverageMatrix) {
    assert.deepEqual(Object.keys(row).sort(), ['id', 'moduleId', 'requirements', 'stepIds']);
    assert.equal(row.id, `M${String(modules.find((module) => module.id === row.moduleId).index).padStart(2, '0')}`);
    assert.deepEqual(row.requirements, expectedRequirements[row.moduleId]);
    assert.equal(row.stepIds.length, 4);
  }
});

test('coverage matrix covers each canonical step exactly once and in course order', () => {
  const covered = coverageMatrix.flatMap((row) => row.stepIds);
  assert.deepEqual(covered, steps.map((step) => step.id));
  assert.equal(new Set(covered).size, 28);
});

test('every learning outcome produces an explicit artifact with a done condition', () => {
  for (const step of steps) {
    assert.ok(step.action.output.trim(), step.id);
    assert.ok(step.action.doneWhen.trim(), step.id);
    assert.ok(step.nextStepId !== undefined, step.id);
  }
});

test('legal and platform-sensitive channel steps keep provenance and caution', () => {
  const regional = steps.find((step) => step.id === 'companies-region');
  const followUp = steps.find((step) => step.id === 'response-follow-up');
  const urls = [...regional.sources, ...followUp.sources].map((source) => source.url).join(' ');

  assert.match(urls, /government\.ru/u);
  assert.match(urls, /etalonline\.by/u);
  assert.match(urls, /eur-lex\.europa\.eu/u);
  assert.match(urls, /ftc\.gov/u);
  assert.match(urls, /telegram\.org/u);
  assert.match(`${regional.why} ${followUp.why}`, /правил|останов/u);
});
