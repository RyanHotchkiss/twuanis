const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=(process.env.S6_REPO_ROOT||require('node:path').resolve(__dirname,'../..')), ts=require(root+'/node_modules/typescript');let checks=0;
function ok(v,msg){assert.ok(v,msg);checks++}
function load(file,deps={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,console,Date,Map,Set,BigInt,Number,Error,Object,Array,JSON,encodeURIComponent,require(n){if(n==='server-only')return {};if(n in deps)return deps[n];throw Error('Forbidden dependency '+n)},fetch(){throw Error('Network forbidden')}},{filename:file});return m.exports}
const money=load(root+'/lib/listing-monetary-value.ts',{'@/lib/currency-conversion':{}});
for(const value of [.5,1,1.00,50000000]){const r=money.resolveListingOriginalMonetaryValue({canonical_domain_version:1,transaction_type:'sale',currency:'CRC',current_price:value,price_millions:90});ok(r.amount===value,'canonical sale '+value)}
ok(money.resolveListingOriginalMonetaryValue({canonical_domain_version:1,transaction_type:'sale',currency:'CRC',price_millions:90})===null,'no invented draft amount');
ok(money.resolveListingOriginalMonetaryValue({canonical_domain_version:1,transaction_type:'buy',currency:'CRC',current_price:3})===null,'no canonical alias');
ok(money.resolveListingOriginalMonetaryValue({canonical_domain_version:1,transaction_type:'rent',currency:'USD',monthly_price:12.75}).amount===12.75,'fractional rent');
ok(money.resolveListingOriginalMonetaryValue({transaction_type:'buy',currency:'CRC',price_millions:2}).amount===2000000,'legacy preserved');
const req=load(root+'/lib/geography/dta-request.ts');const identity=load(root+'/lib/geography/dta-identity.ts',{'./dta-request':req});
const reader=load(root+'/lib/canonical-listing-reader.ts',{'@/lib/supabase-admin':{supabaseAdmin:{}},'@/lib/geography/dta-identity':identity});
const pid='70000000-0000-0000-0000-000000000004';
const geo=[{id:'1001',parent_id:null,official_code:'3',term_type:'province',level:1},{id:'1002',parent_id:'1001',official_code:'304',term_type:'canton',level:2}];
const evidence={listing_id:pid,canonical_domain_version:1,geography:geo,facts:[],selections:[{dimension:'property_type',ontology_term_id:'9007199254740993',term_type:'property_type',level:1}]};
ok(reader.validateCanonicalEvidence(evidence)===evidence,'P+C and bigint');
const district={id:'1003',parent_id:'1002',official_code:'30403',term_type:'district',level:3};
ok(reader.validateCanonicalEvidence({...evidence,geography:[...geo,district]}).geography.length===3,'Pejivalle');
assert.throws(()=>reader.validateCanonicalEvidence({...evidence,geography:[...geo,{...district,parent_id:'999'}]}));checks++;
assert.throws(()=>reader.validateCanonicalEvidence({...evidence,geography:[geo[0]]}));checks++;
let rows=[],edges=[],calls=[];
const terms=[{id:'1001',term_type:'province',slug:'cartago',term_name:'Cartago'},{id:'1002',term_type:'canton',slug:'jimenez',term_name:'Jiménez'},{id:'1003',term_type:'district',slug:'pejivalle',term_name:'Pejivalle'},{id:'1',term_type:'property_type',slug:'house',term_name:'House'},{id:'2',term_type:'property_type',slug:'land',term_name:'Land'}];
function client(){return {rpc(name,args){ok(name==='read_legacy_geographic_candidates','only scoped candidate RPC');
 const selected=rows.filter(r=>r.canonical_domain_version==null&&r.listing_status==='active'&&
 (!args.p_transaction||({sale:['buy','sale'],rent:['rent','lease']})[args.p_transaction].includes(r.transaction_type))&&
 ['province','canton','district'].every(k=>{const values=args[({province:'p_provinces',canton:'p_cantons',district:'p_districts'})[k]];const v=(r[k]??'').toLowerCase();return !values.length||values.some(x=>k==='district'?v&&x.startsWith(v):v.includes(x))})).map(r=>({listing_id:r.id}));
 return {range(a,b){return Promise.resolve({data:selected.slice(a,b+1),count:selected.length,error:null})}}},from(table){let pred=[],from=0,to=499,legacyScope=false,idBound=false;const q={select(){return q},eq(k,v){pred.push(r=>(k==='listings.canonical_domain_version'?rows.find(x=>x.id===r.listing_id)?.canonical_domain_version:r[k])===v);return q},is(k,v){if(k==='canonical_domain_version')legacyScope=true;pred.push(r=>((k==='listings.canonical_domain_version'?rows.find(x=>x.id===r.listing_id)?.canonical_domain_version:r[k])??null)===v);return q},in(k,vs){if(k==='id')idBound=true;pred.push(r=>vs.includes(r[k]));return q},or(v){pred.push(r=>v.includes('sale')?['sale','buy'].includes(r.transaction_type):['rent','lease'].includes(r.transaction_type));return q},order(){return q},range(a,b){from=a;to=b;return q},then(resolve,reject){calls.push(table);if(table==='listings'&&legacyScope)ok(idBound,'legacy full evidence bounded before retrieval');const all=(table==='listings'?rows:table==='listings_ontology_terms'?edges:terms).filter(r=>pred.every(p=>p(r)));return Promise.resolve({data:all.slice(from,Math.min(to+1,from+2)),count:all.length,error:null}).then(resolve,reject)}};return q}}}
