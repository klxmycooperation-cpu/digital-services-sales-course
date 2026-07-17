import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformWithOxc } from 'vite';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(siteRoot, 'react-bits-manifest.json');
const fixtureRoot = path.join(siteRoot, 'fixtures/react-bits');
const extractorPath = path.join(siteRoot, 'scripts/extract-react-bits.mjs');

const expectedHashes = new Map([
  ['src/components/react-bits/ASCIIText/ASCIIText.jsx', '793db58929aa2b797daccc4fda9f614f213230270ce628fcd497dc6737b365fc'],
  ['src/components/react-bits/BorderGlow/BorderGlow.css', '129e148266e2cf0bd18aeb0143a51891cb100d2117af6b86ef6f912e4f9a730a'],
  ['src/components/react-bits/BorderGlow/BorderGlow.jsx', 'a962563b63c329dcc82df3cbeca4840e8abeceb86e496071cb5f5dc278084e6c'],
  ['src/components/react-bits/DecryptedText/DecryptedText.jsx', '7993f5ae57630eb566c26305574b4accc4d739910f76e5e5f4fc878550f12646'],
  ['src/components/react-bits/FuzzyText/FuzzyText.jsx', '2d440697b8348dbe5f2428392aba5dfd182693760463030cf992239412932591'],
  ['src/components/react-bits/Galaxy/Galaxy.css', '33f3cf3848d440acf6ca85898e66f975582da3fd1070931316784d873176ca35'],
  ['src/components/react-bits/Galaxy/Galaxy.jsx', '2b33cb8c7073fcb1c09986eb20323e3e4ce6937988e73989af7a33ec61a51f39'],
  ['src/components/react-bits/GhostCursor/GhostCursor.css', '231bd48112987dce58199619424afe821864fc6340368ed5821707ed4c4f788c'],
  ['src/components/react-bits/GhostCursor/GhostCursor.jsx', 'bd1ce61f5bcf286291252e91808d99cca265739c9c26160afada11742ed9e0d1'],
  ['src/components/react-bits/LaserFlow/LaserFlow.css', '1c88dfc96ae359d2be420b620ba7d9597c4e728819843369536c97abfa35e88b'],
  ['src/components/react-bits/LaserFlow/LaserFlow.jsx', 'fbed79c704e54fcac86a7db3877c1791b0c3c4e11b9c2b18b775dfbb2a306adf'],
  ['src/components/react-bits/LineSidebar/LineSidebar.css', 'a828f4a8b1427490e7b684c904bae09de14010460940e444d95a681db6f7064c'],
  ['src/components/react-bits/LineSidebar/LineSidebar.jsx', 'f1ec8a4fdb5abaa5655c689e0486e47cd0042f10e4b04b2d552a5d6f2b71de06'],
  ['src/components/react-bits/OptionWheel/OptionWheel.css', '6c5c93d30bdc2dbb13dffc2e36fb5f511e30ae50fb714e7c18bcd7d866196638'],
  ['src/components/react-bits/OptionWheel/OptionWheel.jsx', '9ac8a90cd89401352c013d83f362afe669ab35726d8e286bf14cbff018b773c3'],
  ['src/components/react-bits/ScrollFloat/ScrollFloat.css', '5e2ee6e4f242c37292a5062101e6cf1cd823af71dd99cb7dc1b789a6326981a9'],
  ['src/components/react-bits/ScrollFloat/ScrollFloat.jsx', '03bb1dad7ae744f63ae0d234f1670635679d99c52b3c21d0a5794886eb8f3a7b'],
  ['src/components/react-bits/SplashCursor/SplashCursor.jsx', '51f3332d0c6eb820d0397919221212a8ac7719676eb5915430b5d388cf25933a'],
  ['src/components/react-bits/SpotlightCard/SpotlightCard.css', '45ec601ffdb8cb13e99053d4375b88289c9bec17eeefb767fe536ded0c926cbe'],
  ['src/components/react-bits/SpotlightCard/SpotlightCard.jsx', '28d333d8efbc1bfbb748ea54cfd5981eb9c9b00600e8f42c177a8fc07009e25d'],
  ['src/components/react-bits/Strands/Strands.css', '4a5e5e140a8258cb6a029c5c11304bcb48500976f8759b78589e696f8ab29caf'],
  ['src/components/react-bits/Strands/Strands.jsx', '159f3b047153e90a0d9c78b3ce2efddc6f0dcd4735b882b4d23ba7f4a8e11965'],
  ['src/components/react-bits/TrueFocus/TrueFocus.css', 'cde4fdefc1a0b8d74cd67993318b27c1dbbe6f799abd4bfaef7c2f237bbeb5ea'],
  ['src/components/react-bits/TrueFocus/TrueFocus.jsx', '1fa3d734fa7046de89c69ba75cd4f47cfda5f3532aa73acd3eccbf025da3d833']
]);

