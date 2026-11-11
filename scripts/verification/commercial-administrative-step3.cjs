'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/admin-step3-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55448','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55448 -c listen_addresses=`,'start']);started=true;
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
 sql(`INSERT INTO ontology_terms(id,term_type,level,term_name) VALUES(99001,'property_area',1,'fixture area'),(99002,'construction_area',1,'fixture construction');
 INSERT INTO listing_classification_rule_sets(id,domain,version) VALUES('80000000-0000-0000-0000-000000009901','property_area',991),('80000000-0000-0000-0000-000000009902','construction_area',991);
 INSERT INTO listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('80000000-0000-0000-0000-000000009901',99001,'[0,)'),('80000000-0000-0000-0000-000000009902',99002,'[0,)');
 SELECT twuanis_canonical_private.s3_seal_classification(id) FROM listing_classification_rule_sets WHERE version=991;`);
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'0.5',currency:'USD'}};
 for(const origin of ['customer','system','imported']){
  const c={operation:'create',origin,input,...(origin==='customer'?{customer}:{}),...(origin==='imported'?{source:{source_name:'step3',source_listing_id:'one',observation_id:'first',observed_at:'2026-10-03T00:00:00Z',source_type:'realtor'}}:{})};
  const id=crypto.randomUUID(),created=command(owner,c,id),lid=created.listing_id;
  const row=()=>JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(lid)}`));
  ok(row().owner_id===(origin==='customer'?customer:null),origin+' correct ownership');
  const mediaRequest=crypto.randomUUID();
  const media=JSON.parse(run(owner,`SELECT public.admin_prepare_media(${lit(mediaRequest)},${lit(lid)},100)`));
  ok(media.path.startsWith(origin==='customer'?customer+'/'+lid+'/':'system/listings/'+lid+'/'),origin+' media namespace');
  assert.throws(()=>run(owner,`SELECT public.admin_attach_media(${lit(mediaRequest)})`));n++;
  sql(`INSERT INTO storage.objects VALUES('listings-images',${lit(media.path)},'{"size":100,"mimetype":"image/jpeg"}')`);
  run(owner,`SELECT public.admin_attach_media(${lit(mediaRequest)})`);
  run(owner,`SELECT public.admin_attach_media(${lit(mediaRequest)})`);
  ok(JSON.parse(row().images).filter(x=>x===media.path).length===1,origin+' attachment retry');
  if(origin==='imported'){
   sql(`SELECT twuanis_canonical_private.admin_source_media_refresh(${lit(lid)},ARRAY['https://source.invalid/1','https://source.invalid/2'])`);
   ok(JSON.stringify(JSON.parse(row().images))===JSON.stringify([media.path,'https://source.invalid/1','https://source.invalid/2']),'managed first, source second');
   sql(`SELECT twuanis_canonical_private.admin_source_media_refresh(${lit(lid)},ARRAY['https://source.invalid/3'])`);
   ok(JSON.stringify(JSON.parse(row().images))===JSON.stringify([media.path,'https://source.invalid/3']),'refresh preserves managed association');
  }

  ok(command(owner,c,id).listing_id===lid,origin+' create replay');
  sql(`SELECT twuanis_canonical_private.s3_command(${lit(lid)},${row().canonical_revision},${lit(origin==='customer'?'owner':'trusted')},${lit(origin==='customer'?customer:'fixture')},gen_random_uuid(),'{"measurements":{"property_area":{"value":"850","rule_set":"80000000-0000-0000-0000-000000009901"},"construction_area":{"value":"70","rule_set":"80000000-0000-0000-0000-000000009902"}}}',NULL)`);
  ok(sql(`SELECT count(*) FROM listing_membership_origins WHERE listing_id=${lit(lid)} AND origin_domain IN('property_area','construction_area')`)==='2',origin+' recorded classifications established');
  const history=sql(`SELECT jsonb_agg(to_jsonb(r) ORDER BY id) FROM canonical_operation_receipts r WHERE listing_id=${lit(lid)}`);
  const previous=row(); const edit={operation:'edit',listing:lid,expected:previous.canonical_revision,prior_updated_at:previous.updated_at,domains:{measurements:{property_area:{kind:'clear'},construction_area:{kind:'clear'}}}};
  command(owner,edit);ok(row().property_area===null&&row().construction_area===null,origin+' both clear canonical null');
  ok(sql(`SELECT count(*) FROM listing_membership_origins WHERE listing_id=${lit(lid)} AND origin_domain IN('property_area','construction_area')`)==='0',origin+' dependent origins retired');
  ok(sql(`SELECT count(*) FROM listings_ontology_terms WHERE listing_id=${lit(lid)} AND ontology_term_id IN(99001,99002)`)==='0',origin+' dependent memberships retired');
  ok(JSON.parse(history).every(old=>JSON.stringify(JSON.parse(sql(`SELECT to_jsonb(r) FROM canonical_operation_receipts r WHERE id=${lit(old.id)}`)))===JSON.stringify(old)),origin+' existing canonical receipts unchanged');
  ok(row().owner_id===previous.owner_id&&row().source_name===previous.source_name,origin+' identity preserved');
  ok(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE target_id=${lit(lid)} AND before_state->>'property_area'='850' AND after_state->'property_area'='null'::jsonb`)==='1',origin+' old/new audit');
  assert.throws(()=>command(customer,{...edit,expected:row().canonical_revision,prior_updated_at:row().updated_at}));n++;
  const r=row();command(owner,{operation:'edit',listing:lid,expected:r.canonical_revision,prior_updated_at:r.updated_at,domains:{measurements:{property_area:{value:'900'},construction_area:{value:'80'}}}});
  ok(row().property_area===900&&row().construction_area===80,origin+' both set');
 }
 assert.throws(()=>sql(`SELECT twuanis_canonical_private.s4_domains('{"measurements":{"property_area":{"kind":"clear"}}}','source')`));n++;
 for(const c of [{operation:'create',input},{operation:'create',origin:'customer',input},{operation:'create',origin:'system',customer,input},{operation:'create',origin:'imported',input}]){assert.throws(()=>command(owner,c));n++;}
 for(const role of ['anon','service_role']){ok(sql(`SELECT NOT has_function_privilege('${role}','public.admin_listing_command(uuid,jsonb)','EXECUTE')`)==='t',role+' mutation denied');}
 const lid=sql('SELECT id FROM listings ORDER BY id LIMIT 1');
 const detail=JSON.parse(run(owner,`SELECT public.admin_listing_read('${JSON.stringify({mode:'detail',listing:lid})}')`));
 for(const value of [null,'',0,{value:'0'},{kind:'clear',value:'3'}]){assert.throws(()=>command(owner,{operation:'edit',listing:lid,expected:detail.canonical_revision,prior_updated_at:detail.updated_at,domains:{measurements:{property_area:value}}}));n++;}
 const base={listing:lid,expected:detail.canonical_revision,prior_updated_at:detail.updated_at};
 assert.throws(()=>command(owner,{...base,operation:'archive'}));n++;
 const del=command(owner,{...base,operation:'delete',reason:'fixture deletion request'});ok(del.code==='CANONICAL_HISTORY_PREVENTS_DELETE','history-safe delete denied');
 ok(sql(`SELECT count(*) FROM listings WHERE id=${lit(lid)}`)==='1','delete preserves listing');
 const archive=command(owner,{...base,operation:'archive',reason:'fixture archive'});
 const archived=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(lid)}`));
 ok(archived.listing_status==='archived','canonical archive');
 command(owner,{operation:'restore',listing:lid,expected:archived.canonical_revision,prior_updated_at:archived.updated_at});
 ok(sql(`SELECT listing_status FROM listings WHERE id=${lit(lid)}`)==='draft','restore same identity to draft');
 assert.throws(()=>command(owner,{...base,operation:'edit',domains:{}}));n++;
 ok(JSON.parse(run(owner,`SELECT public.admin_listing_read('{"mode":"list"}')`)).length===3,'three origin listings read');
 assert.throws(()=>run(customer,`SELECT public.admin_listing_read('{"mode":"list"}')`));n++;
 // Actual scoped permissions: management never implies read; revocation is immediate.
 const authCommand=(op,permission)=>run(owner,`SELECT public.change_administrative_authority(${lit(crypto.randomUUID())},${lit(op)},${lit(customer)},${permission?lit(permission):'NULL'},NULL)`);
 authCommand('administrator.activate');authCommand('permission.grant','listings.read');
 ok(JSON.parse(run(customer,`SELECT public.admin_listing_read('{"mode":"list"}')`)).length===3,'read-only Admin reads');
 assert.throws(()=>command(customer,{...base,operation:'archive',reason:'denied'}));n++;
 authCommand('permission.revoke','listings.read');authCommand('permission.grant','listings.manage');
 assert.throws(()=>run(customer,`SELECT public.admin_listing_read('{"mode":"list"}')`));n++;
 const now=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(lid)}`));
 command(customer,{operation:'edit',listing:lid,expected:now.canonical_revision,prior_updated_at:now.updated_at,domains:{measurements:{property_area:{value:'1100'}}}});
 ok(sql(`SELECT property_area FROM listings WHERE id=${lit(lid)}`)==='1100','scoped management succeeds');
 authCommand('permission.revoke','listings.manage');
 assert.throws(()=>command(customer,{operation:'create',origin:'system',input}));n++;
 // Required audit failure rolls back the canonical write and its receipt.
 sql(`CREATE FUNCTION public.step3_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture injected audit failure'; END $$;CREATE TRIGGER step3_fail_audit BEFORE INSERT ON twuanis_canonical_private.administrative_events FOR EACH ROW EXECUTE FUNCTION public.step3_fail_audit();`);
 const before=sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(lid)}`),snap=JSON.parse(before);
 assert.throws(()=>command(owner,{operation:'edit',listing:lid,expected:snap.canonical_revision,prior_updated_at:snap.updated_at,domains:{measurements:{property_area:{kind:'clear'}}}}));n++;
 ok(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(lid)}`)===before,'audit failure atomic rollback');
 sql('DROP TRIGGER step3_fail_audit ON twuanis_canonical_private.administrative_events;DROP FUNCTION public.step3_fail_audit();');
 // Original customer CLEAR continues through the original seven-argument authority path.
 const own=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE owner_id=${lit(customer)} LIMIT 1`));
 run(customer,`SELECT public.mutate_customer_canonical_listing(${lit(own.id)},${own.canonical_revision},${lit(crypto.randomUUID())},'{"measurements":{"construction_area":{"kind":"clear"}}}')`);
 ok(sql(`SELECT construction_area IS NULL FROM listings WHERE id=${lit(own.id)}`)==='t','customer CLEAR regression');
 assert.throws(()=>run(customer,`SELECT public.mutate_customer_canonical_listing(${lit(lid)},0,${lit(crypto.randomUUID())},'{}')`));n++;
 const imported=JSON.parse(sql("SELECT to_jsonb(l) FROM listings l WHERE listing_origin='imported'"));
 command(owner,{operation:'edit',listing:imported.id,expected:imported.canonical_revision,prior_updated_at:imported.updated_at,domains:{measurements:{property_area:{kind:'clear'}}}});
 const oldImages=sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`);
 const observe=(obs,time)=>{const raw={source_name:'step3',source_listing_id:'one',observation_id:obs,observed_at:time,images:'https://source.invalid/refreshed',title:'Updated source'};const eid=sql(`SELECT public.retain_csv_source_evidence(${lit(JSON.stringify(raw))},'{"status":"unresolved","canonical_authority":false,"values":{}}')`);return JSON.parse(sql(`SELECT public.ingest_canonical_source_observation(${lit(eid)},${lit(JSON.stringify({...input,measurements:{property_area:{value:'1234'}}}))})`))};
 observe('second','2027-01-01T00:00:00Z');
 ok(sql(`SELECT property_area FROM listings WHERE id=${lit(imported.id)}`)==='1234','actual S10 re-observation restores cleared measure');
 ok(sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`)===oldImages,'actual S10 six-month gate preserved');
 sql(`UPDATE twuanis_canonical_private.source_ingestion_state SET presentation_at=now()-interval '7 months' WHERE listing_id=${lit(imported.id)}`);
 observe('third','2027-01-02T00:00:00Z');
 const refreshed=JSON.parse(sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`));
 ok(refreshed[0]===JSON.parse(oldImages)[0]&&refreshed[1]==='https://source.invalid/refreshed','actual S10 preserves managed-first media');
 const control=(op,values,prior)=>JSON.parse(run(owner,`SELECT public.admin_control_media(${lit(crypto.randomUUID())},${lit(imported.id)},${lit(prior)},${lit(op)},ARRAY[${values.map(lit).join(',')}]::text[])`));
 const prior=sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`);
 assert.throws(()=>control('reorder',[refreshed[1],refreshed[0]],prior));n++;
 control('reorder',[refreshed[0]],prior);n++;
 const prior2=sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`);control('remove',[refreshed[0]],prior2);
 ok(!sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`).includes(refreshed[0]),'Admin remove detaches managed media');
 sql(`UPDATE twuanis_canonical_private.source_ingestion_state SET presentation_at=now()-interval '7 months' WHERE listing_id=${lit(imported.id)}`);observe('fourth','2027-01-03T00:00:00Z');
 ok(!sql(`SELECT images FROM listings WHERE id=${lit(imported.id)}`).includes(refreshed[0]),'source refresh cannot resurrect removed managed image');

 // Source-only removal must not require a managed upload or touch external bytes.
 const sourceOnly=command(owner,{operation:'create',origin:'imported',input,source:{source_name:'step3',source_listing_id:'source-only',observation_id:'initial',observed_at:'2026-10-03T00:00:00Z',source_type:'realtor'}}).listing_id;
 sql(`SELECT twuanis_canonical_private.admin_source_media_refresh(${lit(sourceOnly)},ARRAY['https://source.invalid/one','https://source.invalid/two'])`);
 const sourcePrior=sql(`SELECT images FROM listings WHERE id=${lit(sourceOnly)}`);
 run(owner,`SELECT public.admin_control_media(${lit(crypto.randomUUID())},${lit(sourceOnly)},${lit(sourcePrior)},'remove',ARRAY['https://source.invalid/one'])`);
 ok(sql(`SELECT images FROM listings WHERE id=${lit(sourceOnly)}`)==='["https://source.invalid/two"]','source-only detach initializes truthful provenance');
 ok(sql(`SELECT cardinality(managed) FROM twuanis_canonical_private.administrative_media_groups WHERE listing_id=${lit(sourceOnly)}`)==='0','source references never become managed');
 // Every mutation rejects unauthenticated, ordinary, read-only and revoked authority.
 for(const operation of ['create','edit','archive','restore','delete']){
  const c=operation==='create'?{operation,origin:'system',input}:{operation,listing:lid,expected:0,prior_updated_at:detail.updated_at,reason:'denied probe',domains:{}};
  assert.throws(()=>command(customer,c));n++;
  assert.throws(()=>command('',c));n++;
 }
 authCommand('permission.grant','listings.read');
 for(const operation of ['create','edit','archive','restore','delete']){assert.throws(()=>command(customer,operation==='create'?{operation,origin:'system',input}:{operation,listing:lid,expected:0,prior_updated_at:detail.updated_at,reason:'read-only probe'}));n++;}
 authCommand('permission.revoke','listings.read');
 assert.throws(()=>command(owner,{operation:'create',origin:'system',input,actor:customer,permission:'listings.manage'}));n++;
 // Independent sessions: first transaction announces its lock before the contender starts.
 function session(who,body){return `SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${body}`}
 const cq=(c,id=crypto.randomUUID())=>`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))});`;
 async function race(first,second,secondSucceeds){
  const args=['-X','-qAt','-h',socket,'-p','55448','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
  const child=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let output='',error='';let readyResolve,readyReject;const ready=new Promise((yes,no)=>{readyResolve=yes;readyReject=no});
  child.stdout.on('data',b=>{output+=b;if(output.includes('STEP3_LOCKED'))readyResolve()});child.stderr.on('data',b=>error+=b);
  const finished=new Promise((yes,no)=>child.on('close',code=>{if(code){readyReject(Error(error));no(Error(error))}else yes()}));
  child.stdin.end(`BEGIN;${first}SELECT 'STEP3_LOCKED';SELECT pg_sleep(0.25);COMMIT;`);
  await ready;if(secondSucceeds)sql(second);else assert.throws(()=>sql(second));await finished;n++;
 }
 const shared=crypto.randomUUID(),create={operation:'create',origin:'system',input};
 await race(session(owner,cq(create,shared)),`BEGIN;${session(owner,cq(create,shared))}COMMIT;`,true);
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_listing_receipts WHERE request_id=${lit(shared)}`)==='1','concurrent same-request single receipt');
 const target=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE listing_origin='system' ORDER BY id LIMIT 1`));
 const edit={operation:'edit',listing:target.id,expected:target.canonical_revision,prior_updated_at:target.updated_at,domains:{measurements:{property_area:{value:'333'}}}};
 await race(session(owner,cq(edit)),`BEGIN;${session(owner,cq({...edit,operation:'archive',reason:'concurrent archive',domains:undefined}))}COMMIT;`,false);
 ok(sql(`SELECT property_area FROM listings WHERE id=${lit(target.id)}`)==='333','stale archive cannot override edit');
 authCommand('permission.grant','listings.manage');const latest=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(target.id)}`));
 await race(session(customer,cq({...edit,expected:latest.canonical_revision,prior_updated_at:latest.updated_at,domains:{measurements:{property_area:{value:'444'}}}})),`BEGIN;${session(owner,`SELECT public.change_administrative_authority(${lit(crypto.randomUUID())},'permission.revoke',${lit(customer)},'listings.manage',NULL);`)}COMMIT;`,true);
 assert.throws(()=>command(customer,create));n++;
 const customerListing=JSON.parse(sql(`SELECT to_jsonb(l) FROM listings l WHERE owner_id=${lit(customer)} LIMIT 1`));
 const mr=crypto.randomUUID(),prepared=JSON.parse(run(owner,`SELECT public.admin_prepare_media(${lit(mr)},${lit(customerListing.id)},100)`));sql(`INSERT INTO storage.objects VALUES('listings-images',${lit(prepared.path)},'{"size":100,"mimetype":"image/jpeg"}')`);
 await race(session(owner,`SELECT public.admin_attach_media(${lit(mr)});`),`BEGIN;${session(owner,`SELECT public.admin_control_media(${lit(crypto.randomUUID())},${lit(customerListing.id)},${lit(customerListing.images)},'reorder',ARRAY[${JSON.parse(customerListing.images).map(lit).join(',')}]::text[]);`)}COMMIT;`,false);
 for(let i=0;i<27;i++)command(owner,{operation:'create',origin:'system',input:{...input,content:{title:'page fixture '+i}}});
 const read=q=>JSON.parse(run(owner,`SELECT public.admin_listing_read(${lit(JSON.stringify(q))})`));
 const first=read({mode:'list'});ok(first.length===26,'bounded 25+1 page');
 const cursor={id:first[24].id,updated_at:first[24].updated_at};const second=read({mode:'list',after:cursor});
 ok(first.slice(0,25).every(a=>second.every(b=>b.id!==a.id)),'cursor pages do not overlap');
 ok(first.slice(0,25).length+second.length===Number(sql('SELECT count(*) FROM listings')),'cursor pages complete fixture');
 ok(read({mode:'list',search:'page fixture'}).length===26,'literal title prefix search bounded');
 ok(read({mode:'list',search:'%'}).length===0,'wildcard is literal');
 ok(read({mode:'list',transaction:'rent'}).length===0,'transaction filter exact');
 const geo=JSON.parse(sql("SELECT jsonb_object_agg(term_type,id::text) FROM ontology_terms WHERE official_code IN('3','304')"));
 ok(read({mode:'list',province:geo.province,canton:geo.canton}).length===26,'canonical geography filter');
 assert.throws(()=>read({mode:'list',province:geo.canton}));n++;
 assert.throws(()=>read({mode:'list',canton:geo.canton}));n++;
 const overview=read({mode:'overview'});ok(Number(overview.total)===Number(sql('SELECT count(*) FROM listings')),'real aggregate overview');
 console.log('PASS Step 3 focused domain assertions:',n,'including 4 independent-session concurrency cases');
}catch(e){console.error(e.stderr?.toString()||e.stack);process.exitCode=1}finally{if(started)call('pg_ctl',['-D',data,'-m','immediate','stop']);fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
