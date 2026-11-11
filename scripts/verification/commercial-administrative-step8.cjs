'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step8-orders-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
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

 sql(file('supabase/migrations/039_order_commercial_terms.sql'));
 const pkg='pkg-geographic-distribution-price-range',bulk='addon-bulk-listing-import';
 const order=(kind,product,listing=null,job=null,request=crypto.randomUUID(),who=customer)=>JSON.parse(sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${who}','${request}',${lit(kind)},${lit(product)},'USD',${listing?lit(listing):'NULL'},${job?lit(job):'NULL'})`));
 const read=id=>JSON.parse(run(owner,`SELECT public.admin_order_read(${id?lit(id):'NULL'})`));
 const rejects=(f,label)=>{assert.throws(f,undefined,label);n++};
 const a=order('package',pkg),original=read(a.id);
 ok(a.terms.orderContractVersion===1,'canonical contract on existing identity');ok(a.terms.productClass==='PACKAGE','package class');ok(a.terms.terms.unit==='month'&&a.terms.terms.capabilities.length===3,'purchased access and capabilities');
 ok(a.terms.standardTotal==='10'&&a.terms.total==='10','standard exact price');ok(Date.parse(a.paymentDeadline)-Date.parse(a.createdAt)===86400000,'24 hours');
 sql(`UPDATE twuanis_canonical_private.intelligence_package_prices SET amount=11 WHERE package_id='${pkg}' AND currency='USD'`);
 ok(read(a.id).terms.total==='10','standard edit cannot rewrite original');ok(order('package',pkg).terms.total==='11','new order current standard');
 const request=crypto.randomUUID(),idempotent=order('package',pkg,null,null,request);
 ok(order('package',pkg,null,null,request).id===idempotent.id,'stable retry');rejects(()=>order('addon','addon-2026-founding-membership',null,null,request),'changed payload conflict');
 const founder=order('addon','addon-2026-founding-membership');ok(founder.terms.productClass==='FOUNDING_MEMBERSHIP'&&founder.terms.total==='500'&&founder.terms.terms.kind==='lifetime','founding terms');
 const offer=body=>JSON.parse(run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify(body))})`));
 const off=offer({operation:'create',targetType:'package',targetId:pkg,name_en:'Test',name_es:'Prueba',startsAt:'2020-01-01T00:00:00Z',endsAt:'2090-01-01T00:00:00Z',prices:{USD:'1'}});offer({operation:'schedule',id:off.offerId,expected:'1'});
 const offerOrder=order('package',pkg);ok(offerOrder.terms.source==='OFFER'&&offerOrder.terms.offerVersion==='1'&&offerOrder.terms.total==='1','explicit Offer provenance');offer({operation:'end',id:off.offerId,expected:'2'});ok(read(offerOrder.id).terms.total==='1','Offer end preserves price');
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 const job=()=>JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify([input,input]))})`)).jobId;
 const j=job(),b=order('addon',bulk,null,j);ok(b.terms.quantity===2&&b.terms.total==='1.00','server accepted quantity and exact whole-job total');ok(b.terms.standardTier.lower===1&&b.terms.purchasedTier.upper===25,'tier evidence');ok(b.terms.acceptedJob.id===j&&b.terms.targetId===j,'job not order identity');
 rejects(()=>order('addon',bulk,null,j),'pending job blocks new request');rejects(()=>order('addon',bulk,null,j,crypto.randomUUID(),owner),'customer ownership');
 const pay=crypto.randomUUID();sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${b.id}','${crypto.randomUUID()}','fixture','${pay}',1,'USD','local trusted')`);
 ok(read(b.id).state==='paid'&&read(b.id).payment.eventId===pay&&read(b.id).fulfillment===null,'paid distinct from fulfilled');rejects(()=>order('addon',bulk,null,j),'paid unfulfilled job blocks');
 sql(`SELECT twuanis_canonical_private.fulfill_addon('${b.id}','${pay}','${customer}','${bulk}','${b.terms.configurationId}','operation','${j}','{"currency":"USD","amount":"1.00"}')`);
 ok(read(b.id).fulfillment.purchaseId===b.id,'linked actual fulfillment');rejects(()=>order('addon',bulk,null,j),'fulfilled job blocks');
 const listing=sql(`SELECT id FROM listings WHERE owner_id='${customer}' ORDER BY id LIMIT 1`),la=order('addon','addon-featured-listing',listing);
 ok(la.terms.terms.durationDays===60&&la.terms.targetId===listing,'listing duration target');rejects(()=>order('addon','addon-listing-boost',listing),'pending cross-product block');
 const lp=crypto.randomUUID();sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${la.id}','${crypto.randomUUID()}','fixture','${lp}',12,'USD','local trusted')`);rejects(()=>order('addon','addon-featured-listing',listing),'paid unfulfilled listing blocks');
 sql(`SELECT twuanis_canonical_private.fulfill_addon('${la.id}','${lp}','${customer}','addon-featured-listing','${la.terms.configurationId}','listing','${listing}','{"currency":"USD","amount":"12"}')`);
 const renewal=order('addon','addon-featured-listing',listing);ok(renewal.id!==la.id,'same product renewal allowed');rejects(()=>order('addon','addon-listing-boost',listing),'different product still blocked');
 // Explicit historical fixtures; never disable immutable guards or alter created Orders.
 const j2=job(),expired=crypto.randomUUID(),expiredRequest=crypto.randomUUID();
 sql(`INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${expired}',account_id,'${expiredRequest}',target_type,product_id,NULL,'${j2}',currency,resolved_terms,clock_timestamp()-interval '2 days',clock_timestamp()-interval '1 day' FROM twuanis_canonical_private.offer_order_snapshots WHERE false`);
 sql(`WITH at AS (SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${expired}',account_id,'${expiredRequest}',target_type,product_id,NULL,'${j2}',currency,resolved_terms,at.t,at.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN at WHERE id='${b.id}'`);
 ok(read(expired).state==='expired','derived expiry');ok(order('addon',bulk,null,j2,expiredRequest).id===expired,'expired identical replay original');
 const replacement=order('addon',bulk,null,j2);ok(replacement.id!==expired,'expired unpaid permits new current order');ok(read(expired).id===expired,'expired history preserved');
 rejects(()=>sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${expired}','${crypto.randomUUID()}','fixture','${crypto.randomUUID()}',1,'USD','local')`),'late payment cannot revive');
 for(const table of ['offer_order_snapshots','offer_paid_acknowledgements'])rejects(()=>sql(`UPDATE twuanis_canonical_private.${table} SET id=id`),'immutable '+table);
 for(const role of ['anon','authenticated','service_role']){ok(sql(`SELECT has_function_privilege('${role}','twuanis_canonical_private.create_offer_order_snapshot(uuid,uuid,text,text,text,uuid,uuid)','EXECUTE')`)==='f','no runtime creation '+role);ok(sql(`SELECT has_table_privilege('${role}','twuanis_canonical_private.offer_order_snapshots','INSERT,UPDATE,DELETE,TRUNCATE')`)==='f','no direct mutation '+role)}
 rejects(()=>run(customer,'SELECT public.admin_order_read()'),'ordinary customer denied');ok(read(a.id).accountId===customer,'authorized admin account identity');
 for(let i=0;i<27;i++)order('package',pkg);const page=read();ok(page.length===26,'bounded list');const next=JSON.parse(run(owner,`SELECT public.admin_order_read(NULL,'${page[24].id}')`));ok(next.every(x=>x.id>page[24].id),'keyset continuation');ok(JSON.parse(run(owner,`SELECT public.admin_order_read(NULL,NULL,NULL,'package','OFFER','USD')`)).every(x=>x.source==='OFFER'),'filters');
 // Independent actual database sessions; no JS-only race mocks.
 function parallel(q){return new Promise(resolve=>{const p=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55456','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('close',code=>resolve({code,out,err}));p.stdin.end(q)})}
 const oq=(rid,jid=null)=>`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${rid}','${jid?'addon':'package'}','${jid?bulk:pkg}','USD',NULL,${jid?lit(jid):'NULL'})`;
 const req=crypto.randomUUID();let race=await Promise.all([parallel(oq(req)),parallel(oq(req))]);ok(race.every(x=>x.code===0)&&new Set(race.map(x=>JSON.parse(x.out).id)).size===1,'concurrent identical retry');
 const j3=job();race=await Promise.all([parallel(oq(crypto.randomUUID(),j3)),parallel(oq(crypto.randomUUID(),j3))]);ok(race.filter(x=>x.code===0).length===1,'Bulk distinct requests one in flight');
 const off2=offer({operation:'create',targetType:'package',targetId:pkg,name_en:'Wait',name_es:'Espera',startsAt:'2020-01-01T00:00:00Z',endsAt:new Date(Date.now()+2500).toISOString(),prices:{USD:'2'}});offer({operation:'schedule',id:off2.offerId,expected:'1'});
 const lock=parallel(`BEGIN;SELECT pg_advisory_xact_lock(3161,hashtext('package:${pkg}'));SELECT pg_sleep(3);COMMIT;`);const limit=Date.now()+2000;while(sql("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=3161 AND granted")!=='1'){if(Date.now()>limit)throw Error('lock unavailable');await new Promise(r=>setTimeout(r,20))}
 const result=await parallel(oq(crypto.randomUUID()));await lock;ok(result.code===0&&JSON.parse(result.out).terms.source==='STANDARD','Offer expiry after lock wait');

 // Configuration changes never alter a purchased access term/capability set.
 const priorTerms=read(a.id).terms;
 const newConfig=crypto.randomUUID();
 sql(`BEGIN;INSERT INTO twuanis_canonical_private.intelligence_package_configurations(id,package_id,version,term_quantity,term_unit,capabilities) SELECT '${newConfig}',package_id,version+1,2,term_unit,capabilities FROM twuanis_canonical_private.intelligence_package_configurations WHERE id='${a.terms.configurationId}';UPDATE twuanis_canonical_private.intelligence_packages SET current_configuration_id='${newConfig}' WHERE id='${pkg}';COMMIT;`);
 ok(JSON.stringify(read(a.id).terms)===JSON.stringify(priorTerms),'current configuration cannot rewrite complete snapshot');ok(order('package',pkg).terms.terms.quantity===2,'new order current access term');
 for(const cur of ['EUR','CRC']){
  if(cur==='CRC')rejects(()=>sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-2026-founding-membership','CRC')`),'Founder CRC unpriced');
  else rejects(()=>sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','package','${pkg}','EUR')`),'unsupported currency');
 }
 rejects(()=>order('addon','addon-premium-listing-template',listing),'unavailable product');
 // A new Offer applies only to the replacement of an expired unpaid Bulk Order.
 const jb=job(),old=crypto.randomUUID();sql(`WITH at AS(SELECT clock_timestamp()-interval '2 days' t) INSERT INTO twuanis_canonical_private.offer_order_snapshots SELECT '${old}',account_id,'${crypto.randomUUID()}',target_type,product_id,NULL,'${jb}',currency,resolved_terms,at.t,at.t+interval '24 hours' FROM twuanis_canonical_private.offer_order_snapshots CROSS JOIN at WHERE id='${b.id}'`);
 const bo=offer({operation:'create',targetType:'addon',targetId:bulk,name_en:'Bulk',name_es:'Importación',startsAt:'2020-01-01T00:00:00Z',endsAt:'2090-01-01T00:00:00Z',tiers:[{min:1,max:25,unitRate:'0.25',currency:'USD'},{min:26,max:100,unitRate:'0.12',currency:'USD'},{min:101,max:500,unitRate:'0.05',currency:'USD'}]});
 offer({operation:'schedule',id:bo.offerId,expected:'1'});const fresh=order('addon',bulk,null,jb);ok(fresh.terms.total==='0.50'&&fresh.terms.purchasedTier.unitRate==='0.25','expired replacement resolves fresh Offer tier');ok(read(old).terms.total==='1.00','expired price unchanged');
 // Paid acknowledgement replay, exact currency and amount remain independent.
 const pr=crypto.randomUUID(),pe=crypto.randomUUID(),aq=`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${fresh.id}','${pr}','fixture','${pe}',0.50,'USD','local')`;
 const ack=JSON.parse(sql(aq));ok(JSON.parse(sql(aq)).id===ack.id,'paid acknowledgement idempotent');rejects(()=>sql(aq.replace("0.50,'USD'","0.51,'USD'")),'changed payment payload fails');
 // Same active-right renewal race: one new unpaid Order, not two.
 const listing2=sql(`SELECT id FROM listings WHERE owner_id='${customer}' AND id<>'${listing}' LIMIT 1`),initial=order('addon','addon-featured-listing',listing2),pv=crypto.randomUUID();
 sql(`SELECT twuanis_canonical_private.acknowledge_offer_order_paid('${initial.id}','${crypto.randomUUID()}','fixture','${pv}',12,'USD','local');SELECT twuanis_canonical_private.fulfill_addon('${initial.id}','${pv}','${customer}','addon-featured-listing','${initial.terms.configurationId}','listing','${listing2}','{"currency":"USD","amount":"12"}')`);
 const lq=()=>`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','addon','addon-featured-listing','USD','${listing2}')`;
 race=await Promise.all([parallel(lq()),parallel(lq())]);ok(race.filter(x=>x.code===0).length===1,'same-product renewal race one valid order');
 ok(sql('SELECT capacity FROM twuanis_canonical_private.addon_homepage_capacity')==='10','Homepage capacity unchanged');ok(sql('SELECT count(*) FROM twuanis_canonical_private.addon_founder_rights')==='0','Founder Order issued no right');ok(sql('SELECT count(*) FROM twuanis_canonical_private.intelligence_package_rights')==='0','Package Order issued no right');
 for(const role of ['anon','service_role'])ok(sql(`SELECT has_function_privilege('${role}','public.admin_order_read(uuid,uuid,uuid,text,text,text)','EXECUTE')`)==='f','Admin read unavailable to '+role);
 ok(sql("SELECT proconfig=ARRAY['search_path=pg_catalog'] FROM pg_proc WHERE oid='public.admin_order_read(uuid,uuid,uuid,text,text,text)'::regprocedure")==='t','safe path');
 // Failed creation is atomic; a rolled-back commitment leaves no commercial evidence.
 const countBefore=sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots');
 rejects(()=>sql(`SELECT twuanis_canonical_private.create_offer_order_snapshot('${customer}','${crypto.randomUUID()}','package','${pkg}','EUR')`),'invalid creation rollback');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots')===countBefore,'failure leaves no Order');
 const rollbackRequest=crypto.randomUUID();sql(`BEGIN;${oq(rollbackRequest)};ROLLBACK;`);
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots WHERE request_id='${rollbackRequest}'`)==='0','transaction rollback leaves no Order');
 console.log(JSON.stringify({status:'PASS',checks:n,concurrencyCases:4,scope:'socket-only disposable; no production'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
