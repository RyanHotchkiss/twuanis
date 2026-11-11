const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let checks=0,mode='normal',calls=[],fxCalls=0,authCalls=[],authorized=true,entitled=true;
const ok=(v,m)=>{assert.ok(v,m);checks++},id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const term=(n,t,code,parent,level)=>({id:String(n),term_type:t,official_code:code,parent_id:parent,level,term_name:t,term_name_en:t+' EN',term_name_es:t+' ES',slug:t,slug_en:t,slug_es:t});
const province=term('9007199254740993','province','3',null,1),canton=term('9007199254740994','canton','304',province.id,2),district=term('9007199254740995','district','30401',canton.id,3);
let rows,geos,types;
function reset(){mode='normal';calls=[];fxCalls=0;authCalls=[];authorized=true;entitled=true;rows=Array.from({length:31},(_,i)=>({id:id(i+1),canonical_domain_version:1,listing_status:'active',transaction_type:'sale',property_area:200+i*100,construction_area:100+i*25,current_price:(100+i*25)*(i<3?100:100+i*10),monthly_price:1000,currency:'CRC',property_type:'WRONG',province:'WRONG',canton:'WRONG',district:'WRONG'}));geos=new Map(rows.map(r=>[r.id,[province,canton,district]]));types=new Map(rows.map(r=>[r.id,'1']));}
reset();
const db={from(table){let filters=[],orders=[],start=0,end=499,single=false;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},in(k,v){assert.ok(v.length<=25);filters.push([k,v]);return q},order(k){orders.push(k);return q},range(a,b){start=a;end=b;return q},maybeSingle(){single=true;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 calls.push({table,filters,start,single});
 let data=table==='listings'?rows:rows.flatMap(r=>[...geos.get(r.id).map(g=>g.id),types.get(r.id)].map(t=>({listing_id:r.id,ontology_term_id:t})));
 data=data.filter(r=>filters.every(([k,v])=>{const val=k.startsWith('listings.')?rows.find(l=>l.id===r.listing_id)[k.slice(9)]:r[k];return Array.isArray(v)?v.includes(val):val===v}));
 data.sort((a,b)=>{for(const k of orders)if(a[k]!==b[k])return String(a[k])<String(b[k])?-1:1;return 0});
 if(single)return {data:data[0]||null,error:mode==='subject-error'?Error('private subject failure'):null};
 if(mode==='missing-subject')data=data.filter(r=>(r.id||r.listing_id)!==id(1));
 if(mode==='empty')data=[];
 if(mode==='missing-listing'&&table==='listings')data=data.filter(r=>r.id!==id(2));
 const count=data.length,page=data.slice(start,Math.min(end+1,start+3));
 if(mode==='changed-subject'&&table==='listings')for(let i=0;i<page.length;i++)if(page[i].id===id(1))page[i]={...page[i],current_price:page[i].current_price*2};
 if(mode==='duplicate'&&start===0&&page.length>1)page[1]=page[0];
 return {data:mode==='premature-empty'&&start>0?[]:page,count:mode==='missing-count'?null:count+(mode==='changed-count'&&start>0?1:0),error:mode==='query-error'?Error('private database details'):null};
 }).then(resolve,reject)}};return q},async rpc(name,args){
 assert.equal(name,'read_canonical_listing_evidence');assert.ok(args.p_listing_ids.length<=25);assert.equal(args.p_fact_dimensions.length,0);
 calls.push({rpc:name,ids:args.p_listing_ids});let data=args.p_listing_ids.map(listing_id=>({listing_id,canonical_domain_version:1,facts:[],geography:geos.get(listing_id),selections:[{dimension:'property_type',ontology_term_id:types.get(listing_id),term_type:'property_type',level:1,slug:types.get(listing_id)==='2'?'land':types.get(listing_id)==='3'?'condo':'house',term_name:types.get(listing_id)==='2'?'Land':'House'}]}));
 if(args.p_listing_ids.length>1){if(mode==='missing-hydration')data.pop();if(mode==='duplicate-hydration')data[1]=data[0];if(mode==='invalid-hydration')data[0]={...data[0],geography:[province]};if(mode==='membership-mismatch')data[0]={...data[0],geography:[province,canton]};}
 return {data,error:mode==='hydrate-error'&&args.p_listing_ids.length>1?Error('private hydration'):null};
}};
const mocked={
 'lib/supabase-admin.ts':{supabaseAdmin:db},
 'lib/supabase-server.ts':{async createServerSupabaseClient(){authCalls.push('cookie');return {auth:{async getUser(){authCalls.push('user');return {data:{user:authorized?{id:'user'}:null},error:null}}},async rpc(n,a){authCalls.push([n,a]);return {data:entitled,error:null}}}}},
 'lib/analysis-date.ts':{getCurrentAnalyticalDate:()=> '2026-09-20'},
 'lib/fx/fx-service.ts':{async getHistoricalUsdToCrcRate(date){fxCalls++;if(mode==='fx-error')throw Error('private FX');return {analyticalDate:date,effectiveDate:date,rate:500,resolutionMode:'exact'}}}
};
let hooks,fetchMock;
const cache=new Map();function load(rel){const file=path.resolve(root,rel),key=path.relative(root,file);if(mocked[key])return mocked[key];if(cache.has(file))return cache.get(file).exports;const m={exports:{}};cache.set(file,m);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,console,URL,Request,Response,Intl,fetch:(...a)=>fetchMock(...a),require(k){if(k==='server-only')return{};if(k==='react')return {useState:(...a)=>hooks.useState(...a),useRef:(...a)=>hooks.useRef(...a),useEffect:(...a)=>hooks.useEffect(...a)};if(k==='react/jsx-runtime')return {jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};const p=k.startsWith('@/')?path.join(root,k.slice(2)):k.startsWith('.')?path.resolve(path.dirname(file),k):null;if(!p)throw Error('Forbidden I/O dependency '+k);return load(p+(fs.existsSync(p+'.ts')?'.ts':'.tsx'));}},{filename:file});return m.exports;}
const server=load('lib/price-meter-property-position-server.ts'),dto=load('lib/price-meter-property-position-dto.ts'),route=load('app/api/price-meter/property-position/route.ts'),request={listingId:id(1),requestedGeographyLevel:'district',requestedNormalizationBasis:'construction'};
async function execute(extra={}){return server.executePropertyPosition({...request,...extra})}
function requireOK(r,label){ok(r.state==='ok',label+': '+JSON.stringify(r.state==='ok'?{state:r.state}:r));return r}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const config=await server.getPositionConfiguration(id(1));ok(config.defaultGeography==='district'&&config.defaultNormalization==='construction','authoritative default');ok(config.normalizations.join(',')==='land,construction','both lenses available');ok(calls.every(c=>c.single||c.rpc),'configuration acquires subject only');
 calls=[];const result=requireOK(await execute(),'full canonical path');ok(result.evidence.comparisonPopulationCount===31,'different areas retained, complete capped pages across chunks');
 ok(result.reference.propertyArea==='unconstrained'&&result.reference.constructionArea==='unconstrained','explicit unconstrained reference');ok(result.reference.propertyType.id==='1'&&result.reference.geography.id===district.id,'lossless canonical ID, misleading legacy text ignored');
 ok(result.reference.participation==='SUBJECT_INCLUDED'&&result.evidence.percentile.equalCount===3,'actual subject and equal-price peers retained');ok(fxCalls===0,'native CRC needs no FX');
 ok(calls.filter(c=>c.table==='listings_ontology_terms').every(c=>c.filters.some(([k])=>k==='ontology_term_id')),'every membership read term-bounded');
 ok(calls.filter(c=>c.table==='listings'&&!c.single).every(c=>c.filters.some(([k])=>k==='id')),'listing retrieval bounded before acquisition');
 ok(calls.some(c=>c.start===3)&&calls.some(c=>c.start===6),'advance by actual capped rows');
 const e=result.evidence, distribution=load('lib/numerical-distribution.ts').buildNumericalDistribution(rows.map(r=>r.current_price/r.construction_area));
 for(const k of ['minimum','p10','p25','median','p75','p90','maximum','iqr'])ok(e.distribution[k]===distribution[k],'GREEN distribution '+k);
 const math=load('lib/price-meter-property-position-math.ts');const counts=math.calculatePropertyPositionCounts(100,rows.map(r=>r.current_price/r.construction_area),31);
 ok(e.percentile.position===counts.percentilePosition&&e.percentile.belowCount===counts.belowCount&&e.percentile.equalCount===counts.equalCount&&e.percentile.aboveCount===counts.aboveCount,'GREEN complete counts and percentile');
 const diff=math.calculatePropertyPositionDifference(100,distribution.median);ok(e.medianPosition.difference===diff.difference&&e.medianPosition.percentDifference===diff.percentDifference,'GREEN median difference');
 ok(e.distributionInterval===math.classifyPropertyPositionInterval(100,distribution),'GREEN interval');
 const tail=math.calculatePropertyPositionTail(100,distribution,e.distributionInterval);ok((tail===null)===(e.tail===null),'GREEN tail applicability');
 const browser=dto.toPositionDTO({...result,rawObservations:['secret'],membershipMap:'secret',authorization:'secret'});const serialized=JSON.stringify(browser);
 for(const forbidden of ['secret','canonicalEvidence','observations','candidateCount','subjectAnalyticalIdentity','resolutionMode','fx','service_role'])ok(!serialized.includes('"'+forbidden+'"')&&!serialized.includes('secret'),'DTO excludes '+forbidden);
 ok(result.subjectAnalyticalIdentity&&result.reference.eligibility&&result.reference.canonicalVersion===1&&result.completeness.established&&result.analyticalDate==='2026-09-20','future Step11 internal authority');
 for(const level of ['canton','province']){const r=requireOK(await execute({requestedGeographyLevel:level}),level);ok(r.reference.geographyLevel===level&&r.evidence.comparisonPopulationCount===31,'one explicitly selected geography');}
 const land=requireOK(await execute({requestedNormalizationBasis:'land'}),'land');ok(land.evidence.distribution.median!==e.distribution.median&&land.evidence.normalizationBasis==='land','independent lenses');
 geos.set(id(1),[province,canton]);calls=[];const noDistrict=await server.getPositionConfiguration(id(1));ok(noDistrict.defaultGeography===null&&noDistrict.geographies.canton,'no silent geography default');ok((await execute()).state==='reference_definition_invalid','missing district explicit failure');requireOK(await execute({requestedGeographyLevel:'canton'}),'explicit canton with no district');
 reset();types.set(id(2),'3');const same=requireOK(await execute(),'same type');ok(same.evidence.comparisonPopulationCount===30,'different canonical type excluded');
 reset();rows[1].transaction_type='rent';const sale=requireOK(await execute(),'sale');ok(sale.evidence.comparisonPopulationCount===30&&sale.unit==='CRC/m²','Sale sovereignty');rows[0].transaction_type='rent';const rent=requireOK(await execute(),'rent');ok(rent.evidence.comparisonPopulationCount===2&&rent.unit==='CRC/m²/month','Rent sovereignty');
 reset();types.set(id(1),'2');rows[0].construction_area=null;const landConfig=await server.getPositionConfiguration(id(1));ok(landConfig.defaultNormalization==='land'&&landConfig.normalizations.join()==='land','land-only default');ok((await execute()).state==='normalization_not_applicable','land construction denied');requireOK(await execute({requestedNormalizationBasis:'land'}),'land-only');
 reset();rows[0].property_area=null;const constructionOnly=await server.getPositionConfiguration(id(1));ok(constructionOnly.normalizations.join()==='construction','one eligible improved lens');
 for(const invalid of [null,0,'[100,200]',-1]){reset();rows[0].construction_area=invalid;ok((await execute()).state==='subject_ineligible','unknown improved basis fails without exact construction '+invalid);}
 reset();types.set(id(1),'2');rows[0].construction_area=null;rows[0].property_area='[100,200]';ok((await execute({requestedNormalizationBasis:'land'})).state==='subject_ineligible','range cannot manufacture observation');
 reset();rows[0].canonical_domain_version=0;ok((await execute()).state==='subject_unavailable','legacy fails without fallback');
 for(const failure of ['query-error','missing-count','changed-count','premature-empty','missing-listing','duplicate','missing-hydration','duplicate-hydration','invalid-hydration','membership-mismatch','hydrate-error']){reset();mode=failure;ok((await execute()).state==='reference_evidence_incomplete','incomplete acquisition: '+failure);}
 for(const failure of ['empty','missing-subject','changed-subject']){reset();mode=failure;ok((await execute()).state==='subject_participation_invalid','participation: '+failure);}
 reset();mode='subject-error';ok((await execute()).state==='execution_unavailable','execution distinct');
 for(const who of [0,1]){reset();rows[who].currency='USD';const r=requireOK(await execute(),'mixed currency');ok(fxCalls===1&&r.fx.rate===500&&r.fx.source==='BCCR'&&r.fx.analyticalDate===r.analyticalDate,'one shared BCCR context');ok(r.subjectAnalyticalIdentity.price.analyticalAmount===rows[0].current_price*(who===0?500:1),'subject monetary coherence');}
 reset();rows[0].current_price=0.5;requireOK(await execute(),'positive amount below one');
 reset();const parse=load('lib/price-meter-property-position-request.ts').parsePositionRequest;
 for(const extra of [{participation:'SUBJECT_EXTERNAL'},{geographyId:'3'},{median:1},{propertyType:'house'},{observations:[]},{fx:500},{requestedGeographyLevel:'country'},{requestedNormalizationBasis:'mixed'},{listingId:'bad'},{requestedGeographyLevel:['district']},{requestedNormalizationBasis:['land']}]){assert.throws(()=>parse({...request,...extra}));checks++;}
 for(const method of ['GET','POST']){reset();authorized=false;let response=await route[method](new Request('https://offline.test/?listingId='+id(1),method==='POST'?{method:'POST',body:JSON.stringify(request)}:undefined));ok(response.status===401&&calls.length===0&&authCalls.length===2,'authentication first '+method);authorized=true;entitled=false;response=await route[method](new Request('https://offline.test/?listingId='+id(1),method==='POST'?{method:'POST',body:JSON.stringify(request)}:undefined));ok(response.status===403&&calls.length===0,'entitlement first '+method);ok(authCalls.at(-1)[1].requested_entitlement_slug==='price-m2-intelligence','exact entitlement');}
 reset();let response=await route.POST(new Request('https://offline.test',{method:'POST',body:JSON.stringify(request)}));ok(response.status===200&&(await response.json()).state==='ok'&&response.headers.get('cache-control').includes('no-store'),'real route successful allowlisted result');
 response=await route.GET(new Request('https://offline.test/?listingId='+id(1)+'&listingId='+id(2)));ok(response.status===400,'duplicate query rejected');

 reset();entitled='true';response=await route.POST(new Request('https://offline.test',{method:'POST',body:JSON.stringify(request)}));ok(response.status===403&&calls.length===0,'truthy entitlement is not exact true');
 reset();mode='subject-error';response=await route.GET(new Request('https://offline.test/?listingId='+id(1)));const failedConfig=await response.json();ok(Object.keys(failedConfig).sort().join(',')==='reason,state','configuration strips private failure cause');
 reset();mode='query-error';const privateFailure=await execute();ok(privateFailure.cause&&Object.keys(dto.toPositionDTO(privateFailure)).sort().join(',')==='reason,state','internal diagnosis retained, DTO strips cause');
 reset();rows[0].currency='USD';mode='fx-error';ok((await execute()).state==='execution_unavailable','FX failure does not manufacture monetary evidence');
 reset();rows[0].current_price=1000000;const upper=requireOK(await execute(),'upper tail');const upperDTO=dto.toPositionDTO(upper);ok(upperDTO.tail.thresholdPercentile===90&&upperDTO.tail.difference>0&&upperDTO.tail.percentageReference==='selected_population_p90','upper tail carries signed difference and explicit denominator');
 rows[0].current_price=1;const lower=requireOK(await execute(),'lower tail');ok(lower.evidence.tail.thresholdPercentile===10&&lower.evidence.tail.percentDifferenceFromThreshold<0,'lower tail signed evidence');
 const keys=['subjectListingId','geographyLevel','geography','propertyType','transactionType','propertyBasis','normalizationBasis','participation','canonicalVersion','listingStatus','propertyArea','constructionArea','analyticalDate','monetaryPolicy','eligibility'];ok(keys.every(k=>k in result.reference),'complete internal reference contract');
 // Render actual component with a small deterministic hook scheduler: no browser or network.
 const ui=load('app/components/PriceMeterPropertyPositionListing.tsx'),labels=load('lib/price-meter-property-position-presentation.ts');
 const nums=node=>{if(node==null||typeof node==='boolean')return[];if(typeof node==='number')return[node];if(Array.isArray(node))return node.flatMap(nums);if(typeof node==='object')return nums(node.props?.children);return[]};
 ok(JSON.stringify(nums(ui.PositionEvidence({result:browser,lang:'en'})))===JSON.stringify(nums(ui.PositionEvidence({result:browser,lang:'es'}))),'same numerical evidence EN/ES');

 const renderedText=(node)=>{if(node==null||typeof node==='boolean')return '';if(typeof node==='number'||typeof node==='string')return String(node);if(Array.isArray(node))return node.map(renderedText).join(' ');if(typeof node==='object')return renderedText(node.props?.children);return ''};
 for(const lang of ['en','es']){const text=renderedText(ui.PositionEvidence({result:browser,lang}));for(const value of [browser.subjectPricePerM2,browser.percentile,browser.distribution.minimum,browser.distribution.median,browser.distribution.p90])ok(text.includes(labels.positionNumber(value,lang)),'actual '+lang+' formatted value '+value);}
 for(const state of ['subject_unavailable','subject_ineligible','normalization_not_applicable','reference_definition_invalid','reference_evidence_incomplete','reference_population_empty','subject_participation_invalid','execution_unavailable'])ok(labels.positionStateText(state,'en')!==labels.positionStateText(state,'es'),'bilingual distinct state '+state);
 let slots=[],cursor=0,effects=[],pending=[],cleanups=[],props={listingId:id(1),lang:'en'},requests=[];
 hooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>slots[i]=typeof v==='function'?v(slots[i]):v]},useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i]},useEffect(fn,deps){const i=cursor++;if(!effects[i]||deps.some((v,j)=>v!==effects[i].deps[j])){effects[i]={fn,deps};pending.push(i)}}};
 const render=()=>{cursor=0;return ui.default(props)},flush=()=>{for(const i of pending.splice(0)){cleanups[i]?.();cleanups[i]=effects[i].fn()}};
 fetchMock=(url,init)=>{const d=deferred();requests.push({url,init,...d});return d.promise};
 render();flush();ok(requests.length===1&&!requests[0].init.method,'one configuration request');
 // StrictMode replay and mount fetch configuration only; analytical work needs a command.
 for(const i of Object.keys(effects)){cleanups[i]?.();cleanups[i]=effects[i].fn()}
 requests[0].resolve(Response.json(config));await tick();ok(requests.length===1,'zero analysis across mount/StrictMode');
 const find=(node,type)=>{if(!node)return[];if(Array.isArray(node))return node.flatMap(n=>find(n,type));if(typeof node!=='object')return[];return [...(node.type===type?[node]:[]),...find(node.props?.children,type)]};
 let tree=render();flush();let selects=find(tree,'select');ok(selects.length===2,'existing geography and normalization controls');
 find(tree,'button')[0].props.onClick();ok(requests.length===2&&requests[1].init.method==='POST','one explicitly committed analysis');
 requests[1].resolve(Response.json(browser));await tick();tree=render();
 find(tree,'select')[0].props.onChange({target:{value:'canton'}});tree=render();
 ok(requests.length===2&&find(tree,ui.PositionEvidence)[0].props.result.n===browser.n,'draft change does no analysis and preserves result');
 find(tree,'button')[0].props.onClick();tree=render();find(tree,'select')[0].props.onChange({target:{value:'province'}});tree=render();find(tree,'button')[0].props.onClick();
 ok(requests.length===4,'exactly one request per explicit command');
 const newest={...browser,n:99};requests[3].resolve(Response.json(newest));await tick();requests[2].resolve(Response.json({...browser,n:88}));await tick();tree=render();
 ok(find(tree,ui.PositionEvidence)[0].props.result.n===99,'stale old reply cannot replace latest');
 props={...props,lang:'es'};render();flush();await tick();ok(requests.length===4,'language changes cause zero acquisition');
 tree=render();find(tree,'select')[1].props.onChange({target:{value:'land'}});ok(requests.length===4,'normalization draft change causes zero acquisition');tree=render();find(tree,'button')[0].props.onClick();ok(requests.length===5&&JSON.parse(requests[4].init.body).requestedNormalizationBasis==='land','one explicit lens command');
 requests[4].reject(Error('offline failure'));await tick();tree=render();ok(find(tree,ui.PositionEvidence)[0].props.result.n===99,'failed request preserves committed result');

 // Missing default District must not issue any automatic broader analysis.
 for(const i of Object.keys(cleanups))cleanups[i]?.();slots=[];effects=[];pending=[];cleanups=[];requests=[];props={listingId:id(1),lang:'en'};
 render();flush();requests[0].resolve(Response.json(noDistrict));await tick();tree=render();flush();ok(requests.length===1&&find(tree,'select')[0].props.value==='','missing district yields zero default analyses');
 find(tree,'select')[0].props.onChange({target:{value:'canton'}});ok(requests.length===1,'broader draft selection does no analysis');tree=render();find(tree,'button')[0].props.onClick();ok(requests.length===2&&JSON.parse(requests[1].init.body).requestedGeographyLevel==='canton','broader question requires explicit command');

 for(const i of Object.keys(cleanups))cleanups[i]?.();slots=[];effects=[];pending=[];cleanups=[];requests=[];
 render();flush();for(const i of Object.keys(cleanups))cleanups[i]?.();requests[0].resolve(Response.json(config));await tick();ok(requests.length===1,'unmounted configuration cannot launch a late default analysis');
 for(const host of ['app/en/buy/listing/[id]/page.tsx','app/en/rent-lease/listing/[id]/page.tsx','app/es/comprar/anuncio/[id]/page.tsx','app/es/alquilar-arrendar/anuncio/[id]/page.tsx']){const s=fs.readFileSync(root+'/'+host,'utf8');ok(s.includes('<PriceMeterPropertyPositionListing')&&s.includes('<PriceMeterComparableListing'),'separate mount '+host);}
 console.log('PRE-14-3B1:',checks,'checks passed: actual route/auth/loader/canonical reader/math/DTO/UI; fake database and fetch only.');
})().catch(e=>{console.error(e);process.exitCode=1});
