import assert from 'node:assert/strict';
import test from 'node:test';

import { course, modules, stepById, steps } from '@sales-course/content';

async function loadState() {
  try {
    return await import('../src/course/course-state.mjs');
  } catch (error) {
    assert.fail(`course-state.mjs must load: ${error.code || error.message}`);
  }
}

test('module selection chooses the first unfinished step in that module', async () => {
  const { selectModuleStepId } = await loadState();
  assert.equal(
    selectModuleStepId('system', modules, steps, ['system-value', 'system-chain']),
    'system-b2b',
  );
  assert.equal(
    selectModuleStepId('system', modules, steps, modules[0].stepIds),
    'system-bottleneck',
  );
  assert.equal(selectModuleStepId('missing', modules, steps, []), null);
});

test('completion is strictly sequential and recommends the first unfinished step', async () => {
  const { completeStepInOrder, recommendNextStepId } = await loadState();

  assert.deepEqual(completeStepInOrder(steps, [], 'offer-niche'), []);
  assert.deepEqual(completeStepInOrder(steps, [], 'system-value'), ['system-value']);
  assert.deepEqual(
    completeStepInOrder(steps, ['system-value'], 'system-chain'),
    ['system-value', 'system-chain'],
  );
  assert.equal(recommendNextStepId(steps, ['system-value', 'system-chain']), 'system-b2b');
  assert.equal(recommendNextStepId(steps, steps.map(step => step.id)), null);
});

