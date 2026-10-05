'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),crypto=require('crypto'),root=path.resolve(__dirname,'../..');let checks=0;
const ok=(v,l)=>{assert(v,l);checks++};
function load(file,mocks,env={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,process:{env},URL,Response,Request,TextDecoder,Uint8Array,Buffer,File,FormData,require:k=>{if(k in mocks)return mocks[k];throw Error('Unexpected import '+k)}});return m.exports}
(async()=>{
 let calls=[],allowed=[],bad=false;
 const auth={assertAdministrativePermission:async p=>{calls.push(p);if(!allowed.includes(p))throw Error('denied');return{actorId:'a'}}};
 const db={rpc:async(name,args)=>{calls.push({name,args});return bad?{error:{code:'40001',message:'private'}}:{data:[],error:null}}};
 const actions=load('app/admin/campaign-actions.ts',{'@/lib/administrative-control':auth,'@/lib/supabase-server':{createServerSupabaseClient:async()=>db}});
 ok(!(await actions.readCampaigns()).ok&&calls.length===1,'read permission before DB');calls=[];
 ok(!(await actions.changeCampaign(crypto.randomUUID(),{})).ok&&calls.length===1,'manage permission before DB');
 allowed=['promotions.read'];calls=[];ok((await actions.campaignOptions('FEATURE')).ok,'options authorized');ok(calls[1].name==='admin_campaign_options'&&calls[1].args.p_kind==='FEATURE','fixed option boundary');
 allowed=['promotions.manage'];calls=[];ok(!(await actions.changeCampaign('bad',{})).ok&&calls.length===1,'malformed request no DB');bad=true;ok((await actions.changeCampaign(crypto.randomUUID(),{})).code==='stale','stale safe result');bad=false;
 const contract=load('lib/campaign-contract.ts',{}),body=load('lib/campaign-request-body.ts',{'server-only':{}});
 ok(contract.campaignRoute('/admin')===null,'admin has no public Campaign resolution');ok(contract.campaignRoute('/en/market-intelligence/packages').surfaces[0]==='package','real package route');ok(contract.campaignRoute('/es/inteligencia-de-mercado').surfaces[0]==='intelligence-hub','ES intelligence route');ok(contract.campaignRoute('/en/checkout')===null,'unregistered route');
 for(const route of ['/en','/es','/en/market-hub','/es/centro-de-mercado','/en/market-intelligence','/es/inteligencia-de-mercado','/en/market-intelligence/packages','/es/inteligencia-de-mercado/paquetes']){ok(fs.existsSync(root+'/app'+route+'/page.tsx')&&contract.campaignRoute(route),'registered route exists '+route)}
 let threw=false;try{await body.campaignRequestBytes(new Request('http://local',{method:'POST',body:'x'.repeat(100)}),50)}catch{threw=true}ok(threw,'stream rejected before parsing at byte bound');
 const sid=crypto.randomUUID();let cookiesSet=[],authCount=0,rpcCount=0,events=[],user=null,authError=null,data={session:sid,items:[{token:crypto.randomUUID(),surface:'homepage',headline:'H',copy:'C',cta:'Learn',destination:'/en',alt:'',image:null,video:null}]};
 const mocks={'node:crypto':crypto,'@/lib/campaign-request-body':body,'@/lib/campaign-contract':contract,'next/server':{NextResponse:{json:(value,init)=>{const r=Response.json(value,init);r.cookies={set:(...a)=>cookiesSet.push(a)};return r}}},'@/lib/supabase-server':{createServerSupabaseClient:async()=>({auth:{getUser:async()=>{authCount++;return{data:{user},error:authError}}}})},'@/lib/supabase-admin':{supabaseAdmin:{rpc:async(name,args)=>{rpcCount++;events.push({name,args});return{data,error:null}}}}};
 function req(input,origin='http://local',cookie=null){const r=new Request('http://local/api/campaigns',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});r.nextUrl=new URL(r.url);r.cookies={get:()=>cookie?{value:cookie}:undefined};return r}
 let route=load('app/api/campaigns/route.ts',mocks);await route.POST(req({operation:'resolve',path:'/en'}));ok(rpcCount===0&&authCount===0,'dormant zero DB/auth');
 route=load('app/api/campaigns/route.ts',mocks,{TWUANIS_CAMPAIGNS:'canonical',NEXT_PUBLIC_SUPABASE_URL:'https://storage.example'});
 ok((await route.POST(req({operation:'resolve',path:'/en'},'https://evil.example'))).status===400&&rpcCount===0,'origin denied before DB');
 await route.POST(req({operation:'resolve',path:'/admin'}));ok(rpcCount===0,'unregistered route zero DB');
 const response=await route.POST(req({operation:'resolve',path:'/en',authenticated:true}));ok(rpcCount===1&&authCount===1,'one bounded resolution call');ok(events.at(-1).args.p_authenticated===false,'browser cannot choose audience');ok(events.at(-1).args.p_surfaces.length===3,'bounded surface set');ok(response.headers.get('cache-control')==='no-store','private response not cached');ok(cookiesSet.at(-1)[2].httpOnly&&cookiesSet.at(-1)[2].sameSite==='lax','minimal session cookie');
 user={id:'ordinary'};await route.POST(req({operation:'resolve',path:'/es'}));ok(events.at(-1).args.p_authenticated===true&&events.at(-1).args.p_language==='es','provider-verified audience and route language');
 let before=rpcCount;authError={name:'AuthUnknownError'};await route.POST(req({operation:'resolve',path:'/en'}));ok(rpcCount===before,'auth failure fails closed');authError=null;
 await route.POST(req({operation:'events',events:[{token:sid,kind:'impression'}]},'http://local',sid));ok(events.at(-1).name==='report_campaign_events','purpose-built reporting boundary');
 before=rpcCount;await route.POST(req({operation:'events',events:Array(7).fill({token:sid,kind:'click'})},'http://local',sid));ok(rpcCount===before,'oversized event batch rejected');
 // Actual upload route with in-memory SDK boundaries; no network or filesystem media writes.
 let mediaCalls=[],exists=false,uncertain=false,completed=false;const mediaId=crypto.randomUUID(),mediaPath='system/campaigns/'+mediaId+'.jpg';
 const mdb={rpc:async(name,args)=>{mediaCalls.push(name);return{data:name==='admin_campaign_media'?{path:mediaPath,completed}:{id:mediaId},error:null}}};
 const bucket={info:async()=>{mediaCalls.push('info');return uncertain?{error:{statusCode:'503'}}:exists?{data:{size:4,contentType:'image/jpeg'}}:{error:{statusCode:'404'}}},upload:async()=>{mediaCalls.push('upload');return{error:null}}};
 const media=load('app/api/campaign-media/route.ts',{'node:crypto':crypto,'@/lib/campaign-request-body':body,'next/server':mocks['next/server'],'@/lib/administrative-control':auth,'@/lib/supabase-server':{createServerSupabaseClient:async()=>mdb},'@/lib/supabase-admin':{supabaseAdmin:{storage:{from:b=>{ok(b==='campaign-media','independent Campaign bucket');return bucket}}}}});
 function mediaReq(type='image/jpeg',bytes=new Uint8Array([255,216,255,0])){const form=new FormData();form.set('request',sid);form.set('file',new File([bytes],'test.jpg',{type}));const r=new Request('http://local/api/campaign-media',{method:'POST',headers:{origin:'http://local'},body:form});r.nextUrl=new URL(r.url);return r}
 const upload=await media.POST(mediaReq());ok(upload.status===200&&mediaCalls.join(',')==='admin_campaign_media,info,upload,admin_campaign_media_complete','upload follows prepared identity then confirms');
 mediaCalls=[];exists=true;await media.POST(mediaReq());ok(!mediaCalls.includes('upload'),'existing upload retained for attachment retry');
 mediaCalls=[];uncertain=true;ok((await media.POST(mediaReq())).status===400&&!mediaCalls.includes('upload')&&!mediaCalls.includes('admin_campaign_media_complete'),'uncertain storage no overwrite/attach/delete');
 mediaCalls=[];uncertain=false;completed=true;await media.POST(mediaReq());ok(!mediaCalls.includes('info')&&!mediaCalls.includes('upload'),'completed retry no storage work');
 mediaCalls=[];ok((await media.POST(mediaReq('image/jpeg',new Uint8Array([1,2,3,4])))).status===400&&mediaCalls.length===0,'invalid signature before preparation');
 allowed=[];ok((await media.POST(mediaReq())).status===400&&mediaCalls.length===0,'unauthorized media no storage');
 for(const file of ['app/components/CampaignPlacements.tsx','app/admin/AdminPromotions.tsx']){const text=fs.readFileSync(root+'/'+file,'utf8');ok(!/setInterval|supabase-admin|canonical_private/.test(text),'no client polling/private imports '+file)}
 ok(fs.readFileSync(root+'/app/components/CampaignPlacements.tsx','utf8').includes('sent.current.clear()'),'navigation bounds event dedupe memory');
 console.log(JSON.stringify({status:'PASS',checks,scope:'actual server modules with offline provider/storage mocks'}));
})().catch(e=>{console.error(e);process.exitCode=1});