const expectedRegistry = {
  ASCIIText: { role: 'statement', importPath: './ASCIIText/ASCIIText.jsx' },
  BorderGlow: { role: 'course-cards', importPath: './BorderGlow/BorderGlow.jsx' },
  DecryptedText: { role: 'prologue', importPath: './DecryptedText/DecryptedText.jsx' },
  FuzzyText: { role: 'not-found', importPath: './FuzzyText/FuzzyText.jsx' },
  Galaxy: { role: 'course-shell', importPath: './Galaxy/Galaxy.jsx' },
  GhostCursor: { role: 'entry-pointer', importPath: './GhostCursor/GhostCursor.jsx' },
  LaserFlow: { role: 'process-flow', importPath: './LaserFlow/LaserFlow.jsx' },
  LineSidebar: { role: 'module-navigation', importPath: './LineSidebar/LineSidebar.jsx' },
  OptionWheel: { role: 'topic-selector', importPath: './OptionWheel/OptionWheel.jsx' },
  ScrollFloat: { role: 'scroll-heading', importPath: './ScrollFloat/ScrollFloat.jsx' },
  SplashCursor: { role: 'pointer-effect', importPath: './SplashCursor/SplashCursor.jsx' },
  SpotlightCard: { role: 'secondary-action', importPath: './SpotlightCard/SpotlightCard.jsx' },
  Strands: { role: 'system-map', importPath: './Strands/Strands.jsx' },
  TrueFocus: { role: 'selected-focus', importPath: './TrueFocus/TrueFocus.jsx' }
};

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fixturePathFor = runtimePath =>
  runtimePath.replace('src/components/react-bits/', 'fixtures/react-bits/');
const runtimePathFor = manifestPath =>
  manifestPath.replace('src/components/react-bits/', '');

function walkFiles(root, prefix = '') {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(prefix, entry.name);
    return entry.isDirectory()
      ? walkFiles(path.join(root, entry.name), relativePath)
      : [relativePath];
  });
}

function runExtractor(flags, environment = {}) {
  const normalizedFlags = Array.isArray(flags) ? flags : [flags];
  return spawnSync(process.execPath, [extractorPath, ...normalizedFlags], {
    cwd: siteRoot,
    env: { ...process.env, ...environment },
    encoding: 'utf8'
  });
}

test('manifest declares exactly the 24 immutable source files', () => {
  assert.equal(existsSync(manifestPath), true, 'react-bits-manifest.json must exist');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.files.length, 24);
  assert.deepEqual(
    manifest.files.map(entry => entry.path).sort(),
    [...expectedHashes.keys()].sort()
  );
  assert.deepEqual(
    new Map(manifest.files.map(entry => [entry.path, entry.sha256])),
    expectedHashes
  );
  assert.equal(new Set(manifest.files.map(entry => entry.component)).size, 14);
  for (const entry of manifest.files) {
    assert.equal(entry.fixture, fixturePathFor(entry.path), `${entry.path} fixture provenance`);
  }
});

test('every runtime file is byte-identical to its approved source hash', () => {
  for (const [relativePath, expectedHash] of expectedHashes) {
    const absolutePath = path.join(siteRoot, relativePath);
    assert.equal(existsSync(absolutePath), true, `${relativePath} must exist`);
    assert.equal(sha256(readFileSync(absolutePath)), expectedHash, `${relativePath} changed`);
  }
});

test('all 24 vendored fixtures are byte-identical to runtime sources', () => {
  for (const relativePath of expectedHashes.keys()) {
    const runtime = readFileSync(path.join(siteRoot, relativePath));
    const fixturePath = path.join(siteRoot, fixturePathFor(relativePath));
    assert.equal(existsSync(fixturePath), true, `${fixturePathFor(relativePath)} must exist`);
    assert.deepEqual(runtime, readFileSync(fixturePath));
  }
});

test('components with CSS retain their exact sibling import', () => {
  for (const component of [
    'BorderGlow',
    'Galaxy',
    'GhostCursor',
    'LaserFlow',
    'LineSidebar',
    'OptionWheel',
    'ScrollFloat',
    'SpotlightCard',
    'Strands',
    'TrueFocus'
  ]) {
    const jsx = readFileSync(
      path.join(siteRoot, `src/components/react-bits/${component}/${component}.jsx`),
      'utf8'
    );
    assert.match(jsx, new RegExp(`(?:import\\s+)?['\"]\\./${component}\\.css['\"]`));
  }
});

