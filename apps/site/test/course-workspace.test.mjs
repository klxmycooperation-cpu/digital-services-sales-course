import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.join(siteRoot, 'src/course');
const readCourseFile = name => readFileSync(path.join(courseRoot, name), 'utf8');

test('learning workspace owns one canonical step and the six-section reading order', () => {
  const workspacePath = path.join(courseRoot, 'LearningWorkspace.jsx');
  assert.equal(existsSync(workspacePath), true, 'LearningWorkspace.jsx must exist');

  const source = readCourseFile('LearningWorkspace.jsx');
  const headings = [...source.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(match => match[1].trim());
  assert.deepEqual(headings, ['Зачем', 'Понять', 'Пример', 'Сделать', 'Результат', 'Дальше']);
  assert.match(source, /data-learning-panel/);
  assert.match(source, /step\.why/);
  assert.match(source, /step\.understand/);
  assert.match(source, /step\.example/);
  assert.match(source, /step\.action\.task/);
  assert.match(source, /step\.action\.output/);
  assert.match(source, /step\.action\.doneWhen/);
  assert.match(source, /<ProgressBridge key=\{step\.id\}/);
  assert.doesNotMatch(source, /steps\.map|trainer|roleplay|ролевая/iu);
});

test('title and focus use their exact lazy React Bits components once with readable fallbacks', () => {
  const source = readCourseFile('LearningWorkspace.jsx');

  assert.match(source, /lazy\(\(\)\s*=>\s*import\('\.\.\/components\/react-bits\/DecryptedText\/DecryptedText\.jsx'\)\)/);
  assert.match(source, /lazy\(\(\)\s*=>\s*import\('\.\.\/components\/react-bits\/TrueFocus\/TrueFocus\.jsx'\)\)/);
  assert.equal((source.match(/<DecryptedText/g) ?? []).length, 1);
  assert.equal((source.match(/<TrueFocus/g) ?? []).length, 1);
  assert.match(source, /key=\{step\.id\}/);
  assert.match(source, /text=\{step\.title\}/);
  assert.match(source, /sentence=\{step\.focusPhrase\}/);
  assert.match(source, /effectsAllowed\s*\?/);
  assert.match(source, /<Suspense fallback=\{step\.title\}>/);
  assert.match(source, /<Suspense fallback=\{step\.focusPhrase\}>/);
  assert.match(source, /<h1 id=\{`course-step-title-\$\{step\.id\}`\} tabIndex=\{-1\}>/);
});

test('secondary material uses exact SpotlightCard and source links remain accessible', () => {
  const source = readCourseFile('LearningWorkspace.jsx');

  assert.match(source, /react-bits\/SpotlightCard\/SpotlightCard\.jsx/);
  assert.ok((source.match(/<SpotlightCard/g) ?? []).length >= 3, 'example, tools and sources need SpotlightCard');
  assert.match(source, /step\.tools\.map/);
  assert.match(source, /step\.sources\.map/);
  assert.match(source, /href=\{source\.url\}/);
  assert.match(source, /<details/);
  assert.match(source, /<summary/);
});

test('only the primary ordered action receives BorderGlow and web navigation stays plain', () => {
  const source = readCourseFile('LearningWorkspace.jsx');

  assert.match(source, /react-bits\/BorderGlow\/BorderGlow\.jsx/);
  assert.equal((source.match(/<BorderGlow/g) ?? []).length, 1);
  assert.match(source, />Отметить и продолжить</);
  assert.match(source, />Вернуться к обязательному шагу</);
  assert.match(source, />Вернуться к паутине</);
  assert.match(source, /course-button--primary/);
});

test('ProgressBridge is a readable current-to-next transition with a gated lazy LaserFlow', () => {
  const bridgePath = path.join(courseRoot, 'ProgressBridge.jsx');
  assert.equal(existsSync(bridgePath), true, 'ProgressBridge.jsx must exist');

  const source = readCourseFile('ProgressBridge.jsx');
  assert.match(source, /lazy\(\(\)\s*=>\s*import\('\.\.\/components\/react-bits\/LaserFlow\/LaserFlow\.jsx'\)\)/);
  assert.match(source, /currentStep\.title/);
  assert.match(source, /nextStep\.title/);
  assert.match(source, /effectsAllowed\s*&&\s*nextStep/);
  assert.match(source, /observeNearViewport/);
  assert.match(source, /shouldMountLaserFlow/);
  assert.match(source, /isNearViewport/);
  assert.match(source, /color="#75efff"/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /Маршрут завершён/);
  assert.doesNotMatch(source, /import LaserFlow from/);
});

test('CourseApp replaces the placeholder and passes ordered progress into one workspace', () => {
  const source = readCourseFile('CourseApp.jsx');
  const workspace = readCourseFile('LearningWorkspace.jsx');

  assert.match(source, /import LearningWorkspace from '\.\/LearningWorkspace\.jsx'/);
  assert.equal((source.match(/<LearningWorkspace/g) ?? []).length, 1);
  assert.match(source, /step=\{activeStep\}/);
  assert.match(source, /nextStep=\{activeStep\.nextStepId/);
  assert.match(source, /requiredStepId=\{requiredStepId\}/);
  assert.match(source, /effectsAllowed=\{effectsAllowed\}/);
  assert.equal((source.match(/role="status"/g) ?? []).length, 1, 'destination changes use one persistent live region');
  assert.doesNotMatch(workspace, /course-material__complete"\s+role="status"/);
  assert.doesNotMatch(source, /ActiveStepPlaceholder/);
});

test('lesson boundaries cancel pending Splash activation before the quiet panel opens', () => {
  const source = readCourseFile('CourseApp.jsx');

  assert.match(source, /if \(nextView === 'lesson'\) scheduleSplash\(false\)/);
  assert.match(source, /if \(!effectsAllowed\) scheduleSplash\(false\)/);
  assert.match(source, /onEnterMaterial=\{\(\) => scheduleSplash\(false\)\}/);
  assert.match(source, /WEBGL_lose_context/);
});

test('workspace styling provides an opaque readable panel with mobile and reduced-motion fallbacks', () => {
  const source = readCourseFile('course.css');

  assert.match(source, /\.course-material\s*\{[^}]*background:\s*#(?:050711|080b18|090c19)/s);
  assert.match(source, /\.course-material__section/);
  assert.match(source, /\.course-progress-bridge/);
  assert.match(source, /\.course-progress-bridge__laser/);
  assert.match(source, /@media \(max-width:\s*48rem\)/);
  assert.match(source, /@media \(prefers-reduced-motion:\s*reduce\)/);
});
