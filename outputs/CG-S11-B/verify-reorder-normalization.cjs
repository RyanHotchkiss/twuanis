const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root='/Users/cassidydaddy/twuanis';const psql='/opt/homebrew/opt/postgresql@17/bin/psql';const args=['-X','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-d','s11b_utf8','-v','ON_ERROR_STOP=1','-Atq'];
const sql=s=>cp.execFileSync(psql,args,{input:s,encoding:'utf8'}).trim();
sql(fs.readFileSync(root+'/supabase/migrations/024_image_reorder_boundary.sql','utf8').replaceAll('CREATE FUNCTION','CREATE OR REPLACE FUNCTION'));
const quote=s=>"'"+s.replaceAll("'","''")+"'";let n=0;
for(const value of [null,true,false,1,1.25,1e21,1e-7,1e-6,1e20,{},['a',null,['b','c']], '\t a \n','\u00a0x\ufeff']){
 const actual=sql('SELECT to_json(twuanis_canonical_private.s11_image_trim(twuanis_canonical_private.s11_image_string('+quote(JSON.stringify(value))+'::jsonb)));');
 assert.equal(JSON.parse(actual),String(value).trim());n++;
}
assert.equal(sql("SELECT twuanis_canonical_private.s11_image_string('1e-400'::jsonb)"),'0');n++;
// The real RPC accepts the pre-existing JSON coercion contract, not just clean arrays.
const owner='11111111-1111-4111-8111-111111111111',id='22222222-2222-4222-8222-222222222222';
for(const raw of ['[null,true,1,{},["a",null,"b"]]','["\\t a \\n","b","a"]','"single"','a|b|a','']){
 let v;try{const p=JSON.parse(raw);v=Array.isArray(p)?p.map(String).map(x=>x.trim()).filter(Boolean):typeof p==='string'&&p.trim()?[p.trim()]:raw.trim().split('|').map(x=>x.trim()).filter(Boolean)}catch{v=raw.trim().split('|').map(x=>x.trim()).filter(Boolean)}
 const next=v.slice().reverse();sql('BEGIN;UPDATE listings SET images='+quote(raw)+";SET LOCAL ROLE service_role; SELECT public.reorder_listing_images('"+owner+"','"+id+"',"+quote(raw)+',ARRAY['+next.map(quote).join(',')+']::text[]);ROLLBACK;');n++;
}
console.log('PASS '+n+' stored-image normalization/RPC regression checks');
