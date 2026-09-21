// Offline PRE-14-3A: real analytical modules, fake acquisition only.
// PRE14_3_BASELINE optionally supplies the exact pre-edit source snapshot.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),baseline=process.env.PRE14_3_BASELINE;
const ts=require(root+'/node_modules/typescript');
let checks=0,equivalence=0;
const ok=(v,label)=>{assert.ok(v,label);checks++};
const json=v=>JSON.parse(JSON.stringify(v));
const equal=(a,b,label)=>{assert.deepEqual(json(a),json(b),label);checks++};
const throws=(fn,label)=>{assert.throws(fn,undefined,label);checks++};
function withoutParticipation(v){if(Array.isArray(v))return v.map(withoutParticipation);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).filter(([k])=>k!=='participation').map(([k,x])=>[k,withoutParticipation(x)]));return v;}
// Reuse only the established offline loader/capture utilities; do not execute
// the confidence suite here. That suite runs separately as required regression.
const helpers={exports:{}};
const utilitySource=fs.readFileSync(root+'/scripts/verification/pre14-ppm2-confidence-retirement.cjs','utf8').split('async function collect(old)')[0];
vm.runInNewContext(utilitySource+'\nmodule.exports={loader,fixture};',{module:helpers,require,console,URLSearchParams,__dirname:root+'/scripts/verification',process:{env:{PRE14_2_BASELINE:baseline}}});
const {loader,fixture}=helpers.exports,load=loader(),oldLoad=baseline?loader(true):null;
const math=load('lib/price-meter-property-position-math');
function compare(a,b,label,participation=false){equal(participation?withoutParticipation(a):a,b,label);equivalence++;}
function modules(l){return {
 identity:l('lib/price-meter-identity'),observations:l('lib/price-meter-observation-builder'),
 subject:l('lib/price-meter-property-position-identity').resolvePriceMeterPropertyPositionIdentity,
 population:l('lib/price-meter-property-position-population').buildPriceMeterPropertyPositionPopulation,
 percentile:l('lib/price-meter-property-position-percentile').buildPriceMeterPropertyPositionPercentile,
 median:l('lib/price-meter-property-position-median').buildPriceMeterPropertyPositionMedian,
 interval:l('lib/price-meter-property-position-interval').buildPriceMeterPropertyPositionInterval,
 tail:l('lib/price-meter-property-position-tail').buildPriceMeterPropertyPositionTail,
 context:l('lib/price-meter-property-position-construction-land').buildPriceMeterPropertyPositionConstructionLandContext,
 evidence:l('lib/price-meter-property-position-evidence').buildPriceMeterPropertyPositionEvidence,
 distribution:l('lib/price-meter-distribution').buildPriceMeterDistribution,
 engine:l('lib/price-meter-comparable-engine').runPriceMeterComparableEngine,
 dto:l('lib/price-meter-comparable-dto').toPriceMeterComparableEvidenceDTO
};}
const m=modules(load),old=oldLoad?modules(oldLoad):null;
function observation(id,value,extra={}){
 const row={id,canonical_domain_version:1,transaction_type:'sale',currency:'CRC',current_price:value*200,property_type:'house',property_area:200,construction_area:100,
 canonicalGeography:{province:{id:'1',parent_id:'0',term_type:'province'},canton:{id:'2',parent_id:'1',term_type:'canton'},district:null,complete:true},...extra};
 const analyticalIdentity=m.identity.resolvePriceMeterAnalyticalIdentity(row,{analyticalDate:'2026-09-20',fxIdentity:null});
 return m.observations.buildPriceMeterObservations([{...row,analyticalIdentity}]).find(o=>o.normalizationBasis==='land');
}
const characteristic=(id,type)=>({ontologyTermId:id,termType:type,slug:type,termName:type,termNameEn:type,termNameEs:type,slugEn:type,slugEs:type});
const characteristics=[characteristic(1,'property_type'),...['bedrooms','bathrooms','parking','year_built','environment','terrain','utility','accessibility','legal_status'].map((type,i)=>characteristic(i+2,type))];
const allIds=characteristics.map(c=>c.ontologyTermId);
function comparableInput(x,values,dimensions=[]){
 const subject=observation('subject',x),peers=values.map((v,i)=>observation('peer-'+i,v));
 return {request:{subjectListingId:'subject',geographyLevel:'canton',normalizationBasis:'land',activeDimensions:dimensions},subjectObservation:subject,subjectCharacteristics:characteristics,subjectYearBuiltRange:null,boundedObservations:[subject,...peers],memberships:[subject,...peers].map(o=>({listingId:o.listingId,ontologyTermIds:allIds}))};
}
function position(mod,subjectObservation,observations,participation){
 const subject=mod.subject(subjectObservation),population=mod.population({subject,observations,participation});
 const distribution=mod.distribution({transactionType:'sale',observations:population.observations});
 const percentile=mod.percentile({population}),medianPosition=mod.median({population,distribution});
 const interval=mod.interval({population,distribution}),tail=mod.tail({population,distribution,percentile,interval});
 const constructionToLandContext=mod.context({subject});
 const evidence=mod.evidence({population,distribution,percentile,medianPosition,interval,tail,constructionToLandContext});
 return {subject,population,distribution,percentile,medianPosition,interval,tail,constructionToLandContext,evidence};
}
(async()=>{
 const cases=[[200,[100,200,200,300]],[100,[200,300]],[400,[100,200]],[200,[200,200]],[200,[100]],[200,[200]],[200,[300]],[200,[100,300]],[200,[100,200,300]]];
 for(const [x,values] of cases){
  const counts=math.calculatePropertyPositionCounts(x,values,values.length),B=values.filter(v=>v<x).length,E=values.filter(v=>v===x).length,A=values.filter(v=>v>x).length;
  equal(counts,{belowCount:B,equalCount:E,aboveCount:A,percentilePosition:100*(B+0.5*E)/values.length},'neutral exact midrank');
  const input=comparableInput(x,values),result=m.engine(input),dto=m.dto(result);
  const external=position(m,input.subjectObservation,input.boundedObservations.slice(1),'SUBJECT_EXTERNAL');
  equal(dto.percentile,{position:counts.percentilePosition,method:'midrank',belowCount:B,equalCount:E,aboveCount:A},'Phase12A shared midrank');
  ok(external.percentile.percentilePosition===counts.percentilePosition,'external Phase12 shares same counts');
  equal(external.evidence.distribution,result.evidence.distribution,'same reference values same distribution');
  equal(external.evidence.medianPosition,result.evidence.medianPosition,'same median arithmetic');
  equal(external.evidence.distributionInterval,result.evidence.distributionInterval,'same interval');
  equal(external.evidence.tail,result.evidence.tail,'same tail');
  ok(result.population.sampleSize===values.length&&!result.population.matchingListingIds.includes('subject'),'Phase12A subject exclusion');
  const included=position(m,input.subjectObservation,input.boundedObservations,'SUBJECT_INCLUDED');
  ok(included.population.comparisonPopulationCount===values.length+1&&included.percentile.equalCount===E+1,'included subject counts once');
  ok(included.evidence.participation==='SUBJECT_INCLUDED'&&external.evidence.participation==='SUBJECT_EXTERNAL','evidence preserves declared participation');
  if(old){compare(result,old.engine(input),'Phase12A complete before/after');compare(dto,old.dto(old.engine(input)),'Phase12A DTO before/after');compare(included,position(old,input.subjectObservation,input.boundedObservations,'SUBJECT_INCLUDED'),'Phase12 included before/after',true);}
 }
 const input=comparableInput(200,[200]),subject=m.subject(input.subjectObservation),peer=input.boundedObservations[1];
 throws(()=>m.population({subject,observations:[peer]}),'missing explicit policy');
 throws(()=>m.population({subject,observations:[peer],participation:'INFER'}),'unknown policy');
 throws(()=>m.population({subject,observations:[peer],participation:'SUBJECT_INCLUDED'}),'equal-price peer is not included subject');
 throws(()=>m.population({subject,observations:input.boundedObservations,participation:'SUBJECT_EXTERNAL'}),'external rejects actual subject');
 throws(()=>m.population({subject,observations:[input.subjectObservation,input.subjectObservation],participation:'SUBJECT_INCLUDED'}),'duplicate subject');
 throws(()=>m.population({subject,observations:[peer,peer],participation:'SUBJECT_EXTERNAL'}),'duplicate reference identity');
 throws(()=>m.population({subject,observations:[{...input.subjectObservation,pricePerM2:201}],participation:'SUBJECT_INCLUDED'}),'subject observation mismatch');
 const external=m.population({subject,observations:[peer],participation:'SUBJECT_EXTERNAL'});
 throws(()=>m.percentile({population:{...external,participation:'SUBJECT_INCLUDED'}}),'forged participation does not use equality as identity');
 equal(external.observations,[peer],'external never inserts subject');
 const empty=m.population({subject,observations:[],participation:'SUBJECT_EXTERNAL'});
 ok(empty.comparisonPopulationCount===0,'empty internal external population retains zero');
 throws(()=>m.percentile({population:empty}),'empty population cannot have percentile');
 for(const values of [[],[0],[-1],[NaN],[Infinity]])throws(()=>math.calculatePropertyPositionCounts(100,values,values.length),'invalid references');
 throws(()=>math.calculatePropertyPositionCounts(100,[100],2),'mismatched n');
 throws(()=>math.calculatePropertyPositionCounts(0,[100],1),'invalid subject');
 for(const median of [0,null,-1,NaN,Infinity])throws(()=>math.calculatePropertyPositionDifference(100,median),'invalid median denominator');
 for(const [x,median] of [[50,100],[100,100],[150,100]])equal(math.calculatePropertyPositionDifference(x,median),{difference:x-median,percentDifference:(x-median)/median*100},'signed/reference median');
 const q={p10:10,p25:25,median:50,p75:75,p90:90};
 for(const [x,expected] of [[5,'below_p10'],[10,'p10_to_p25'],[15,'p10_to_p25'],[25,'p25_to_median'],[30,'p25_to_median'],[50,'at_median'],[60,'median_to_p75'],[75,'median_to_p75'],[80,'p75_to_p90'],[90,'p75_to_p90'],[95,'above_p90']]){
  const interval=math.classifyPropertyPositionInterval(x,q);ok(interval===expected,'exact interval '+x);
  const tail=math.calculatePropertyPositionTail(x,q,interval);
  if(x>=10&&x<=90)ok(tail===null,'strict tail boundary '+x);
  else {const threshold=x<10?10:90;ok(tail.thresholdPricePerM2===threshold&&tail.differenceFromThreshold===x-threshold&&tail.percentDifferenceFromThreshold===(x-threshold)/threshold*100,'signed threshold difference');}
 }
 for(const x of [49,50,51])ok(math.classifyPropertyPositionInterval(x,{p10:50,p25:50,median:50,p75:50,p90:50})===(x<50?'below_p10':x===50?'at_median':'above_p90'),'coincident quantiles');
 throws(()=>math.classifyPropertyPositionInterval(10,{...q,p25:5}),'unordered thresholds');
 throws(()=>math.classifyPropertyPositionInterval(10,{...q,p10:null}),'null thresholds');
 throws(()=>math.calculatePropertyPositionTail(10,q,'below_p10'),'equality cannot claim lower tail');
 throws(()=>math.calculatePropertyPositionTail(90,q,'above_p90'),'equality cannot claim upper tail');
 const emptyInput=comparableInput(200,[]),calls={};
 for(const name of ['calculatePropertyPositionCounts','calculatePropertyPositionDifference','classifyPropertyPositionInterval','calculatePropertyPositionTail']){const original=math[name];math[name]=(...args)=>{calls[name]=(calls[name]||0)+1;return original(...args)};}
 const zero=m.engine(emptyInput),zeroDto=m.dto(zero);
 ok(zero.evidence===null&&zeroDto.status==='no_peers'&&zeroDto.comparisonPopulationCount===0,'no peers contract');
 equal(calls,{},'zero peers bypass shared math');
 for(const key of ['distribution','percentile','medianPosition','distributionInterval','tail'])ok(!(key in zeroDto),'no fabricated zero-peer '+key);
 if(old){compare(zero,old.engine(emptyInput),'zero-peer engine baseline');compare(zeroDto,old.dto(old.engine(emptyInput)),'zero-peer DTO baseline');}
 m.engine(comparableInput(50,[100,200]));position(m,observation('subject',50),[observation('peer',100)],'SUBJECT_EXTERNAL');
 for(const name of Object.keys(math).filter(n=>typeof math[n]==='function'))ok((calls[name]||0)>=2,'both adapters delegate '+name);
 const dimensions=['bedrooms','bathrooms','parking','year_built','construction_land','environment','terrain','utility','accessibility','legal_status'];
 equal(load('lib/price-meter-comparable-dimensions').PRICE_METER_COMPARABLE_DIMENSION_ORDER,dimensions,'optional dimensions unchanged');
 for(const dimension of dimensions){const request=comparableInput(200,[100,200,300],[dimension]);const result=m.engine(request);ok(result.population.sampleSize===3&&result.population.populationTrail.steps.length===1,'optional dimension execution '+dimension);if(old)compare(result,old.engine(request),'optional dimension baseline '+dimension);}
 const ratio=comparableInput(200,[100,200]);ratio.boundedObservations[2]=observation('peer-1',200,{property_area:250});
 const without=m.engine(ratio),withRatio=m.engine({...ratio,request:{...ratio.request,activeDimensions:['construction_land']}});
 ok(withRatio.population.sampleSize<without.population.sampleSize,'C:L dimension independently filters peers');
 equal(withRatio.evidence.constructionToLandContext,without.evidence.constructionToLandContext,'subject context unchanged by C:L selection');
 if(old)compare(withRatio,old.engine({...ratio,request:{...ratio.request,activeDimensions:['construction_land']}}),'C:L cohort baseline');
 for(const boundary of ['type','property','construction']){
  const test=comparableInput(200,[100]);
  if(boundary==='type')test.memberships[1].ontologyTermIds=allIds.filter(id=>id!==1);
  if(boundary==='property')test.boundedObservations[1]=observation('peer-0',100,{property_area:9999});
  if(boundary==='construction')test.boundedObservations[1]=observation('peer-0',100,{construction_area:9999});
  const result=m.engine(test);ok(result.population.sampleSize===0,'compulsory '+boundary+' base cannot be disabled by empty optional selection');
  if(old)compare(result,old.engine(test),'compulsory '+boundary+' baseline');
 }
 for(const dim of ['property_type','property_area','construction_area'])throws(()=>m.engine(comparableInput(200,[100],[dim])),'base constraint not an optional request toggle');
 const multi=comparableInput(200,[100],['utility']);multi.subjectCharacteristics.push(characteristic(99,'utility'));
 throws(()=>m.engine(multi),'no invented multivalue rule');
 // Fresh real acquisition fixture: snapshot comparison preserves all identity,
 // geography, base constraints, final IDs/trail and evidence, not just medians.
 async function capture(oldMode){const results=[];await fixture('s9-phase12a-integration.cjs',oldMode,[["console.log('BASE_COUNTS'","for(const a of [unconstrained,category,combined])capture({analysis:a,dto:load('lib/price-meter-comparable-dto.ts').toPriceMeterComparableEvidenceDTO(a)}); console.log('BASE_COUNTS'"]],v=>results.push(json(v)));return results;}
 const fresh=await capture(false);ok(fresh.length===3,'fresh loader integration cases');
 if(old){const before=await capture(true);fresh.forEach((v,i)=>compare(v,before[i],'fresh acquisition full baseline '+i));}
 ok(!/"confidence"\s*:/.test(JSON.stringify(fresh)),'confidence absent');
 // Read-only graph verification also covers unguarded analytical modules.
 const graph=fs.readFileSync(root+'/scripts/verification/canonical-reader-import-graph.cjs','utf8');let reached;
 vm.runInNewContext(graph+'\nreport([...visited]);',{require,console:{log(){}},process:{env:{S6_REPO_ROOT:root},exitCode:0},__dirname:root+'/scripts/verification',report:v=>{reached=v}});
 // Standalone Phase12 now has an approved labels/formatting-only client module.
 const browserPresentation=path.join(root,'lib/price-meter-property-position-presentation.ts');
 ok(!reached.some(p=>/price-meter-(property-position|comparable)/.test(p)&&p!==browserPresentation),'no client runtime reaches either analytical path; only explicit presentation module allowed');
 ok(fs.readFileSync(root+'/lib/price-meter-property-position-math.ts','utf8').startsWith("import 'server-only'"),'shared math explicitly server-only');
 const protectedFiles=['price-meter-comparable-loader','price-meter-comparable-base-cohort','price-meter-comparable-population','price-meter-comparable-population-trail','price-meter-comparable-dimensions','price-meter-comparable-request','price-meter-comparable-subject-identity','price-meter-comparable-geography','price-meter-comparable-engine','price-meter-comparable-dto','price-meter-comparable-browser-contract','price-meter-property-position-construction-land'];
 if(baseline)for(const f of protectedFiles)ok(fs.readFileSync(root+'/lib/'+f+'.ts','utf8')===fs.readFileSync(baseline+'/lib/'+f+'.ts','utf8'),'protected source unchanged '+f);
 console.log(JSON.stringify({status:'PASS',checks,beforeAfterComparisons:equivalence,baseline:baseline||'not supplied',liveIO:false}));
})().catch(e=>{console.error(e);process.exitCode=1});
