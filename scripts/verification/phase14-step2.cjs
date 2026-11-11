// Reuse the established offline Step 1 harness only; do not execute its test suite here.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
const scenarios=String.raw`
allowed.add('lib/phase14-geographic-population.ts');
const population=load('lib/phase14-geographic-population.ts');
const originalFrom=db.from.bind(db);let populationCalls=[],members=[],cap=500,fault='ok';
const listingId=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function fixture(n){members=Array.from({length:n},(_,i)=>({listing_id:listingId(i+1),ontology_term_id:'103'}));cap=500;fault='ok';populationCalls=[]}
db.from=function(table){
 if(table==='ontology_terms')return originalFrom(table);
 assert.equal(table,'listings_ontology_terms','no later-stage listing/hydration access');
 let selected=null,predicate=null,orders=[],from,to;
 const q={select(columns,options){assert.equal(columns,'listing_id,ontology_term_id::text');assert.deepEqual(options,{count:'exact'});selected=columns;return q},
 eq(key,value){assert.equal(key,'ontology_term_id','no status/version/transaction/type predicate');assert.equal(predicate,null,'one geography only');predicate=value;return q},
 order(key){orders.push(key);return q},range(a,b){from=a;to=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 assert.equal(typeof predicate,'string');assert.deepEqual(orders,['listing_id','ontology_term_id']);assert.equal(to-from,499);assert.ok(from>=0);assert.ok(selected);
 populationCalls.push({table,predicate,orders,from,to});
 if(fault==='throw' || (fault==='late-throw'&&from>0))throw Error('fake database error');
 let all=members.filter(r=>r.ontology_term_id===predicate).sort((a,b)=>a.listing_id<b.listing_id?-1:a.listing_id>b.listing_id?1:0);
 let data=all.slice(from,Math.min(to+1,from+cap)).map(copy),count=all.length;
 if(fault==='count-drift'&&from>0)count++;
 if(fault==='count-null')count=null;if(fault==='count-negative')count=-1;if(fault==='count-fraction')count=1.5;if(fault==='count-unsafe')count=Number.MAX_SAFE_INTEGER+1;
 if(fault==='premature'&&from>0)data=[];
 if(fault==='wrong-term'&&data.length)data[0].ontology_term_id='102';
 if(fault==='numeric-term'&&data.length)data[0].ontology_term_id=103;
 if(fault==='malformed'&&data.length)data[0].listing_id='broken';
 if(fault==='numeric-id'&&data.length)data[0].listing_id=123;
 if(fault==='null-row')data=[null];
 if(fault==='duplicate'&&data.length>1)data[1]=copy(data[0]);
 if(fault==='cross-duplicate'&&from>0)data[0]=copy(all[0]);
 if(fault==='unordered'&&data.length>1)data.reverse();
 if(fault==='lower-page'&&from>0)data[0].listing_id=listingId(0);
 if(fault==='missing-last')data=data.filter(r=>r.listing_id!==all.at(-1).listing_id);
 if(fault==='oversized')data=all.slice(0,501);
 if(fault==='null-data')data=null;
 if(fault==='over-count')count=0;
 if(fault==='same-count-swap'&&from>0){data[data.length-1]={listing_id:listingId(9999),ontology_term_id:predicate}}
 return {data,count,error:fault==='error'?{message:'fake error'}:null};
 }).then(resolve,reject)}};return q;
};
async function run(){
 const envelope=await commit();ok(populationCalls.length===0,'Step 1 no population reads');
 const counts=[];
 for(const n of [0,1,25,499,500,501,1000,1001,3217]){
 fixture(n);const r=await population.acquirePhase14GeographicPopulation(envelope);
 ok(r.state==='complete','complete '+n);ok(r.expectedMembershipCount===n&&r.acquiredUniqueListingCount===n&&r.listingIds.length===n,'counts '+n);
 assert.deepEqual(r.listingIds,Array.from({length:n},(_,i)=>listingId(i+1)));checks++;
 ok(populationCalls.length===Math.max(1,Math.ceil(n/500)),'termination '+n);
 ok(populationCalls.every((q,i)=>q.predicate==='103'&&q.from===i*500),'only selected direct population '+n);
 population.assertPhase14GeographicPopulationForExecution(r,envelope);checks++;
 counts.push({n,pages:populationCalls.length});
 }
 fixture(11);cap=3;const capped=await population.acquirePhase14GeographicPopulation(envelope);ok(capped.state==='complete'&&capped.listingIds.length===11,'short capped pages are not EOF');assert.deepEqual(populationCalls.map(x=>x.from),[0,3,6,9]);checks++;
 // Explicit memberships: A district-known, B Canton-only, C sibling district,
 // D other Canton, E other Province. Eligibility metadata is deliberately unavailable.
 const tuples=[[1,['101','102','103']],[2,['101','102']],[3,['101','102','104']],[4,['101','999']],[5,['888','889','890']]];
 const expectations={district:[1],canton:[1,2,3],province:[1,2,3,4]};
 for(const [level,code,term]of[['district','10101','103'],['canton','101','102'],['province','1','101']]){
 fixture(0);members=tuples.flatMap(([n,terms])=>terms.map(ontology_term_id=>({listing_id:listingId(n),ontology_term_id})));
 const input=base();input.question.geography={level,officialCode:code};input.question.filters={semantics:{environment:['3']},facts:{bedrooms:[{kind:'exact',value:'3'}]},propertyArea:'100-500m2'};
 const e=await commit(input),refs=calls.length;populationCalls=[];
 const r=await population.acquirePhase14GeographicPopulation(e);ok(r.state==='complete','geographic fixture '+level);assert.deepEqual(r.listingIds,expectations[level].map(listingId));checks++;
 ok(populationCalls.every(q=>q.predicate===term),'no parent/national/descendant query '+level);ok(calls.length===refs,'no reference/dictionary reread '+level);
 // Same membership population regardless of question's downstream filtering intent.
 input.question.transaction='rent';input.question.propertyType.termId='9007199254740994';delete input.question.filters;
 const other=await commit(input),r2=await population.acquirePhase14GeographicPopulation(other);assert.deepEqual(r.listingIds,r2.listingIds);checks++;
 assert.throws(()=>population.assertPhase14GeographicPopulationForExecution(r,other));checks++;
 }
 for(const f of ['count-drift','count-null','count-negative','count-fraction','count-unsafe','premature','wrong-term','numeric-term','malformed','numeric-id','null-row','duplicate','cross-duplicate','unordered','lower-page','missing-last','oversized','null-data','over-count']){
 fixture(501);fault=f;const r=await population.acquirePhase14GeographicPopulation(envelope);ok(r.state==='incomplete','incomplete '+f);ok(!('listingIds'in r),'never expose prefix '+f);
 }
 for(const f of ['throw','late-throw','error']){fixture(501);fault=f;const r=await population.acquirePhase14GeographicPopulation(envelope);ok(r.state==='execution_failed','execution failure '+f);ok(!('listingIds'in r),'no failure prefix '+f)}
 fixture(1);for(const forged of [null,undefined,'103',base(),copy(envelope),{...envelope,authenticatedUserId:'forged'},{...envelope,question:{...envelope.question,geography:{level:'district',termId:'104',officialCode:'10102'}}}]){const before=populationCalls.length;const r=await population.acquirePhase14GeographicPopulation(forged);ok(r.state==='invalid_execution','untrusted envelope');ok(populationCalls.length===before,'zero unauthorized reads')}
 for(const denial of ['anonymous','unentitled']){auth=denial!=='anonymous';entitled=false;const before=populationCalls.length;await assert.rejects(()=>commit());checks++;ok(populationCalls.length===before,'denied Step1 cannot acquire population')}auth=entitled=true;
 fixture(2);const complete=await population.acquirePhase14GeographicPopulation(envelope);ok(Object.isFrozen(complete)&&Object.isFrozen(complete.geography)&&Object.isFrozen(complete.listingIds)&&Object.isFrozen(complete.completeness),'deep immutable result');assert.throws(()=>complete.listingIds.push(listingId(7)));checks++;
 for(const key of ['geography','expectedMembershipCount','listingIds','completeness']){ok(!Reflect.set(complete,key,null),'cannot replace '+key)}
 assert.throws(()=>population.assertPhase14GeographicPopulationForExecution(copy(complete),envelope));checks++;
 const second=await commit();assert.throws(()=>population.assertPhase14GeographicPopulationForExecution(complete,second));checks++;
 user='user-B';const third=await commit();assert.throws(()=>population.assertPhase14GeographicPopulationForExecution(complete,third));checks++;
 // Accepted page contract is not a transactional snapshot: record, don't conceal, limitation.
 fixture(501);fault='same-count-swap';const drift=await population.acquirePhase14GeographicPopulation(envelope);ok(drift.state==='complete'&&drift.completeness.snapshotGuaranteed===false,'same-count substitution is outside snapshot guarantee');
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8');const fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract ='));const graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;', {fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-geographic-population.ts','lib/phase14-question.ts','lib/phase14-question-commit.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,pagination:counts,cappedOffsets:[0,3,6,9],completenessFaultCases:19,queryFailureCases:3,geographyCases:3,clientRoots:graph.roots,runtimeModules:graph.modules,protectedViolations:0,liveIO:false,step3Predicates:0,hydrationReads:0,snapshotGuaranteed:false},null,2));
}
return run();
`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
