'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript'),root=path.resolve(__dirname,'../..');let n=0,events=[],allowed=[],failure=false;
const check=(v,label)=>{assert(v,label);n++};
function load(file,mocks,env={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,process:{env},URL,Response,require:k=>{if(k in mocks)return mocks[k];throw Error('Unexpected import '+k)}});return m.exports}
(async()=>{
 const api=load('app/admin/offer-actions.ts',{'@/lib/administrative-control':{assertAdministrativePermission:async p=>{events.push(p);if(!allowed.includes(p))throw Error('denied')}},'@/lib/supabase-server':{createServerSupabaseClient:async()=>{events.push('client');return{rpc:async(name,args)=>{events.push({name,args});return failure?{error:{code:'40001',message:'private'}}:{data:{offers:[]},error:null}}}}}});
 check(!(await api.readAdminOffers()).ok&&events.length===1,'read denied before client');events=[];check(!(await api.changeAdminOffer('bad',{})).ok&&events.length===1,'manage denied before client');
 allowed=['offers.read'];events=[];check((await api.readAdminOffers({status:'active',currency:'USD'})).ok,'read allowed');check(events[2].name==='admin_offer_read'&&events[2].args.p_status==='active','fixed read RPC');
 allowed=['offers.manage'];events=[];check(!(await api.changeAdminOffer('bad',{})).ok&&events.length===1,'invalid request no RPC');failure=true;const stale=await api.changeAdminOffer('06000000-0000-4000-8000-000000000001',{});check(stale.code==='stale'&&!JSON.stringify(stale).includes('private'),'safe stale response');
 let calls=[],catalog=[{id:'addon-featured-listing',name_en:'Featured',revision:'private',configurationId:'secret'}],bad=false;
 const rpc=async(name,args)=>{calls.push({name,args});if(bad)return{error:{message:'private'}};return{data:name==='read_offer_prices'?args.p_products.map(productId=>({productId,available:true,source:'STANDARD',standardPrice:'12',effectivePrice:'12',checkoutAvailable:false})):catalog,error:null}};
 const mocks={'next/server':{NextResponse:{json:(data,init)=>Response.json(data,init)}},'@/lib/supabase-admin':{supabaseAdmin:{rpc}}};
 let route=load('app/api/offer-catalog/route.ts',mocks);check((await (await route.GET(new Request('http://local/'))).json()).state==='inactive'&&calls.length===0,'disabled presentation zero DB');
 route=load('app/api/offer-catalog/route.ts',mocks,{TWUANIS_OFFER_PRESENTATION:'canonical'});check((await route.GET(new Request('http://local/?currency=EUR'))).status===400&&calls.length===0,'invalid currency zero DB');
 let response=await route.GET(new Request('http://local/?kind=addon&currency=USD'));let payload=await response.json();check(calls.length===2,'one catalog plus one price batch');check(!JSON.stringify(payload).includes('secret')&&!JSON.stringify(payload).includes('private'),'public projection excludes private catalog');check(payload.checkoutAvailable===false&&response.headers.get('cache-control')==='no-store','inactive acquisition and no stale cache');
 catalog=[];calls=[];await route.GET(new Request('http://local/'));check(calls.length===1,'empty catalog no pricing read');
 catalog=Array.from({length:26},(_,i)=>({id:'p'+i}));calls=[];payload=await(await route.GET(new Request('http://local/'))).json();check(payload.products.length===25&&payload.next==='p24'&&calls[1].args.p_products.length===25,'bounded 25 product price batch');
 catalog.push({id:'overflow'});calls=[];check((await route.GET(new Request('http://local/'))).status===503&&calls.length===1,'oversize fails closed');
 bad=true;check((await route.GET(new Request('http://local/'))).status===503,'catalog failure fails closed');
 for(const f of ['app/admin/AdminOffers.tsx','app/components/OfferCatalog.tsx']){const text=fs.readFileSync(root+'/'+f,'utf8');check(!/supabase-admin|canonical_private|create_offer_order_snapshot|acknowledge_offer_order_paid|fulfill_addon/.test(text),'client no private machinery '+f);check(!/setInterval/.test(text),'no polling '+f)}
 const sql=fs.readFileSync(root+'/supabase/migrations/035_offer_resolution.sql','utf8');check(!/GRANT EXECUTE/.test(sql),'no runtime snapshot/payment authority');
 console.log('PASS Step6 application checks:',n);
})().catch(e=>{console.error(e);process.exitCode=1});
