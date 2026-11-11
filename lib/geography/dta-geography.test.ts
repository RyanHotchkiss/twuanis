import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { validateGeographicRequest, validateOfficialCode, MAX_DTA_REQUEST_SELECTIONS, DtaResolutionError, type DtaFailureCode } from './dta-request';
import { validateOntologyTermId } from './dta-identity';
import { resolveDtaGeography } from './resolve-dta-geography';

type Row = { id: unknown; parent_id: unknown; official_code: string; term_type: string; level: unknown; [key: string]: unknown };
const dictionary: Row[] = [
  { id: '10', parent_id: '9', official_code: '1', term_type: 'province', level: 1 },
  { id: '20', parent_id: '9', official_code: '2', term_type: 'province', level: 1 },
  { id: '30', parent_id: '9', official_code: '3', term_type: 'province', level: 1 },
  { id: '101', parent_id: '10', official_code: '101', term_type: 'canton', level: 2 },
  { id: '102', parent_id: '10', official_code: '102', term_type: 'canton', level: 2 },
  { id: '201', parent_id: '20', official_code: '201', term_type: 'canton', level: 2 },
  { id: '304', parent_id: '30', official_code: '304', term_type: 'canton', level: 2 },
  { id: '1001', parent_id: '101', official_code: '10101', term_type: 'district', level: 3 },
  { id: '1002', parent_id: '101', official_code: '10102', term_type: 'district', level: 3 },
  { id: '2001', parent_id: '201', official_code: '20101', term_type: 'district', level: 3 },
  { id: '3001', parent_id: '304', official_code: '30403', term_type: 'district', level: 3 },
];

type Options = {
  alter?: (rows: Row[]) => Row[];
  count?: number | null;
  status?: number;
  throws?: boolean;
};
function fixture(options: Options = {}) {
  const calls: URL[] = [];
  let factories = 0;
  const client = createClient('https://cg2-offline.invalid', 'offline-test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      calls.push(url);
      assert.equal(url.pathname, '/rest/v1/ontology_terms');
      assert.equal(init?.method, 'GET');
      assert.equal(url.searchParams.get('select'), 'id::text,parent_id::text,official_code,term_type,level');
      assert.equal(url.searchParams.get('term_type'), 'in.(province,canton,district)');
      assert.equal(url.searchParams.get('order'), 'official_code.asc');
      assert.match(new Headers(init?.headers).get('prefer') ?? '', /count=exact/);
      assert.deepEqual([...url.searchParams.keys()].sort(), ['limit', 'official_code', 'order', 'select', 'term_type']);
      const predicate = url.searchParams.get('official_code')!;
      assert.match(predicate, /^in\.\([0-9,]+\)$/);
      const codes = predicate.slice(4, -1).split(',');
      assert.deepEqual(codes, [...new Set(codes)].sort());
      assert.ok(codes.length <= MAX_DTA_REQUEST_SELECTIONS * 3);
      assert.equal(url.searchParams.get('limit'), String(codes.length + 1));
      if (options.throws) throw new Error('offline network failure');
      if (options.status) return new Response(JSON.stringify({ message: 'offline failure' }), { status: options.status });
      let rows = dictionary.filter(row => codes.includes(row.official_code)).map(row => ({ ...row }));
      if (options.alter) rows = options.alter(rows);
      const count = options.count === undefined ? rows.length : options.count;
      return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'content-type': 'application/json', ...(count === null ? {} : { 'content-range': `0-${Math.max(0, rows.length - 1)}/${count}` }) },
      });
    } },
  });
  return { calls, get factories() { return factories; }, run: (input: unknown) => resolveDtaGeography(input, async () => { factories++; return client; }) };
}
function codeIs(code: DtaFailureCode) {
  return (error: unknown) => error instanceof DtaResolutionError && error.code === code;
}

