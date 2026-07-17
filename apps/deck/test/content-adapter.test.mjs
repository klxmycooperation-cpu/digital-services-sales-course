import assert from 'node:assert/strict';
import test from 'node:test';

import { course, modules, steps } from '@sales-course/content';

import { buildDeckSpecs, buildStepSpeakerNotes } from '../src/content-adapter.mjs';

test('deck plan is exactly 4 framing slides plus 28 canonical steps', () => {
  const specs = buildDeckSpecs(course, modules, steps);
  assert.equal(specs.length, 32);
  assert.deepEqual(specs.slice(0, 4).map((item) => item.kind), ['cover', 'outcomes', 'map', 'mechanics']);
  assert.deepEqual(specs.slice(4).map((item) => item.step.id), steps.map((step) => step.id));
});

test('every step slide is concise and keeps the required learning order', () => {
  const specs = buildDeckSpecs(course, modules, steps).slice(4);
  const expectedLabels = ['Зачем', 'Понять', 'Пример', 'Сделать', 'Результат', 'Дальше'];
  for (const spec of specs) {
    assert.deepEqual(spec.blocks.map((block) => block.label), expectedLabels, spec.step.id);
    assert.ok(spec.visibleWordCount >= 45 && spec.visibleWordCount <= 60,
      `${spec.step.id}: ${spec.visibleWordCount} visible words`);
    assert.equal(spec.blocks.some((block) => block.text.includes('…')), false, `${spec.step.id}: no clipped copy`);
  }
});

test('speaker notes preserve full canonical teaching content and sources', () => {
  const specs = buildDeckSpecs(course, modules, steps).slice(4);
  for (const spec of specs) {
    const notes = buildStepSpeakerNotes(spec);
    assert.ok(notes.includes(spec.step.why), `${spec.step.id}: why`);
    assert.ok(notes.includes(spec.step.example.body), `${spec.step.id}: example`);
    assert.ok(notes.includes(spec.step.action.task), `${spec.step.id}: task`);
    assert.ok(notes.includes(spec.step.action.output), `${spec.step.id}: output`);
    assert.ok(notes.includes(spec.step.action.doneWhen), `${spec.step.id}: doneWhen`);
    for (const source of spec.step.sources) assert.ok(notes.includes(source.url), `${spec.step.id}: source`);
  }
});
