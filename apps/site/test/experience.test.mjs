import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  STATIC_HOSTING_CONTRACT,
  getDeploymentBase,
  getHomeHref,
  resolveAppRoute,
} from '../src/app-route.mjs';
import {
  detectCapabilities,
  shouldReduceEffects,
  shouldUseAnimatedWebGl,
} from '../src/capabilities.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readSiteFile = relativePath => readFileSync(path.join(siteRoot, relativePath), 'utf8');

test('entry runtime is Galaxy-first and retires the old monolith experience', () => {
  const app = readSiteFile('src/App.jsx');
  const entry = readSiteFile('src/entry/EntryGate.jsx');
  const backdrop = readSiteFile('src/galaxy/GalaxyBackdrop.jsx');

  assert.doesNotMatch(app, /BlackMonolithExperience|CourseShell|experience\.jsx|course-ui\.jsx/);
  assert.match(app, /EntryGate/);
  assert.match(app, /CourseApp/);
  assert.match(backdrop, /react-bits\/Galaxy\/Galaxy\.jsx/);
  assert.match(backdrop, /hueShift:\s*240/);
  assert.match(backdrop, /saturation:\s*1/);

  assert.match(entry, /react-bits\/GhostCursor\/GhostCursor\.jsx/);
  assert.match(entry, /<button/);
  assert.match(entry, />sale that shit</);
  assert.match(entry, />click</);
  assert.doesNotMatch(entry, /MacBook|BlackMonolith|monolith|60 уроков/i);
});

test('entry keeps keyboard semantics and omits expensive cursor effects in fallback mode', () => {
  const entry = readSiteFile('src/entry/EntryGate.jsx');

  assert.match(entry, /type="button"/);
  assert.match(entry, /onClick=/);
  assert.match(entry, /effectsEnabled\s*&&/);
  assert.doesNotMatch(entry, /aria-label="Открыть курс"/);
  assert.match(entry, /<span className="entry-gate__title">sale that shit<\/span>/);
});

test('capability fallback is deterministic for motion, save-data and WebGL failure', () => {
  assert.equal(shouldReduceEffects({ webgl: true }), false);
  assert.equal(shouldReduceEffects({ reducedMotion: true, webgl: true }), true);
  assert.equal(shouldReduceEffects({ saveData: true, webgl: true }), true);
  assert.equal(shouldReduceEffects({ webgl: false }), true);

  const capabilities = detectCapabilities({
    windowObject: { matchMedia: () => ({ matches: true }) },
    documentObject: { createElement: () => ({ getContext: () => ({}) }) },
    navigatorObject: { connection: { saveData: true } },
  });
  assert.deepEqual(capabilities, { reducedMotion: true, saveData: true, webgl: true });
});

test('animated WebGL is never mounted for reduced-motion, save-data or WebGL fallback', () => {
  assert.equal(shouldUseAnimatedWebGl({ webgl: true, reduceEffects: false }), true);
  assert.equal(shouldUseAnimatedWebGl({ webgl: true, reduceEffects: true }), false);
  assert.equal(shouldUseAnimatedWebGl({ webgl: false, reduceEffects: false }), false);

  const app = readSiteFile('src/App.jsx');
  const notFound = readSiteFile('src/not-found/NotFoundPage.jsx');
  assert.match(app, /webgl=\{shouldUseAnimatedWebGl\(\{ webgl: capabilities\.webgl, reduceEffects \}\)\}/);
  assert.match(notFound, /webgl=\{shouldUseAnimatedWebGl\(\{ webgl: capabilities\.webgl !== false, reduceEffects \}\)\}/);
  assert.match(notFound, /reduceEffects\s*\?\s*\(\s*<span className="not-found-page__fallback-code">404<\/span>/s);
});

test('route selection sends static and unknown paths to the custom 404', () => {
  assert.equal(getDeploymentBase('https://example.test/course/assets/main-123.js'), '/course/');
  assert.equal(getDeploymentBase('https://example.test/assets/main-123.js'), '/');
  assert.equal(getHomeHref('/course/'), '/course/');

  assert.equal(resolveAppRoute('/course/', '/course/'), 'home');
  assert.equal(resolveAppRoute('/course/index.html', '/course/'), 'home');
  assert.equal(resolveAppRoute('/course/404.html', '/course/'), 'not-found');
  assert.equal(resolveAppRoute('/course/missing', '/course/'), 'not-found');
  assert.equal(resolveAppRoute('/course/nested/missing/', '/course/'), 'not-found');
  assert.equal(resolveAppRoute('/outside/', '/course/'), 'not-found');

  assert.deepEqual(STATIC_HOSTING_CONTRACT, {
    custom404Document: '404.html',
    directDocumentUnderDeploymentBase: true,
    arbitraryNestedErrorDocumentUrls: false,
  });
});

test('custom 404 is a separate Galaxy-styled Vite entry', () => {
  const notFound = readSiteFile('src/not-found/NotFoundPage.jsx');
  const vite = readSiteFile('vite.config.js');

  assert.equal(existsSync(path.join(siteRoot, '404.html')), true);
  assert.equal(existsSync(path.join(siteRoot, 'src/404.jsx')), true);
  assert.match(vite, /404\.html/);
  assert.match(notFound, /react-bits\/FuzzyText\/FuzzyText\.jsx/);
  assert.match(notFound, /react-bits\/BorderGlow\/BorderGlow\.jsx/);
  assert.match(notFound, /<FuzzyText[^>]*>404<\/FuzzyText>/s);
  assert.match(notFound, /<h1 className="visually-hidden">404<\/h1>/);
  assert.match(notFound, /aria-hidden="true"/);
  assert.equal((notFound.match(/href=\{homeHref\}/g) ?? []).length, 2);
  assert.match(notFound, /shouldReduceEffects\(capabilities\)/);
});

test('course destination behind the gate is a new shell, not the retired lesson dump', () => {
  const courseApp = readSiteFile('src/course/CourseApp.jsx');

  assert.doesNotMatch(courseApp, /CourseShell|course-ui|60 уроков|BlackMonolith|MacBook/i);
  assert.match(courseApp, /data-course-app/);
});
