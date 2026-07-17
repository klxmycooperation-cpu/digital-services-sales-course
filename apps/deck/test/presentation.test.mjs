import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPresentation } from '../src/build-deck.mjs';

test('builder creates 32 editable slides with visible speaker notes', () => {
  const { presentation, specs } = buildPresentation();
  assert.equal(presentation.slides.items.length, 32);
  assert.equal(specs.length, 32);
  for (const slide of presentation.slides.items) {
    assert.equal(slide.speakerNotes.isVisible(), true);
    assert.ok(slide.shapes.items.length > 0);
  }
});

test('deck contains one and only one slide for each canonical course step', () => {
  const { specs } = buildPresentation();
  const stepSpecs = specs.filter((spec) => spec.kind === 'step');
  assert.equal(stepSpecs.length, 28);
  assert.equal(new Set(stepSpecs.map((spec) => spec.step.id)).size, 28);
  assert.equal(stepSpecs[0].step.id, 'system-value');
  assert.equal(stepSpecs.at(-1).step.id, 'repeat-system');
});