for (const [type, value] of [['province', '0'], ['canton', '001'], ['district', '00101']] as const) {
  test(`valid ${type} and leading zero preserved`, () => assert.equal(validateOfficialCode(type, value), value));
}
for (const [name, value] of Object.entries({ null: null, empty: '', spaces: ' 1', trailing: '1 ', newline: '1\n', number: 1, bigint: BigInt(1), boolean: true, object: {}, unicode: '１', length: '11', plus: '+1', minus: '-1', decimal: '1.0', csv: '1,2' })) {
  test(`reject ${name} before acquisition`, async () => {
    const f = fixture();
    await assert.rejects(f.run({ province: value }), codeIs('MALFORMED_CODE'));
    assert.equal(f.calls.length, 0); assert.equal(f.factories, 0);
  });
}
for (const input of [null, undefined, [], '1', 1, new Date(), { slug: 'x' }, { ontologyTermId: '10' }, { [Symbol('x')]: '1' }]) {
  test(`invalid request ${String(input)}`, async () => {
    const f = fixture(); await assert.rejects(f.run(input), codeIs('INVALID_REQUEST')); assert.equal(f.factories, 0);
  });
}
test('reject accessor without running it', () => {
  let calls = 0; const value = { get province() { calls++; return '1'; } };
  assert.throws(() => validateGeographicRequest(value), codeIs('INVALID_REQUEST')); assert.equal(calls, 0);
});
test('empty selection, sparse collection, mixed collection fail', async () => {
  for (const [input, code] of [[{ district: [] }, 'EMPTY_SELECTION'], [{ district: new Array(2) }, 'MALFORMED_CODE'], [{ district: ['10101', null] }, 'MALFORMED_CODE']] as const) {
    const f = fixture(); await assert.rejects(f.run(input), codeIs(code)); assert.equal(f.calls.length, 0);
  }
});
test('undefined dimension and unrestricted object have no client or query', async () => {
  for (const input of [{}, { province: undefined }]) {
    const f = fixture(); assert.deepEqual(await f.run(input), {}); assert.equal(f.factories, 0);
  }
});
test('dedup, deterministic order, freeze and exact bound', async () => {
  assert.deepEqual(validateGeographicRequest({ province: ['2', '1', '2'] }), { province: ['1', '2'] });
  const f = fixture(); const result = await f.run({ province: Array(MAX_DTA_REQUEST_SELECTIONS).fill('1') });
  assert.equal(result.province?.length, 1); assert.equal(f.calls.length, 1);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.province) && Object.isFrozen(result.province?.[0]));
});
test('bound counts duplicate entries and all dimensions before lookup', async () => {
  for (const input of [{ province: Array(MAX_DTA_REQUEST_SELECTIONS + 1).fill('1') }, { province: Array(MAX_DTA_REQUEST_SELECTIONS).fill('1'), canton: '101' }]) {
    const f = fixture(); await assert.rejects(f.run(input), codeIs('REQUEST_TOO_LARGE')); assert.equal(f.factories, 0);
  }
});
for (const id of ['0', '10', '-1', '9007199254740993', '9223372036854775807', '-9223372036854775808']) {
  test(`lossless ID ${id}`, () => assert.equal(validateOntologyTermId(id), id));
}
for (const id of [10, 9007199254740992, BigInt(10), null, undefined, '', '01', '-0', '+1', '1.0', '1e3', '1\n', ' 1', '9223372036854775808', '-9223372036854775809']) {
  test(`invalid ID ${String(id)}`, () => assert.throws(() => validateOntologyTermId(id), codeIs('INVALID_ONTOLOGY_ID')));
}
const validRequests = [
  { province: '1' }, { canton: '101' }, { district: '10101' },
  { province: '1', canton: '101' }, { canton: '101', district: '10101' },
  { province: '1', district: '10101' }, { province: '1', canton: '101', district: '10101' },
  { province: ['1', '2'] }, { canton: ['101', '201'] }, { district: ['10101', '20101'] },
  { province: ['1', '2'], canton: ['101', '201'], district: ['10101', '10102', '20101'] },
];
for (const input of validRequests) {
  test(`hierarchy ${JSON.stringify(input)} one query and no added filters`, async () => {
    const f = fixture(); const result = await f.run(input);
    assert.equal(f.calls.length, 1); assert.deepEqual(Object.keys(result).sort(), Object.keys(input).sort());
  });
}
for (const input of [
  { province: '2', canton: '101' }, { canton: '201', district: '10101' },
  { province: '2', district: '10101' }, { province: '1', canton: '101', district: '20101' },
  { province: '1', canton: ['101', '201'] }, { canton: '101', district: ['10101', '20101'] },
]) {
  test(`hierarchy conflict ${JSON.stringify(input)}`, async () => {
    const f = fixture(); await assert.rejects(f.run(input), codeIs('HIERARCHY_CONFLICT')); assert.equal(f.calls.length, 1);
  });
}
for (const [name, options, code] of [
  ['parent mismatch', { alter: (rows: Row[]) => rows.map(r => r.term_type === 'district' ? { ...r, parent_id: '201' } : r) }, 'HIERARCHY_CONFLICT'],
  ['ID matches another code ancestry', { alter: (rows: Row[]) => rows.map(r => r.official_code === '101' ? { ...r, parent_id: '20' } : r) }, 'HIERARCHY_CONFLICT'],
  ['missing ancestor', { alter: (rows: Row[]) => rows.filter(r => r.term_type !== 'province') }, 'UNKNOWN_CODE'],
  ['unexpected row', { alter: (rows: Row[]) => [...rows, dictionary[1]] }, 'INCOMPLETE_RESOLUTION'],
  ['duplicate code', { alter: (rows: Row[]) => [...rows, { ...rows[0], id: '999' }] }, 'DUPLICATE_ENTITY'],
  ['duplicate ID', { alter: (rows: Row[]) => rows.map(r => ({ ...r, id: '10' })) }, 'DUPLICATE_ENTITY'],
  ['wrong type', { alter: (rows: Row[]) => rows.map(r => ({ ...r, term_type: 'country' })) }, 'WRONG_TYPE'],
  ['wrong level', { alter: (rows: Row[]) => rows.map(r => ({ ...r, level: 9 })) }, 'WRONG_LEVEL'],
  ['null level', { alter: (rows: Row[]) => rows.map(r => ({ ...r, level: null })) }, 'WRONG_LEVEL'],
  ['numeric row ID', { alter: (rows: Row[]) => rows.map(r => ({ ...r, id: 10 })) }, 'INVALID_ONTOLOGY_ID'],
  ['numeric parent', { alter: (rows: Row[]) => rows.map(r => ({ ...r, parent_id: 9 })) }, 'INVALID_ONTOLOGY_ID'],
  ['null child parent', { alter: (rows: Row[]) => rows.map(r => r.term_type === 'district' ? { ...r, parent_id: null } : r) }, 'INVALID_ONTOLOGY_ID'],
  ['missing count', { count: null }, 'INCOMPLETE_RESOLUTION'],
  ['truncated rows', { count: 4 }, 'INCOMPLETE_RESOLUTION'],
  ['503 no retry', { status: 503 }, 'RESOLUTION_UNAVAILABLE'],
  ['network no retry', { throws: true }, 'RESOLUTION_UNAVAILABLE'],
] as const) {
  test(name, async () => {
    const f = fixture(options); await assert.rejects(f.run({ district: '10101' }), codeIs(code)); assert.equal(f.calls.length, 1);
  });
}
test('unknown shaped code fails whole collection', async () => {
  const f = fixture(); await assert.rejects(f.run({ province: ['1', '8'] }), codeIs('UNKNOWN_CODE')); assert.equal(f.calls.length, 1);
});
test('parent and entity IDs survive beyond Number range and JSON serialization', async () => {
  const f = fixture({ alter: rows => rows.map(r => ({ ...r,
    id: r.id === '10' ? '9007199254740993' : r.id,
    parent_id: r.parent_id === '10' ? '9007199254740993' : r.parent_id,
  })) });
  const result = await f.run({ province: '1', canton: '101' });
  assert.equal(result.province?.[0].ontologyTermId, '9007199254740993');
  assert.equal(result.canton?.[0].parentOntologyTermId, '9007199254740993');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});
