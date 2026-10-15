// Local route security tests and actual FX modules against read-only staging REST.
// Credentials are supplied in memory by the staging-only launcher.
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),cache=new Map();
const {createClient}=require('@supabase/supabase-js');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(url,'https://zryfurtogxvrnilnnadn.supabase.co');
assert(!process.env.BCCR_API_TOKEN);
let requests=0, allowed=true, actor='fe0f4718-ac10-4091-8ec3-081a96765991', safe=true;
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
 const u=new URL(String(input));assert.equal(u.origin,url);assert.equal(init?.method||'GET','GET');requests++;return fetch(input,init);
}}});
function load(file){
 file=path.normalize(file);if(cache.has(file))return cache.get(file).exports;
 if(file==='lib/supabase-admin.ts')return {supabaseAdmin:db};
 if(file==='lib/administrative-control.ts')return {assertOwner:async()=>{if(!allowed)throw Error('denied');return{actorId:actor,owner:true}}};
 if(file==='lib/staging-server-guard.ts')return {assertStagingServerEnvironment:()=>{if(!safe)throw Error('identity')}};
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const req=name=>{if(name==='server-only')return{};if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+'.ts');return require(name)};
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(req,module,module.exports);return module.exports;
}
(async()=>{
 let checks=0;const ok=(v)=>{assert(v);checks++};
 const report=await load('lib/staging-fx-negative-acceptance.ts').runStagingFxNegativeAcceptance();
 ok(report.passed);for(const v of Object.values(report.checks))ok(v);
 const resolver=load('lib/fx/fx-resolver.ts');
 for(const date of ['bad','2026-02-30']){await assert.rejects(()=>resolver.resolveExactHistoricalFxRate(date));checks++}
 const service=load('lib/fx/fx-service.ts');const provider=load('lib/fx/bccr-provider.ts');
 await assert.rejects(()=>provider.fetchBccrReferenceSaleRate('2026-10-09'),/BCCR_API_TOKEN is not configured/);checks++;
 // Local transport failure injection, never a simulated hosted BCCR observation.
 const originalFetch=global.fetch;let providerCalls=0;process.env.BCCR_API_TOKEN='local-fault-injection-only';
 global.fetch=async()=>{providerCalls++;return new Response('',{status:503})};
 try{await assert.rejects(()=>provider.fetchBccrReferenceSaleRate('2026-10-09'),/HTTP 503/);checks++;ok(providerCalls===1)}finally{global.fetch=originalFetch;delete process.env.BCCR_API_TOKEN}
 const route=load('app/api/staging/fx-negative-acceptance/route.ts');
 const request=(suffix='',origin='https://lab.example',body)=>new Request('https://lab.example/api/staging/fx-negative-acceptance'+suffix,{method:'POST',headers:{origin},...(body===undefined?{}:{body})});
 process.env.TWUANIS_ENVIRONMENT='production';process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT='production';process.env.TWUANIS_STAGING_FX_NEGATIVE_ACCEPTANCE='1';ok((await route.POST(request())).status===404);
 process.env.TWUANIS_ENVIRONMENT='staging';process.env.NEXT_PUBLIC_TWUANIS_ENVIRONMENT='staging';delete process.env.TWUANIS_STAGING_FX_NEGATIVE_ACCEPTANCE;ok((await route.POST(request())).status===404);
 process.env.TWUANIS_STAGING_FX_NEGATIVE_ACCEPTANCE='1';safe=false;ok((await route.POST(request())).status===404);safe=true;
 ok((await route.POST(request('','https://evil.example'))).status===400);ok((await route.POST(request('?date=x'))).status===400);ok((await route.POST(request('','https://lab.example','{}'))).status===400);
 allowed=false;ok((await route.POST(request())).status===403);allowed=true;actor='04f11ff2-05d2-4472-84de-6052d78bc9d1';ok((await route.POST(request())).status===403);actor='fe0f4718-ac10-4091-8ec3-081a96765991';
 process.env.BCCR_API_TOKEN='local-gate-test-only';let before=requests;ok((await route.POST(request())).status===409);ok(requests===before);delete process.env.BCCR_API_TOKEN;
 const result=await route.POST(request());ok(result.status===200);ok((await result.json()).passed);ok(result.headers.get('cache-control')==='no-store');
 console.log(JSON.stringify({checks,sharedFxBoundaries:report,readOnlyStagingRequests:requests,localProvider503Injection:'PASS',routeAuthorityTests:'mocked-local-authority-only',hostedDiagnostic:'NOT DEPLOYED'}));
})().catch(e=>{console.error(e.message);process.exitCode=1});
