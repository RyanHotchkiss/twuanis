'use strict';
// Socket-only disposable PostgreSQL fixture. Never loads environment files or production data.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{execFileSync,spawn}=require('child_process');
const root=process.env.PHASE_E_REPO||path.resolve(__dirname,'../..'),pg='/opt/homebrew/opt/postgresql@17/bin',env={PATH:'/usr/bin:/bin',LC_ALL:'C'};
const dir=fs.mkdtempSync('/private/tmp/settings-db-'),socket=dir+'/socket',data=dir+'/data';fs.mkdirSync(socket);let started=false;const results=[];
const run=(b,a,input)=>execFileSync(pg+'/'+b,a,{env,input,encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:60000});
const args=['-X','-qAt','-h',socket,'-p','55483','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
const sql=q=>run('psql',args,q).trim(),lit=x=>"'"+String(x).replaceAll("'","''")+"'",id=()=>crypto.randomUUID();
const a=id(),b=id(),c=id(),priv='twuanis_canonical_private.';
const ctx=u=>`SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:u,role:'authenticated'}))},true);`;
const own=(u,q)=>sql(`BEGIN;SET LOCAL ROLE authenticated;${ctx(u)}${q};COMMIT;`).split('\n').at(-1);
const trusted=(u,q)=>sql(`BEGIN;${ctx(u)}${q};COMMIT;`).split('\n').at(-1);
const ok=(v,label)=>{assert.ok(v,label);results.push(label)};
const denies=(f,label,pattern)=>{let err;try{f()}catch(e){err=e}assert.ok(err,label);if(pattern)assert.match(String(err.stderr||err),pattern,label);results.push(label)};
const update=(u,req,rev,patch)=>JSON.parse(own(u,`SELECT public.update_account_profile('${req}',${rev},${lit(JSON.stringify(patch))}::jsonb)`));
const phone=(u,req,rev,p)=>JSON.parse(trusted(u,`SELECT ${priv}change_account_phone('${req}',${rev},${p===null?'NULL':lit(p)})`));
const asyncSql=q=>new Promise(resolve=>{const p=spawn(pg+'/psql',args,{env});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);p.on('close',code=>resolve({code,out,err}));p.stdin.end(q)});
(async()=>{try{
 run('initdb',['-D',data,'-U','postgres','--auth=trust','--no-locale','--encoding=UTF8']);run('pg_ctl',['-D',data,'-l',dir+'/log','-o',`-k ${socket} -p 55483 -c listen_addresses=`,'start']);started=true;
 sql(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA twuanis_canonical_private AUTHORIZATION postgres;
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;
 GRANT USAGE ON SCHEMA auth TO authenticated;INSERT INTO auth.users VALUES('${a}'),('${b}'),('${c}');`);
 // Hostile defaults prove explicit revokes override defaults.
 sql('ALTER DEFAULT PRIVILEGES IN SCHEMA twuanis_canonical_private GRANT ALL ON TABLES TO anon,authenticated,service_role;');
 sql(fs.readFileSync(root+'/supabase/migrations/050_account_identity_foundation.sql','utf8'));ok(true,'migration installs transactionally');
 let p=JSON.parse(own(a,'SELECT public.read_account_profile()'));ok(p.userId===a&&p.name===null&&p.language===null&&p.revision===0,'own initialization leaves unset values null');
 own(a,'SELECT public.read_account_profile()');ok(sql(`SELECT count(*) FROM ${priv}account_profiles WHERE user_id='${a}'`)==='1','repeat initialization has one row');
 ok(sql(`SELECT count(*) FROM information_schema.columns WHERE table_schema='twuanis_canonical_private' AND table_name='account_profiles' AND column_name IN ('email','phone_verified')`)==='0','no shadow email or editable verification boolean');
 const req=id(),r=update(a,req,0,{name:'Ana',biography:'Plain <text>',language:'es'});ok(r.revision===1&&r.name==='Ana','allowed profile update');ok(JSON.stringify(update(a,req,0,{name:'Ana',biography:'Plain <text>',language:'es'}))===JSON.stringify(r),'same request returns receipt despite stale expected revision');
 denies(()=>update(a,req,0,{name:'Other'}),'request payload collision rejected',/request identity conflict/);
 denies(()=>update(a,id(),0,{name:'Other'}),'stale revision rejected',/profile revision conflict/);
 for(const [patch,label] of [[{user_id:b},'owner spoof'],[{email:'a@invalid'},'email spoof'],[{phone_verified:true},'verification spoof'],[{active_image_id:id()},'image spoof'],[{name:5},'nontext field'],[{name:'x'.repeat(121)},'long name'],[{biography:'x'.repeat(2001)},'long bio'],[{language:'fr'},'unsupported locale']])denies(()=>update(a,id(),1,patch),label+' denied');
 ok(update(a,id(),1,{name:'x'.repeat(120),biography:'x'.repeat(2000)}).revision===2,'exact text bounds accepted');
 ok(JSON.parse(own(b,'SELECT public.read_account_profile()')).name===null,'second account cannot read first profile');

 for(const role of ['anon','authenticated','service_role'])ok(sql(`SELECT has_table_privilege('${role}','${priv}account_profiles','SELECT,INSERT,UPDATE,DELETE')`)==='f',role+' no direct profile authority');
 for(const role of ['anon','service_role'])denies(()=>sql(`SET ROLE ${role};SELECT public.read_account_profile()`),role+' profile RPC denied');
 denies(()=>sql('SET ROLE authenticated;SELECT public.read_account_profile()'),'missing account identity denied');
 ok(update(b,id(),0,{language:'en'}).language==='en','English preference saved');ok(update(b,id(),1,{language:'es'}).language==='es','Spanish preference saved');
 ok(JSON.parse(own(a,'SELECT public.read_account_profile()')).name==='x'.repeat(120),'other account update isolated');
 const race=await Promise.all(['first','second'].map(name=>asyncSql(`BEGIN;SET LOCAL ROLE authenticated;${ctx(a)}SELECT public.update_account_profile('${id()}',2,'{"name":"${name}"}');COMMIT;`)));
 ok(race.filter(x=>x.code===0).length===1,'concurrent profile saves one winner');
 console.log(JSON.stringify({pass:results.length,concurrencyCases:1,results},null,2));
 }finally{if(started)run('pg_ctl',['-D',data,'-m','immediate','stop'])}})().catch(e=>{console.error(e.stderr||e);process.exitCode=1});
