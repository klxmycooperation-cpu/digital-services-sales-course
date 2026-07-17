const ID_PATTERN = /^[a-z][a-z0-9-]*$/u;
const CHECKED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const SOURCE_TYPES = new Set(['official', 'method', 'policy', 'law', 'case']);

function fail(message) {
  throw new TypeError(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) fail(`${path} must be an object`);
}

function requireArray(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
}

function requireString(value, path, { min = 1, max = 300 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    fail(`${path} must be a nonblank string with at least ${min} characters`);
  }
  if (value.length > max) fail(`${path} must be at most ${max} characters`);
}

function requireId(value, path) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    fail(`${path} must be a lowercase kebab-case ID`);
  }
}

function requireUniqueIds(values, label) {
  const ids = new Set();
  for (const value of values) {
    requireObject(value, label.toLowerCase());
    requireId(value.id, `${label.toLowerCase()}.id`);
    if (ids.has(value.id)) fail(`Duplicate ${label} ID: ${value.id}`);
    ids.add(value.id);
  }
  return ids;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function isCalendarDate(value) {
  if (typeof value !== 'string' || !CHECKED_AT_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validateStringArray(value, path, { min, max, itemMax = 240 }) {
  requireArray(value, path);
  if (value.length < min || value.length > max) {
    fail(`${path} must contain ${min === max ? `exactly ${min}` : `${min} to ${max}`} items`);
  }
  value.forEach((entry, index) => requireString(entry, `${path}[${index}]`, { max: itemMax }));
}

function validateSource(source, path) {
  requireObject(source, path);
  requireString(source.title, `${path}.title`, { max: 220 });
  if (typeof source.url !== 'string' || !isHttpUrl(source.url)) {
    fail(`${path}.url must be an absolute HTTP(S) URL`);
  }
  if (!isCalendarDate(source.checkedAt)) {
    fail(`${path}.checkedAt must be a valid YYYY-MM-DD date`);
  }
  if (!SOURCE_TYPES.has(source.type)) {
    fail(`${path}.type must be official, method, policy, law, or case`);
  }
  requireString(source.usage, `${path}.usage`, { max: 240 });
  if (source.type === 'case') {
    requireArray(source.evidenceIds, `${path}.evidenceIds`);
    if (source.evidenceIds.length < 1 || source.evidenceIds.length > 5) {
      fail(`${path}.evidenceIds must contain 1 to 5 evidence IDs`);
    }
    source.evidenceIds.forEach((id, index) => requireId(id, `${path}.evidenceIds[${index}]`));
    if (new Set(source.evidenceIds).size !== source.evidenceIds.length) {
      fail(`${path}.evidenceIds must be unique`);
    }
  }
}

function validateModule(module, index) {
  const path = `modules[${index}]`;
  if (module.index !== index + 1) fail(`${path}.index must be ${index + 1}`);
  requireString(module.title, `${path}.title`, { min: 6, max: 80 });
  requireString(module.shortTitle, `${path}.shortTitle`, { min: 3, max: 32 });
  requireString(module.purpose, `${path}.purpose`, { min: 12, max: 240 });
  requireString(module.artifact, `${path}.artifact`, { min: 20, max: 180 });
  requireArray(module.stepIds, `${path}.stepIds`);
  if (module.stepIds.length !== 4) fail(`${path} must contain exactly 4 step IDs`);
  module.stepIds.forEach((id, stepIndex) => requireId(id, `${path}.stepIds[${stepIndex}]`));
  if (new Set(module.stepIds).size !== 4) fail(`${path}.stepIds must be unique`);
}

function validateStep(step, position) {
  const path = `steps[${position}]`;
  requireId(step.moduleId, `${path}.moduleId`);
  if (!Number.isInteger(step.index) || step.index < 1 || step.index > 4) {
    fail(`${path}.index must be an integer from 1 through 4`);
  }
  requireString(step.title, `${path}.title`, { min: 8, max: 80 });
  requireString(step.shortTitle, `${path}.shortTitle`, { min: 3, max: 32 });
  requireString(step.why, `${path}.why`, { min: 20, max: 300 });
  validateStringArray(step.understand, `${path}.understand`, { min: 2, max: 3, itemMax: 180 });

  requireObject(step.action, `${path}.action`);
  requireString(step.action.label, `${path}.action.label`, { min: 3, max: 48 });
  requireString(step.action.task, `${path}.action.task`, { min: 12, max: 260 });
  requireString(step.action.output, `${path}.action.output`, { min: 8, max: 220 });
  requireString(step.action.doneWhen, `${path}.action.doneWhen`, { min: 12, max: 240 });

  requireObject(step.example, `${path}.example`);
  requireString(step.example.title, `${path}.example.title`, { min: 3, max: 64 });
  requireString(step.example.body, `${path}.example.body`, { min: 20, max: 360 });
  requireString(step.focusPhrase, `${path}.focusPhrase`, { min: 8, max: 120 });
  requireArray(step.tools, `${path}.tools`);
  if (step.tools.length < 1 || step.tools.length > 2) {
    fail(`${path}.tools must contain 1 to 2 items`);
  }
  step.tools.forEach((tool, toolIndex) => {
    const toolPath = `${path}.tools[${toolIndex}]`;
    requireObject(tool, toolPath);
    requireString(tool.title, `${toolPath}.title`, { min: 3, max: 64 });
    requireString(tool.description, `${toolPath}.description`, { min: 12, max: 180 });
    requireString(tool.content, `${toolPath}.content`, { min: 8, max: 240 });
  });

  requireArray(step.sources, `${path}.sources`);
  if (step.sources.length < 1 || step.sources.length > 3) {
    fail(`${path}.sources must contain 1 to 3 items`);
  }
  step.sources.forEach((source, sourceIndex) => validateSource(source, `${path}.sources[${sourceIndex}]`));

  if (step.nextStepId !== null) requireId(step.nextStepId, `${path}.nextStepId`);
  requireArray(step.relatedStepIds, `${path}.relatedStepIds`);
  if (step.relatedStepIds.length > 4) fail(`${path}.relatedStepIds must contain at most 4 items`);
  step.relatedStepIds.forEach((id, relatedIndex) => requireId(id, `${path}.relatedStepIds[${relatedIndex}]`));
  if (new Set(step.relatedStepIds).size !== step.relatedStepIds.length) {
    fail(`${path}.relatedStepIds must be unique`);
  }
}

function validateCourseMeta(course, moduleIds, stepIds) {
  requireObject(course, 'course');
  requireId(course.id, 'course.id');
  requireString(course.title, 'course.title', { min: 8, max: 100 });
  requireString(course.description, 'course.description', { min: 20, max: 300 });
  if (!stepIds.has(course.startStepId)) fail('course.startStepId must reference a known step');
  validateStringArray(course.moduleIds, 'course.moduleIds', { min: 7, max: 7, itemMax: 80 });
  if (new Set(course.moduleIds).size !== 7) fail('course.moduleIds must be unique');
  course.moduleIds.forEach((id) => {
    if (!moduleIds.has(id)) fail(`course.moduleIds references unknown module: ${id}`);
  });

  requireArray(course.diagnostics, 'course.diagnostics');
  if (course.diagnostics.length < 1 || course.diagnostics.length > 8) {
    fail('course.diagnostics must contain 1 to 8 bottlenecks');
  }
  const diagnosticIds = new Set();
  course.diagnostics.forEach((entry, index) => {
    const path = `course.diagnostics[${index}]`;
    requireObject(entry, path);
    requireId(entry.id, `${path}.id`);
    if (diagnosticIds.has(entry.id)) fail(`Duplicate diagnostic ID: ${entry.id}`);
    diagnosticIds.add(entry.id);
    requireString(entry.label, `${path}.label`, { min: 3, max: 48 });
    requireString(entry.signal, `${path}.signal`, { min: 12, max: 220 });
    if (!stepIds.has(entry.inspectStepId)) fail(`${path}.inspectStepId must reference a known step`);
    requireString(entry.nextAction, `${path}.nextAction`, { min: 12, max: 220 });
  });
}

function validateMembership(modules, steps, moduleIds, stepIds) {
  const flattenedStepIds = modules.flatMap((module) => module.stepIds);
  if (flattenedStepIds.length !== stepIds.size || new Set(flattenedStepIds).size !== stepIds.size) {
    fail('Module stepIds must cover every step exactly once');
  }
  for (const id of flattenedStepIds) {
    if (!stepIds.has(id)) fail(`Module references unknown step: ${id}`);
  }
  if (flattenedStepIds.some((id, index) => id !== steps[index].id)) {
    fail('Module stepIds must follow the declared step order');
  }

  modules.forEach((module, moduleIndex) => {
    const expectedNext = modules[moduleIndex + 1]?.id ?? null;
    if (module.nextModuleId !== expectedNext) {
      fail(`modules[${moduleIndex}].nextModuleId must be ${expectedNext ?? 'null'}`);
    }
    module.stepIds.forEach((stepId, stepIndex) => {
      const step = steps.find((entry) => entry.id === stepId);
      if (step.moduleId !== module.id) fail(`Step ${step.id}.moduleId must be ${module.id}`);
      if (step.index !== stepIndex + 1) fail(`Step ${step.id}.index must be ${stepIndex + 1}`);
    });
  });

  if (modules.some((module, index) => module.id !== [...moduleIds][index])) {
    fail('Module IDs must preserve insertion order');
  }
}

function validateRelations(course, steps, stepIds) {
  for (const step of steps) {
    if (step.nextStepId !== null && !stepIds.has(step.nextStepId)) {
      fail(`Step ${step.id} references unknown next step: ${step.nextStepId}`);
    }
    for (const relatedId of step.relatedStepIds) {
      if (relatedId === step.id) fail(`Step ${step.id} must not reference itself`);
      if (!stepIds.has(relatedId)) fail(`Step ${step.id} references unknown related step: ${relatedId}`);
    }
  }

  const visited = [];
  const seen = new Set();
  let currentId = course.startStepId;
  while (currentId !== null) {
    if (seen.has(currentId)) fail(`Course next-step chain contains a cycle at ${currentId}`);
    seen.add(currentId);
    visited.push(currentId);
    currentId = steps.find((step) => step.id === currentId).nextStepId;
  }
  if (visited.length !== steps.length) {
    fail(`Course startStepId must reach the full linear chain; reached ${visited.length} of ${steps.length}`);
  }
  if (visited.some((id, index) => id !== steps[index].id)) {
    fail('Course next-step chain must follow the declared step order');
  }
}

export function validateCourse(bundle) {
  requireObject(bundle, 'Course bundle');
  const { course, modules, steps } = bundle;
  requireArray(modules, 'modules');
  requireArray(steps, 'steps');
  if (modules.length !== 7) fail(`Complete course must contain exactly 7 modules; received ${modules.length}`);
  if (steps.length !== 28) fail(`Complete course must contain exactly 28 steps; received ${steps.length}`);

  const moduleIds = requireUniqueIds(modules, 'module');
  const stepIds = requireUniqueIds(steps, 'step');
  modules.forEach(validateModule);
  const artifactOwners = new Map();
  for (const module of modules) {
    const artifact = module.artifact.trim().toLocaleLowerCase('ru');
    if (artifactOwners.has(artifact)) {
      fail(`Module artifacts must be unique: ${artifactOwners.get(artifact)} and ${module.id}`);
    }
    artifactOwners.set(artifact, module.id);
  }
  steps.forEach(validateStep);
  validateCourseMeta(course, moduleIds, stepIds);
  if (course.moduleIds.some((id, index) => id !== modules[index].id)) {
    fail('course.moduleIds must follow the declared module order');
  }
  validateMembership(modules, steps, moduleIds, stepIds);
  validateRelations(course, steps, stepIds);

  return {
    moduleCount: modules.length,
    stepCount: steps.length,
    diagnosticCount: course.diagnostics.length,
    sourceReferenceCount: steps.reduce((total, step) => total + step.sources.length, 0),
  };
}
