const fs=require('fs');
let source=fs.readFileSync(__dirname+'/s9-phase12a-integration.cjs','utf8').split('(async()=>{')[0];
source=source.replace('const loader=load',`let constructed=[],distributions=0,sorts=0,executions=0;
const builder=load('lib/price-meter-observation-builder.ts'),build=builder.buildPriceMeterObservations;builder.buildPriceMeterObservations=(...args)=>{const r=build(...args);constructed.push(...r);return r};
const dist=load('lib/price-meter-distribution.ts'),buildDist=dist.buildPriceMeterDistribution;dist.buildPriceMeterDistribution=(...args)=>{distributions++;return buildDist(...args)};
const actualEngine=load('lib/price-meter-comparable-engine.ts'),run=actualEngine.runPriceMeterComparableEngine;actualEngine.runPriceMeterComparableEngine=(...args)=>{executions++;return run(...args)};
const loader=load`)
.replace("ts.transpileModule(fs.readFileSync(file,'utf8')+", "ts.transpileModule((file.endsWith('/numerical-distribution.ts')?fs.readFileSync(file,'utf8').replace('.sort(', '[trackSort()]('):fs.readFileSync(file,'utf8'))+")
.replace('module:m,exports:m.exports,require(k)', 'trackSort:()=>{sorts++;return "sort"},module:m,exports:m.exports,require(k)');
source=source.replace("{dimension:'property_type',ontology_term_id:'1',term_type:'property_type',level:1,slug:'house',term_name:'House'}", "(()=>{const t=assignments.find(a=>a.listing_id===id&&a.ontology_terms.term_type==='property_type').ontology_terms;return {dimension:'property_type',ontology_term_id:String(t.id),term_type:'property_type',level:1,slug:t.slug,term_name:t.term_name}})()");
const body=String.raw`
(async()=>{
 let authenticated=true,entitled=true,authCalls=0;
 mocks['@/lib/supabase-server']={async createServerSupabaseClient(){return{auth:{async getUser(){authCalls++;return{data:{user:authenticated?{id:uuid(999)}:null},error:null}}},async rpc(name,args){ok(name==='current_user_has_entitlement'&&args.requested_entitlement_slug==='price-m2-intelligence','canonical entitlement');return{data:entitled,error:null}}}}};
 const action=load('lib/comparables-hub-action.ts'),contract=load('lib/comparables-hub-contract.ts'),fixtures=[],resources=[];
 for(const t of terms){if(t.term_name==='House')t.term_name_es='Casa';if(t.term_name==='Three')t.term_name_es='Tres';if(t.term_name==='Recorded category')t.term_name_es='Categoría registrada'}
 rows[0].title='Fixture property / Propiedad de prueba';
 assert.deepEqual(JSON.parse(JSON.stringify(contract.comparableDimensions)),JSON.parse(JSON.stringify(load('lib/price-meter-comparable-dimensions.ts').PRICE_METER_COMPARABLE_DIMENSION_ORDER)));checks++;
 const plain=v=>JSON.parse(JSON.stringify(v)),baseRows=plain(rows),baseAssignments=plain(assignments);
 const clear=()=>{calls=[];rpcIds=[];fxCalls=0;constructed=[];distributions=0;sorts=0;executions=0};
 const reset=()=>{rows.splice(0,rows.length,...plain(baseRows));assignments.splice(0,assignments.length,...plain(baseAssignments));authenticated=true;entitled=true;mode='normal';clear()};
 for(const transaction of ['sale','rent'])for(const normalizationBasis of ['land','construction'])for(const dims of [[],['year_built'],['bedrooms','year_built'],['construction_land']]){
 reset();rows[0].transaction_type=transaction;rows[0].monthly_price=750;const q={...request,normalizationBasis,activeDimensions:dims};const r=await action.executeComparablesHub(q);
 ok('evidence'in r,'real action success');ok(r.evidence.subjectExcluded&&r.evidence.comparisonPopulationCount===(transaction==='rent'?(dims.includes('year_built')?1:1):dims.includes('year_built')?13:27),'correct peers');
 ok(constructed.every(o=>o.normalizationBasis===normalizationBasis),'zero sibling construction');ok(executions===1&&distributions===1&&sorts===1,'one engine / distribution / sort');
 const wire=JSON.stringify(r);ok(!wire.includes('matchingListingIds')&&!wire.includes('observations')&&!wire.includes(uuid(2))&&!wire.includes('ontologyTermId'),'aggregate-only projection');
 fixtures.push({scenario:'populated',request:q,response:plain(r)});
 }
 for(const scenario of ['empty','single','equal','tiny-sale','lower','upper','usd-subject','usd-peer','inactive','missing-area','range-area','missing-construction','invalid-currency','unavailable-dimension','ambiguous-dimension','missing-geography']){
 reset();let q={...request};
 if(scenario==='empty')rows.splice(1);if(scenario==='single')rows.splice(2);
 if(['empty','single'].includes(scenario))for(let i=assignments.length-1;i>=0;i--)if(!rowFor(assignments[i].listing_id))assignments.splice(i,1);
 if(scenario==='equal')rows.forEach(r=>r.current_price=100000);
 if(scenario==='tiny-sale'||scenario==='lower')rows[0].current_price=.5;if(scenario==='upper')rows[0].current_price=1e9;
 if(scenario==='usd-subject')rows[0].currency='USD';if(scenario==='usd-peer')rows[1].currency='USD';
 if(scenario==='inactive')rows[0].listing_status='draft';if(scenario==='missing-area')rows[0].property_area=null;if(scenario==='range-area')rows[0].property_area='[100,200]';if(scenario==='missing-construction')rows[0].construction_area=null;
 if(scenario==='invalid-currency')rows[0].currency='EUR';if(scenario==='unavailable-dimension')q.activeDimensions=['bathrooms'];
 if(scenario==='ambiguous-dimension'){const t={...terms.find(t=>t.term_type==='bedrooms'),id:99};assignments.push({listing_id:uuid(1),ontology_term_id:'99',ontology_terms:t});q.activeDimensions=['bedrooms']}
 if(scenario==='missing-geography')q.geographyLevel='district';
 const r=await action.executeComparablesHub(q);
 if(['inactive','missing-area','range-area','missing-construction','invalid-currency','unavailable-dimension','ambiguous-dimension','missing-geography'].includes(scenario)){ok('error'in r&&distributions===0,'nonestablishment '+scenario)}
 else{ok('evidence'in r,'valid '+scenario);if(scenario==='empty'){ok(r.evidence.status==='no_peers'&&distributions===0&&sorts===0,'empty no statistics');ok(!('distribution'in r.evidence),'no manufactured zero')}
 else{ok(r.evidence.status==='ok'&&distributions===1&&sorts===1,'nonempty statistics');if(scenario==='single')ok(r.evidence.comparisonPopulationCount===1,'single evidence allowed');if(scenario==='equal')ok(r.evidence.percentile.position===50&&r.evidence.medianPosition.difference===0,'tie neutral');if(scenario==='lower')ok(r.evidence.tail.tail==='below_p10','lower tail');if(scenario==='upper')ok(r.evidence.tail.tail==='above_p90','upper tail');if(scenario.startsWith('usd'))ok(fxCalls===1&&r.fx.rate===500,'one FX identity')}
 }
 fixtures.push({scenario,request:q,response:plain(r)});
 }
 for(const normalizationBasis of ['land','construction']){
 reset();for(const row of rows)row.construction_area=null;for(const a of assignments)if(a.ontology_terms.term_type==='property_type'){a.ontology_term_id='4';a.ontology_terms=terms.find(t=>t.id===4)}
 const q={...request,normalizationBasis},r=await action.executeComparablesHub(q);
 if(normalizationBasis==='construction')ok('error'in r&&executions===0&&distributions===0,'vacant land construction unavailable');else {ok(r.evidence?.propertyBasis==='land_only'&&r.evidence.status==='ok','vacant land land-normalized');ok(constructed.every(o=>o.normalizationBasis==='land'),'vacant land no sibling');fixtures.push({scenario:'vacant-land',request:q,response:plain(r)})}
 }
 for(const access of ['anonymous','denied','truthy']){reset();authenticated=access!=='anonymous';entitled=access==='truthy'?'true':false;const r=await action.executeComparablesHub(request);ok('access'in r&&calls.length===0&&fxCalls===0&&constructed.length===0&&executions===0,'access denied before work '+access)}
 for(const extra of [{subjectListingId:'invalid'},{normalizationBasis:'both'},{geographyLevel:'country'},{activeDimensions:['bedrooms','bedrooms']},{activeDimensions:['unknown']},{subjectPrice:123},{fx:500},{membership:[]},{propertyBasis:'land_only'}]){reset();const r=await action.executeComparablesHub({...request,...extra});ok(r.error==='invalid_request'&&calls.length===0&&executions===0,'strict intent')}
 for(const failure of ['query-error','listing-error','missing-count','changed-count','truncated','hydrate-error']){reset();mode=failure;const r=await action.executeComparablesHub(request);ok(r.error==='execution_unavailable'&&distributions===0,'sanitized transport failure '+failure)}
 // Every current optional ontology dimension is a positive, exact subject membership intersection.
 for(const dimension of contract.comparableDimensions.filter(d=>d!=='construction_land')){
 reset();const t={id:101,term_type:dimension,term_name:'Selected',term_name_en:'Selected',term_name_es:'Seleccionada',slug:'selected'};
 for(let i=assignments.length-1;i>=0;i--)if(assignments[i].ontology_terms.term_type===dimension)assignments.splice(i,1);
 for(const id of [uuid(1),uuid(2)])assignments.push({listing_id:id,ontology_term_id:'101',ontology_terms:t});
 const r=await action.executeComparablesHub({...request,activeDimensions:[dimension]});ok(r.evidence?.comparisonPopulationCount===1,'only positive membership '+dimension);ok(r.evidence.populationTrail.steps[0].afterCount===1,'trail '+dimension);
 }
 for(const n of [1,25,26,100,501]){
 reset();rows.splice(0,rows.length,...Array.from({length:n+1},(_,i)=>listing(i+1)));assignments.splice(0,assignments.length,...rows.flatMap(l=>[province.id,canton.id,1,3].map(id=>({listing_id:l.id,ontology_term_id:String(id),ontology_terms:terms.find(t=>String(t.id)===String(id))}))));
 const started=performance.now();const r=await action.executeComparablesHub(request);ok(r.evidence?.comparisonPopulationCount===n,'complete scale '+n);ok(constructed.length===n+1&&executions===1&&distributions===1&&sorts===1,'linear observations one statistic set');
 const bytes=Buffer.byteLength(JSON.stringify(r));ok(bytes<4000,'aggregate bytes bounded');ok(new Set(rpcIds).size===rpcIds.length&&calls.filter(c=>c.single).length===1,'hydrated once and subject once');
 resources.push({n,observations:constructed.length,siblings:constructed.filter(o=>o.normalizationBasis!=='land').length,distributions,sorts,postgrestPages:calls.length,hydrated:rpcIds.length,projectionBytes:bytes,offlineMs:performance.now()-started});
 }
 if(process.env.ENGINE15_FIXTURE_PATH)fs.writeFileSync(process.env.ENGINE15_FIXTURE_PATH,JSON.stringify({fixtures,resources}));
 console.log(JSON.stringify({status:'PASS',checks,resources,liveIO:false}));
})().catch(e=>{console.error(e);process.exitCode=1});`;
new Function('require','__dirname',source+body)(require,__dirname);
