import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { mergeLedgers, validateClaim } from './merge-research-ledger.mjs';

const CHECKED_AT = '2026-07-15';
const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function claim(id, overrides = {}) {
  return {
    id,
    region: 'international',
    topic: 'outreach',
    claim: 'Use a relevant, transparent message and respect the recipient’s choices.',
    sourceTitle: 'Official guidance',
    url: 'https://example.org/guidance',
    publisher: 'Example authority',
    pageDate: null,
    checkedAt: CHECKED_AT,
    primary: true,
    limitations: 'Apply the current rules and product terms to the actual context.',
    ...overrides
  };
}

function shard(ids) {
  return {
    checkedAt: CHECKED_AT,
    claims: ids.map((id) => claim(id))
  };
}

test('validates and merges three shards into deterministic id order', () => {
  const result = mergeLedgers([
    shard(['RU-001', 'RU-002']),
    shard(['INT-001', 'INT-002']),
    shard(['METHOD-001', 'METHOD-002'])
  ]);

  assert.equal(result.checkedAt, CHECKED_AT);
  assert.deepEqual(
    result.claims.map(({ id }) => id),
    ['INT-001', 'INT-002', 'METHOD-001', 'METHOD-002', 'RU-001', 'RU-002']
  );
});

test('rejects duplicate claim ids across shards', () => {
  assert.throws(
    () => mergeLedgers([shard(['RU-001']), shard(['RU-001']), shard(['METHOD-001'])]),
    /duplicate.*RU-001/i
  );
});

test('rejects missing or malformed required fields', () => {
  const malformed = claim('INT-001');
  delete malformed.limitations;
  assert.throws(() => validateClaim(malformed, CHECKED_AT), /limitations/i);
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: 2026 }), CHECKED_AT), /pageDate/i);
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: '  ' }), CHECKED_AT), /pageDate/i);
});

test('requires exactly the claim key set regardless of input key order', () => {
  const reordered = Object.fromEntries(Object.entries(claim('INT-001')).reverse());
  assert.doesNotThrow(() => validateClaim(reordered, CHECKED_AT));
  assert.throws(
    () => validateClaim(claim('INT-001', { evidenceNote: 'not part of the schema' }), CHECKED_AT),
    /unexpected|exact.*keys/i
  );
});

test('accepts only real YYYY-MM-DD calendar dates or null', () => {
  assert.doesNotThrow(() => validateClaim(claim('INT-001', { pageDate: null }), CHECKED_AT));
  assert.doesNotThrow(() => validateClaim(claim('INT-001', { pageDate: '2024-02-29' }), CHECKED_AT));
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: 'not-a-date' }), CHECKED_AT), /pageDate/i);
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: '2026-02-30' }), CHECKED_AT), /pageDate/i);
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: '2025-02-29' }), CHECKED_AT), /pageDate/i);
  assert.throws(() => validateClaim(claim('INT-001', { pageDate: 20260715 }), CHECKED_AT), /pageDate/i);
});

test('rejects malformed shard roots', () => {
  assert.throws(
    () => mergeLedgers([null, shard(['INT-001']), shard(['METHOD-001'])]),
    /shard 1.*object/i
  );
  assert.throws(
    () => mergeLedgers([{ checkedAt: CHECKED_AT, claims: [] }, shard(['INT-001']), shard(['METHOD-001'])]),
    /nonempty/i
  );
});

test('rejects a shard whose ids are not sorted', () => {
  assert.throws(
    () => mergeLedgers([shard(['RU-002', 'RU-001']), shard(['INT-001']), shard(['METHOD-001'])]),
    /sorted/i
  );
});

test('rejects checkedAt mismatches, non-primary sources, and non-HTTPS urls', () => {
  assert.throws(
    () => validateClaim(claim('INT-001', { checkedAt: '2026-07-14' }), CHECKED_AT),
    /checkedAt/i
  );
  assert.throws(
    () => validateClaim(claim('INT-001', { primary: false }), CHECKED_AT),
    /primary/i
  );
  assert.throws(
    () => validateClaim(claim('INT-001', { url: 'http://example.org/guidance' }), CHECKED_AT),
    /https/i
  );
});

test('RU/CIS research uses the required official Russian and Belarusian legal sources', () => {
  const ledger = JSON.parse(
    readFileSync(resolve(PROJECT_ROOT, 'research/source-ledger.ru-cis.json'), 'utf8')
  );
  const urls = ledger.claims.map(({ url }) => new URL(url));
  const forbiddenHosts = new Set(['consultant.ru', 'www.consultant.ru', 'wipo.int', 'www.wipo.int']);

  assert.deepEqual(
    urls.filter(({ hostname }) => forbiddenHosts.has(hostname)).map(({ href }) => href),
    [],
    'RU/CIS ledger must not cite ConsultantPlus or WIPO as primary sources'
  );
  assert.ok(
    ledger.claims.some(({ url }) => url === 'https://government.ru/docs/all/98086/'),
    'RU/CIS ledger must cite the official government.ru page for Federal Law 38-FZ'
  );
  assert.ok(
    urls.some(({ hostname }) => hostname === 'etalonline.by' || hostname === 'www.etalonline.by'),
    'RU/CIS ledger must cite the official Belarusian ETALON-ONLINE host'
  );
});
