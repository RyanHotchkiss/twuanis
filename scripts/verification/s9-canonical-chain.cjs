'use strict';
// Fresh runner-owned Unix-socket cluster only. No .env, network, linked database,
// existing rows, old assertions, or historical test suites are used.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/twuanis-s9-chain-'),data=dir+'/data',socket=dir+'/socket';fs.mkdirSync(socket);let started=false,checks=0;
const read=p=>fs.readFileSync(root+'/'+p,'utf8'),lit=v=>"'"+String(v).replaceAll("'","''")+"'";
const call=(bin,args,input)=>execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55449','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1'],q).trim();
const json=q=>JSON.parse(sql(q));const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label)};
const user=crypto.randomUUID(),pkg=crypto.randomUUID();
function asCustomer(q){return sql(`SET request.jwt.claim.sub=${lit(user)};SET ROLE authenticated;${q}`)}
function command(name,args){return JSON.parse(asCustomer(`SELECT public.${name}(${args.join(',')});`))}
function reject(q,label,expected){let error;try{asCustomer(q)}catch(e){error=String(e.stderr)}ok(!!error&&(!expected||error.includes(expected)),label)}
function migrate(n){const file=fs.readdirSync(root+'/supabase/migrations').find(f=>f.startsWith(n+'_'));sql(read('supabase/migrations/'+file))}
try{
 call('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);call('pg_ctl',['-D',data,'-l',dir+'/server.log','-o',`-k ${socket} -p 55449 -c listen_addresses=`,'start']);started=true;
 call('createdb',['-h',socket,'-p','55449','-U','postgres','cg_s1_verification']);
 assert.equal(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)};`),'t');
 // Representative DDL and dictionary fixture fragments only, not old assertions.
 const foundation=read('scripts/verification/canonical-foundation.sql');sql(foundation.split('-- Simulate broad')[0]);
 sql(foundation.match(/INSERT INTO public\.ontology_terms VALUES[\s\S]*?;/)[0]);migrate('004');
 const publisher=read('scripts/verification/publisher-coordination.sql');sql(publisher.slice(publisher.indexOf('CREATE TABLE public.packages'),publisher.indexOf('\\ir ../../supabase/migrations/005')));migrate('005');
 const domains=read('scripts/verification/canonical-domain-machinery.sql');sql(domains.slice(domains.indexOf('CREATE EXTENSION unaccent'),domains.indexOf('\\ir ../../supabase/migrations/003')));migrate('003');migrate('006');
 sql('ALTER TABLE public.listings ADD COLUMN description text, ADD COLUMN whatsapp text;');migrate('007');
 const commercial=read('scripts/verification/commercial-capacity-coordination.sql');sql(commercial.slice(commercial.indexOf('ALTER TABLE public.packages'),commercial.indexOf('-- Cached existing control writer')));migrate('008');migrate('009');migrate('012');migrate('013');migrate('014');migrate('015');migrate('016');
 sql(`GRANT USAGE ON SCHEMA public,auth TO authenticated,service_role;INSERT INTO twuanis_canonical_private.accessibility_identity VALUES(109,'paved'),(10,'2wd'),(1014,'4x4'),(1015,'walkable'),(1016,'boat');INSERT INTO auth.users VALUES(${lit(user)});INSERT INTO packages(id,slug)VALUES(${lit(pkg)},'s9-only');INSERT INTO package_limits(package_id,listing_limit,publication_duration_seconds)VALUES(${lit(pkg)},1,2592000);INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle,current_period_start,current_period_end)VALUES(${lit(user)},${lit(pkg)},'active','monthly',now()-interval '1 day',now()+interval '1 year');`);
 const input={transaction:'sale',geography:{province:'3',canton:'304'},semantics:{property_type:['1'],accessibility:['109','10']},facts:{year_built:{kind:'range',lower:'1985',upper:'1995',lower_inclusive:true,upper_inclusive:true},bedrooms:{kind:'exact',value:'3'}},measurements:{property_area:{value:'200'},construction_area:{value:'100'}},money:{amount:'0.50',currency:'USD'},content:{title:'S9 synthetic'}};
 const request=crypto.randomUUID(),created=command('create_customer_canonical_listing',[lit(request),lit(JSON.stringify(input))]);const id=created.listing_id;
 ok(!!id,'authenticated canonical creation');
 let row=json(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(id)};`);
 ok(row.owner_id===user&&row.canonical_domain_version===1&&row.canonical_revision===1&&row.listing_status==='draft','owner/revision/draft identity established');
 ok(Number(row.current_price)===.5&&row.price_millions===null&&row.monthly_price===null&&row.currency==='USD','Sale exact positive money and no legacy authority');
 ok(command('create_customer_canonical_listing',[lit(request),lit(JSON.stringify(input))]).listing_id===id,'creation retry same identity');
 const evidence=json(`SET ROLE service_role;SELECT public.read_canonical_listing_evidence(ARRAY[${lit(id)}::uuid],ARRAY['year_built','bedrooms'],ARRAY['property_type','accessibility']);`)[0];
 ok(evidence.geography.length===2&&evidence.geography[1].official_code==='304','creation to canonical reader P+C geography');
 ok(evidence.facts.find(f=>f.dimension==='year_built').kind==='range'&&evidence.facts.find(f=>f.dimension==='year_built').exact_value===null,'range remains constraint through reader');
 ok(evidence.facts.find(f=>f.dimension==='bedrooms').exact_value==='3','exact fact survives write/read');
 ok(sql(`SELECT count(*) FROM listings_ontology_terms m JOIN ontology_terms t ON t.id=m.ontology_term_id WHERE listing_id=${lit(id)} AND term_type='year_built';`)==='0','unclassified year does not create membership');
 const pub=crypto.randomUUID();command('publish_customer_canonical_listing',[lit(id),'1',lit(pub),lit('publish')]);
 row=json(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(id)};`);const deadline=row.publication_expires_at;
 ok(row.listing_status==='active'&&row.canonical_revision===2,'creation to package-authorized publication');
 ok(sql(`SELECT round(extract(epoch FROM publication_expires_at-published_at))=2592000 FROM listings WHERE id=${lit(id)};`)==='t','explicit30day duration');
 command('publish_customer_canonical_listing',[lit(id),'1',lit(pub),lit('publish')]);ok(sql(`SELECT canonical_revision FROM listings WHERE id=${lit(id)};`)==='2','publication replay no extra revision');
 command('publish_customer_canonical_listing',[lit(id),'2',lit(crypto.randomUUID()),lit('renew')]);
 ok(sql(`SELECT extract(epoch FROM publication_expires_at-${lit(deadline)}::timestamptz)=2592000 FROM listings WHERE id=${lit(id)};`)==='t','active renewal at capacity adds governing duration');
 const second=command('create_customer_canonical_listing',[lit(crypto.randomUUID()),lit(JSON.stringify(input))]).listing_id;
 reject(`SELECT publish_customer_canonical_listing(${lit(second)},1,gen_random_uuid(),'publish');`,'second publication fails at capacity');
 const before=sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(id)};`);
 reject(`SELECT mutate_customer_canonical_listing(${lit(id)},2,gen_random_uuid(),'{"money":{"amount":"1","currency":"CRC"}}');`,'stale revision rejects');ok(sql(`SELECT to_jsonb(l) FROM listings l WHERE id=${lit(id)};`)===before,'failed edit leaves listing unchanged');
 command('edit_customer_canonical_listing',[lit(id),'3',lit(crypto.randomUUID()),lit('{"money":{"amount":"1","currency":"CRC"},"geography":{"province":"3","canton":"304","district":"30403"}}'),lit('{"title":"S9 edited"}')]);
 ok(sql(`SELECT count(*) FROM listing_monetary_events WHERE listing_id=${lit(id)};`)==='2','currency change appends second monetary event');
 ok(sql(`SELECT current_price=1 AND currency='CRC' AND district='Pejivalle' AND title='S9 edited' AND canonical_revision=4 FROM listings WHERE id=${lit(id)};`)==='t','money/geography/content atomic composition');
 reject(`SELECT mutate_customer_canonical_listing(${lit(id)},4,gen_random_uuid(),'{"transaction":"rent"}');`,'transaction identity immutable');
 for(const access of [['109','1015'],['10','1015'],['1014','1015']]){command('mutate_customer_canonical_listing',[lit(second),sql(`SELECT canonical_revision FROM listings WHERE id=${lit(second)};`),lit(crypto.randomUUID()),lit(JSON.stringify({semantics:{accessibility:access}}))]);ok(true,'allowed accessibility '+access.join('+'))}
 for(const access of [['109','1014'],['10','1014'],['1016','1015']])reject(`SELECT mutate_customer_canonical_listing(${lit(second)},${sql(`SELECT canonical_revision FROM listings WHERE id=${lit(second)};`)},gen_random_uuid(),${lit(JSON.stringify({semantics:{accessibility:access}}))});`,'incompatible accessibility '+access.join('+'),'accessibility set incompatible or unmapped');
 console.log('S9 CANONICAL CHAIN CHECKS '+checks+'; synthetic cluster '+dir);
}catch(error){console.error(String(error.stderr||error.stack||error));process.exitCode=1}
finally{if(started||fs.existsSync(data+'/postmaster.pid')){call('pg_ctl',['-D',data,'stop','-m','fast']);console.log('S9 isolated PostgreSQL stopped. Fixture retained at '+dir)}}
