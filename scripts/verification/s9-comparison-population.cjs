const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=process.env.S9_REPO_ROOT||'/Users/cassidydaddy/twuanis',ts=require(root+'/node_modules/typescript');let checks=0;const ok=(v,l)=>{assert.ok(v,l);checks++};
const term=(id,type,slug)=>({ontologyTermId:id,termType:type,slug,termName:slug,termNameEn:slug,termNameEs:slug,slugEn:slug,slugEs:slug});
const geo={id:100,parent_id:9,official_code:'3',term_type:'province',term_name:'Cartago',slug:'cartago'};
const cohort={geography:geo,propertyType:term(1,'property_type','house'),characteristics:[term(2,'bedrooms','2-bedrooms'),term(3,'terrain','flat')],propertyAreaRange:'100-500m2',constructionAreaRange:null,constructionLandCohortKey:null};
const req={transactionType:'sale',propertyBasis:'improved_property',normalizationBasis:'land',referenceCohort:'A',cohortA:cohort,cohortB:cohort};
const listing=(i,extra={})=>({id:'listing-'+String(i).padStart(3,'0'),canonical_domain_version:1,listing_status:'active',transaction_type:'sale',currency:'CRC',current_price:100000+i*10000,property_area:200,construction_area:100,images:[],...extra});
const source=[...Array.from({length:27},(_,i)=>listing(i)),listing(27,{canonical_domain_version:null}),listing(28,{transaction_type:'rent'}),listing(29,{listing_status:'draft'})];
const assignments=source.flatMap(l=>[100,1,2,3].map(id=>({listing_id:l.id,ontology_term_id:String(id),version:l.canonical_domain_version})));
let calls=[],hydrations=0,mode='normal', delivered=[];const cache=new Map();
const db={from(table){const filters=[],orders=[];let from,to;const q={select(cols,opts){assert.equal(opts.count,'exact');if(table==='listings_ontology_terms')assert.ok(cols.includes('ontology_term_id::text'));return q},eq(k,v){filters.push([k,v]);return q},in(k,vs){assert.ok(vs.length<=25);filters.push([k,vs]);return q},order(k){orders.push(k);return q},range(f,t){from=f;to=t;return q},then(resolve,reject){return Promise.resolve().then(()=>{calls.push({table,filters,from,to});assert.ok(Number.isInteger(from)&&to-from===499);let rows=(table==='listings'?source:assignments).filter(row=>filters.every(([k,v])=>{const actual=k==='listings.canonical_domain_version'?row.version:row[k];return Array.isArray(v)?v.includes(actual):String(actual)===String(v)}));rows=rows.slice().sort((a,b)=>{for(const k of orders){const x=String(a[k]),y=String(b[k]);if(x!==y)return x<y?-1:1}return 0});delivered.push(...rows.slice(from,Math.min(to+1,from+2)).map(row=>table+':'+(row.listing_id??row.id)+':'+(row.ontology_term_id??'')));return {data:(mode==='empty'||(mode==='truncated'&&from>0))?[]:rows.slice(from,Math.min(to+1,from+2)),count:mode==='missing-count'?null:rows.length+(mode==='changed-count'&&from>0?1:0),error:(mode==='error'||(mode==='listing-error'&&table==='listings')||(mode==='membership-error'&&filters.some(([k,v])=>k==='ontology_term_id'&&Array.isArray(v))))?Error('database failure'):null}}).then(resolve,reject)}};return q}};
const geography={province:{...geo,id:'100'},canton:{id:'101',official_code:'304',term_type:'canton',term_name:'Jimenez'},district:null,complete:true,reasons:{province:'resolved',canton:'resolved',district:'missing'}};
const mocks={'@/lib/supabase-admin':{supabaseAdmin:db},'@/lib/canonical-population':{async hydrateCanonicalPopulation(rows,_e,facts){hydrations++;if(mode==='hydrate-error')throw Error('hydration failure');assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);assert.equal(facts.length,0);return rows.map(l=>({...l,canonicalGeography:geography,property_type:'house'}))}},'@/lib/analysis-date':{getCurrentAnalyticalDate:()=> '2026-09-19'},'@/lib/fx/fx-service':{getHistoricalUsdToCrcRate(){throw Error('Unexpected FX')}},'@/lib/price-meter-ontology-membership':{loadPriceMeterOntologyMemberships(){throw Error('Unexpected membership reload')}}};
function load(rel){rel=path.resolve(root,rel);if(cache.has(rel))return cache.get(rel).exports;const m={exports:{}};cache.set(rel,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(rel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};if(mocks[k])return mocks[k];if(k.startsWith('@/lib/price-meter-')||['@/lib/numerical-distribution','@/lib/market-intelligence-area-ranges'].includes(k))return load(k.slice(2)+'.ts');if(k.startsWith('.'))return load(path.resolve(path.dirname(rel),k)+'.ts');throw Error('Forbidden dependency '+k)},console},{filename:rel});return m.exports}
(async()=>{if(process.argv.includes('--failures'))return failures();if(process.argv.includes('--remaining'))return remaining();const loader=load('lib/price-meter-comparison-candidate-loader.ts');const result=await loader.loadPriceMeterComparisonCandidates(req);ok(result.listings.length===27,'complete 27 sale canonical active rows despite 2-row cap');ok(hydrations===1,'one union hydration');ok(result.memberships.length===27&&result.memberships.every(m=>m.ontologyTermIds.length===3),'reuse acquired positive membership');ok(result.listings.every(l=>l.canonical_domain_version===1&&l.transaction_type==='sale'&&l.listing_status==='active'),'exclude legacy/rent/inactive');const geoCalls=calls.filter(c=>c.table==='listings_ontology_terms'&&c.filters.some(([k,v])=>k==='ontology_term_id'&&v==='100'));ok(geoCalls.length===15,'identical A/B geography acquired once with complete 29-row pagination');ok(calls.filter(c=>c.table==='listings_ontology_terms'&&!c.filters.some(([k,v])=>k==='ontology_term_id'&&v==='100')).every(c=>c.filters.some(([k])=>k==='listing_id')),'all characteristic reads constrained by listing candidates');const firstCalls=calls.length;
for(const bad of ['missing-count','empty','error']){mode=bad;await assert.rejects(()=>loader.loadPriceMeterComparisonCandidates(req));checks++}mode='normal';await assert.rejects(()=>loader.loadPriceMeterComparisonCandidates({...req,cohortA:{...cohort,geography:{...geo,id:Number.MAX_SAFE_INTEGER+1}}}));checks++;
calls=[];hydrations=0;const permit=load('lib/price-meter-comparison-permit.ts').issuePriceMeterComparisonPermit(req,'en');const analysis=await load('lib/price-meter-comparison-engine.ts').getPriceMeterComparisonAnalysis({request:req,permit,language:'en'});ok(analysis.candidateListingCount===27,'actual engine candidate count');ok(analysis.analyticalObservationCount===27,'one normalization per listing');ok(hydrations===1,'actual engine one hydration');ok(analysis.comparison.cohortA.population.sampleSize===27&&analysis.comparison.cohortB.population.sampleSize===27,'both overlapping cohorts retain canonical string geography identities');ok(calls.length===firstCalls,'actual engine no additional database path');console.log('S9 COMPARISON POPULATION CHECKS',checks,'MOCK REQUESTS',firstCalls,'HYDRATIONS',hydrations)})().catch(e=>{console.error(e);process.exitCode=1});

