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
for(const f of['phase14-analytical-execution','phase14-analytical-population','price-meter-identity','price-meter-observation-builder','price-meter-construction-land','analysis-date','fx/fx-service'])allowed.add('lib/'+f+'.ts');
let fxMode='exact',fxCalls=0,providerCalls=0,registryReads=0,registryWrites=0,registered=false,priorRegistered=false,fxDate='',dateCalls=0,identityCalls=0,observationCalls=0,ratioCalls=0;
const rateFor=(date,prior=false)=>({baseCurrency:'USD',quoteCurrency:'CRC',rate:500,rateType:'reference_sale',source:'BCCR',analyticalDate:date,effectiveDate:prior?'2020-01-01':date,resolutionMode:prior?'latest_applicable_prior_observation':'exact'});
cache.set('lib/fx/fx-resolver.ts',{exports:{resolveExactHistoricalFxRate:async d=>{registryReads++;fxDate=d;if(fxMode==='bad-rate')return{...rateFor(d),rate:NaN};if(fxMode==='bad-date')return{...rateFor(d),analyticalDate:'2020-01-01'};if(fxMode==='bad-source')return{...rateFor(d),source:'invented'};if(fxMode==='cached'||registered)return rateFor(d);return null},resolvePriorHistoricalFxRate:async d=>{registryReads++;return priorRegistered?rateFor(d,true):null}}});
cache.set('lib/fx/bccr-provider.ts',{exports:{fetchBccrReferenceSaleRate:async d=>{providerCalls++;if(fxMode==='failure')throw Error('private provider diagnostic');if(fxMode==='prior'||fxMode==='absent')return null;return{effectiveDate:d}},fetchBccrReferenceSaleRates:async()=>{providerCalls++;return fxMode==='absent'?[]:[{effectiveDate:'2020-01-01'}]}}});
cache.set('lib/fx/fx-registry.ts',{exports:{registerFxObservation:async o=>{registryWrites++;if(o.effectiveDate===fxDate)registered=true;else priorRegistered=true}}});
const service=load('lib/fx/fx-service.ts'),realFx=service.getHistoricalUsdToCrcRate;service.getHistoricalUsdToCrcRate=async d=>{fxCalls++;return realFx(d)};
const dates=load('lib/analysis-date.ts'),realDate=dates.getCurrentAnalyticalDate;dates.getCurrentAnalyticalDate=()=>{dateCalls++;return realDate()};
const maths=load('lib/price-meter-identity.ts'),realIdentity=maths.resolvePriceMeterAnalyticalIdentity;maths.resolvePriceMeterAnalyticalIdentity=(...a)=>{identityCalls++;return realIdentity(...a)};
const builder=load('lib/price-meter-observation-builder.ts'),realBuilder=builder.buildPriceMeterObservations;builder.buildPriceMeterObservations=(...a)=>{observationCalls++;return realBuilder(...a)};
const ratios=load('lib/price-meter-construction-land.ts'),realRatio=ratios.resolvePriceMeterConstructionLandIdentity;ratios.resolvePriceMeterConstructionLandIdentity=(...a)=>{ratioCalls++;return realRatio(...a)};
const analytical=load('lib/phase14-analytical-execution.ts'),step7=load('lib/phase14-analytical-population.ts');
let doing7=false,forbiddenReads=0;
const from6=db.from.bind(db),rpc6=db.rpc.bind(db);
db.from=(...a)=>{if(doing7){forbiddenReads++;throw Error('Step7 listing read prohibited')}return from6(...a)};
db.rpc=(...a)=>{if(doing7){forbiddenReads++;throw Error('Step7 hydration RPC prohibited')}return rpc6(...a)};
function reset7(mode='exact'){fxMode=mode;fxCalls=providerCalls=registryReads=registryWrites=dateCalls=identityCalls=observationCalls=ratioCalls=forbiddenReads=0;registered=priorRegistered=false;fxDate=''}
async function fixture7(n=1,options={}){
 doing7=false;const p=await setup6(n,{},options.tx||'sale');
 for(const [id,row]of rows6){Object.assign(row,{currency:'CRC',current_price:'100000',monthly_price:'2000'},options.row||{});if(options.change)options.change(row,Number(id.slice(-12)))}
 if(options.slug!==undefined)mutateCanonical=e=>{e.selections[0].slug=options.slug;e.selections[0].term_name=options.slug===null?'House':options.slug};
 const h=await run6(p);ok(h.state==='complete','real Step6 hydration');doing7=true;reset7(options.fxMode);return{...p,h};
}
async function run7(p,basis='land'){const a=await analytical.commitPhase14AnalyticalExecution(p.e,basis);return{a,r:await step7.executePhase14AnalyticalEligibility(a,p.h)}}
function verify7(r,p,basis){
 ok(r.state==='complete','complete Step7 '+JSON.stringify(r.state==='complete'?'':r));eq(r.normalizationBasis,basis);eq(r.hydratedInputCount,p.h.hydratedListingCount);eq(r.decisions.map(d=>d.listingId),p.h.listingIds);eq(r.authorizedObservationCount+r.excludedListingCount,p.h.hydratedListingCount);eq(r.observations.length,r.authorizedObservationCount);eq(Object.values(r.gateCounts.propertyBasis).reduce((a,b)=>a+b,0),r.hydratedInputCount);eq(r.gateCounts.monetaryEligibleCount+r.gateCounts.monetaryNotEstablishedCount,r.hydratedInputCount);eq(r.gateCounts.evaluation,'independent_not_sequential');eq(new Set(r.observations.map(x=>x.observation.listingId)).size,r.authorizedObservationCount);ok(r.hydratedPopulation===p.h,'evidence reuse');ok(!r.completeness.snapshotGuaranteed,'snapshot limitation');
 for(const d of r.decisions){if(d.state==='excluded')ok(d.reasons.length>0,'explicit exclusions');else eq(r.observations.filter(o=>o.observation.listingId===d.listingId).length,1)}
 for(const x of r.observations){const o=x.observation;eq(o.normalizationBasis,basis);eq(o.transactionType,p.e.question.transaction);eq(x.unit,o.transactionType==='sale'?'CRC/m²':'CRC/m²/month');eq(o.areaM2,basis==='land'?o.analyticalIdentity.propertyArea.exactM2:o.analyticalIdentity.constructionArea.exactM2);eq(o.pricePerM2,o.analyticalPrice/o.areaM2);eq(o.fx.analyticalDate,r.analyticalDate);ok(o.analyticalIdentity.siteCoverage===null,'never Site Coverage')}
 eq(forbiddenReads,0,'no listing/membership/hydration reads');step7.assertPhase14AnalyticalPopulationForExecution(r,r.execution,p.h);checks++;
}
allowed.add('lib/phase14-complete-analytical-population.ts');const complete8=load('lib/phase14-complete-analytical-population.ts');
// Inspect the private invariant checker in an isolated transpiled test instance. No production test API.
const checkModule={exports:{}};const checkSource=fs.readFileSync(root+'/lib/phase14-complete-analytical-population.ts','utf8')+'\nexport const testValidateChain = validateChain;';
new Function('module','exports','require',ts.transpileModule(checkSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(checkModule,checkModule.exports,name=>name==='server-only'?{}:load(path.posix.normalize('lib/'+name)+'.ts'));
const independent=checkModule.exports.testValidateChain;
const fullFilters=()=>({semantics:{environment:['3'],terrain:['5'],utility:['6'],accessibility:['7'],legal_status:['8']},facts:{bedrooms:[{kind:'exact',value:'3'}],bathrooms:[{kind:'exact',value:'3'}],parking:[{kind:'exact',value:'3'}],year_built:[{kind:'exact',value:'2018'}]},propertyArea:'100-500m2',constructionArea:'100-200m2'});
async function fixture8({n=4,F=n,P=F,S=P,Q=S,filters={},tx='sale',geo='district',slug='house',change=null}={}){
 doing7=false;stage6=false;stage5=false;stage4=false;fixture(n);assignments=[];trace4=[];fault4='ok';cap4=500;
 const input=base();input.question.transaction=tx;input.question.filters=filters;input.question.geography={level:geo,officialCode:geo==='district'?'10101':geo==='canton'?'101':'1'};
 if(geo!=='district')members.forEach(r=>r.ontology_term_id=geo==='canton'?'102':'101');
 eligibility=new Map(nums(n).map(i=>[listingId(i),{canonical_domain_version:1,listing_status:i<=F?'active':'draft',transaction_type:tx}]));
 const p={e:await commit(input)};p.g=await starting(p.e);p.fund=await acquire(p.e,p.g);
 assign(nums(P),['9007199254740993']);for(const ts of Object.values(filters.semantics||{}))assign(nums(S),ts);
 p.m=await step4({e:p.e,f:p.fund});ok(p.m.state==='complete','real Step4');
 factRows=new Map();scalarRows=new Map();categoryRows=[];trace5=[];error5='ok';cap5=500;
 for(const i of nums(n)){area(i,'200','100');for(const dim of factDims)put(i,exact(dim,dim==='year_built'?(i<=Q?'2018':'2010'):(i<=Q?'3':'2')))}
 p.f=await run5(p);ok(p.f.state==='complete','real Step5');
 rows6=new Map(nums(n).map(i=>{const row={id:listingId(i),canonical_domain_version:1,listing_status:'active',transaction_type:tx,currency:'CRC',current_price:'100000',monthly_price:'2000',property_area:'200',construction_area:slug==='land'?null:'100'};if(change)change(row,i);return[row.id,row]}));
 stage6=true;trace6=[];fault6='';at6=1;cap6=25;extraScalar=null;mutateCanonical=e=>{e.selections[0].slug=slug;e.selections[0].term_name=slug;if(geo==='canton')e.geography=e.geography.filter(g=>g.term_type!=='district')};
 p.h=await run6(p);ok(p.h.state==='complete','real Step6');doing7=true;reset7();return p;
}
function counters8(){return [calls.length,trace6.length,trace5.length,trace4.length,trace3.length,populationCalls.length,fxCalls,providerCalls,registryReads,registryWrites,dateCalls,identityCalls,observationCalls,ratioCalls,forbiddenReads]}
function compose8(p,r){const before=counters8();const result=complete8.composePhase14CompletePopulation(p.e,r);eq(counters8(),before,'zero external/analytical work in Step8');return result}
function verify8(r,p,s){ok(r.state==='complete','Step8 complete '+r.state);eq(r.finalAnalyticalN,s.authorizedObservationCount);eq(r.finalListingIds,s.observations.map(x=>x.observation.listingId));eq(r.analyticalExclusions.map(x=>x.listingId),s.decisions.filter(d=>d.state==='excluded').map(d=>d.listingId));ok(r.source===s&&r.observations===s.observations,'no duplicated source or observations');ok(r.ledger[0].evidence===p.g,'geography referenced');eq(r.completeness.snapshotGuaranteed,false);complete8.assertPhase14CompletePopulation(r);checks++;for(const row of r.ledger){if(row.excludedCount!==null)eq(row.inputCount,row.outputCount+row.excludedCount)}for(const x of r.analyticalExclusions)ok(s.decisions.includes(x),'exclusion reference reuse')}
allowed.add('lib/numerical-distribution.ts');allowed.add('lib/price-meter-property-position-math.ts');allowed.add('lib/phase14-comparative-discovery.ts');
allowed.add('lib/population-midrank.ts');
const numerical=load('lib/numerical-distribution.ts'),math=load('lib/price-meter-property-position-math.ts'),midrank=load('lib/population-midrank.ts');
let distributionCalls=0,groupCalls=0,intervalCalls=0,tailCalls=0,distributionFault=null,mathFault=false;
const realDistribution=numerical.buildNumericalDistribution;
numerical.buildNumericalDistribution=values=>{distributionCalls++;const d=realDistribution(values);if(distributionFault==='throw')throw Error('fixture');if(distributionFault==='n')d.sampleSize++;if(distributionFault==='null')d.median=null;if(distributionFault==='infinite')d.average=Infinity;return d};
const realMidrank=midrank.calculatePopulationMidrank;
midrank.calculatePopulationMidrank=(...args)=>{groupCalls++;if(mathFault)throw Error('fixture');return realMidrank(...args)};
const realInterval=math.classifyPropertyPositionInterval;math.classifyPropertyPositionInterval=(...args)=>{intervalCalls++;return realInterval(...args)};
const realTail=math.calculatePropertyPositionTail;math.calculatePropertyPositionTail=(...args)=>{tailCalls++;return realTail(...args)};
const discovery=load('lib/phase14-comparative-discovery.ts');
const isolated={exports:{}};
new Function('module','exports','require',ts.transpileModule(fs.readFileSync(root+'/lib/phase14-comparative-discovery.ts','utf8')+'\nexport const testValidateResult=validateResult; export const testValidateInput=validateInput;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(isolated,isolated.exports,name=>name==='server-only'?{}:load(path.posix.normalize('lib/'+name)+'.ts'));
async function fixture9(values,tx='sale',basis='land'){
 const p=await fixture8({n:values.length,tx,change:(r,i)=>{r.current_price=String(values[i-1]*(basis==='land'?200:100));r.monthly_price=r.current_price}});
 const s=(await run7(p,basis)).r;const population=compose8(p,s);verify8(population,p,s);eq(population.observations.map(o=>o.observation.pricePerM2),values);return{p,population};
}
function analyze9(p,population){const before=counters8(),d=distributionCalls,g=groupCalls,i=intervalCalls,t=tailCalls;const r=discovery.analyzePhase14Population(p.e,population);eq(counters8(),before,'zero Step9 external work');if(r.state==='complete'){eq(distributionCalls-d,1,'one distribution');const unique=new Set(population.observations.map(o=>o.observation.pricePerM2)).size;eq(groupCalls-g,unique);eq(intervalCalls-i,unique);eq(tailCalls-t,unique)}return r}
function verify9(r,population){ok(r.state==='complete','Step9 '+r.state);eq(r.n,population.finalAnalyticalN);eq(r.n,r.distribution.statistics.sampleSize);eq(r.n,r.distribution.n);eq(r.n,r.comparisons.length);ok(r.population===population);eq(r.completeness.snapshotGuaranteed,false);eq(r.comparisons.map(x=>x.listingId),population.finalListingIds);discovery.assertPhase14DiscoveryForPopulation(r,population);checks++;
 const values=population.observations.map(o=>o.observation.pricePerM2);
 for(const [i,x]of r.comparisons.entries()){ok(x.observation===population.observations[i]);ok(x.distribution===r.distribution);eq(x.evidence.pricePerM2,values[i]);eq(x.evidence.participation,'population_member');eq(x.evidence.percentileMethod,'midrank');eq(x.evidence.belowCount+x.evidence.equalCount+x.evidence.aboveCount,r.n);eq(x.observation.unit,r.unit);eq(x.observation.observation.normalizationBasis,r.normalization);eq(x.observation.observation.transactionType,r.transaction)}
 for(const key of ['selectedCandidates','topCandidates','recommendedCandidates','candidateLimit','rankedCandidates','score','similarity','weight','distance','recommendation','quality','confidence','subjectListingId']){ok(!(key in r));for(const x of r.comparisons)ok(!(key in x)&&!(key in x.evidence))}
}
function approx(a,b){ok(Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),String(a)+' ~= '+b)}
let differenceCalls=0,scanCalls=0,buildCalls=0,sortComparisons=0;
const originalDifference=math.calculatePropertyPositionDifference;math.calculatePropertyPositionDifference=(...a)=>{differenceCalls++;return originalDifference(...a)};
const originalScan=math.calculatePropertyPositionCounts;math.calculatePropertyPositionCounts=(...a)=>{scanCalls++;return originalScan(...a)};
const tenSource=fs.readFileSync(root+'/lib/phase14-discovery-results.ts','utf8');
const tenModule={exports:{}};
const tenInstrumented=tenSource.replace('  validateSource(source)\n','  trackBuild()\n  validateSource(source)\n').replace('  const av = a.evidence.pricePerM2','  trackComparison()\n  const av = a.evidence.pricePerM2')+'\nexport const testValidateResults=validateResults; export const testValidateSource=validateSource; export const testCompareResults=compareResults;';
new Function('module','exports','require','trackBuild','trackComparison',ts.transpileModule(tenInstrumented,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(tenModule,tenModule.exports,name=>name==='server-only'?{}:load(path.posix.normalize('lib/'+name)+'.ts'),()=>buildCalls++,()=>sortComparisons++);
const ten=tenModule.exports;
function analyticalCounters(){return[distributionCalls,groupCalls,intervalCalls,tailCalls,differenceCalls,scanCalls]}
function compose10(p,s){const ext=counters8(),calc=analyticalCounters();const r=ten.composePhase14DiscoveryResults(p.e,s);eq(counters8(),ext,'Step10 zero external work');eq(analyticalCounters(),calc,'Step10 zero metric calculations');return r}
function verify10(r,s){ok(r.state==='complete','Step10 '+r.state);eq(r.n,s.n);eq(r.resultCount,s.n);eq(r.results.length,s.comparisons.length);eq(r.n,s.population.finalAnalyticalN);ok(r.source===s&&r.distribution===s.distribution);eq(r.completeness.snapshotGuaranteed,false);eq(r.analyticalQuestionIdentity,s.analyticalQuestionIdentity);eq(r.executionAttemptId,s.executionAttemptId);eq(r.normalization,s.normalization);eq(r.transaction,s.transaction);eq(r.unit,s.unit);eq(r.resultOrder,{primary:'price_per_square_meter_ascending',exactTieOrder:'canonical_listing_id_ascending',exactTieOrderMeaning:'transport_only'});
 const originals=new Map(s.comparisons.map(x=>[x.listingId,x]));eq(new Set(r.results.map(x=>x.listingId)).size,s.n);eq([...r.results.map(x=>x.listingId)].sort(),[...originals.keys()].sort());
 for(const [i,x]of r.results.entries()){ok(originals.get(x.listingId)===x,'exact comparison identity');ok(x.distribution===s.distribution);ok(x.observation===originals.get(x.listingId).observation);if(i){const prev=r.results[i-1];ok(prev.evidence.pricePerM2<=x.evidence.pricePerM2);if(prev.evidence.pricePerM2===x.evidence.pricePerM2){ok(prev.listingId<x.listingId);ok(prev.evidence===x.evidence,'shared tie evidence')}}}
 ten.assertPhase14ResultsForDiscovery(r,s);checks++;
 for(const obj of[r,r.resultOrder,...r.results])for(const key of ['rank','score','selected','recommended','candidateScore','similarityScore','qualityScore','confidence','weight','distance','best','top','subjectListingId','peerListingId','pageSize','cursor','offset','hasMore','resultLimit','topN'])ok(!(key in obj));
}
async function run(){
 const cases=[];let f,s,r;
 for(const values of [[],[100],[200,100],[300,100,200],[2,10,100],[200,100,100,300],[100,100,100,100],[300,100,1000000,200,400],Array.from({length:21},(_,i)=>(21-i)*100),[0.125,1.25,0.5]]){
  f=await fixture9(values);s=analyze9(f.p,f.population);verify9(s,f.population);const before=s.comparisons.map(x=>x.listingId);r=compose10(f.p,s);verify10(r,s);eq(s.comparisons.map(x=>x.listingId),before,'upstream identity order unchanged');cases.push({n:s.n,ordered:r.results.map(x=>x.evidence.pricePerM2)});
  if(values.length===3&&values[0]===300)eq(r.results.map(x=>x.listingId),[listingId(2),listingId(3),listingId(1)]);
  if(values[0]===2)eq(r.results.map(x=>x.evidence.pricePerM2),[2,10,100]);
  if(values.length===4&&values[0]===200)eq(r.results.map(x=>x.listingId),[listingId(2),listingId(3),listingId(1),listingId(4)]);
  if(values.length===21){eq([...new Set(r.results.map(x=>x.evidence.interval))].sort(),['below_p10','p10_to_p25','p25_to_median','at_median','median_to_p75','p75_to_p90','above_p90'].sort());ok(r.results.some(x=>x.evidence.strictTail));ok(r.results.some(x=>x.evidence.strictTail===null));eq([...new Set(r.results.map(x=>Math.sign(x.evidence.differenceFromMedian)))].sort(),[-1,0,1]);}
 }

 const tiedFixture=await fixture9([100,100,100,100]);const tiedSource=analyze9(tiedFixture.p,tiedFixture.population),tiedResult=compose10(tiedFixture.p,tiedSource);
 eq([...tiedResult.results].reverse().sort(ten.testCompareResults).map(x=>x.listingId),tiedResult.results.map(x=>x.listingId));
 const reversedTies=structuredClone(tiedResult);reversedTies.results.reverse();assert.throws(()=>ten.testValidateResults(reversedTies,reversedTies.source));checks++;
 const small={f,s,r};
 for(const tx of['sale','rent'])for(const basis of['land','construction']){f=await fixture9([300,100,200],tx,basis);s=analyze9(f.p,f.population);r=compose10(f.p,s);verify10(r,s);eq(r.transaction,tx);eq(r.normalization,basis);eq(r.unit,tx==='sale'?'CRC/m²':'CRC/m²/month')}
 const large=[];
 for(const values of[Array.from({length:1001},(_,i)=>(1001-i)*100),Array.from({length:1001},(_,i)=>(5-i%5)*100)]){f=await fixture9(values);s=analyze9(f.p,f.population);const before=sortComparisons;r=compose10(f.p,s);verify10(r,s);const comparisons=sortComparisons-before;ok(comparisons<1001*30,'nonquadratic ordering operation bound');large.push({n:r.n,distinct:new Set(values).size,orderingComparisonsIncludingValidation:comparisons})}
 const good={f,s,r};
 const variants=[];for(const filters of[{}, {facts:{bedrooms:[{kind:'exact',value:'3'}]}}]){const p=await fixture8({n:3,filters});const pop=compose8(p,(await run7(p)).r);const src=analyze9(p,pop);const result=compose10(p,src);verify10(result,src);variants.push({p,src,result})}
 eq(variants[0].result.results.map(x=>x.listingId),variants[1].result.results.map(x=>x.listingId));eq(variants[0].result.results.map(x=>x.evidence.pricePerM2),variants[1].result.results.map(x=>x.evidence.pricePerM2));ok(variants[0].result.analyticalQuestionIdentity!==variants[1].result.analyticalQuestionIdentity);
 const shared=await fixture8({n:4});const byBasis=[];for(const basis of['land','construction']){const pop=compose8(shared,(await run7(shared,basis)).r),src=analyze9(shared,pop),result=compose10(shared,src);verify10(result,src);byBasis.push({src,result})}eq(byBasis[0].result.results.map(x=>x.listingId),byBasis[1].result.results.map(x=>x.listingId));ok(byBasis[0].result.analyticalQuestionIdentity!==byBasis[1].result.analyticalQuestionIdentity);
 const sameAttempt=await fixture9([0.125,1.25,0.5]);const sameSource=analyze9(sameAttempt.p,sameAttempt.population),sameResult=compose10(sameAttempt.p,sameSource);eq(sameResult.analyticalQuestionIdentity,small.r.analyticalQuestionIdentity);ok(sameResult.executionAttemptId!==small.r.executionAttemptId);assert.throws(()=>ten.assertPhase14ResultsForDiscovery(small.r,sameSource));checks++;
 for(const[env,src]of[[copy(small.f.p.e),small.s],[small.f.p.e,structuredClone(small.s)],[sameAttempt.p.e,small.s],[small.f.p.e,null],[small.f.p.e,{state:'execution_failed'}],[small.f.p.e,{state:'complete'}]]){const b=buildCalls,ext=counters8(),calc=analyticalCounters();eq(ten.composePhase14DiscoveryResults(env,src).state,'invalid_execution');eq(buildCalls,b,'zero construction for invalid provenance');eq(counters8(),ext);eq(analyticalCounters(),calc)}
 assert.throws(()=>ten.assertPhase14ResultsForDiscovery(structuredClone(small.r),small.s));checks++;
 assert.throws(()=>ten.assertPhase14ResultsForDiscovery(byBasis[0].result,byBasis[1].src));checks++;
 // Exercise the real private guards independently of object-authenticity rejection.
 const mutations=[
 ['missing',x=>x.results.pop()],['unexpected',x=>x.results[0]={...x.results[0],listingId:listingId(9999)}],['duplicate',x=>x.results[1]=x.results[0]],
 ['wrong record',x=>x.results[0]={...x.results[0],evidence:x.results[1].evidence}],['wrong distribution',x=>x.distribution=structuredClone(x.distribution)],['wrong result distribution',x=>x.results[0]={...x.results[0],distribution:structuredClone(x.distribution)}],
 ['n',x=>x.n++],['resultCount',x=>x.resultCount++],['normalization',x=>x.normalization='construction'],['transaction',x=>x.transaction='rent'],['unit',x=>x.unit='CRC/m²/month'],['question',x=>x.analyticalQuestionIdentity='other'],['attempt',x=>x.executionAttemptId='other'],
 ['source substitution',x=>x.source=structuredClone(x.source)],['order',x=>x.results.reverse()],['tie meaning',x=>x.resultOrder.exactTieOrderMeaning='analytical'],['version',x=>x.contractVersion=2],['snapshot',x=>x.completeness.snapshotGuaranteed=true]
 ];
 const baseline=structuredClone(small.r);ten.testValidateSource(baseline.source);ten.testValidateResults(baseline,baseline.source);checks++;
 for(const[label,mutate]of mutations){const x=structuredClone(small.r),src=x.source;mutate(x);assert.throws(()=>ten.testValidateResults(x,src),undefined,label);checks++}
 let sourceFaults=0;
 for(const value of[NaN,Infinity,-Infinity,0,-1]){const x=structuredClone(small.s);x.comparisons[0].evidence.pricePerM2=value;assert.throws(()=>ten.testValidateSource(x));checks++;sourceFaults++}
 for(const mutate of[x=>x.comparisons[0].evidence.pricePerM2++,x=>x.comparisons[0].listingId=listingId(9999),x=>x.comparisons[0].observation=structuredClone(x.comparisons[0].observation),x=>x.comparisons[0].distribution=structuredClone(x.distribution),x=>x.n++,x=>x.distribution.statistics.sampleSize++,x=>x.comparisons[1]=x.comparisons[0]]){const x=structuredClone(small.s);mutate(x);assert.throws(()=>ten.testValidateSource(x));checks++;sourceFaults++}
 for(const tx of['sale','rent'])for(const basis of['land','construction']){const f=await fixture9([100,200],tx,basis),src=analyze9(f.p,f.population),res=compose10(f.p,src);for(const[field,value]of[['normalization',basis==='land'?'construction':'land'],['transaction',tx==='sale'?'rent':'sale'],['unit',tx==='sale'?'CRC/m²/month':'CRC/m²']]){const x=structuredClone(res);x[field]=value;assert.throws(()=>ten.testValidateResults(x,x.source));checks++}}
 // Failure during actual ordering yields no partially completed set.
 const nativeSort=Array.prototype.sort;
 try{Array.prototype.sort=function(){throw Error('offline ordering failure')};const failed=compose10(small.f.p,small.s);eq(failed.state,'execution_failed');ok(!('results'in failed));ok(!('n'in failed))}finally{Array.prototype.sort=nativeSort}
 function frozen(v,seen=new Set()){if(v&&typeof v==='object'&&!seen.has(v)){seen.add(v);ok(Object.isFrozen(v));for(const child of Object.values(v))frozen(child,seen)}}frozen(small.r);
 for(const[obj,key,value]of[[small.r,'n',0],[small.r.results,'0',null],[small.r.resultOrder,'primary','other'],[small.r.distribution.statistics,'median',0],[small.r.results[0].evidence,'pricePerM2',0]])ok(!Reflect.set(obj,key,value));
 ok(!/\b(cheap|expensive|premium|discount|undervalued|overpriced|valuation|recommended|confidence|subjectListingId|SUBJECT_INCLUDED|SUBJECT_EXTERNAL|pageSize|topN)\b/.test(tenSource));
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;',{fs,path,cp,root,ts,ok,forbidden:new Set(['lib/phase14-discovery-results.ts','lib/phase14-comparative-discovery.ts']),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,cases,large,resultCorruptionCases:mutations.length,sourceCorruptionCases:sourceFaults,inverseIdentityCases:12,externalCalls:0,metricCalls:0,invalidProvenanceConstructionCalls:0,clientRoots:graph.roots,runtimeModules:graph.modules,violations:0,liveIO:false},null,2));
}
return run();
`;
new Function('require','__dirname',harness+'\n'+scenarios)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
