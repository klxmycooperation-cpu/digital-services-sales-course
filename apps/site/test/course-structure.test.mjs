import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const courseRoot = path.join(siteRoot, 'src/course');
const readCourseFile = name => readFileSync(path.join(courseRoot, name), 'utf8');

test('Task 4 owns a self-contained course surface', () => {
  for (const file of [
    'CourseApp.jsx',
    'LearningWeb.jsx',
    'CourseSidebar.jsx',
    'DiagnosticWheel.jsx',
    'course-state.mjs',
    'course.css',
  ]) {
    assert.equal(existsSync(path.join(courseRoot, file)), true, `${file} must exist`);
  }
});

test('LearningWeb renders the full 1600 by 1000 SVG as accessible button nodes', () => {
  const source = readCourseFile('LearningWeb.jsx');
  assert.match(source, /viewBox="0 0 1600 1000"/);
  assert.match(source, /<foreignObject/);
  assert.match(source, /<button/);
  assert.match(source, /aria-label=/);
  assert.match(source, /Увеличить паутину/);
  assert.match(source, /Уменьшить паутину/);
  assert.match(source, /Сбросить масштаб/);
  assert.match(source, /data-galaxy-zone="true"/);
  assert.match(source, /course-web__viewport/);
  assert.match(source, /role="group"/);
  assert.doesNotMatch(source, /role="img"/);
  assert.match(source, /classifySequenceEdgeState/);
  assert.match(source, /course-web__edge-state--\$\{edgeState\}/);
  assert.match(source, /data-edge-state=\{edgeState/);
  assert.equal((source.match(/\bdata-course-control\b/g) ?? []).length, 4);
  assert.match(source, /const MIN_ZOOM = 0\.82/);
  assert.match(source, /const DEFAULT_ZOOM = 1/);
  assert.match(source, /useState\(DEFAULT_ZOOM\)/);
  assert.match(source, /setZoom\(DEFAULT_ZOOM\)/);
  assert.match(source, /useLayoutEffect/);
  assert.match(source, /useRef/);
  assert.match(source, /calculateLearningWebScrollOffsets/);
  assert.match(source, /ref=\{viewportRef\}/);
  assert.match(source, /centerOnNextLayoutRef/);
  assert.match(source, /handleResetZoom/);
  assert.match(source, /<h1 id="course-web-title" tabIndex=\{-1\}>/);
  assert.match(source, /moduleAccessibleLabel/);
  assert.match(source, /stepAccessibleLabel/);
  assert.doesNotMatch(source, /setTimeout|\bsleep\s*\(/);
});

test('CourseSidebar keeps exact LineSidebar untouched and adds a native companion control', () => {
  const source = readCourseFile('CourseSidebar.jsx');
  assert.match(source, /react-bits\/LineSidebar\/LineSidebar\.jsx/);
  assert.match(source, /key=\{activeModuleId\}/);
  assert.match(source, /defaultActive=\{activeIndex\}/);
  assert.match(source, /<select/);
  assert.match(source, /aria-label="Выбрать тему обучения"/);
  assert.doesNotMatch(source, /course-sidebar__companion-button/);
});

test('DiagnosticWheel maps the exact OptionWheel to four canonical bottlenecks', () => {
  const source = readCourseFile('DiagnosticWheel.jsx');
  assert.match(source, /react-bits\/OptionWheel\/OptionWheel\.jsx/);
  assert.match(source, /Что сейчас мешает продажам\?/);
  assert.match(source, /course\.diagnostics/);
  assert.match(source, /inspectStepId/);
  assert.match(source, /Перейти к рекомендованному шагу/);
  assert.match(source, /<select/);
  assert.match(source, /aria-label="Выбрать проблему продаж"/);
  assert.match(source, /resolveDiagnosticSelection/);
  assert.match(source, /course-diagnostic__announcement"\s+role="status"\s+aria-live="polite"\s+aria-atomic="true"/);
  assert.doesNotMatch(source, /course-diagnostic__result"\s+role="status"/);
});

test('CourseApp owns all learning state and zones SplashCursor away from material', () => {
  const source = readCourseFile('CourseApp.jsx');
  assert.match(source, /react-bits\/SplashCursor\/SplashCursor\.jsx/);
  assert.match(source, /data-course-app/);
  assert.match(source, /data-learning-panel/);
  assert.match(source, /data-galaxy-zone/);
  assert.match(source, /completedStepIds/);
  assert.match(source, /activeModuleId/);
  assert.match(source, /activeStepId/);
  assert.match(source, /diagnosticId/);
  assert.match(source, /splashActive\s*&&\s*effectsAllowed/);
  assert.match(source, /nextView\s*===\s*'lesson'\)\s*scheduleSplash\(false\)/);
  assert.match(source, /shouldActivateSplashCursor/);
  assert.match(source, /resolveCourseHistoryAction/);
  assert.match(source, /WEBGL_lose_context/);
  assert.match(source, /lazy\(\(\)\s*=>\s*import\(/);
  assert.match(source, /<Suspense fallback=\{null\}>/);
  assert.match(source, /focusCourseDestination/);
  assert.match(source, /course-destination-announcement/);
  assert.match(source, /aria-live="polite"/);
  assert.doesNotMatch(source, /import SplashCursor from/);
  assert.doesNotMatch(source, /trainer|roleplay|ролевая/iu);
});

test('course styling is scoped and includes readable state, focus and pan fallbacks', () => {
  const source = readCourseFile('course.css');
  assert.match(source, /\[data-course-app\]/);
  assert.match(source, /overflow:\s*auto/);
  assert.match(source, /:focus-visible/);
  assert.match(source, /course-web__node--completed/);
  assert.match(source, /course-web__node--current/);
  assert.match(source, /course-web__node--next/);
  assert.match(source, /course-web__header h1:focus-visible/);
  assert.match(source, /course-material__header h1:focus-visible/);
  assert.match(source, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(source, /var\(--course-text\)/);
});
