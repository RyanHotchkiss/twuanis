'use strict';
// Isolated PostgreSQL + offline real-module verification. No environment files or HTTP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-admin-step4-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);
let started=false,checks=0;const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',top=crypto.randomUUID(),admin=crypto.randomUUID(),user=crypto.randomUUID(),other=crypto.randomUUID();
function call(bin,args,input){return execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
const args=['-X','-qAt','-h',socket,'-p','55454','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
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
 call('pg_ctl',['-D',data,'-l',dir+'/postgres.log','-o',`-k ${socket} -p 55454 -c listen_addresses=`,'start']);started=true;
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

 sql(file('supabase/migrations/026_administrative_control_foundation.sql'));
 sql(file('supabase/migrations/030_intelligence_package_configurations.sql'));
 const m=JSON.parse(file('outputs/commercial-administrative/step1-model.json')),pk=m.packages.map(x=>x.id),caps=m.capabilities.map(x=>x.id);
 const projection=id=>JSON.parse(sql(`SELECT twuanis_canonical_private.package_projection(${lit(id)})`));
 const mutation=(id,op,fields={},rid=crypto.randomUUID(),actor=owner,expected=projection(id).revision)=>run(actor,`SELECT public.admin_package_command(${lit(rid)},${lit(JSON.stringify({package:id,operation:op,expected,...fields}))})`);
 eq(sql('SELECT count(*) FROM twuanis_canonical_private.intelligence_capabilities'),'17','17 capabilities');
 eq(sql('SELECT count(*) FROM twuanis_canonical_private.intelligence_packages'),'3','three packages');
 for(const [i,pid] of pk.entries()){
  const p=projection(pid);eq(p.capabilities.length,[3,4,10][i],'exact membership count');eq(p.termQuantity,1,'typed quantity');eq(p.termUnit,'month','no invented arithmetic');eq(p.name_es,null,'unapproved Spanish remains null');eq(p.acquisitionAvailable,false,'no fake checkout');
  for(const cur of ['USD','CRC'])eq(Number(p.standardPrices[cur]),Number(m.packages[i].standard[cur]),'independent standard price');
 }
 const grant=(who,pid,from="now()-interval '1 hour'",to="now()+interval '1 hour'",rev='NULL')=>sql(`INSERT INTO twuanis_canonical_private.intelligence_package_rights(account_id,package_id,configuration_id,starts_at,ends_at,revoked_at,provenance) SELECT ${lit(who)},id,current_configuration_id,${from},${to},${rev},'disposable fixture only' FROM twuanis_canonical_private.intelligence_packages WHERE id=${lit(pid)}`);
 const access=(who,cap)=>run(who,`SELECT public.current_account_has_capability(${lit(cap)})`)==='t';
 for(const [i,pid] of pk.entries()){
  const who=[user,other,admin][i];grant(who,pid);
  for(const c of m.capabilities)eq(access(who,c.id),c.packageId===pid,`membership boundary ${pid} ${c.id}`);
 }
 grant(user,pk[2]);for(const c of m.capabilities)eq(access(user,c.id),c.packageId!==pk[1],'independent union');
 for(const cap of caps)eq(access(top,cap),false,'no rights deny');
 grant(top,pk[0],"now()-interval '2 hours'","now()-interval '1 hour'");for(const cap of caps)eq(access(top,cap),false,'expired denies');
 grant(top,pk[1],"now()-interval '1 hour'","now()+interval '1 hour'",'now()');for(const cap of caps)eq(access(top,cap),false,'revoked denies');
 grant(top,pk[2],"now()+interval '1 hour'","now()+interval '2 hours'");for(const cap of caps)eq(access(top,cap),false,'scheduled denies');
 // Remaining original gate coverage: all package unions and precise DB clock edges.
 const unionUser=crypto.randomUUID();sql(`INSERT INTO auth.users VALUES(${lit(unionUser)})`);
 for(const set of [[0,1],[0,2],[1,2],[0,1,2]]){
  sql(`DELETE FROM twuanis_canonical_private.intelligence_package_rights WHERE account_id=${lit(unionUser)}`);
  for(const i of set)grant(unionUser,pk[i]);
  for(const c of m.capabilities)eq(access(unionUser,c.id),set.some(i=>pk[i]===c.packageId),'exact purchased union '+set.join('+')+' '+c.id);
 }
 sql(`DELETE FROM twuanis_canonical_private.intelligence_package_rights WHERE account_id=${lit(unionUser)}`);grant(unionUser,pk[0]);
 sql(`SELECT set_config('request.jwt.claims',${lit(JSON.stringify(claims(unionUser)))},false);DO $fixture$
 DECLARE t timestamptz:=statement_timestamp(); BEGIN
 UPDATE twuanis_canonical_private.intelligence_package_rights SET starts_at=t+interval '1 microsecond',ends_at=t+interval '1 day' WHERE account_id=${lit(unionUser)};
 IF public.current_account_has_capability('cap-market-summary') THEN RAISE EXCEPTION 'before start granted';END IF;
 UPDATE twuanis_canonical_private.intelligence_package_rights SET starts_at=t WHERE account_id=${lit(unionUser)};
 IF NOT public.current_account_has_capability('cap-market-summary') THEN RAISE EXCEPTION 'at start denied';END IF;
 UPDATE twuanis_canonical_private.intelligence_package_rights SET starts_at=t-interval '1 day',ends_at=t+interval '1 microsecond' WHERE account_id=${lit(unionUser)};
 IF NOT public.current_account_has_capability('cap-market-summary') THEN RAISE EXCEPTION 'before end denied';END IF;
 UPDATE twuanis_canonical_private.intelligence_package_rights SET ends_at=t WHERE account_id=${lit(unionUser)};
 IF public.current_account_has_capability('cap-market-summary') THEN RAISE EXCEPTION 'at end granted';END IF;
 UPDATE twuanis_canonical_private.intelligence_package_rights SET ends_at=t-interval '1 microsecond' WHERE account_id=${lit(unionUser)};
 IF public.current_account_has_capability('cap-market-summary') THEN RAISE EXCEPTION 'after end granted';END IF;
 END $fixture$;RESET request.jwt.claims;`);checks+=5;
 const publicCatalog=()=>JSON.parse(sql("SET ROLE anon;SELECT public.read_intelligence_package_catalog(NULL);RESET ROLE;"));
 eq(publicCatalog().length,3,'public active catalog');
 for(const item of publicCatalog()){
  eq(item.acquisitionAvailable,false,'public does not promise acquisition');
  for(const key of ['revision','configurationId','created_at','account_id','authority','audit'])eq(key in item,false,'public excludes '+key);
 }
 const initial=projection(pk[0]),removed=initial.capabilities[0];
 mutation(pk[0],'configuration',{capabilities:initial.capabilities.slice(1),termQuantity:3});
 const next=projection(pk[0]);eq(next.version,'2','new version');eq(next.termQuantity,3,'typed future term');ok(next.configurationId!==initial.configurationId,'new config identity');
 eq(sql(`SELECT term_quantity FROM twuanis_canonical_private.intelligence_package_configurations WHERE id=${lit(initial.configurationId)}`),'1','V1 term immutable');
 eq(access(user,removed),true,'V1 right survives membership removal');
 grant(top,pk[0]);eq(access(top,removed),false,'new acquisition fixture binds V2');
 assert.throws(()=>sql(`UPDATE twuanis_canonical_private.intelligence_package_configurations SET term_quantity=8 WHERE id=${lit(initial.configurationId)}`));checks++;
 eq(publicCatalog().find(p=>p.id===pk[0]).termQuantity,3,'public database configuration current');
 const beforePrice=projection(pk[0]);mutation(pk[0],'price',{currency:'USD',amount:'11.50'});eq(projection(pk[0]).configurationId,beforePrice.configurationId,'price does not version purchased rights');
 const rid=crypto.randomUUID(),expect=projection(pk[0]).revision;const one=JSON.parse(mutation(pk[0],'price',{currency:'USD',amount:'12.00'},rid,owner,expect));
 const two=JSON.parse(mutation(pk[0],'price',{currency:'USD',amount:'12.00'},rid,owner,expect));eq(one.eventId,two.eventId,'replay same event');eq(two.replayed,true,'replay tagged');
 assert.throws(()=>mutation(pk[0],'price',{currency:'USD',amount:'13.00'},rid,owner,expect));checks++;
 assert.throws(()=>mutation(pk[0],'price',{currency:'USD',amount:'13.00'},crypto.randomUUID(),owner,expect));checks++;
 for(const amount of ['0','-1','NaN','1e4','1.123']){assert.throws(()=>mutation(pk[0],'price',{currency:'USD',amount}));checks++;}
 assert.throws(()=>mutation(pk[0],'configuration',{capabilities:[caps[0],caps[0]]}));checks++;
 assert.throws(()=>mutation(pk[0],'configuration',{capabilities:['cap-fabricated']}));checks++;
 assert.throws(()=>mutation(pk[0],'configuration',{capabilities:projection(pk[1]).capabilities}));checks++;
 denied(user,'SELECT public.admin_package_read(NULL)');
 assert.throws(()=>mutation(pk[0],'price',{currency:'USD',amount:'99'},crypto.randomUUID(),user));checks++;
 run(owner,command('administrator.activate',admin));run(owner,command('permission.grant',admin,'packages.read'));
 run(admin,'SELECT public.admin_package_read(NULL)');checks++;
 assert.throws(()=>mutation(pk[0],'price',{currency:'USD',amount:'99'},crypto.randomUUID(),admin));checks++;
 run(owner,command('permission.revoke',admin,'packages.read'));run(owner,command('permission.grant',admin,'packages.manage'));
 denied(admin,'SELECT public.admin_package_read(NULL)');mutation(pk[0],'price',{currency:'USD',amount:'14'},crypto.randomUUID(),admin);checks++;
 mutation(pk[0],'lifecycle',{state:'inactive'});eq(access(user,removed),true,'inactive preserves V1');
 mutation(pk[0],'lifecycle',{state:'archived',reason:'fixture archive'});eq(access(user,removed),true,'archive preserves V1');eq(sql(`SELECT count(*) FROM twuanis_canonical_private.intelligence_package_configurations WHERE package_id=${lit(pk[0])}`),'2','archive retains versions');
 assert.throws(()=>mutation(pk[0],'lifecycle',{state:'active'}));checks++;
 for(const role of ['anon','authenticated','service_role']){
 eq(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.intelligence_package_rights','INSERT')`),'f','no client grants');
 eq(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.intelligence_package_configurations','UPDATE')`),'f','no client version updates');
 }
 eq(sql("SELECT has_function_privilege('anon','public.admin_package_command(uuid,jsonb)','EXECUTE')"),'f','anon denied');
 eq(sql("SELECT has_function_privilege('service_role','public.admin_package_command(uuid,jsonb)','EXECUTE')"),'f','service cannot impersonate Admin');
 // Independent PostgreSQL sessions exercise actual lock ordering, not Promise-only mocks.
 let races=0;
 const raceCmd=(id,expected,op,fields,rid)=>`SELECT public.admin_package_command(${lit(rid)},${lit(JSON.stringify({package:id,expected,operation:op,...fields}))})`;
 async function race(first,second){
  const a=child(authSQL(owner,`${first};SELECT 'LOCK_READY';SELECT pg_sleep(0.25)`));await a.ready;
  const b=child(authSQL(admin,second));const ar=await a.result,br=await b.result;eq(ar.code,0,'first transaction succeeds');races++;return br;
 }
 let base=projection(pk[1]).revision;
 let result=await race(raceCmd(pk[1],base,'price',{currency:'USD',amount:'51'},crypto.randomUUID()),raceCmd(pk[1],base,'price',{currency:'USD',amount:'52'},crypto.randomUUID()));ok(result.code!==0,'stale concurrent price denied');eq(projection(pk[1]).standardPrices.USD,'51','winner retained');
 base=projection(pk[1]).revision;
 result=await race(raceCmd(pk[1],base,'configuration',{termQuantity:2},crypto.randomUUID()),raceCmd(pk[1],base,'lifecycle',{state:'archived',reason:'race'},crypto.randomUUID()));ok(result.code!==0,'configuration/archive stale race denied');eq(projection(pk[1]).state,'active','stale archive did not occur');
 base=projection(pk[1]).revision;const sharedRequest=crypto.randomUUID(),sharedCommand=raceCmd(pk[1],base,'price',{currency:'CRC',amount:'25001'},sharedRequest);
 const same=child(authSQL(owner,`${sharedCommand};SELECT 'LOCK_READY';SELECT pg_sleep(0.25)`));await same.ready;const again=child(authSQL(owner,sharedCommand));eq((await same.result).code,0,'first same request');const replay=await again.result;eq(replay.code,0,'concurrent same actor replay');ok(replay.out.includes('"replayed": true'),'concurrent replay marked');races++;
 const beforeFailure=projection(pk[1]);
 sql(`CREATE FUNCTION public.step4_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture audit failure';END$$;CREATE TRIGGER step4_fail_audit BEFORE INSERT ON twuanis_canonical_private.administrative_events FOR EACH ROW EXECUTE FUNCTION public.step4_fail_audit()`);
 assert.throws(()=>mutation(pk[1],'configuration',{termQuantity:4}));checks++;eq(JSON.stringify(projection(pk[1])),JSON.stringify(beforeFailure),'audit failure rolls back version and pointer');
 sql('DROP TRIGGER step4_fail_audit ON twuanis_canonical_private.administrative_events;DROP FUNCTION public.step4_fail_audit()');
 assert.throws(()=>mutation(pk[1],'configuration',{termQuantity:4,configurationId:crypto.randomUUID()}));checks++;
 eq(sql("SELECT prosecdef AND proconfig=ARRAY['search_path=pg_catalog'] FROM pg_proc WHERE oid='twuanis_canonical_private.validate_package_catalog()'::regprocedure"),'t','deferred trigger fixed safe owner context');
 for(const role of ['anon','authenticated','service_role'])eq(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.validate_package_catalog()','EXECUTE')`),'f','no direct trigger execution');
 const createPayload={operation:'create',name_en:'New fixture package',question_en:'Fixture question?'};
 const createRequest=crypto.randomUUID();
 const createCmd=(payload=createPayload,id=createRequest)=>`SELECT public.admin_package_command(${lit(id)},${lit(JSON.stringify(payload))})`;
 const created=JSON.parse(run(owner,createCmd()));
 ok(/^pkg-[0-9a-f-]{36}$/.test(created.packageId),'server generated durable ID');
 ok(created.packageId!=='pkg-'+created.configurationId,'separate configuration identity');
 let cp=projection(created.packageId);eq(cp.state,'draft','create draft');eq(cp.capabilities.length,0,'no implicit capabilities');eq(Object.keys(cp.standardPrices).length,0,'no implicit prices');eq(cp.name_es,null,'no invented Spanish');eq(cp.trialEligible,false,'no implicit trial eligibility');eq(cp.acquisitionAvailable,false,'no acquisition');
 eq(JSON.parse(run(owner,createCmd())).packageId,created.packageId,'replay returns same identity');
 denied(owner,createCmd({...createPayload,name_en:'changed'}));
 for(const key of ['id','package_id','canonical_id','package','configurationId'])denied(owner,createCmd({...createPayload,[key]:pk[0]},crypto.randomUUID()));
 mutation(created.packageId,'copy',{name_en:'Renamed',question_en:'Revised?',name_es:'Nombre autorizado de prueba',question_es:'¿Prueba?'});eq(projection(created.packageId).id,created.packageId,'copy keeps identity');
 mutation(created.packageId,'price',{currency:'USD',amount:'2.25'});mutation(created.packageId,'price',{currency:'CRC',amount:'1200'});eq(projection(created.packageId).id,created.packageId,'prices keep identity');
 mutation(created.packageId,'configuration',{termQuantity:3,capabilities:[removed]});eq(projection(created.packageId).id,created.packageId,'configuration keeps identity');
 mutation(created.packageId,'lifecycle',{state:'active'});mutation(created.packageId,'lifecycle',{state:'archived',reason:'fixture'});eq(projection(created.packageId).id,created.packageId,'archive keeps identity');
 eq(sql(`SELECT after_state->>'id' FROM twuanis_canonical_private.administrative_events WHERE request_id=${lit(createRequest)}`),created.packageId,'creation audit records canonical ID');
 const ca=child(authSQL(owner,createCmd(createPayload,crypto.randomUUID()))),cb=child(authSQL(admin,createCmd(createPayload,crypto.randomUUID())));
 const car=await ca.result,cbr=await cb.result;eq(car.code,0,'concurrent create one');eq(cbr.code,0,'concurrent create two');
 const parseResult=s=>JSON.parse(s.trim().split('\n').at(-1));ok(parseResult(car.out).packageId!==parseResult(cbr.out).packageId,'concurrent identities distinct');races++;
 for(const pid of pk)eq(projection(pid).id,pid,'three approved identities unchanged');
 for(const role of ['anon','authenticated','service_role'])eq(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.intelligence_packages','INSERT')`),'f','direct identity insertion denied');
 for(const item of publicCatalog())eq(projection(item.id).state,'active','public excludes draft/inactive/archived');
 console.log(JSON.stringify({checks,races,scope:'disposable PostgreSQL, no network or production',status:'PASS'}));

 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}}
main().catch(e=>{console.error(e.message);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
