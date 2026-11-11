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


 const snap=()=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','package','pkg-pricing-position-relationships','USD')`));
 const o=snap(),request=crypto.randomUUID(),event=crypto.randomUUID();
 const ack=(order=o.id,r=request,e=event,amount='100',currency='USD')=>`SELECT twuanis_canonical_private.acknowledge_offer_order_paid(${lit(order)},${lit(r)},'disposable_trusted_test',${lit(e)},${amount},${lit(currency)},'disposable_fixture',NULL)`;
 const state=id=>sql(`SELECT twuanis_canonical_private.offer_order_state(${lit(id)},clock_timestamp())`);
 ok(state(o.id)==='pending','Order is not payment');
 assert.throws(()=>sql(ack(o.id,request,event,'99')));n++;
 assert.throws(()=>sql(ack(o.id,request,event,'100','CRC')));n++;
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements')==='0','mismatch creates no acknowledgement');
 for(const role of ['anon','authenticated','service_role']){assert.throws(()=>sql(`SET ROLE ${role};${ack()}`));n++;}
 const first=JSON.parse(sql(ack()));ok(first.state==='paid','trusted valid acknowledgement');
 ok(state(o.id)==='paid','independent paid state');
 ok(JSON.parse(sql(ack())).id===first.id,'idempotent retry');
 assert.throws(()=>sql(ack(o.id,crypto.randomUUID(),crypto.randomUUID())));n++;
 const second=snap();assert.throws(()=>sql(ack(second.id,crypto.randomUUID(),event)));n++;
 ok(state(second.id)==='pending','reused event cannot pay another Order');
 assert.throws(()=>sql('UPDATE twuanis_canonical_private.offer_paid_acknowledgements SET amount=1'));n++;
 const expired=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.offer_order_snapshots(id,account_id,request_id,target_type,product_id,currency,resolved_terms,created_at,payment_deadline) SELECT '${expired}',account_id,'${crypto.randomUUID()}',target_type,product_id,currency,resolved_terms,clock_timestamp()-interval '25 hours',clock_timestamp()-interval '1 hour' FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${o.id}'`);
 assert.throws(()=>sql(ack(expired,crypto.randomUUID(),crypto.randomUUID())));n++;
 ok(state(expired)==='expired','late acknowledgement cannot revive Order');
 for(const table of ['addon_fulfillments','addon_placement_rights','addon_founder_rights','addon_import_results','intelligence_package_rights'])ok(sql(`SELECT count(*) FROM twuanis_canonical_private.${table}`)==='0','no effect '+table);
 const race=snap(),rr=crypto.randomUUID(),re=crypto.randomUUID();
 const query=ack(race.id,rr,re);
 function parallel(q){return new Promise(resolve=>{const p=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('close',code=>resolve({code,out,err}));p.stdin.end(q)})}
 const result=await Promise.all([parallel(query),parallel(query)]);ok(result.every(r=>r.code===0),'concurrent retry succeeds');ok(new Set(result.map(r=>JSON.parse(r.out).id)).size===1,'concurrent retry one acknowledgement');
 console.log('PASS paid acknowledgement checks:',n,'; independent-session concurrent retry:1');
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
