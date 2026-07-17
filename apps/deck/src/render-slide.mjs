import { theme, titleSize } from './theme.mjs';

function addText(slide, name, text, position, options = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox',
    name,
    position,
    fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = String(text);
  shape.text.style = {
    fontSize: options.fontSize ?? 18,
    bold: options.bold ?? false,
    color: options.color ?? theme.color.text,
    typeface: options.typeface ?? theme.type.body,
    alignment: options.alignment ?? 'left',
    verticalAlignment: options.verticalAlignment ?? 'top',
    lineSpacing: options.lineSpacing ?? 1,
    autoFit: options.autoFit ?? 'shrinkText',
    insets: options.insets ?? { top: 0, right: 0, bottom: 0, left: 0 },
  };
  return shape;
}

function addShape(slide, geometry, name, position, fill, line = 'none', width = 0) {
  return slide.shapes.add({
    geometry,
    name,
    position,
    fill,
    line: { style: 'solid', fill: line, width },
  });
}

function addLine(slide, name, x1, y1, x2, y2, color, width = 1, style = 'solid') {
  return slide.shapes.add({
    geometry: 'line',
    name,
    position: { left: x1, top: y1, width: x2 - x1, height: y2 - y1 },
    fill: 'none',
    line: { style, fill: color, width },
  });
}

function seeded(seed, index) {
  const value = Math.sin(seed * 93.17 + index * 41.73) * 43758.5453;
  return value - Math.floor(value);
}

function addGalaxyBackdrop(slide, accent, seed, { quiet = false } = {}) {
  slide.background.fill = 'linear(18deg, #03030B 0%, #08071A 48%, #101036 100%)';
  addShape(slide, 'ellipse', `galaxy-${seed}-nebula-a`,
    { left: 0, top: 340, width: 590, height: 380 },
    `radial(${accent}/24 0%, ${accent}/9 48%, ${accent}/0 100%)`);
  addShape(slide, 'ellipse', `galaxy-${seed}-nebula-b`,
    { left: 840, top: 0, width: 440, height: 390 },
    'radial(#5CE1E6/18 0%, #6EA8FF/7 52%, #6EA8FF/0 100%)');
  addShape(slide, 'ellipse', `galaxy-${seed}-halo`,
    { left: 350, top: 120, width: 820, height: 520 },
    `radial(#FFFFFF/${quiet ? 2 : 4} 0%, ${accent}/5 38%, ${accent}/0 100%)`);

  const starCount = quiet ? 20 : 34;
  for (let index = 0; index < starCount; index += 1) {
    const size = 1.5 + seeded(seed, index * 3) * 3.5;
    const left = 24 + seeded(seed, index * 3 + 1) * 1230;
    const top = 18 + seeded(seed, index * 3 + 2) * 678;
    const color = index % 7 === 0 ? `${accent}/80` : '#FFFFFF/58';
    addShape(slide, 'ellipse', `galaxy-${seed}-star-${index}`,
      { left, top, width: size, height: size }, color);
  }

  for (let index = 0; index < 4; index += 1) {
    const left = 720 + index * 110;
    const top = 82 + index * 42;
    addLine(slide, `galaxy-${seed}-streak-${index}`, left, top, left + 76, top - 20, `${accent}/18`, 1);
  }
}

function addFooter(slide, slideNumber, accent = theme.color.violet) {
  addText(slide, `footer-${slideNumber}-course`, 'СИСТЕМА ПРОДАЖ ЦИФРОВЫХ УСЛУГ',
    { left: 64, top: 680, width: 430, height: 18 },
    { fontSize: 11, bold: true, color: theme.color.faint, typeface: theme.type.mono, autoFit: 'none' });
  addLine(slide, `footer-${slideNumber}-line`, 1035, 688, 1168, 688, `${accent}/45`, 1);
  addText(slide, `footer-${slideNumber}-page`, String(slideNumber).padStart(2, '0'),
    { left: 1180, top: 679, width: 36, height: 20 },
    { fontSize: 12, bold: true, color: accent, typeface: theme.type.mono, alignment: 'right', autoFit: 'none' });
}

