'use strict';
// Owned socket-only fixture. No .env, network, storage, or production access.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/step11-commerce-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,n=0;
const owner='d81064bc-1b4a-478f-8f6a-b263c4779bc1',customer='07000000-0000-0000-0000-000000000001';
const lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55462','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],q).trim();
const file=p=>fs.readFileSync(root+'/'+p,'utf8');
function run(who,q){return sql(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:who,role:'authenticated',aal:'aal1'}))},true);${q};COMMIT;`).split('\n').at(-1)}
function command(who,c,id=crypto.randomUUID()){return JSON.parse(run(who,`SELECT public.admin_listing_command(${lit(id)},${lit(JSON.stringify(c))})`))}
function ok(v,label){assert.ok(v,label);n++}
(async()=>{try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55462 -c listen_addresses=`,'start']);started=true;
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
 // Reproduce the actual production legacy boundary before applying040.
 sql(`ALTER TABLE public.sinpe_payments ALTER COLUMN payment_date SET NOT NULL;
 ALTER TABLE public.sinpe_payments ADD CONSTRAINT sinpe_payments_commercial_relationship CHECK(purchase_request_id IS NOT NULL OR subscription_id IS NOT NULL);
 CREATE FUNCTION public.validate_sinpe_payment_subscription() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.user_subscriptions us WHERE us.id=NEW.subscription_id AND us.user_id=NEW.user_id) THEN RAISE EXCEPTION 'The subscription does not belong to the specified user.';END IF;RETURN NEW;END$$;
 CREATE TRIGGER validate_sinpe_payment_subscription BEFORE INSERT OR UPDATE OF user_id,subscription_id ON public.sinpe_payments FOR EACH ROW EXECUTE FUNCTION public.validate_sinpe_payment_subscription();`);
 const legacySubscription=sql(`SELECT id FROM public.user_subscriptions WHERE user_id='${customer}' LIMIT 1`);
 const legacyId=crypto.randomUUID();sql(`INSERT INTO public.sinpe_payments(id,user_id,subscription_id,payment_date) VALUES('${legacyId}','${customer}','${legacySubscription}','2026-01-01T00:00:00Z')`);
 const legacyBefore=sql(`SELECT row_to_json(p) FROM public.sinpe_payments p WHERE id='${legacyId}'`);
 sql(file('supabase/migrations/040_sinpe_order_payment.sql'));

 for(const f of ['041_entitlement_source_terms.sql','042_entitlement_fulfillment.sql','043_entitlement_administration.sql'])sql(file('supabase/migrations/'+f));

 const rejects=(f,label)=>{assert.throws(f,undefined,label);n++};
 sql(`ALTER TABLE public.entitlements ADD COLUMN is_active boolean DEFAULT true;ALTER TABLE public.package_entitlements ADD COLUMN boolean_value boolean DEFAULT false;`);
 for(const f of ['044_legacy_package_access_transition.sql','045_prepublication_addon_orders.sql','046_customer_commercial_boundary.sql'])sql(file('supabase/migrations/'+f));
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:'850'},construction_area:{value:'70'}},money:{amount:'1',currency:'USD'}};
 sql('UPDATE public.package_limits SET listing_limit=NULL');
 const createDraft=()=>command(owner,{operation:'create',origin:'customer',customer,input}).listing_id;
 const listing=createDraft();ok(!!listing,'canonical durable draft exists');
 const featured='addon-featured-listing',home='addon-homepage-exposure',pkg='pkg-geographic-distribution-price-range';
 const purchase=(product,id,request=crypto.randomUUID(),currency='USD')=>JSON.parse(run(customer,`SELECT public.create_customer_order('${request}','${id?'addon':'package'}','${product}','${currency}',${id?lit(id):'NULL'})`));
 rejects(()=>purchase(featured,listing),'intake disabled by default');
 sql('UPDATE twuanis_canonical_private.customer_commerce_control SET enabled=true');
 rejects(()=>purchase(featured,listing),'no configured channel fails closed');
 const bank=crypto.randomUUID(),crc=crypto.randomUUID();sql(`INSERT INTO twuanis_canonical_private.sinpe_receiving_accounts(id,currency,instructions_en,instructions_es,enabled)VALUES('${bank}','USD','Disposable USD fixture','Prueba USD desechable',true),('${crc}','CRC','Disposable CRC fixture','Prueba CRC desechable',true)`);
 const options=()=>JSON.parse(run(customer,`SELECT public.read_listing_addon_acquisition('${listing}','USD')`));ok(options().products.length===5,'bounded five listing Add-ons');
 const request=crypto.randomUUID(),o=purchase(featured,listing,request);ok(purchase(featured,listing,request).id===o.id,'Order retry exact identity');
 ok(sql(`SELECT listing_status FROM public.listings WHERE id='${listing}'`)==='draft','Order does not publish');
 rejects(()=>purchase(home,listing),'pending Order blocks competing Add-on');ok(options().products.every(p=>!p.available)&&options().order===o.id,'availability reflects pending acquisition');
 const pay=(order,bankId=bank,currency='USD')=>{const total=sql(`SELECT resolved_terms->>'total' FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${order.id}'`);const req=crypto.randomUUID();const attempt=run(customer,`SELECT public.submit_order_sinpe('${order.id}','${req}','${bankId}','{"reference":"customer claim","senderName":"fixture"}')`);ok(run(customer,`SELECT public.submit_order_sinpe('${order.id}','${req}','${bankId}','{"reference":"customer claim","senderName":"fixture"}')`)===attempt,'payment evidence replay');run(owner,`SELECT public.review_order_sinpe('${attempt}','${crypto.randomUUID()}',${lit(JSON.stringify({disposition:'APPROVED',reason:'verified',receivingAccount:bankId,bankReference:crypto.randomUUID(),amount:total,currency,receivedAt:new Date().toISOString(),bankEvidence:'Owned disposable fixture only'}))})`);return attempt};
 const fulfill=(o,req=crypto.randomUUID())=>JSON.parse(run(owner,`SELECT public.retry_sinpe_fulfillment('${o.id}','${req}')`));
 const attempt=pay(o),pending=fulfill(o);ok(pending.state==='PENDING'&&pending.reason==='awaiting_publication','paid draft awaiting publication');
 ok(fulfill(o).state==='PENDING','repeated unpublished fulfillment remains pending');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${o.id}'`)==='0','no duration/source term');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.addon_placement_rights WHERE listing_id='${listing}'`)==='0','no placement');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${o.id}'`)==='1','payment remains approved');
 rejects(()=>purchase(home,listing),'paid unfulfilled hold');
 const customerView=JSON.parse(run(customer,`SELECT public.read_customer_commercial('orders',NULL,'${o.id}')`));ok(customerView[0].paid&&customerView[0].awaitingPublication&&!customerView[0].fulfilled,'safe customer awaiting publication projection');
 const publish=id=>run(customer,`SELECT public.publish_customer_canonical_listing('${id}',(SELECT canonical_revision FROM public.listings WHERE id='${id}'),'${crypto.randomUUID()}','publish')`);
 publish(listing);ok(sql(`SELECT listing_status FROM public.listings WHERE id='${listing}'`)==='active','ordinary canonical publication independent');
 const begins=sql('SELECT clock_timestamp()'),success=fulfill(o);ok(success.state==='COMPLETE','published paid draft fulfills');
 const term=JSON.parse(sql(`SELECT row_to_json(t) FROM twuanis_canonical_private.entitlement_terms t WHERE order_id='${o.id}'`));ok(Date.parse(term.starts_at)>=Date.parse(begins),'term starts at successful fulfillment');ok(Date.parse(term.ends_at)-Date.parse(term.starts_at)===60*86400000,'full pinned Featured sixty days');ok(fulfill(o).evidence.termId===success.evidence.termId,'successful retry same term');
 const unpaidListing=createDraft(),unpaid=purchase(featured,unpaidListing);publish(unpaidListing);ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${unpaid.id}'`)==='0','unpaid publishes without benefit');
 const declined=createDraft(),before=sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots');publish(declined);ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots')===before,'decline has zero commerce');
 const hListing=createDraft(),hOrder=purchase(home,hListing);pay(hOrder);ok(fulfill(hOrder).state==='PENDING','Homepage waits for publication');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE listing_id='${hListing}'`)==='0','no Homepage reservation for unpaid-publication target');
 const hc=sql(`SELECT current_configuration_id FROM twuanis_canonical_private.addon_products WHERE id='${home}'`);
 for(let i=0;i<10;i++){const id=createDraft();publish(id);run(owner,`SELECT public.admin_entitlement_command('${crypto.randomUUID()}',${lit(JSON.stringify({operation:'grant',confirmed:true,accountId:customer,productClass:'LISTING_ADDON',productId:home,configurationId:hc,listingId:id,startMode:'immediate',durationDays:'14',reason:'CUSTOMER_SERVICE'}))})`)}
 const capView=JSON.parse(run(customer,`SELECT public.read_listing_addon_acquisition('${declined}','USD')`));ok(capView.products.find(p=>p.id===home).reason==='capacity_unavailable','availability includes authoritative interval capacity');
 publish(hListing);ok(fulfill(hOrder).state==='FAILED','capacity rechecked after publication');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.entitlement_terms WHERE order_id='${hOrder.id}'`)==='0','failed capacity creates no right');ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_paid_acknowledgements WHERE order_id='${hOrder.id}'`)==='1','capacity failure preserves financial truth');
 const cp=purchase(pkg,null,crypto.randomUUID(),'CRC');pay(cp,crc,'CRC');ok(fulfill(cp).state==='COMPLETE','CRC Package flow through customer boundary');
 ok(run(customer,"SELECT public.current_account_has_capability('cap-market-summary')")==='t','purchased Package authorizes');
 const other=crypto.randomUUID();sql(`INSERT INTO auth.users(id)VALUES('${other}')`);
 ok(JSON.parse(run(other,`SELECT public.read_customer_commercial('orders',NULL,'${o.id}')`)).length===0,'Order account isolation');
 rejects(()=>run(other,`SELECT public.create_customer_order('${crypto.randomUUID()}','addon','${featured}','USD','${listing}')`),'other owner acquisition denied');
 rejects(()=>run(other,`SELECT public.read_order_sinpe('${o.id}')`),'other account payment detail denied');
 rejects(()=>run(customer,`SELECT public.retry_sinpe_fulfillment('${o.id}','${crypto.randomUUID()}')`),'customer cannot fulfill');
 const projection=JSON.stringify(JSON.parse(run(customer,"SELECT public.read_customer_commercial('payments')")));ok(!['bankReference','receivingAccount','actorId','bankEvidence','requestId'].some(k=>projection.includes(k)),'no forensic payment leakage');
 for(let i=0;i<27;i++)purchase(pkg,null);ok(JSON.parse(run(customer,"SELECT public.read_customer_commercial('orders')")).length===26,'bounded lookahead page');
 for(const area of ['rights','orders','payments','listings','legacy'])ok(JSON.parse(run(customer,`SELECT public.read_customer_commercial('${area}')`)).length<=26,'bounded '+area);
 rejects(()=>run(customer,"SELECT public.read_customer_commercial('unknown')"),'unknown area denied');
 for(const role of ['anon','service_role'])ok(sql(`SELECT NOT has_function_privilege('${role}','public.create_customer_order(uuid,text,text,text,uuid)','EXECUTE')`)==='t','intake denied '+role);

 const parallel=q=>new Promise(resolve=>{const child=spawn(pg+'/psql',['-X','-qAt','-h',socket,'-p','55462','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{env});let out='',err='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);child.on('close',code=>resolve({code,out:out.trim().split('\n').at(-1),err}));child.stdin.end(`BEGIN;SET LOCAL ROLE authenticated;SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:customer,role:'authenticated'}))},true);${q};COMMIT;`)});
 const concurrentListing=createDraft(),sameRequest=crypto.randomUUID();
 const raceSql=req=>`SELECT public.create_customer_order('${req}','addon','${featured}','USD','${concurrentListing}')`;
 let races=await Promise.all([parallel(raceSql(sameRequest)),parallel(raceSql(sameRequest))]);
 ok(races.every(x=>x.code===0)&&JSON.parse(races[0].out).id===JSON.parse(races[1].out).id,'independent-session identical intake returns one Order');
 const competingListing=createDraft();races=await Promise.all([parallel(`SELECT public.create_customer_order('${crypto.randomUUID()}','addon','${featured}','USD','${competingListing}')`),parallel(`SELECT public.create_customer_order('${crypto.randomUUID()}','addon','${home}','USD','${competingListing}')`)]);
 ok(races.filter(x=>x.code===0).length===1,'independent-session competing intake has one winner');
 ok(sql(`SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots WHERE listing_id='${competingListing}'`)==='1','one in-flight acquisition transactionally');
 const catalog=JSON.parse(sql('SELECT public.read_customer_package_catalog()'));
 ok(catalog.length===3&&catalog.every(x=>x.capabilityLabels.length===x.capabilities.length),'bounded Package capability labels from canonical registry');
 for(const role of ['anon','authenticated','service_role'])for(const table of ['customer_commerce_control','offer_order_snapshots'])ok(sql(`SELECT NOT has_table_privilege('${role}','twuanis_canonical_private.${table}','INSERT,UPDATE,DELETE,TRUNCATE')`)==='t','no direct mutation '+role+' '+table);
 const vm=require('vm'),ts=require(root+'/node_modules/typescript'),token=crypto.randomUUID();
 const snapshot={images:[],temporary_images:[]};
 sql(`INSERT INTO public.listing_publish_tokens(token,phone,listing_data)VALUES('${token}','+50600000000',${lit(JSON.stringify(snapshot))})`);
 const tokenPlan=JSON.parse(sql(`SELECT public.prepare_token_canonical_listing('${token}','${customer}',${lit(JSON.stringify(snapshot))},${lit(JSON.stringify(input))})`));
 let publicationCalls=0;
 const admin={rpc:async(name,args)=>({data:JSON.parse(sql(`SELECT public.${name}(${lit(args.p_token)},${lit(args.p_owner)})`))}),storage:{from:()=>({})}};
 const userDb={rpc:async(name,args)=>{publicationCalls++;return {data:JSON.parse(run(customer,`SELECT public.${name}(${lit(args.p_token)})`))}}};
 const tokenModule={exports:{}};vm.runInNewContext(ts.transpileModule(file('lib/token-canonical-creation.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:tokenModule,exports:tokenModule.exports,require:k=>{if(k==='server-only')return{};if(k==='@/lib/canonical-customer-edit')return {customerEditDomains(){throw Error('retry must reuse draft')}};if(k==='@/lib/package-usage')return {};throw Error(k)},console});
 const prepared=await tokenModule.exports.completeTokenCreation(admin,userDb,customer,token,true);
 ok(prepared.prepared&&prepared.listingId===tokenPlan.listing_id&&publicationCalls===0,'actual token preparation stops before publication');
 ok((await tokenModule.exports.completeTokenCreation(admin,userDb,customer,token,true)).listingId===prepared.listingId,'actual token reload retains durable draft');
 const orderCount=sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots');
 const published=await tokenModule.exports.completeTokenCreation(admin,userDb,customer,token,false);
 ok(published.success&&sql(`SELECT listing_status FROM public.listings WHERE id='${prepared.listingId}'`)==='active','actual token decline path publishes independently');
 ok(sql('SELECT count(*) FROM twuanis_canonical_private.offer_order_snapshots')===orderCount,'actual token decline creates no commercial artifact');
 const renewal=purchase(featured,listing);pay(renewal);const renewResult=fulfill(renewal);ok(renewResult.state==='COMPLETE','same-product renewal fulfills');
 const renewalTerm=JSON.parse(sql(`SELECT row_to_json(t) FROM twuanis_canonical_private.entitlement_terms t WHERE order_id='${renewal.id}'`));ok(Date.parse(renewalTerm.starts_at)===Date.parse(term.ends_at),'renewal retains all remaining purchased time');
 ok(JSON.parse(sql(`SELECT public.read_addon_placement(ARRAY['${listing}'::uuid],'buy')`))[0].activatedAt===term.starts_at,'future renewal has zero early ranking timestamp effect');
 const offerCommand=c=>JSON.parse(run(owner,`SELECT public.admin_offer_command('${crypto.randomUUID()}',${lit(JSON.stringify(c))})`));
 const offer=offerCommand({operation:'create',targetType:'addon',targetId:featured,name_en:'Disposable local Offer',name_es:'Oferta local desechable',startsAt:new Date(Date.now()-60000).toISOString(),endsAt:new Date(Date.now()+3600000).toISOString(),prices:{USD:'3',CRC:'1500'}});
 offerCommand({operation:'schedule',id:offer.offerId,expected:'1'});
 const offerListing=createDraft(),offerOrder=purchase(featured,offerListing);
 const offerSnapshot=JSON.parse(sql(`SELECT resolved_terms FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${offerOrder.id}'`));ok(offerSnapshot.source==='OFFER'&&Number(offerSnapshot.total)===3,'real customer intake uses current authoritative Offer');
 offerCommand({operation:'end',id:offer.offerId,expected:'2'});
 ok(JSON.parse(run(customer,`SELECT public.read_customer_commercial('orders',NULL,'${offerOrder.id}')`))[0].amount===offerSnapshot.total,'ending Offer does not rewrite existing Order price');
 ok(JSON.parse(sql(`SELECT resolved_terms FROM twuanis_canonical_private.offer_order_snapshots WHERE id='${purchase(featured,createDraft()).id}'`)).source==='STANDARD','new intent resolves then-current standard price');
 const result={status:'PASS',checks:n,scope:'Step11 owned disposable financial/listing fixtures; no production'};fs.writeFileSync(root+'/outputs/commercial-administrative/STEP-11-commerce-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e.stderr?.toString()||e);process.exitCode=1});
