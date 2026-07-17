import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.resolve(
  process.env.REACT_BITS_RUNTIME_ROOT || path.join(siteRoot, 'src/components/react-bits')
);
const fixtureRoot = path.resolve(
  process.env.REACT_BITS_FIXTURE_ROOT || path.join(siteRoot, 'fixtures/react-bits')
);
const sources = [
  {
    component: 'ASCIIText',
    files: {
      jsx: '793db58929aa2b797daccc4fda9f614f213230270ce628fcd497dc6737b365fc'
    }
  },
  {
    component: 'BorderGlow',
    files: {
      jsx: 'a962563b63c329dcc82df3cbeca4840e8abeceb86e496071cb5f5dc278084e6c',
      css: '129e148266e2cf0bd18aeb0143a51891cb100d2117af6b86ef6f912e4f9a730a'
    }
  },
  {
    component: 'DecryptedText',
    files: {
      jsx: '7993f5ae57630eb566c26305574b4accc4d739910f76e5e5f4fc878550f12646'
    }
  },
  {
    component: 'FuzzyText',
    files: {
      jsx: '2d440697b8348dbe5f2428392aba5dfd182693760463030cf992239412932591'
    }
  },
  {
    component: 'Galaxy',
    files: {
      jsx: '2b33cb8c7073fcb1c09986eb20323e3e4ce6937988e73989af7a33ec61a51f39',
      css: '33f3cf3848d440acf6ca85898e66f975582da3fd1070931316784d873176ca35'
    }
  },
  {
    component: 'GhostCursor',
    files: {
      jsx: 'bd1ce61f5bcf286291252e91808d99cca265739c9c26160afada11742ed9e0d1',
      css: '231bd48112987dce58199619424afe821864fc6340368ed5821707ed4c4f788c'
    }
  },
  {
    component: 'LaserFlow',
    files: {
      jsx: 'fbed79c704e54fcac86a7db3877c1791b0c3c4e11b9c2b18b775dfbb2a306adf',
      css: '1c88dfc96ae359d2be420b620ba7d9597c4e728819843369536c97abfa35e88b'
    }
  },
  {
    component: 'LineSidebar',
    files: {
      jsx: 'f1ec8a4fdb5abaa5655c689e0486e47cd0042f10e4b04b2d552a5d6f2b71de06',
      css: 'a828f4a8b1427490e7b684c904bae09de14010460940e444d95a681db6f7064c'
    }
  },
  {
    component: 'OptionWheel',
    files: {
      jsx: '9ac8a90cd89401352c013d83f362afe669ab35726d8e286bf14cbff018b773c3',
      css: '6c5c93d30bdc2dbb13dffc2e36fb5f511e30ae50fb714e7c18bcd7d866196638'
    }
  },
  {
    component: 'ScrollFloat',
    files: {
      jsx: '03bb1dad7ae744f63ae0d234f1670635679d99c52b3c21d0a5794886eb8f3a7b',
      css: '5e2ee6e4f242c37292a5062101e6cf1cd823af71dd99cb7dc1b789a6326981a9'
    }
  },
  {
    component: 'SplashCursor',
    files: {
      jsx: '51f3332d0c6eb820d0397919221212a8ac7719676eb5915430b5d388cf25933a'
    }
  },
  {
    component: 'SpotlightCard',
    files: {
      jsx: '28d333d8efbc1bfbb748ea54cfd5981eb9c9b00600e8f42c177a8fc07009e25d',
      css: '45ec601ffdb8cb13e99053d4375b88289c9bec17eeefb767fe536ded0c926cbe'
    }
  },
  {
    component: 'Strands',
    files: {
      jsx: '159f3b047153e90a0d9c78b3ce2efddc6f0dcd4735b882b4d23ba7f4a8e11965',
      css: '4a5e5e140a8258cb6a029c5c11304bcb48500976f8759b78589e696f8ab29caf'
    }
  },
  {
    component: 'TrueFocus',
    files: {
      jsx: '1fa3d734fa7046de89c69ba75cd4f47cfda5f3532aa73acd3eccbf025da3d833',
      css: 'cde4fdefc1a0b8d74cd67993318b27c1dbbe6f799abd4bfaef7c2f237bbeb5ea'
    }
  }
];

const sha256 = value => createHash('sha256').update(value).digest('hex');

function sourcePath(source, extension) {
  return `${source.component}/${source.component}.${extension}`;
}

function assertHash(value, expected, label) {
  const actual = sha256(value);
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function preflightFixtures() {
  const plannedSources = [];

  for (const source of sources) {
    for (const [extension, expectedHash] of Object.entries(source.files)) {
      const relativePath = sourcePath(source, extension);
      const fixturePath = path.join(fixtureRoot, relativePath);
      const value = readFileSync(fixturePath);
      assertHash(value, expectedHash, relativePath);
      plannedSources.push({ relativePath, expectedHash, value });
    }
  }

  return plannedSources;
}

function writeSources(plannedSources) {
  for (const source of plannedSources) {
    const destination = path.join(runtimeRoot, source.relativePath);
    mkdirSync(path.dirname(destination), { recursive: true });
    writeFileSync(destination, source.value);
  }
}

function checkSources(plannedSources) {
  for (const source of plannedSources) {
    const destination = path.join(runtimeRoot, source.relativePath);
    if (!existsSync(destination)) throw new Error(`${source.relativePath}: runtime source missing`);
    assertHash(readFileSync(destination), source.expectedHash, source.relativePath);
  }
}

const argumentsSet = new Set(process.argv.slice(2));
const modeFlags = [...argumentsSet].filter(argument => ['--write', '--check'].includes(argument));
const allowedArguments = new Set(['--write', '--check']);
if (
  modeFlags.length !== 1 ||
  argumentsSet.size !== process.argv.slice(2).length ||
  [...argumentsSet].some(argument => !allowedArguments.has(argument))
) {
  throw new Error(
    'Usage: node scripts/extract-react-bits.mjs --write|--check'
  );
}

const mode = modeFlags[0].slice(2);
const plannedSources = preflightFixtures();
if (plannedSources.length !== 24) {
  throw new Error(`Expected 24 preflighted files, received ${plannedSources.length}`);
}

if (mode === 'write') writeSources(plannedSources);
else checkSources(plannedSources);

console.log(
  `React Bits source integrity: ${mode} OK (24 files, 14 components, source=fixtures)`
);