export function renderCover(slide, spec) {
  const accent = theme.color.violet;
  addGalaxyBackdrop(slide, accent, 1);

  for (let index = 0; index < 7; index += 1) {
    const y = 118 + index * 68;
    if (index < 6) addLine(slide, `cover-path-${index}`, 1042, y + 18, 1042, y + 86, `${theme.moduleAccents[index]}/45`, 2);
  }
  for (let index = 0; index < 7; index += 1) {
    const y = 118 + index * 68;
    addShape(slide, 'ellipse', `cover-node-${index}`, { left: 1029, top: y + 5, width: 26, height: 26 }, theme.moduleAccents[index], '#FFFFFF/35', 1);
    addText(slide, `cover-node-label-${index}`, String(index + 1), { left: 1031, top: y + 8, width: 22, height: 18 }, {
      fontSize: 11, bold: true, color: theme.color.void, alignment: 'center', verticalAlignment: 'middle', autoFit: 'none',
    });
  }

  addText(slide, 'cover-kicker', 'ПРАКТИЧЕСКИЙ КУРС · 7 МОДУЛЕЙ · 28 ШАГОВ',
    { left: 64, top: 66, width: 670, height: 30 },
    { fontSize: 14, bold: true, color: theme.color.cyan, typeface: theme.type.mono, autoFit: 'none' });
  addText(slide, 'cover-title', 'Система продаж\nцифровых услуг',
    { left: 64, top: 142, width: 810, height: 220 },
    { fontSize: 66, bold: true, color: theme.color.white, typeface: theme.type.display, lineSpacing: 0.9, autoFit: 'none' });
  addText(slide, 'cover-subtitle', 'Один следующий факт вместо хаоса действий.',
    { left: 68, top: 414, width: 690, height: 54 },
    { fontSize: 26, color: theme.color.text, autoFit: 'none' });
  addLine(slide, 'cover-focus-line', 68, 500, 278, 500, `${accent}/70`, 3);
  addText(slide, 'cover-focus', 'Быстро. Понятно. Без воды.',
    { left: 68, top: 524, width: 520, height: 38 },
    { fontSize: 20, bold: true, color: theme.color.muted, autoFit: 'none' });
  addFooter(slide, spec.slideNumber, accent);
}

export function renderOutcomes(slide, spec) {
  const accent = theme.color.cyan;
  addGalaxyBackdrop(slide, accent, 2, { quiet: true });
  addText(slide, 'outcome-kicker', 'ЧТО ОСТАНЕТСЯ ПОСЛЕ КУРСА',
    { left: 64, top: 54, width: 420, height: 24 },
    { fontSize: 13, bold: true, color: accent, typeface: theme.type.mono, autoFit: 'none' });
  addText(slide, 'outcome-title', 'Рабочая система,\nа не список советов',
    { left: 64, top: 104, width: 480, height: 150 },
    { fontSize: 46, bold: true, color: theme.color.white, typeface: theme.type.display, lineSpacing: 0.92, autoFit: 'none' });
  addText(slide, 'outcome-body', 'Каждый модуль заканчивается конкретным артефактом. Вместе они образуют путь от ценности до повторяемого результата.',
    { left: 66, top: 300, width: 430, height: 112 },
    { fontSize: 21, color: theme.color.muted, lineSpacing: 1.12 });
  addShape(slide, 'ellipse', 'outcome-core', { left: 122, top: 472, width: 220, height: 118 },
    'radial(#5CE1E6/28 0%, #9D7BFF/12 52%, #9D7BFF/0 100%)', `${accent}/60`, 1.5);
  addText(slide, 'outcome-core-text', '1 система\n30 дней', { left: 142, top: 500, width: 180, height: 60 }, {
    fontSize: 24, bold: true, color: theme.color.white, alignment: 'center', verticalAlignment: 'middle', autoFit: 'none',
  });

  const rowX = 588;
  spec.modules.forEach((module, index) => {
    const y = 70 + index * 82;
    const rowAccent = theme.moduleAccents[index];
    addLine(slide, `outcome-row-${index}-rule`, rowX, y + 58, 1158, y + 58, `${rowAccent}/25`, 1);
    addText(slide, `outcome-row-${index}-number`, String(index + 1).padStart(2, '0'),
      { left: rowX, top: y, width: 44, height: 25 },
      { fontSize: 13, bold: true, color: rowAccent, typeface: theme.type.mono, autoFit: 'none' });
    addText(slide, `outcome-row-${index}-module`, module.title,
      { left: rowX + 52, top: y - 1, width: 270, height: 26 },
      { fontSize: 18, bold: true, color: theme.color.white, autoFit: 'none' });
    addText(slide, `outcome-row-${index}-artifact`, module.artifact,
      { left: rowX + 52, top: y + 27, width: 510, height: 38 },
      { fontSize: 15.5, color: theme.color.muted, autoFit: 'shrinkText' });
  });
  addFooter(slide, spec.slideNumber, accent);
}