test('completed IDs are normalized to canonical order and malformed storage recovers safely', async () => {
  const {
    normalizeCompletedStepIds,
    parseCompletedStepIds,
    readCompletedStepIds,
    serializeCompletedStepIds,
    writeCompletedStepIds,
  } = await loadState();

  assert.deepEqual(
    normalizeCompletedStepIds(['system-chain', 'unknown', 'system-value', 'system-chain'], steps),
    ['system-value', 'system-chain'],
  );
  assert.deepEqual(
    normalizeCompletedStepIds(['system-value', 'system-b2b'], steps),
    ['system-value'],
    'a forged gap must be truncated to the longest canonical prefix',
  );
  assert.deepEqual(
    normalizeCompletedStepIds(['system-b2b', 'offer-niche'], steps),
    [],
    'progress cannot start after the first canonical step',
  );
  assert.deepEqual(parseCompletedStepIds('{broken', steps), []);
  assert.deepEqual(parseCompletedStepIds('["system-value","system-b2b"]', steps), ['system-value']);
  assert.deepEqual(parseCompletedStepIds('["system-chain","system-value"]', steps), [
    'system-value',
    'system-chain',
  ]);
  assert.equal(serializeCompletedStepIds(['system-chain', 'system-value'], steps), '["system-value","system-chain"]');

  const values = new Map([['progress', '{broken']]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.deepEqual(readCompletedStepIds(storage, steps, 'progress'), []);
  assert.equal(writeCompletedStepIds(storage, ['system-value'], steps, 'progress'), true);
  assert.equal(values.get('progress'), '["system-value"]');

  const failingStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.deepEqual(readCompletedStepIds(failingStorage, steps, 'progress'), []);
  assert.equal(writeCompletedStepIds(failingStorage, ['system-value'], steps, 'progress'), false);
});

test('diagnostics resolve all four bottlenecks to canonical steps', async () => {
  const { diagnosticRecommendation, resolveDiagnosticSelection } = await loadState();

  for (const diagnostic of course.diagnostics) {
    assert.deepEqual(
      diagnosticRecommendation(course, stepById, diagnostic.id),
      { diagnostic, step: stepById[diagnostic.inspectStepId] },
    );
  }
  assert.equal(diagnosticRecommendation(course, stepById, 'missing'), null);
  assert.deepEqual(resolveDiagnosticSelection(course, course.diagnostics[2].id), {
    activeIndex: 2,
    diagnostic: course.diagnostics[2],
  });
  assert.deepEqual(resolveDiagnosticSelection(course, 'missing'), {
    activeIndex: 0,
    diagnostic: course.diagnostics[0],
  });
  assert.deepEqual(resolveDiagnosticSelection({ diagnostics: [] }, 'missing'), {
    activeIndex: -1,
    diagnostic: null,
  });
});

test('step state distinguishes current, completed, next and future without relying on color', async () => {
  const { classifyStepState } = await loadState();
  const context = {
    activeStepId: 'system-chain',
    completedStepIds: ['system-value'],
    nextStepId: 'system-chain',
  };

  assert.equal(classifyStepState('system-chain', context), 'current');
  assert.equal(classifyStepState('system-value', context), 'completed');
  assert.equal(classifyStepState('system-b2b', { ...context, activeStepId: null, nextStepId: 'system-b2b' }), 'next');
  assert.equal(classifyStepState('offer-niche', context), 'future');
});

test('learning-web model contains the complete navigable hierarchy and graph', async () => {
  const { buildLearningWebModel } = await loadState();
  const model = buildLearningWebModel(course, modules, steps);

  assert.deepEqual(model.size, { width: 1600, height: 1000 });
  assert.equal(model.nodes.filter(node => node.type === 'center').length, 1);
  assert.equal(model.nodes.filter(node => node.type === 'module').length, 7);
  assert.equal(model.nodes.filter(node => node.type === 'step').length, 28);
  assert.equal(model.edges.filter(edge => edge.type === 'course-module').length, 7);
  assert.equal(model.edges.filter(edge => edge.type === 'module-step').length, 28);
  assert.equal(model.edges.filter(edge => edge.type === 'sequence').length, 27);
  assert.ok(model.edges.some(edge => edge.type === 'related'));
  assert.equal(new Set(model.nodes.map(node => node.id)).size, 36);
  assert.ok(model.nodes.every(node => node.accessibleLabel.trim().length > 0));
  assert.ok(model.nodes.every(node => node.x >= 0 && node.x <= 1600 && node.y >= 0 && node.y <= 1000));
});

test('learning-web scroll offsets center initially and preserve the viewport focal point across zoom', async () => {
  const { calculateLearningWebScrollOffsets } = await loadState();

  assert.deepEqual(calculateLearningWebScrollOffsets({
    contentWidth: 1600,
    contentHeight: 1000,
    viewportWidth: 900,
    viewportHeight: 600,
    center: true,
  }), { left: 350, top: 200 });

  assert.deepEqual(calculateLearningWebScrollOffsets({
    contentWidth: 600,
    contentHeight: 400,
    viewportWidth: 900,
    viewportHeight: 600,
    center: true,
  }), { left: 0, top: 0 });

  assert.deepEqual(calculateLearningWebScrollOffsets({
    contentWidth: 1920,
    contentHeight: 1200,
    viewportWidth: 900,
    viewportHeight: 600,
    scrollLeft: 350,
    scrollTop: 200,
    previousZoom: 1,
    nextZoom: 1.2,
  }), { left: 510, top: 300 });

  assert.deepEqual(calculateLearningWebScrollOffsets({
    contentWidth: 1920,
    contentHeight: 1200,
    viewportWidth: 900,
    viewportHeight: 600,
    scrollLeft: 1400,
    scrollTop: 900,
    previousZoom: 1,
    nextZoom: 1.2,
  }), { left: 1020, top: 600 });
});

test('sequence edges expose deterministic completed, current, next and future path states', async () => {
  const { classifySequenceEdgeState } = await loadState();
  const edge = (from, to, type = 'sequence') => ({
    type,
    fromId: `step:${from}`,
    toId: `step:${to}`,
  });
  const currentContext = {
    completedStepIds: ['system-value'],
    activeStepId: 'system-chain',
    nextStepId: 'system-b2b',
  };

  assert.equal(classifySequenceEdgeState(edge('system-value', 'system-chain'), currentContext), 'current');
  assert.equal(classifySequenceEdgeState(edge('system-chain', 'system-b2b'), currentContext), 'next');
  assert.equal(classifySequenceEdgeState(edge('system-b2b', 'system-bottleneck'), currentContext), 'future');
  assert.equal(classifySequenceEdgeState(edge('system-value', 'system-chain'), {
    completedStepIds: ['system-value', 'system-chain', 'system-b2b'],
    activeStepId: 'system-bottleneck',
    nextStepId: 'system-bottleneck',
  }), 'completed');
  assert.equal(classifySequenceEdgeState(edge('system-value', 'system-chain', 'related'), currentContext), null);
  assert.equal(classifySequenceEdgeState({ type: 'sequence', fromId: 'broken', toId: null }, currentContext), null);
});

test('hash helpers preserve web and valid lesson destinations', async () => {
  const { formatCourseHash, parseCourseHash, resolveCourseHistoryAction } = await loadState();
  const ids = new Set(steps.map(step => step.id));

  assert.deepEqual(parseCourseHash('#web', ids), { view: 'web', activeStepId: null });
  assert.deepEqual(parseCourseHash('#step/system-value', ids), {
    view: 'lesson',
    activeStepId: 'system-value',
  });
  assert.deepEqual(parseCourseHash('#step/missing', ids), { view: 'web', activeStepId: null });
  assert.equal(formatCourseHash('web', 'system-value'), '#web');
  assert.equal(formatCourseHash('lesson', 'system-value'), '#step/system-value');
  assert.equal(resolveCourseHistoryAction({ currentHash: '#web', nextHash: '#web' }), null);
  assert.equal(resolveCourseHistoryAction({ currentHash: '#web', nextHash: '#step/system-value' }), 'push');
  assert.equal(resolveCourseHistoryAction({ currentHash: '#web', nextHash: '#step/system-value', replace: true }), 'replace');
  assert.equal(resolveCourseHistoryAction({ currentHash: '#web', nextHash: '' }), null);
});

test('pointer effects are disabled by reduced-motion, save-data or application fallback', async () => {
  const { pointerEffectsAllowed, shouldActivateSplashCursor } = await loadState();
  assert.equal(pointerEffectsAllowed({ effectsEnabled: true, reducedMotion: false, saveData: false }), true);
  assert.equal(pointerEffectsAllowed({ effectsEnabled: false, reducedMotion: false, saveData: false }), false);
  assert.equal(pointerEffectsAllowed({ effectsEnabled: true, reducedMotion: true, saveData: false }), false);
  assert.equal(pointerEffectsAllowed({ effectsEnabled: true, reducedMotion: false, saveData: true }), false);
  assert.equal(shouldActivateSplashCursor({ effectsAllowed: true, insideGalaxyZone: true, insideQuietZone: false }), true);
  assert.equal(shouldActivateSplashCursor({ effectsAllowed: false, insideGalaxyZone: true, insideQuietZone: false }), false);
  assert.equal(shouldActivateSplashCursor({ effectsAllowed: true, insideGalaxyZone: false, insideQuietZone: false }), false);
  assert.equal(shouldActivateSplashCursor({ effectsAllowed: true, insideGalaxyZone: true, insideQuietZone: true }), false);
});

test('course destination helpers expose a stable focus target and concise screen-reader announcement', async () => {
  const {
    describeCourseDestination,
    focusCourseDestination,
    getCourseDestinationFocusId,
    getCourseDestinationFocusKey,
  } = await loadState();

  assert.equal(getCourseDestinationFocusId('web', 'system-value'), 'course-web-title');
  assert.equal(getCourseDestinationFocusId('lesson', 'system-value'), 'course-step-title-system-value');
  assert.equal(getCourseDestinationFocusKey('web', 'system-value', 0), 'web');
  assert.equal(getCourseDestinationFocusKey('web', 'system-chain', 1), 'web');
  assert.equal(getCourseDestinationFocusKey('lesson', 'repeat-system', 27), 'lesson:repeat-system:27');
  assert.equal(getCourseDestinationFocusKey('lesson', 'repeat-system', 28), 'lesson:repeat-system:28');

  const calls = [];
  const focusTarget = { focus: (...args) => calls.push(args) };
  const documentObject = {
    getElementById: id => id === 'course-step-title-system-value' ? focusTarget : null,
  };
  assert.equal(focusCourseDestination({
    view: 'lesson',
    activeStepId: 'system-value',
    documentObject,
  }), true);
  assert.deepEqual(calls, [[]], 'navigation focus should also reveal the new heading');
  assert.equal(focusCourseDestination({ view: 'web', documentObject }), false);

  assert.equal(
    describeCourseDestination({
      view: 'web',
      activeStep: stepById['system-value'],
      completedCount: 0,
      totalCount: 28,
    }),
    'Открыта карта курса. Выбран шаг «Что покупают». Пройдено 0 из 28.',
  );
  assert.equal(
    describeCourseDestination({
      view: 'lesson',
      activeStep: stepById['system-chain'],
      completedCount: 1,
      totalCount: 28,
    }),
    'Открыт шаг «Цепочка действий». Пройдено 1 из 28.',
  );
  assert.equal(
    describeCourseDestination({
      view: 'lesson',
      activeStep: stepById['repeat-system'],
      completedCount: 28,
      totalCount: 28,
    }),
    'Открыт шаг «Система на 30 дней». Курс пройден: 28 из 28.',
  );
});

test('learning-web accessible names include progress and non-color state', async () => {
  const { moduleAccessibleLabel, stepAccessibleLabel } = await loadState();

  assert.equal(
    moduleAccessibleLabel({
      accessibleLabel: 'Модуль 1 из 7: Продажа как система.',
      completedCount: 2,
      totalCount: 4,
      selected: true,
    }),
    'Модуль 1 из 7: Продажа как система. Прогресс 2 из 4. Выбранная тема.',
  );
  assert.equal(
    stepAccessibleLabel({
      accessibleLabel: 'Шаг 1.2: Продажа как цепочка наблюдаемых действий',
      state: 'completed',
      recommended: true,
    }),
    'Шаг 1.2: Продажа как цепочка наблюдаемых действий. Статус: готово. Рекомендовано диагностикой.',
  );
  assert.match(stepAccessibleLabel({ accessibleLabel: 'Шаг 1.3', state: 'next' }), /следующий обязательный шаг/);
});

test('LaserFlow viewport observer mounts only near the visible bridge and always disconnects', async () => {
  const { observeNearViewport, shouldMountLaserFlow } = await loadState();
  assert.equal(shouldMountLaserFlow({ effectsAllowed: true, hasNextStep: true, isNearViewport: true }), true);
  assert.equal(shouldMountLaserFlow({ effectsAllowed: true, hasNextStep: true, isNearViewport: false }), false);
  assert.equal(shouldMountLaserFlow({ effectsAllowed: false, hasNextStep: true, isNearViewport: true }), false);

  let observerCallback;
  let observedElement;
  let disconnected = false;
  let observerOptions;
  class FakeIntersectionObserver {
    constructor(callback, options) {
      observerCallback = callback;
      observerOptions = options;
    }
    observe(element) { observedElement = element; }
    disconnect() { disconnected = true; }
  }

  const visibility = [];
  const element = {};
  const stop = observeNearViewport(element, value => visibility.push(value), FakeIntersectionObserver);
  assert.equal(observedElement, element);
  assert.deepEqual(observerOptions, { rootMargin: '160px 0px', threshold: 0.01 });
  observerCallback([{ isIntersecting: false }, { isIntersecting: true }]);
  observerCallback([{ isIntersecting: false }]);
  assert.deepEqual(visibility, [true, false]);
  stop();
  assert.equal(disconnected, true);

  const fallbackVisibility = [];
  const stopFallback = observeNearViewport(element, value => fallbackVisibility.push(value), null);
  assert.deepEqual(fallbackVisibility, [true]);
  assert.doesNotThrow(stopFallback);
});
