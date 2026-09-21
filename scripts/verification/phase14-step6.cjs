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
allowed.add('lib/phase14-hydrated-population.ts');
const hydration=load('lib/phase14-hydrated-population.ts');
let stage6=false,trace6=[],fault6='',at6=1,cap6=25,rows6=new Map(),mutateCanonical=null,extraScalar=null;
const from5=db.from.bind(db),rpc5=db.rpc.bind(db);
db.from=function(table){
 if(!stage6)return from5(table);
 assert.equal(table,'listings');let fields,ids,offset,end;
 const q={select(c,o){fields=c.split(',');assert.deepEqual(o,{count:'exact'});assert.ok(fields.every(f=>['id','canonical_domain_version','listing_status','transaction_type','currency','current_price::text','monthly_price::text','property_area::text','construction_area::text'].includes(f)));return q},
 in(k,v){assert.equal(k,'id');ids=v;assert.ok(ids.length>0&&ids.length<=25);return q},order(k){assert.equal(k,'id');return q},range(a,b){offset=a;end=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 trace6.push({source:'scalar',ids:[...ids],fields:[...fields],offset});assert.equal(end-offset,24);
 let data=ids.slice(offset,Math.min(end+1,offset+cap6)).map(id=>{const r=rows6.get(id);return Object.fromEntries(fields.map(f=>f.split(':')[0]).map(f=>[f,r[f]]))}),count=ids.length;
 if(extraScalar) data=data.map(r=>({...r,...extraScalar}));
 const hit=trace6.filter(t=>t.source==='scalar').length===at6;
 if(hit){if(fault6==='scalar-error')return{error:{message:'private diagnostic'}};if(fault6==='scalar-throw')throw Error('private diagnostic');if(fault6==='scalar-missing'){data.pop();count--}if(fault6==='scalar-duplicate')data.push(copy(data[0]));if(fault6==='scalar-outside')data[0].id=listingId(99999);if(fault6==='scalar-reverse')data.reverse();if(fault6==='scalar-count')count--;if(fault6==='scalar-empty')data=[];}
 return{data,count,error:null};
 }).then(resolve,reject)}};return q;
};
db.rpc=async(name,args)=>{
 if(!stage6)return rpc5(name,args);
 assert.equal(name,'read_canonical_listing_evidence');assert.deepEqual(args.p_fact_dimensions,[]);assert.deepEqual(args.p_semantic_dimensions,['property_type']);assert.ok(args.p_listing_ids.length<=25);
 trace6.push({source:'rpc',ids:[...args.p_listing_ids]});
 let data=args.p_listing_ids.map(id=>({listing_id:id,canonical_domain_version:1,facts:[],selections:[{dimension:'property_type',ontology_term_id:'9007199254740993',term_type:'property_type',level:1,slug:'house',term_name:'House'}],geography:geos.slice(0,3).map(g=>({...g,term_name:'g',term_name_en:null,term_name_es:null,slug:null,slug_en:null,slug_es:null}))}));
 if(mutateCanonical)data.forEach(mutateCanonical);
 if(trace6.filter(t=>t.source==='rpc').length===at6){
 if(fault6==='missing')data.pop();if(fault6==='unexpected')data.push({...copy(data[0]),listing_id:listingId(99999)});if(fault6==='duplicate')data.push(copy(data[0]));if(fault6==='malformed')data[0].listing_id='bad';
 if(fault6==='rpc-error')return{error:{message:'private diagnostic'}};if(fault6==='rpc-throw')throw Error('private diagnostic');
 }
 return{data:data.reverse(),error:null};
};
async function setup6(n,filters={},tx='sale'){
 stage6=false;const p=await setup(n,filters);
 if(tx==='rent'){
  stage5=false;stage4=false;const input=base();input.question.transaction='rent';input.question.filters=filters;
  p.e=await commit(input);eligibility=new Map(nums(n).map(i=>[listingId(i),{canonical_domain_version:1,listing_status:'active',transaction_type:'rent'}]));
  p.g=await starting(p.e);p.f=await acquire(p.e,p.g);p.m=await step4(p);
 }
 nums(n).forEach(i=>{area(i,'200','100');put(i,exact('bedrooms','3'))});
 const f=await run5(p);ok(f.state==='complete','authentic Step5');
 rows6=new Map(nums(n).map(i=>[listingId(i),{id:listingId(i),canonical_domain_version:1,listing_status:'active',transaction_type:tx,currency:i%2?'USD':'CRC',current_price:'0.5',monthly_price:'1',property_area:'200',construction_area:'100'}]));
 trace6=[];fault6='';at6=1;cap6=25;mutateCanonical=null;extraScalar=null;stage6=true;
 return{...p,f};
}
async function run6(p){return hydration.hydratePhase14Survivors(p.e,p.f)}
function verify6(r,p){
 ok(r.state==='complete','complete hydration '+JSON.stringify(r.state));eq(r.listingIds,p.f.listingIds,'exact ordered identity');eq(Object.keys(r.evidenceByListingId),p.f.listingIds,'exact keyed coverage');eq(r.hydratedListingCount,p.f.survivingListingCount);
 ok(r.factPopulation===p.f,'exact upstream object');eq(r.completeness.requests,trace6.length);ok(!r.completeness.snapshotGuaranteed,'honest snapshot');
 hydration.assertPhase14HydratedPopulationForExecution(r,p.e,p.f);checks++;
 eq(r.provenance.factDimensions,[]);eq(r.provenance.semanticDimensions,['property_type']);
 for(const id of r.listingIds){const e=r.evidenceByListingId[id];eq(e.scalars.id,id);eq(e.canonical.listing_id,id);eq(Object.keys(e).sort(),['canonical','scalars']);ok(!('propertyBasis'in e)&&!('analyticalIdentity'in e)&&!('pricePerM2'in e),'no calculations')}
}
async function run(){
 const counts=[];
 for(const n of[0,1,24,25,26,49,50,51,100,101,137,3217]){
  const p=await setup6(n),r=await run6(p);verify6(r,p);
  const rpc=trace6.filter(t=>t.source==='rpc'),scalars=trace6.filter(t=>t.source==='scalar');eq(rpc.length,Math.ceil(n/25));eq(scalars.length,Math.ceil(n/25));eq(rpc.flatMap(t=>t.ids),p.f.listingIds);eq(scalars.flatMap(t=>t.ids),p.f.listingIds);
  counts.push({n,rpc:rpc.length,scalar:scalars.length});
 }
 let p=await setup6(51),r;cap6=7;r=await run6(p);verify6(r,p);eq(trace6.filter(t=>t.source==='scalar').length,9,'server capped pages complete');
 for(const tx of['sale','rent']){p=await setup6(2,{},tx);r=await run6(p);verify6(r,p);const field=tx==='sale'?'current_price':'monthly_price';eq(r.evidenceByListingId[listingId(1)].scalars[field],tx==='sale'?'0.5':'1');ok(trace6.filter(t=>t.source==='scalar').every(t=>t.fields.includes(field+'::text')&&!t.fields.includes((tx==='sale'?'monthly_price':'current_price')+'::text')),'transaction monetary sovereignty')}
 for(const filters of[{propertyArea:'100-500m2'},{constructionArea:'100-200m2'},{propertyArea:'100-500m2',constructionArea:'100-200m2'},{facts:{bedrooms:[{kind:'exact',value:'3'}]}}]){
  p=await setup6(26,filters);const before=trace5.length;r=await run6(p);verify6(r,p);eq(trace5.length,before,'no Step5 rerun');
  for(const [key,field]of[['propertyArea','property_area'],['constructionArea','construction_area']]){
   eq(r.provenance.reused.some(x=>x.field===field),Boolean(filters[key]));eq(trace6.filter(t=>t.source==='scalar').every(t=>!t.fields.includes(field+'::text')),Boolean(filters[key]));
  }
 }
 let failures=0;
 for(const fault of['missing','unexpected','duplicate','malformed','rpc-error','rpc-throw','scalar-missing','scalar-duplicate','scalar-outside','scalar-reverse','scalar-count','scalar-empty','scalar-error','scalar-throw'])for(const batch of[1,2,3]){
  p=await setup6(75);fault6=fault;at6=batch;r=await run6(p);
  ok(r.state===(fault.includes('error')||fault.includes('throw')?'execution_failed':'incomplete'),fault+' batch '+batch+' '+r.state);
  ok(!('evidenceByListingId'in r)&&!('listingIds'in r),'no partial escape');ok(!JSON.stringify(r).includes('private diagnostic'),'controlled error');failures++;
 }
 for(const[field,value]of[['canonical_domain_version',0],['canonical_domain_version','1'],['listing_status','draft'],['transaction_type','rent'],['currency','EUR'],['currency',undefined],['property_area','x'],['construction_area','0'],['current_price',0],['current_price',undefined]]){
  p=await setup6(1);rows6.get(listingId(1))[field]=value;r=await run6(p);eq(r.state,'incomplete',field+' malformed');failures++;
 }
 for(const mutation of[
  e=>{e.canonical_domain_version=0},e=>{e.selections[0].ontology_term_id='bad'},e=>{e.selections=[]},e=>{e.selections[0].ontology_term_id='9007199254740994'},
  e=>{e.geography.pop()},e=>{e.selections[0].term_type='utility'},e=>{e.facts=[exact('bedrooms','3')]},e=>{e.facts=[exact('bedrooms','bad')]},e=>{e.selections[0].slug=123}
 ]){p=await setup6(1);mutateCanonical=mutation;r=await run6(p);eq(r.state,'incomplete');failures++}
 p=await setup6(1,{propertyArea:'100-500m2'});extraScalar={property_area:'300'};r=await run6(p);eq(r.state,'incomplete','conflicting reused scalar');
 p=await setup6(1,{facts:{bedrooms:[{kind:'exact',value:'3'}]}});mutateCanonical=e=>{e.geography[1].id='999';e.geography[2].parent_id='999'};r=await run6(p);eq(r.state,'incomplete','retained/new geography conflict even selected district unchanged');
 p=await setup6(3);rows6.get(listingId(1)).construction_area=null;rows6.get(listingId(2)).property_area=null;rows6.get(listingId(3)).current_price=null;rows6.get(listingId(3)).currency=null;mutateCanonical=e=>{e.selections[0].slug='unrecognized-type'};r=await run6(p);verify6(r,p);eq(r.hydratedListingCount,3,'unknown basis/missing denominator/price remains');
 const good=r,original=p;const other=await setup6(1);
 for(const[e,f]of[[null,original.f],[copy(original.e),original.f],[original.e,copy(original.f)],[other.e,original.f],[original.e,other.f],[original.e,null],[original.e,{...copy(original.f),listingIds:[listingId(1),listingId(1)]}]]){
  const before=trace6.length;r=await hydration.hydratePhase14Survivors(e,f);eq(r.state,'invalid_execution');eq(trace6.length,before,'zero invalid provenance I/O');
 }
 for(const state of['anonymous','unentitled']){stage6=false;stage5=false;stage4=false;auth=state!=='anonymous';entitled=false;const before=trace6.length;await assert.rejects(()=>commit());checks++;eq(trace6.length,before)}auth=entitled=true;stage6=true;
 function frozen(v){if(v&&typeof v==='object'){ok(Object.isFrozen(v),'recursive freeze');for(const child of Object.values(v))frozen(child)}}frozen(good);
 ok(!Reflect.set(good.evidenceByListingId[listingId(1)].scalars,'currency','EUR'),'immutable scalar');ok(!Reflect.set(original.f.listingIds,'0',listingId(999)),'upstream immutable');
 for(const[v,e,f]of[[copy(good),original.e,original.f],[good,other.e,original.f],[good,original.e,copy(original.f)]]){assert.throws(()=>hydration.assertPhase14HydratedPopulationForExecution(v,e,f));checks++}
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;',{fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-hydrated-population.ts','lib/phase14-fact-population.ts','lib/canonical-listing-reader.ts','lib/phase14-membership-population.ts','lib/phase14-fundamental-population.ts','lib/phase14-geographic-population.ts','lib/phase14-question.ts','lib/phase14-question-commit.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,counts,failures,clientRoots:graph.roots,runtimeModules:graph.modules,violations:0,liveIO:false,fx:0,bccr:0},null,2));
}
return run();

`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
