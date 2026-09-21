// Offline PRE-14-1 verification. All acquisition/authentication is mocked; unknown I/O fails closed.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const ts = require(path.join(root, 'node_modules/typescript'));
const React = require(path.join(root, 'node_modules/react'));
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server'));
let checks = 0;
const ok = (value, label) => { assert.ok(value, label); checks++; };
const plain = value => JSON.parse(JSON.stringify(value));
const eq = (actual, expected, label) => { assert.deepStrictEqual(plain(actual), plain(expected), label); checks++; };
const throws = (fn, label) => { assert.throws(fn, undefined, label); checks++; };
const stem = 'lib/price-meter-cross-dimensional-';
const forbidden = new Set(['outcomes', 'synthesis', 'question'].map(x => stem + x + '.ts'));

// Follow runtime imports/re-exports/dynamic imports/require, but not erased types or server-action bodies.
const files = cp.execFileSync('rg', ['--files', 'app', 'lib', '-g', '*.ts', '-g', '*.tsx'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
const roots = files.filter(f => /^\s*['"]use client['"]/m.test(fs.readFileSync(path.join(root, f), 'utf8')));
const visited = new Set();
function walk(file, chain = []) {
  if (visited.has(file)) return;
  visited.add(file);
  ok(!forbidden.has(file), 'forbidden client path: ' + chain.concat(file).join(' -> '));
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  if (ast.statements.some(n => ts.isExpressionStatement(n) && ts.isStringLiteral(n.expression) && n.expression.text === 'use server')) return;
  const imports = [];
  function visit(n) {
    if (ts.isImportDeclaration(n) && !n.importClause?.isTypeOnly) {
      const b = n.importClause?.namedBindings;
      if (!(b && ts.isNamedImports(b) && !n.importClause.name && b.elements.every(e => e.isTypeOnly))) imports.push(n.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(n) && !n.isTypeOnly && n.moduleSpecifier) {
      if (!(n.exportClause && ts.isNamedExports(n.exportClause) && n.exportClause.elements.every(e => e.isTypeOnly))) imports.push(n.moduleSpecifier.text);
    }
    if (ts.isCallExpression(n) && (n.expression.kind === ts.SyntaxKind.ImportKeyword || n.expression.getText(ast) === 'require') && ts.isStringLiteral(n.arguments[0])) imports.push(n.arguments[0].text);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  ok(!imports.includes('server-only'), 'client graph must not reach server-only: ' + file);
  for (const name of imports) {
    const base = name.startsWith('@/') ? name.slice(2) : name.startsWith('.') ? path.join(path.dirname(file), name) : null;
    if (!base) continue;
    const target = [base, base + '.ts', base + '.tsx', base + '/index.ts', base + '/index.tsx'].find(f => fs.existsSync(path.join(root, f)) && fs.statSync(path.join(root, f)).isFile());
    if (target) walk(target, chain.concat(file));
  }
}
roots.forEach(f => walk(f));
for (const f of forbidden) ok(/^import 'server-only'/m.test(fs.readFileSync(path.join(root, f), 'utf8')), f + ' protected');
const contract = fs.readFileSync(path.join(root, stem + 'result-contract.ts'), 'utf8');
const contractAst = ts.createSourceFile('contract.ts', contract, ts.ScriptTarget.Latest, true);
ok(contractAst.statements.every(ts.isTypeAliasDeclaration), 'DTO contract contains types only, no imports/runtime');

const cache = new Map();
let calls = { load: 0, analyze: 0, outcomes: 0, synthesis: 0 };
let fixture, authority = 'allow', outcomeFailure = false, synthesisFailure = false, fetches = [], hookState = [], hookIndex = 0;
class AuthError extends Error {}
class EntitlementError extends Error {}
const poison = value => {
  if (Array.isArray(value)) { value.forEach(poison); return value; }
  if (value && typeof value === 'object') { Object.values(value).forEach(poison); value.internalSecret = 'MUST_NOT_CROSS'; }
  return value;
};
const mocks = {
  'next/server': { NextResponse: { json: (body, options = {}) => ({ status: options.status ?? 200, body: plain(body) }) } },
  '@/lib/price-meter-authorization': {
    PriceMeterComparableAuthenticationError: AuthError, PriceMeterComparableAuthorizationError: EntitlementError,
    async authorizePriceMeterIntelligenceExecution() { if (authority === 'auth') throw new AuthError(); if (authority === 'entitlement') throw new EntitlementError(); if (authority === 'error') throw Error('authority unavailable'); }
  },
  '@/lib/price-meter-observation-loader': { async loadPriceMeterObservations() { calls.load++; return { observations: [] }; } },
  '@/lib/price-meter-cross-dimensional-analyzer': { analyzePriceMeterCrossDimensionalRelationship() { calls.analyze++; return poison(plain(fixture)); } },
  react: { ...React, useState(initial) { const i = hookIndex++; if (!(i in hookState)) hookState[i] = initial; return [hookState[i], value => { hookState[i] = value; }]; }, useRef(initial) { const i = hookIndex++; if (!(i in hookState)) hookState[i] = { current: initial }; return hookState[i]; } },
  'react/jsx-runtime': require(path.join(root, 'node_modules/react/jsx-runtime'))
};
function load(file) {
  file = path.normalize(file);
  if (cache.has(file)) return cache.get(file).exports;
  const m = { exports: {} }; cache.set(file, m);
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, {
    exports: m.exports, module: m, console: { error() {} }, AbortController, DOMException,
    fetch: (url, options) => new Promise(resolve => fetches.push({ url, options, resolve })),
    require(name) {
      if (name === 'server-only') return {};
      if (mocks[name]) return mocks[name];
      if (name.startsWith('@/lib/price-meter-') || name === '@/lib/numerical-distribution' || name === '@/lib/market-intelligence-area-ranges' || name.startsWith('.')) {
        const base = name.startsWith('@/') ? name.slice(2) : path.join(path.dirname(file), name);
        const target = [base + '.ts', base + '.tsx'].find(f => fs.existsSync(path.join(root, f)));
        if (target) return load(target);
      }
      throw Error('Unexpected dependency/I/O: ' + name);
    }
  }, { filename: file });
  return m.exports;
}
const outcomesModule = load(stem + 'outcomes.ts');
const evaluate = outcomesModule.evaluatePriceMeterCrossDimensionalOutcomes;
const synthesisModule = load(stem + 'synthesis.ts');
const synthesize = synthesisModule.buildPriceMeterCrossDimensionalSynthesis;
const questionModule = load(stem + 'question.ts');
const questions = questionModule.PRICE_METER_CROSS_DIMENSIONAL_QUESTIONS;
const question = key => questionModule.getPriceMeterCrossDimensionalQuestion(key);
const size = (key, rho, status = 'established') => ({ kind: 'size_relationship', secondaryCohortKey: key, secondaryCohortLabel: key, representedObservationCount: 12, status, relationshipKind: 'property_area_to_land_normalized_ratio', populatedBandCount: 3, requiredPopulatedBandCount: 3, hasRequiredPopulatedBands: true, coordinates: [{ areaM2: 100, normalizedPricePerM2: 20, observationCount: 12 }], spearmanRho: rho, logLogSlope: rho, modeledTenPercentAreaChangePercent: rho === null ? null : rho * 10, rSquared: rho === null ? null : 0.5, modeledStatisticsAuthorization: 'authorized', modeledStatisticsWithheldReason: null });
const geo = (key, a, b, status = 'established') => ({ kind: 'geographic', secondaryCohortKey: key, secondaryCohortLabel: key, representedObservationCount: 12, status, selectedMarketSampleSize: 12, selectedMarketMedianPricePerM2: 15, comparisonGeographyCount: 2, requiredComparisonGeographyCount: 2, geographicStatistics: [a, b].map((median, i) => ({ geographyKey: 'g' + i, geographyLabel: 'G' + i, rank: i + 1, sampleSize: 6, medianPricePerM2: median, medianDifferenceFromSelectedMarket: median === null ? null : median - 15, medianPercentAboveOrBelowSelectedMarket: median === null ? null : (median - 15) / 15 * 100 })) });
const ratio = (key, rho, status = 'established') => ({ kind: 'construction_to_land_relationship', secondaryCohortKey: key, secondaryCohortLabel: key, representedObservationCount: 12, status, normalizationBasis: 'land', populatedCohortCount: 3, requiredPopulatedCohortCount: 3, requiredObservationCount: 12, hasRequiredPopulatedCohorts: true, hasRequiredObservations: true, coordinates: [{ constructionToLandRatio: 0.5, normalizedPricePerM2: 20, observationCount: 12 }], spearmanRho: rho, regression: null, rSquared: null, modeledTenPercentChangePercent: null, regressionWithheldReason: 'shared_property_area_mathematical_coupling' });
const evidenceSet = (key, rows) => ({ questionKey: key, inputObservationCount: rows.length * 12, representedObservationCount: rows.length * 12, excludedObservationCount: 0, secondaryCohortCount: rows.length, populatedSecondaryCohortCount: rows.length, establishedSecondaryCohortCount: rows.filter(r => r.status === 'established').length, nonEstablishedSecondaryCohortCount: rows.filter(r => r.status !== 'established').length, evidence: rows });
const sizeSet = evidenceSet('property_area_by_geography', [size('a', 0.8), size('b', -0.4), size('c', null, 'not_established')]);
const geographicSet = evidenceSet('geography_by_property_area', [geo('a', 20, 10), geo('b', 10, 20), geo('c', null, null, 'not_established')]);
const ratioSet = evidenceSet('construction_to_land_by_property_area', [ratio('a', 0.5), ratio('b', -0.5), ratio('c', null, 'not_established')]);
let o = evaluate(sizeSet);
eq(o.persistence, { examinedSecondaryCohortCount: 3, establishedSecondaryCohortCount: 2, nonEstablishedSecondaryCohortCount: 1, persistenceRatePercent: 2 / 3 * 100, representedObservationCount: 36, establishedObservationCount: 24 }, 'persistence established proportion and represented n');
eq([o.variation.spearmanRhoMinimum, o.variation.spearmanRhoMaximum, o.variation.spearmanRhoRange], [-0.4, 0.8, 0.8 - (-0.4)], 'size range');
eq([o.variation.logLogSlopeMinimum, o.variation.modeledTenPercentAreaChangeMaximum, o.variation.rSquaredRange], [-0.4, 8, 0], 'other size variation');
eq(o.reversals.map(r => [r.firstDirection, r.secondDirection, r.firstSpearmanRho, r.secondSpearmanRho]), [['positive', 'negative', 0.8, -0.4]], 'directional reversal');
eq(o.nonEstablishment[0].reason, { kind: 'size_relationship_not_established', representedObservationCount: 12, populatedBandCount: 3, requiredPopulatedBandCount: 3 }, 'size prerequisites preserved');
for (const rho of [0, null]) eq(evaluate(evidenceSet(sizeSet.questionKey, [size('a', rho), size('b', -0.4)])).reversals, [], 'zero/null is not reversal');
const go = evaluate(geographicSet);
eq(go.reversals.length, 1, 'geographic reversal');
eq([go.reversals[0].firstCohortFirstGeography.geographyKey, go.reversals[0].secondCohortFirstGeography.geographyKey], ['g0', 'g1'], 'ordering actually reverses');
eq([go.variation.observedMedianDifferenceMinimum, go.variation.observedMedianDifferenceMaximum, go.variation.observedMedianDifferenceRange], [-5, 5, 10], 'geographic magnitude variation');
for (const row of [geo('b', 10, 10), geo('b', null, 20)]) eq(evaluate(evidenceSet(geographicSet.questionKey, [geo('a', 20, 10), row])).reversals, [], 'tie/null cannot establish reversal');
eq(evaluate(ratioSet).variation.spearmanRhoRange, 1, 'ratio variation');
eq(evaluate(ratioSet).nonEstablishment[0].reason.requiredObservationCount, 12, 'ratio evidence prerequisite');
const emptySet = evidenceSet(sizeSet.questionKey, []);
eq(evaluate(emptySet), { persistence: { examinedSecondaryCohortCount: 0, establishedSecondaryCohortCount: 0, nonEstablishedSecondaryCohortCount: 0, persistenceRatePercent: null, representedObservationCount: 0, establishedObservationCount: 0 }, variation: null, reversals: [], nonEstablishment: [] }, 'empty epistemic values');
const finiteTest = evidenceSet(sizeSet.questionKey, [size('a', null), size('b', null)]); finiteTest.evidence[0].logLogSlope = Infinity;
eq(evaluate(finiteTest).variation.logLogSlopeMinimum, null, 'nonfinite values excluded from range');
for (const e of [sizeSet, geographicSet, ratioSet, emptySet]) {
  const out = evaluate(e), syn = synthesize({ question: question(e.questionKey), evidenceSet: e, outcomes: out });
  eq(syn.variation, out.variation, 'synthesis preserves variation');
  eq([syn.reversalCount, syn.nonEstablishmentCount, syn.hasReversal, syn.hasNonEstablishment], [out.reversals.length, out.nonEstablishment.length, out.reversals.length > 0, out.nonEstablishment.length > 0], 'synthesis counts/flags');
}
throws(() => synthesize({ question: question('geography_by_property_area'), evidenceSet: sizeSet, outcomes: o }), 'question mismatch');
for (const field of ['examinedSecondaryCohortCount', 'establishedSecondaryCohortCount', 'nonEstablishedSecondaryCohortCount', 'representedObservationCount']) { const bad = plain(o); bad.persistence[field]++; throws(() => synthesize({ question: question(sizeSet.questionKey), evidenceSet: sizeSet, outcomes: bad }), 'synthesis rejects inconsistent ' + field); }
const bad = plain(o); bad.nonEstablishment = []; throws(() => synthesize({ question: question(sizeSet.questionKey), evidenceSet: sizeSet, outcomes: bad }), 'synthesis rejects missing non-establishment');

// Count real evaluators at the route boundary; inject unexpected nested metadata to test projection.
outcomesModule.evaluatePriceMeterCrossDimensionalOutcomes = e => { calls.outcomes++; if (outcomeFailure) throw Error('outcome failure'); return poison(evaluate(e)); };
synthesisModule.buildPriceMeterCrossDimensionalSynthesis = args => { calls.synthesis++; if (synthesisFailure) throw Error('synthesis failure'); return poison(synthesize(args)); };
const route = load('app/api/price-meter/cross-dimensional/route.ts');
const base = { questionKey: sizeSet.questionKey, filters: { province: '3', canton: '304', transaction_type: 'sale', property_type: 'house' }, cohortKey: 'improvedLandNormalized' };
async function request(body) { calls = { load: 0, analyze: 0, outcomes: 0, synthesis: 0 }; return route.POST({ async json() { return body; } }); }

// Independent recursive key allowlist, not inferred from the implementation's type contract.
const scalars = s => Object.fromEntries(s.split(' ').map(k => [k, true]));
const rowBase = scalars('kind secondaryCohortKey secondaryCohortLabel representedObservationCount status');
const statistic = scalars('geographyKey geographyLabel rank sampleSize medianPricePerM2 medianDifferenceFromSelectedMarket medianPercentAboveOrBelowSelectedMarket');
const geoRow = { ...rowBase, ...scalars('selectedMarketSampleSize selectedMarketMedianPricePerM2 comparisonGeographyCount'), geographicStatistics: [statistic] };
const sizeRow = { ...rowBase, ...scalars('populatedBandCount requiredPopulatedBandCount spearmanRho logLogSlope modeledTenPercentAreaChangePercent rSquared modeledStatisticsAuthorization modeledStatisticsWithheldReason'), coordinates: [scalars('areaM2 normalizedPricePerM2 observationCount')] };
const ratioRow = { ...rowBase, ...scalars('normalizationBasis populatedCohortCount requiredPopulatedCohortCount requiredObservationCount spearmanRho regressionWithheldReason'), coordinates: [scalars('constructionToLandRatio normalizedPricePerM2 observationCount')] };
const variation = v => v === null ? true : scalars('kind establishedSecondaryCohortCount ' + (v.kind === 'geographic' ? 'observedMedianDifferenceMinimum observedMedianDifferenceMaximum observedMedianDifferenceRange observedPercentDifferenceMinimum observedPercentDifferenceMaximum observedPercentDifferenceRange' : v.kind === 'size_relationship' ? 'spearmanRhoMinimum spearmanRhoMaximum spearmanRhoRange logLogSlopeMinimum logLogSlopeMaximum logLogSlopeRange modeledTenPercentAreaChangeMinimum modeledTenPercentAreaChangeMaximum modeledTenPercentAreaChangeRange rSquaredMinimum rSquaredMaximum rSquaredRange' : 'spearmanRhoMinimum spearmanRhoMaximum spearmanRhoRange'));
const reverse = r => r.kind === 'directional' ? scalars('kind firstSecondaryCohortKey firstSecondaryCohortLabel secondSecondaryCohortKey secondSecondaryCohortLabel firstDirection secondDirection firstSpearmanRho secondSpearmanRho') : { ...scalars('kind firstSecondaryCohortKey firstSecondaryCohortLabel secondSecondaryCohortKey secondSecondaryCohortLabel'), ...Object.fromEntries(['firstCohortFirstGeography', 'firstCohortSecondGeography', 'secondCohortFirstGeography', 'secondCohortSecondGeography'].map(k => [k, scalars('geographyKey geographyLabel medianPricePerM2 sampleSize')])) };
const reason = r => scalars('kind representedObservationCount ' + (r.kind === 'geographic_relationship_not_established' ? 'comparisonGeographyCount requiredComparisonGeographyCount' : r.kind === 'size_relationship_not_established' ? 'populatedBandCount requiredPopulatedBandCount' : 'populatedCohortCount requiredPopulatedCohortCount requiredObservationCount'));
const schema = { question: { ...scalars('key definition question'), reports: [true] }, context: scalars('transactionType propertyBasis normalizationBasis'), evidence: { ...scalars('inputObservationCount representedObservationCount excludedObservationCount populatedSecondaryCohortCount'), evidence: [r => ({ geographic: geoRow, size_relationship: sizeRow, construction_to_land_relationship: ratioRow })[r.kind]] }, outcomes: { persistence: scalars('examinedSecondaryCohortCount establishedSecondaryCohortCount nonEstablishedSecondaryCohortCount persistenceRatePercent representedObservationCount establishedObservationCount'), variation, reversals: [reverse], nonEstablishment: [{ ...scalars('secondaryCohortKey secondaryCohortLabel'), reason }] }, synthesis: { ...scalars('examinedSecondaryCohortCount representedObservationCount establishedSecondaryCohortCount establishedObservationCount reversalCount nonEstablishmentCount hasReversal hasNonEstablishment'), variation } };
function allowlist(value, shape, at = 'result') {
  if (typeof shape === 'function') shape = shape(value);
  if (shape === true) { ok(value === null || ['string', 'number', 'boolean'].includes(typeof value), at + ' scalar'); return; }
  if (Array.isArray(shape)) { ok(Array.isArray(value), at + ' array'); value.forEach((v, i) => allowlist(v, shape[0], at + '[' + i + ']')); return; }
  eq(Object.keys(value).sort(), Object.keys(shape).sort(), at + ' exact keys');
  for (const k of Object.keys(shape)) allowlist(value[k], shape[k], at + '.' + k);
}
function unchangedLeaves(projected, source) {
  if (projected === null || typeof projected !== 'object') { eq(projected, source, 'projection preserves scalar'); return; }
  for (const k of Object.keys(projected)) unchangedLeaves(projected[k], source[k]);
}
function elements(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(elements); return [node, ...elements(node.props?.children)]; }

(async () => {
  fixture = sizeSet;
  for (const [mode, status] of [['auth', 401], ['entitlement', 403], ['error', 503]]) { authority = mode; eq((await request(base)).status, status, 'denied status'); eq(calls, { load: 0, analyze: 0, outcomes: 0, synthesis: 0 }, 'denied zero work'); }
  authority = 'allow';
  for (const body of [null, {}, { ...base, questionKey: 'unknown' }, { ...base, filters: {} }]) { eq((await request(body)).status, 400, 'invalid status'); eq(calls, { load: 0, analyze: 0, outcomes: 0, synthesis: 0 }, 'invalid zero work'); }
  let completed;
  const withheld = plain(sizeSet); withheld.evidence.forEach(r => { r.modeledStatisticsAuthorization = 'withheld_mathematical_coupling'; r.modeledStatisticsWithheldReason = 'property_area_construction_to_land_coupling'; r.logLogSlope = null; r.modeledTenPercentAreaChangePercent = null; r.rSquared = null; });
  for (const e of [sizeSet, geographicSet, ratioSet, emptySet, evidenceSet(sizeSet.questionKey, [size('zero', 0)]), withheld]) {
    fixture = e; const result = await request({ ...base, questionKey: e.questionKey });
    eq(result.status, 200, 'completed response'); eq(calls, { load: 1, analyze: 1, outcomes: 1, synthesis: 1 }, 'exactly one execution');
    allowlist(result.body, schema);
    const expectedOut = evaluate(e), expectedSyn = synthesize({ question: question(e.questionKey), evidenceSet: e, outcomes: expectedOut });
    unchangedLeaves(result.body.evidence, e); eq(result.body.outcomes, expectedOut, 'outcomes unchanged through JSON'); unchangedLeaves(result.body.synthesis, expectedSyn);
    ok(!JSON.stringify(result.body).includes('MUST_NOT_CROSS'), 'nested internal fields removed');
    completed = result.body;
  }
  outcomeFailure = true; eq((await request(base)).status, 500, 'outcome failure no completed response'); eq(calls.synthesis, 0, 'outcome failure stops synthesis'); outcomeFailure = false;
  synthesisFailure = true; eq((await request(base)).status, 500, 'synthesis failure no completed response'); synthesisFailure = false;

  const Results = load('app/price-per-square-meter/PriceMeterCrossDimensionalResults.tsx').default;
  const before = plain(calls), snapshot = JSON.stringify(completed);
  const props = { ...completed, transactionType: completed.context.transactionType };
  const en = renderToStaticMarkup(React.createElement(Results, { ...props, language: 'en' }));
  const es = renderToStaticMarkup(React.createElement(Results, { ...props, language: 'es' }));
  eq(en.match(/\d+(?:\.\d+)?/g), es.match(/\d+(?:\.\d+)?/g), 'EN/ES numerical rendering parity');
  ok(en.includes('withheld') && es.includes('no se presentan'), 'EN/ES withholding explanation');
  eq(JSON.stringify(completed), snapshot, 'render leaves result unchanged'); eq(calls, before, 'render/language performs no analytical work');

  const Analysis = load('app/price-per-square-meter/PriceMeterCrossDimensionalAnalysis.tsx').default;
  let received = [];
  const componentProps = { filters: base.filters, cohortKey: base.cohortKey, options: [{ questionKey: 'property_area_by_geography', label: 'A' }, { questionKey: 'property_area_by_construction_to_land', label: 'B' }], onResult: r => received.push(r) };
  const render = () => { hookIndex = 0; return Analysis(componentProps); };
  const buttons = () => elements(render()).filter(e => e.type === 'button');
  render(); eq(fetches.length, 0, 'mount no selection no request');
  const first = buttons()[0].props.onClick(); eq(fetches.length, 1, 'one selection one request');
  eq(JSON.parse(fetches[0].options.body), { questionKey: componentProps.options[0].questionKey, filters: base.filters, cohortKey: base.cohortKey }, 'selected intent request');
  await buttons()[0].props.onClick(); eq(fetches.length, 1, 'collapse no new request'); ok(fetches[0].options.signal.aborted, 'collapse cancels client request');
  const second = buttons()[1].props.onClick(); eq(fetches.length, 2, 'second selected question one new request');
  fetches[0].resolve({ ok: true, json: async () => ({ ...completed, question: { ...completed.question, key: 'stale' } }) }); await first; eq(received.length, 0, 'stale response ignored');
  const latest = { ...completed, question: { ...completed.question, key: componentProps.options[1].questionKey }, context: { ...completed.context, transactionType: 'rent' } };
  fetches[1].resolve({ ok: true, json: async () => latest }); await second;
  eq(received.length, 1, 'latest response delivered once');
  const rendered = elements(render()).find(e => e.type === Results); ok(!!rendered, 'completed results mounted');
  eq(rendered.props.transactionType, 'rent', 'result units use server context'); eq(rendered.props.outcomes, latest.outcomes, 'completed outcomes forwarded'); eq(rendered.props.synthesis, latest.synthesis, 'completed synthesis forwarded');
  render(); render(); eq(fetches.length, 2, 'completed rerenders no requests'); eq(calls, before, 'client interaction never computes outcomes/synthesis');
  console.log(JSON.stringify({ status: 'PASS', checks, clientRoots: roots.length, runtimeModules: visited.size, liveIO: false, coverage: ['import boundary', 'server counts', 'outcome/synthesis semantics', 'recursive DTO allowlist', 'zero/null/not-established', 'EN/ES render', 'selection/collapse/stale/rerender'] }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
