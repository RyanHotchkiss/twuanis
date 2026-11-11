const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let checks=0,mode='normal',calls=[],rpcIds=[],fxCalls=0;
const ok=(value,label)=>{assert.ok(value,label);checks++}, uuid=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
const term=(id,type,code,parent,level)=>({id:String(id),term_type:type,official_code:code,parent_id:parent===null?null:String(parent),level,term_name:code,term_name_en:code,term_name_es:code,slug:code,slug_en:code,slug_es:code});
const province=term('9007199254740993','province','3',null,1),canton=term('9007199254740994','canton','304',province.id,2);
const terms=[{id:1,term_type:'property_type',term_name:'House',slug:'house'},{id:2,term_type:'year_built',term_name:'Recorded category',slug:'recorded'},{id:3,term_type:'bedrooms',term_name:'Three',slug:'three'},{id:4,term_type:'property_type',term_name:'Land',slug:'land'},province,canton].map(t=>({level:1,...t,term_name_en:t.term_name,term_name_es:t.term_name,slug_en:t.slug,slug_es:t.slug}));
const listing=(i,extra={})=>({id:uuid(i),canonical_domain_version:1,listing_status:'active',transaction_type:'sale',currency:'CRC',current_price:100000+i*1000,price_millions:999,monthly_price:null,property_area:200,construction_area:100,property_type:'WRONG LEGACY TYPE',province:'WRONG',canton:'WRONG',district:null,year_built_range:i%2?'1995':'[1985,1995]',...extra});
const rows=[listing(1),...Array.from({length:27},(_,i)=>listing(i+2)),listing(30,{canonical_domain_version:null}),listing(31,{transaction_type:'rent',monthly_price:500}),listing(32,{listing_status:'draft'}),listing(33,{property_area:9999}),listing(34,{construction_area:null}),listing(35,{current_price:0}),listing(36)];
const assignments=rows.flatMap(l=>[province.id,canton.id,l.id===uuid(36)?4:1,3,...(Number(l.id.slice(-12))%2?[2]:[])].map(id=>({listing_id:l.id,ontology_term_id:String(id),ontology_terms:terms.find(t=>String(t.id)===String(id))})));
const rowFor=id=>rows.find(r=>r.id===id);
const db={from(table){let filters=[],orders=[],start=0,end=499,single=false,cols;const q={limit(v){end=v-1;return q},retry(){return q},select(c){cols=c;return q},eq(k,v){filters.push(['eq',k,v]);return q},neq(k,v){filters.push(['neq',k,v]);return q},is(k,v){filters.push(['eq',k,v]);return q},in(k,v){assert.ok(v.length<=25);filters.push(['in',k,v]);return q},gte(k,v){filters.push(['gte',k,v]);return q},lt(k,v){filters.push(['lt',k,v]);return q},order(k){orders.push(k);return q},range(a,b){start=a;end=b;return q},maybeSingle(){single=true;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 calls.push({table,filters,cols,start,single});
 let data=(table==='ontology_terms'?terms:table==='listings'?rows:assignments).filter(row=>filters.every(([op,k,v])=>{if(/^m\d+\.ontology_term_id$/.test(k))return assignments.some(a=>a.listing_id===row.id&&v.includes(a.ontology_term_id));const actual=k.startsWith('listings.')?rowFor(row.listing_id)[k.slice(9)]:k.startsWith('ontology_terms.')?row.ontology_terms[k.slice(15)]:row[k];return op==='eq'?String(actual)===String(v):op==='neq'?String(actual)!==String(v):op==='in'?v.map(String).includes(String(actual)):op==='gte'?actual!==null&&actual>=v:actual!==null&&actual<v}));
 data=data.slice().sort((a,b)=>{for(const k of orders){if(a[k]!==b[k])return String(a[k])<String(b[k])?-1:1}return 0});
 const count=data.length;
 if(single)return {data:data[0]??null,error:null};
 const failing=mode==='query-error'||(mode==='listing-error'&&table==='listings');
 const page=data.slice(start,Math.min(end+1,start+2));calls[calls.length-1].returned=page.map(row=>row.id??row.listing_id);if(table==='ontology_terms'&&cols.includes('id::text'))for(const row of page)row.id=String(row.id);return {data:mode==='truncated'&&start>0?[]:page,count:mode==='missing-count'?null:count+(mode==='changed-count'&&start>0?1:0),error:failing?Error('injected query failure'):null};
 }).then(resolve,reject)}};return q},rpc(name,args){if(name==='read_legacy_geographic_candidates')return {range:async()=>({data:[],count:0,error:null})};return Promise.resolve((()=>{assert.equal(name,'read_canonical_listing_evidence');assert.ok(args.p_listing_ids.length<=25);assert.ok(args.p_fact_dimensions.every(d=>d==='year_built'));rpcIds.push(...args.p_listing_ids);if(mode==='hydrate-error'&&rpcIds.length>1)return {error:Error('injected hydration failure'),data:null};return {error:null,data:args.p_listing_ids.map(id=>({listing_id:id,canonical_domain_version:1,geography:[province,canton],facts:args.p_fact_dimensions.includes('year_built')?[{dimension:'year_built',kind:'exact',exact_value:Number(id.slice(-12))%2?'1985':'1995',category_term_id:null,range_lower:null,range_upper:null,lower_inclusive:null,upper_inclusive:null}]:[],selections:[{dimension:'property_type',ontology_term_id:id===uuid(36)?'4':'1',term_type:'property_type',level:1,slug:id===uuid(36)?'land':'house',term_name:id===uuid(36)?'Land':'House'}]}))}})())}};
