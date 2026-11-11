'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),ts=require('typescript'),assert=require('assert/strict');const root=path.resolve(__dirname,'../..');let enabled=false,calls=[],ids=[],rows=[],checks=0;
const db={async rpc(name){calls.push(name);return {data:ids,error:null}},from(table){calls.push(table);const q={select(columns){assert.equal(columns,'id,title,images,transaction_type');return q},in(column,v){assert.equal(column,'id');assert.deepEqual(v,ids);return q},eq(){return q},async limit(n){assert.equal(n,10);return {data:rows,error:null}}};return q},storage:{from(){return {getPublicUrl:key=>({data:{publicUrl:'https://fixture.invalid/'+key}})}}}};
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/addon-homepage-server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:k=>k==='server-only'?{}:k==='@/lib/supabase-admin'?{supabaseAdmin:db}:{canonicalAddonPlacementEnabled:()=>enabled}});
function ok(v,label){assert.ok(v,label);checks++}
(async()=>{
 ok((await m.exports.loadAddonHomepage()).length===0&&!calls.length,'legacy zero new queries');enabled=true;
 ok((await m.exports.loadAddonHomepage()).length===0&&calls.length===1,'empty active set zero payload queries');calls=[];
 ids=['a','b'];rows=[{id:'b',title:'Rent',transaction_type:'rent',images:[]},{id:'a',title:'Sale',transaction_type:'sale',images:['owned/path.webp']}];
 const result=await m.exports.loadAddonHomepage();ok(result.map(x=>x.id).join()==='a,b','activation order preserved');ok(result[1].image===null,'existing no-image fallback');ok(calls.length===2,'one bounded ID read plus one payload read');ok(Object.keys(result[0]).sort().join()==='id,image,title,transaction','minimal browser projection');
 ids=Array(11).fill('a');await assert.rejects(()=>m.exports.loadAddonHomepage());checks++;
 ids=['a','a'];await assert.rejects(()=>m.exports.loadAddonHomepage());checks++;
 console.log(JSON.stringify({status:'PASS',checks,scope:'actual Homepage reader; bounded fake transport; legacy/empty/active/error cases'}));
})().catch(e=>{console.error(e);process.exitCode=1});
