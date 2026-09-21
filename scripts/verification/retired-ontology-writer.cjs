const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'), ts = require(root + '/node_modules/typescript');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, requireMock) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText,
    { module, exports: module.exports, require: requireMock, console: { log(){}, error(){} }, process: { exit(){ throw Error('unexpected exit'); } } });
  return module.exports;
}
(async () => {
  let accesses = 0;
  const forbidden = () => { accesses++; throw Error('unexpected database/environment access'); };
  assert.throws(() => load('scripts/assign-ontology-to-existing-listings.ts', () => ({ default: { config: forbidden }, config: forbidden })), /retired/);
  assert.equal(accesses, 0);
  const writer = load('lib/assign-listing-ontology.ts', () => ({ supabase: { from: forbidden } }));
  await assert.rejects(writer.assignListingOntology('listing', { property_type: 'house' }), /retired/);
  assert.equal(accesses, 0);
  assert.equal(await writer.resolveListingOntology({}), undefined);
  const reads = [];
  const resolver = load('lib/assign-listing-ontology.ts', () => ({ supabase: { from(table) { reads.push(table); return { select: async () => ({ data: [], error: null }) }; } } }));
  assert.equal((await resolver.resolveListingOntology({ property_type: 'house' })).length, 0);
  assert.deepEqual(reads, ['ontology_terms', 'ontology_relationships']);
  for (const name of ['createListing', 'createRentalListing']) {
    const caller = load('app/utils/' + name + '.ts', () => new Proxy({}, { get: forbidden }));
    await assert.rejects(caller[name]({ id: 'listing' }), /retired/);
  }
  assert.equal(accesses, 0);
  console.log('PASS 6 focused cases: script, write helper, empty read, database read, two contained callers; no real database/network access');
})().catch(error => { console.error(error); process.exitCode = 1; });
