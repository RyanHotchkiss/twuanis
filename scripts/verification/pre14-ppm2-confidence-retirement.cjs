/* Offline PRE-14-2 regression. All acquisition uses existing fake clients.
 * Optional PRE14_2_BASELINE points at the pre-edit source snapshot; it is never
 * used as current output. Both source trees execute afresh against identical fixtures.
 * No network, database, saved-row writes, or application startup are permitted.
 */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '../..');
const ts = require(root + '/node_modules/typescript');
const React = require(root + '/node_modules/react');
const { renderToStaticMarkup } = require(root + '/node_modules/react-dom/server');
const baseline = process.env.PRE14_2_BASELINE;
let checks = 0, comparisons = 0;
const fixtureResults = [];
const ok = (v, label) => { assert.ok(v, label); checks++; };
const plain = v => JSON.parse(JSON.stringify(v));
const retired = new Set(['confidence', 'confidenceBasedOnNumberOfProperties']);
function strip(v) {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === 'object') {
    const out = Object.fromEntries(Object.entries(v).filter(([k]) => !retired.has(k)).map(([k,x]) => [k,strip(x)]));
    // Legacy Rent nested genuine distribution evidence inside the retired wrapper.
    if (v.confidenceBasedOnNumberOfProperties?.distributionInterpretation) out.distributionInterpretation=strip(v.confidenceBasedOnNumberOfProperties.distributionInterpretation);
    return out;
  }
  return v;
}
function clean(v, label) {
  ok(!/"(?:confidence|confidenceBasedOnNumberOfProperties)"\s*:/.test(JSON.stringify(v)), label);
}
function same(actual, before, label) {
  assert.deepEqual(plain(actual), plain(strip(before)), label); checks++; comparisons++;
}
function read(file, old = false) {
  const rel = path.relative(root, String(file));
  const candidate = baseline && path.join(baseline, rel);
  return fs.readFileSync(old && candidate && !rel.startsWith('..') && fs.existsSync(candidate) ? candidate : file, 'utf8');
}
// Execute established offline fixtures with capture hooks, not cached output.
// Their require surface is restricted to local transpilation and fake I/O.
async function fixture(name, old, replacements, capture, argv = []) {
  const filename = path.join(root, 'scripts/verification', name);
  let source = fs.readFileSync(filename, 'utf8');
  for (const [needle, replacement] of replacements) {
    assert.ok(source.includes(needle), 'fixture capture anchor changed: ' + needle);
    source = source.replace(needle, replacement);
  }
  source = source.replace('(async()=>{', 'globalThis.done = (async()=>{');
  const proc = { argv: ['node', filename, ...argv], env: { S9_REPO_ROOT: root }, exitCode: 0 };
  const context = vm.createContext({ URLSearchParams, __dirname: path.dirname(filename), process: proc, capture, console: { log(...args){ if(!old) fixtureResults.push({fixture:name,args,argv}); }, error(e){ throw e; } }, require(k) {
    if (k === 'fs') return { ...fs, readFileSync(file, encoding) { return read(file, old); } };
    if (['path','vm','assert/strict'].includes(k)) return require(k);
    if (k === root + '/node_modules/typescript') return ts;
    throw Error('Forbidden fixture dependency ' + k);
  }});
  vm.runInContext(source, context, { filename });
  if (context.done) await context.done;
  assert.equal(proc.exitCode, 0);
}
function loader(old = false, mocks = {}) {
  const cache = new Map();
  function load(rel) {
    let file = path.resolve(root, rel);
    if (!path.extname(file)) file += fs.existsSync(file + '.tsx') ? '.tsx' : '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const m = { exports: {} }; cache.set(file,m);
    const code = ts.transpileModule(read(file,old), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    vm.runInNewContext(code, { module:m,exports:m.exports,console,require(k) {
      if (k==='server-only') return {};
      if (mocks[k]) return mocks[k];
      if (k==='react'||k==='react/jsx-runtime') return require(root+'/node_modules/'+k);
      if (k.startsWith('@/')) return load(k.slice(2));
      if (k.startsWith('.')) return load(path.resolve(path.dirname(file),k));
      throw Error('Forbidden module dependency '+k);
    }},{filename:file});
    return m.exports;
  }
  return load;
}
async function collect(old) {
  const out = { ordinary:[], comparable:[], phase12:[], phase11:[], comparison:[] };
  await fixture('s9-ordinary-acquisition.cjs',old,[
    ["console.log('S9 FULL ORDINARY ACQUISITION'", "capture(result); console.log('S9 FULL ORDINARY ACQUISITION'"]
  ],v=>out.ordinary.push(plain(v)));
  await fixture('s9-ordinary-acquisition.cjs',old,[
    ["return engine.getPriceMeterAnalysis(filters,'es',permit.issuePriceMeterApplyPermit(filters,'es'))", "const value=await engine.getPriceMeterAnalysis(filters,'es',permit.issuePriceMeterApplyPermit(filters,'es'));capture(value);return value"]
  ],v=>out.ordinary.push(plain(v)),['--variants']);
  await fixture('s9-phase12a-integration.cjs',old,[
    ["console.log('BASE_COUNTS'", `
      for (const value of [unconstrained,category,combined,analyze({...result,observations:[result.subject.observation],memberships:result.memberships.filter(m=>m.listingId===request.subjectListingId)}),analyze({...result,observations:result.observations.slice(0,2),memberships:result.memberships.filter(m=>result.observations.slice(0,2).some(o=>o.listingId===m.listingId))})]) {
        capture({analysis:value,dto:load('lib/price-meter-comparable-dto.ts').toPriceMeterComparableEvidenceDTO(value)});
      }
      console.log('BASE_COUNTS'`]
  ],v=>out.comparable.push(plain(v)));
  await fixture('s9-phase12.cjs',old,[
    ["assert.throws(()=>populate", "capture({subject,population,distribution,percentile,medianPosition,interval,tail,evidence}); assert.throws(()=>populate"]
  ],v=>out.phase12.push(plain(v)));
  await fixture('s9-phase11.cjs',old,[
    ["ok(result.body.question.key===q.key", "capture(result.body);ok(result.body.question.key===q.key"]
  ],v=>out.phase11.push(plain(v)));
  await fixture('s9-comparison-population.cjs',old,[
    ["console.log('S9 COMPARISON POPULATION CHECKS'", "capture(analysis);console.log('S9 COMPARISON POPULATION CHECKS'"]
  ],v=>out.comparison.push(plain(v)));
  await fixture('s9-comparison-population.cjs',old,[
    ["console.log('S9 REMAINING OVERLAP CHECKS'", "capture(analysis);console.log('S9 REMAINING OVERLAP CHECKS'"]
  ],v=>out.comparison.push(plain(v)),['--remaining']);
  return out;
}
(async()=>{
  for(const file of ['lib/confidence.ts','lib/price-meter-confidence.ts']) ok(!fs.existsSync(path.join(root,file)), 'deleted '+file);
  const ppmFiles = fs.readdirSync(root+'/lib').filter(f=>f.startsWith('price-meter-')&&f.endsWith('.ts'));
  for (const file of ppmFiles) {
    const source=read(root+'/lib/'+file);
    const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
    function visit(n) {
      if(ts.isImportDeclaration(n)) ok(!/(?:^|\/)confidence$|price-meter-confidence$/.test(n.moduleSpecifier.text),'no retired producer import '+file);
      if(ts.isIdentifier(n)) ok(!/^(?:confidence|confidenceBasedOnNumberOfProperties|resolveGeographicConfidence|getPriceMeterConfidence|getPriceMeterConfidenceScore|PriceMeterStatisticConfidence|PriceMeterComparableBrowserConfidence)$/.test(n.text),'no retired runtime/contract identifier '+file);
      ts.forEachChild(n,visit);
    }
    visit(ast);
  }
  const staticChecks=checks;
  const current=await collect(false), previous=baseline?await collect(true):null;
  const load=loader(), oldLoad=baseline?loader(true):null;
  if(previous) for(const key of Object.keys(current)) same(current[key],previous[key],'all nonconfidence '+key+' evidence identical');
  clean(current,'all fresh engine/evidence/DTO output confidence-free');
  // Real ordinary browser projection, including positive Rent and mixed FX fixtures.
  for(const engine of current.ordinary) for(const transaction of ['sale','rent']) {
    const dto=load('lib/price-meter-browser-result').toPriceMeterBrowserResult(engine,transaction);
    const intelligence=engine[transaction==='sale'?'saleIntelligence':'rentIntelligence'];
    for(const [key,distribution] of Object.entries(intelligence.distributions)) {
      ok(Number.isInteger(distribution.sampleSize)&&distribution.sampleSize>=0,'direct cohort count '+key);
      if(previous) {
        const oldEngine=previous.ordinary[current.ordinary.indexOf(engine)];
        ok(distribution.sampleSize===oldEngine[transaction==='sale'?'saleIntelligence':'rentIntelligence'].confidenceBasedOnNumberOfProperties[key].numberOfProperties,'retired wrapper n preserved in distribution '+key);
      }
    }
    ok(Number.isInteger(intelligence.constructionToLand.analysis.representedObservationCount),'Construction-to-Land represented count retained');
    clean(dto,'ordinary projected '+transaction);
    ok(Number.isInteger(engine.statistics.land.median.identity.sampleSize),'statistic identity n retained');
    for(const [file,label] of [['app/price-per-square-meter/PriceMeterResults.tsx','Properties'],['app/es/precio-por-metro-cuadrado/ResultadosPrecioMetro.tsx','Propiedades']]) {
      const component=load(file).default,filters={...engine.filters,transaction_type:transaction};
      const html=renderToStaticMarkup(React.createElement(component,{analysis:dto,filters}));
      ok(!/confidence|confianza|\/100/i.test(html),'ordinary EN/ES retired presentation absent');
      ok(html.includes(label),'ordinary direct population presentation retained');
      ok(html===renderToStaticMarkup(React.createElement(component,{analysis:engine,filters})),'fresh browser projection preserves complete ordinary rendering');
    }
    // Same JSON shape handed to saveAnalysis; no database writes.
    clean(JSON.parse(JSON.stringify({result:dto})).result,'new saved ordinary payload');
  }
  let saved;
  const save=loader(false,{
    '@/lib/auth/current-user':{requireCurrentUser:async()=>({id:'offline-user'})},
    '@/lib/supabase': { supabase: { from(table) {
      assert.equal(table,'saved_analyses');
      return { insert(value) {
        saved=value;
        return { select() { return {single:async()=>({data:value,error:null})}; } };
      } };
    } } }
  })('lib/saved-analyses').saveAnalysis;
  const savedResult=load('lib/price-meter-browser-result').toPriceMeterBrowserResult(current.ordinary[0],'sale');
  await save({engineType:'price-meter',language:'en',name:'offline',filters:{transaction_type:'sale'},result:savedResult});
  clean(saved.result,'actual saved-analysis insertion payload');
  assert.deepEqual(saved.result,savedResult);checks++;
  for(const [i,{analysis,dto}] of current.comparable.entries()) {
    const n=analysis.population.sampleSize;
    ok(n===[27,13,13,0,1][i],'Phase12A expected final n '+i);
    ok(!analysis.population.matchingListingIds.includes(analysis.subject.positionIdentity.listingId),'subject excluded '+i);
    ok(dto.comparisonPopulationCount===n&&dto.populationTrail.finalPopulationCount===n,'DTO final n/trail '+i);
    ok(dto.status===(n?'ok':'no_peers'),'zero/positive contract '+i);
    clean(dto,'Phase12A DTO '+i);
    if(n) ok(dto.percentile.belowCount+dto.percentile.equalCount+dto.percentile.aboveCount===n,'Below Equal Above sum '+i);
    else ok(analysis.evidence===null&&!('distribution' in dto),'no fabricated zero-peer evidence');
    if(previous) {
      same(analysis.subject,previous.comparable[i].analysis.subject,'exact subject identity '+i);
      same(analysis.population,previous.comparable[i].analysis.population,'base geography dimensions final IDs count exclusion trail '+i);
      same(dto,previous.comparable[i].dto,'complete comparable DTO except confidence '+i);
    }
  }
  for(const value of current.phase12) {
    ok(value.evidence.comparisonPopulationCount===5,'Phase12 independent positive population');
    ok(value.percentile.belowCount===1&&value.percentile.equalCount===2&&value.percentile.aboveCount===2,'Phase12 tied midrank counts');
    const build=load('lib/price-meter-property-position-evidence').buildPriceMeterPropertyPositionEvidence;
    for(const n of [0,-1,1.5,NaN]) { assert.throws(()=>build({...value,population:{...value.population,comparisonPopulationCount:n},constructionToLandContext:null})); checks++; }
  }
  // Boundary cross-product prevents either cohort's count masking the other.
  const buildComparison=load('lib/price-meter-comparison-analysis').buildPriceMeterComparisonAnalysis;
  const beforeComparison=oldLoad?.('lib/price-meter-comparison-analysis').buildPriceMeterComparisonAnalysis;
  const seed=current.comparison[0].comparison.cohortA.population;
  const cohort=(n,price)=>({...seed,observations:Array.from({length:n},(_,i)=>({...seed.observations[0],listingId:'threshold-'+i,pricePerM2:price})),sampleSize:n,matchingListingIds:Array.from({length:n},(_,i)=>'threshold-'+i)});
  for(const nA of [0,7,8,14,15,24,25]) for(const nB of [0,7,8,14,15,24,25]) for(const referenceCohort of ['A','B']) {
    const args={transactionType:'sale',cohortA:cohort(nA,100),cohortB:cohort(nB,200),referenceCohort,language:'en'};
    const result=buildComparison(args),authorized=nA>=8&&nB>=8;
    ok(result.evidence.cohortA.sampleSize===nA&&result.evidence.cohortB.sampleSize===nB,'A/B n preserved');
    ok(result.evidence.comparisonSufficient===authorized,'independent n8 threshold');
    ok(result.medianDifference.absoluteDifference===(authorized?-100:null),'signed difference / withholding');
    ok(result.medianDifference.percentageDifference===(authorized?(referenceCohort==='A'?-100:-50):null),'selected denominator / withholding');
    if(beforeComparison) same(result,beforeComparison(args),'Phase10 threshold baseline');
    clean(result,'Phase10 result no confidence');
  }
  // Real distributions exclude nonpositive observations. Exercise that rule first,
  // then inject only a zero median to reach the defensive denominator branch.
  const zeroArgs={transactionType:'sale',cohortA:cohort(8,0),cohortB:cohort(8,100),referenceCohort:'B',language:'es'};
  const zero=buildComparison(zeroArgs);
  ok(zero.cohortA.distribution.sampleSize===0&&!zero.evidence.comparisonSufficient&&zero.medianDifference.percentageDifference===null,'nonpositive observations remain ineligible');
  if(beforeComparison) same(zero,beforeComparison(zeroArgs),'real zero-observation baseline');
  const distribution=load('lib/price-meter-distribution'),originalDistribution=distribution.buildPriceMeterDistribution;
  const oldDistribution=oldLoad?.('lib/price-meter-distribution'),oldOriginal=oldDistribution?.buildPriceMeterDistribution;
  function zeroMedian(original) { return input=>{const result=original(input);return {...result,median:input.observations[0].pricePerM2===100?0:result.median};}; }
  try {
    distribution.buildPriceMeterDistribution=zeroMedian(originalDistribution);
    if(oldDistribution) oldDistribution.buildPriceMeterDistribution=zeroMedian(oldOriginal);
    for(const referenceCohort of ['A','B']) {
      const args={transactionType:'sale',cohortA:cohort(8,100),cohortB:cohort(8,200),referenceCohort,language:'es'};
      const result=buildComparison(args);
      ok(result.medianDifference.percentageDifference===(referenceCohort==='A'?null:-100),'defensive zero selected denominator');
      if(beforeComparison) same(result,beforeComparison(args),'zero-denominator baseline');
    }
  } finally {
    distribution.buildPriceMeterDistribution=originalDistribution;
    if(oldDistribution) oldDistribution.buildPriceMeterDistribution=oldOriginal;
  }
  for(const analysis of current.comparison) for(const [file,label] of [['app/price-per-square-meter/PriceMeterComparisonResults.tsx','Properties'],['app/es/precio-por-metro-cuadrado/ResultadosComparacionPrecioMetro.tsx','Propiedades']]) {
    const html=renderToStaticMarkup(React.createElement(load(file).default,{analysis}));
    ok(!/confidence|confianza|\/100/i.test(html),'Phase10 EN/ES no confidence cards');
    ok(html.includes(label),'Phase10 EN/ES population cards');
  }
  const math=load('lib/price-meter-size-relationship-math');
  for(const n of [2,3,4]) {
    const args={coordinates:Array.from({length:n},(_,i)=>({area:(i+1)*100,ratio:100/(i+1)})),representedObservationCount:25};
    const result=math.buildPriceMeterSizeRelationshipResult(args);
    ok(result.evidence.hasSufficientBandEvidence===(n>=3),'Phase8 three-band prerequisite');
    ok(result.evidence.representedObservationCount===25,'Phase8 represented n');
    ok(n>=3?result.regression!==null:result.regression===null&&result.spearmanRho===null,'Phase8 mathematical withholding');
    if(oldLoad) same(result,oldLoad('lib/price-meter-size-relationship-math').buildPriceMeterSizeRelationshipResult(args),'Phase8 full baseline');
  }
  const relationships=load('lib/price-meter-construction-land-relationship');
  for(const bands of [2,3]) for(const n of [11,12]) for(const fn of ['buildPriceMeterConstructionLandLandRelationship','buildPriceMeterConstructionLandConstructionRelationship']) {
    const stats={transactionType:'sale',populatedCohorts:Array.from({length:bands},(_,i)=>({medianExactRatio:(i+1)/4,landNormalized:{median:100/(i+1)},constructionNormalized:{median:200/(i+1)},observationCount:i===0?n-bands+1:1}))};
    const result=relationships[fn](stats);
    ok(result.evidence.hasSufficientEvidence===(bands>=3&&n>=12),'Phase9 independent bands/n prerequisite');
    ok(result.evidence.requiredPopulatedCohortCount===3&&result.evidence.requiredObservationCount===12,'Phase9 explicit required counts');
    ok(result.evidence.representedObservationCount===n&&result.evidence.populatedCohortCount===bands,'Phase9 observed counts');
    ok(result.regression===null&&result.regressionWithheldReason.includes('mathematical_coupling'),'coupled regression stays withheld');
    if(oldLoad) same(result,oldLoad('lib/price-meter-construction-land-relationship')[fn](stats),'Phase9 full baseline');
  }
  for(const fn of ['calculatePearsonCorrelation','calculateSpearmanCorrelation','calculateLogLogRegression']) {
    const value=math[fn]([1,2],[1]);ok(value===null,'unequal coordinate lengths '+fn);
  }
  ok(math.calculateLogLogRegression([0,1,2],[1,2,3])===null,'nonpositive log input withheld');
  for(const result of current.phase11) clean(result,'Phase11 completed browser evidence/outcomes/synthesis');
  // Existing browser/action verifier receives the newly executed fixture, never its old snapshot.
  let browserSource=fs.readFileSync(root+'/scripts/verification/s9-browser-result.cjs','utf8');
  browserSource=browserSource.replace("JSON.parse(fs.readFileSync('/private/tmp/s9-engine-result.json','utf8'))",'freshFixture');
  browserSource=browserSource.replace('(async()=>{','globalThis.done=(async()=>{').replaceAll('cached completed fixture','fresh offline engine fixture').replaceAll('cached internal result','fresh internal result');
  const browserContext=vm.createContext({__dirname:root+'/scripts/verification',freshFixture:current.ordinary[0],require,console,process:{exitCode:0}});
  vm.runInContext(browserSource,browserContext);await browserContext.done;assert.equal(browserContext.process.exitCode,0);checks++;
  console.log(JSON.stringify({status:'PASS',checks,staticChecks,behaviorChecks:checks-staticChecks,fixtureResults,baselineComparisons:comparisons,baseline:baseline?'fresh before/after':'not supplied',ordinaryExecutions:current.ordinary.length,phase12aCases:current.comparable.length,phase11Questions:current.phase11.length,network:'none; fake clients only'}));
})().catch(e=>{console.error(e);process.exitCode=1});
