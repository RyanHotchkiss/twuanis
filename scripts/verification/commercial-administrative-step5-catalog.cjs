'use strict';
// Isolated PostgreSQL + offline real-module verification. No environment files or HTTP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-admin-step5-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);
let started=false,checks=0;const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',top=crypto.randomUUID(),admin=crypto.randomUUID(),user=crypto.randomUUID(),other=crypto.randomUUID();
function call(bin,args,input){return execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
const args=['-X','-qAt','-h',socket,'-p','55455','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
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
 call('pg_ctl',['-D',data,'-l',dir+'/postgres.log','-o',`-k ${socket} -p 55455 -c listen_addresses=`,'start']);started=true;
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

 sql(file('supabase/migrations/031_addon_catalog.sql'));
 const m=JSON.parse(file('outputs/commercial-administrative/step1-model.json'));
 const projection=id=>JSON.parse(sql(`SELECT twuanis_canonical_private.addon_projection(${lit(id)})`));
 const cmd=(body,rid=crypto.randomUUID(),actor=owner)=>JSON.parse(run(actor,`SELECT public.admin_addon_command(${lit(rid)},${lit(JSON.stringify(body))})`));
 const change=(id,op,fields={},rid=crypto.randomUUID())=>cmd({operation:op,product:id,expected:projection(id).revision,...fields},rid);
 eq(sql('SELECT count(*) FROM twuanis_canonical_private.addon_products'),'8','eight products');
 for(const p of m.placementAddOns){const a=projection(p.id);eq(a.target,'listing','listing target');eq(a.behavior,p.benefit,'behavior');eq(a.durationDays,p.durationDays,'approved duration');eq(a.acquisitionAvailable,false,'checkout unavailable');eq(a.name_es,null,'no invented translation');for(const cur of ['USD','CRC'])eq(Number(a.standardPrices[cur]),Number(p.standard[cur]),'standard price')}
 const bulk=projection(m.bulkImport.id);eq(bulk.durationDays,null,'no bulk duration');eq(bulk.target,'operation','bulk operation');eq(bulk.quantityTiers.length,3,'three tiers');
 for(const t of m.bulkImport.tiers){const actual=bulk.quantityTiers.find(x=>x.min===t.min);eq(actual.max,t.max,'tier bound');eq(Number(actual.unitRate),Number(t.standardUSD),'whole tier rate')}
 eq(projection(m.founder.id).standardPrices.USD,'500','founder standard, no Offer');eq(projection(m.founder.id).termKind,'lifetime','founder lifetime');eq(projection(m.template.id).state,'inactive','template inactive');eq(Object.keys(projection(m.template.id).standardPrices).length,0,'template unpriced');eq(projection('addon-homepage-exposure').capacity,10,'ten homepage slots');
 denied(user,'SELECT public.admin_addon_read(NULL)');denied(user,`SELECT public.admin_addon_command('${crypto.randomUUID()}','{"operation":"create","name_en":"x","behavior":"featured_collection"}')`);
 for(const role of ['anon','authenticated','service_role']){
  eq(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.addon_products','INSERT')`),'f','no direct write');
  eq(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.addon_projection(text)','EXECUTE')`),'f','private projection denied');
 }
 const id=m.placementAddOns[0].id,old=projection(id),request=crypto.randomUUID(),body={operation:'configuration',product:id,expected:old.revision,durationDays:61,prices:{USD:'13.25',CRC:'6500'}};
 cmd(body,request);eq(cmd(body,request).replayed,true,'idempotent replay');eq(projection(id).durationDays,61,'future duration');
 eq(sql(`SELECT duration_days FROM twuanis_canonical_private.addon_configurations WHERE id=${lit(old.configurationId)}`),'60','historical duration unchanged');
 eq(sql(`SELECT amount FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id=${lit(old.configurationId)} AND currency='USD'`),'12','historical price unchanged');
 assert.throws(()=>cmd({...body,durationDays:62},request));checks++;
 assert.throws(()=>cmd({...body},crypto.randomUUID()));checks++;
 assert.throws(()=>change(id,'configuration',{prices:{USD:'2',CRC:'1.25'}}));checks++;
 assert.throws(()=>change(id,'configuration',{prices:{USD:'NaN',CRC:'100'}}));checks++;
 assert.throws(()=>change(m.template.id,'configuration',{durationDays:1}));checks++;
 assert.throws(()=>change(m.founder.id,'configuration',{durationDays:1}));checks++;
 assert.throws(()=>change(m.bulkImport.id,'configuration',{tiers:[{min:1,max:25,currency:'USD',unitRate:'1'},{min:25,max:100,currency:'USD',unitRate:'1'},{min:101,max:500,currency:'USD',unitRate:'1'}]}));checks++;
 assert.throws(()=>sql(`UPDATE twuanis_canonical_private.addon_configurations SET duration_days=4 WHERE id=${lit(old.configurationId)}`));checks++;
 assert.throws(()=>sql(`UPDATE twuanis_canonical_private.addon_products SET behavior='priority_over_organic' WHERE id=${lit(id)}`));checks++;
 const created=cmd({operation:'create',name_en:'Future placement',behavior:'featured_collection'});eq(projection(created.productId).state,'draft','draft create');
 assert.throws(()=>change(created.productId,'lifecycle',{state:'active'}));checks++;
 change(created.productId,'configuration',{durationDays:10,prices:{USD:'1',CRC:'500'}});change(created.productId,'lifecycle',{state:'active'});
 change(created.productId,'lifecycle',{state:'archived',reason:'test'});assert.throws(()=>change(created.productId,'lifecycle',{state:'active'}));checks++;
 assert.throws(()=>cmd({operation:'create',name_en:'Unsupported',behavior:'homepage_carousel'}));checks++;
 const publicRows=JSON.parse(sql('SET ROLE anon;SELECT public.read_addon_catalog(NULL);RESET ROLE;'));ok(publicRows.every(x=>x.state==='active'&&x.acquisitionAvailable===false),'public active catalog only');
 const draft=cmd({operation:'create',name_en:'Sealed draft',behavior:'priority_over_organic'});assert.throws(()=>sql(`INSERT INTO twuanis_canonical_private.addon_standard_prices VALUES(${lit(projection(draft.productId).configurationId)},'USD',1)`));checks++;
 // Concurrent stale writes: exactly one command wins, one receives stale revision.
 const expected=projection(id).revision;
 const raceCmd=amount=>authSQL(owner,`SELECT public.admin_addon_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'configuration',product:id,expected,prices:{USD:amount,CRC:'6500'}}))})`);
 const ca=child(raceCmd('14')),cb=child(raceCmd('15'));const results=await Promise.all([ca.result,cb.result]);eq(results.filter(x=>x.code===0).length,1,'concurrent winner');eq(results.filter(x=>x.code!==0).length,1,'stale competitor rejected');
 console.log(JSON.stringify({checks,races:1,status:'PASS',scope:'catalog only; real isolated PostgreSQL, no production'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}}
main().catch(e=>{console.error(e.message);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