test('registry is executable lazy metadata with exact roles and loader targets', async () => {
  const registryPath = path.join(siteRoot, 'src/components/react-bits/registry.js');
  assert.equal(existsSync(registryPath), true, 'registry.js must exist');
  const registrySource = readFileSync(registryPath, 'utf8');
  assert.doesNotMatch(registrySource, /^\s*import\s/m, 'registry must not statically import components');

  const moduleUrl = `${pathToFileURL(registryPath).href}?integrity=${Date.now()}`;
  const { reactBitsRegistry } = await import(moduleUrl);
  assert.equal(Object.isFrozen(reactBitsRegistry), true);
  assert.deepEqual(Object.keys(reactBitsRegistry), Object.keys(expectedRegistry));

  for (const [name, expected] of Object.entries(expectedRegistry)) {
    const metadata = reactBitsRegistry[name];
    assert.equal(Object.isFrozen(metadata), true, `${name} metadata must be frozen`);
    assert.equal(metadata.role, expected.role, `${name} role`);
    assert.equal(metadata.importPath, expected.importPath, `${name} importPath`);
    assert.equal(typeof metadata.load, 'function', `${name} loader`);
    assert.match(metadata.load.toString(), new RegExp(`import\\(['\"]${expected.importPath.replaceAll('.', '\\.')}['\"]\\)`));

    const target = path.resolve(path.dirname(registryPath), metadata.importPath);
    assert.equal(existsSync(target), true, `${name} loader target must exist`);
    await transformWithOxc(readFileSync(target, 'utf8'), target, { lang: 'jsx' });
  }
});

test('fixture-only extraction works when the attachment root is unavailable', t => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'react-bits-fixture-only-'));
  const runtimeRoot = path.join(temporaryRoot, 'runtime');
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  mkdirSync(runtimeRoot, { recursive: true });

  const environment = {
    REACT_BITS_RUNTIME_ROOT: runtimeRoot,
    REACT_BITS_FIXTURE_ROOT: fixtureRoot,
    REACT_BITS_ATTACHMENT_ROOT: path.join(temporaryRoot, 'missing-attachments')
  };
  const writeResult = runExtractor('--write', environment);
  assert.equal(writeResult.status, 0, writeResult.stderr);
  assert.match(writeResult.stdout, /source=fixtures/);
  assert.deepEqual(
    walkFiles(runtimeRoot).sort(),
    [...expectedHashes.keys()].map(runtimePathFor).sort()
  );
  for (const [relativePath, expectedHash] of expectedHashes) {
    assert.equal(
      sha256(readFileSync(path.join(runtimeRoot, runtimePathFor(relativePath)))),
      expectedHash
    );
  }

  const checkResult = runExtractor('--check', environment);
  assert.equal(checkResult.status, 0, checkResult.stderr);
});

test('late fixture preflight failure performs zero runtime writes', t => {
  const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), 'react-bits-transaction-'));
  const temporaryFixtures = path.join(temporaryRoot, 'fixtures');
  const runtimeRoot = path.join(temporaryRoot, 'runtime');
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));
  cpSync(fixtureRoot, temporaryFixtures, { recursive: true });
  mkdirSync(runtimeRoot, { recursive: true });
  writeFileSync(path.join(runtimeRoot, 'sentinel.txt'), 'untouched');

  const lateFixture = path.join(temporaryFixtures, 'TrueFocus/TrueFocus.jsx');
  mkdirSync(path.dirname(lateFixture), { recursive: true });
  writeFileSync(lateFixture, 'corrupt late fixture');

  const result = runExtractor('--write', {
    REACT_BITS_RUNTIME_ROOT: runtimeRoot,
    REACT_BITS_FIXTURE_ROOT: temporaryFixtures,
    REACT_BITS_ATTACHMENT_ROOT: path.join(temporaryRoot, 'missing-attachments')
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /TrueFocus\/TrueFocus\.jsx/);
  assert.deepEqual(walkFiles(runtimeRoot), ['sentinel.txt']);
  assert.equal(readFileSync(path.join(runtimeRoot, 'sentinel.txt'), 'utf8'), 'untouched');
});

test('private attachment import mode is not part of the public package', () => {
  const result = runExtractor(['--check', '--from-attachments']);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Usage/);
});

test('third-party notices cover every bundled runtime dependency', () => {
  const notices = readFileSync(path.join(siteRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  for (const requiredText of [
    '`react@19.2.7`',
    '`react-dom@19.2.7`',
    'Copyright (c) Meta Platforms, Inc. and affiliates.',
    '`motion@12.42.2`',
    'Copyright (c) 2024 [Motion](https://motion.dev) B.V.',
    '`ogl@1.0.11`',
    'License: `Unlicense`',
    'Author: Nathan Gordon',
    '`three@0.185.1`',
    'Copyright © 2010-2026 three.js authors'
  ]) {
    assert.match(notices, new RegExp(requiredText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
