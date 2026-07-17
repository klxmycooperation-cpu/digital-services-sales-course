export const COURSE_PROGRESS_KEY = 'digital-sales-course.progress.v2';

const WEB_WIDTH = 1600;
const WEB_HEIGHT = 1000;
const WEB_CENTER = Object.freeze({ x: WEB_WIDTH / 2, y: WEB_HEIGHT / 2 });

function toIdSet(values) {
  return new Set(Array.isArray(values) ? values : []);
}

export function normalizeCompletedStepIds(values, steps) {
  const selected = toIdSet(values);
  const prefix = [];
  for (const step of steps) {
    if (!selected.has(step.id)) break;
    prefix.push(step.id);
  }
  return prefix;
}

export function recommendNextStepId(steps, completedStepIds) {
  const completed = toIdSet(normalizeCompletedStepIds(completedStepIds, steps));
  return steps.find(step => !completed.has(step.id))?.id ?? null;
}

export function completeStepInOrder(steps, completedStepIds, stepId) {
  const completed = normalizeCompletedStepIds(completedStepIds, steps);
  const requiredStepId = recommendNextStepId(steps, completed);
  if (stepId !== requiredStepId) return completed;
  return normalizeCompletedStepIds([...completed, stepId], steps);
}

export function selectModuleStepId(moduleId, modules, steps, completedStepIds) {
  const module = modules.find(entry => entry.id === moduleId);
  if (!module) return null;
  const completed = toIdSet(normalizeCompletedStepIds(completedStepIds, steps));
  return module.stepIds.find(stepId => !completed.has(stepId)) ?? module.stepIds.at(-1) ?? null;
}

export function parseCompletedStepIds(serialized, steps) {
  if (typeof serialized !== 'string' || serialized.length === 0) return [];
  try {
    const value = JSON.parse(serialized);
    return normalizeCompletedStepIds(value, steps);
  } catch {
    return [];
  }
}

export function serializeCompletedStepIds(completedStepIds, steps) {
  return JSON.stringify(normalizeCompletedStepIds(completedStepIds, steps));
}

export function readCompletedStepIds(storage, steps, key = COURSE_PROGRESS_KEY) {
  try {
    return parseCompletedStepIds(storage?.getItem(key), steps);
  } catch {
    return [];
  }
}

