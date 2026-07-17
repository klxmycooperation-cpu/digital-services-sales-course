const ORDER_LABELS = Object.freeze(['Зачем', 'Понять', 'Пример', 'Сделать', 'Результат', 'Дальше']);

export function countWords(value) {
  return String(value ?? '').trim().split(/\s+/u).filter(Boolean).length;
}

function firstSentence(value) {
  const source = String(value ?? '').replace(/\s+/gu, ' ').trim();
  return source.match(/^.*?[.!?](?:\s|$)/u)?.[0]?.trim() || source;
}

export function buildStepSlideSpec(step, position, modules, steps) {
  const module = modules.find((entry) => entry.id === step.moduleId);
  const next = step.nextStepId ? steps.find((entry) => entry.id === step.nextStepId) : null;
  const blocks = [
    { label: 'Зачем', text: firstSentence(step.why) },
    { label: 'Понять', text: step.understand[0] },
    { label: 'Пример', text: step.example.title },
    { label: 'Сделать', text: step.action.label },
    { label: 'Результат', text: step.action.output },
    { label: 'Дальше', text: next ? next.shortTitle : 'Курс собран. Повторите цикл.' },
  ];
  const fixedWordCount = countWords(step.title) + countWords(step.focusPhrase) + ORDER_LABELS.length;
  let visibleWordCount = fixedWordCount + blocks.reduce((sum, block) => sum + countWords(block.text), 0);
  const additions = [
    ...step.understand.slice(1).map((text) => ({ blockIndex: 1, text })),
    { blockIndex: 2, text: firstSentence(step.example.body) },
    { blockIndex: 3, text: firstSentence(step.action.task) },
    { blockIndex: 4, text: firstSentence(step.action.doneWhen) },
  ].sort((left, right) => countWords(left.text) - countWords(right.text));
  for (const addition of additions) {
    if (visibleWordCount >= 45) break;
    const addedWords = countWords(addition.text);
    if (visibleWordCount + addedWords > 60) continue;
    blocks[addition.blockIndex].text += ` • ${addition.text}`;
    visibleWordCount += addedWords;
  }

  return Object.freeze({
    kind: 'step',
    slideNumber: position + 5,
    coursePosition: position + 1,
    step,
    module,
    next,
    blocks,
    visibleWordCount,
  });
}

function sourceLine(source) {
  return `${source.title}. ${source.usage} ${source.url} (проверено ${source.checkedAt}).`;
}

export function buildStepSpeakerNotes(spec) {
  const { step, module, next } = spec;
  const tools = step.tools.map((item) => `${item.title}: ${item.description} Поля: ${item.content}.`).join('\n');
  const sources = step.sources.map(sourceLine).join('\n');
  return [
    `МОДУЛЬ ${module.index}. ${module.title}`,
    `ШАГ ${module.index}.${step.index}. ${step.title}`,
    '',
    `ЗАЧЕМ\n${step.why}`,
    `ПОНЯТЬ\n${step.understand.map((item) => `— ${item}`).join('\n')}`,
    `ПРИМЕР\n${step.example.title}. ${step.example.body}`,
    `СДЕЛАТЬ\n${step.action.label}: ${step.action.task}`,
    `РЕЗУЛЬТАТ\n${step.action.output}`,
    `ГОТОВО, ЕСЛИ\n${step.action.doneWhen}`,
    `ФОКУС\n${step.focusPhrase}`,
    `ИНСТРУМЕНТ\n${tools}`,
    `ДАЛЬШЕ\n${next ? `${next.title}.` : 'Курс завершён. Зафиксируйте 30-дневный ритм и вернитесь к текущему bottleneck.'}`,
    `ИСТОЧНИКИ\n${sources}`,
  ].join('\n\n');
}

export function buildDeckSpecs(course, modules, steps) {
  return [
    { kind: 'cover', slideNumber: 1, course },
    { kind: 'outcomes', slideNumber: 2, course, modules },
    { kind: 'map', slideNumber: 3, course, modules, steps },
    { kind: 'mechanics', slideNumber: 4, course },
    ...steps.map((step, index) => buildStepSlideSpec(step, index, modules, steps)),
  ];
}

export const orderLabels = ORDER_LABELS;
