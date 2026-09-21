// Reuse the established offline Step 1 harness only; do not execute its test suite here.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
const scenarios=String.raw`
allowed.add('lib/phase14-geographic-population.ts');allowed.add('lib/phase14-fundamental-population.ts');
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
async function run(){
 const e=await commit(),pagination=[];
 for(const n of [0,1,25,499,500,501,1000,1001,3217]){
  fixture(n);const g=await starting(e),before=JSON.stringify(g),r=await acquire(e,g);
  ok(r.state==='complete','complete '+n);assert.deepEqual(r.listingIds,g.listingIds);checks++;
  ok(r.geographicPopulation===g&&r.geographicStartingCount===n&&r.survivingListingCount===n&&r.excludedListingCount===0,'distinct counts '+n);
  ok(r.expectedSurvivorCount===n&&r.completeness.pagesRead===Math.ceil(n/500),'page count '+n);
  ok(trace3.length===Math.ceil(n/500),'no N+1 '+n);ok(JSON.stringify(g)===before,'Step2 unchanged');
  fundamental.assertPhase14FundamentalPopulationForExecution(r,e,g);checks++;
  pagination.push({n,step3Queries:trace3.length});
 }
 fixture(11);const cappedG=await starting(e);cap=3;const capped=await acquire(e,cappedG);ok(capped.state==='complete'&&capped.listingIds.length===11,'capped pages');assert.deepEqual(trace3.map(q=>q.from),[0,3,6,9]);checks++;
 const geoResults=[];
 for(const [level,code,term]of[['district','10101','103'],['canton','101','102'],['province','1','101']]){
  for(const transaction of ['sale','rent']){
   fixture(0);members=Array.from({length:11},(_,i)=>({listing_id:listingId(i+1),ontology_term_id:term}));members.push({listing_id:listingId(12),ontology_term_id:'999'});
   const variants=[['active',1,'sale'],['active',1,'rent'],['draft',1,'sale'],['archived',1,'sale'],['expired',1,'sale'],['deleted',1,'sale'],['active',null,'sale'],['active',0,'sale'],['active',2,'sale'],['draft',null,'rent'],['active','1','sale']];
   variants.forEach(([listing_status,canonical_domain_version,transaction_type],i)=>eligibility.set(listingId(i+1),{listing_status,canonical_domain_version,transaction_type}));
   const input=base();input.question.geography={level,officialCode:code};input.question.transaction=transaction;
   const env=await commit(input),g=await starting(env),refs=calls.length,r=await acquire(env,g);
   ok(r.state==='complete','predicates '+level+transaction);assert.deepEqual(r.listingIds,[listingId(transaction==='sale'?1:2)]);checks++;
   ok(r.geographicStartingCount===11&&r.survivingListingCount===1&&r.excludedListingCount===10,'exclusions');
   ok(trace3.length===1&&trace3[0].predicate===term,'geographic query boundary');ok(refs===calls.length,'no geography/reference rereads');
   geoResults.push({level,transaction,starting:11,surviving:1,excluded:10});
  }
 }
 // Every optional dimension remains only committed intent. Test separately.
 const filters=[{semantics:{environment:['3']}},{semantics:{terrain:['5']}},{semantics:{utility:['6']}},{semantics:{accessibility:['7']}},{semantics:{legal_status:['8']}},...['bedrooms','bathrooms','parking','year_built'].map(k=>({facts:{[k]:[{kind:'exact',value:k==='year_built'?'2018':'3'}]}}))];
 const areas=load('lib/market-intelligence-area-ranges.ts');filters.push({propertyArea:areas.PROPERTY_AREA_RANGE_OPTIONS[0].value},{constructionArea:areas.CONSTRUCTION_AREA_RANGE_OPTIONS[0].value});
 for(const variation of [{propertyType:{termId:'9007199254740994'}},...filters.map(filters=>({filters}))]){
  fixture(3);const input=base();Object.assign(input.question,variation);const env=await commit(input),g=await starting(env),r=await acquire(env,g);
  ok(r.state==='complete','future criteria unused');assert.deepEqual(r.listingIds,[1,2,3].map(listingId));checks++;
 }
 fixture(15);const rentInput=base();rentInput.question.transaction='rent';const rent=await commit(rentInput),emptyG=await starting(rent),empty=await acquire(rent,emptyG);
 ok(empty.state==='complete'&&empty.survivingListingCount===0&&empty.excludedListingCount===15&&trace3.length===1,'complete empty output no relaxation');
 const faults=['count-drift','count-null','count-negative','count-fraction','count-unsafe','premature','wrong-term','numeric-term','malformed','numeric-id','null-row','duplicate','cross-duplicate','unordered','lower-page','missing-last','oversized','null-data','over-count','outside','bad-status','bad-version','bad-transaction','bad-relation'];
 for(const f of faults){fixture(501);const g=await starting(e);fault=f;const r=await acquire(e,g);ok(r.state==='incomplete','fail closed '+f);ok(!('listingIds'in r),'no survivor prefix '+f)}
 for(const f of ['throw','late-throw','error']){fixture(501);const g=await starting(e);fault=f;const r=await acquire(e,g);ok(r.state==='execution_failed','query failure '+f);ok(!('listingIds'in r)&&!JSON.stringify(r).includes('fake error'),'controlled failure '+f)}
 fixture(2);const g=await starting(e),other=await commit(),otherG=await starting(other);
 const pairs=[[null,g],[copy(e),g],[base(),g],[e,null],[e,copy(g)],[e,{...g,geography:{...g.geography,termId:'104'}}],[e,otherG],[other,g]];
 for(const [env,geo]of pairs){const before=trace3.length;const r=await acquire(env,geo);ok(r.state==='invalid_execution','provenance rejected');ok(trace3.length===before,'zero invalid execution reads')}
 for(const denial of ['anonymous','unentitled']){auth=denial!=='anonymous';entitled=false;const before=trace3.length;await assert.rejects(()=>commit());checks++;ok(trace3.length===before,'zero unauthorized population reads')}auth=entitled=true;
 const r=await acquire(e,g);ok(r.state==='complete','authentic result');
 for(const target of [r,r.geography,r.predicates,r.completeness,r.listingIds,r.geographicPopulation])ok(Object.isFrozen(target),'deep frozen');
 for(const key of ['listingIds','survivingListingCount','expectedSurvivorCount','geographicStartingCount','excludedListingCount','geography','transaction','completeness','predicates'])ok(!Reflect.set(r,key,null),'immutable '+key);
 assert.throws(()=>r.listingIds.push(listingId(8)));checks++;
 for(const [value,env,geo]of [[copy(r),e,g],[r,other,otherG],[r,e,copy(g)],[r,e,await starting(e)]]){assert.throws(()=>fundamental.assertPhase14FundamentalPopulationForExecution(value,env,geo));checks++}
 ok(r.completeness.snapshotGuaranteed===false,'no snapshot claim');
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;', {fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-fundamental-population.ts','lib/phase14-geographic-population.ts','lib/phase14-question.ts','lib/phase14-question-commit.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,pagination,cappedOffsets:[0,3,6,9],fundamentalCases:geoResults,optionalIndependentCases:filters.length,propertyTypeIndependent:true,completenessFailures:faults.length,queryFailures:3,emptyInputQueries:0,invalidExecutionQueries:0,unauthorizedQueries:0,clientRoots:graph.roots,runtimeModules:graph.modules,protectedViolations:0,liveIO:false,snapshotGuaranteed:false},null,2));
}
return run();
`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