async function remaining(){
  // Nonidentical, partially overlapping cohorts: A=0..17, B=9..26.
  for(let i=assignments.length-1;i>=0;i--)if(assignments[i].ontology_term_id==='3'&&Number(assignments[i].listing_id.slice(-3))>=18)assignments.splice(i,1);
  for(const l of source)if(Number(l.id.slice(-3))>=9)assignments.push({listing_id:l.id,ontology_term_id:'4',version:l.canonical_domain_version});
  const overlap={...req,cohortB:{...cohort,characteristics:[term(2,'bedrooms','2-bedrooms'),term(4,'terrain','slope')]}};
  const permit=load('lib/price-meter-comparison-permit.ts').issuePriceMeterComparisonPermit(overlap,'en');
  const analysis=await load('lib/price-meter-comparison-engine.ts').getPriceMeterComparisonAnalysis({request:overlap,permit,language:'en'});
  ok(analysis.candidateListingCount===27&&hydrations===1,'partial overlap union acquired/hydrated once');
  const a=analysis.comparison.cohortA,b=analysis.comparison.cohortB;
  ok(a.population.sampleSize===18&&b.population.sampleSize===18,'independent n with 9 overlapping listings');
  ok(a.distribution.median===925&&b.distribution.median===1375,'independent medians and no cross contamination');
  const listingReads=delivered.filter(x=>x.startsWith('listings:'));
  ok(listingReads.length===27&&new Set(listingReads).size===27,'no duplicate union listing retrieval');
  const membershipReads=delivered.filter(x=>x.startsWith('listings_ontology_terms:'));
  ok(new Set(membershipReads).size===membershipReads.length,'no redundant membership evidence for distinct overlapping definitions');
  console.log('S9 REMAINING OVERLAP CHECKS',checks,'MOCK REQUESTS',calls.length);
}

