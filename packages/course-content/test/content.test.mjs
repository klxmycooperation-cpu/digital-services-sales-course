import assert from 'node:assert/strict';
import test from 'node:test';

import {
  course,
  moduleById,
  modules,
  stepById,
  steps,
  validation,
  videoEvidence,
} from '../src/index.mjs';

const expectedModules = [
  ['system', 'Продажа как система'],
  ['offer', 'Клиент и предложение'],
  ['companies', 'Подходящие компании'],
  ['response', 'Содержательный ответ'],
  ['diagnosis', 'Диагностика'],
  ['deal', 'Решение и оплата'],
  ['repeat', 'Результат и повторяемость'],
];

const expectedTitles = [
  'Клиент покупает изменение, а не технологию',
  'Продажа — цепочка наблюдаемых действий',
  'В B2B решение принимают несколько людей',
  'Найдите узкое место текущей воронки',
  'Выберите нишу на следующие 30 дней',
  'Опишите ICP через триггер покупки',
  'Соберите минимально достаточное решение',
  'Предложите безопасный первый этап',
  'Разведите роли каналов',
  'Соберите базу по сигналам, а не по отрасли',
  'Выберите канал с учётом страны и правил',
  'Подготовьте ограниченный тест на семь дней',
  'Начните с проверяемого наблюдения',
  'Напишите первое сообщение для ответа',
  'Подстройте формат под канал',
  'Запустите тест: follow-up с новой ценностью и остановкой',
  'Задайте шесть вопросов квалификации',
  'Проверьте бюджет, границы и красные флаги',
  'Ищите процесс за запрошенной функцией',
  'Закройте диагностику письменным решением',
  'Соберите предложение из подтверждённого диагноза',
  'Свяжите цену и оплату с неопределённостью',
  'Дайте выбор пакетами, а не скидкой',
  'Переведите согласие в оплату и старт',
  'Передайте результат по критериям приёмки',
  'Превратите результат в кейс, повтор и рекомендацию',
  'Ведите CRM по следующему действию',
  'Соберите личную систему на 30 дней',
];

test('canonical course is exactly seven modules and twenty-eight sequential steps', () => {
  assert.deepEqual(validation, {
    moduleCount: 7,
    stepCount: 28,
    diagnosticCount: 4,
    sourceReferenceCount: 55,
  });
  assert.deepEqual(modules.map(({ id, title }) => [id, title]), expectedModules);
  assert.deepEqual(steps.map((step) => step.title), expectedTitles);
  assert.deepEqual(course.moduleIds, expectedModules.map(([id]) => id));
  assert.equal(course.startStepId, steps[0].id);
});

test('every module contains four ordered steps and points to the next module', () => {
  modules.forEach((module, moduleIndex) => {
    assert.equal(module.index, moduleIndex + 1);
    assert.equal(module.stepIds.length, 4);
    assert.deepEqual(module.stepIds.map((id) => stepById[id].index), [1, 2, 3, 4]);
    assert.equal(module.nextModuleId, modules[moduleIndex + 1]?.id ?? null);
    assert.equal(moduleById[module.id], module);
  });
});

test('every module names one distinct working artifact', () => {
  const artifacts = modules.map((module) => module.artifact);
  assert.ok(artifacts.every((artifact) => typeof artifact === 'string' && artifact.trim().length >= 20));
  assert.equal(new Set(artifacts).size, 7);
  assert.ok(artifacts.every((artifact) => /карта|профиль|паспорт|серия|brief|предложение|протокол|система/iu.test(artifact)));
});

test('each step answers why, understand, do, result, and next without content dumps', () => {
  const expectedKeys = [
    'action',
    'example',
    'focusPhrase',
    'id',
    'index',
    'moduleId',
    'nextStepId',
    'relatedStepIds',
    'shortTitle',
    'sources',
    'title',
    'tools',
    'understand',
    'why',
  ];

  for (const [position, step] of steps.entries()) {
    assert.deepEqual(Object.keys(step).sort(), expectedKeys, `${step.id}: shape`);
    assert.equal(stepById[step.id], step);
    assert.ok(step.understand.length >= 2 && step.understand.length <= 3, `${step.id}: understand`);
    assert.deepEqual(Object.keys(step.action).sort(), ['doneWhen', 'label', 'output', 'task']);
    assert.deepEqual(Object.keys(step.example).sort(), ['body', 'title']);
    assert.ok(step.tools.length >= 1 && step.tools.length <= 2, `${step.id}: tools`);
    for (const tool of step.tools) {
      assert.deepEqual(Object.keys(tool).sort(), ['content', 'description', 'title'], `${step.id}: tool shape`);
      assert.ok(tool.title.trim(), `${step.id}: tool title`);
      assert.ok(tool.description.trim(), `${step.id}: tool description`);
      assert.ok(tool.content.trim(), `${step.id}: tool content`);
    }
    assert.ok(step.sources.length >= 1 && step.sources.length <= 3, `${step.id}: sources`);
    assert.equal(step.nextStepId, steps[position + 1]?.id ?? null);
  }
});

