const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=process.cwd(),req=require('module').createRequire(path.join(root,'package.json'));
const {extractSourcePropertyType:extract}=req('./scripts/scrapers/encuentra24-property-type');
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++}
const flight=(...ads)=>'<script>self.__next_f.push('+JSON.stringify([1,ads.map(ad=>'0:'+JSON.stringify({ad})).join('\n')])+')</script>';
const ad=(type,id='123')=>({id,link:'/source/'+id,subCategoryType:type});
(async()=>{
eq(extract(flight(ad('Casa')),'123'),'Casa');eq(extract(flight(ad(' Apartaménto ')),'123'),' Apartaménto ');
eq(extract(flight(ad('Casa','999')),'123'),'');eq(extract(flight(ad('Casa'),ad('Apartamento')),'123'),'');
eq(extract(flight(ad('Casa'),ad('Casa')),'123'),'Casa');eq(extract(flight({...ad('Casa'),link:'/source/999'}),'123'),'');
for(const type of ['',null,42,undefined,'  '])eq(extract(flight(ad(type)),'123'),'');
eq(extract('<h1>Casa</h1>','123'),'');eq(extract('<script>self.__next_f.push([bad])</script>','123'),'');
eq(extract(flight(ad('Casa')),''),'');eq(extract(flight({...ad('Casa'),subCategoryType:undefined,title:'Casa'}),'123'),'');
eq(extract(flight(ad('Casa'),ad(null)),'123'),'');
eq(extract(fs.readFileSync('scripts/scrapers/detail-page.html','utf8'),'32422931'),'Apartamento');
if(fs.existsSync('/private/tmp/s10-sale-source.html'))eq(extract(fs.readFileSync('/private/tmp/s10-sale-source.html','utf8'),'32595503'),'Casa');
let received;
const ts=req('typescript'),mod={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/csv-source-ingestion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:mod.exports,require:name=>{if(name==='server-only')return {};if(name==='@/lib/canonical-customer-edit')return {customerEditDomains:async(_db,changes)=>{received=changes;return {domains:{},content:{}}}};throw Error(name)}});
for(const kind of ['sale','rent']){
 const filename='scripts/scrapers/normalizers/encuentra24-'+kind+'-normalizer.js';const src=fs.readFileSync(filename,'utf8').split('const inputFile = process.argv[2]')[0];
 const context={require:req};vm.runInNewContext(src+'\nthis.normalize = normalizeRow',context);
 const raw={source_name:'encuentra24',source_listing_id:'123',observation_id:'9b00dfb0-aa6c-4d55-8b20-91b5ab54cf08',observed_at:'2026-09-19T00:00:00Z',transaction_type:kind,currency:'USD',current_price:'100',monthly_price:'100',property_type:kind==='sale'?'Casa':'Apartamento',raw_property_type:kind==='sale'?'Casa':'Apartamento',title:'Bodega title must not become the source type',province:'P',canton:'C',district:''};
 const normalized=context.normalize(raw);eq(JSON.parse(normalized.source_observation_input),raw);eq(JSON.parse(normalized.unresolved_normalizer_review).canonical_authority,false);
 eq(context.normalize(raw).source_observation_input,normalized.source_observation_input);
 const calls=[];const db={rpc:async(name,input)=>{calls.push({name,input});return {data:name==='retain_csv_source_evidence'?'evidence':name==='create_csv_canonical_listing'?{listing_id:'listing',csv_creation_receipt:'receipt'}:{listing_id:'listing'}}}};
 const result=await mod.exports.ingestCsvObservation(db,normalized);eq(result.success,true);eq(received.property_type,raw.property_type);eq(calls[0].input.p_raw.property_type,raw.property_type);
 const bad={...raw,property_type:''};const failed=await mod.exports.ingestCsvObservation(db,context.normalize(bad));eq(failed.success,false);eq(calls.at(-1).name,'retain_csv_source_evidence');
 const scraper=fs.readFileSync('scripts/scrapers/encuentra24-'+kind+'-scraper.js','utf8');eq(scraper.includes('raw_property_type: title'),false);eq(scraper.includes('property_type: sourcePropertyType,\n  raw_property_type: sourcePropertyType,'),true);eq(scraper.includes("    'property_type',\n    'raw_property_type',"),true);
}
console.log(checks+' property-type contract assertions passed; no network or database calls.');
})().catch(e=>{console.error(e);process.exitCode=1});
