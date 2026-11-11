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

 sql(file('supabase/migrations/033_addon_fulfillment_placement.sql'));
 const inputs=[1,2,3].map(n=>({transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},measurements:{property_area:{value:String(800+n*100)},construction_area:{value:String(70+n*20)}},money:{amount:String(50000000+n*10000000),currency:'CRC'}}));
 const job=JSON.parse(run(customer,`SELECT public.prepare_customer_addon_import('${crypto.randomUUID()}',${lit(JSON.stringify(inputs))})`));sql(`SELECT twuanis_canonical_private.fulfill_customer_addon_import('${job.jobId}','${crypto.randomUUID()}','${crypto.randomUUID()}')`);
 const vm=require('vm'),ts=require('typescript');
 function load(name){const m={exports:{}};vm.runInNewContext(ts.transpileModule(file(name),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:k=>{if(k==='server-only')return{};throw Error('unexpected acquisition '+k)},console});return m.exports;}
 const identity=load('lib/price-meter-identity.ts').resolvePriceMeterAnalyticalIdentity,observations=load('lib/price-meter-observation-builder.ts').buildPriceMeterObservations,position=load('lib/price-meter-property-position-population.ts').buildPriceMeterPropertyPositionPopulation;
 const snapshot=()=>JSON.parse(sql(`SELECT jsonb_build_object('listings',(SELECT jsonb_agg(to_jsonb(l) ORDER BY id) FROM listings l),'memberships',(SELECT jsonb_agg(to_jsonb(m) ORDER BY listing_id,ontology_term_id) FROM listings_ontology_terms m),'selections',(SELECT jsonb_agg(to_jsonb(s) ORDER BY listing_id,dimension,ontology_term_id) FROM listing_semantic_selections s))`));
 function analytical(s){const rows=s.listings.map(l=>({...l,analyticalIdentity:identity(l,{analyticalDate:'2026-10-04',fxIdentity:null})})),obs=observations(rows,'land');return {n:rows.length,observations:obs,reference:position({subject:{listingId:rows[0].id,transactionType:'sale',propertyBasis:'improved_property',normalizationBasis:'land',propertyPricePerM2:obs[0].pricePerM2,normalizationAreaM2:obs[0].areaM2,analyticalPrice:obs[0].analyticalPrice},observations:obs,participation:'SUBJECT_INCLUDED'})}}
 const before=snapshot(),baseline=analytical(before);ok(baseline.observations.length===3&&baseline.reference.comparisonPopulationCount===3,'nonempty real observation/reference population');
 for(const product of ['addon-featured-listing','addon-listing-boost','addon-homepage-exposure','addon-province-exposure','addon-property-type-exposure']){
  sql(`SELECT twuanis_canonical_private.fulfill_addon('${crypto.randomUUID()}','${crypto.randomUUID()}','${customer}','${product}',(SELECT current_configuration_id FROM twuanis_canonical_private.addon_products WHERE id='${product}'),'listing','${before.listings[0].id}','{"amount":"5","currency":"USD"}')`);
 }
 const after=snapshot();ok(JSON.stringify(after)===JSON.stringify(before),'canonical source population/evidence unchanged');
 const result=analytical(after);ok(result.n===baseline.n,'listing n unchanged');ok(JSON.stringify(result.observations)===JSON.stringify(baseline.observations),'actual PPM2 eligible observation identities and values unchanged');ok(JSON.stringify(result.reference)===JSON.stringify(baseline.reference),'actual Property Position reference population unchanged');
 console.log(JSON.stringify({status:'PASS',checks:n,scope:'real canonical database population before/after all five placements; actual analytical identity/observation/Property Position functions; zero live I/O'}));
 }finally{if(started)call('pg_ctl',['-D',data,'stop','-m','fast']);}})().catch(e=>{console.error(e.stack);if(e.stderr)console.error(String(e.stderr));process.exitCode=1});
