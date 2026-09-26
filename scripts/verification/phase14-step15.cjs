// Final composition verification. Real production modules; fake database/FX boundaries only.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
let harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
harness=harness.replace("if(f==='lib/supabase-admin.ts')", "if(f==='lib/supabase.ts')return {supabase:{from(){throw Error('Catalog must not run during Analyze')}}};if(f==='lib/supabase-admin.ts')");
const setup=fs.readFileSync(root+'/scripts/verification/phase14-step11.cjs','utf8').split('const scenarios=String.raw`')[1].split('async function run(){')[0];
const system=String.raw`
for(const file of ['phase14-browser-result','phase14-application','comparative-discovery-action','phase14-option-catalog','phase14-listing-presentation','canonical-population','listing-monetary-value','currency-conversion'])allowed.add('lib/'+file+'.ts');
let presentationRequests=[],presentationRPCs=[],presentationMode='ok',projected=null,executions=0,projections=0;
const existingFrom15=db.from.bind(db),existingRPC15=db.rpc.bind(db);
db.from=function(table){
 if(table!=='listings')return existingFrom15(table);
 return {select(columns,options){
  if(columns!=='id,title,images,current_price,monthly_price,currency,transaction_type,canonical_domain_version,property_area,construction_area')return existingFrom15(table).select(columns,options);
  ok(projected?.state==='complete'&&projected.n>0,'presentation only after successful projection');
  let ids;const predicates=[];const q={in(k,v){eq(k,'id');ids=v;return q},eq(k,v){predicates.push([k,v]);return q},then(resolve,reject){
   ok(ids.length<=25);ok(ids.every(id=>projected.results.some(r=>r.listingId===id)));eq(predicates,[['listing_status','active'],['canonical_domain_version',1],['transaction_type',projected.transaction]]);
   presentationRequests.push([...ids]);
   let data=ids.map(id=>({...rows6.get(id),title:'Public listing',images:['https://example.invalid/first','https://example.invalid/second'],owner_id:'SECRET_OWNER',description:'SECRET_DESCRIPTION'}));
   if(presentationMode==='missing')data=[];
   return Promise.resolve({data,error:presentationMode==='failure'?Error('SECRET_STORAGE'):null}).then(resolve,reject)
  }};return q;
 }}
};
db.rpc=async(name,args)=>{
 if(!projected||name!=='read_canonical_listing_evidence'||!args.p_fact_dimensions.length)return existingRPC15(name,args);
 ok(projected?.state==='complete');presentationRPCs.push([...args.p_listing_ids]);
 eq(args.p_fact_dimensions,['bedrooms','bathrooms','parking','year_built']);
 return {error:null,data:args.p_listing_ids.map(id=>({listing_id:id,canonical_domain_version:1,
 facts:[{dimension:'bedrooms',kind:'exact',exact_value:'3',category_term_id:null,range_lower:null,range_upper:null,lower_inclusive:null,upper_inclusive:null}],
 selections:[{dimension:'property_type',ontology_term_id:'9007199254740993',term_type:'property_type',level:1,slug:'house',term_name:'House'}],
 geography:geos.slice(0,3).map(g=>({...g,term_name:'Geography',term_name_en:'Geography',term_name_es:'Geografía',slug:null,slug_en:null,slug_es:null}))}))};
};
const projector15=load('lib/phase14-browser-result.ts'),original15=projector15.toPhase14BrowserResult;
projector15.toPhase14BrowserResult=r=>{projections++;projected=original15(r);return projected};
const execute15=server.executePhase14ComparativeDiscovery;server.executePhase14ComparativeDiscovery=async(...args)=>{executions++;return execute15(...args)};
const action15=load('lib/comparative-discovery-action.ts');
async function run15(){
 const fixtures=[];
 for(const scenario of [{n:0,geo:'province'},{n:1,tx:'rent',basis:'construction',geo:'canton'},{n:26,change:(r,i)=>r.current_price=String((i%5+1)*100000)},{n:3,filters:{semantics:{environment:['3']},facts:{bedrooms:[{kind:'exact',value:'3'}]},propertyArea:'100-500m2'}},{n:2,mode:'missing'},{n:2,mode:'failure'}]){
  const p=prepare11(scenario);projected=null;executions=projections=0;presentationRequests=[];presentationRPCs=[];presentationMode=scenario.mode||'ok';
  const response=await action15.analyzePhase14Market({request:p.input,normalization:p.basis});
  eq(response.analysis.state,'complete','complete real application chain');eq(executions,1);eq(projections,1);eq(logical,order);eq(response.analysis.n,scenario.n);
  eq(presentationRequests.flat().sort(),response.analysis.results.map(r=>r.listingId).sort(),'exact result ID set');
  eq(presentationRequests.length,Math.ceil(scenario.n/25));
  eq(response.listings.length,scenario.mode?0:scenario.n,'real ordinary reader enrichment');
  if(!scenario.mode&&scenario.n){eq(response.listings[0].bedrooms,3);eq(response.listings[0].bathrooms,null);eq(response.listings[0].thumbnail,'https://example.invalid/first')}
  ok(!JSON.stringify(response).includes('SECRET'));ok(!JSON.stringify(response).includes('/second'));
  fixtures.push({request:{request:p.input,normalization:p.basis},response});
 }
 for(const gate of ['authentication','entitlement']){
  const p=prepare11();auth=gate!=='authentication';entitled=false;projected=null;presentationRequests=[];
  const r=await action15.analyzePhase14Market({request:p.input,normalization:p.basis});eq(r.analysis.code,gate+'_required');eq(logical,['1']);eq(presentationRequests,[]);zeroExpensive();
 }
 console.log(JSON.stringify({part:'system-chain',status:'PASS',checks,fixtures:fixtures.map(f=>({n:f.response.analysis.n,transaction:f.response.analysis.transaction,normalization:f.response.analysis.normalization,geography:f.response.analysis.question.geography.level,presentation:f.response.listings.length})),liveIO:false}));
 return fixtures;
}
return run15();`;
const browserHarness=fs.readFileSync(root+'/scripts/verification/phase14-step13.cjs','utf8').split('async function main(){')[0];
const browser=String.raw`
const resultUI=loader()('app/components/Phase14Results.tsx').default;
for(const fixture of fixtures){
 const a=fixture.response.analysis,before=JSON.stringify(a),joined=presentation.joinPresentation(a,fixture.response.listings);
 ok(presentation.matchesSubmission(a,fixture.request,a.question.geography.termId));eq(joined.length,a.n);
 for(const direction of ['asc','desc']){const ordered=presentation.sortRows(joined,{column:'pricePerM2',direction});eq(new Set(ordered.map(r=>r.analysis.listingId)).size,a.n);const pages=[];for(let page=1;page<=Math.ceil(a.n/25);page++)pages.push(...presentation.pageRows(ordered,page,25));eq(pages.map(r=>r.analysis.listingId),ordered.map(r=>r.analysis.listingId))}
 for(const language of ['en','es']){
  const html=dom.renderToStaticMarkup(React.createElement(resultUI,{result:a,listings:fixture.response.listings,labels:{en:['Committed question'],es:['Pregunta comprometida']},language}));
  ok(html.includes(language==='en'?'Market Question':'Pregunta de mercado'));ok(html.includes(a.unit)||a.n===0);
  eq((html.match(/<tr>/g)||[]).length,a.n?Math.min(a.n,25)+1:0);
  ok(!html.includes('SECRET'));if(a.n)ok(html.includes(presentation.listingHref(a.results[0].listingId,a.transaction,language)));
 }
 eq(JSON.stringify(a),before,'browser preserves real projected result');
}
console.log(JSON.stringify({part:'actual-result-to-browser',status:'PASS',checks,liveIO:false}));
`;
(async()=>{
 const fixtures=await new Function('require','__dirname',harness+'\n'+setup+'\n'+system)(require,__dirname);
 new Function('require','__dirname','fixtures',browserHarness+'\n'+browser)(require,__dirname,fixtures);
})().catch(e=>{console.error(e);process.exitCode=1});