function point(cx, cy, radius, angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

export function renderCourseMap(slide, spec) {
  const accent = theme.color.violet;
  addGalaxyBackdrop(slide, accent, 3, { quiet: true });
  addText(slide, 'map-kicker', 'БОЛЬШАЯ ПАУТИНА КУРСА', { left: 64, top: 48, width: 420, height: 24 }, {
    fontSize: 13, bold: true, color: accent, typeface: theme.type.mono, autoFit: 'none',
  });
  addText(slide, 'map-title', '28 шагов образуют одну последовательность', { left: 64, top: 82, width: 760, height: 58 }, {
    fontSize: 38, bold: true, color: theme.color.white, typeface: theme.type.display, autoFit: 'none',
  });
  addText(slide, 'map-subtitle', 'Модули показывают направления. Светящаяся цепочка — порядок движения.', { left: 826, top: 92, width: 390, height: 48 }, {
    fontSize: 16, color: theme.color.muted, alignment: 'right', autoFit: 'none',
  });

  const center = { x: 640, y: 408 };
  const moduleRadius = 190;
  const stepRadius = 282;
  const modulePoints = spec.modules.map((module, index) => point(center.x, center.y, moduleRadius, -90 + index * (360 / 7)));
  const stepPoints = [];
  spec.modules.forEach((module, moduleIndex) => {
    for (let local = 0; local < 4; local += 1) {
      const angle = -90 + moduleIndex * (360 / 7) + (local - 1.5) * 4.5;
      stepPoints.push(point(center.x, center.y, stepRadius, angle));
    }
  });

  modulePoints.forEach((modulePoint, index) => {
    addLine(slide, `map-spoke-${index}`, center.x, center.y, modulePoint.x, modulePoint.y, `${theme.moduleAccents[index]}/25`, 1.2);
  });
  for (let index = 0; index < stepPoints.length - 1; index += 1) {
    addLine(slide, `map-sequence-${index}`, stepPoints[index].x, stepPoints[index].y, stepPoints[index + 1].x, stepPoints[index + 1].y,
      index < 8 ? `${theme.color.cyan}/65` : `${theme.color.violet}/32`, index < 8 ? 2 : 1.2);
  }
  spec.modules.forEach((module, moduleIndex) => {
    const modulePoint = modulePoints[moduleIndex];
    for (let local = 0; local < 4; local += 1) {
      const stepPoint = stepPoints[moduleIndex * 4 + local];
      addLine(slide, `map-branch-${moduleIndex}-${local}`, modulePoint.x, modulePoint.y, stepPoint.x, stepPoint.y,
        `${theme.moduleAccents[moduleIndex]}/28`, 1);
    }
  });

  addShape(slide, 'ellipse', 'map-center-halo', { left: center.x - 112, top: center.y - 74, width: 224, height: 148 },
    'radial(#FFFFFF/18 0%, #9D7BFF/18 46%, #9D7BFF/0 100%)', `${accent}/70`, 1.5);
  addText(slide, 'map-center-title', 'Система\nпродаж', { left: center.x - 84, top: center.y - 34, width: 168, height: 74 }, {
    fontSize: 24, bold: true, color: theme.color.white, alignment: 'center', verticalAlignment: 'middle', autoFit: 'none',
  });

  spec.modules.forEach((module, moduleIndex) => {
    const modulePoint = modulePoints[moduleIndex];
    const rowAccent = theme.moduleAccents[moduleIndex];
    addShape(slide, 'roundRect', `map-module-${module.id}`,
      { left: modulePoint.x - 69, top: modulePoint.y - 27, width: 138, height: 54 },
      '#0C0B20/94', `${rowAccent}/70`, 1.4);
    addText(slide, `map-module-${module.id}-label`, `${module.index}. ${module.shortTitle}`,
      { left: modulePoint.x - 59, top: modulePoint.y - 12, width: 118, height: 26 },
      { fontSize: 15.5, bold: true, color: theme.color.white, alignment: 'center', verticalAlignment: 'middle', autoFit: 'shrinkText' });
    for (let local = 0; local < 4; local += 1) {
      const stepPoint = stepPoints[moduleIndex * 4 + local];
      addShape(slide, 'ellipse', `map-step-${moduleIndex}-${local}`,
        { left: stepPoint.x - 13, top: stepPoint.y - 13, width: 26, height: 26 },
        moduleIndex < 2 ? rowAccent : `${rowAccent}/55`, '#FFFFFF/24', 1);
      addText(slide, `map-step-${moduleIndex}-${local}-label`, String(local + 1),
        { left: stepPoint.x - 9, top: stepPoint.y - 8, width: 18, height: 17 },
        { fontSize: 10.5, bold: true, color: theme.color.void, alignment: 'center', verticalAlignment: 'middle', autoFit: 'none' });
    }
  });
  addFooter(slide, spec.slideNumber, accent);
}

export function renderMechanics(slide, spec) {
  const accent = theme.color.magenta;
  addGalaxyBackdrop(slide, accent, 4, { quiet: true });
  addText(slide, 'mechanics-kicker', 'КАК ЧИТАТЬ КАЖДЫЙ ШАГ', { left: 64, top: 50, width: 420, height: 24 }, {
    fontSize: 13, bold: true, color: accent, typeface: theme.type.mono, autoFit: 'none',
  });
  addText(slide, 'mechanics-title', 'Шесть коротких блоков ведут к одному результату', { left: 64, top: 86, width: 920, height: 58 }, {
    fontSize: 39, bold: true, color: theme.color.white, typeface: theme.type.display, autoFit: 'none',
  });
  const labels = ['Зачем', 'Понять', 'Пример', 'Сделать', 'Результат', 'Дальше'];
  const descriptions = ['смысл шага', 'два факта', 'конкретная сцена', 'одно действие', 'готовый артефакт', 'следующий шаг'];
  const colors = [theme.color.cyan, theme.color.blue, theme.color.violet, theme.color.magenta, theme.color.rose, '#F3A6D8'];
  const cx = 640;
  const cy = 405;
  const radius = 220;
  const points = labels.map((_, index) => point(cx, cy, radius, -90 + index * 60));
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    addLine(slide, `mechanics-edge-${index}`, points[index].x, points[index].y, next.x, next.y, `${colors[index]}/46`, 2);
  }
  points.forEach((item, index) => {
    addShape(slide, 'ellipse', `mechanics-node-${index}`, { left: item.x - 56, top: item.y - 56, width: 112, height: 112 },
      `radial(${colors[index]}/42 0%, ${colors[index]}/16 56%, ${colors[index]}/4 100%)`, `${colors[index]}/72`, 1.5);
    addText(slide, `mechanics-label-${index}`, labels[index], { left: item.x - 50, top: item.y - 20, width: 100, height: 26 }, {
      fontSize: 19, bold: true, color: theme.color.white, alignment: 'center', autoFit: 'none',
    });
    addText(slide, `mechanics-description-${index}`, descriptions[index], { left: item.x - 55, top: item.y + 12, width: 110, height: 22 }, {
      fontSize: 13.5, color: theme.color.muted, alignment: 'center', autoFit: 'none',
    });
  });
  addShape(slide, 'ellipse', 'mechanics-core', { left: cx - 116, top: cy - 76, width: 232, height: 152 },
    'radial(#FFFFFF/18 0%, #9D7BFF/20 42%, #9D7BFF/0 100%)', `${accent}/55`, 1.2);
  addText(slide, 'mechanics-core-text', 'Один слайд\n= один шаг', { left: cx - 85, top: cy - 34, width: 170, height: 74 }, {
    fontSize: 25, bold: true, color: theme.color.white, alignment: 'center', verticalAlignment: 'middle', autoFit: 'none',
  });
  addFooter(slide, spec.slideNumber, accent);
}

