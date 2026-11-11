// Offline only: production modules execute against an in-memory PostgREST/RPC double.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),m);checks++};
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const geo=[{id:'1',parent_id:null,official_code:'1',term_type:'province',level:1},{id:'2',parent_id:'1',official_code:'101',term_type:'canton',level:2},{id:'3',parent_id:'2',official_code:'10101',term_type:'district',level:3}];
const types=['property_type','environment','terrain','utility','accessibility','legal_status','bedrooms','bathrooms','parking','year_built'];
const terms=[...geo,...types.flatMap((term_type,i)=>[0,1].map(j=>({id:String(10+i*2+j),term_type,level:1,parent_id:null,official_code:null})))].map(t=>({...t,term_name:t.term_type,term_name_en:t.term_type+' EN',term_name_es:t.term_type+' ES'}));
let rows,members,facts,events,fault,fxFault,pageCap,statsCalls;
const rate={baseCurrency:'USD',quoteCurrency:'CRC',rate:500,rateType:'reference_sale',source:'BCCR',analyticalDate:'2026-09-26',effectiveDate:'2026-09-26',resolutionMode:'exact'};
function fixture(n=4){rows=Array.from({length:n},(_,i)=>({id:id(i+1),canonical_domain_version:1,listing_status:'active',transaction_type:'sale',currency:'CRC',current_price:String((i+1)*10),monthly_price:'7',property_area:'100',construction_area:'50'}));members=rows.flatMap(r=>['1','2','3','10'].map(ontology_term_id=>({listing_id:r.id,ontology_term_id})));facts=new Map();events=[];fault='';fxFault=false;pageCap=500;statsCalls=0}
function field(r,k){return k.startsWith('listings.')?rows.find(x=>x.id===r.listing_id)?.[k.slice(9)]:r[k]}
const db={from(table){let predicates=[],order=[],offset=0,end=499,limit=Infinity,selected='';const q={select(s){selected=s;return q},eq(k,v){predicates.push([k,[v]]);return q},in(k,v){predicates.push([k,v]);return q},order(k){order.push(k);return q},range(a,b){offset=a;end=b;return q},limit(n){limit=n;return q},retry(){return q},then(resolve,reject){return Promise.resolve().then(()=>{
 events.push({table,selected,predicates,offset,end});
 if(table!=='ontology_terms')ok(predicates.some(([k])=>['ontology_term_id','listing_id','id'].includes(k)),'population query bounded');
 if(table==='listings')ok(!/title|images|price_millions/.test(selected),'minimum scalar acquisition');
 let all=(table==='ontology_terms'?terms:table==='listings'?rows:members).filter(r=>predicates.every(([k,vs])=>vs.includes(field(r,k)))).map(r=>({...r}));
 all.sort((a,b)=>{for(const k of order){const x=a[k],y=b[k];if(x!==y)return k==='ontology_term_id'||k==='id'&&table==='ontology_terms'?(BigInt(x)<BigInt(y)?-1:1):(x<y?-1:1)}return 0});
 if(selected.includes('listings!inner'))all=all.map(r=>({...r,listings:rows.find(x=>x.id===r.listing_id)}));
 let data=all.slice(offset,Math.min(end+1,offset+pageCap,limit)),count=all.length;
 if(table==='listings_ontology_terms'&&selected.includes('listings!inner')){
 if(fault==='error')return {data:null,count:null,error:{message:'SECRET'}};
 if(fault==='count')count=null;if(fault==='drift'&&offset>0)count++;
 if(fault==='empty'&&offset>0)data=[];
 if(fault==='duplicate'&&data.length>1)data[1]={...data[0]};
 if(fault==='order'&&data.length>1)data.reverse();
 if(fault==='wrong-geo'&&data.length)data[0]={...data[0],ontology_term_id:'999'};
 if(fault==='bad-id'&&data.length)data[0]={...data[0],listing_id:'bad'};
 if(fault==='oversize')data=Array.from({length:501},()=>({...all[0]}));
 if(fault==='predicate'&&data.length)data[0]={...data[0],listings:{...data[0].listings,transaction_type:'rent'}};
 }
 if(table==='listings'&&fault==='missing-money')data=data.slice(1);
 return {data,count,error:null};
 }).then(resolve,reject)}};return q},async rpc(name,args){ok(name==='read_canonical_listing_evidence','only canonical evidence RPC');ok(args.p_listing_ids.length<=25,'bounded fact RPC');events.push({rpc:name,args});return {data:args.p_listing_ids.map(listing_id=>({listing_id,canonical_domain_version:1,geography:geo,facts:(facts.get(listing_id)||[]).filter(f=>args.p_fact_dimensions.includes(f.dimension)),selections:[]})),error:null}}};
