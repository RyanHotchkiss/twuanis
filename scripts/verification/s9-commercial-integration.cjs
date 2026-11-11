'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),{execFileSync}=require('child_process');
const pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'},dir=process.argv[2];assert.match(dir||'',/^\/private\/tmp\/twuanis-s9-chain-[a-zA-Z0-9]+$/);const data=dir+'/data',socket=dir+'/socket';let started=false,n=0;
const call=(bin,args,input)=>execFileSync(pg+'/'+bin,args,{env,input,encoding:'utf8',timeout:30000,stdio:['pipe','pipe','pipe']});const sql=q=>call('psql',['-X','-qAt','-h',socket,'-p','55449','-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1'],q).trim();const lit=v=>"'"+String(v).replaceAll("'","''")+"'",ok=(v,l)=>{assert.ok(v,l);n++;console.log('PASS '+l)};
try{
 call('pg_ctl',['-D',data,'-l',dir+'/server.log','-o',`-k ${socket} -p 55449 -c listen_addresses=`,'start']);started=true;assert.equal(sql(`SELECT inet_server_addr() IS NULL AND current_setting('data_directory')=${lit(data)};`),'t');
 const owner=crypto.randomUUID(),pkg=crypto.randomUUID(),auth=`SET request.jwt.claim.sub=${lit(owner)};SET ROLE authenticated;`;
 sql(`INSERT INTO auth.users VALUES(${lit(owner)});INSERT INTO packages(id,slug)VALUES(${lit(pkg)},'s9-unknown-authority');INSERT INTO package_limits(package_id,listing_limit,publication_duration_seconds)VALUES(${lit(pkg)},0,NULL);`);
 const id=JSON.parse(sql(`${auth}SELECT create_customer_canonical_listing(gen_random_uuid(),'{"transaction":"sale","geography":{"province":"3","canton":"304"},"semantics":{"property_type":["1"]},"money":{"amount":"1","currency":"CRC"}}');`)).listing_id;
 const publish=()=>sql(`${auth}SELECT publish_customer_canonical_listing(${lit(id)},1,gen_random_uuid(),'publish');`);
 const reject=(expected,label)=>{let error;try{publish()}catch(e){error=String(e.stderr)}ok(!!error&&error.includes(expected),label)};
 reject('one authoritative active subscription required','missing subscription cannot publish existing canonical draft');
 sql(`INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle,current_period_start,current_period_end)VALUES(${lit(owner)},${lit(pkg)},'active','monthly',now()-interval '1 day',now()+interval '1 year');`);
 reject('valid package publication entitlement required','unknown package duration fails closed');
 sql(`UPDATE package_limits SET publication_duration_seconds=2592000 WHERE package_id=${lit(pkg)};`);reject('publication capacity exceeded','zero allowance is not unlimited');
 ok(sql(`SELECT listing_status='draft' AND canonical_revision=1 FROM listings WHERE id=${lit(id)};`)==='t','commercial rejections preserve draft revision');
 sql(`UPDATE package_limits SET listing_limit=NULL WHERE package_id=${lit(pkg)};`);publish();ok(sql(`SELECT listing_status='active' FROM listings WHERE id=${lit(id)};`)==='t','explicit null allowance supports canonical publication');
 ok(sql(`${auth}SELECT is_current_user_import_operator();`)==='f','ordinary authenticated customer is not import operator');
 sql(`SELECT twuanis_canonical_private.set_import_operator(${lit(owner)},true);`);ok(sql(`${auth}SELECT is_current_user_import_operator();`)==='t','existing database-owned operator authority resolves current identity');
 sql(`SELECT twuanis_canonical_private.set_import_operator(${lit(owner)},false);`);ok(sql(`${auth}SELECT is_current_user_import_operator();`)==='f','operator revocation immediately removes authority');
 console.log('S9 COMMERCIAL INTEGRATION '+n+' checks passed');
}catch(e){console.error(String(e.stderr||e.stack||e));process.exitCode=1}
finally{if(started){call('pg_ctl',['-D',data,'stop','-m','fast']);console.log('S9 isolated PostgreSQL stopped; fixture retained')}}
