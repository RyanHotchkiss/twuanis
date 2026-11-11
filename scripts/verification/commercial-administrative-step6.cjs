'use strict';
// Isolated PostgreSQL + offline real-module verification. No environment files or HTTP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-admin-step6-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);
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

 sql(file('supabase/migrations/034_offer_authority.sql'));
 const cmd=(body,rid=crypto.randomUUID(),actor=owner)=>JSON.parse(run(actor,`SELECT public.admin_offer_command(${lit(rid)},${lit(JSON.stringify(body))})`));
 const base={operation:'create',targetType:'addon',targetId:'addon-featured-listing',name_en:'Fixture',name_es:'Prueba',startsAt:'2026-10-10T00:00:00-06:00',endsAt:'2026-12-31T23:59:59-06:00',prices:{USD:'3',CRC:'1500'}};
 const rid=crypto.randomUUID(),r=cmd(base,rid);
 eq(cmd(base,rid).offerId,r.offerId,'create retry stable identity');
 const get=()=>JSON.parse(sql(`SELECT twuanis_canonical_private.offer_projection(${lit(r.offerId)},'2026-10-11T00:00:00Z')`));
 eq(get().state,'draft','creation stays draft');
 cmd({operation:'schedule',id:r.offerId,expected:'1'});
 eq(get().state,'active','server time derives active');
 const r2=cmd(base);assert.throws(()=>cmd({operation:'schedule',id:r2.offerId,expected:'1'}));checks++;
 assert.throws(()=>cmd({...base,prices:{USD:'0'}}));checks++;
 assert.throws(()=>cmd(base,crypto.randomUUID(),user));checks++;
 assert.throws(()=>cmd({operation:'end',id:r.offerId,expected:'1'}));checks++;
 cmd({operation:'configure',id:r.offerId,expected:'2',name_en:'Updated',name_es:'Actualizada',startsAt:base.startsAt,endsAt:base.endsAt,prices:{USD:'4'}});
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_configurations WHERE offer_id=${lit(r.offerId)}`),'2','configuration history retained');
 assert.throws(()=>sql(`UPDATE twuanis_canonical_private.offer_scalar_prices SET amount=1`));checks++;
 cmd({operation:'end',id:r.offerId,expected:'3'});eq(get().state,'ended','early end');
 cmd({operation:'archive',id:r.offerId,expected:'4',reason:'Fixture'});eq(get().state,'archived','archive');
 eq(sql("SELECT amount FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id='05000000-0000-4000-8000-000000000001' AND currency='USD'"),'12','standard price preserved');

 const usd=cmd({...base,prices:{USD:'3'}}),crc=cmd({...base,prices:{CRC:'1500'}});
 cmd({operation:'schedule',id:usd.offerId,expected:'1'});
 cmd({operation:'schedule',id:crc.offerId,expected:'1'});
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.offers WHERE state='eligible'"),'2','disjoint currencies may overlap');
 console.log('PASS Step6 initial schema/admin checks:',checks);
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
