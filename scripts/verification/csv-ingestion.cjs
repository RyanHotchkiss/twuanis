const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let count=0;const calls=[];
function ok(v,m){assert.ok(v,m);count++;console.log('PASS',m)}
function load(file,deps){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,process:{env:{}},TextDecoder,require(k){if(k==='server-only')return {};if(k in deps)return deps[k];throw Error(k)},fetch(){throw Error('network forbidden')}});return m.exports}
let canonicalInput,referenceFailure=false,persistenceFailure=false;
const engine=load('lib/csv-source-ingestion.ts',{'@/lib/canonical-customer-edit':{customerEditDomains:async(db,changes)=>{canonicalInput=changes;return {domains:{geography:{province:'3',canton:'304'},semantics:{property_type:['1']},money:{amount:changes.current_price,currency:changes.currency}},content:{}}}}});
const admin={rpc:async(n,a)=>{calls.push({n,a});if(n==='retain_csv_source_evidence')return persistenceFailure?{error:{message:'conflict'}}:{data:'07000000-0000-0000-0000-000000001818'};if(n==='create_csv_canonical_listing')return {data:{listing_id:'listing',csv_creation_receipt:'receipt'}};if(n==='complete_csv_source_references')return referenceFailure?{error:{message:'references incomplete'}}:{};if(n==='initially_publish_csv_listing')return {data:{listing_id:'listing'}};throw Error(n)},storage:{from(){throw Error('source media storage forbidden')}},from(){throw Error('unexpected database population read')}};
const raw={source_name:'encuentra24',source_listing_id:'source',observation_id:'genuine',observed_at:'2026-09-18T01:02:03Z',property_type:'House',transaction_type:'sale',province:'Cartago',canton:'Jiménez',district:'Pejibaye',current_price:'0.5',currency:'USD',raw_bathrooms:'2.5',raw_bedrooms:'2',raw_year_built:'1997',raw_property_area:'85.75 m²',raw_construction_area:'100–200 m²',images:'https://photos.encuentra24.com/example.jpg'};
function row(r=raw){return {...r,property_type:'INFERRED',bathrooms:'3 Bathrooms',source_observation_input:JSON.stringify(r),unresolved_normalizer_review:JSON.stringify({status:'unresolved',canonical_authority:false,values:{bathrooms:'3 Bathrooms',environment:'Beachfront'}})}}
(async()=>{
 let r=await engine.ingestCsvObservation(admin,row());ok(r.success,'source-supported input delegates to canonical boundaries');
 ok(calls.map(c=>c.n).join(',')==='retain_csv_source_evidence,create_csv_canonical_listing,complete_csv_source_references,initially_publish_csv_listing','retention before creation; references before lifecycle');
 let create=calls.find(c=>c.n==='create_csv_canonical_listing').a;
 ok(create.p_input.facts.bathrooms.value==='2.5','fractional bathroom preserved without rounding');
 ok(create.p_input.facts.year_built.value==='1997','exact source year preserved');
 ok(create.p_input.measurements.property_area.value==='85.75'&&!create.p_input.measurements.construction_area,'explicit unit exact area only, range not imputed');
 ok(!create.p_input.semantics.environment,'heuristic semantic output absent');
 ok(canonicalInput.property_type==='House'&&canonicalInput.current_price==='0.5','raw type and original monetary amount used');
 ok(canonicalInput.district==='Pejivalle','frozen source alias resolved upstream');
 ok(create.p_source.observation_id===raw.observation_id&&create.p_source.observed_at===raw.observed_at,'no fabricated observation identity/time');
 ok(create.p_request==='07000000-0000-0000-0000-000000001818','request identity stable from retained record');
 calls.length=0;const missing={...raw};delete missing.property_type;missing.raw_property_type='House near beach';r=await engine.ingestCsvObservation(admin,row(missing));ok(!r.success&&r.evidenceId&&calls.length===1,'required heuristic-only type retains evidence but blocks creation');
 calls.length=0;await assert.rejects(engine.ingestCsvObservation(admin,{...raw}));ok(!calls.length,'historical CSV missing envelope not promoted');
 calls.length=0;persistenceFailure=true;await assert.rejects(engine.ingestCsvObservation(admin,row()));ok(calls.length===1,'immutable evidence conflict stops canonical calls');persistenceFailure=false;
 calls.length=0;referenceFailure=true;r=await engine.ingestCsvObservation(admin,row());ok(!r.success&&!calls.some(c=>c.n==='initially_publish_csv_listing'),'reference failure blocks publication');referenceFailure=false;
 for(const key of ['observation_id','observed_at','source_listing_id']){const bad=row();bad[key]='forged';assert.throws(()=>engine.csvEvidenceEnvelope(bad));count++}
 const bad=row();bad.unresolved_normalizer_review='{"status":"unresolved","canonical_authority":true,"values":{}}';assert.throws(()=>engine.csvEvidenceEnvelope(bad));count++;
 const numeric=row({...raw,raw_bathrooms:2.5});assert.throws(()=>engine.csvEvidenceEnvelope(numeric));count++;
 let operator=false,auth=true,ingests=0;
 const customer = {
   auth: { getUser: async () => ({ data: { user: auth ? { id: 'user' } : null } }) },
   rpc: async name => { assert.equal(name, 'is_current_user_import_operator'); return { data: operator } }
 };
 const route=load('app/api/import-canonical-csv/route.ts', {
   'next/server': { NextResponse: { json: (body,o) => ({body,status:o?.status}) } },
   '@supabase/supabase-js': { createClient: () => customer },
   '@/lib/supabase-admin': { supabaseAdmin: admin },
   '@/lib/csv-source-ingestion': { ingestCsvObservation: async () => { ingests++; return {success:true} } }
 });
 function request(body) {
   let sent=false;
   const reader={
     read: async () => { if(sent)return {done:true}; sent=true; return {done:false,value:Buffer.from(body)} },
     cancel: async () => {}, releaseLock() {}
   };
   return {headers:{get:()=> 'Bearer token'},body:{getReader:()=>reader}};
 }
 let response=await route.POST(request('{}'));ok(response.status===403&&!ingests,'operator independently required before ingestion');operator=true;auth=false;response=await route.POST(request('{}'));ok(response.status===401&&!ingests,'authentication required');auth=true;
 response=await route.POST(request('{}'));ok(response.status===200&&ingests===1,'verified operator reaches server ingestion');
 response=await route.POST(request('x'.repeat(524289)));ok(response.status===409&&ingests===1,'streamed request bound before JSON processing');
 for(const f of ['publishCsvListings.ts','publishRentLeaseCsvListings.ts'])ok(fs.readFileSync(root+'/app/utils/'+f,'utf8').includes('submitCanonicalCsv')&&!fs.readFileSync(root+'/app/utils/'+f,'utf8').includes('.insert('),'browser direct writer removed '+f);
 console.log('CSV INGESTION OFFLINE ASSERTIONS',count)
})().catch(e=>{console.error(e);process.exitCode=1});
