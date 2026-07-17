import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKED_AT = '2026-07-15';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const suiteRoot = resolve(scriptDirectory, '..');
const shardPaths = [
  resolve(suiteRoot, 'research/source-ledger.ru-cis.json'),
  resolve(suiteRoot, 'research/source-ledger.international.json'),
  resolve(suiteRoot, 'research/source-ledger.methods.json')
];
const outputPath = resolve(suiteRoot, 'research/source-ledger.json');
const claimFields = [
  'id',
  'region',
  'topic',
  'claim',
  'sourceTitle',
  'url',
  'publisher',
  'pageDate',
  'checkedAt',
  'primary',
  'limitations'
];
const requiredStringFields = [
  'id',
  'region',
  'topic',
  'claim',
  'sourceTitle',
  'url',
  'publisher',
  'checkedAt',
  'limitations'
];

function compareIds(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isCalendarDate(value) {
  if (typeof value !== 'string') return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysPerMonth[month - 1];
}

function assertNonBlankString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Claim field ${fieldName} must be a nonblank string.`);
  }
}

export function validateClaim(claim, expectedCheckedAt = CHECKED_AT) {
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
    throw new Error('Each claim must be an object.');
  }

  const actualKeys = Object.keys(claim);
  const missingKeys = claimFields.filter((fieldName) => !actualKeys.includes(fieldName));
  const unexpectedKeys = actualKeys.filter((fieldName) => !claimFields.includes(fieldName));
  if (missingKeys.length > 0 || unexpectedKeys.length > 0) {
    throw new Error(
      `Claim keys must exactly match the schema; missing=[${missingKeys.join(', ')}] unexpected=[${unexpectedKeys.join(', ')}].`
    );
  }

  for (const fieldName of requiredStringFields) {
    assertNonBlankString(claim[fieldName], fieldName);
  }

  if (!/^(?:RU|CIS|INT|METHOD)-\d{3}$/.test(claim.id)) {
    throw new Error(`Claim id has an unsupported format: ${claim.id}.`);
  }

  if (claim.checkedAt !== expectedCheckedAt) {
    throw new Error(`Claim ${claim.id} checkedAt must be ${expectedCheckedAt}.`);
  }

  if (claim.pageDate !== null && !isCalendarDate(claim.pageDate)) {
    throw new Error(`Claim ${claim.id} pageDate must be null or a real YYYY-MM-DD calendar date.`);
  }

  if (claim.primary !== true) {
    throw new Error(`Claim ${claim.id} primary must be true.`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(claim.url);
  } catch {
    throw new Error(`Claim ${claim.id} url must be a valid absolute HTTPS URL.`);
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error(`Claim ${claim.id} url must use HTTPS.`);
  }

  return claim;
}

function validateShard(shard, shardIndex) {
  if (!shard || typeof shard !== 'object' || Array.isArray(shard)) {
    throw new Error(`Shard ${shardIndex + 1} must be an object.`);
  }

  if (shard.checkedAt !== CHECKED_AT) {
    throw new Error(`Shard ${shardIndex + 1} checkedAt must be ${CHECKED_AT}.`);
  }

  if (!Array.isArray(shard.claims) || shard.claims.length === 0) {
    throw new Error(`Shard ${shardIndex + 1} claims must be a nonempty array.`);
  }

  const ids = shard.claims.map((claim) => validateClaim(claim, shard.checkedAt).id);
  const sortedIds = [...ids].sort(compareIds);
  if (ids.some((id, index) => id !== sortedIds[index])) {
    throw new Error(`Shard ${shardIndex + 1} claim ids must be sorted.`);
  }

  return shard.claims;
}

export function mergeLedgers(shards) {
  if (!Array.isArray(shards) || shards.length !== 3) {
    throw new Error('Exactly three research ledger shards are required.');
  }

  const claims = shards.flatMap((shard, index) => validateShard(shard, index));
  const seen = new Set();
  for (const claim of claims) {
    if (seen.has(claim.id)) {
      throw new Error(`Duplicate claim id: ${claim.id}.`);
    }
    seen.add(claim.id);
  }

  return {
    checkedAt: CHECKED_AT,
    claims: [...claims].sort((left, right) => compareIds(left.id, right.id))
  };
}

async function main() {
  const shards = await Promise.all(
    shardPaths.map(async (path) => JSON.parse(await readFile(path, 'utf8')))
  );
  const ledger = mergeLedgers(shards);
  await writeFile(outputPath, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');
  console.log(`Merged ${ledger.claims.length} research claims into ${outputPath}.`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`Research ledger merge failed: ${error.message}`);
    process.exitCode = 1;
  });
}
