export function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export function defineCourse(value) {
  return deepFreeze({
    id: value.id,
    title: value.title,
    description: value.description,
    startStepId: value.startStepId,
    moduleIds: [...value.moduleIds],
    diagnostics: value.diagnostics.map((entry) => ({ ...entry })),
  });
}

export function defineModule(value) {
  return deepFreeze({
    id: value.id,
    index: value.index,
    title: value.title,
    shortTitle: value.shortTitle,
    purpose: value.purpose,
    artifact: value.artifact,
    stepIds: [...value.stepIds],
    nextModuleId: value.nextModuleId,
  });
}

export function defineStep(value) {
  return deepFreeze({
    id: value.id,
    moduleId: value.moduleId,
    index: value.index,
    title: value.title,
    shortTitle: value.shortTitle,
    why: value.why,
    understand: [...value.understand],
    action: { ...value.action },
    example: { ...value.example },
    focusPhrase: value.focusPhrase,
    tools: value.tools.map((tool) => ({ ...tool })),
    sources: [...value.sources],
    nextStepId: value.nextStepId,
    relatedStepIds: [...value.relatedStepIds],
  });
}