export function writeCompletedStepIds(storage, completedStepIds, steps, key = COURSE_PROGRESS_KEY) {
  try {
    storage?.setItem(key, serializeCompletedStepIds(completedStepIds, steps));
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function diagnosticRecommendation(course, stepById, diagnosticId) {
  const diagnostic = course.diagnostics.find(entry => entry.id === diagnosticId);
  if (!diagnostic) return null;
  const step = stepById[diagnostic.inspectStepId];
  return step ? { diagnostic, step } : null;
}

export function resolveDiagnosticSelection(course, diagnosticId) {
  const diagnostics = Array.isArray(course?.diagnostics) ? course.diagnostics : [];
  if (diagnostics.length === 0) return { activeIndex: -1, diagnostic: null };
  const requestedIndex = diagnostics.findIndex(entry => entry.id === diagnosticId);
  const activeIndex = requestedIndex >= 0 ? requestedIndex : 0;
  return { activeIndex, diagnostic: diagnostics[activeIndex] };
}

export function classifyStepState(stepId, {
  activeStepId = null,
  completedStepIds = [],
  nextStepId = null,
} = {}) {
  if (stepId === activeStepId) return 'current';
  if (toIdSet(completedStepIds).has(stepId)) return 'completed';
  if (stepId === nextStepId) return 'next';
  return 'future';
}

function stepIdFromNodeId(nodeId) {
  if (typeof nodeId !== 'string' || !nodeId.startsWith('step:')) return null;
  return nodeId.slice('step:'.length) || null;
}

export function classifySequenceEdgeState(connection, {
  activeStepId = null,
  completedStepIds = [],
  nextStepId = null,
} = {}) {
  if (connection?.type !== 'sequence') return null;
  const fromStepId = stepIdFromNodeId(connection.fromId);
  const toStepId = stepIdFromNodeId(connection.toId);
  if (!fromStepId || !toStepId) return null;

  if (toStepId === activeStepId) return 'current';
  if (toStepId === nextStepId) return 'next';
  const completed = toIdSet(completedStepIds);
  if (completed.has(fromStepId) && completed.has(toStepId)) return 'completed';
  return 'future';
}

function pointOnEllipse(index, count, radiusX, radiusY) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
  return {
    x: Math.round(WEB_CENTER.x + Math.cos(angle) * radiusX),
    y: Math.round(WEB_CENTER.y + Math.sin(angle) * radiusY),
  };
}

function edge(id, type, fromId, toId) {
  return Object.freeze({ id, type, fromId, toId });
}

export function buildLearningWebModel(course, modules, steps) {
  const moduleIndex = new Map(modules.map(module => [module.id, module]));
  const stepIndex = new Map(steps.map(step => [step.id, step]));
  const centerId = `course:${course.id}`;
  const nodes = [{
    id: centerId,
    refId: course.id,
    type: 'center',
    x: WEB_CENTER.x,
    y: WEB_CENTER.y,
    label: course.title,
    accessibleLabel: `Курс: ${course.title}`,
  }];

  modules.forEach((module, index) => {
    nodes.push({
      id: `module:${module.id}`,
      refId: module.id,
      type: 'module',
      moduleId: module.id,
      ...pointOnEllipse(index, modules.length, 310, 205),
      label: module.shortTitle,
      accessibleLabel: `Модуль ${module.index} из ${modules.length}: ${module.title}. Результат: ${module.artifact}`,
    });
  });

  steps.forEach((step, index) => {
    const module = moduleIndex.get(step.moduleId);
    nodes.push({
      id: `step:${step.id}`,
      refId: step.id,
      type: 'step',
      moduleId: step.moduleId,
      ...pointOnEllipse(index, steps.length, 665, 420),
      label: step.shortTitle,
      accessibleLabel: `Шаг ${module?.index ?? '?'}․${step.index}: ${step.title}`,
    });
  });

  const edges = [];
  for (const module of modules) {
    edges.push(edge(
      `course-module:${module.id}`,
      'course-module',
      centerId,
      `module:${module.id}`,
    ));
    for (const stepId of module.stepIds) {
      edges.push(edge(
        `module-step:${module.id}:${stepId}`,
        'module-step',
        `module:${module.id}`,
        `step:${stepId}`,
      ));
    }
  }

  steps.slice(0, -1).forEach(step => {
    edges.push(edge(
      `sequence:${step.id}:${step.nextStepId}`,
      'sequence',
      `step:${step.id}`,
      `step:${step.nextStepId}`,
    ));
  });

  const relatedPairs = new Set();
  for (const step of steps) {
    for (const relatedId of step.relatedStepIds) {
      if (!stepIndex.has(relatedId)) continue;
      const pair = [step.id, relatedId].sort();
      const pairKey = pair.join(':');
      if (relatedPairs.has(pairKey)) continue;
      relatedPairs.add(pairKey);
      edges.push(edge(
        `related:${pairKey}`,
        'related',
        `step:${pair[0]}`,
        `step:${pair[1]}`,
      ));
    }
  }

  return Object.freeze({
    size: Object.freeze({ width: WEB_WIDTH, height: WEB_HEIGHT }),
    nodes: Object.freeze(nodes.map(node => Object.freeze(node))),
    edges: Object.freeze(edges),
  });
}

function finiteNonNegative(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function finitePositive(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clampScroll(value, maximum) {
  return Math.min(maximum, Math.max(0, value));
}

export function calculateLearningWebScrollOffsets({
  contentWidth = 0,
  contentHeight = 0,
  viewportWidth = 0,
  viewportHeight = 0,
  scrollLeft = 0,
  scrollTop = 0,
  previousZoom = 1,
  nextZoom = 1,
  center = false,
} = {}) {
  const safeContentWidth = finiteNonNegative(contentWidth);
  const safeContentHeight = finiteNonNegative(contentHeight);
  const safeViewportWidth = finiteNonNegative(viewportWidth);
  const safeViewportHeight = finiteNonNegative(viewportHeight);
  const maximumLeft = Math.max(0, safeContentWidth - safeViewportWidth);
  const maximumTop = Math.max(0, safeContentHeight - safeViewportHeight);

  if (center) {
    return {
      left: maximumLeft / 2,
      top: maximumTop / 2,
    };
  }

  const safePreviousZoom = finitePositive(previousZoom, 1);
  const safeNextZoom = finitePositive(nextZoom, safePreviousZoom);
  const zoomRatio = safeNextZoom / safePreviousZoom;
  const focalLeft = (finiteNonNegative(scrollLeft) + safeViewportWidth / 2) * zoomRatio;
  const focalTop = (finiteNonNegative(scrollTop) + safeViewportHeight / 2) * zoomRatio;

  return {
    left: clampScroll(focalLeft - safeViewportWidth / 2, maximumLeft),
    top: clampScroll(focalTop - safeViewportHeight / 2, maximumTop),
  };
}

export function parseCourseHash(hash, validStepIds) {
  if (hash === '#web' || hash === '' || hash == null) {
    return { view: 'web', activeStepId: null };
  }
  const match = /^#step\/([a-z][a-z0-9-]*)$/u.exec(hash);
  const stepId = match?.[1] ?? null;
  if (!stepId || !validStepIds.has(stepId)) return { view: 'web', activeStepId: null };
  return { view: 'lesson', activeStepId: stepId };
}

export function formatCourseHash(view, activeStepId) {
  return view === 'lesson' && activeStepId ? `#step/${activeStepId}` : '#web';
}

export function resolveCourseHistoryAction({ currentHash, nextHash, replace = false } = {}) {
  if (typeof nextHash !== 'string' || nextHash.length === 0 || currentHash === nextHash) return null;
  return replace ? 'replace' : 'push';
}

export function pointerEffectsAllowed({ effectsEnabled, reducedMotion, saveData }) {
  return Boolean(effectsEnabled && !reducedMotion && !saveData);
}

export function shouldActivateSplashCursor({
  effectsAllowed,
  insideGalaxyZone,
  insideQuietZone,
} = {}) {
  return Boolean(effectsAllowed && insideGalaxyZone && !insideQuietZone);
}

function withSentenceStop(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return '';
  return /[.!?]$/u.test(text) ? text : `${text}.`;
}

export function getCourseDestinationFocusId(view, activeStepId) {
  if (view === 'lesson' && activeStepId) return `course-step-title-${activeStepId}`;
  return 'course-web-title';
}

export function getCourseDestinationFocusKey(view, activeStepId, completedCount = 0) {
  if (view !== 'lesson') return 'web';
  return `lesson:${activeStepId || 'unknown'}:${completedCount}`;
}

export function focusCourseDestination({
  view,
  activeStepId,
  documentObject = typeof document === 'undefined' ? null : document,
} = {}) {
  const target = documentObject?.getElementById?.(getCourseDestinationFocusId(view, activeStepId));
  if (typeof target?.focus !== 'function') return false;
  target.focus();
  return true;
}

export function describeCourseDestination({
  view,
  activeStep,
  completedCount = 0,
  totalCount = 0,
} = {}) {
  const title = activeStep?.shortTitle || activeStep?.title || 'не выбран';
  const progress = totalCount > 0 && completedCount >= totalCount
    ? `Курс пройден: ${completedCount} из ${totalCount}.`
    : `Пройдено ${completedCount} из ${totalCount}.`;
  if (view === 'lesson') return `Открыт шаг «${title}». ${progress}`;
  return `Открыта карта курса. Выбран шаг «${title}». ${progress}`;
}

export function moduleAccessibleLabel({
  accessibleLabel,
  completedCount = 0,
  totalCount = 0,
  selected = false,
} = {}) {
  const parts = [
    withSentenceStop(accessibleLabel),
    `Прогресс ${completedCount} из ${totalCount}.`,
  ];
  if (selected) parts.push('Выбранная тема.');
  return parts.filter(Boolean).join(' ');
}

const STEP_ACCESSIBLE_STATES = Object.freeze({
  completed: 'готово',
  current: 'открыто сейчас',
  next: 'следующий обязательный шаг',
  future: 'будущий шаг',
});

export function stepAccessibleLabel({ accessibleLabel, state = 'future', recommended = false } = {}) {
  const parts = [
    withSentenceStop(accessibleLabel),
    `Статус: ${STEP_ACCESSIBLE_STATES[state] ?? STEP_ACCESSIBLE_STATES.future}.`,
  ];
  if (recommended) parts.push('Рекомендовано диагностикой.');
  return parts.filter(Boolean).join(' ');
}

export function shouldMountLaserFlow({ effectsAllowed, hasNextStep, isNearViewport } = {}) {
  return Boolean(effectsAllowed && hasNextStep && isNearViewport);
}

export function observeNearViewport(
  element,
  onChange,
  ObserverClass = typeof IntersectionObserver === 'undefined' ? null : IntersectionObserver,
) {
  if (!element || typeof onChange !== 'function') return () => {};
  if (typeof ObserverClass !== 'function') {
    onChange(true);
    return () => {};
  }

  const observer = new ObserverClass(
    entries => onChange(entries.some(entry => entry.isIntersecting)),
    { rootMargin: '160px 0px', threshold: 0.01 },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
