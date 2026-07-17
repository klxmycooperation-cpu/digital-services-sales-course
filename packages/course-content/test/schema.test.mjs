import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCourse } from '../src/schema.mjs';

const source = () => ({
  title: 'Проверенный источник',
  url: 'https://example.org/source',
  checkedAt: '2026-07-15',
  type: 'official',
  usage: 'Подтверждает принцип, использованный в этом шаге.',
});

function validBundle() {
  const modules = Array.from({ length: 7 }, (_, moduleIndex) => ({
    id: `module-${moduleIndex + 1}`,
    index: moduleIndex + 1,
    title: `Модуль ${moduleIndex + 1}`,
    shortTitle: `Модуль ${moduleIndex + 1}`,
    purpose: `Понятная цель модуля ${moduleIndex + 1}.`,
    artifact: `Рабочая карта результата для модуля ${moduleIndex + 1}.`,
    stepIds: Array.from({ length: 4 }, (_, stepIndex) => `m${moduleIndex + 1}-s${stepIndex + 1}`),
    nextModuleId: moduleIndex < 6 ? `module-${moduleIndex + 2}` : null,
  }));
  const steps = modules.flatMap((module, moduleIndex) => module.stepIds.map((id, stepIndex) => ({
    id,
    moduleId: module.id,
    index: stepIndex + 1,
    title: `Проверяемый шаг ${id}`,
    shortTitle: `Шаг ${stepIndex + 1}`,
    why: 'Без этого шага непонятно, какое действие должно измениться.',
    understand: ['Проверяем факт, а не впечатление.', 'Фиксируем одно следующее действие.'],
    action: {
      label: 'Сделать шаг',
      task: `Выполните одно наблюдаемое действие для ${id}.`,
      output: `Заполненная карточка результата ${id}.`,
      doneWhen: `Результат ${id} можно проверить без устного пояснения.`,
    },
    example: {
      title: `Пример ${id}`,
      body: `Компания фиксирует исходное состояние, меняет одно действие и сравнивает результат для ${id}.`,
    },
    focusPhrase: 'Сначала факт, потом решение.',
    tools: [{
      title: 'Карточка проверки',
      description: 'Фиксирует факты и неизвестные перед следующим действием.',
      content: 'Факт | неизвестно | действие | результат',
    }],
    sources: [source()],
    nextStepId: moduleIndex === 6 && stepIndex === 3
      ? null
      : `m${moduleIndex + 1 + (stepIndex === 3 ? 1 : 0)}-s${stepIndex === 3 ? 1 : stepIndex + 2}`,
    relatedStepIds: [],
  })));
  const course = {
    id: 'test-course',
    title: 'Проверяемый курс продаж',
    description: 'Короткая последовательность от проблемы до повторяемого результата.',
    startStepId: 'm1-s1',
    moduleIds: modules.map((module) => module.id),
    diagnostics: [
      {
        id: 'no-replies',
        label: 'Нет ответов',
        signal: 'Сообщения прочитаны, содержательных ответов нет.',
        inspectStepId: 'm4-s2',
        nextAction: 'Проверить наблюдение и вопрос в первом сообщении.',
      },
    ],
  };
  return { course, modules, steps };
}

test('schema accepts a complete seven by four linear course', () => {
  assert.deepEqual(validateCourse(validBundle()), {
    moduleCount: 7,
    stepCount: 28,
    diagnosticCount: 1,
    sourceReferenceCount: 28,
  });
});

test('schema rejects any count other than seven modules and twenty-eight steps', () => {
  const bundle = validBundle();
  bundle.modules.pop();
  assert.throws(() => validateCourse(bundle), /exactly 7 modules/u);
});

test('schema rejects a module that does not contain exactly four steps', () => {
  const bundle = validBundle();
  bundle.modules[0].stepIds.pop();
  assert.throws(() => validateCourse(bundle), /exactly 4 step IDs/u);
});