test('English, Spanish, Pejivalle and Pejibaye labels never affect identity', async () => {
  const results = [];
  for (const label of ['Pejivalle', 'Pejibaye', 'English label', 'Etiqueta española']) {
    const f = fixture({ alter: rows => rows.map(r => ({ ...r, term_name: label, term_name_en: label, term_name_es: label, slug: label })) });
    const result = await f.run({ district: '30403' });
    assert.equal(result.district?.[0].officialCode, '30403');
    assert.equal(result.district?.[0].termType, 'district');
    assert.deepEqual(Object.keys(result.district![0]).sort(), ['officialCode', 'ontologyTermId', 'parentOntologyTermId', 'termType', 'level'].sort());
    results.push(result);
  }
  for (const result of results) assert.deepEqual(result, results[0]);
});
test('server boundary and unchanged PPM2 entry points remain disconnected', () => {
  const resolver = readFileSync('lib/geography/resolve-dta-geography.ts', 'utf8');
  assert.match(resolver, /^import 'server-only';/);
  assert.doesNotMatch(resolver, /['"]use server['"]|entity-engine|listings_ontology_terms|price-meter-engine/);
  for (const file of ['app/components/PriceMeterApplyPanel.tsx', 'lib/price-meter-apply-action.ts', 'lib/price-meter-apply-permit.ts', 'lib/price-meter-engine.ts']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /resolve-dta-geography/);
  }
  assert.match(readFileSync('lib/price-meter-engine.ts', 'utf8'), /consumePriceMeterApplyPermit\(applyPermit, filters, language\)/);
});
