// Reuse the established offline Step 1 harness only; do not execute its test suite here.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
const scenarios=String.raw`
allowed.add('lib/phase14-geographic-population.ts');allowed.add('lib/phase14-fundamental-population.ts');allowed.add('lib/phase14-membership-population.ts');allowed.add('lib/phase14-fact-population.ts');allowed.add('lib/canonical-listing-reader.ts');
const factsApi=load('lib/phase14-fact-population.ts');
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
let stage5=false,trace5=[],factRows=new Map(),scalarRows=new Map(),categoryRows=[],error5='ok',cap5=500;
const factDims=['bedrooms','bathrooms','parking','year_built'];
const categoryIds={bedrooms:'9',bathrooms:'10',parking:'11',year_built:'12'};
const from4=db.from.bind(db);
const fact=(dimension,kind,more)=>({dimension,kind,exact_value:null,category_term_id:null,range_lower:null,range_upper:null,lower_inclusive:null,upper_inclusive:null,...more});
const exact=(d,v)=>fact(d,'exact',{exact_value:v});
const range=(d,l,u,li=true,ui=true)=>fact(d,'range',{range_lower:l,range_upper:u,lower_inclusive:li,upper_inclusive:ui});
const category=d=>fact(d,'category',{category_term_id:categoryIds[d]});
const interval=(l,u,li=true,ui=true)=>({kind:'interval',interval:{lower:l,upper:u,lowerInclusive:li,upperInclusive:ui}});
function put(n,f){const id=listingId(n),a=factRows.get(id)||[];a.push(f);factRows.set(id,a)}
function member(n,term){categoryRows.push({listing_id:listingId(n),ontology_term_id:term})}
function area(n,p='100',c='100'){scalarRows.set(listingId(n),{property_area:p,construction_area:c})}
db.rpc=async(name,args)=>{
 assert.ok(stage5,'no unexpected upstream rpc');assert.equal(name,'read_canonical_listing_evidence');eq(args.p_semantic_dimensions,[]);
 assert.equal(args.p_fact_dimensions.length,1);assert.ok(factDims.includes(args.p_fact_dimensions[0]));assert.ok(args.p_listing_ids.length<=25);
 const dimension=args.p_fact_dimensions[0],ids=args.p_listing_ids;trace5.push({path:'facts',dimension,ids:[...ids]});
 if(error5==='fact-throw')throw Error('private diagnostic');if(error5==='fact-error')return{data:null,error:{message:'private diagnostic'}};
 let data=ids.map(id=>({listing_id:id,canonical_domain_version:1,geography:geos.slice(0,3).map(g=>({...g,term_name:'g',term_name_en:null,term_name_es:null,slug:null,slug_en:null,slug_es:null})),facts:copy((factRows.get(id)||[]).filter(f=>f.dimension===dimension)),selections:[]}));
 if(error5==='fact-missing')data.pop();if(error5==='fact-duplicate-row')data.push(copy(data[0]));if(error5==='fact-outside')data[0].listing_id=listingId(99999);
 if(error5==='fact-wrong-dimension')data[0].facts=[exact(dimension==='bedrooms'?'parking':'bedrooms','3')];
 if(error5==='fact-null')data=null;
 if(error5==='fact-late-error'&&trace5.filter(x=>x.path==='facts').length===2)return{data:null,error:{message:'private diagnostic'}};
 return{data,error:null};
};
db.from=function(table){
 if(!stage5)return from4(table);
 assert.ok(['listings','listings_ontology_terms'].includes(table),'no dictionary/classification/extra reads');
 const pathKind=table==='listings'?'area':'category';let columns,ids,ts,orders=[],offset,end,field;
 const q={select(c,o){columns=c;eq(o,{count:'exact'});if(pathKind==='area'){assert.ok(['id,property_area::text','id,construction_area::text'].includes(c));field=c.split(',')[1].split(':')[0]}else assert.equal(c,'listing_id,ontology_term_id::text');return q},
 in(k,v){if(k===(pathKind==='area'?'id':'listing_id')){assert.equal(ids,undefined);ids=v}else{assert.equal(k,'ontology_term_id');assert.equal(ts,undefined);ts=v}return q},
 order(k){orders.push(k);return q},range(a,b){offset=a;end=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 assert.ok(ids.length>0);assert.ok(ids.reduce((n,id)=>n+encodeURIComponent(JSON.stringify(id)).length+3,0)<=1500);assert.equal(end-offset,499);
 assert.deepEqual(orders,pathKind==='area'?['id']:['listing_id','ontology_term_id']);
 if(pathKind==='category'){assert.ok(ids.length<=25&&ts.length<=25);assert.ok(ts.every(t=>terms.some(x=>x.id===t&&factDims.includes(x.term_type))))}
 trace5.push({path:pathKind,field,ids:[...ids],terms:ts&&[...ts],offset});
 if(error5===pathKind+'-throw')throw Error('private diagnostic');
 let all=pathKind==='area'?ids.map(id=>({id,[field]:scalarRows.get(id)?.[field]??null})):categoryRows.filter(r=>ids.includes(r.listing_id)&&ts.includes(r.ontology_term_id)).sort((a,b)=>a.listing_id<b.listing_id?-1:a.listing_id>b.listing_id?1:BigInt(a.ontology_term_id)<BigInt(b.ontology_term_id)?-1:BigInt(a.ontology_term_id)>BigInt(b.ontology_term_id)?1:0);
 let data=all.slice(offset,Math.min(end+1,offset+cap5)).map(copy),count=all.length;
 const f=error5.startsWith(pathKind+'-')?error5.slice(pathKind.length+1):'ok';
 if(f==='missing')data=data.slice(0,-1);if(f==='count-drift'&&offset>0)count--;
 if(f==='count-null')count=null;if(f==='negative')count=-1;if(f==='fraction')count=1.5;
 if(f==='duplicate'&&data.length>1)data[1]=copy(data[0]);if(f==='cross-duplicate'&&offset>0)data[0]=copy(all[0]);
 if(f==='outside'&&data.length)data[0][pathKind==='area'?'id':'listing_id']=listingId(99999);
 if(f==='malformed-id'&&data.length)data[0][pathKind==='area'?'id':'listing_id']='bad';
 if(f==='reverse')data.reverse();if(f==='premature'&&offset>0)data=[];if(f==='null-data')data=null;
 if(f==='oversized')data=Array(501).fill(all[0]);if(f==='wrong-term'&&data.length)data[0].ontology_term_id='3';
 if(f==='numeric-term'&&data.length)data[0].ontology_term_id=9;
 if(f==='malformed-value'&&data.length)data[0][field]='no';if(f==='numeric-value'&&data.length)data[0][field]=123;
 if(f==='zero-value'&&data.length)data[0][field]='0';
 return{data,count,error:f==='error'?{message:'private diagnostic'}:null};
 }).then(resolve,reject)}};return q;
};
async function setup(n,filters={}){
 stage5=false;const input=base();input.question.filters=filters;const p=await prepare(n,input);assign(nums(n),selectedByDimension.property_type);
 const m=await step4(p);ok(m.state==='complete','real Step4 population');trace5=[];factRows=new Map();scalarRows=new Map();categoryRows=[];error5='ok';cap5=500;
 return{...p,m};
}
async function run5(p){stage5=true;return factsApi.acquirePhase14FactPopulation(p.e,p.m)}
function verify5(r,p,expected){ok(r.state==='complete','Step5 complete '+JSON.stringify(r.state==='complete'?'':r));eq(r.listingIds,expected.map(listingId));ok(r.membershipPopulation===p.m,'upstream association');ok(r.membershipStartingCount===p.m.survivingListingCount&&r.survivingListingCount===expected.length,'counts');eq(r.completeness.requests,trace5.length);factsApi.assertPhase14FactPopulationForExecution(r,p.e,p.m);checks++;let n=p.m.survivingListingCount;for(const t of r.trail){ok(t.inputCount===n&&t.survivorCount<=n&&t.excludedCount===n-t.survivorCount,'monotone trail');n=t.survivorCount}}
async function run(){
 let p=await setup(4),r=await run5(p);verify5(r,p,[1,2,3,4]);eq(trace5,[]);eq(r.trail,[]);const queryCounts=[{case:'zero filters',logical:0,physical:0}];
 for(const d of factDims){
  const target=d==='year_built'?'2018':'3',low=d==='year_built'?'2015':'2',high=d==='year_built'?'2020':'4';
  p=await setup(6,{facts:{[d]:[{kind:'exact',value:target}]}});put(1,exact(d,target));put(2,exact(d,low));put(3,range(d,low,high));put(4,category(d));member(4,categoryIds[d]);put(6,exact(d,'00'+target+'.000'));member(6,categoryIds[d]);
  r=await run5(p);verify5(r,p,[1,6]);eq(trace5.map(q=>q.path),['facts']);ok(r.trail[0].evidence[0].records.length===6,'targeted evidence retained');
  p=await setup(6,{facts:{[d]:[interval(low,high)]}});put(1,exact(d,target));put(2,exact(d,d==='year_built'?'2012':'1'));put(3,range(d,low,high));put(4,range(d,d==='year_built'?'2010':'1',target));put(5,category(d));member(5,categoryIds[d]);
  r=await run5(p);verify5(r,p,[1,3]);eq(trace5.map(q=>q.path),['facts']);
  p=await setup(6,{facts:{[d]:[{kind:'category',termId:categoryIds[d]}]}});member(1,categoryIds[d]);member(2,'3');put(3,exact(d,target));put(4,range(d,low,high));put(5,category(d));member(6,categoryIds[d]);
  r=await run5(p);verify5(r,p,[1,6]);eq(trace5.map(q=>q.path),['category']);
  p=await setup(6,{facts:{[d]:[{kind:'exact',value:target},{kind:'category',termId:categoryIds[d]},interval(low,high)]}});put(1,exact(d,target));member(1,categoryIds[d]);member(2,categoryIds[d]);put(3,range(d,low,high));put(4,exact(d,d==='year_built'?'2010':'1'));put(5,category(d));
  r=await run5(p);verify5(r,p,[1,2,3]);eq(trace5.map(q=>q.path),['facts','category']);eq(trace5[0].ids,trace5[1].ids,'all evidence paths before exclusion');
 }
 // Lossless decimal identity and legitimate zero.
 for(const[d,value,other]of[['bedrooms','0','1'],['parking','0','1'],['bathrooms','2.0000000000000000001','2.0000000000000000002'],['bedrooms','9007199254740993','9007199254740992']]){
  p=await setup(2,{facts:{[d]:[{kind:'exact',value}]}});put(1,exact(d,value));put(2,exact(d,other));r=await run5(p);verify5(r,p,[1]);
 }
 let intervalCases=0;
 for(const li of[false,true])for(const ui of[false,true]){
  p=await setup(7,{facts:{bathrooms:[interval('2','4',li,ui)]}});['1','2','2.0000000000000000001','3','3.9999999999999999999','4','5'].forEach((v,i)=>put(i+1,exact('bathrooms',v)));
  r=await run5(p);verify5(r,p,[...(li?[2]:[]),3,4,5,...(ui?[6]:[])]);intervalCases++;
  for(const eli of[false,true])for(const eui of[false,true]){
   p=await setup(1,{facts:{bathrooms:[interval('2','4',li,ui)]}});put(1,range('bathrooms','2','4',eli,eui));r=await run5(p);verify5(r,p,(!eli||li)&&(!eui||ui)?[1]:[]);intervalCases++;
  }
 }
 const ranges=[['3','4',true,true,true],['2','5',true,true,true],['1','3',true,true,false],['4','6',true,true,false],['1','6',true,true,false],['0','1',true,true,false],['6','7',true,true,false],[null,'4',false,true,false],['3',null,true,false,false]];
 for(const[l,u,li,ui,match]of ranges){p=await setup(1,{facts:{parking:[interval('2','5')]}});put(1,range('parking',l,u,li,ui));r=await run5(p);verify5(r,p,match?[1]:[]);intervalCases++}
 for(const[c,e,match]of[[interval(null,'5',false,true),range('parking',null,'4',false,true),true],[interval('2',null,true,false),range('parking','3',null,true,false),true],[interval('2',null,true,false),range('parking',null,'5',false,true),false]]){
  p=await setup(1,{facts:{parking:[c]}});put(1,e);r=await run5(p);verify5(r,p,match?[1]:[]);intervalCases++;
 }
 // Even a singleton range does not manufacture exact evidence.
 p=await setup(1,{facts:{bedrooms:[{kind:'exact',value:'3'}]}});put(1,range('bedrooms','3','3'));r=await run5(p);verify5(r,p,[]);
 p=await setup(3,{facts:{bedrooms:[{kind:'exact',value:'2'},{kind:'exact',value:'3'}]}});[2,3,4].forEach((v,i)=>put(i+1,exact('bedrooms',String(v))));r=await run5(p);verify5(r,p,[1,2]);
 const all={facts:{bedrooms:[{kind:'exact',value:'3'}],bathrooms:[{kind:'exact',value:'2'}],parking:[{kind:'exact',value:'1'}],year_built:[interval('2015','2020')]},propertyArea:'100-500m2',constructionArea:'100-200m2'};
 const names=[...factDims,'propertyArea','constructionArea'],limits=[20,12,9,6,4,2];
 p=await setup(30,all);for(let n=1;n<=30;n++){factDims.forEach((d,i)=>put(n,exact(d,n<=limits[i]?['3','2','1','2018'][i]:['4','3','2','2010'][i])));area(n,n<=4?'200':'600',n<=2?'150':'300')}
 const prior=JSON.stringify(p.m);r=await run5(p);verify5(r,p,[1,2]);eq([30,...r.trail.map(t=>t.survivorCount)],[30,20,12,9,6,4,2]);eq(JSON.stringify(p.m),prior);
 for(const q of trace5){const i=q.path==='facts'?factDims.indexOf(q.dimension):q.field==='property_area'?4:5;ok(q.ids.every(id=>nums(i?limits[i-1]:30).map(listingId).includes(id)),'progressive query bound')}
 queryCounts.push({case:'all six progressive',logical:6,physical:trace5.length});
 for(let stop=0;stop<6;stop++){
  p=await setup(2,all);for(const n of[1,2]){factDims.forEach((d,i)=>put(n,exact(d,i===stop?['4','3','2','2010'][i]:['3','2','1','2018'][i])));area(n,stop===4?'600':'200',stop===5?'300':'150')}
  r=await run5(p);verify5(r,p,[]);eq(trace5.length,stop+1);eq(r.trail.slice(stop+1).map(t=>t.execution),Array(5-stop).fill('empty_input'));
 }
 p=await setup(0,all);r=await run5(p);verify5(r,p,[]);eq(trace5.length,0);
 const areaModule=load('lib/market-intelligence-area-ranges.ts');let areaCases=0;
 for(const[dim,options,resolve]of[['propertyArea',areaModule.PROPERTY_AREA_RANGE_OPTIONS,areaModule.resolvePropertyAreaConstraint],['constructionArea',areaModule.CONSTRUCTION_AREA_RANGE_OPTIONS,areaModule.resolveConstructionAreaConstraint]]){
  for(const option of options){const b=resolve(option.value),values=[null];if(b.min!==null)values.push(String(b.min-0.001),String(b.min),String(b.min+0.001));else values.push('0.001');if(b.max!==null)values.push(String(b.max-0.001),String(b.max),String(b.max+0.001));else values.push(String(b.min+100000));
   p=await setup(values.length,{[dim]:option.value});values.forEach((v,i)=>area(i+1,dim==='propertyArea'?v:'123',dim==='constructionArea'?v:'123'));r=await run5(p);
   const expected=values.flatMap((v,i)=>v!==null&&(b.min===null||Number(v)>=b.min)&&(b.max===null||Number(v)<b.max)?[i+1]:[]);verify5(r,p,expected);eq(trace5.length,1);ok(trace5[0].field===(dim==='propertyArea'?'property_area':'construction_area'),'only selected area');areaCases+=values.length;
  }
 }
 // Boundary immediately below 100 must not round into [100,500).
 p=await setup(2,{propertyArea:'100-500m2'});area(1,'99.99999999999999999999');area(2,'100.00000000000000000000');r=await run5(p);verify5(r,p,[2]);
 for(const filters of[{facts:{bedrooms:all.facts.bedrooms}},{propertyArea:all.propertyArea},{facts:all.facts},{propertyArea:all.propertyArea,constructionArea:all.constructionArea},all]){
  p=await setup(2,filters);for(const n of[1,2]){factDims.forEach((d,i)=>put(n,exact(d,['3','2','1','2018'][i])));area(n,'200','150')};r=await run5(p);verify5(r,p,[1,2]);queryCounts.push({case:Object.keys(filters.facts||{}).join('+')+' '+Object.keys(filters).filter(k=>k!=='facts').join('+'),logical:r.trail.length,physical:trace5.length});
 }
 const batchCounts=[];
 for(const n of[24,25,26,33,34,67])for(const pathKind of['facts','category','area']){
  const filters=pathKind==='area'?{propertyArea:'100-500m2'}:{facts:{bedrooms:[pathKind==='facts'?{kind:'exact',value:'3'}:{kind:'category',termId:'9'}]}};
  p=await setup(n,filters);for(const i of nums(n)){put(i,exact('bedrooms','3'));member(i,'9');area(i,'200')};r=await run5(p);verify5(r,p,nums(n));eq(trace5.length,Math.ceil(n/(pathKind==='area'?33:25)));batchCounts.push({n,path:pathKind,requests:trace5.length});
 }
 const many=Array.from({length:26},(_,i)=>({id:String(3000+i),term_type:'bedrooms',level:1,term_name:'opaque'}));terms.push(...many);
 const catFilters={facts:{bedrooms:many.slice(0,25).map(t=>({kind:'category',termId:t.id}))}};
 for(const count of[499,500,501,625]){
  p=await setup(25,catFilters);categoryRows=nums(25).flatMap(n=>many.slice(0,25).map(t=>({listing_id:listingId(n),ontology_term_id:t.id}))).slice(0,count);r=await run5(p);verify5(r,p,nums(Math.ceil(count/25)));eq(trace5.length,Math.ceil(count/500));
 }
 p=await setup(26,{facts:{bedrooms:many.map(t=>({kind:'category',termId:t.id}))}});for(const n of nums(26))for(const t of many)member(n,t.id);r=await run5(p);verify5(r,p,nums(26));eq(trace5.length,5,'2x2 chunks plus second dense page');
 for(const pathKind of['category','area']){p=await setup(10,pathKind==='area'?{propertyArea:'100-500m2'}:{facts:{bedrooms:[{kind:'category',termId:'9'}]}});nums(10).forEach(n=>{member(n,'9');area(n,'200')});cap5=3;r=await run5(p);verify5(r,p,nums(10));eq(trace5.map(q=>q.offset),[0,3,6,9])}
 const incomplete=[];
 for(const err of['fact-missing','fact-duplicate-row','fact-outside','fact-wrong-dimension','fact-null']){
  p=await setup(2,{facts:{bedrooms:[{kind:'exact',value:'3'}]}});put(1,exact('bedrooms','3'));error5=err;r=await run5(p);ok(r.state==='incomplete',err);ok(!('listingIds'in r)&&!('trail'in r),'no partial');incomplete.push(err);
 }
 for(const malformed of[[exact('bedrooms','3'),exact('bedrooms','4')],[exact('bedrooms','3.5')],[range('bedrooms','4','2')],[range('bedrooms',null,'4',true,true)],[range('bedrooms','3','3',false,true)],[exact('bedrooms','NaN')]]){
  p=await setup(1,{facts:{bedrooms:[interval('2','5')]}});factRows.set(listingId(1),malformed);r=await run5(p);ok(r.state==='incomplete','malformed numerical evidence');incomplete.push('malformed fact');
 }
 for(const pathKind of['category','area'])for(const f of['missing','count-drift','count-null','negative','fraction','duplicate','cross-duplicate','outside','malformed-id','reverse','premature','null-data','oversized',...(pathKind==='category'?['wrong-term','numeric-term']:['malformed-value','numeric-value','zero-value'])]){
  p=await setup(10,pathKind==='area'?{propertyArea:'100-500m2'}:{facts:{bedrooms:[{kind:'category',termId:'9'}]}});nums(10).forEach(n=>{member(n,'9');area(n,'200')});cap5=3;error5=pathKind+'-'+f;r=await run5(p);ok(r.state==='incomplete',error5);ok(!('listingIds'in r),'no failure prefix');incomplete.push(error5);
 }
 let queryFailures=0;
 for(const err of['fact-throw','fact-error','fact-late-error','category-throw','category-error','area-throw','area-error']){
  const pathKind=err.split('-')[0];p=await setup(26,pathKind==='area'?{propertyArea:'100-500m2'}:{facts:{bedrooms:[pathKind==='fact'?{kind:'exact',value:'3'}:{kind:'category',termId:'9'}]}});nums(26).forEach(n=>{put(n,exact('bedrooms','3'));member(n,'9');area(n,'200')});error5=err;r=await run5(p);ok(r.state==='execution_failed',err);ok(!JSON.stringify(r).includes('private diagnostic')&&!('listingIds'in r),'controlled failure');queryFailures++;
 }
 p=await setup(2,{facts:{bedrooms:[{kind:'exact',value:'3'}]}});put(1,exact('bedrooms','3'));put(2,exact('bedrooms','3'));r=await run5(p);verify5(r,p,[1,2]);const good=r,original=p;
 stage5=false;const other=await setup(2);stage5=true;
 for(const[e,m]of[[null,original.m],[copy(original.e),original.m],[original.e,copy(original.m)],[original.e,other.m],[other.e,original.m],[original.e,null]]){const before=trace5.length;const failed=await factsApi.acquirePhase14FactPopulation(e,m);ok(failed.state==='invalid_execution','invalid provenance');eq(trace5.length,before)}
 for(const state of['anonymous','unentitled']){stage5=false;stage4=false;auth=state!=='anonymous';entitled=false;const before=trace5.length;await assert.rejects(()=>commit());checks++;eq(trace5.length,before)}auth=entitled=true;
 for(const target of[good,good.listingIds,good.trail,good.trail[0],good.trail[0].selection,good.trail[0].evidence,good.trail[0].evidence[0].records[0],good.trail[0].evidence[0].records[0].facts[0],good.completeness])ok(Object.isFrozen(target),'deep frozen');
 ok(!Reflect.set(good.trail[0],'survivorCount',99),'immutable count');ok(!Reflect.set(good.trail[0].evidence[0].records[0].facts[0],'exact_value','9'),'immutable evidence');
 for(const[v,e,m]of[[copy(good),original.e,original.m],[good,other.e,other.m],[good,original.e,copy(original.m)]]){assert.throws(()=>factsApi.assertPhase14FactPopulationForExecution(v,e,m));checks++}
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;', {fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-fact-population.ts','lib/canonical-listing-reader.ts','lib/phase14-membership-population.ts','lib/phase14-fundamental-population.ts','lib/phase14-geographic-population.ts','lib/phase14-question.ts','lib/phase14-question-commit.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,queryCounts,batchCounts,intervalCases,areaBoundaryCases:areaCases,incompleteCases:incomplete.length,queryFailures,progressive:[30,20,12,9,6,4,2],emptyInputQueries:0,invalidAuthorityQueries:0,clientRoots:graph.roots,runtimeModules:graph.modules,protectedViolations:0,liveIO:false,fullHydration:false},null,2));
}
return run();
`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
