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

 sql('UPDATE package_limits SET listing_limit=NULL');
 const base={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},money:{amount:'0.5',currency:'USD'}};
 const cases=[base,{...base,transaction:'rent',money:{amount:'0.25',currency:'CRC'}},{...base,measurements:{property_area:{value:'850'},construction_area:{value:'70'}}},
 ...['bedrooms','parking','bathrooms','year_built','distance_to_paved_road'].flatMap(d=>['0','1','1.5','-1','999999','NaN'].map(value=>({...base,facts:{[d]:{kind:'exact',value}}}))),
 ...[{kind:'range',lower:'1000',upper:'5000',lower_inclusive:true,upper_inclusive:true},{kind:'range',lower:'5000',upper:null,lower_inclusive:false,upper_inclusive:false},{kind:'range',lower:'5000',upper:'1000',lower_inclusive:true,upper_inclusive:true},{kind:'clear'}].map(v=>({...base,facts:{distance_to_paved_road:v}})),
 ...[['1172','1173'],['1174','1173'],['1176','1175'],['1175']].map(a=>({...base,semantics:{property_type:['1'],accessibility:a}})),
 {...base,geography:{province:'3'}},{...base,geography:{province:'3',canton:'999'}},{...base,semantics:{property_type:['1001']}},{...base,facts:{bedrooms:{kind:'exact',value:'2',reference:''}}},{...base,measurements:{property_area:{value:'0'}}},{...base,measurements:{construction_area:{value:'NaN'}}}];
 let accepted=0;
 for(const [i,row] of cases.entries()){
  const evaluate=(q)=>{try{sql('BEGIN;'+q+';ROLLBACK;');return true}catch{return false}};
  const pre=evaluate(`SELECT twuanis_canonical_private.addon_customer_input(${lit(JSON.stringify(row))})`);
  const canonical=evaluate(`SELECT twuanis_canonical_private.s4_create_core('${customer}','${crypto.randomUUID()}',${lit(JSON.stringify(row))},NULL)`);
  ok(pre===canonical,'canonical preflight parity case '+i+' '+JSON.stringify(row));if(pre)accepted++;
 }
 ok(sql('SELECT count(*) FROM listings')==='0','parity trials all rolled back');
 // Canonical reference removal between acceptance and execution invalidates the whole job.
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([base]))})`));
 sql(`UPDATE ontology_terms SET level=0 WHERE id=1`);
 assert.throws(()=>sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`));n++;
 ok(sql('SELECT count(*) FROM listings')==='0','changed canonical reference causes zero listing mutation');
 console.log(JSON.stringify({status:'PASS',checks:n,acceptedCases:accepted,scope:'nonmutating preflight vs actual canonical creation parity; exact/range/clear, geography, semantic/accessibility and current-state invalidation'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
