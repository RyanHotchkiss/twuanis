// Real Position action, authorization, canonical loader and mathematics; fake DB/FX only.
const fs=require('fs'),path=require('path');
let source=fs.readFileSync(path.join(__dirname,'pre14-phase12-production-integration.cjs'),'utf8').split('(async()=>{')[0];
source=source.replace('const server=load',`let observed={land:0,construction:0},distributions=0,sorts=0;
const builder=load('lib/price-meter-observation-builder.ts'),originalBuild=builder.buildPriceMeterObservations;
builder.buildPriceMeterObservations=(...args)=>{const result=originalBuild(...args);for(const o of result)observed[o.normalizationBasis]++;return result};
const dist=load('lib/price-meter-distribution.ts'),originalDist=dist.buildPriceMeterDistribution;
dist.buildPriceMeterDistribution=(...args)=>{distributions++;return originalDist(...args)};
const server=load`);
source=source.replace("ts.transpileModule(fs.readFileSync(file,'utf8'),", "ts.transpileModule(key==='lib/numerical-distribution.ts'?fs.readFileSync(file,'utf8').replace('.sort(', '[trackSort()]('):fs.readFileSync(file,'utf8'),").replace('module:m,exports:m.exports,console,URL','trackSort:()=>{sorts++;return \"sort\"},module:m,exports:m.exports,console,URL');
const tail=String.raw`
(async()=>{
 const action=load('lib/position-hub-action.ts'),core=load('lib/price-meter-property-position-execution.ts');
 const fixtures=[],resources=[];const clear=()=>{calls=[];fxCalls=0;observed={land:0,construction:0};distributions=0;sorts=0};
 const plain=v=>JSON.parse(JSON.stringify(v));
 for(const transaction of ['sale','rent'])for(const basis of ['house','land'])for(const normalization of ['land','construction'])for(const level of ['district','canton','province']){
  reset();for(const r of rows){r.transaction_type=transaction;if(basis==='land'){types.set(r.id,'2');r.construction_area=null}}
  const q={...request,requestedNormalizationBasis:normalization,requestedGeographyLevel:level};
  const before=await execute(q),beforeCalls=plain(calls);clear();
  const after=await core.executePropertyPositionWithWorkingEvidence(q,true);
  assert.deepEqual(plain(after.result),plain(before),'full internal parity '+[transaction,basis,normalization,level]);checks++;
  ok(JSON.stringify(calls)===JSON.stringify(beforeCalls),'unchanged acquisition shape');
  if(after.result.state==='ok'){
   ok(observed[normalization]===32&&observed[normalization==='land'?'construction':'land']===0,'one subject + n selected reference, zero siblings');
   ok(distributions===1&&sorts===1,'one reference distribution and one sort');
   const response=await action.executePositionHub(q);fixtures.push({request:q,response:plain(response)});
  }else ok(after.result.state==='normalization_not_applicable','invalid vacant land construction');
 }
 for(const scenario of ['single','equal','lower','upper','fraction','usd-subject','usd-reference','no-district','legacy','inactive','no-construction','no-area','unknown-currency','unknown-type', 'zero-price','range-area']){
  reset();if(scenario==='single')rows=rows.slice(0,1);
  if(scenario==='equal')rows.forEach(r=>r.current_price=r.construction_area*100);
  if(scenario==='lower')rows[0].current_price=1;
  if(scenario==='upper')rows[0].current_price=1e9;
  if(scenario==='fraction')rows[0].current_price=.5;
  if(scenario==='usd-subject')rows[0].currency='USD';if(scenario==='usd-reference')rows[1].currency='USD';
  if(scenario==='no-district')geos.set(id(1),[province,canton]);if(scenario==='legacy')rows[0].canonical_domain_version=0;
  if(scenario==='inactive')rows[0].listing_status='inactive';if(scenario==='no-construction')rows[0].construction_area=null;
  if(scenario==='no-area')rows[0].property_area=null;if(scenario==='unknown-currency')rows[0].currency='EUR';
  if(scenario==='unknown-type')types.set(id(1),'999');if(scenario==='zero-price')rows[0].current_price=0;if(scenario==='range-area')rows[0].property_area='[100,200]';
  const before=await execute();clear();const after=await core.executePropertyPositionWithWorkingEvidence(request,true);
  assert.deepEqual(plain(after.result),plain(before),'scenario parity '+scenario);checks++;
  ok(observed.land===0,'no land sibling '+scenario);
  if(scenario.startsWith('usd'))ok(fxCalls===1,'single FX resolution');
  if(scenario==='single'||scenario==='equal')ok(after.result.evidence.percentile.position===50,'midrank fifty '+scenario);
  fixtures.push({scenario,request,response:plain(await action.executePositionHub(request))});
 }
 for(const failure of ['query-error','missing-count','changed-count','premature-empty','missing-listing','duplicate','missing-hydration','duplicate-hydration','invalid-hydration','membership-mismatch','hydrate-error','empty','missing-subject','changed-subject','subject-error','fx-error']){
  reset();mode=failure;if(failure==='fx-error')rows[0].currency='USD';const before=dto.toPositionDTO(await execute());clear();const after=await action.executePositionHub(request);
  assert.deepEqual(plain(after.result),plain(before),failure);checks++;ok(distributions===0,'failure no distribution '+failure);ok(!JSON.stringify(after).includes('private'),'sanitized failure');
 }
 for(const access of ['anonymous','denied','truthy']){reset();authorized=access!=='anonymous';entitled=access==='truthy'?'true':false;const r=await action.executePositionHub(request);ok('access'in r&&calls.length===0&&fxCalls===0,'authorization before acquisition '+access)}
 for(const extra of [{listingId:'bad'},{requestedNormalizationBasis:'both'},{requestedGeographyLevel:'country'},{participation:'SUBJECT_EXTERNAL'},{fx:500},{observations:[]},{propertyBasis:'land_only'}]){reset();const r=await action.executePositionHub({...request,...extra});ok(r.result.state==='reference_definition_invalid'&&calls.length===0,'forged intent rejected')}
 for(const n of [1,25,26,31,100,501]){
  reset();const model=rows[0];rows=Array.from({length:n},(_,i)=>({...model,id:id(i+1),current_price:10000+i*100}));geos=new Map(rows.map(r=>[r.id,[province,canton,district]]));types=new Map(rows.map(r=>[r.id,'1']));
  clear();const started=performance.now();const before=await execute();const broadObserved={...observed};const broadQueries=calls.length;clear();const start=performance.now();const r=await action.executePositionHub(request);const duration=performance.now()-start;
  ok(r.result.state==='ok'&&r.result.n===n,'complete n '+n);ok(observed.construction===n+1&&observed.land===0&&distributions===1,'linear selected construction + one distribution '+n);ok(calls.length===broadQueries,'no egress reduction claim '+n);
  const bytes=Buffer.byteLength(JSON.stringify(r));ok(bytes<3000,'bounded aggregate projection');
  ok(!JSON.stringify(r).includes('canonicalEvidence')&&!JSON.stringify(r).includes('observations'),'Crown Jewel allowlist');
  resources.push({n,broadObserved,selectedObserved:{...observed},distributions,sorts,queries:calls.length,projectionBytes:bytes,selectedMs:duration,totalProbeMs:performance.now()-started});
 }
 if(process.env.ENGINE14_FIXTURE_PATH)fs.writeFileSync(process.env.ENGINE14_FIXTURE_PATH,JSON.stringify({fixtures,resources}));
 console.log(JSON.stringify({status:'PASS',checks,resources,liveIO:false}));
})().catch(e=>{console.error(e);process.exitCode=1});`;
new Function('require','__dirname',source+tail)(require,__dirname);
