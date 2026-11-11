'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/addon-bulk-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
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
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},money:{amount:'1',currency:'USD'}};
 const prepare=rows=>JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify(rows))})`));
 assert.throws(()=>prepare([]));n++;
 const job=prepare([input]);ok(job.accepted===1&&job.total==='0.50','one accepted row fifty cents');
 const result=JSON.parse(sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`)),listing=result[0].listingId;
 const config=p=>sql(`SELECT current_configuration_id FROM twuanis_canonical_private.addon_products WHERE id=${lit(p)}`);
 const query=(p,target,kind='listing',request=crypto.randomUUID(),payment=crypto.randomUUID())=>`SELECT twuanis_canonical_private.fulfill_addon('${request}','${payment}','${customer}',${lit(p)},'${config(p)}','${kind}','${target}','{"amount":"5","currency":"USD"}')`;
 for(const [p,days] of [['addon-featured-listing',60],['addon-listing-boost',14],['addon-homepage-exposure',14],['addon-province-exposure',28],['addon-property-type-exposure',28]]){
  const a=JSON.parse(sql(query(p,listing))),b=JSON.parse(sql(query(p,listing)));
  ok(Date.parse(b.expiresAt)-Date.parse(a.expiresAt)===days*86400000,p+' exact remaining-time extension');
  sql(`UPDATE twuanis_canonical_private.addon_placement_rights SET activated_at=now()-interval '100 days',expires_at=now()-interval '1 day' WHERE product_id='${p}'`);
  const c=JSON.parse(sql(query(p,listing)));ok(Date.parse(c.expiresAt)-Date.parse(c.activatedAt)===days*86400000,p+' expired new term');
 }
 const args=['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
 const child=q=>{const p=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.stdin.end(q+';');return new Promise(resolve=>p.on('close',code=>resolve({code,out,err})))};
 const q=query('addon-2026-founding-membership',customer,'account');const race=await Promise.all([child(q),child(q)]);
 ok(race.every(x=>x.code===0)&&race[0].out===race[1].out,'Founder same-fulfillment race exact replay');ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='1','one founder right');
 ok(sql(`SELECT count(*) FROM listings WHERE owner_id='${customer}'`) ==='1','Founder creates no listing/access product');
 const audit=JSON.parse(run(owner,`SELECT public.admin_addon_command('${crypto.randomUUID()}','{"operation":"copy","product":"addon-listing-boost","expected":"1","name_en":"Listing Boost","description_en":"Future catalog copy"}')`));
 const copied=JSON.parse(sql("SELECT twuanis_canonical_private.addon_projection('addon-listing-boost')"));
 ok(copied.description_en==='Future catalog copy','commercial copy edit persists');
 run(owner,`SELECT public.admin_addon_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'copy',product:'addon-listing-boost',expected:copied.revision,name_en:'Listing Boost',name_es:'Impulso de anuncio',description_es:'Texto de prueba'}))})`);
 ok(JSON.parse(sql("SELECT twuanis_canonical_private.addon_projection('addon-listing-boost')")).name_es==='Impulso de anuncio','bilingual copy edit persists');
 const evidence=JSON.parse(sql(`SELECT to_jsonb(e) FROM twuanis_canonical_private.administrative_events e WHERE id='${audit.eventId}'`));
 ok(evidence.actor_id===owner,'audit identifies authenticated shared account accurately');
 console.log(JSON.stringify({status:'PASS',checks:n,concurrencyCases:1,scope:'Founder replay race; all five exact/expired term extensions; zero/one bulk quantity; account audit',auditFields:Object.keys(evidence)}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
