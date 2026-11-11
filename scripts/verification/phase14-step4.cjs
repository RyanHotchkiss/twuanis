// Reuse the established offline Step 1 harness only; do not execute its test suite here.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
const scenarios=String.raw`
allowed.add('lib/phase14-geographic-population.ts');allowed.add('lib/phase14-fundamental-population.ts');allowed.add('lib/phase14-membership-population.ts');
const membership=load('lib/phase14-membership-population.ts');
const fundamental=load('lib/phase14-fundamental-population.ts');
let stage3=false,trace3=[],eligibility=new Map();
const population=load('lib/phase14-geographic-population.ts');
const originalFrom=db.from.bind(db);let populationCalls=[],members=[],cap=500,fault='ok';
const listingId=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
function fixture(n){eligibility=new Map();stage3=false;trace3=[];members=Array.from({length:n},(_,i)=>({listing_id:listingId(i+1),ontology_term_id:'103'}));cap=500;fault='ok';populationCalls=[]}
db.from=function(table){
 if(table==='ontology_terms')return originalFrom(table);
 assert.equal(table,'listings_ontology_terms','no later-stage listing/hydration access');
 let selected=null,predicate=null,orders=[],from,to;const filters=[];const third=stage3;
 const q={select(columns,options){assert.equal(columns,third?'listing_id,ontology_term_id::text,listings!inner(canonical_domain_version,listing_status,transaction_type)':'listing_id,ontology_term_id::text');assert.deepEqual(options,{count:'exact'});selected=columns;return q},
 eq(key,value){if(third&&key!=='ontology_term_id'){filters.push([key,value]);return q}assert.equal(key,'ontology_term_id','no status/version/transaction/type predicate');assert.equal(predicate,null,'one geography only');predicate=value;return q},
 order(key){orders.push(key);return q},range(a,b){from=a;to=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 assert.equal(typeof predicate,'string');assert.deepEqual(orders,['listing_id','ontology_term_id']);assert.equal(to-from,499);assert.ok(from>=0);assert.ok(selected);
 if(third){assert.deepEqual(filters,[['listings.canonical_domain_version',1],['listings.listing_status','active'],['listings.transaction_type',expectedTransaction]]);trace3.push({table,predicate,from,to,selected,filters})}else populationCalls.push({table,predicate,orders,from,to});
 if(fault==='throw' || (fault==='late-throw'&&from>0))throw Error('fake database error');
 let all=members.filter(r=>r.ontology_term_id===predicate).sort((a,b)=>a.listing_id<b.listing_id?-1:a.listing_id>b.listing_id?1:0);
 if(third)all=all.map(r=>({...r,listings:eligibility.get(r.listing_id)||{canonical_domain_version:1,listing_status:'active',transaction_type:'sale'}})).filter(r=>filters.every(([key,value])=>r.listings[key.slice(9)]===value));
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
 if(fault==='outside'&&data.length)data[0].listing_id=listingId(99999);
 if(fault==='bad-status'&&data.length)data[0].listings.listing_status='draft';
 if(fault==='bad-version'&&data.length)data[0].listings.canonical_domain_version='1';
 if(fault==='bad-transaction'&&data.length)data[0].listings.transaction_type='rent';
 if(fault==='bad-relation'&&data.length)data[0].listings=[];
 return {data,count,error:fault==='error'?{message:'fake error'}:null};
 }).then(resolve,reject)}};return q;
};
let expectedTransaction='sale';
async function acquire(e,g){stage3=true;expectedTransaction=e?.question?.transaction;return fundamental.acquirePhase14FundamentalPopulation(e,g)}
async function starting(e){stage3=false;const g=await population.acquirePhase14GeographicPopulation(e);ok(g.state==='complete','authentic starting population');return g}
const upstreamFrom=db.from.bind(db);let stage4=false,assignments=[],trace4=[],fault4='ok',cap4=500;
const extraTerms=Array.from({length:60},(_,i)=>({id:String(1000+i),term_type:'environment',level:1,term_name:'extra '+i}));terms.push(...extraTerms);
for(const [id,term_type]of[['15','terrain'],['16','utility'],['17','accessibility'],['18','legal_status']])terms.push({id,term_type,level:1,term_name:'alt'});
const dimensions=['property_type','environment','terrain','utility','accessibility','legal_status'];
const selectedByDimension={property_type:['9007199254740993'],environment:['3','4'],terrain:['5','15'],utility:['6','16'],accessibility:['7','17'],legal_status:['8','18']};
const allFilters=()=>({semantics:Object.fromEntries(dimensions.slice(1).map(d=>[d,selectedByDimension[d]]))});
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++};
function assign(ids,termIds){for(const n of ids)for(const ontology_term_id of termIds)assignments.push({listing_id:listingId(n),ontology_term_id})}
const nums=n=>Array.from({length:n},(_,i)=>i+1);
db.from=function(table){
 if(!stage4)return upstreamFrom(table);
 assert.equal(table,'listings_ontology_terms','Step4 membership only');
 let selected,ids,termIds,orders=[],offset,end;
 const q={select(s,opts){assert.equal(s,'listing_id,ontology_term_id::text');assert.deepEqual(opts,{count:'exact'});selected=s;return q},
 in(k,v){if(k==='listing_id'){assert.equal(ids,undefined);ids=v}else{assert.equal(k,'ontology_term_id');assert.equal(termIds,undefined);termIds=v}return q},
 order(k){orders.push(k);return q},range(a,b){offset=a;end=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 assert.ok(ids.length>0&&ids.length<=25);assert.ok(termIds.length>0&&termIds.length<=25);
 for(const values of[ids,termIds])assert.ok(values.reduce((n,v)=>n+encodeURIComponent(JSON.stringify(v)).length+3,0)<=1500);
 assert.deepEqual(orders,['listing_id','ontology_term_id']);assert.equal(end-offset,499);assert.ok(selected);
 const types=new Set(termIds.map(id=>terms.find(t=>t.id===id)?.term_type));assert.equal(types.size,1);const dimension=[...types][0];assert.ok(dimensions.includes(dimension));
 trace4.push({dimension,ids:[...ids],termIds:[...termIds],offset,end});
 if(fault4==='throw'||fault4==='late-throw'&&offset>0)throw Error('secret database diagnostic');
 const all=assignments.filter(r=>ids.includes(r.listing_id)&&termIds.includes(r.ontology_term_id)).sort((a,b)=>a.listing_id<b.listing_id?-1:a.listing_id>b.listing_id?1:BigInt(a.ontology_term_id)<BigInt(b.ontology_term_id)?-1:BigInt(a.ontology_term_id)>BigInt(b.ontology_term_id)?1:0);
 let data=all.slice(offset,Math.min(end+1,offset+cap4)).map(copy),count=all.length;
 const corrupt=dimension==='environment';
 if(corrupt){
 if(fault4==='count-drift'&&offset>0)count--;
 if(fault4==='count-null')count=null;if(fault4==='negative')count=-1;if(fault4==='fraction')count=0.5;if(fault4==='unsafe')count=Number.MAX_SAFE_INTEGER+1;
 if(fault4==='premature'&&offset>0)data=[];
 if(fault4==='wrong-term'&&data.length)data[0].ontology_term_id='5';
 if(fault4==='unrequested-term'&&data.length)data[0].ontology_term_id='1059';
 if(fault4==='numeric-term'&&data.length)data[0].ontology_term_id=1000;
 if(fault4==='bad-id'&&data.length)data[0].listing_id='bad';
 if(fault4==='outside'&&data.length)data[0].listing_id=listingId(99999);
 if(fault4==='null-row'&&data.length)data[0]=null;
 if(fault4==='duplicate'&&data.length>1)data[1]=copy(data[0]);
 if(fault4==='cross-duplicate'&&offset>0)data[0]=copy(all[0]);
 if(fault4==='reverse')data.reverse();
 if(fault4==='missing-last')data=data.filter(r=>r.listing_id!==all.at(-1).listing_id||r.ontology_term_id!==all.at(-1).ontology_term_id);
 if(fault4==='oversized')data=all.slice(0,501);
 if(fault4==='null-data')data=null;
 if(fault4==='overcount')count=626;
 }
 return{data,count,error:fault4==='error'?{message:'secret database diagnostic'}:null};
 }).then(resolve,reject)}};return q;
};
async function prepare(n,input=base()){
 stage4=false;fixture(n);assignments=[];trace4=[];fault4='ok';cap4=500;
 const e=await commit(input),g=await starting(e),f=await acquire(e,g);ok(f.state==='complete','real Step3 foundation');
 return{e,g,f};
}
async function step4(p){stage4=true;return membership.acquirePhase14MembershipPopulation(p.e,p.f)}
function verifyResult(r,p,expected){
 ok(r.state==='complete','Step4 complete');eq(r.listingIds,expected.map(listingId),'survivors');
 ok(r.fundamentalPopulation===p.f&&r.fundamentalStartingCount===p.f.survivingListingCount,'source association');
 ok(r.survivingListingCount===expected.length&&r.excludedListingCount===p.f.survivingListingCount-expected.length,'counts');
 membership.assertPhase14MembershipPopulationForExecution(r,p.e,p.f);checks++;
 let n=p.f.survivingListingCount;for(const t of r.trail){ok(t.inputCount===n&&t.survivorCount<=n&&t.excludedCount===n-t.survivorCount,'monotone trail');n=t.survivorCount}
 ok(r.completeness.pagesRead===trace4.length,'physical query accounting');ok(r.completeness.snapshotGuaranteed===false,'snapshot not claimed');
}
async function run(){
 const countExamples=[];
 let p=await prepare(5);assign([1,5],selectedByDimension.property_type);assign([2],['9007199254740994']);assign([3,4,5],['3','5','6']);
 let before=JSON.stringify(p.f),r=await step4(p);verifyResult(r,p,[1,5]);eq(r.trail.map(t=>t.dimension),['property_type']);eq(trace4.map(t=>t.dimension),['property_type']);ok(JSON.stringify(p.f)===before,'Step3 untouched');countExamples.push({case:'core-only',logical:1,physical:trace4.length});
 for(const dim of dimensions.slice(1)){
  const input=base();input.question.filters={semantics:{[dim]:selectedByDimension[dim]}};
  p=await prepare(5,input);assign([1,2,3,4],selectedByDimension.property_type);assign([1,5],[selectedByDimension[dim][0]]);assign([2],selectedByDimension[dim]);
  // Listing 3 has only a nonselected term of the same owning dimension.
  const nonselected=String(2000+dimensions.indexOf(dim));if(!terms.some(t=>t.id===nonselected))terms.push({id:nonselected,term_type:dim,level:1,term_name:'not selected'});assign([3],[nonselected]);
  r=await step4(p);verifyResult(r,p,[1,2]);eq(trace4.map(t=>t.dimension),['property_type',dim]);eq(trace4[1].ids,[1,2,3,4].map(listingId));ok(r.trail[1].acquiredMembershipCount===3,'OR is unique listing union');countExamples.push({case:dim,logical:2,physical:trace4.length});
 }
 const input=base();input.question.filters=allFilters();p=await prepare(20,input);
 const limits=[12,8,5,3,2,1];dimensions.forEach((dim,i)=>assign(nums(limits[i]),selectedByDimension[dim]));
 r=await step4(p);verifyResult(r,p,[1]);eq([20,...r.trail.map(t=>t.survivorCount)],[20,12,8,5,3,2,1]);eq(trace4.map(t=>t.dimension),dimensions);
 trace4.forEach((q,i)=>eq(q.ids,nums(i?limits[i-1]:20).map(listingId),'only current survivors'));countExamples.push({case:'five optional dimensions',logical:6,physical:trace4.length});
 // Set-intersection oracle proves conjunction independent of evaluation order.
 const forward=dimensions.reduce((s,dim)=>s.filter(id=>assignments.some(a=>a.listing_id===id&&selectedByDimension[dim].includes(a.ontology_term_id))),p.f.listingIds);
 const reverse=[...dimensions].reverse().reduce((s,dim)=>s.filter(id=>assignments.some(a=>a.listing_id===id&&selectedByDimension[dim].includes(a.ontology_term_id))),p.f.listingIds);eq(forward,reverse);eq(r.listingIds,reverse);
 const saved=copy(assignments);const inputReverse=base();inputReverse.question.filters={semantics:Object.fromEntries(Object.entries(allFilters().semantics).reverse().map(([d,ts])=>[d,[...ts].reverse()]))};
 p=await prepare(20,inputReverse);assignments=saved;r=await step4(p);verifyResult(r,p,[1]);eq(trace4.map(t=>t.dimension),dimensions,'input order cannot control execution');
 for(let stop=0;stop<6;stop++){
  p=await prepare(3,input);dimensions.forEach((d,i)=>{if(i!==stop)assign(nums(3),selectedByDimension[d])});r=await step4(p);verifyResult(r,p,[]);
  eq(trace4.map(t=>t.dimension),dimensions.slice(0,stop+1));eq(r.trail.map(t=>t.execution),dimensions.map((_,i)=>i<=stop?'queried':'empty_input'),'unexecuted selected stages explicit');
 }
 p=await prepare(0,input);r=await step4(p);verifyResult(r,p,[]);eq(trace4.length,0,'empty source zero queries');
 // Each unselected dimension is absent from both trace and trail.
 for(const omitted of dimensions.slice(1)){
  const i=base();i.question.filters=allFilters();delete i.question.filters.semantics[omitted];p=await prepare(2,i);dimensions.forEach(d=>assign([1,2],selectedByDimension[d]));r=await step4(p);verifyResult(r,p,[1,2]);ok(!trace4.some(q=>q.dimension===omitted)&&!r.trail.some(t=>t.dimension===omitted),'unselected zero '+omitted);
 }
 // Actual property type and optional changes, not metadata-only behavior.
 for(const [type,env,expected]of[['9007199254740993',false,[1,2]],['9007199254740994',false,[3]],['9007199254740993',true,[2]]]){
  const i=base();i.question.propertyType.termId=type;if(env)i.question.filters={semantics:{environment:['3']}};p=await prepare(3,i);assign([1,2],['9007199254740993']);assign([3],['9007199254740994']);assign([2],['3']);r=await step4(p);verifyResult(r,p,expected);eq(trace4.length,env?2:1);
 }
 // No category memberships exist for these fact selections: Step4 cannot reject.
 const variations=[...['bedrooms','bathrooms','parking','year_built'].flatMap((d,i)=>[{facts:{[d]:[{kind:'exact',value:d==='year_built'?'2018':'3'}]}},{facts:{[d]:[{kind:'category',termId:String(9+i)}]}}]),{propertyArea:'100-500m2'},{constructionArea:'100-200m2'}];
 for(const filters of variations){const i=base();i.question.filters=filters;p=await prepare(2,i);assign([1,2],selectedByDimension.property_type);r=await step4(p);verifyResult(r,p,[1,2]);eq(trace4.map(q=>q.dimension),['property_type']);}
 const batches=[];
 for(const n of[1,24,25,26,50,51,1001]){p=await prepare(n);assign(nums(n),selectedByDimension.property_type);r=await step4(p);verifyResult(r,p,nums(n));eq(trace4.length,Math.ceil(n/25));batches.push({ids:n,requests:trace4.length});}
 // 25x25 grid reaches a real 625-row membership response; terms aren't queried N+1.
 const denseInput=base();denseInput.question.filters={semantics:{environment:extraTerms.slice(0,25).map(t=>t.id)}};
 const pages=[];
 for(const rows of[0,1,499,500,501,625]){
  p=await prepare(25,denseInput);assign(nums(25),selectedByDimension.property_type);
  const grid=nums(25).flatMap(n=>extraTerms.slice(0,25).map(t=>({listing_id:listingId(n),ontology_term_id:t.id})));assignments.push(...grid.slice(0,rows));r=await step4(p);verifyResult(r,p,nums(Math.ceil(rows/25)));
  const qs=trace4.filter(q=>q.dimension==='environment');eq(qs.length,Math.max(1,Math.ceil(rows/500)));pages.push({membershipRows:rows,dimensionQueries:qs.length});
 }
 for(const termCount of[24,25,26,50,51]){
  const i=base();i.question.filters={semantics:{environment:extraTerms.slice(0,termCount).map(t=>t.id)}};
  p=await prepare(26,i);assign(nums(26),selectedByDimension.property_type);assign(nums(26),extraTerms.slice(0,termCount).map(t=>t.id));r=await step4(p);verifyResult(r,p,nums(26));
  let expected=2;for(const ids of[25,1])for(let t=0;t<termCount;t+=25)expected+=Math.ceil(ids*Math.min(25,termCount-t)/500);
  eq(trace4.length,expected,'complete ID/term grid');
 }
 p=await prepare(3,denseInput);assign(nums(3),selectedByDimension.property_type);assign(nums(3),extraTerms.slice(0,5).map(t=>t.id));cap4=3;r=await step4(p);verifyResult(r,p,nums(3));eq(trace4.filter(q=>q.dimension==='environment').map(q=>q.offset),[0,3,6,9,12]);
 const failures=['count-drift','count-null','negative','fraction','unsafe','premature','wrong-term','unrequested-term','numeric-term','bad-id','outside','null-row','duplicate','cross-duplicate','reverse','missing-last','oversized','null-data','overcount'];
 for(const f of failures){p=await prepare(25,denseInput);assign(nums(25),selectedByDimension.property_type);assign(nums(25),extraTerms.slice(0,25).map(t=>t.id));fault4=f;r=await step4(p);ok(r.state==='incomplete','incomplete '+f);ok(!('listingIds'in r)&&!('trail'in r),'no partial Step4 result');}
 for(const f of['throw','late-throw','error']){p=await prepare(25,denseInput);assign(nums(25),selectedByDimension.property_type);assign(nums(25),extraTerms.slice(0,25).map(t=>t.id));fault4=f;r=await step4(p);ok(r.state==='execution_failed','query failure '+f);ok(!('listingIds'in r)&&!JSON.stringify(r).includes('secret'),'no operational leak');}
 p=await prepare(2);assign([1,2],selectedByDimension.property_type);r=await step4(p);const good=r;
 const original=p;stage4=false;const otherEnv=await commit();const otherG=await starting(otherEnv),otherF=await acquire(otherEnv,otherG);stage4=true;
 for(const [e,f]of[[null,p.f],[copy(p.e),p.f],[p.e,copy(p.f)],[p.e,otherF],[otherEnv,p.f],[p.e,{...p.f,listingIds:[listingId(99)]}],[p.e,null]]){
  const before=trace4.length;const failed=await membership.acquirePhase14MembershipPopulation(e,f);ok(failed.state==='invalid_execution','reject provenance');eq(trace4.length,before,'zero invalid reads');
 }
 for(const denial of['anonymous','unentitled']){stage4=false;auth=denial!=='anonymous';entitled=false;const before=trace4.length;await assert.rejects(()=>commit());checks++;eq(trace4.length,before,'unauthorized zero reads')}auth=entitled=true;
 for(const target of[good,good.listingIds,good.propertyType,good.trail,good.trail[0],good.trail[0].selectedTermIds,good.trail[0].completeness,good.completeness])ok(Object.isFrozen(target),'frozen authority');
 for(const key of['listingIds','propertyType','trail','completeness','survivingListingCount'])ok(!Reflect.set(good,key,null),'immutable '+key);
 ok(!Reflect.set(good.trail[0],'survivorCount',999),'trail counts frozen');assert.throws(()=>good.trail[0].selectedTermIds.push('5'));checks++;
 for(const [v,e,f]of[[copy(good),p.e,p.f],[good,otherEnv,otherF],[good,p.e,copy(p.f)]]){assert.throws(()=>membership.assertPhase14MembershipPopulationForExecution(v,e,f));checks++}
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;', {fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-membership-population.ts','lib/phase14-fundamental-population.ts','lib/phase14-geographic-population.ts','lib/phase14-question.ts','lib/phase14-question-commit.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,queryExamples:countExamples,idBatches:batches,pageBoundaries:pages,progressiveCounts:[20,12,8,5,3,2,1],shortCircuitStages:6,unselectedDimensions:5,factIndependentCases:variations.length,incompleteCases:failures.length,queryFailureCases:3,emptyInputQueries:0,invalidAuthorityQueries:0,clientRoots:graph.roots,runtimeModules:graph.modules,protectedViolations:0,liveIO:false,snapshotGuaranteed:false},null,2));
}
return run();
`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
