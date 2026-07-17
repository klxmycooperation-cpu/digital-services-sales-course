import assert from 'node:assert/strict';
import test from 'node:test';

import { steps } from '../src/index.mjs';

const WPM = 180;
const words = (value) => String(value).trim().split(/\s+/u).filter(Boolean).length;
const stepWords = (step) => words([
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

export function readingMetrics() {
  const totalWords = steps.reduce((total, step) => total + stepWords(step), 0);
  return {
    wordsPerMinute: WPM,
    totalWords,
    totalMinutes: Number((totalWords / WPM).toFixed(1)),
    longestStepWords: Math.max(...steps.map(stepWords)),
  };
}

test('the complete core course remains below forty-five reading minutes', () => {
  const metrics = readingMetrics();
  assert.ok(metrics.totalMinutes <= 45, JSON.stringify(metrics));
});

test('no individual step becomes an encyclopaedic dump', () => {
  const metrics = readingMetrics();
  assert.ok(metrics.longestStepWords <= 180, JSON.stringify(metrics));
});
