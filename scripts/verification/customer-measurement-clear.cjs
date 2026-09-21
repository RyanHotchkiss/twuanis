const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let count=0;
function ok(v,s){assert.ok(v,s);count++;console.log('PASS',s)}
function load(file,deps={},globals={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return {};if(k in deps)return deps[k];throw Error(k)},fetch(){throw Error('network forbidden')},...globals});return m.exports}
const road=load('lib/canonical-customer-road-distance.ts'),server=load('lib/canonical-customer-edit.ts',{'@/lib/canonical-customer-road-distance':road}),noDB={from(){throw Error('unexpected database read')}};
(async()=>{
 for(const dim of ['property_area','construction_area']){
  const clear=await server.customerEditDomains(noDB,{[dim]:{kind:'clear'}},{});ok(JSON.stringify(clear.domains.measurements[dim])==='{"kind":"clear"}',dim+' explicit clear');
  const set=await server.customerEditDomains(noDB,{[dim]:{kind:'set',value:'12.5'}},{});ok(set.domains.measurements[dim].value==='12.5',dim+' explicit set');
  for(const v of [null,'',0,{}, {value:'12'},{kind:'set',value:''},{kind:'set',value:'0'},{kind:'set',value:'NaN'},{kind:'clear',value:'12'},{kind:'clear',rule_set:'spoof'}]){await assert.rejects(server.customerEditDomains(noDB,{[dim]:v},{}));count++}
 }
 const unchanged=await server.customerEditDomains(noDB,{},{});ok(!unchanged.domains.measurements,'omission sends no measurement operation');
 const saved=new Map(),sent=[];const client=load('app/utils/canonicalCustomerEdit.ts',{}, {crypto:webcrypto,TextEncoder,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},fetch:async(u,o)=>{sent.push(JSON.parse(o.body));return {ok:true,json:async()=>({success:true})}}});
 const auth={auth:{getUser:async()=>({data:{user:{id:'owner'}}}),getSession:async()=>({data:{session:{access_token:'token'}}})}},listing={id:'listing',canonical_domain_version:1,canonical_revision:'2'},initial={property_area:100,construction_area:50};
 await client.submitCanonicalCustomerEdit(auth,listing,initial,initial);ok(!sent.length,'unchanged UI does not mutate');
 await client.submitCanonicalCustomerEdit(auth,listing,initial,{...initial,property_area:101});ok(sent.at(-1).changes.property_area.kind==='set'&&sent.at(-1).changes.property_area.value==='101','UI changed positive value becomes SET');
 for(const v of [null,'',0,'garbage']){await assert.rejects(client.submitCanonicalCustomerEdit(auth,listing,initial,{...initial,property_area:v}));count++}
 await client.submitCanonicalCustomerEdit(auth,listing,initial,{...initial,property_area:null},{property_area:true});ok(sent.at(-1).changes.property_area.kind==='clear'&&!('construction_area'in sent.at(-1).changes),'only explicit UI action becomes CLEAR');
 for(const name of ['SaleListingEditForm.tsx','RentalListingEditForm.tsx']){const s=fs.readFileSync(root+'/app/components/'+name,'utf8');ok(s.includes('Undo clear')&&s.includes('Deshacer eliminación'),'explicit reversible clear control EN/ES '+name);ok(s.includes('setMeasurementClears(previous => ({ ...previous, [field]: false }))'),'typing resets pending clear '+name)}
 const sale=fs.readFileSync(root+'/app/components/SaleListingEditForm.tsx','utf8');ok(!sale.includes('construction_area: null'),'no automatic canonical type-change clear');
 console.log('MEASUREMENT CLEAR OFFLINE ASSERTIONS',count)
})().catch(e=>{console.error(e);process.exitCode=1});
