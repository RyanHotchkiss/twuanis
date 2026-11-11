'use strict';
// Continue ONLY the runner-owned S9 fixture. No linked DB/environment credentials.
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'},dir=process.argv[2];
assert.match(dir||'',/^\/private\/tmp\/twuanis-s9-chain-[a-zA-Z0-9]+$/);
const data=dir+'/data',socket=dir+'/socket';let started=false,n=0;
const call=(bin,args,input)=>execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']});
const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55449','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1'],q).trim();
const lit=v=>"'"+String(v).replaceAll("'","''")+"'",j=v=>lit(JSON.stringify(v)),uid=()=>lit(crypto.randomUUID());
const ok=(v,label)=>{assert.ok(v,label);n++;console.log('PASS '+label)};
let user,id,second;
const customer=q=>sql(`SET request.jwt.claim.sub=${lit(user)};SET ROLE authenticated;${q}`);
const service=q=>sql('SET ROLE service_role;'+q);
const reject=(q,expected,label,run=customer)=>{let error;try{run(q)}catch(e){error=String(e.stderr)}ok(!!error&&error.includes(expected),label+' (expected '+expected+')')};
const rev=id=>sql(`SELECT canonical_revision FROM listings WHERE id=${lit(id)};`);
const mutate=(id,domains)=>JSON.parse(customer(`SELECT mutate_customer_canonical_listing(${lit(id)},${rev(id)},${uid()},${j(domains)});`));
try{
 call('pg_ctl',['-D',data,'-l',dir+'/server.log','-o',`-k ${socket} -p 55449 -c listen_addresses=`,'start']);started=true;
 assert.equal(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)};`),'t');
 const rows=JSON.parse(sql("SELECT json_agg(l) FROM listings l WHERE title IN ('S9 edited','S9 synthetic');"));
 id=rows.find(r=>r.title==='S9 edited').id;second=rows.find(r=>r.title==='S9 synthetic').id;user=rows[0].owner_id;
 // --resume skips successful earlier checks after a harness-only diagnostic correction.
 const resume=process.argv.includes('--resume');
 // Replace three invalid original negative checks; no successful checks rerun.
 if(!resume) for(const access of [['109','1014'],['10','1014'],['1016','1015']])reject(`SELECT mutate_customer_canonical_listing(${lit(second)},${rev(second)},${uid()},${j({semantics:{accessibility:access}})});`,'accessibility set incompatible or unmapped','incompatible accessibility '+access.join('+'));
 const input={transaction:'rent',geography:{province:'3',canton:'304'},semantics:{property_type:['1']},money:{amount:'0.75',currency:'USD'},measurements:{property_area:{value:'200'},construction_area:{value:'100'}},content:{title:'S9 Rent'}};
 const rent=resume?sql("SELECT id FROM listings WHERE title='S9 Rent';"):JSON.parse(customer(`SELECT create_customer_canonical_listing(${uid()},${j(input)});`)).listing_id;
 if(!resume) ok(sql(`SELECT monthly_price=.75 AND current_price IS NULL AND price_millions IS NULL AND transaction_type='rent' FROM listings WHERE id=${lit(rent)};`)==='t','Rent creation preserves independent exact monetary authority');
 if(!resume) reject(`SELECT create_customer_canonical_listing(${uid()},${j({...input,geography:{province:'3'}})});`,'unknown or missing domain field','Province-only creation rejected');
 reject(`SELECT create_customer_canonical_listing(${uid()},${j({...input,geography:{province:'3',canton:'101'}})});`,'canonical geography disagreement','cross-province hierarchy rejected');
 const oldArea=sql(`SELECT property_area FROM listings WHERE id=${lit(rent)};`);mutate(rent,{facts:{bedrooms:{kind:'exact',value:'4'}}});ok(sql(`SELECT property_area FROM listings WHERE id=${lit(rent)};`)===oldArea,'omission preserves measurement');
 reject(`SELECT mutate_customer_canonical_listing(${lit(rent)},${rev(rent)},${uid()},'{"measurements":{"property_area":{"value":"0"}}}');`,'positive exact measurement','zero is not CLEAR');
 mutate(rent,{measurements:{property_area:{kind:'clear'}}});ok(sql(`SELECT property_area IS NULL AND construction_area=100 FROM listings WHERE id=${lit(rent)};`)==='t','explicit CLEAR removes only requested measurement');
 ok(sql(`SELECT count(*) FROM listing_membership_origins WHERE listing_id=${lit(rent)} AND origin_domain='property_area';`)==='0','CLEAR has no surviving dependent origins');
 mutate(id,{geography:{province:'3',canton:'304'}});ok(sql(`SELECT district IS NULL FROM listings WHERE id=${lit(id)};`)==='t','District removal preserves minimum P+C');
 const initialEvents=Number(sql(`SELECT count(*) FROM listing_lifecycle_events WHERE listing_id=${lit(id)};`));
 for(const event of ['unpublish','archive','restore','delete','restore'])mutate(id,{lifecycle:{event}});
 ok(sql(`SELECT listing_status='draft' FROM listings WHERE id=${lit(id)};`)==='t','lifecycle delete retains identity and restore returns draft');
 ok(Number(sql(`SELECT count(*) FROM listing_lifecycle_events WHERE listing_id=${lit(id)};`))===initialEvents+5,'each transition appends history');
 ok(sql(`SELECT count(*) FROM listing_monetary_events WHERE listing_id=${lit(id)};`)==='2','lifecycle preserves monetary history');
 const dr=crypto.randomUUID(),dup=JSON.parse(customer(`SELECT prepare_customer_duplicate(${lit(id)},${lit(dr)});`));
 ok(dup.listing_id!==id&&dup.completed===false,'duplicate independent draft identity and incomplete manifest');
 ok(JSON.parse(customer(`SELECT prepare_customer_duplicate(${lit(id)},${lit(dr)});`)).listing_id===dup.listing_id,'duplicate retry same identity');
 ok(sql(`SELECT count(*) FROM listing_lifecycle_events WHERE listing_id=${lit(dup.listing_id)};`)==='1','duplicate does not clone lifecycle history');
 ok(sql(`SELECT count(*) FROM listing_monetary_events WHERE listing_id=${lit(dup.listing_id)};`)==='1','duplicate establishes fresh monetary observation');
 reject(`SELECT publish_customer_canonical_listing(${lit(dup.listing_id)},${rev(dup.listing_id)},${uid()},'publish');`,'complete duplicate media before publication','incomplete duplicate publication blocked');
 service(`SELECT attach_customer_duplicate_media(${lit(dup.listing_id)});`);
 ok(JSON.parse(service(`SELECT attach_customer_duplicate_media(${lit(dup.listing_id)});`)).completed,'empty-media duplicate completion idempotent');
 const source={source_name:'S9 fixture',source_listing_id:'opaque-001',observation_id:'one',observed_at:'2026-01-01T00:00:00Z',source_type:'realtor'};
 const src=JSON.parse(service(`SELECT create_trusted_canonical_listing(${uid()},${j(input)},${j(source)});`)).listing_id;
 ok(sql(`SELECT owner_id IS NULL AND transaction_type='rent' AND source_listing_id='opaque-001' FROM listings WHERE id=${lit(src)};`)==='t','trusted source creation isolated from customer publisher');
 ok(JSON.parse(service(`SELECT create_trusted_canonical_listing(${uid()},${j(input)},${j(source)});`)).listing_id===src,'same source observation replays identity');
 const observation={source_name:source.source_name,source_listing_id:source.source_listing_id,observation_id:'two',observed_at:'2026-01-02T00:00:00Z',transaction:'rent',geography:{province:'3',canton:'304',district:'30403'}};
 service(`SELECT mutate_trusted_canonical_listing(${lit(src)},${rev(src)},${uid()},'{}',${j(observation)});`);
 ok(sql(`SELECT district='Pejivalle' FROM listings WHERE id=${lit(src)};`)==='t','source District refinement accepted');
 const prior=rev(src),conflict=JSON.parse(service(`SELECT mutate_trusted_canonical_listing(${lit(src)},${prior},${uid()},'{}',${j({...observation,observation_id:'three',transaction:'sale'})});`));
 ok(conflict.outcome==='conflict'&&rev(src)===prior,'source transaction conflict preserves canonical revision');
 ok(sql(`SELECT count(*) FROM source_identity_conflicts WHERE listing_id=${lit(src)};`)==='1','source conflict recorded separately');
 console.log('S9 CHAIN CONTINUATION '+n+' checks passed');
}catch(e){console.error(String(e.stderr||e.stack||e));process.exitCode=1}
finally{if(started){call('pg_ctl',['-D',data,'stop','-m','fast']);console.log('S9 isolated PostgreSQL stopped; fixture retained')}}