const cache=new Map(),allowed=new Set(['asking-price-contract','asking-price-question','asking-price-data','asking-price-engine','asking-price-action','listing-monetary-value','currency-conversion','market-intelligence-area-ranges','canonical-listing-reader','geography/dta-request','geography/dta-identity','geography/resolve-dta-geography','numerical-distribution'].map(x=>'lib/'+x+'.ts'));
function load(file){if(cache.has(file))return cache.get(file).exports;assert.ok(allowed.has(file),'unexpected production dependency '+file);const m={exports:{}};cache.set(file,m);const code=ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const requireOffline=n=>{if(n==='server-only')return {};let resolved=n.startsWith('@/')?n.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),n));if(resolved==='lib/supabase-admin')return {supabaseAdmin:db};if(resolved==='lib/supabase-server')throw Error('Authentication must not load');if(resolved==='lib/analysis-date')return {getCurrentAnalyticalDate:()=>rate.analyticalDate};if(resolved==='lib/fx/fx-service')return {getHistoricalUsdToCrcRate:async()=>{events.push({fx:true});if(fxFault)throw Error('SECRET FX');return {...rate}}};const result=load(resolved+'.ts');if(resolved==='lib/numerical-distribution')return {...result,buildNumericalDistribution:vs=>{statsCalls++;return result.buildNumericalDistribution(vs)}};return result};vm.runInThisContext('(function(require,module,exports,fetch){'+code+'\n})',{filename:file})(requireOffline,m,m.exports,()=>{throw Error('NETWORK FORBIDDEN')});return m.exports}
const api=load('lib/asking-price-action.ts'),question=load('lib/asking-price-question.ts'),data=load('lib/asking-price-data.ts');
const q=()=>({version:1,transaction:'sale',geography:{level:'province',officialCode:'1'},filters:{semantics:{},facts:{}}});
const exact=(dimension,value)=>({dimension,kind:'exact',exact_value:value,category_term_id:null,range_lower:null,range_upper:null,lower_inclusive:null,upper_inclusive:null});
const range=(dimension,l,u,li=true,ui=false)=>({dimension,kind:'range',exact_value:null,category_term_id:null,range_lower:l,range_upper:u,lower_inclusive:li,upper_inclusive:ui});
async function success(input=q()){const v=await api.analyzeAskingPrice(input);ok(v.ok,'successful execution '+JSON.stringify(v));return v.result}
async function main(){
 fixture();const r=await success();eq(r.statistics,{minimum:10,p10:13,p25:17.5,median:25,average:25,p75:32.5,p90:37,maximum:40,iqr:15},'approved distribution');eq([r.marketPopulation,r.askingPricePopulation,statsCalls],[4,4,1],'counts and exactly one distribution');eq(events.filter(e=>e.fx).length,0,'CRC needs no FX');
 eq(r.unit,'total_asking_price','sale unit');ok(!JSON.stringify(r).includes(id(1)),'no listing identity');eq(Object.keys(r).sort(),['schemaVersion','engine','question','questionIdentity','labels','outcome','marketPopulation','askingPricePopulation','exclusions','currency','unit','analyticalDate','fx','methodology','statistics','completeness'].sort(),'projection allowlist');ok(!('sampleSize'in r.statistics),'only approved statistical fields');
 for(const [level,officialCode]of [['province','1'],['canton','101'],['district','10101']]){fixture();const x=q();x.geography={level,officialCode};eq((await success(x)).marketPopulation,4,level)}
 for(const bad of [{...q(),transaction:'both'},{...q(),geography:[]},{...q(),propertyType:['10','11']},{...q(),priceRange:'0-1'},{...q(),normalization:'land'},{...q(),propertyBasis:'land'},{...q(),result:r},{...q(),filters:{distance_to_paved_road:'1'}},{...q(),filters:{facts:{parking:[{kind:'exact',value:'NaN'}]}}}]){fixture();eq((await api.analyzeAskingPrice(bad)).ok,false,'reject foreign input');eq(events.length,0,'invalid input zero acquisition')}
 fixture();let x=q();x.propertyType='10';eq((await success(x)).marketPopulation,4,'one type');x.propertyType='11';eq((await success(x)).marketPopulation,0,'no type fallback');
 for(const n of [0,1,3,499,500,501,1001]){fixture(n);const out=await success();eq(out.askingPricePopulation,n,'complete population '+n);eq(statsCalls,1,'one calculation '+n);if(!n){eq(out.outcome,'empty_market','empty');eq(events.filter(e=>e.table==='listings').length,0,'empty no money queries')}if(n===1){eq(out.statistics.iqr,0,'single IQR');eq(out.statistics.median,10,'single median')}}
 fixture(501);pageCap=73;eq((await success()).marketPopulation,501,'server short pages still complete');
 for(const f of ['error','count','drift','empty','duplicate','order','wrong-geo','bad-id','oversize','predicate','missing-money']){fixture(501);fault=f;const out=await api.analyzeAskingPrice(q());eq(out,{ok:false,code:'execution_failed'},'fail closed '+f);eq(statsCalls,0,'no calculation '+f)}
 fixture();rows[1].listing_status='draft';rows[2].canonical_domain_version=null;rows[3].transaction_type='rent';eq((await success()).marketPopulation,1,'exact fundamental intersection');
 fixture();rows.forEach(r=>r.transaction_type='rent');rows[0].monthly_price=null;const rent=q();rent.transaction='rent';const rr=await success(rent);eq([rr.marketPopulation,rr.askingPricePopulation,rr.statistics.median,rr.unit],[4,3,7,'monthly_asking_price'],'rent never substitutes sale');
 for(const v of [null,'0','-1','NaN','Infinity','bad']){fixture(1);rows[0].current_price=v;const out=await success();eq([out.marketPopulation,out.askingPricePopulation,out.outcome,out.statistics.median],[1,0,'no_eligible_prices',null],'invalid money '+v)}
 for(const currency of [null,'EUR','crc']){fixture(1);rows[0].currency=currency;eq((await success()).exclusions.unsupportedCurrency,1,'unsupported currency')}
 for(const v of ['0.5','1']){fixture(1);rows[0].current_price=v;eq((await success()).statistics.average,Number(v),'small canonical amount')}
 fixture();rows.forEach(r=>r.current_price='10');eq((await success()).statistics.iqr,0,'tied values retained');
 fixture(2);rows[1].currency='USD';let out=await success();eq(out.statistics.average,5005,'mixed monetary normalization');eq(events.filter(e=>e.fx).length,1,'one FX');eq(out.fx,rate,'full FX identity');
 fixture(2);rows[1].currency='USD';fxFault=true;eq(await api.analyzeAskingPrice(q()),{ok:false,code:'execution_failed'},'FX failure not CRC subset');eq(statsCalls,0,'no calculation after FX failure');
 fixture(2);rows.forEach(r=>r.current_price='1.7e308');eq((await api.analyzeAskingPrice(q())).ok,false,'aggregate overflow');
 fixture(1);rows[0].current_price='1.7e308';rows[0].currency='USD';eq((await api.analyzeAskingPrice(q())).ok,false,'conversion overflow');
 fixture();members.push({listing_id:id(1),ontology_term_id:'12'},{listing_id:id(2),ontology_term_id:'13'},{listing_id:id(2),ontology_term_id:'14'});x=q();x.filters.semantics={environment:['12','13'],terrain:['14']};eq((await success(x)).marketPopulation,1,'OR within AND across');
 for(const [dim,val]of [['bedrooms','2'],['bathrooms','2.5'],['parking','0'],['year_built','2001']]){fixture();facts.set(id(1),[exact(dim,val)]);x=q();x.filters.facts[dim]=[{kind:'exact',value:val}];eq((await success(x)).marketPopulation,1,'canonical exact '+dim)}
 fixture();facts.set(id(1),[range('bedrooms','2','4')]);facts.set(id(2),[range('bedrooms','1','5')]);facts.set(id(3),[exact('bedrooms','3')]);x=q();x.filters.facts.bedrooms=[{kind:'interval',interval:{lower:'2',upper:'4',lowerInclusive:true,upperInclusive:false}}];eq((await success(x)).marketPopulation,2,'whole interval containment, no overlap imputation');
 fixture();facts.set(id(1),[{...exact('bedrooms','2'),kind:'category',exact_value:null,category_term_id:'22'}]);members.push({listing_id:id(1),ontology_term_id:'22'});x=q();x.filters.facts.bedrooms=[{kind:'exact',value:'2'}];eq((await success(x)).marketPopulation,0,'category not exact');x.filters.facts.bedrooms=[{kind:'category',termId:'22'}];eq((await success(x)).marketPopulation,1,'recorded category membership');
 for(const [key,field,choice,value]of [['propertyArea','property_area','100-500m2','100'],['constructionArea','construction_area','50-100m2','50']]){fixture();rows[1][field]=null;rows[2][field]='500';rows[3][field]='20';x=q();x.filters[key]=choice;eq((await success(x)).marketPopulation,1,'area bound '+key);rows[0][field]=null;eq((await success(x)).marketPopulation,0,'missing area never matches')}
 fixture();const catalog=await data.readAskingPriceCatalog();ok(catalog.state==='ready','dictionary ready');eq(events.filter(e=>e.table!=='ontology_terms').length,0,'dictionary zero analytical queries');
 fixture(3);const odd=await success();eq([odd.statistics.median,odd.statistics.p10,odd.statistics.p90],[20,12,28],'odd quantiles');
 fixture(3);rows.forEach(r=>r.currency='USD');await success();eq(events.filter(e=>e.fx).length,1,'many USD one FX context');
 fixture(1);rows[0].current_price=null;rows[0].currency='USD';await success();eq(events.filter(e=>e.fx).length,0,'ineligible USD does not resolve FX');
 fixture(1);rows[0].currency='USD';rate.effectiveDate='2026-09-25';rate.resolutionMode='latest_applicable_prior_observation';eq((await success()).fx.effectiveDate,'2026-09-25','prior FX provenance');rate.effectiveDate='2026-09-26';rate.resolutionMode='exact';
 for(const bad of [0,-1,Infinity,NaN]){fixture(1);rows[0].currency='USD';rate.rate=bad;eq((await api.analyzeAskingPrice(q())).ok,false,'invalid FX rate');}rate.rate=500;
 fixture();x=q();x.propertyType='12';eq((await api.analyzeAskingPrice(x)).ok,false,'wrong dimension term');eq(events.filter(e=>e.table!=='ontology_terms').length,0,'wrong reference stops before population');
 fixture();x=q();x.propertyType='9999';eq((await api.analyzeAskingPrice(x)).ok,false,'missing reference');
 fixture();x=q();x.filters.facts.parking=[{kind:'interval',interval:{lower:'1',upper:'2',lowerInclusive:false,upperInclusive:false}}];eq((await api.analyzeAskingPrice(x)).ok,false,'empty integer interval rejected');eq(events.length,0,'invalid integer interval no query');
 fixture();const callsBefore=events.length;const reader=load('lib/canonical-listing-reader.ts');await assert.rejects(()=>reader.readCanonicalListingEvidence([id(1)],{facts:[],semantics:[]},{rpc:async()=>({data:[],error:null})}));checks++;eq(events.length,callsBefore,'missing reader row rejected offline');
 const currency=load('lib/currency-conversion.ts');eq(currency.convertUsdToCrc(2,500),1000,'neutral USD conversion');eq(currency.convertCrcToUsd(1000,500),2,'neutral CRC conversion');assert.throws(()=>currency.convertUsdToCrc(2,0));checks++;
 const file=fs.readFileSync(root+'/lib/asking-price-engine.ts','utf8');ok(!/price-meter|phase14|statistics-engine|explorer-engine|valuation-engine|pricing-strategy-engine|market-comparison-engine/.test(file),'no other engine imports');
 console.log('MARKET ASKING PRICE DISTRIBUTION PASS:',checks,'assertions; real action/question/acquisition/reader/conversion/distribution; fake DB/FX only.');
 return r;
}
module.exports={load,fixture,q,main,terms,root};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
