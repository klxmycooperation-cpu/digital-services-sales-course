import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const stillDirectory = resolve(here, '../tmp/site-stills');

export const requiredStills = Object.freeze([
  'decrypted-prologue',
  'black-monolith-line',
  'black-monolith-open',
  'black-monolith-orbit',
  'black-monolith-entry',
  'option-wheel',
  'scroll-float',
  'strands',
  'laser-flow',
  'ascii-text',
  'splash-cursor',
  'border-glow',
  'galaxy',
]);

export const stillBySlide = Object.freeze({
  1: 'decrypted-prologue',
  2: 'black-monolith-line',
  6: 'black-monolith-open',
  8: 'strands',
  13: 'option-wheel',
  18: 'scroll-float',
  19: 'splash-cursor',
  29: 'ascii-text',
  35: 'laser-flow',
  43: 'border-glow',
  52: 'galaxy',
  59: 'black-monolith-orbit',
  60: 'black-monolith-entry',
});

export async function loadVisualAssets() {
  const assets = new Map();
  for (const name of requiredStills) {
    const bytes = await readFile(resolve(stillDirectory, `${name}.png`));
    assets.set(name, new Uint8Array(bytes));
  }
  return assets;
}