test('schema rejects duplicate module and step IDs', () => {
  const duplicateModule = validBundle();
  duplicateModule.modules[1].id = duplicateModule.modules[0].id;
  assert.throws(() => validateCourse(duplicateModule), /Duplicate module ID/u);

  const duplicateStep = validBundle();
  duplicateStep.steps[1].id = duplicateStep.steps[0].id;
  assert.throws(() => validateCourse(duplicateStep), /Duplicate step ID/u);
});

test('schema rejects a broken or cyclic next-step chain', () => {
  const broken = validBundle();
  broken.steps[3].nextStepId = 'missing-step';
  assert.throws(() => validateCourse(broken), /unknown next step/u);

  const cycle = validBundle();
  cycle.steps[27].nextStepId = cycle.steps[0].id;
  assert.throws(() => validateCourse(cycle), /linear chain|cycle/u);
});

test('schema rejects a valid reference that makes the declared sequence unreachable', () => {
  const bundle = validBundle();
  bundle.steps[0].nextStepId = bundle.steps[2].id;
  assert.throws(() => validateCourse(bundle), /full linear chain/u);
});

test('schema rejects missing and self-referential related steps', () => {
  const missing = validBundle();
  missing.steps[0].relatedStepIds = ['missing-step'];
  assert.throws(() => validateCourse(missing), /unknown related step/u);

  const self = validBundle();
  self.steps[0].relatedStepIds = [self.steps[0].id];
  assert.throws(() => validateCourse(self), /must not reference itself/u);
});

test('schema enforces concise instructional copy', () => {
  const bundle = validBundle();
  bundle.steps[0].why = 'а'.repeat(301);
  assert.throws(() => validateCourse(bundle), /why must be at most 300 characters/u);
});

test('schema requires complete and valid source metadata', () => {
  const missingUsage = validBundle();
  delete missingUsage.steps[0].sources[0].usage;
  assert.throws(() => validateCourse(missingUsage), /sources\[0\]\.usage/u);

  const invalidDate = validBundle();
  invalidDate.steps[0].sources[0].checkedAt = '2026-02-30';
  assert.throws(() => validateCourse(invalidDate), /valid YYYY-MM-DD/u);

  const invalidType = validBundle();
  invalidType.steps[0].sources[0].type = 'random';
  assert.throws(() => validateCourse(invalidType), /official, method, policy, law, or case/u);

  const caseWithoutEvidence = validBundle();
  caseWithoutEvidence.steps[0].sources[0].type = 'case';
  assert.throws(() => validateCourse(caseWithoutEvidence), /evidenceIds/u);
});

test('schema rejects module routing drift', () => {
  const bundle = validBundle();
  bundle.modules[0].nextModuleId = bundle.modules[2].id;
  assert.throws(() => validateCourse(bundle), /nextModuleId/u);

  const wrongMembership = validBundle();
  wrongMembership.steps[0].moduleId = wrongMembership.modules[1].id;
  assert.throws(() => validateCourse(wrongMembership), /moduleId/u);
});

test('schema requires a distinct working artifact for every module', () => {
  const blank = validBundle();
  blank.modules[0].artifact = '';
  assert.throws(() => validateCourse(blank), /artifact/u);

  const duplicate = validBundle();
  duplicate.modules[1].artifact = duplicate.modules[0].artifact;
  assert.throws(() => validateCourse(duplicate), /artifacts must be unique/u);
});

test('schema requires one or two structured concise tools per step', () => {
  const stringTool = validBundle();
  stringTool.steps[0].tools = ['Старая строка'];
  assert.throws(() => validateCourse(stringTool), /tools\[0\] must be an object/u);

  const incomplete = validBundle();
  delete incomplete.steps[0].tools[0].content;
  assert.throws(() => validateCourse(incomplete), /tools\[0\]\.content/u);

  const tooMany = validBundle();
  tooMany.steps[0].tools = Array.from({ length: 3 }, () => ({
    title: 'Инструмент',
    description: 'Проверяет один конкретный результат шага.',
    content: 'Факт | действие | результат',
  }));
  assert.throws(() => validateCourse(tooMany), /tools must contain 1 to 2 items/u);
});