test('course diagnostics route four common bottlenecks to concrete steps', () => {
  assert.deepEqual(course.diagnostics.map((entry) => entry.id), [
    'no-replies',
    'no-calls',
    'no-decisions',
    'no-repeat',
  ]);
  for (const diagnostic of course.diagnostics) {
    assert.ok(stepById[diagnostic.inspectStepId], diagnostic.id);
    assert.ok(diagnostic.signal.trim(), diagnostic.id);
    assert.ok(diagnostic.nextAction.trim(), diagnostic.id);
  }
});

test('the named video contributes all five case patterns without numeric revenue or valuation claims', () => {
  const videoUrl = 'https://www.youtube.com/watch?v=7KDYQ3fC-v8';
  const videoSteps = steps.filter((step) => step.sources.some((source) => source.url === videoUrl));

  assert.deepEqual(videoSteps.map((step) => step.id), [
    'system-value',
    'offer-proof',
    'response-observation',
    'repeat-loop',
  ]);
  for (const step of videoSteps) {
    const source = step.sources.find((entry) => entry.url === videoUrl);
    assert.equal(source.type, 'case');
    assert.match(source.title, /ИИШНЫЙ/u);
    assert.ok(source.usage.includes('наблюдение'), `${step.id}: source usage`);
  }

  const videoDerived = JSON.stringify(videoSteps.map(({ sources, ...step }) => step)).toLowerCase();
  const fivePatterns = [
    /измен\S* (?:процесс|способност)|не стек/u,
    /быстр\S* видим\S* результат/u,
    /трансформац|до и после|было.*стало/u,
    /рекомендац|referral/u,
    /прозрачност\S* основател|основател\S* прозрачно/u,
  ];
  for (const pattern of fivePatterns) assert.match(videoDerived, pattern);
  assert.match(videoDerived, /ручн\S* (?:onboarding|сопровожд)/u);
  assert.doesNotMatch(
    videoDerived,
    /(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))[^.!?]{0,40}\d|\d[^.!?]{0,40}(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))/u,
  );
});

test('company acquisition explicitly covers five channel roles and three selection constraints', () => {
  const channelStep = stepById['companies-roles'];
  const copy = JSON.stringify(channelStep).toLowerCase();
  for (const role of [/тёпл/u, /outbound|исходящ/u, /площадк|сообществ/u, /партн/u, /контент/u]) {
    assert.match(copy, role);
  }
  for (const constraint of [/доступ/u, /экономик/u, /правил/u]) {
    assert.match(copy, constraint);
  }
});

test('the seven-day experiment is prepared before messaging and launched only after follow-up is learned', () => {
  const preparation = stepById['companies-test'];
  const execution = stepById['response-follow-up'];
  const preparationCopy = JSON.stringify(preparation).toLowerCase();
  const executionCopy = JSON.stringify(execution).toLowerCase();

  assert.match(preparation.action.task, /не отправля/u);
  assert.doesNotMatch(preparationCopy, /\bзапуст\S*|отправьте|отправить|начните рассыл/u);
  for (const required of ['выборк', 'канал', 'сигнал', 'журнал', 'критер', 'стоп']) {
    assert.match(preparationCopy, new RegExp(required, 'u'));
  }
  assert.match(execution.action.task, /запуст/u);
  assert.match(executionCopy, /семиднев/u);
  assert.match(executionCopy, /follow-up/u);
  assert.ok(execution.relatedStepIds.includes(preparation.id));
  assert.ok(steps.indexOf(preparation) < steps.indexOf(execution));
});

test('market segmentation sources cannot justify pricing, negotiation, or delivery', () => {
  const marketUrl = 'https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis';
  const guardedStepIds = ['deal-pricing', 'deal-packages', 'deal-start', 'repeat-handoff'];
  for (const stepId of guardedStepIds) {
    assert.equal(
      stepById[stepId].sources.some((source) => source.url === marketUrl),
      false,
      `${stepId}: market source is out of scope`,
    );
  }
});

