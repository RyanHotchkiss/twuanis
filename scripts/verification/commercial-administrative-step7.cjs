'use strict';
// Isolated PostgreSQL + offline real-module verification. No environment files or HTTP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-campaign-step7-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);
let started=false,checks=0;const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',top=crypto.randomUUID(),admin=crypto.randomUUID(),user=crypto.randomUUID(),other=crypto.randomUUID();
function call(bin,args,input){return execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']})}
const args=['-X','-qAt','-h',socket,'-p','55457','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
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
 call('pg_ctl',['-D',data,'-l',dir+'/postgres.log','-o',`-k ${socket} -p 55457 -c listen_addresses=`,'start']);started=true;
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

 sql(`CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE TABLE storage.objects(bucket_id text,name text,metadata jsonb);ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
 sql(file('supabase/migrations/037_campaign_authority.sql'));
 sql(file('supabase/migrations/038_campaign_delivery.sql'));
 const cmd=(body,rid=crypto.randomUUID(),actor=owner)=>JSON.parse(run(actor,`SELECT public.admin_campaign_command(${lit(rid)},${lit(JSON.stringify(body))})`));
 const payload={headline_en:'Twuanis fixture',headline_es:'Prueba Twuanis',copy_en:'Marketing only',copy_es:'Solo mercadeo',cta_en:'Learn more',cta_es:'Más información',destination_en:'/en',destination_es:'/es',alt_en:'',alt_es:'',image:null,video:null};
 const creative=cmd({operation:'creative.create',creative:payload});
 const version=sql(`SELECT current_version_id FROM twuanis_canonical_private.campaign_creatives WHERE id=${lit(creative.id)}`);
 const base={operation:'create',targetClass:'TWUANIS',targetId:'twuanis',configuration:{name:'Brand',creativeVersion:version,surfaces:['homepage'],audience:'ALL',startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z',frequency:2,priority:0,external:[]}};
 const request=crypto.randomUUID(),c=cmd(base,request);
 eq(cmd(base,request).id,c.id,'idempotent create returns same identity');
 const get=id=>JSON.parse(sql(`SELECT twuanis_canonical_private.campaign_projection(${lit(id)})`));
 eq(get(c.id).state,'draft','draft has no rendering authority');
 assert.throws(()=>cmd({...base,targetClass:'FEATURE',targetId:'fake'}));checks++;
 assert.throws(()=>cmd({...base,targetClass:'ENGINE',targetId:'route-derived'}));checks++;
 const engine=cmd({...base,targetClass:'ENGINE',targetId:'cap-market-summary'});ok(engine.id,'existing engine identity accepted');
 assert.throws(()=>cmd({...base,configuration:{...base.configuration,surfaces:['invented']}}));checks++;
 assert.throws(()=>cmd({...base,configuration:{...base.configuration,endsAt:'2020-01-01'}}));checks++;
 assert.throws(()=>cmd({...base,configuration:{...base.configuration,external:[{channel:'FACEBOOK',provenance:'live'}]}}));checks++;
 assert.throws(()=>cmd(base,crypto.randomUUID(),user));checks++;
 denied(user,'SELECT public.admin_campaign_read()');
 cmd({operation:'schedule',id:c.id,expected:'1'});eq(get(c.id).state,'active','schedule derives active from DB time');
 const resolve=(sid=null,surfaces=['homepage'],authenticated=false,language='en')=>JSON.parse(run(owner,`SELECT public.resolve_owned_campaigns(${sid?lit(sid):'NULL'},ARRAY[${surfaces.map(lit)}]::text[],${lit(language)},${authenticated})`,'aal1',0,'service_role'));
 const events=(sid,items)=>run(owner,`SELECT public.report_campaign_events(${lit(sid)},${lit(JSON.stringify(items))})`,'aal1',0,'service_role');
 let delivery=resolve();eq(delivery.items.length,1,'selected placement delivered');eq(delivery.items[0].headline,payload.headline_en,'EN creative');
 ok(!JSON.stringify(delivery.items).match(/revision|configuration|audience|external|actor|permission/),'safe projection');
 let token=delivery.items[0].token;
 events(delivery.session,[{token,kind:'impression'},{token,kind:'impression'},{token,kind:'click'},{token,kind:'click'}]);
 eq(sql("SELECT impressions||'/'||clicks FROM twuanis_canonical_private.campaign_counts"),'1/1','duplicate event inflation blocked');
 events(crypto.randomUUID(),[{token,kind:'impression'}]);eq(sql('SELECT sum(impressions) FROM twuanis_canonical_private.campaign_counts'),'1','cross-session token ignored');
 const second=resolve(delivery.session);eq(second.items.length,1,'second permitted delivery');eq(resolve(delivery.session).items.length,0,'frequency cap enforced');
 let otherDelivery=resolve(null,['homepage'],true,'es');eq(otherDelivery.items[0].headline,payload.headline_es,'ES creative');
 events(otherDelivery.session,[{token:otherDelivery.items[0].token,kind:'dismiss'}]);eq(resolve(otherDelivery.session).items.length,0,'dismissal survives navigation');
 cmd({operation:'pause',id:c.id,expected:'2'});eq(resolve().items.length,0,'pause stops new delivery');
 assert.throws(()=>cmd({operation:'configure',id:c.id,expected:'2',configuration:base.configuration}));checks++;
 cmd({operation:'resume',id:c.id,expected:'3'});eq(resolve().items.length,1,'resume');
 cmd({operation:'creative.configure',id:creative.id,expected:'1',creative:{...payload,headline_en:'New version'}});
 eq(resolve().items[0].headline,payload.headline_en,'campaign pins prior creative version');
 assert.throws(()=>sql("UPDATE twuanis_canonical_private.campaign_creative_versions SET payload='{}'"));checks++;
 assert.throws(()=>sql('DELETE FROM twuanis_canonical_private.campaign_configurations'));checks++;
 for(const bad of ['javascript:alert(1)','//evil.example','/en?next=https://evil.example','/en/checkout']){assert.throws(()=>cmd({operation:'creative.create',creative:{...payload,destination_en:bad}}));checks++}
 for(const role of ['anon','authenticated','service_role']){
  eq(sql(`SELECT has_table_privilege(${lit(role)},'twuanis_canonical_private.campaigns','INSERT,UPDATE,DELETE,TRUNCATE')`),'f',role+' direct mutation denied');
 }
 denied(owner,`SELECT public.resolve_owned_campaigns(NULL,ARRAY['homepage'],'en',true)`);
 denied(owner,`SELECT public.admin_campaign_command('${crypto.randomUUID()}','{}')`,'aal1',0,'service_role');
 for(const audience of ['AUTHENTICATED','UNAUTHENTICATED']){
  const a=cmd({...base,configuration:{...base.configuration,name:audience,surfaces:['market-hub'],audience}});cmd({operation:'schedule',id:a.id,expected:'1'});
  eq(resolve(null,['market-hub'],audience==='AUTHENTICATED').items.length,1,'audience positive '+audience);
  if(audience==='AUTHENTICATED')eq(resolve(null,['market-hub'],false).items.length,0,'anonymous cannot receive authenticated creative');
 }
 const future=cmd({...base,configuration:{...base.configuration,surfaces:['banner'],startsAt:'2098-01-01T00:00:00Z'}});cmd({operation:'schedule',id:future.id,expected:'1'});eq(resolve(null,['banner']).items.length,0,'future window withheld');
 const ext=cmd({...base,configuration:{...base.configuration,surfaces:[],external:['FACEBOOK','INSTAGRAM','GOOGLE'].map(channel=>({channel,provenance:'reference',externalId:'fixture',audience:'external description',status:'planned',reference:'manual reference'}))}});ok(ext.id,'three external channels; no API');
 const race=cmd(base),raceq=`SELECT public.admin_campaign_command(${lit(crypto.randomUUID())},${lit(JSON.stringify({operation:'schedule',id:race.id,expected:'1'}))})`;
 const first=child(authSQL(owner,`SELECT pg_advisory_xact_lock(3110,1);SELECT 'LOCK_READY';SELECT pg_sleep(.3);${raceq}`));await first.ready;
 const concurrent=child(authSQL(owner,`SELECT public.admin_campaign_command(${lit(crypto.randomUUID())},${lit(JSON.stringify({operation:'end',id:race.id,expected:'1'}))})`));
 const results=await Promise.all([first.result,concurrent.result]);eq(results.filter(x=>x.code===0).length,1,'schedule/end stale race exactly one success');
 const same=crypto.randomUUID(),q=`SELECT public.admin_campaign_command(${lit(same)},${lit(JSON.stringify(base))})`;
 const duplicate=await Promise.all([child(authSQL(owner,q)).result,child(authSQL(owner,q)).result]);ok(duplicate.every(x=>x.code===0),'same request concurrent retry succeeds');eq(sql(`SELECT count(*) FROM twuanis_canonical_private.administrative_receipts WHERE request_id=${lit(same)}`),'1','one race receipt');
 const before=sql('SELECT count(*) FROM twuanis_canonical_private.campaigns');sql(`CREATE FUNCTION public.fail_campaign_audit() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'fixture failure';END$$;CREATE TRIGGER fail_campaign_audit BEFORE INSERT ON twuanis_canonical_private.administrative_events FOR EACH ROW EXECUTE FUNCTION public.fail_campaign_audit()`);
 assert.throws(()=>cmd(base));checks++;eq(sql('SELECT count(*) FROM twuanis_canonical_private.campaigns'),before,'audit failure rolls back creation');sql('DROP TRIGGER fail_campaign_audit ON twuanis_canonical_private.administrative_events');
 eq(sql("SELECT count(*) FROM twuanis_canonical_private.intelligence_capabilities"),'17','no second engine registry');
 eq(sql("SELECT amount FROM twuanis_canonical_private.addon_standard_prices WHERE configuration_id='05000000-0000-4000-8000-000000000001' AND currency='USD'"),'12','standard Add-on price untouched');


 sql(`GRANT USAGE ON SCHEMA storage TO anon,authenticated;GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;CREATE POLICY fixture_broad_policy ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);`);
 for(const role of ['anon','authenticated'])denied(user,"INSERT INTO storage.objects VALUES('campaign-media','forged','{}')",'aal1',0,role);
 assert.throws(()=>sql(`UPDATE twuanis_canonical_private.campaigns SET target_class='FEATURE' WHERE id=${lit(c.id)}`));checks++;
 assert.throws(()=>resolve(null,['homepage','homepage']));checks++;
 // Target availability, history attribution, media preparation and ACL proof.
 const offer=JSON.parse(run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'create',targetType:'addon',targetId:'addon-featured-listing',name_en:'Offer',name_es:'Oferta',startsAt:'2020-01-01T00:00:00Z',endsAt:'2099-01-01T00:00:00Z',prices:{USD:'3'}}))})`));
 const ad=cmd({...base,targetClass:'OFFER',targetId:offer.offerId,configuration:{...base.configuration,surfaces:['package']}});cmd({operation:'schedule',id:ad.id,expected:'1'});
 eq(resolve(null,['package']).items.length,0,'draft Offer cannot be advertised as applicable');
 run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'schedule',id:offer.offerId,expected:'1'}))})`);
 eq(resolve(null,['package']).items.length,1,'active Offer campaign eligible');
 run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'end',id:offer.offerId,expected:'2'}))})`);
 eq(resolve(null,['package']).items.length,0,'ended Offer campaign withheld independently');
 const ranked=cmd({...base,configuration:{...base.configuration,name:'High priority',surfaces:['banner'],priority:500}});cmd({operation:'schedule',id:ranked.id,expected:'1'});
 const low=cmd({...base,configuration:{...base.configuration,name:'Low priority',surfaces:['banner'],priority:2}});cmd({operation:'schedule',id:low.id,expected:'1'});
 let rankResult=resolve(null,['banner']);eq(sql(`SELECT campaign_id FROM twuanis_canonical_private.campaign_deliveries WHERE token=${lit(rankResult.items[0].token)}`),ranked.id,'higher priority selected');
 const tie=cmd({...base,configuration:{...base.configuration,surfaces:['banner'],priority:500}});cmd({operation:'schedule',id:tie.id,expected:'1'});
 rankResult=resolve(null,['banner']);eq(sql(`SELECT campaign_id FROM twuanis_canonical_private.campaign_deliveries WHERE token=${lit(rankResult.items[0].token)}`),[ranked.id,tie.id].sort()[0],'stable UUID tie');
 cmd({operation:'end',id:c.id,expected:'4'});cmd({operation:'archive',id:c.id,expected:'5',reason:'Fixture archived'});eq(get(c.id).state,'archived','end/archive');
 eq(sql(`SELECT count(*) FROM twuanis_canonical_private.campaign_counts WHERE configuration_id IN (SELECT id FROM twuanis_canonical_private.campaign_configurations WHERE campaign_id=${lit(c.id)})`),'1','historical counts preserved after archive');
 const mr=crypto.randomUUID(),sha='a'.repeat(64),mediaQ=`SELECT public.admin_campaign_media(${lit(mr)},'image/jpeg',100,${lit(sha)})`;
 const media=JSON.parse(run(owner,mediaQ));eq(JSON.parse(run(owner,mediaQ)).id,media.id,'media retry identity stable');
 assert.throws(()=>run(owner,`SELECT public.admin_campaign_media(${lit(mr)},'image/jpeg',101,${lit(sha)})`));checks++;
 assert.throws(()=>run(owner,`SELECT public.admin_campaign_media_complete(${lit(mr)})`));checks++;
 sql(`INSERT INTO storage.objects VALUES('campaign-media',${lit(media.path)},'${JSON.stringify({size:100,mimetype:'image/jpeg'})}')`);
 run(owner,`SELECT public.admin_campaign_media_complete(${lit(mr)})`);eq(JSON.parse(run(owner,`SELECT public.admin_campaign_media_complete(${lit(mr)})`)).id,media.id,'completed media replay stable');
 ok(cmd({operation:'creative.create',creative:{...payload,image:media.id,alt_en:'System image',alt_es:'Imagen del sistema'}}).id,'managed media accepted');
 assert.throws(()=>cmd({operation:'creative.create',creative:{...payload,image:media.id}}));checks++;
 assert.throws(()=>cmd({operation:'creative.create',creative:{...payload,image:'https://external.example/image.jpg'}}));checks++;
 assert.throws(()=>run(owner,`SELECT public.admin_campaign_media('${crypto.randomUUID()}','image/jpeg',614401,${lit(sha)})`));checks++;
 assert.throws(()=>run(owner,`SELECT public.admin_campaign_media('${crypto.randomUUID()}','text/html',100,${lit(sha)})`));checks++;

 const vr=crypto.randomUUID(),video=JSON.parse(run(owner,`SELECT public.admin_campaign_media('${vr}','video/mp4',12,${lit(sha)})`));
 sql(`INSERT INTO storage.objects VALUES('campaign-media',${lit(video.path)},'{"size":12,"mimetype":"video/mp4"}')`);run(owner,`SELECT public.admin_campaign_media_complete('${vr}')`);
 const vc=cmd({operation:'creative.create',creative:{...payload,video:video.id,alt_en:'Campaign video',alt_es:'Video de campaña'}});
 const vv=sql(`SELECT current_version_id FROM twuanis_canonical_private.campaign_creatives WHERE id=${lit(vc.id)}`);
 ok(cmd({...base,configuration:{...base.configuration,creativeVersion:vv}}).id,'video compatible banner');
 assert.throws(()=>cmd({...base,configuration:{...base.configuration,creativeVersion:vv,surfaces:['popup']}}));checks++;
 eq(JSON.parse(run(owner,"SELECT public.admin_campaign_options('FEATURE')")).length,0,'Feature not selectable');
 eq(JSON.parse(run(owner,"SELECT public.admin_campaign_options('ENGINE')")).length,17,'17 Engine choices only');
 const funcs=JSON.parse(sql(`SELECT json_agg(json_build_object('name',p.proname,'config',p.proconfig,'owner',pg_get_userbyid(p.proowner),'public',EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner)))a WHERE a.grantee=0 AND a.privilege_type='EXECUTE'))) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','twuanis_canonical_private') AND (p.proname LIKE '%campaign%' OR p.proname='resolve_owned_campaigns') AND p.proname<>'fail_campaign_audit'`));
 for(const f of funcs){ok(f.owner==='postgres'&&f.config?.includes('search_path=pg_catalog')&&!f.public,'fixed function security '+f.name)}
 const freq=cmd({...base,configuration:{...base.configuration,surfaces:['popup'],frequency:1}});cmd({operation:'schedule',id:freq.id,expected:'1'});
 const session=resolve(null,[]).session;
 const fq=`SELECT public.resolve_owned_campaigns(${lit(session)},ARRAY['popup'],'en',false)`;
 const raceFreq=await Promise.all([child(authSQL(owner,fq,'aal1',0,'service_role')).result,child(authSQL(owner,fq,'aal1',0,'service_role')).result]);
 ok(raceFreq.every(x=>x.code===0),'concurrent delivery requests succeed');eq(sql(`SELECT count(*) FROM twuanis_canonical_private.campaign_deliveries WHERE session_id=${lit(session)}`),'1','concurrent cap cannot oversubscribe');
 console.log(JSON.stringify({status:'PASS',checks,concurrencyCases:3,scope:'socket-only disposable PostgreSQL; no production'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}}
main().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