function addModuleProgress(slide, moduleIndex, accent, seed) {
  const startX = 76;
  const y = 615;
  for (let index = 0; index < 6; index += 1) {
    addLine(slide, `step-${seed}-progress-line-${index}`, startX + index * 56 + 16, y + 10, startX + (index + 1) * 56 + 2, y + 10,
      index < moduleIndex - 1 ? `${accent}/70` : '#4A4565/55', 2);
  }
  for (let index = 0; index < 7; index += 1) {
    const current = index === moduleIndex - 1;
    const completed = index < moduleIndex - 1;
    addShape(slide, 'ellipse', `step-${seed}-progress-node-${index}`,
      { left: startX + index * 56, top: y, width: current ? 24 : 20, height: current ? 24 : 20 },
      current ? accent : completed ? `${accent}/60` : '#2B2744', current ? '#FFFFFF/52' : '#5B557A/30', 1);
  }
}

export function renderStepSlide(slide, spec) {
  const accent = theme.moduleAccents[spec.module.index - 1];
  const seed = spec.slideNumber;
  addGalaxyBackdrop(slide, accent, seed, { quiet: true });

  addText(slide, `step-${seed}-kicker`, `МОДУЛЬ ${spec.module.index}/7 · ШАГ ${spec.module.index}.${spec.step.index} · ${String(spec.coursePosition).padStart(2, '0')}/28`,
    { left: 64, top: 54, width: 500, height: 24 },
    { fontSize: 13, bold: true, color: accent, typeface: theme.type.mono, autoFit: 'none' });
  addText(slide, `step-${seed}-module`, spec.module.title,
    { left: 64, top: 88, width: 510, height: 28 },
    { fontSize: 17, bold: true, color: theme.color.muted, autoFit: 'none' });
  addText(slide, `step-${seed}-title`, spec.step.title,
    { left: 64, top: 142, width: 548, height: 176 },
    { fontSize: titleSize(spec.step.title), bold: true, color: theme.color.white, typeface: theme.type.display, lineSpacing: 0.94, autoFit: 'shrinkText' });
  addLine(slide, `step-${seed}-focus-line`, 64, 360, 168, 360, `${accent}/85`, 3);
  addText(slide, `step-${seed}-focus`, spec.step.focusPhrase,
    { left: 64, top: 386, width: 500, height: 94 },
    { fontSize: 24, bold: true, color: accent, lineSpacing: 1.06, autoFit: 'shrinkText' });
  addText(slide, `step-${seed}-ghost-module`, String(spec.module.index).padStart(2, '0'),
    { left: 398, top: 478, width: 180, height: 104 },
    { fontSize: 82, bold: true, color: `${accent}/11`, typeface: theme.type.mono, alignment: 'right', autoFit: 'none' });
  addModuleProgress(slide, spec.module.index, accent, seed);

  addShape(slide, 'roundRect', `step-${seed}-material`, { left: 650, top: 42, width: 566, height: 618 },
    '#080716/94', `${accent}/38`, 1.2);
  addLine(slide, `step-${seed}-sequence-line`, 700, 82, 700, 618, `${accent}/34`, 2);
  spec.blocks.forEach((block, index) => {
    const top = 74 + index * 92;
    addShape(slide, 'ellipse', `step-${seed}-node-${index}`, { left: 690, top: top + 17, width: 20, height: 20 },
      index === 3 ? accent : `${accent}/58`, '#FFFFFF/28', 1);
    addText(slide, `step-${seed}-label-${index}`, block.label.toUpperCase(),
      { left: 730, top: top + 12, width: 110, height: 20 },
      { fontSize: 12.5, bold: true, color: accent, typeface: theme.type.mono, autoFit: 'none' });
    addText(slide, `step-${seed}-block-${index}`, block.text,
      { left: 842, top: top + 5, width: 330, height: 62 },
      { fontSize: 17.5, color: theme.color.text, lineSpacing: 1.08, autoFit: 'shrinkText' });
    if (index < spec.blocks.length - 1) {
      addLine(slide, `step-${seed}-rule-${index}`, 730, top + 77, 1172, top + 77, '#302B54/62', 1);
    }
  });
  addFooter(slide, spec.slideNumber, accent);
}

export function renderDeckSlide(slide, spec) {
  if (spec.kind === 'cover') return renderCover(slide, spec);
  if (spec.kind === 'outcomes') return renderOutcomes(slide, spec);
  if (spec.kind === 'map') return renderCourseMap(slide, spec);
  if (spec.kind === 'mechanics') return renderMechanics(slide, spec);
  if (spec.kind === 'step') return renderStepSlide(slide, spec);
  throw new Error(`Unknown slide kind: ${spec.kind}`);
}
