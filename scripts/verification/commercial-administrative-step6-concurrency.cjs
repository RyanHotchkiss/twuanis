'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/offer-resolution-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55456 -c listen_addresses=`,'start']);started=true;
 sql('CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;');
 sql(file('outputs/CG-S11-B/disposable-install-fixture.sql').replaceAll('end;$function$','end;$function$;').replaceAll('\n$function$\n','\n$function$;\n'));
 sql(`CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;GRANT USAGE ON SCHEMA auth TO authenticated,anon,service_role;`);
 for(let i=2;i<=25;i++){const f=fs.readdirSync(root+'/supabase/migrations').find(f=>f.startsWith(String(i).padStart(3,'0')+'_'));sql(file('supabase/migrations/'+f));}
 sql(`INSERT INTO auth.users(id) VALUES('${owner}'),('${customer}');`);
 // Existing target reject function is absent from the historical fixture: minimal compatible dependency.
 sql(`CREATE FUNCTION public.reject_sinpe_payment(p_payment_id uuid,p_rejection_reason text) RETURNS TABLE(payment_id uuid,subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,rejection_reason text,rejected_at timestamptz) LANGUAGE sql AS $$ SELECT p_payment_id,NULL::uuid,NULL::uuid,NULL::uuid,'rejected','cancelled',p_rejection_reason,now() $$;`);
 sql(file('supabase/migrations/026_administrative_control_foundation.sql'));
 sql(file('supabase/migrations/027_administrative_listing_boundary.sql'));
 sql(file('supabase/migrations/028_administrative_listing_reads.sql'));
 sql('CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text,metadata jsonb);');
 sql(file('supabase/migrations/029_administrative_media.sql'));

 sql(file('supabase/migrations/030_intelligence_package_configurations.sql'));
 sql(file('supabase/migrations/031_addon_catalog.sql'));
 sql(file('supabase/migrations/032_addon_customer_bulk_import.sql'));
 sql(`UPDATE user_subscriptions SET current_period_start=now()-interval '1 day',current_period_end=now()+interval '1 year' WHERE user_id='${customer}';`);

 sql(file('supabase/migrations/033_addon_fulfillment_placement.sql'));

 sql(file('supabase/migrations/034_offer_authority.sql'));sql(file('supabase/migrations/035_offer_resolution.sql'));



 function parallel(q){return new Promise(resolve=>{const p=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('close',code=>resolve({code,out,err}));p.stdin.end(q)})}
 const admin=(c,id=crypto.randomUUID())=>`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:owner,role:'authenticated',aal:'aal1'}))},true);SELECT public.admin_offer_command('${id}',${lit(JSON.stringify(c))});COMMIT;`;
 const create={operation:'create',targetType:'addon',targetId:'addon-featured-listing',name_en:'Fixture',name_es:'Prueba',startsAt:'2020-01-01T00:00:00Z',endsAt:'2090-01-01T00:00:00Z',prices:{USD:'3'}};
 const make=(patch={})=>JSON.parse(sql(admin({...create,...patch})).split('\n').at(-1)).offerId;
 const request=crypto.randomUUID();let r=await Promise.all([parallel(admin(create,request)),parallel(admin(create,request))]);
 ok(r.every(x=>x.code===0),'two create retries succeed');ok(sql('SELECT count(*) FROM twuanis_canonical_private.offers')==='1','one Offer identity');
 const a=sql('SELECT id FROM twuanis_canonical_private.offers'),b=make();
 r=await Promise.all([parallel(admin({operation:'schedule',id:a,expected:'1'})),parallel(admin({operation:'schedule',id:b,expected:'1'}))]);
 ok(r.filter(x=>x.code===0).length===1,'overlap race only one schedule commits');ok(sql("SELECT count(*) FROM twuanis_canonical_private.offers WHERE state='eligible'")==='1','one applicable Offer');
 for(const op of ['end','archive']){
  const id=make({targetId:'addon-listing-boost'}),edit={...create,operation:'configure',id,expected:'1',prices:{USD:'2'}};delete edit.targetType;delete edit.targetId;
  r=await Promise.all([parallel(admin(edit)),parallel(admin({operation:op,id,expected:'1',reason:'Fixture'}))]);
  ok(r.filter(x=>x.code===0).length===1,'edit vs '+op+' only one revision commits');
  ok(sql(`SELECT revision FROM twuanis_canonical_private.offers WHERE id='${id}'`)==='2','one revision advance');
 }
 const snapRequest=crypto.randomUUID(),q=`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${snapRequest}','package','pkg-geographic-distribution-price-range','USD')`;
 r=await Promise.all([parallel(q),parallel(q)]);ok(r.every(x=>x.code===0),'Order concurrent replay succeeds');ok(new Set(r.map(x=>JSON.parse(x.out).id)).size===1,'one immutable Order');
 // Real lock wait crosses expiry: authoritative time must be obtained after target lock.
 const oid=make({targetType:'package',targetId:'pkg-geographic-distribution-price-range',endsAt:new Date(Date.now()+2500).toISOString(),prices:{USD:'1'}});
 sql(admin({operation:'schedule',id:oid,expected:'1'}));
 const lock=parallel("BEGIN;SELECT pg_advisory_xact_lock(3161,hashtext('package:pkg-geographic-distribution-price-range'));SELECT pg_sleep(3);COMMIT;");
 // Wait for the real lock holder to be visible, not a timing assumption about process startup.
 const limit=Date.now()+2000;while(sql("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=3161 AND granted")!=='1'){if(Date.now()>limit)throw Error('lock did not establish');await new Promise(x=>setTimeout(x,20))}
 const waiting=parallel(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','package','pkg-geographic-distribution-price-range','USD')`);
 const [held,answer]=await Promise.all([lock,waiting]);ok(held.code===0&&answer.code===0,'expiry crossing lock wait completes');ok(JSON.parse(answer.out).terms.source==='STANDARD','post-lock time uses expired Offer fallback');
 console.log('PASS Offer concurrency checks:',n,'; independent-session cases:6');
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
