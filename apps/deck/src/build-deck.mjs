import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Presentation, PresentationFile } from '@oai/artifact-tool';
import { course, modules, steps, validation } from '@sales-course/content';

import { buildDeckSpecs, buildStepSpeakerNotes } from './content-adapter.mjs';
import { renderDeckSlide } from './render-slide.mjs';
import { theme } from './theme.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '../../..');
const outputRoot = resolve(here, '../build');
const previewDir = resolve(outputRoot, 'preview');
const layoutDir = resolve(outputRoot, 'layout');
const pptxPath = resolve(outputRoot, 'systema-prodazh-cifrovyh-uslug-2026.pptx');
const manifestPath = resolve(outputRoot, 'course-manifest.json');
const siteManifestPath = resolve(projectRoot, 'apps/site/dist/course-manifest.json');
const inspectPath = resolve(outputRoot, 'systema-prodazh-cifrovyh-uslug-2026.pptx.inspect.ndjson');

async function writeBlob(path, blob) {
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function introSpeakerNotes(spec) {
  if (spec.kind === 'cover') {
    return [
      'ЦЕЛЬ КУРСА',
      'За короткий проход собрать управляемую систему продаж цифровых услуг: от наблюдаемой ценности до оплаты, старта и повторяемого результата.',
      '',
      'ГЛАВНАЯ МЫСЛЬ',
      'Не пытайтесь делать всё одновременно. В каждый момент нужен один подтверждённый факт и одно следующее действие.',
      '',
      'ПОДАЧА',
      'Говорите прямо, коротко и через реальные процессы клиента. Технология важна только после того, как понятна изменившаяся способность.',
    ].join('\n');
  }
  if (spec.kind === 'outcomes') {
    return [
      'РЕЗУЛЬТАТ КУРСА',
      'Каждый модуль заканчивается конкретным рабочим артефактом. Не нужно запоминать набор советов: достаточно последовательно собрать эти семь частей.',
      '',
      ...spec.modules.flatMap((module) => [
        `МОДУЛЬ ${module.index}. ${module.title}`,
        `Зачем: ${module.purpose}`,
        `Артефакт: ${module.artifact}`,
        '',
      ]),
      'ИТОГ',
      'Семь артефактов соединяются в личный 30-дневный ритм продаж, который можно повторять и менять по одному bottleneck за цикл.',
    ].join('\n');
  }
  if (spec.kind === 'map') {
    return [
      'КАК ЧИТАТЬ ПАУТИНУ',
      'В центре находится единая система продаж. Семь крупных узлов — модули. У каждого модуля четыре шага. Светящаяся внешняя цепочка показывает обязательную последовательность из 28 шагов.',
      '',
      ...spec.modules.flatMap((module) => [
        `${module.index}. ${module.title}: ${module.purpose}`,
        ...module.stepIds.map((stepId, index) => {
          const step = spec.steps.find((entry) => entry.id === stepId);
          return `  ${module.index}.${index + 1} ${step.title}`;
        }),
      ]),
      '',
      'ПРАВИЛО',
      'Связи помогают видеть целое, но работать нужно только с одним текущим шагом. После готового результата переходите к следующему узлу цепочки.',
    ].join('\n');
  }
  return [
    'МЕХАНИКА ОДНОГО ШАГА',
    'Каждый учебный слайд читается в одном и том же порядке.',
    '',
    '1. Зачем — объясняет смысл шага и риск пропуска.',
    '2. Понять — фиксирует два или три принципа без лишней теории.',
    '3. Пример — показывает конкретную сцену, формулировку или решение.',
    '4. Сделать — задаёт одно действие, которое можно выполнить сразу.',
    '5. Результат — называет артефакт и критерий готовности.',
    '6. Дальше — ведёт к следующему шагу курса.',
    '',
    'Полное объяснение, критерий готовности, инструмент и источники находятся в заметках докладчика. На экране остаётся только то, что нужно увидеть сейчас.',
  ].join('\n');
}

export function buildPresentation() {
  if (validation.moduleCount !== 7 || validation.stepCount !== 28) {
    throw new Error(`Canonical content is invalid: ${validation.moduleCount} modules / ${validation.stepCount} steps`);
  }
  const presentation = Presentation.create({ slideSize: theme.size });
  const specs = buildDeckSpecs(course, modules, steps);
  for (const spec of specs) {
    const slide = presentation.slides.add();
    renderDeckSlide(slide, spec);
    slide.speakerNotes.textFrame.setText(spec.kind === 'step' ? buildStepSpeakerNotes(spec) : introSpeakerNotes(spec));
    slide.speakerNotes.setVisible(true);
  }
  return { presentation, specs };
}

async function verifyAndCopyManifest() {
  const bytes = await readFile(siteManifestPath);
  const manifest = JSON.parse(bytes.toString('utf8'));
  if (manifest.schemaVersion !== 2 || manifest.moduleCount !== 7 || manifest.stepCount !== 28) {
    throw new Error('Site manifest is not canonical v2 (7 modules / 28 steps)');
  }
  if (JSON.stringify(manifest.course) !== JSON.stringify(course)
      || JSON.stringify(manifest.modules) !== JSON.stringify(modules)
      || JSON.stringify(manifest.steps) !== JSON.stringify(steps)) {
    throw new Error('Site manifest content differs from canonical course-content');
  }
  await writeFile(manifestPath, bytes);
}

export async function main() {
  await Promise.all([
    mkdir(outputRoot, { recursive: true }),
    mkdir(previewDir, { recursive: true }),
    mkdir(layoutDir, { recursive: true }),
  ]);
  const { presentation, specs } = buildPresentation();
  if (presentation.slides.items.length !== 32) throw new Error('Deck must contain exactly 32 slides');

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, '0')}`;
    await writeBlob(resolve(previewDir, `${stem}.png`), await presentation.export({ slide, format: 'png', scale: 2 }));
    const layout = await slide.export({ format: 'layout' });
    await writeFile(resolve(layoutDir, `${stem}.layout.json`), await layout.text(), 'utf8');
  }

  await writeBlob(resolve(outputRoot, 'deck-montage.webp'), await presentation.export({ format: 'webp', montage: true, scale: 1 }));
  const inspection = await presentation.inspect({
    kind: 'slide,textbox,shape,notes',
    maxChars: 500000,
  });
  await writeFile(inspectPath, `${inspection.ndjson.trim()}\n`, 'utf8');

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(pptxPath);
  await verifyAndCopyManifest();

  const noteWordCounts = specs.filter((spec) => spec.kind === 'step').map((spec) => buildStepSpeakerNotes(spec).split(/\s+/u).filter(Boolean).length);
  await writeFile(resolve(outputRoot, 'deck-report.txt'), [
    'Deck build report',
    `Slides: ${presentation.slides.items.length}/32`,
    `Modules: ${modules.length}/7`,
    `Steps: ${steps.length}/28`,
    `Speaker notes: ${presentation.slides.items.filter((slide) => slide.speakerNotes.isVisible()).length}/32`,
    `Rendered previews: ${presentation.slides.items.length}/32`,
    `Step notes word range: ${Math.min(...noteWordCounts)}-${Math.max(...noteWordCounts)}`,
    `PPTX: ${pptxPath}`,
    `Manifest: byte-equivalent to ${siteManifestPath}`,
  ].join('\n') + '\n', 'utf8');
  await writeFile(resolve(outputRoot, 'source-notes.txt'), [
    'Canonical source: packages/course-content (course, modules, steps).',
    'Parity source: apps/site/dist/course-manifest.json schemaVersion 2.',
    'Case reference used only where cited in canonical step sources: https://www.youtube.com/watch?v=7KDYQ3fC-v8.',
    'No unsupported revenue, valuation, conversion or performance numbers were added.',
  ].join('\n') + '\n', 'utf8');
  await writeFile(resolve(outputRoot, 'design-notes.txt'), [
    'Custom Galaxy visual route; Codex Grid and legacy website screenshots are not used.',
    'All course visuals are editable PowerPoint text and native shapes.',
    'Step slide order: Зачем → Понять → Пример → Сделать → Результат → Дальше.',
    'One stable learning layout is used across 28 steps to reduce visual search.',
  ].join('\n') + '\n', 'utf8');
  console.log(`Deck: ${pptxPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