async function failures(){
 const permits=load('lib/price-meter-comparison-permit.ts'),engine=load('lib/price-meter-comparison-engine.ts');
 for(const failure of ['error','membership-error','listing-error','changed-count','truncated','hydrate-error']){
   calls=[];delivered=[];hydrations=0;mode=failure;
   const p=permits.issuePriceMeterComparisonPermit(req,'en');
   await assert.rejects(()=>engine.getPriceMeterComparisonAnalysis({request:req,permit:p}));checks++;
   const count=calls.length;
   await assert.rejects(()=>engine.getPriceMeterComparisonAnalysis({request:req,permit:p}),/explicit authorized Compare/);checks++;
   ok(calls.length===count,'failure consumes permit without retry '+failure);
   ok(hydrations===(failure==='hydrate-error'?1:0),'no partial hydration '+failure);
   if(failure==='error')ok(count===1,'candidate failure not retried');
   if(failure==='changed-count'||failure==='truncated')ok(count===2,'pagination failure stops on second page');
 }
 mode='normal';calls=[];hydrations=0;
 const invalid={...req,cohortA:{...cohort,propertyAreaRange:null}};
 await assert.rejects(()=>engine.getPriceMeterComparisonAnalysis({request:invalid,permit:permits.issuePriceMeterComparisonPermit(invalid,'en')}),/Invalid comparison cohort/);checks++;
 ok(calls.length===0&&hydrations===0,'invalid cohort fails before candidate acquisition');
 const analysisModule=load('lib/price-meter-comparison-analysis.ts'),original=analysisModule.buildPriceMeterComparisonAnalysis;let calculations=0;
 analysisModule.buildPriceMeterComparisonAnalysis=()=>{calculations++;throw Error('injected calculation failure')};
 await assert.rejects(()=>engine.getPriceMeterComparisonAnalysis({request:req,permit:permits.issuePriceMeterComparisonPermit(req,'en')}),/injected calculation failure/);checks++;
 ok(calculations===1&&hydrations===1,'calculation failure has no recursive retry or rehydration');
 analysisModule.buildPriceMeterComparisonAnalysis=original;
 const parser=load('lib/price-meter-comparison-request-parser.ts');
 const option=t=>({id:t.ontologyTermId,term_type:t.termType,slug:t.slug,term_name:t.termName,parent_id:null,official_code:null});
 const options={province:[geo],canton:[],district:[],property_type:[option(cohort.propertyType)],bedrooms:[option(cohort.characteristics[0])],terrain:[option(cohort.characteristics[1])]};
 const params={transaction_type:'sale',property_basis:'improved_property',normalization_basis:'land',reference_cohort:'A'};
 for(const side of ['a','b'])Object.assign(params,{[side+'_province']:'3',[side+'_property_type']:'house',[side+'_characteristic_1_type']:'bedrooms',[side+'_characteristic_1']:'2-bedrooms',[side+'_characteristic_2_type']:'terrain',[side+'_characteristic_2']:'flat',[side+'_property_area']:'100-500m2'});
 const parsed=parser.parsePriceMeterComparisonRequest({params,options});ok(parsed.cohortA.geography.id===100&&parsed.cohortB.geography.id===100,'official-code controls resolve on server');
 assert.throws(()=>parser.parsePriceMeterComparisonRequest({params:{...params,a_property_area:''},options}),/Invalid comparison cohort/);checks++;
 console.log('S9 COMPARISON REMAINING FAILURE/PARSER CHECKS',checks);
}
