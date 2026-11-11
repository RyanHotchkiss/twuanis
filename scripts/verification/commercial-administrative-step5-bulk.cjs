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
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'0.5',currency:'USD'}};
 const prepare=(rows,request=crypto.randomUUID(),who=customer)=>JSON.parse(run(who,`SELECT public.prepare_customer_addon_import(${lit(request)},${lit(JSON.stringify(rows))})`));
 const fulfill=(job,purchase=crypto.randomUUID(),payment=crypto.randomUUID())=>JSON.parse(sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import(${lit(job)},${lit(purchase)},${lit(payment)})`));
 const count=()=>Number(sql('SELECT count(*) FROM listings'));
 const initial=count(),request=crypto.randomUUID();
 const invalid=[{...input,money:{amount:'0',currency:'USD'}},{...input,owner_id:owner},{...input,semantics:{property_type:[]}},{...input,images:['https://external.invalid/image']},{...input,facts:{bedrooms:{kind:'exact',value:'1.5'}}}];
 const job=prepare([input,{...input,transaction:'rent',money:{amount:'0.25',currency:'CRC'}},...invalid],request);
 ok(job.accepted===2&&job.rejected.length===invalid.length,'server count excludes invalid rows');ok(job.total==='1.00','whole job decimal pricing');ok(count()===initial,'preflight no listing mutation');
 ok(prepare([input,{...input,transaction:'rent',money:{amount:'0.25',currency:'CRC'}},...invalid],request).jobId===job.jobId,'freeze replay');
 assert.throws(()=>prepare([input],request));n++;
 const purchase=crypto.randomUUID(),payment=crypto.randomUUID(),result=fulfill(job.jobId,purchase,payment);
 ok(result.length===2&&count()===initial+2,'whole batch created');
 ok(sql(`SELECT count(*) FROM listings WHERE owner_id='${customer}' AND listing_status='active' AND listing_origin='customer' AND source_name IS NULL`) ==='2','all customer owned and published without source identity');
 ok(JSON.stringify(fulfill(job.jobId,purchase,payment))===JSON.stringify(result)&&count()===initial+2,'replay no duplicate creation or publication');
 ok(sql(`SELECT count(*) FROM listing_lifecycle_events WHERE event_type='publish'`) ==='2','exact publication events');
 ok(sql(`SELECT count(*) FROM listings WHERE transaction_type='rent' AND monthly_price=0.25`) ==='1','rent monetary authority preserved');
 ok(sql(`SELECT bool_and(publication_expires_at-published_at=interval '30 days') FROM listings WHERE owner_id='${customer}'`) ==='t','existing package publication duration');
 assert.throws(()=>fulfill(job.jobId));n++;
 const capacityBefore=sql('SELECT listing_limit FROM package_limits');const tooMany=Array.from({length:9},()=>input);
 assert.throws(()=>prepare(tooMany));n++;ok(count()===initial+2,'insufficient preflight no drafts');
 const pending=prepare([input,input]);sql('UPDATE package_limits SET listing_limit=3');
 assert.throws(()=>fulfill(pending.jobId));n++;ok(count()===initial+2,'changed allowance whole-job fail before listing writes');
 sql('UPDATE package_limits SET listing_limit=10');
 // Fail the second new listing write; the first creation/publication and all histories roll back.
 sql(`CREATE FUNCTION public.addon_inject_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF (SELECT count(*) FROM listings)>=${initial+3} THEN RAISE EXCEPTION 'injected second-row failure';END IF;RETURN NEW;END $$;CREATE TRIGGER addon_inject_failure BEFORE INSERT ON listings FOR EACH ROW EXECUTE FUNCTION public.addon_inject_failure();`);
 const receipts=sql('SELECT count(*) FROM canonical_operation_receipts');assert.throws(()=>fulfill(pending.jobId));n++;
 ok(count()===initial+2&&sql('SELECT count(*) FROM canonical_operation_receipts')===receipts,'mid-batch failure rolls back all canonical writes');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_import_results WHERE job_id=${lit(pending.jobId)}`)==='0','failed fulfillment has no completed receipt');
 sql('DROP TRIGGER addon_inject_failure ON listings;DROP FUNCTION public.addon_inject_failure();');
 fulfill(pending.jobId);ok(count()===initial+4,'same job succeeds after retryable failure');
 ok(sql('SELECT listing_limit FROM package_limits')===capacityBefore,'bulk grants no publication allowance');
 // Expired authority fails, without altering frozen quantity/price.
 const expired=prepare([input]);sql(`UPDATE user_subscriptions SET current_period_end=now()-interval '1 second' WHERE user_id='${customer}'`);
 assert.throws(()=>fulfill(expired.jobId));n++;ok(count()===initial+4,'expired independent authority denies entire job');sql(`UPDATE user_subscriptions SET current_period_end=now()+interval '1 year' WHERE user_id='${customer}'`);
 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.fulfill_customer_addon_import(uuid,uuid,uuid)','EXECUTE')`)==='f',role+' private fulfillment denied');
 const ownerJob=prepare([input],crypto.randomUUID(),owner);ok(sql(`SELECT account_id FROM twuanis_canonical_private.addon_import_jobs WHERE id='${ownerJob.jobId}'`)===owner,'caller owns its own immutable job');
 // Existing ordinary customer draft creation/publication remains usable through extracted core.
 const draft=JSON.parse(run(customer,`SELECT public.create_customer_canonical_listing('${crypto.randomUUID()}',${lit(JSON.stringify(input))})`));
 run(customer,`SELECT public.publish_customer_canonical_listing('${draft.listing_id}',1,'${crypto.randomUUID()}','publish')`);ok(sql(`SELECT listing_status FROM listings WHERE id='${draft.listing_id}'`)==='active','ordinary publication regression');
 // A bulk batch and ordinary publish share the same publisher allowance lock.
 const racer=JSON.parse(run(customer,`SELECT public.create_customer_canonical_listing('${crypto.randomUUID()}',${lit(JSON.stringify(input))})`));
 const raceJob=prepare([input,input]);
 const active=Number(sql(`SELECT count(*) FROM listings WHERE owner_id='${customer}' AND listing_status='active'`));
 sql(`UPDATE package_limits SET listing_limit=${active+2}`);
 const args=['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
 const child=q=>{const p=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.stdin.end(q);return new Promise(resolve=>p.on('close',code=>resolve({code,out,err})))};
 const ra=child(`BEGIN;SELECT twuanis_canonical_private.resolve_publisher('${customer}');SELECT pg_sleep(0.2);SELECT twuanis_canonical_private.fulfill_customer_addon_import('${raceJob.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}');COMMIT;`);
 const rb=child(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims','${JSON.stringify({sub:customer,role:'authenticated'})}',true);SELECT public.publish_customer_canonical_listing('${racer.listing_id}',1,'${crypto.randomUUID()}','publish');COMMIT;`);
 const rr=await Promise.all([ra,rb]);ok(rr.filter(x=>x.code===0).length===1,'exactly one allowance contender succeeds');
 ok(Number(sql(`SELECT count(*) FROM listings WHERE owner_id='${customer}' AND listing_status='active'`))<=active+2,'concurrent publication cannot exceed allowance');
 // Whole-job tiers and unpriced 501, using existing independent unlimited authority.
 sql('UPDATE package_limits SET listing_limit=NULL');
 for(const [qty,total] of [[25,'12.50'],[26,'6.50'],[100,'25.00'],[101,'10.10'],[500,'50.00'],[501,null]]){const j=prepare(Array.from({length:qty},()=>input));ok(j.accepted===qty&&j.total===total,'whole-job price '+qty);if(qty===501){assert.throws(()=>fulfill(j.jobId));n++;}}
 sql(file('supabase/migrations/033_addon_fulfillment_placement.sql'));
 console.log(JSON.stringify({checks:n,status:'PASS',scope:'real disposable canonical batch database checks; fulfillment migration compiled'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
