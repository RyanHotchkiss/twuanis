const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript'),m={exports:{}};
function pure(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/geography/'+file+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require:k=>pure(k.slice(2))});return m.exports}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/canonical-market-population.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require:n=>{if(n==='server-only')return {};if(n==='./geography/dta-identity')return pure('dta-identity');if(n==='./supabase-admin')return {supabaseAdmin:{from(){throw Error('Default database forbidden')}}};throw Error(n)}});
const api=m.exports;let checks=0;
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const b={transaction:'sale',membershipGroups:[['10'],['20','21']],propertyArea:{min:100,max:200},constructionArea:{min:null,max:90}};
function client(responses){const calls=[];return {calls,from(table){const ops=[['from',table]];calls.push(ops);const q={then(ok,no){return Promise.resolve(responses.shift()).then(ok,no)}};for(const k of ['select','eq','in','gte','lt','order','range'])q[k]=(...a)=>(ops.push([k,...a]),q);return q}}}
function eq(a,b){assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));checks++}
async function fails(p){await assert.rejects(p);checks++}
(async()=>{
for(const n of [0,1,499,500,501,1001]){const rows=Array.from({length:n},(_,i)=>({id:id(i+1),property_area:123,title:'DO NOT PROJECT',m0:[{ontology_term_id:'10'}]}));const answers=[];for(let i=0;i<n||i===0;i+=500)answers.push({data:rows.slice(i,i+500),count:n,error:null});const c=client(answers),result=await api.readCanonicalMarketScalars(b,['property_area'],c);eq(result.length,n);eq(c.calls.length,Math.max(1,Math.ceil(n/500)));if(n)eq(Object.keys(result[0]),['id','property_area']);eq(c.calls[0],[['from','listings'],['select','id,property_area,m0:listings_ontology_terms!inner(),m1:listings_ontology_terms!inner()',{count:'exact',head:false}],['eq','canonical_domain_version',1],['eq','listing_status','active'],['eq','transaction_type','sale'],['in','m0.ontology_term_id',['10']],['in','m1.ontology_term_id',['20','21']],['gte','property_area',100],['lt','property_area',200],['lt','construction_area',90],['order','id'],['range',0,499]]);}
const short=client([{data:[{id:id(1)}],count:2},{data:[{id:id(2)}],count:2}]);eq((await api.readCanonicalMarketScalars(b,[],short)).length,2);eq(short.calls[1].at(-1),['range',1,500]);
const count=client([{count:12,error:null}]);eq(await api.countCanonicalMarket(b,count),12);eq(count.calls[0][1][2].head,true);
for(const response of [{count:null},{count:1,error:{message:'failure'}},{count:-1},{count:1.5}])await fails(api.countCanonicalMarket(b,client([response])));
for(const responses of [
[{data:[],count:1}], [{data:[{id:'bad'}],count:1}], [{data:[{id:id(1)},{id:id(1)}],count:2}],
[{data:[{id:id(2)},{id:id(1)}],count:2}], [{data:[{id:id(1)}],count:0}],
[{data:[{id:id(1)}],count:2},{data:[{id:id(2)}],count:3}],
[{data:[{id:id(1)}],count:2},{data:[],count:2}], [{data:[],count:0,error:{message:'fail'}}],
[{data:Array.from({length:501},(_,i)=>({id:id(i+1)})),count:501}],
])await fails(api.readCanonicalMarketScalars(b,[],client(responses)));
await fails(api.readCanonicalMarketScalars(b,['property_area'],client([{data:[{id:id(1)}],count:1}])));
for(const invalid of [{...b,transaction:'SALE'},{...b,membershipGroups:[['bad']]},{...b,membershipGroups:[[]]},{...b,membershipGroups:[['10','10']]},{...b,propertyArea:{min:2,max:1}}]){const c=client([]);await fails(api.countCanonicalMarket(invalid,c));eq(c.calls.length,0)}
await fails(api.readCanonicalMarketScalars(b,['images'],client([])));
for(const tx of ['rent',null]){const c=client([{count:0}]);await api.countCanonicalMarket({...b,transaction:tx},c);eq(c.calls[0][4],tx?['eq','transaction_type','rent']:['in','transaction_type',['sale','rent']]);}
for(const identity of ['0','-9223372036854775808','9223372036854775807']){const c=client([{count:0}]);eq(await api.countCanonicalMarket({...b,membershipGroups:[[identity]]},c),0)}
console.log('CANONICAL MARKET POPULATION PASS:',checks,'offline assertions. No live database/network.');
})().catch(e=>{console.error(e);process.exitCode=1});