const mocks={'@/lib/supabase':{supabase:db},'@/app/utils/resolveListingImages':{resolveListingImages:x=>x},'@/lib/supabase-admin':{supabaseAdmin:db},'@/lib/analysis-date':{getCurrentAnalyticalDate:()=> '2026-09-19'},'@/lib/fx/fx-service':{async getHistoricalUsdToCrcRate(date){fxCalls++;return {analyticalDate:date,effectiveDate:date,rate:500,resolutionMode:'exact'}}},'@/lib/geography/resolve-listing-geography':{loadCanonicalGeographyTerms(){throw Error('Canonical path attempted legacy geography dictionary')}}};
const context=vm.createContext({console,Date,URLSearchParams});const cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);
const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const requireLocal=k=>{if(k==='server-only')return{};if(mocks[k])return mocks[k];if(k.startsWith('.')&&mocks['@/'+path.relative(root,path.resolve(path.dirname(file),k))])return mocks['@/'+path.relative(root,path.resolve(path.dirname(file),k))];if(k.startsWith('@/'))return load(k.slice(2)+'.ts');if(k.startsWith('.'))return load(path.resolve(path.dirname(file),k)+'.ts');throw Error('Forbidden dependency '+k)};
vm.runInContext('(function(module,exports,require){'+code+'\n})',context,{filename:file})(m,m.exports,requireLocal);return m.exports}

