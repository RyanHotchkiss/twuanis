// Offline only: current-user context, real generic gate, real Step 11/12 action path.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
let uiHarness=fs.readFileSync(root+'/scripts/verification/phase14-step13.cjs','utf8').split('async function main(){')[0];
uiHarness=uiHarness.replace("if(name==='server-only')return {};","if(name==='server-only')return {};if(name==='lucide-react')return {LockKeyhole:()=>null};");
const uiTests=String.raw`
async function run14(){
 let identity=null,error=null,throwAuth=false,authCalls=0,otherCalls=0;
 const client={auth:{getUser:async()=>{authCalls++;if(throwAuth)throw Error('private');return{data:{user:identity},error}}},rpc(){otherCalls++;throw Error('Entitlement prohibited in presentation context')},from(){otherCalls++;throw Error('No established tier/role mapping')}};
 const context=loader({'lib/supabase-server.ts':{createServerSupabaseClient:async()=>client}})('lib/current-user-permissions-action.ts');
 const empty={authenticated:false,premium:false,enterprise:false,roles:[]};
 eq(await context.loadCurrentUserPermissionContext(),empty);
 for(const malicious of [{premium:true,enterprise:true,roles:['buyer']},{user_metadata:{premium:true,roles:['buyer']}},{app_metadata:{enterprise:true,roles:['developer']}},{package:{hierarchy_level:999,slug:'premium'},entitlements:['price-m2-intelligence']}]){
  identity={id:'real-user',...malicious};eq(await context.loadCurrentUserPermissionContext(),{...empty,authenticated:true});
 }
 error=Error('denied');eq(await context.loadCurrentUserPermissionContext(),empty);error=null;throwAuth=true;eq(await context.loadCurrentUserPermissionContext(),empty);throwAuth=false;eq(otherCalls,0);
 let mounts=0;const ui=loader({'app/components/Phase14Discovery.tsx':{__esModule:true,default:()=>{mounts++;return React.createElement('section',null,'PRODUCT')}} ,'lib/current-user-permissions-action.ts':{loadCurrentUserPermissionContext:async()=>empty}});
 const Surface=ui('app/components/ComparativeDiscoveryAccess.tsx').ComparativeDiscoveryPermissionSurface,permissions=ui('lib/permissions.ts');
 const outcomes=[];
 for(const language of ['en','es'])for(const restrictedBehavior of ['lock','hide'])for(const authenticated of [false,true])for(const premium of [false,true])for(const enterprise of [false,true])for(const roles of [[],['buyer'],['seller'],['agent'],['brokerage'],['developer']]){
  const user={authenticated,premium,enterprise,roles};const allowed=authenticated&&(premium||enterprise)&&roles.length>0;
  const expected=allowed?'allow':restrictedBehavior;eq(permissions.resolveWidgetGate('price-per-square-meter',user,restrictedBehavior),expected);
  mounts=0;const html=dom.renderToStaticMarkup(React.createElement(Surface,{user,language,restrictedBehavior}));eq(mounts,allowed?1:0);eq(html.includes('PRODUCT'),!!allowed);
  if(expected==='hide')eq(html,'');if(expected==='lock'){ok(html.includes(language==='es'?'Acceso Bloqueado':'Access Locked'));ok(!html.includes('<input'));ok(!html.includes('<table'));ok(!html.includes('Analyze Market'))}
  outcomes.push(expected);
 }
 eq(permissions.getWidgetRequiredPermission('price-per-square-meter'),'premium');
 const hook=hookHarness();let loads=0;const access=loader({react:hook.react,'app/components/Phase14Discovery.tsx':{__esModule:true,default:()=>null},'lib/current-user-permissions-action.ts':{loadCurrentUserPermissionContext:async()=>{loads++;return {...empty,authenticated:true}}}})('app/components/ComparativeDiscoveryAccess.tsx');
 let tree=hook.render(access.default,{language:'en'});eq(tree.props.user,empty);await hook.effects();tree=hook.render(access.default,{language:'es'});eq(tree.props.user,{...empty,authenticated:true});eq(loads,1);
 const graphSource=fs.readFileSync(root+'/scripts/verification/pre14-phase11-boundary.cjs','utf8'),fragment=graphSource.slice(graphSource.indexOf('// Follow runtime'),graphSource.indexOf('const contract =')),graph={};
 vm.runInNewContext(fragment+'\nresult.roots=roots.length;result.modules=visited.size;',{fs,path,cp,root,ts,ok,forbidden:new Set(['lib/current-user-permissions.ts','lib/phase14-server-discovery.ts','lib/phase14-browser-result.ts','lib/phase14-application.ts']),result:graph});
 console.log(JSON.stringify({part:'context-and-gate',status:'PASS',checks,authCalls,packageEntitlementRoleReads:otherCalls,gateFixtures:outcomes.length,clientRoots:graph.roots,runtimeModules:graph.modules,liveIO:false}));
}
return run14();`;
let harness=fs.readFileSync(root+'/scripts/verification/phase14-step1.cjs','utf8').split('async function main(){')[0];
harness=harness.replace("if(f==='lib/supabase-admin.ts')", "if(f==='lib/phase14-listing-presentation.ts')return {getPhase14ListingPresentation:async()=>{presentation14++;return []}};if(f==='lib/phase14-option-catalog.ts')return {readPhase14OptionCatalog:async()=>{throw Error('No catalog in action')}};if(f==='lib/supabase-admin.ts')");
const setup=fs.readFileSync(root+'/scripts/verification/phase14-step11.cjs','utf8').split('const scenarios=String.raw`')[1].split('async function run(){')[0];
const actionTests=String.raw`
allowed.add('lib/phase14-browser-result.ts');allowed.add('lib/phase14-application.ts');allowed.add('lib/comparative-discovery-action.ts');
let execution14=0,project14=0;const originalExecute=server.executePhase14ComparativeDiscovery;server.executePhase14ComparativeDiscovery=async(...a)=>{execution14++;return originalExecute(...a)};
const projection14=load('lib/phase14-browser-result.ts'),originalProject=projection14.toPhase14BrowserResult;projection14.toPhase14BrowserResult=(r)=>{project14++;return originalProject(r)};
const action14=load('lib/comparative-discovery-action.ts');
async function runAction14(){
 const denied=[];
 for(const state of ['unauthenticated','unentitled','stale-ui-allow']){
  const p=prepare11();auth=state!=='unauthenticated';entitled=false;presentation14=execution14=project14=0;
  const result=await action14.analyzePhase14Market({request:p.input,normalization:p.basis});
  eq(result,{analysis:{state:'error',contractVersion:1,code:auth?'entitlement_required':'authentication_required'}});
  eq(logical,['1']);eq(counters8().slice(1),Array(counters8().length-1).fill(0));ok(calls.every(c=>c.auth||c.entitlement));eq(analyticalCounters(),Array(analyticalCounters().length).fill(0));eq(buildCalls,0);eq(presentation14,0);eq(execution14,1);eq(project14,1);
  denied.push({state,physical:physical(),executionCalls:execution14,safeFailureProjections:project14,successfulProjections:0,presentationCalls:presentation14});
 }
 for(const tx of ['sale','rent'])for(const basis of ['land','construction']){
  const p=prepare11({tx,basis,n:2});presentation14=execution14=project14=0;
  const result=await action14.analyzePhase14Market({request:p.input,normalization:p.basis});eq(result.analysis.state,'complete');eq(result.analysis.n,2);eq(execution14,1);eq(project14,1);eq(presentation14,1);ok(calls.some(c=>c.auth));ok(calls.some(c=>c.entitlement));
  // Same input, later lost entitlement: a second execution must reauthorize, never reuse UI authority.
  auth=true;entitled=false;calls=[];logical=[];presentation14=0;
  const again=await action14.analyzePhase14Market({request:p.input,normalization:p.basis});eq(again.analysis.code,'entitlement_required');eq(logical,['1']);eq(presentation14,0);ok(calls.some(c=>c.auth));ok(calls.some(c=>c.entitlement));
 }
 console.log(JSON.stringify({part:'real-server-action',status:'PASS',checks,denied,liveIO:false}));
}
return runAction14();`;
(async()=>{
 await new Function('require','__dirname',uiHarness+'\n'+uiTests)(require,__dirname);
 await new Function('require','__dirname','let presentation14=0;\n'+harness+'\n'+setup+'\n'+actionTests)(require,__dirname);
})().catch(e=>{console.error(e);process.exitCode=1});