const canonicalClient=client(),legacyClient=client();
const population={async resolvePopulationGeography(filters){const resolved={},legacy={...filters};for(const type of ['province','canton','district'])if(filters[type]){const codes=filters[type].split(',');resolved[type]=codes.map(code=>({ontologyTermId:({'3':'1001','304':'1002','30403':'1003'})[code]}));legacy[type]=({'3':'cartago','304':'jimenez','30403':'pejivalle'})[filters[type]]}return {resolved,legacy}},async hydrateCanonicalPopulation(ls){return ls.map(l=>({...l,canonicalEvidence:{facts:[]}}))}};
const matcher=load(root+'/lib/statistics-engine.ts',{'@/lib/supabase':{supabase:legacyClient},'@/lib/supabase-admin':{supabaseAdmin:canonicalClient},'@/lib/canonical-population':population,'@/lib/listing-monetary-value':money,'@/lib/market-intelligence-area-ranges':{},'@/lib/market-analytical-context':{}});
(async()=>{
 let rpcCalls=0;const ids=Array.from({length:51},(_,i)=>`70000000-0000-0000-0000-${String(i).padStart(12,'0')}`);
 const result=await reader.readCanonicalListingEvidence(ids,{facts:[],semantics:['property_type']},{async rpc(name,args){rpcCalls++;ok(args.p_listing_ids.length<=25,'bounded batch');return {data:args.p_listing_ids.map(id=>({...evidence,listing_id:id})),error:null}}});ok(result.size===51&&rpcCalls===3,'one batch not N+1');
 await assert.rejects(()=>reader.readCanonicalListingEvidence([pid],{facts:[],semantics:[]},{async rpc(){return {data:[],error:null}}}));checks++;
 rows=[{id:'a',canonical_domain_version:1,listing_status:'active',transaction_type:'sale',province:'STALE'},{id:'b',canonical_domain_version:1,listing_status:'active',transaction_type:'rent',province:'Cartago'},{id:'c',canonical_domain_version:1,listing_status:'active',transaction_type:'buy',province:'Cartago'},{id:'d',canonical_domain_version:null,listing_status:'active',transaction_type:'buy',province:'Cartago'}];
 edges=['a','b','c'].flatMap(listing_id=>[{listing_id,ontology_term_id:'1001'},{listing_id,ontology_term_id:'1002'},{listing_id,ontology_term_id:'1'}]);
 let r=await matcher.getMatchingListings({province:'3',transaction_type:'sale'});ok(r.map(l=>l.id).join(',')==='a,d','mixed canonical stale text and legacy alias');
 rows[0].province='Another stale name';r=await matcher.getMatchingListings({province:'3',transaction_type:'sale'});ok(r.map(l=>l.id).join(',')==='a,d','text invariant');
 r=await matcher.getMatchingListings({canton:'304',transaction_type:'sale'});ok(r.some(l=>l.id==='a'),'Canton terminal');
 r=await matcher.getMatchingListings({district:'30403',transaction_type:'sale'});ok(!r.some(l=>l.id==='a'),'no invented District');
 edges.push({listing_id:'a',ontology_term_id:'1003'});r=await matcher.getMatchingListings({district:'30403',transaction_type:'sale'});ok(r.some(l=>l.id==='a'),'District identity');
 edges=edges.filter(e=>!(e.listing_id==='a'&&e.ontology_term_id==='1002'));r=await matcher.getMatchingListings({canton:'304',transaction_type:'sale'});ok(!r.some(l=>l.id==='a'),'identity changes population');
 r=await matcher.getMatchingListings({province:'3',property_type:'house,land',transaction_type:'sale'});ok(r.some(l=>l.id==='a'),'OR within / AND across');
 r=await matcher.getMatchingListings({province:'3',property_type:'land',transaction_type:'sale'});ok(!r.some(l=>l.id==='a'),'AND rejects absent characteristic');
 r=await matcher.getMatchingListings({province:'3',transaction_type:'rent'});ok(r.map(l=>l.id).join(',')==='b','rent sovereign');

 rows.push({id:'a',canonical_domain_version:null,listing_status:'active',transaction_type:'sale',province:'Cartago'});
 const mixedDuplicate=await matcher.getMatchingListings({province:'3',transaction_type:'sale'});
 ok(mixedDuplicate.filter(l=>l.id==='a').length===1&&mixedDuplicate.find(l=>l.id==='a').canonical_domain_version===1,'mixed-path duplicate uses canonical row');rows.pop();
 let dictionaryCalls=0,requestedEvidence=[],requestedDimensions=[];
 const populationReal=load(root+'/lib/canonical-population.ts',{
  '@/lib/supabase-admin':{supabaseAdmin:{async rpc(name,args){dictionaryCalls++;ok(name==='read_legacy_geography_dictionary'&&args.p_listing_ids.length<=25,'dictionary listing batch');return {data:[{id:'9007199254740993'}],error:null}}}},
  '@/lib/canonical-listing-reader':{readCanonicalListingEvidence:async (ids,dimensions)=>(requestedDimensions.push(dimensions),requestedEvidence.push(ids),new Map([[pid,{...evidence,facts:[{dimension:'year_built',kind:'exact',exact_value:'2001'},{dimension:'bedrooms',kind:'exact',exact_value:'3'},{dimension:'parking',kind:'range',range_lower:'1',range_upper:'3'}],selections:[{dimension:'property_type',ontology_term_id:'1',slug:'house',term_name:'House'}]}]]))},
  '@/lib/geography/resolve-dta-geography':{},
 });
 const dictionary=await populationReal.loadLegacyGeographyDictionary(ids);ok(dictionaryCalls===3&&dictionary.length===1,'dictionary batches deduplicate without N+1');
 const hydrated=await populationReal.hydrateCanonicalPopulation([{id:pid,canonical_domain_version:1,transaction_type:'sale',bedrooms:'stale',parking:'99',property_type:'Land',year_built_range:'stale year'}]);
 ok(hydrated[0].bedrooms==='3','exact fact replaces stale projection');ok(hydrated[0].parking===null&&hydrated[0].canonicalEvidence.facts.find(f=>f.dimension==='parking').kind==='range','range not an exact observation');ok(hydrated[0].property_type==='house','semantic property identity replaces text');
 await assert.rejects(()=>populationReal.hydrateCanonicalPopulation([{id:pid,canonical_domain_version:1,transaction_type:'buy'}]));checks++;
 await populationReal.hydrateCanonicalPopulation([{id:pid,canonical_domain_version:1,transaction_type:'sale'}],new Map([[pid,evidence]]));
 ok(requestedEvidence.at(-1).length===0,'request-local evidence not reacquired');

 const nextId='70000000-0000-0000-0000-000000000005',legacyId='70000000-0000-0000-0000-000000000006';
 const typedEvidence={...evidence,facts:[
  {dimension:'bedrooms',kind:'exact',exact_value:'3'},
  {dimension:'bathrooms',kind:'category',category_term_id:'9007199254740993'},
  {dimension:'parking',kind:'range',range_lower:'1',range_upper:'3'}],
  selections:[{dimension:'property_type',ontology_term_id:'1',slug:'house',term_name:'House'}]};
 const handoffRequests=[];
 const isolatedPopulation=load(root+'/lib/canonical-population.ts',{
  '@/lib/supabase-admin':{supabaseAdmin:{}},'@/lib/geography/resolve-dta-geography':{},
  '@/lib/canonical-listing-reader':{readCanonicalListingEvidence:async requested=>{
    handoffRequests.push([...requested]);return new Map(requested.map(id=>[id,{...typedEvidence,listing_id:id}]))}},
 });
 const sameRequest=new Map([[pid,typedEvidence],['unrequested',{...typedEvidence,listing_id:'unrequested'}],[legacyId,{...typedEvidence,listing_id:legacyId}]]);
 const legacyRow={id:legacyId,canonical_domain_version:null,transaction_type:'buy',bedrooms:'legacy'};
 const input=[{id:pid,canonical_domain_version:1,transaction_type:'sale'},{id:nextId,canonical_domain_version:1,transaction_type:'rent'},legacyRow];
 const shared=await isolatedPopulation.hydrateCanonicalPopulation(input,sameRequest);
 ok(handoffRequests[0].join(',')===nextId,'only genuinely missing canonical identity acquired');
 ok(shared[0].canonicalEvidence===typedEvidence&&shared[0].canonicalEvidence.facts.map(f=>f.kind).join(',')==='exact,category,range','handoff preserves Model C authority');
 ok(shared[2]===legacyRow&&!shared[2].canonicalEvidence,'legacy cannot acquire cached canonical evidence');
 ok(shared.length===3&&!shared.some(l=>l.id==='unrequested'),'unrequested evidence never emitted');
 ok(sameRequest.size===3&&!sameRequest.has(nextId),'handoff does not mutate caller map');
 await isolatedPopulation.hydrateCanonicalPopulation(input);
 ok(handoffRequests[1].join(',')===[pid,nextId].join(','),'next request reacquires its own evidence');

 ok(hydrated[0].year_built_range==='2001','canonical exact year replaces stale public field');
 ok(!requestedDimensions[0].facts.includes('distance_to_paved_road'),'unused distance facts not loaded');
 await populationReal.hydrateCanonicalPopulation([{id:pid,canonical_domain_version:1,transaction_type:'sale'}],undefined,[]);
 ok(requestedDimensions.at(-1).facts.length===0,'reader can request identity without unrelated facts');

 const missingMapping=load(root+'/lib/canonical-population.ts',{
  '@/lib/supabase-admin':{supabaseAdmin:{from(){const q={select(){return q},eq(){return q},async limit(){return {data:[{official_code:'3',slug:null}],count:1,error:null}}};return q}}},
  '@/lib/canonical-listing-reader':{},'@/lib/geography/resolve-dta-geography':{resolveDtaGeography(){throw Error('must reject before continuing')}}});
 await assert.rejects(()=>missingMapping.resolvePopulationGeography({province:'3'}),/legacy request mapping/);checks++;
 console.log('S6 OFFLINE ASSERTIONS',checks)
})().catch(e=>{console.error(e);process.exitCode=1});
