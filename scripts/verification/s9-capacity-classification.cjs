'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'},dir=process.argv[2];assert.match(dir||'',/^\/private\/tmp\/twuanis-s9-chain-[a-zA-Z0-9]+$/);
const data=dir+'/data',socket=dir+'/socket';let started=false,n=0;
const args=['-X','-qAt','-h',socket,'-p','55449','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1'];
const call=(bin,a,input)=>execFileSync(pg+'/'+bin,a,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']});const sql=q=>call('psql',args,q).trim();
const lit=v=>"'"+String(v).replaceAll("'","''")+"'",j=v=>lit(JSON.stringify(v)),uid=()=>lit(crypto.randomUUID()),ok=(v,l)=>{assert.ok(v,l);n++;console.log('PASS '+l)};
const asyncSql=q=>new Promise(resolve=>{const c=spawn(pg+'/psql',args,{env,stdio:['pipe','pipe','pipe']});let out='',err='';c.stdout.on('data',v=>out+=v);c.stderr.on('data',v=>err+=v);c.on('close',code=>resolve({code,out,err}));c.stdin.end(q)});
(async()=>{try{
 call('pg_ctl',['-D',data,'-l',dir+'/server.log','-o',`-k ${socket} -p 55449 -c listen_addresses=`,'start']);started=true;assert.equal(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)};`),'t');
 const listings=JSON.parse(sql("SELECT json_agg(l) FROM listings l WHERE owner_id IS NOT NULL AND title IN ('S9 Rent','S9 synthetic');"));assert.equal(listings.length,2);const owner=listings[0].owner_id;
 const auth=`SET request.jwt.claim.sub=${lit(owner)};SET ROLE authenticated;`;
 const resume=process.argv.includes('--resume');
 if(!resume){const results=await Promise.all(listings.map(l=>asyncSql(`${auth}BEGIN;SET LOCAL statement_timeout='5s';SELECT publish_customer_canonical_listing(${lit(l.id)},${l.canonical_revision},${uid()},'publish');SELECT pg_sleep(.2);COMMIT;`)));
 ok(results.filter(r=>r.code===0).length===1&&results.filter(r=>r.err.includes('publication capacity exceeded')).length===1,'two independent publication sessions cannot consume one slot twice');
 ok(sql(`SELECT count(*) FROM listings WHERE owner_id=${lit(owner)} AND listing_status='active';`)==='1','one active listing after simultaneous publication');}
 const target=listings.find(l=>sql(`SELECT listing_status FROM listings WHERE id=${lit(l.id)};`)==='draft').id;
 const rev=()=>sql(`SELECT canonical_revision FROM listings WHERE id=${lit(target)};`),rule=resume?sql("SELECT id FROM listing_classification_rule_sets WHERE domain='property_area' AND version=901;"):crypto.randomUUID();
 if(!resume){
 sql(`INSERT INTO listing_classification_rule_sets(id,domain,version)VALUES(${lit(rule)},'property_area',901);INSERT INTO listing_classification_rules(rule_set_id,ontology_term_id,bounds)VALUES(${lit(rule)},7,'[0,100)'),(${lit(rule)},8,'[100,)');SELECT twuanis_canonical_private.s3_seal_classification(${lit(rule)});SELECT twuanis_canonical_private.s3_command(${lit(target)},${rev()},'owner',${lit(owner)},${uid()},${j({measurements:{property_area:{value:'50',rule_set:rule}}})},NULL);`);
 ok(sql(`SELECT count(*) FROM listing_membership_origins WHERE listing_id=${lit(target)} AND ontology_term_id=7 AND classification_rule_id IS NOT NULL;`)==='1','recorded sealed rule establishes fresh small-area classification');
 sql(`${auth}SELECT mutate_customer_canonical_listing(${lit(target)},${rev()},${uid()},'{"measurements":{"property_area":{"value":"150"}}}');`);}
 ok(sql(`SELECT count(*) FROM listing_membership_origins o JOIN listing_classification_rules r ON r.id=o.classification_rule_id WHERE o.listing_id=${lit(target)} AND r.rule_set_id=${lit(rule)} AND o.ontology_term_id=8;`)==='1','customer edit reapplies recorded rule to new value');
 ok(sql(`SELECT count(*) FROM listings_ontology_terms WHERE listing_id=${lit(target)} AND ontology_term_id=7;`)==='0','obsolete small-area membership removed');
 const duplicate=JSON.parse(sql(`${auth}SELECT prepare_customer_duplicate(${lit(target)},${uid()});`)).listing_id;
 ok(sql(`SELECT count(*) FROM listing_membership_origins o JOIN listing_classification_rules r ON r.id=o.classification_rule_id WHERE o.listing_id=${lit(duplicate)} AND r.rule_set_id=${lit(rule)} AND o.ontology_term_id=8;`)==='1','duplicate rederives fresh origins with recorded sealed rule');
 sql(`${auth}SELECT mutate_customer_canonical_listing(${lit(target)},${rev()},${uid()},'{"measurements":{"property_area":{"kind":"clear"}}}');`);
 ok(sql(`SELECT property_area IS NULL FROM listings WHERE id=${lit(target)};`)==='t'&&sql(`SELECT count(*) FROM listing_membership_origins WHERE listing_id=${lit(target)} AND origin_domain='property_area';`)==='0','CLEAR removes classified measurement and dependent origins');
 ok(sql(`SELECT count(*) FROM listings_ontology_terms WHERE listing_id=${lit(target)} AND ontology_term_id IN(7,8);`)==='0','CLEAR removes current derived memberships');
 console.log('S9 CAPACITY/CLASSIFICATION '+n+' checks passed');
 }finally{if(started){call('pg_ctl',['-D',data,'stop','-m','fast']);console.log('S9 isolated PostgreSQL stopped; fixture retained')}}})().catch(e=>{console.error(String(e.stderr||e.stack||e));process.exitCode=1});
