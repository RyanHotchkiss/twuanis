// Reuse only the established offline fixture setup, not the Step 11 test suite.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const one=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8');
const eleven=fs.readFileSync(root+'/scripts/verification/phase14-step11.cjs','utf8');
const harness=one.split('async function main(){')[0];
const setup=eleven.split('const scenarios=String.raw`')[1].split('async function run(){')[0];
if(!setup.includes('function prepare11('))throw Error('Offline fixture boundary changed');
const tests=String.raw`
allowed.add('lib/phase14-browser-result.ts');
const projector=load('lib/phase14-browser-result.ts');
const keys=(o,list)=>eq(Object.keys(o).sort(),list.split(' ').sort(),'exact field allowlist');
const failureKeys='state contractVersion code';
const topKeys='state contractVersion question transaction normalization unit n resultCount distribution results resultOrder snapshotGuaranteed';
const metricKeys='pricePerM2 belowCount equalCount aboveCount percentilePosition percentileMethod differenceFromMedian percentDifferenceFromMedian percentageReference interval strictTail';
const stats=['minimum','p10','p25','median','average','p75','p90','maximum','iqr'];
function graphObjects(v,set=new Set()){
 if(v&&typeof v==='object'&&!set.has(v)){set.add(v);for(const child of Object.values(v))graphObjects(child,set)}return set;
}
function denied(v){assert.throws(()=>server.assertPhase14ServerOutcome(v));checks++;eq(projector.toPhase14BrowserResult(v),{state:'error',contractVersion:1,code:'execution_failed'})}
function project(r){
 const ext=counters8(),calc=analyticalCounters(),logicalBefore=[...logical],build=buildCalls;
 const b=projector.toPhase14BrowserResult(r);
 eq(counters8(),ext,'zero acquisition, authorization, FX, observations, identities');eq(analyticalCounters(),calc,'zero comparative calculations');eq(logical,logicalBefore,'no stage rerun');eq(buildCalls,build,'no Step10 rebuild');
 eq(JSON.parse(JSON.stringify(b)),b,'plain JSON round trip');return b;
}
function success(r){
 server.assertPhase14ServerOutcome(r);checks++;
 const b=project(r);ok(b.state==='complete',JSON.stringify(b));keys(b,topKeys);
 const q=r.marketExecution.question,t=r.result;
 keys(b.question,'transaction geography propertyType filters');keys(b.question.geography,'level officialCode termId');keys(b.question.propertyType,'termId');
 eq(b.question,{transaction:q.transaction,geography:{level:q.geography.level,officialCode:q.geography.officialCode,termId:q.geography.termId},propertyType:{termId:q.propertyType.termId},filters:q.filters});
 for(const [dim,values]of Object.entries(b.question.filters.semantics||{}))ok(['environment','terrain','utility','accessibility','legal_status'].includes(dim)&&values.every(x=>typeof x==='string'));
 for(const values of Object.values(b.question.filters.facts||{}))for(const c of values){keys(c,c.kind==='exact'?'kind value':c.kind==='category'?'kind termId':'kind interval');if(c.kind==='interval')keys(c.interval,'lower upper lowerInclusive upperInclusive')}
 eq([b.transaction,b.normalization,b.unit,b.n,b.resultCount],[r.transaction,r.normalization,t.unit,t.n,t.resultCount]);
 eq(b.results.length,t.results.length);eq(b.snapshotGuaranteed,false);eq(b.resultOrder,t.resultOrder);keys(b.resultOrder,'primary exactTieOrder exactTieOrderMeaning');
 keys(b.distribution,'state '+stats.join(' '));eq(b.distribution.state,t.distribution.state);
 for(const k of stats)eq(b.distribution[k],t.distribution.statistics[k]);
 for(let i=0;i<b.results.length;i++){
  const out=b.results[i],record=t.results[i],e=record.evidence;keys(out,'listingId '+metricKeys);eq(out.listingId,record.listingId);
  for(const k of metricKeys.split(' '))eq(out[k],e[k]);
  if(out.strictTail)keys(out.strictTail,'thresholdPercentile thresholdPricePerM2 differenceFromThreshold percentDifferenceFromThreshold percentageReference');
 }
 const internal=graphObjects(r);for(const o of graphObjects(b))ok(!internal.has(o),'every DTO object severs upstream identity');
 const forbidden=new Set('source population observation hydratedPopulation factPopulation membershipPopulation fundamentalPopulation geographicPopulation marketExecution analyticalExecution trace ledger finalListingIds exclusions analyticalExclusions executionAttemptId invocationId marketExecutionId marketQuestionIdentity analyticalQuestionIdentity fx fxIdentity exchangeRate originalCurrency userId authenticatedUserId entitlement permit subscription owner_id ownerId source_url sourceUrl description images title current_price monthly_price price_millions rank score confidence'.split(' '));
 for(const o of graphObjects(b))for(const k of Object.keys(o))ok(!forbidden.has(k),'forbidden field '+k);
 denied(b);denied(JSON.parse(JSON.stringify(b)));
 return b;
}
function failureCheck(r,code){
 ok(r.state!=='complete');server.assertPhase14ServerOutcome(r);checks++;
 const b=project(r);keys(b,failureKeys);eq(b,{state:'error',contractVersion:1,code});
 for(const o of graphObjects(r)){ok(Object.isFrozen(o));for(const k of Object.keys(o))ok(!Reflect.set(o,k,null),'failure immutable')}
 for(const fake of[{...r},JSON.parse(JSON.stringify(r)),Object.freeze({...r}),{state:r.state,reason:r.reason}])denied(fake);
 return b;
}
async function run12(){
 const fixtures=[];let genuine;
 for(const options of[{n:0},{n:1},{n:2},{n:3},{n:21,change:(r,i)=>r.current_price=String(i*200)},
   {basis:'construction'},{tx:'rent'},{tx:'rent',basis:'construction'},{geo:'province'},{geo:'canton'},{filters:fullFilters()},
   {change:(r,i)=>r.current_price=String([300,100,100,200][i-1]*200)}, {n:1001}, {usd:true}]){
   const {result:r}=await run11(options);const b=success(r);genuine=r;
   fixtures.push({n:b.n,transaction:b.transaction,normalization:b.normalization,geography:b.question.geography.level});
   if(options.n===0){eq(b.results,[]);eq(b.distribution.state,'empty');for(const k of stats)eq(b.distribution[k],null)}
   if(options.n===21){ok(b.results.some(x=>x.strictTail?.thresholdPercentile===10));ok(b.results.some(x=>x.strictTail?.thresholdPercentile===90));ok(b.results.some(x=>x.strictTail===null));eq(new Set(b.results.map(x=>x.interval)).size,7)}
   if(options.n===1001){eq(b.results.length,1001);ok(b.results.every(x=>x.pricePerM2===b.results[0].pricePerM2));eq(new Set(b.results.map(x=>x.listingId)).size,1001)}
   if(options.change&&options.n!==21){eq(b.results.map(x=>x.pricePerM2),[100,100,200,300]);eq(b.results[0].percentilePosition,b.results[1].percentilePosition)}
 }
 // Empty authentic populations allow all request forms to be tested without adding matching semantics.
 for(const interval of[{lower:null,upper:'5',lowerInclusive:false,upperInclusive:true},{lower:'1',upper:null,lowerInclusive:true,upperInclusive:false},{lower:'1',upper:'5',lowerInclusive:false,upperInclusive:true}]){
  const filters=fullFilters();filters.semantics.environment=['4','3'];filters.facts.bedrooms=[{kind:'exact',value:'3'},{kind:'category',termId:'9'},{kind:'interval',interval}];
  const {result:r}=await run11({n:0,filters});const b=success(r);eq(b.question.filters.facts.bedrooms.length,3);eq(b.question.filters.semantics.environment,['3','4']);
 }
 denied({...genuine});denied(JSON.parse(JSON.stringify(genuine)));denied({state:'complete'});denied(null);denied(undefined);
 const failures=[];
 for(const scenario of['question','normalization','authentication','entitlement','query','incomplete','unexpected','unknown']){
  const p=prepare11();let basis=p.basis;
  if(scenario==='question')delete p.input.question.propertyType;
  if(scenario==='normalization')basis='automatic';
  if(scenario==='authentication')auth=false;if(scenario==='entitlement')entitled=false;
  if(scenario==='query')injection={stage:'2',mode:'query'};
  if(scenario==='incomplete')injection={stage:'8',mode:'structured'};
  if(scenario==='unexpected')injection={stage:'2',mode:'throw'};
  if(scenario==='unknown')swap={stage:'2',value:Object.freeze({state:'incomplete',reason:'SECRET_UNRECOGNIZED_REASON'})};
  const r=await server.executePhase14ComparativeDiscovery(p.input,basis);
  const code=['question','normalization'].includes(scenario)?'invalid_request':scenario==='authentication'?'authentication_required':scenario==='entitlement'?'entitlement_required':'execution_failed';
  failureCheck(r,code);failures.push({scenario,code});
 }
 const contract=fs.readFileSync(root+'/lib/phase14-browser-contract.ts','utf8');
 const ast=ts.createSourceFile('contract.ts',contract,ts.ScriptTarget.Latest,true);
 ok(ast.statements.every(ts.isTypeAliasDeclaration),'browser contract types only, zero imports');
 const proj=ts.createSourceFile('projector.ts',fs.readFileSync(root+'/lib/phase14-browser-result.ts','utf8'),ts.ScriptTarget.Latest,true);
 function noSpread(n){ok(!ts.isSpreadAssignment(n)&&!ts.isSpreadElement(n),'no projection spreads');ts.forEachChild(n,noSpread)}noSpread(proj);
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8');
 const fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract ='));
 const protectedFiles=fs.readdirSync(root+'/lib').filter(x=>x.startsWith('phase14-')&&x.endsWith('.ts')&&!['phase14-question-contract.ts','phase14-browser-contract.ts'].includes(x)).map(x=>'lib/'+x);
 const graph={};vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;',{fs,path,cp,root,ts,ok,forbidden:new Set(protectedFiles),result:graph});
 console.log(JSON.stringify({status:'PASS',checks,fixtures,failures,largestResultCount:1001,clientRoots:graph.roots,runtimeModules:graph.modules,protectedModules:protectedFiles.length,violations:0,projectionExternalCalls:0,projectionAnalyticalCalls:0,liveIO:false},null,2));
}
return run12();
`;
new Function('require','__dirname',harness+'\n'+setup+'\n'+tests)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