test('video evidence map resolves five claim-level mechanisms and timestamp windows', () => {
  const expectedEvidence = {
    'video-changed-process': ['02:19-03:18', '12:36-13:55'],
    'video-fast-result': ['07:07-07:40', '13:05-14:08'],
    'video-transformation-demo': ['04:18-04:58', '12:36-12:45'],
    'video-referral-loop': ['05:00-06:13', '10:43-11:05'],
    'video-founder-led': ['07:47-08:16', '14:42-15:00', '15:58-16:05'],
  };
  assert.deepEqual(Object.keys(videoEvidence), Object.keys(expectedEvidence));

  for (const [id, windows] of Object.entries(expectedEvidence)) {
    const evidence = videoEvidence[id];
    assert.equal(evidence.id, id);
    assert.deepEqual(evidence.timestampWindows, windows);
    assert.ok(evidence.summary.length >= 30 && evidence.summary.length <= 240, id);
    assert.ok(windows.every((window) => /^\d{2}:\d{2}-\d{2}:\d{2}$/u.test(window)), id);
  }

  const videoUrl = 'https://www.youtube.com/watch?v=7KDYQ3fC-v8';
  const videoSteps = steps.filter((step) => step.sources.some((source) => source.url === videoUrl));
  const usedEvidenceIds = new Set();
  for (const step of videoSteps) {
    const source = step.sources.find((entry) => entry.url === videoUrl);
    assert.ok(Array.isArray(source.evidenceIds) && source.evidenceIds.length > 0, step.id);
    for (const evidenceId of source.evidenceIds) {
      assert.ok(videoEvidence[evidenceId], `${step.id}:${evidenceId}`);
      assert.equal(videoEvidence[evidenceId].sourceUrl, source.url);
      assert.ok(videoEvidence[evidenceId].timestampWindows.length > 0);
      usedEvidenceIds.add(evidenceId);
    }
  }
  assert.deepEqual([...usedEvidenceIds].sort(), Object.keys(videoEvidence).sort());

  const derivedCopy = JSON.stringify({ videoSteps, videoEvidence }).toLowerCase();
  assert.doesNotMatch(
    derivedCopy,
    /(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))[^.!?]{0,40}\d|\d[^.!?]{0,40}(?:выручк|revenue|valuation|оценк\S* (?:компани|стартап))/u,
  );
});

test('copy stays direct and excludes rejected training mechanics and bulk catalogs', () => {
  const copy = JSON.stringify({ course, modules, steps }).toLowerCase();
  for (const banned of ['тренаж', 'ролевая игра', '49 канал', '65 сообщ', '30 ежедневных']) {
    assert.equal(copy.includes(banned), false, `banned copy: ${banned}`);
  }
  for (const required of ['следующее действие', 'проверяем', 'результат']) {
    assert.equal(copy.includes(required), true, `missing tone marker: ${required}`);
  }
});

test('canonical exports are immutable at every public level', () => {
  assert.ok(Object.isFrozen(course));
  assert.ok(Object.isFrozen(course.diagnostics));
  assert.ok(Object.isFrozen(modules));
  assert.ok(Object.isFrozen(steps));
  assert.ok(Object.isFrozen(moduleById));
  assert.ok(Object.isFrozen(stepById));
  for (const step of steps) {
    assert.ok(Object.isFrozen(step));
    assert.ok(Object.isFrozen(step.action));
    assert.ok(Object.isFrozen(step.example));
    assert.ok(Object.isFrozen(step.understand));
    assert.ok(Object.isFrozen(step.tools));
    assert.ok(step.tools.every(Object.isFrozen));
    assert.ok(Object.isFrozen(step.sources));
  }
});

test('legacy chapter entrypoints resolve to the new canon instead of the archived sixty records', async () => {
  const chapterModules = await Promise.all(
    Array.from({ length: 8 }, (_, index) => import(`../src/chapters/chapter-${String(index + 1).padStart(2, '0')}.mjs`)),
  );
  const chapterSteps = chapterModules.map((entry, index) => entry[`chapter${String(index + 1).padStart(2, '0')}`]);

  assert.deepEqual(chapterSteps.slice(0, 7).flat().map((step) => step.id), steps.map((step) => step.id));
  assert.deepEqual(chapterSteps[7], []);
  assert.ok(chapterSteps.every(Object.isFrozen));
});
