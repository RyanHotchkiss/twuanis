// Offline scope regression: real route, population, mathematics and projection.
// Acquisition/auth are mocked; every other external dependency fails closed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..'),cache=new Map();
const browserFixtures={};
let checks=0,rows=[],calls={},baseline=false,denied=false;
const plain=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b,label)=>{assert.deepEqual(plain(a),plain(b),label);checks++};
function load(file){
 file=path.normalize(file);if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);
 let source=fs.readFileSync(path.join(root,file),'utf8');
 if(file==='lib/price-meter-size-relationship-math.ts'){
  for(const [name,key]of [['calculateLogLogRegression','regression'],['calculateLogLogRSquared','rSquared'],['calculateModeledAreaChange','modeledChange'],['calculateSpearmanCorrelation','spearman']])source=source.replace(new RegExp('(?<!function )'+name+'\\(', 'g'),`(scopeEvent('${key}'), ${name})(`);
 }
 if(file==='lib/price-meter-construction-land-statistics.ts'){
  // Instrument branches in memory only; execute the real statistical implementation.
  for(const [mode,other]of [['land','construction'],['construction','land']]){
   source=source.replace(`scope !== '${other}' ? cohort.observations.map(`,`scope !== '${other}' ? (scopeEvent('${mode}Array'), cohort.observations).map(`);
   source=source.replace(`${mode}NormalizedValues ? buildNumericalDistribution(`,`${mode}NormalizedValues ? (scopeEvent('${mode}Distribution'), buildNumericalDistribution)(`);
   const title=mode[0].toUpperCase()+mode.slice(1);
   source=source.replace(`scope !== '${other}' ? higher${title}Median! -`,`scope !== '${other}' ? (scopeEvent('${mode}Adjacent'), higher${title}Median!) -`);
  }
 }
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
  scopeEvent:key=>{calls[key]=(calls[key]||0)+1},
  module:m,exports:m.exports,console,require(name){
   if(name==='server-only')return {};
   if(name==='next/server')return {NextResponse:{json:(body,options={})=>({body:plain(body),status:options.status??200})}};
   const base=name.startsWith('@/')?name.slice(2):name.startsWith('.')?path.join(path.dirname(file),name):null;
   if(base==='lib/price-meter-authorization')return {authorizePriceMeterIntelligenceExecution:async()=>{if(denied)throw Error('Denied')},PriceMeterComparableAuthenticationError:class extends Error{},PriceMeterComparableAuthorizationError:class extends Error{}};
   if(base==='lib/price-meter-observation-loader')return {loadPriceMeterObservations:async(filters,scope)=>{
    calls.acquisition=(calls.acquisition||0)+1;calls.scope=scope;
    assert.ok(scope,'route must propagate explicit identity');
    const candidates=baseline?rows:rows.filter(r=>r.analyticalIdentity.propertyBasis===scope.propertyBasis);
    const observations=load('lib/price-meter-observation-builder.ts').buildPriceMeterObservations(candidates,baseline?undefined:scope.normalizationBasis);
    calls.identities=observations.map(o=>[o.propertyBasis,o.normalizationBasis]);
    return {observations,analyticalDate:"2026-09-27",fxIdentity:null};
   }};
   if(base){const target=['.ts','.tsx'].map(ext=>base+ext).find(f=>fs.existsSync(path.join(root,f)));if(target)return load(target)}
   throw Error('Unmocked dependency '+name);
  },fetch(){throw Error('Network forbidden')}
 },{filename:file});
 if(file==='lib/price-meter-geographic-distribution.ts'){
  const single=m.exports.buildPriceMeterGeographicLevel;
  m.exports.buildPriceMeterGeographicLevel=input=>{
   const build=level=>{calls[level]=(calls[level]||0)+1;return single({...input,level})};
   if(baseline){const all={province:build('province'),canton:build('canton'),district:build('district')};return all[input.level]}
   return build(input.level);
  };
 }
 if(file==='lib/price-meter-construction-land-statistics.ts'){
  const build=m.exports.buildPriceMeterConstructionLandStatistics;
  m.exports.buildPriceMeterConstructionLandStatistics=(population,scope)=>{calls['statistics_'+scope]=(calls['statistics_'+scope]||0)+1;return build(population,baseline?'both':scope)};
 }
 if(file==='lib/price-meter-size-relationship-math.ts'){
  const build=m.exports.buildPriceMeterSizeRelationshipResult;
  m.exports.buildPriceMeterSizeRelationshipResult=(input,scope)=>build(input,baseline?'authorized':scope);
 }
 return m.exports;
}
const identity=load('lib/price-meter-identity.ts'),route=load('app/api/price-meter/cross-dimensional/route.ts');
const term=(id,type)=>({id,term_type:type,official_code:String(id),term_name:type+id,term_name_en:type+id,term_name_es:type+id});
function fixture(tx,basis){rows=Array.from({length:48},(_,i)=>{
 const row={id:String(i+1),transaction_type:tx,property_type:basis==='land_only'?'land':'house',currency:'CRC',current_price:10000000+i*500000,monthly_price:100000+i*5000,property_area:[80,200,600,1500][i%4],construction_area:basis==='land_only'?null:[50,120,250,600][i%4],canonicalGeography:{province:term(1,'province'),canton:term(101,'canton'),district:term(i%5+10101,'district')}};
 return {...row,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:'2026-09-27',fxIdentity:null})};
})}
async function run(body,old=false){baseline=old;calls={};const result=await route.POST({json:async()=>body});return {result,calls:plain(calls)}}
(async()=>{
 for(const tx of ['sale','rent'])for(const [basis,norm,key]of [['land_only','land','vacantLandLandNormalized'],['improved_property','land','improvedLandNormalized'],['improved_property','construction','improvedConstructionNormalized']])for(const level of ['district']){
  fixture(tx,basis);const body={questionKey:'geography_by_property_area',cohortKey:key,filters:{transaction_type:tx,province:'1',...(level==='district'?{canton:'101'}:{}),property_type:basis==='land_only'?'land':'house'}};
  const next=await run(body),old=await run(body,true),K=next.result.body.evidence?.populatedSecondaryCohortCount;
  browserFixtures.geographic=next.result.body;
  eq(next.result.status,200,'valid route');assert.ok(K>1);checks++;
  eq(next.result,old.result,'full projected evidence/outcomes/synthesis parity');
  eq(next.calls.acquisition,1,'one acquisition');eq(old.calls.acquisition,1,'acquisition unchanged');
  eq(next.calls.identities.every(([b,n])=>b===basis&&n===norm),true,'selected observations only');
  eq(next.calls.identities.length,48,'one observation per eligible fixture listing');
  eq(next.calls[level],K,'K selected geographic builds');
  for(const other of ['province','canton','district'].filter(x=>x!==level))eq(next.calls[other]||0,0,'zero unselected builds');
  eq(['province','canton','district'].reduce((sum,l)=>sum+(old.calls[l]||0),0),3*K,'baseline 3K');
 }
 // Province-only/national geography are not valid ordinary Apply requests. Verify the shared
 // analyzer's province scope directly without broadening route eligibility.
 const analyzer=load('lib/price-meter-cross-dimensional-analyzer.ts'),resolver=load('lib/price-meter-cross-dimensional-identity.ts');
 baseline=false;fixture('sale','improved_property');
 const obs=load('lib/price-meter-observation-builder.ts').buildPriceMeterObservations(rows,'land');
 for(const level of ['province','canton']){
 const id=resolver.resolvePriceMeterCrossDimensionalIdentity({questionKey:'geography_by_property_area',cohort:{transactionType:'sale',propertyBasis:'improved_property',normalizationBasis:'land',observations:obs},geographicScope:{selectedLevel:level==='province'?'national':'province',comparisonLevel:level}});
 calls={};const evidence=analyzer.analyzePriceMeterCrossDimensionalRelationship({identity:id,observations:obs});
 eq(calls[level],evidence.populatedSecondaryCohortCount,'selected K');for(const other of ['province','canton','district'].filter(x=>x!==level))eq(calls[other]||0,0,'unselected zero');
 const narrow=plain(evidence);baseline=true;calls={};eq(analyzer.analyzePriceMeterCrossDimensionalRelationship({identity:id,observations:obs}),narrow,'direct analyzer parity');baseline=false;
 }
 for(const tx of ['sale','rent'])for(const norm of ['land','construction'])for(const secondary of ['geography','property_area','construction_area']){
  rows=Array.from({length:180},(_,i)=>{
   const area=[200,600,1500][Math.floor(i/4)%3],ratio=[.1,.3,.75,1.5][i%4];
   const row={id:String(i+1),transaction_type:tx,property_type:'house',currency:'CRC',current_price:10000000+i*100000,monthly_price:100000+i*1000,property_area:area,construction_area:area*ratio,canonicalGeography:{province:term(1,'province'),canton:term(101,'canton'),district:term(10101+Math.floor(i/12)%3,'district')}};
   return {...row,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:'2026-09-27',fxIdentity:null})};
  });
  const body={questionKey:'construction_to_land_by_'+secondary,cohortKey:norm==='land'?'improvedLandNormalized':'improvedConstructionNormalized',filters:{transaction_type:tx,province:'1',canton:'101',property_type:'house'}};
  const next=await run(body),old=await run(body,true),K=next.result.body.evidence?.populatedSecondaryCohortCount,other=norm==='land'?'construction':'land';
  browserFixtures.constructionLand=next.result.body;
  eq(next.result.status,200,'C/L route success');assert.ok(K>0);checks++;
  eq(next.result,old.result,'C/L full evidence/outcomes/synthesis parity');
  eq(next.calls['statistics_'+norm],K,'one selected statistics execution per secondary cohort');eq(next.calls['statistics_'+other]||0,0,'no unselected statistics execution');
  for(const stage of ['Array','Distribution','Adjacent']){eq(next.calls[other+stage]||0,0,'no unselected '+stage);assert.ok(old.calls[other+stage]>0,'baseline instrumentation observes '+stage);checks++}
  assert.ok(next.calls[norm+'Distribution']>0);checks++;
  eq(next.calls.acquisition,old.calls.acquisition,'acquisition unchanged');eq(next.calls.identities.every(([b,n])=>b==='improved_property'&&n===norm),true,'selected observations retained');
  if(secondary==='geography')assert.ok(next.result.body.evidence.evidence.every(e=>e.status==='established'&&e.spearmanRho!==null),'established non-null rho parity');
 }
 for(const tx of ['sale','rent'])for(const area of ['property_area','construction_area'])for(const secondary of ['construction_to_land','geography']){
  // Each C/L band contains multiple size bands, so the old model actually runs.
  rows=Array.from({length:360},(_,i)=>{const a=[50,150,350,750,1500,3500][i%6],ratio=[.1,.3,.75,1.5,3][Math.floor(i/6)%5];const row={id:String(i+1),transaction_type:tx,property_type:'house',currency:'CRC',current_price:10000000+i*100000,monthly_price:100000+i*1000,property_area:a,construction_area:a*ratio,canonicalGeography:{province:term(1,'province'),canton:term(101,'canton'),district:term(10101+Math.floor(i/30)%3,'district')}};return {...row,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:'2026-09-27',fxIdentity:null})}});
  const body={questionKey:area+'_by_'+secondary,filters:{transaction_type:tx,province:'1',canton:'101',property_type:'house'}};
  const next=await run(body),old=await run(body,true);
  browserFixtures[secondary==='construction_to_land'?'withheld':'size']=next.result.body;
  eq(next.result.status,200,'size route');eq(next.result,old.result,'size full projected parity');
  eq(next.calls.spearman,old.calls.spearman,'Spearman execution preserved');assert.ok(next.calls.spearman>0);checks++;
  for(const model of ['regression','rSquared','modeledChange']){assert.ok(old.calls[model]>0,'baseline '+model+' runs');checks++;eq(next.calls[model]||0,secondary==='construction_to_land'?0:old.calls[model],model+' scope');}
  for(const e of next.result.body.evidence.evidence)if(secondary==='construction_to_land')eq([e.logLogSlope,e.rSquared,e.modeledTenPercentAreaChangePercent,e.modeledStatisticsAuthorization],[null,null,null,'withheld_mathematical_coupling'],'withholding preserved');
 }
 denied=true;const deniedRun=await run({});eq(deniedRun.calls.acquisition||0,0,'unauthorized zero acquisition');denied=false;
 const invalid=await run({questionKey:'not_registered',filters:{}});eq(invalid.result.status,400,'invalid question');eq(invalid.calls.acquisition||0,0,'invalid zero acquisition');
 for(const input of [
  {questionKey:'geography_by_construction_area',cohortKey:'vacantLandLandNormalized',filters:{transaction_type:'sale',province:'1',canton:'101',property_type:'land'}},
  {questionKey:'property_area_by_geography',filters:{transaction_type:'sale',province:'1',canton:'101',district:'10101',property_type:'house'}}
 ]){const rejected=await run(input);eq(rejected.result.status,500,'existing compatibility failure status retained');eq(rejected.calls.acquisition||0,0,'incompatible question fails before acquisition')}
 const action=load('lib/price-meter-cross-dimensional-action.ts');
 for(const questionKey of ['geography_by_construction_area','geography_by_construction_to_land']){
  fixture('sale','improved_property');const input={questionKey,cohortKey:'improvedLandNormalized',filters:{transaction_type:'sale',province:'1',canton:'101',property_type:'house'}};
  const current=await run(input),prior=await run(input,true);eq(current.result.status,200,questionKey);eq(current.result,prior.result,'remaining registered question parity');eq(current.calls.acquisition,1,'one acquisition for remaining question');
 }
 const body={questionKey:'property_area_by_geography',filters:{transaction_type:'sale',province:'1',canton:'101',property_type:'house'}};
 fixture('sale','improved_property');baseline=false;
 const expected=await run(body);calls={};const hub=await action.executeCrossDimensionalHub(body);
 eq(hub.state,'complete','real Hub action completes');eq(hub.result,expected.result.body,'Hub and existing child route parity');eq(calls.acquisition,1,'Hub one acquisition');eq(hub.analyticalDate,'2026-09-27','Hub analytical date');
 calls={};browserFixtures.catalog={en:await action.readCrossDimensionalQuestions('en'),es:await action.readCrossDimensionalQuestions('es')};eq(calls.acquisition||0,0,'catalog zero analytics');eq(browserFixtures.catalog.en.map(q=>q.key),browserFixtures.catalog.es.map(q=>q.key),'EN ES same registry');
 rows=[];browserFixtures.empty=(await run(body)).result.body;eq(browserFixtures.empty.evidence.representedObservationCount,0,'empty represented zero');
 fixture('sale','improved_property');rows=rows.slice(0,2);browserFixtures.insufficient=(await run(body)).result.body;eq(browserFixtures.insufficient.outcomes.persistence.establishedSecondaryCohortCount,0,'insufficient not zero relationship');
 fixture('sale','improved_property');rows=rows.map(r=>{const x={...r,current_price:r.property_area*(Number(r.canonicalGeography.district.id)%2?r.property_area*10:100000/r.property_area)};return {...x,analyticalIdentity:identity.resolvePriceMeterAnalyticalIdentity(x,{analyticalDate:'2026-09-27',fxIdentity:null})}});
 browserFixtures.reversal=(await run(body)).result.body;assert.ok(browserFixtures.reversal.outcomes.reversals.length>0,'real directional reversal');checks++;
 for(const n of [48,480,2400]){fixture('sale','improved_property');const seed=rows;rows=Array.from({length:n},(_,i)=>({...seed[i%48],id:String(i+1)}));const result=await run(body);eq(result.calls.acquisition,1,'acquisition constant at n='+n);eq(result.calls.identities.length,n,'selected construction linear at n='+n);eq(result.result.body.evidence.inputObservationCount,n,'complete population n='+n);console.log(JSON.stringify({fixtureN:n,acquisitions:result.calls.acquisition,selectedObservations:result.calls.identities.length,secondaryGroups:result.result.body.evidence.populatedSecondaryCohortCount,projectedBytes:Buffer.byteLength(JSON.stringify(result.result.body))}))}
 denied=true;calls={};eq((await action.executeCrossDimensionalHub(body)).state,'error','Hub denied');eq(calls.acquisition||0,0,'Hub denied zero acquisition');denied=false;
 if(process.env.ENGINE12_FIXTURE_PATH)fs.writeFileSync(process.env.ENGINE12_FIXTURE_PATH,JSON.stringify(browserFixtures))
 console.log('CROSS-DIMENSIONAL SCOPE PASS',checks);
})().catch(error=>{console.error(error);process.exitCode=1});
