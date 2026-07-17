import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { theme } from '../src/theme.mjs';

test('Galaxy palette provides one coherent accent per module', () => {
  assert.equal(theme.moduleAccents.length, 7);
  assert.equal(new Set(theme.moduleAccents).size, 7);
  assert.ok(theme.moduleAccents.every((color) => /^#[0-9A-F]{6}$/u.test(color)));
});

test('v2 renderer uses editable native shapes, not legacy site screenshots', async () => {
  const source = await readFile(new URL('../src/render-slide.mjs', import.meta.url), 'utf8');
  assert.equal(source.includes('.images.add('), false);
  assert.equal(source.includes('site-stills'), false);
  assert.equal(source.includes('MacBook'), false);
  assert.equal(source.includes('Codex Grid'), false);
  assert.ok(source.includes("geometry: 'line'"));
  assert.ok(source.includes("geometry: 'textbox'"));
});
