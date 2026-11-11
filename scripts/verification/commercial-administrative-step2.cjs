'use strict';
// Isolated PostgreSQL + offline real-module verification. No environment files or HTTP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-admin-step2-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);
let started=false,checks=0;const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',top=crypto.randomUUID(),admin=crypto.randomUUID(),user=crypto.randomUUID(),other=crypto.randomUUID();
function call(bin,args,input){return execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
const args=['-X','-qAt','-h',socket,'-p','55449','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
function sql(q){return call('psql',args,q).trim()}
const lit=x=>"'"+String(x).replaceAll("'","''")+"'";
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function ok(v,msg){assert.ok(v,msg);checks++}
function eq(a,b,msg){assert.equal(a,b,msg);checks++}
function claims(who,aal='aal1',age=0,role='authenticated'){return {sub:who,role,aal,amr:aal==='aal2'?[{method:'mfa/totp',timestamp:Math.floor(Date.now()/1000)-age}]:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]}}
function authSQL(who,q,aal='aal1',age=0,role='authenticated'){return `BEGIN;SET LOCAL ROLE ${role};SELECT set_config('request.jwt.claims',${lit(JSON.stringify(claims(who,aal,age,role)))},true);${q};COMMIT;`}
function run(who,q,aal='aal1',age=0,role='authenticated'){return sql(authSQL(who,q,aal,age,role)).split('\n').at(-1)}
function denied(who,q,aal='aal1',age=0,role='authenticated'){assert.throws(()=>run(who,q,aal,age,role));checks++}
function command(op,target,permission=null,reason=null,request=crypto.randomUUID()){return `SELECT public.change_administrative_authority(${lit(request)},${lit(op)},${lit(target)},${permission?lit(permission):'NULL'},${reason?lit(reason):'NULL'})`}
function snapshot(who){return JSON.parse(run(who,'SELECT public.current_administrative_authority()'))}
function permits(who,p){return snapshot(who).permissions.includes(p)}
function child(q){let out='',err='',readyResolve;const ready=new Promise(resolve=>readyResolve=resolve);const p=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});p.stdout.on('data',x=>{out+=x;if(out.includes('LOCK_READY'))readyResolve()});p.stderr.on('data',x=>err+=x);p.stdin.end(q);return {p,ready,result:new Promise(resolve=>p.on('close',code=>resolve({code,out,err})))}}
async function main(){try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);
 call('pg_ctl',['-D',data,'-l',dir+'/postgres.log','-o',`-k ${socket} -p 55449 -c listen_addresses=`,'start']);started=true;
 eq(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)}`),'t','isolated socket-only owned cluster');
 sql(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA twuanis_canonical_private;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;
 GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
 CREATE TABLE public.payment_reviewers(user_id uuid PRIMARY KEY REFERENCES auth.users,active boolean NOT NULL);
 CREATE FUNCTION public.is_payment_reviewer(p_user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM public.payment_reviewers WHERE user_id=p_user_id AND active)$$;
 CREATE FUNCTION public.is_current_user_payment_reviewer() RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT public.is_payment_reviewer(auth.uid())$$;
 CREATE FUNCTION public.require_payment_reviewer() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN IF NOT public.is_payment_reviewer(auth.uid()) THEN RAISE EXCEPTION 'denied';END IF;END$$;
 REVOKE ALL ON FUNCTION public.is_payment_reviewer(uuid),public.is_current_user_payment_reviewer(),public.require_payment_reviewer() FROM PUBLIC;
 GRANT EXECUTE ON FUNCTION public.is_current_user_payment_reviewer(),public.require_payment_reviewer() TO authenticated;
 INSERT INTO auth.users VALUES(${[owner,top,admin,user,other].map(lit).join('),(')});`);
 sql(file('supabase/migrations/010_import_operator_authority.sql'));
 sql(file('supabase/migrations/025_administrative_access_authority.sql'));
 sql(`SELECT twuanis_canonical_private.set_administrative_access(${lit(admin)},true);SELECT twuanis_canonical_private.set_import_operator(${lit(user)},true);INSERT INTO payment_reviewers VALUES(${lit(user)},true);`);
 // Minimal existing-payment fixture. Tests wrapper atomicity/security, not commercial calculations.
 sql(`CREATE TABLE public.step2_payment_fixture(id uuid PRIMARY KEY,status text NOT NULL);
 CREATE FUNCTION public.approve_sinpe_payment(p_payment_id uuid) RETURNS TABLE(payment_id uuid,subscription_id uuid,previous_subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,period_start timestamptz,period_end timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN
 PERFORM public.require_payment_reviewer(); UPDATE public.step2_payment_fixture SET status='approved' WHERE id=p_payment_id AND status='submitted';IF NOT FOUND THEN RAISE EXCEPTION 'already decided';END IF;
 RETURN QUERY SELECT p_payment_id,NULL::uuid,NULL::uuid,auth.uid(),NULL::uuid,'approved'::text,'active'::text,now(),now();END$$;
 CREATE FUNCTION public.reject_sinpe_payment(p_payment_id uuid,p_rejection_reason text) RETURNS TABLE(payment_id uuid,subscription_id uuid,user_id uuid,package_id uuid,payment_status text,subscription_status text,rejection_reason text,rejected_at timestamptz)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN
 PERFORM public.require_payment_reviewer(); UPDATE public.step2_payment_fixture SET status='rejected' WHERE id=p_payment_id AND status='submitted';IF NOT FOUND THEN RAISE EXCEPTION 'already decided';END IF;
 RETURN QUERY SELECT p_payment_id,NULL::uuid,auth.uid(),NULL::uuid,'rejected'::text,'cancelled'::text,p_rejection_reason,now();END$$;`);
 sql(file('supabase/migrations/018_csv_source_evidence.sql'));
 sql(`CREATE TABLE public.step2_ingestion_fixture(evidence uuid PRIMARY KEY,result jsonb);
 CREATE FUNCTION public.ingest_canonical_source_observation(p_evidence uuid,p_input jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
 DECLARE v jsonb;BEGIN v:=jsonb_build_object('listing_id',p_evidence,'outcome','accepted');INSERT INTO public.step2_ingestion_fixture VALUES(p_evidence,v) ON CONFLICT DO NOTHING;RETURN v;END$$;
 REVOKE ALL ON FUNCTION public.ingest_canonical_source_observation(uuid,jsonb) FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.ingest_canonical_source_observation(uuid,jsonb) TO service_role;`);
 const oldPaymentBody=sql("SELECT prosrc FROM pg_proc WHERE oid='public.approve_sinpe_payment(uuid)'::regprocedure");
 sql(file('supabase/migrations/026_administrative_control_foundation.sql'));
 eq(sql("SELECT prosrc FROM pg_proc WHERE oid='twuanis_canonical_private.step2_approve_sinpe_payment(uuid)'::regprocedure"),oldPaymentBody,'existing payment body preserved exactly');
 eq(sql('SELECT count(*) FROM twuanis_canonical_private.owner_access_grants WHERE revoked_at IS NULL'),'1','one approved account Owner');
 eq(sql('SELECT user_id FROM twuanis_canonical_private.top_administrator'),owner,'initial Top is same account');
 eq(snapshot(owner).permissions.length,21,'Owner all declared permissions');eq(snapshot(user).permissions.length,0,'customer default deny; old grants not authority');
 eq(run(user,'SELECT public.is_current_user_import_operator()'),'f','legacy import retired');
 eq(run(user,'SELECT public.is_current_user_payment_reviewer()'),'f','legacy reviewer retired');
 denied(user,command('administrator.activate',user));denied(owner,command('owner.grant',other,null,'reason'));
 denied(owner,command('owner.grant',other,null,'reason'),'aal2',301);
 denied(owner,command('owner.grant',other,null,'reason'),'aal2',-100);
 denied(owner,command('owner.revoke',owner,null,'reason'),'aal2');
 denied(owner,command('top.assign',top),'aal2');
 run(owner,command('top.assign',top,null,'delegate'),'aal2');
 ok(snapshot(top).topAdministrator,'Top assigned');eq(snapshot(top).permissions.join(','),'administrators.manage,administrators.read','Top no implicit domain powers');
 denied(top,command('owner.grant',other,null,'reason'),'aal2');denied(top,command('top.assign',other,null,'reason'),'aal2');
 denied(top,command('administrator.activate',top));denied(top,command('administrator.activate',owner));
 run(top,command('administrator.activate',admin));
 run(top,command('permission.grant',admin,'listings.manage'));
 ok(permits(admin,'listings.manage'),'explicit grant');ok(!permits(admin,'listings.read'),'manage does not imply read');ok(!permits(admin,'payments.review'),'listing not reviewer');
 denied(admin,command('permission.grant',admin,'payments.review'));denied(admin,command('administrator.activate',other));
 denied(top,command('permission.grant',admin,'administrators.manage'));
 run(top,command('permission.grant',admin,'packages.manage'));run(top,command('permission.grant',admin,'payments.read'));run(top,command('permission.grant',admin,'administrators.read'));
 denied(admin,'SELECT public.require_payment_reviewer()');denied(admin,command('top.assign',admin,null,'reason'),'aal2');
 run(top,command('permission.grant',admin,'payments.review'));eq(run(admin,'SELECT public.is_current_user_payment_reviewer()'),'t','reviewer scoped');
 run(admin,'SELECT public.require_payment_reviewer()');checks++;
 const payment=crypto.randomUUID(),rejected=crypto.randomUUID();sql(`INSERT INTO public.step2_payment_fixture VALUES(${lit(payment)},'submitted'),(${lit(rejected)},'submitted');`);
 run(admin,`SELECT payment_status FROM public.approve_sinpe_payment(${lit(payment)})`);
 eq(sql(`SELECT status FROM public.step2_payment_fixture WHERE id=${lit(payment)}`),'approved','existing approval invoked');
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE target_id=${lit(payment)} AND permission='payments.review' AND actor_id=${lit(admin)}`),'1','automatic approval event with actual actor');
 denied(admin,`SELECT * FROM public.approve_sinpe_payment(${lit(payment)})`);
 denied(admin,`SELECT * FROM public.reject_sinpe_payment(${lit(rejected)},'')`);
 run(admin,`SELECT payment_status FROM public.reject_sinpe_payment(${lit(rejected)},'evidence rejected')`);
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE target_id=${lit(rejected)} AND reason='evidence rejected'`),'1','rejection audited with required reason');
 denied(admin,`SELECT * FROM twuanis_canonical_private.step2_approve_sinpe_payment(${lit(payment)})`);
 run(top,command('permission.grant',admin,'imports.manage'));eq(run(admin,'SELECT public.is_current_user_import_operator()'),'t','import scoped');
 // Actor-preserving service handoff uses actual immutable evidence-retention SQL.
 const ticket=run(admin,'SELECT public.begin_administrative_import()');
 const raw={source_name:'fixture',source_listing_id:'fixture-one',observation_id:'one',observed_at:'2026-10-03T10:00:00Z'},review={status:'unresolved',canonical_authority:false,values:{}};
 const retain=t=>`SELECT public.retain_administrative_csv_evidence(${lit(t)},${lit(JSON.stringify(raw))},${lit(JSON.stringify(review))})`;
 denied(admin,retain(ticket));denied(owner,'SELECT public.begin_administrative_import()','aal2',0,'service_role');
 denied(owner,retain(crypto.randomUUID()),'aal1',0,'service_role');
 const evidence=run(owner,retain(ticket),'aal1',0,'service_role');
 eq(run(owner,retain(ticket),'aal1',0,'service_role'),evidence,'retention retry same evidence');
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE request_id=${lit(ticket)} AND operation='import.retain'`),'1','retention audit replay safe');
 const apply=(id,input='{}')=>`SELECT public.apply_administrative_csv_observation(${lit(ticket)},${lit(id)},${lit(input)})`;
 denied(owner,apply(crypto.randomUUID()),'aal1',0,'service_role');
 run(owner,apply(evidence),'aal1',0,'service_role');
 run(owner,apply(evidence),'aal1',0,'service_role');
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE request_id=${lit(ticket)} AND operation='import.apply' AND actor_id=${lit(admin)} AND execution_role='service_role'`),'1','human actor retained behind service executor');
 denied(owner,apply(evidence,'{"changed":true}'),'aal1',0,'service_role');
 run(top,command('permission.revoke',admin,'imports.manage'));
 denied(owner,apply(evidence),'aal1',0,'service_role');
 run(top,command('permission.grant',admin,'imports.manage'));
 sql(`UPDATE twuanis_canonical_private.administrative_import_operations SET created_at=now()-interval '6 minutes' WHERE id=${lit(ticket)}`);
 denied(owner,apply(evidence),'aal1',0,'service_role');
 eq(run(admin,'SELECT public.is_current_user_administrator()'),'f','scoped admin does not receive broad analytical override');
 const id=crypto.randomUUID(),cmd=command('permission.grant',admin,'offers.read',null,id);
 const first=JSON.parse(run(top,cmd)),second=JSON.parse(run(top,cmd));eq(first.eventId,second.eventId,'retry same receipt');eq(second.replayed,true,'retry marked');
 denied(top,command('permission.grant',admin,'offers.manage',null,id));
 run(top,command('permission.revoke',admin,'payments.review'));eq(run(admin,'SELECT public.is_current_user_payment_reviewer()'),'f','revoke immediate in same session identity');
 const rollbackTicket=run(admin,'SELECT public.begin_administrative_import()');
 const applyRollbackTicket=run(admin,'SELECT public.begin_administrative_import()');
 const applyRaw={...raw,source_listing_id:'rollback-apply'};
 const applyEvidence=run(owner,`SELECT public.retain_administrative_csv_evidence(${lit(applyRollbackTicket)},${lit(JSON.stringify(applyRaw))},${lit(JSON.stringify(review))})`,'aal1',0,'service_role');
 const count=sql('SELECT count(*) FROM twuanis_canonical_private.administrative_events');
 sql(`CREATE FUNCTION public.fail_test_event() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'injected audit failure';END$$;CREATE TRIGGER injected BEFORE INSERT ON twuanis_canonical_private.administrative_events FOR EACH ROW EXECUTE FUNCTION public.fail_test_event();`);
 denied(top,command('permission.grant',admin,'configuration.manage'));
 const rollbackPayment=crypto.randomUUID();sql(`INSERT INTO public.step2_payment_fixture VALUES(${lit(rollbackPayment)},'submitted');`);
 denied(owner,`SELECT * FROM public.approve_sinpe_payment(${lit(rollbackPayment)})`);
 eq(sql(`SELECT status FROM public.step2_payment_fixture WHERE id=${lit(rollbackPayment)}`),'submitted','audit failure rolls back payment effect');
 denied(owner,`SELECT public.apply_administrative_csv_observation(${lit(applyRollbackTicket)},${lit(applyEvidence)},'{}')`,'aal1',0,'service_role');
 eq(sql(`SELECT count(*) FROM public.step2_ingestion_fixture WHERE evidence=${lit(applyEvidence)}`),'0','canonical application rolls back if audit fails');
 const rollbackRaw={...raw,source_listing_id:'rollback-evidence'};
 denied(owner,`SELECT public.retain_administrative_csv_evidence(${lit(rollbackTicket)},${lit(JSON.stringify(rollbackRaw))},${lit(JSON.stringify(review))})`,'aal1',0,'service_role');
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.csv_source_evidence WHERE source_listing_id='rollback-evidence'"),'0','source retention rolls back if audit fails');
 ok(!permits(admin,'configuration.manage'),'audit failure rolls back grant');eq(sql('SELECT count(*) FROM twuanis_canonical_private.administrative_events'),count,'audit unchanged after failure');
 sql('DROP TRIGGER injected ON twuanis_canonical_private.administrative_events;DROP FUNCTION public.fail_test_event();');
 denied(user,'SELECT * FROM twuanis_canonical_private.administrative_events');denied(owner,'DELETE FROM twuanis_canonical_private.administrative_events');
 for(const role of ['anon','service_role']){denied(owner,'SELECT public.current_administrative_authority()','aal2',0,role);denied(owner,command('owner.grant',other,null,'reason'),'aal2',0,role)}
 denied(user,`SELECT twuanis_canonical_private.set_owner_access(${lit(user)},true)`);
 assert.throws(()=>sql(`SELECT twuanis_canonical_private.set_owner_access(${lit(user)},true)`));checks++;
 const recovery=(who,aal)=>JSON.parse(run(who,`SELECT public.recover_owner_administrative_access(${lit(crypto.randomUUID())},'account recovery')`,aal));
 eq(recovery(owner,'aal1').ok,false,'Owner invalid evidence denied');eq(recovery(user,'aal2').ok,false,'nonOwner valid MFA cannot recover');eq(recovery(owner,'aal2').ok,true,'current Owner valid MFA recovers access');
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE operation='owner.recover' AND result='denied'"),'2','denials durable');
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE before_state::text LIKE '%mfa/totp%' OR after_state::text LIKE '%timestamp%'"),'0','raw auth evidence not in audit');
 run(owner,command('owner.grant',other,null,'second Owner'),'aal2');ok(snapshot(other).owner,'future separate Owner identity supported');
 run(owner,command('owner.revoke',other,null,'remove second Owner'),'aal2');ok(!snapshot(other).owner,'Owner demotion fresh');denied(other,command('owner.grant',user,null,'reason'),'aal2');
 run(owner,command('top.assign',owner,null,'reassign'),'aal2');denied(top,command('administrator.activate',other));
 run(owner,command('administrator.deactivate',admin));eq(snapshot(admin).permissions.length,0,'removal revokes all');
 // Concurrent Top reassignments serialize; never two current rows.
 const race=await Promise.all([child(authSQL(owner,command('top.assign',top,null,'race A'),'aal2')).result,child(authSQL(owner,command('top.assign',other,null,'race B'),'aal2')).result]);
 ok(race.every(x=>x.code===0),'concurrent Top assignment succeeds serially');eq(sql('SELECT count(*) FROM twuanis_canonical_private.top_administrator'),'1','one Top after race');
 // Same replay identity concurrent: exactly one audit event.
 const same=crypto.randomUUID(),c=command('administrator.activate',admin,null,null,same);
 const replayRace=await Promise.all([child(authSQL(owner,c)).result,child(authSQL(owner,c)).result]);ok(replayRace.every(x=>x.code===0),'concurrent identical request safe');
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE request_id=${lit(same)}`),'1','concurrent replay one event');
 // In-flight domain work serializes with revocation; a subsequent request is denied.
 run(owner,command('permission.grant',admin,'configuration.manage'));
 sql(`CREATE FUNCTION public.step2_domain_probe() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN PERFORM twuanis_canonical_private.assert_administrative_permission('configuration.manage');RETURN 'LOCK_READY';END$$;REVOKE ALL ON FUNCTION public.step2_domain_probe() FROM PUBLIC;GRANT EXECUTE ON FUNCTION public.step2_domain_probe() TO authenticated;`);
 const inFlight=child(authSQL(admin,"SELECT public.step2_domain_probe();SELECT pg_sleep(0.3)"));
 await Promise.race([inFlight.ready,inFlight.result.then(r=>{if(r.code!==0)throw Error(r.err)})]);
 const revoke=child(authSQL(owner,command('permission.revoke',admin,'configuration.manage')));
 const serialized=await Promise.all([inFlight.result,revoke.result]);ok(serialized.every(r=>r.code===0),'in-flight work and revocation serialize');
 denied(admin,'SELECT public.step2_domain_probe()');
 sql('DROP FUNCTION public.step2_domain_probe();');
 // Competing last-owner demotions: one succeeds, second must fail.
 run(owner,command('owner.grant',other,null,'second Owner'),'aal2');
 const demotions=await Promise.all([child(authSQL(owner,command('owner.revoke',owner,null,'remove self'),'aal2')).result,child(authSQL(other,command('owner.revoke',other,null,'remove self'),'aal2')).result]);
 eq(demotions.filter(x=>x.code===0).length,1,'one concurrent last-Owner removal rejected');eq(sql('SELECT count(*) FROM twuanis_canonical_private.owner_access_grants WHERE revoked_at IS NULL'),'1','last Owner survives concurrency');
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.administrative_events WHERE actor_id IS NOT NULL AND actor_provenance <> 'authenticated_account_only'"),'0','no invented individual human attribution');
 eq(sql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='twuanis_canonical_private' AND c.relname IN ('administrators','administrative_permissions','administrative_permission_grants','top_administrator','administrative_events','administrative_receipts') AND NOT c.relrowsecurity"),'0','all new tables RLS');
 for(const name of ['current_administrative_authority()','change_administrative_authority(uuid,text,uuid,text,text)','recover_owner_administrative_access(uuid,text)']) for(const role of ['anon','service_role']) eq(sql(`SELECT has_function_privilege(${lit(role)},${lit('public.'+name)},'EXECUTE')`),'f','RPC role deny');
 console.log(`PASS database assertions: ${checks}; four independent-session concurrency cases.`);
 await offline();
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true});console.log('Disposable PostgreSQL stopped and removed.')}}
async function offline(){
 const ts=require(root+'/node_modules/typescript');let calls=[],authorityData={actorId:owner,owner:true,topAdministrator:true,permissions:['administrators.manage']};let authError=false,rpcError=false;
 const client={auth:{getUser:async()=>({data:{user:authError?null:{id:owner}},error:authError?'bad':null})},rpc:async(name,args)=>{calls.push({name,args});return {data:name==='current_administrative_authority'?authorityData:{ok:true,eventId:'1',replayed:false},error:rpcError?'secret internal error':null}}};
 const mod={exports:{}};vm.runInNewContext(ts.transpileModule(file('lib/administrative-control.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:mod,exports:mod.exports,require(name){if(name==='server-only')return {};if(name==='@/lib/supabase-server')return {createServerSupabaseClient:async()=>client};throw Error('unexpected import '+name)},Object,Set,Error},{filename:'administrative-control.ts'});
 const api=mod.exports,base={requestId:crypto.randomUUID(),targetId:admin,operation:'administrator.activate'};
 const before=checks;eq((await api.resolveAdministrativeAuthority()).actorId,owner,'provider actor');
 await api.changeAdministrativeAuthority(base);ok(calls.at(-1).args.p_target===admin,'narrow RPC args');ok(!('p_actor' in calls.at(-1).args),'no supplied actor');
 await assert.rejects(()=>api.changeAdministrativeAuthority({...base,actorId:user}));checks++;
 await assert.rejects(()=>api.changeAdministrativeAuthority({...base,operation:'owner.grant'}));checks++;
 await assert.rejects(()=>api.changeAdministrativeAuthority({...base,operation:'permission.grant',permission:'administrators.manage'}));checks++;
 authError=true;const n=calls.length;await assert.rejects(()=>api.resolveAdministrativeAuthority());checks++;eq(calls.length,n,'no RPC before verified auth');authError=false;
 authorityData={...authorityData,actorId:user};await assert.rejects(()=>api.resolveAdministrativeAuthority());checks++;
 authorityData={actorId:owner,owner:false,topAdministrator:false,permissions:['listings.manage']};await assert.rejects(()=>api.changeAdministrativeAuthority(base));checks++;
 await assert.rejects(()=>api.assertAdministrativePermission('payments.review'));checks++;
 authorityData={actorId:owner,owner:true,topAdministrator:true,permissions:['administrators.manage']};rpcError=true;
 await assert.rejects(()=>api.resolveAdministrativeAuthority(),e=>!e.message.includes('secret'));checks++;
 ok(file('lib/administrative-control.ts').startsWith("import 'server-only'"),'server-only marker');
 ok(!file('lib/administrative-control.ts').includes('SERVICE_ROLE'),'no service credentials');
 const importMod={exports:{}},importCalls=[];
 vm.runInNewContext(ts.transpileModule(file('lib/administrative-import.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:importMod,exports:importMod.exports,require(name){if(name==='server-only')return {};if(name==='@/lib/administrative-control')return api;throw Error(name)}});
 const nonce=crypto.randomUUID();
 const human={auth:{getUser:async()=>({data:{user:{id:admin}}})},rpc:async(name)=>{eq(name,'begin_administrative_import','human issues scoped handoff');return {data:nonce}}};
 const service={rpc:(name,args)=>{importCalls.push({name,args});return {data:'fixture'}}};
 const transport=await importMod.exports.createAdministrativeImportTransport(human,service);
 transport.rpc('retain_csv_source_evidence',{p_raw:{},p_review:{}});
 eq(importCalls.at(-1).name,'retain_administrative_csv_evidence','narrow retention wrapper');eq(importCalls.at(-1).args.p_operation,nonce,'server-established nonce');
 transport.rpc('ingest_canonical_source_observation',{p_evidence:nonce,p_input:{}});
 eq(importCalls.at(-1).name,'apply_administrative_csv_observation','narrow application wrapper');
 assert.throws(()=>transport.rpc('arbitrary_writer',{}));checks++;
 await assert.rejects(()=>importMod.exports.createAdministrativeImportTransport({auth:{getUser:async()=>({error:'denied',data:{user:null}})}},service));checks++;
 console.log(`PASS offline real server-module assertions: ${checks-before}; total ${checks}.`);
}
main().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
