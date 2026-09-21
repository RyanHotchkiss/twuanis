// Offline verification of the actual loader's private membership acquisition.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
let checks=0,mode='normal',calls=[],delivered=[];
const ok=(v,message)=>{assert.ok(v,message);checks++};
const ids=Array.from({length:27},(_,i)=>'listing-'+String(i).padStart(3,'0'));
const rows=ids.flatMap(listing_id=>[1,2,3].map(id=>({listing_id,ontology_term_id:id,ontology_terms:{id,term_type:id===1?'property_type':id===2?'year_built':'bedrooms',term_name:'Term '+id,term_name_en:'EN '+id,term_name_es:'ES '+id,slug:'term-'+id,slug_en:null,slug_es:null}})));
const db={from(table){assert.equal(table,'listings_ontology_terms');let selected,from,to;const orders=[];const q={select(cols,opts){assert.equal(opts.count,'exact');return q},in(column,values){assert.equal(column,'listing_id');assert.ok(values.length<=25);selected=values;return q},order(column){orders.push(column);return q},range(a,b){from=a;to=b;return q},then(resolve,reject){return Promise.resolve().then(()=>{
 calls.push({selected,from,to});assert.equal(to-from,499);assert.deepEqual(orders,['listing_id','ontology_term_id']);
 const matched=rows.filter(row=>selected.includes(row.listing_id));const data=matched.slice(from,from+2);delivered.push(...data);
 return {data:mode==='empty'&&from>0?[]:data,error:mode==='error'?Error('injected failure'):null,count:mode==='missing'?null:matched.length+(mode==='changed'&&from>0?1:0)};
 }).then(resolve,reject)}};return q}};
const m={exports:{}};
const source=fs.readFileSync(root+'/lib/price-meter-comparable-loader.ts','utf8')+'\nexport const verificationMembershipLoader = loadMembershipDetails;';
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(key){if(key==='server-only')return{};if(key==='@/lib/supabase-admin')return {supabaseAdmin:db};if(key==='@/lib/price-meter-characteristic-identity')return {isPriceMeterCharacteristicType:type=>['property_type','year_built','bedrooms'].includes(type)};return new Proxy({},{get(){return()=>{throw Error('Unexpected dependency call '+key)}}})}});
(async()=>{
 const load=m.exports.verificationMembershipLoader;
 const result=await load([...ids,ids[0]]);
 ok(result.length===27,'deduplicated listing identities');
 ok(result.every(row=>row.ontologyTermIds.length===3),'complete memberships under two-row transport cap');
 ok(delivered.length===81&&new Set(delivered.map(row=>row.listing_id+':'+row.ontology_term_id)).size===81,'each membership delivered once');
 ok(calls.length===41,'25 and 2 ID chunks completely paginated');
 ok(result.every(row=>row.characteristics.find(term=>term.termType==='year_built').termNameEs==='ES 2'),'category identity and labels retained');
 const count=calls.length;ok((await load([])).length===0&&calls.length===count,'empty IDs perform no read');
 for(const failure of ['missing','changed','empty','error']){mode=failure;calls=[];await assert.rejects(()=>load(ids));checks++;ok(calls.length===(failure==='missing'||failure==='error'?1:2),'failure stops without retry '+failure)}
 mode='normal';await assert.rejects(()=>load(['x'.repeat(1600)]),/request budget/);checks++;
 console.log('S9 PHASE12A MEMBERSHIP: '+checks+' offline checks passed; 81 rows, 41 mock pages, no database/network.');
})().catch(error=>{console.error(error);process.exitCode=1});