(async()=>{
 if(process.argv.includes('--selectors')) {
  const run=property_type=>load('lib/statistics-engine.ts').getMatchingListings({province:'3',canton:'304',property_type,transaction_type:'sale'},undefined,[]);
  for(const value of ['house,unknown-type','unknown-type']){
    rpcIds=[];await assert.rejects(()=>run(value),/Unresolved or ambiguous/);
    ok(rpcIds.length===0,'unresolved identity fails before hydration '+value);
  }
  terms.push({...terms[0],id:'999',slug:'house'});rpcIds=[];
  await assert.rejects(()=>run('house'),/Unresolved or ambiguous/);ok(rpcIds.length===0,'ambiguous identity fails before hydration');terms.pop();
  const multi=await run('house,land');ok(multi.some(r=>r.id===uuid(36))&&multi.some(r=>r.id===uuid(1)),'OR within property type retained');
  const duplicate=await run('house,house');ok(!duplicate.some(r=>r.id===uuid(36))&&new Set(duplicate.map(r=>r.id)).size===duplicate.length,'repeated selected slug does not duplicate evidence');
  const selected=await load('lib/statistics-engine.ts').getMatchingListings({province:'3',canton:'304',property_type:'house',year_built:'1980s',transaction_type:'sale'},undefined,[]);
  ok(selected.length>0&&selected.every(r=>Number(r.id.slice(-12))%2===1),'typed exact Year Built and canonical property type both required');
  console.log('S9 SELECTOR checks',checks);return;
 }



 if(process.argv.includes('--failures')) {
  for(const failure of ['query-error','listing-error','missing-count','changed-count','truncated','hydrate-error']){
    mode=failure;calls=[];rpcIds=[];
    const filters={province:'3',canton:'304',property_type:'house',transaction_type:'sale'};
    await assert.rejects(()=>load('lib/price-meter-engine.ts').getPriceMeterAnalysis(filters,'en',load('lib/price-meter-apply-permit.ts').issuePriceMeterApplyPermit(filters,'en')));
    ok(rpcIds.length===new Set(rpcIds).size,'failure does not restart canonical hydration '+failure);
  }
  console.log('S9 ORDINARY FAILURE checks',checks);return;
 }
 if(process.argv.includes('--geographic-bound')) {
  const foreign=listing(40);rows.push(foreign);const otherProvince=term('5000','province','1',null,1),otherCanton=term('5001','canton','101','5000',2);terms.push(otherProvince,otherCanton);assignments.push(...[otherProvince,otherCanton].map(t=>({listing_id:foreign.id,ontology_term_id:t.id,ontology_terms:t})));assignments.push({listing_id:foreign.id,ontology_term_id:'1',ontology_terms:terms.find(t=>String(t.id)==='1')});
  await load('lib/statistics-engine.ts').getMatchingListings({province:'3',canton:'304',property_type:'house',transaction_type:'sale'},undefined,[]);
  const returned=calls.filter(c=>c.table==='listings_ontology_terms').flatMap(c=>c.returned??[]);
  ok(!returned.includes(foreign.id),'membership acquisition excludes an out-of-geography listing sharing the selected property type');
  console.log('S9 GEOGRAPHIC BOUND',checks);return;
 }
 if(process.argv.includes('--variants')) {
  const engine=load('lib/price-meter-engine.ts'),permit=load('lib/price-meter-apply-permit.ts');
  async function run(transaction_type,property_type){calls=[];rpcIds=[];fxCalls=0;const filters={province:'3',canton:'304',transaction_type,property_type};return engine.getPriceMeterAnalysis(filters,'es',permit.issuePriceMeterApplyPermit(filters,'es'))}
  if(!process.argv.includes('--land')){rows[0].currency='USD';const usd=await run('sale','house');
  ok(fxCalls===1,'mixed CRC/USD resolves one shared FX identity');
  ok(rows[0].currency==='USD'&&rows[0].current_price===101000,'analytical conversion does not overwrite original denomination');
  ok(usd.observations.every(o=>o.transactionType==='sale'),'mixed input preserves Sale sovereignty');
  ok(rpcIds.length===new Set(rpcIds).size,'mixed-currency hydration remains once per listing');
  const rent=await run('rent','house');ok(rent.observations.length===2&&rent.observations.every(o=>o.transactionType==='rent'),'Rent acquisition excludes Sale and preserves independent land/construction observations');
  ok(rpcIds.length===1&&rpcIds[0]===uuid(31),'Rent bounds before hydration');}
  const property=terms.find(t=>String(t.id)==='4');property.slug='land';
  // Evidence RPC must return this fixture's actual selected property identity.
  const land=await run('sale','land');
  ok(rpcIds.length===1&&rpcIds[0]===uuid(36),'land population bounded by positive property membership');
  ok(land.observations.length===0,'contradictory land plus construction fails closed');
  rowFor(uuid(36)).construction_area=null;const validLand=await run('sale','land');
  ok(validLand.observations.length===1&&validLand.observations[0].propertyBasis==='land_only'&&validLand.observations[0].normalizationBasis==='land','affirmative land with missing construction makes land-only universe');
  console.log('S9 ORDINARY VARIANTS',checks);return;
 }
 const filters={province:'3',canton:'304',property_type:'house',transaction_type:'sale'};
 const permit=load('lib/price-meter-apply-permit.ts').issuePriceMeterApplyPermit(filters,'en');
 const result=await load('lib/price-meter-engine.ts').getPriceMeterAnalysis(filters,'en',permit);
 ok(result.observations.length>0,'actual shared population to actual ordinary engine');
 ok(rpcIds.length===new Set(rpcIds).size,'canonical evidence hydrated once per listing');
 ok(!rpcIds.includes(uuid(30))&&!rpcIds.includes(uuid(31))&&!rpcIds.includes(uuid(32))&&!rpcIds.includes(uuid(36)),'legacy/rent/draft/type excluded before hydration');
 ok(fxCalls===0,'CRC canonical chain no FX');
 console.log('S9 FULL ORDINARY ACQUISITION',JSON.stringify({checks,queries:calls.length,hydrated:rpcIds.length,observations:result.observations.length,modules:cache.size}));
})().catch(e=>{console.error(e);process.exitCode=1});
