const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../..');
const original=fs.readFileSync(path.join(__dirname,'s9-phase12a-integration.cjs'),'utf8').split('(async()=>{')[0];
async function run(before){
 let source=original.replace("const page=data.slice(start,Math.min(end+1,start+2));",`let page=data.slice(start,Math.min(end+1,start+pageCap));
 const geographic=table==='listings_ontology_terms'&&cols.includes('listings!inner');
 const membership=table==='listings_ontology_terms'&&cols.includes('ontology_terms!inner');
 if(mode==='repeated-geography'&&geographic)page=data.slice(0,Math.min(pageCap,count-start));
 if(mode==='cross-page-duplicate'&&geographic&&start>0&&page.length)page[0]=data[0];
 if(mode==='duplicate-membership'&&membership&&start>0&&page.length)page[0]=data[0];
 if(mode==='duplicate-listing'&&table==='listings'&&page.length>1)page[1]=page[0];
 if(mode==='missing-listing'&&table==='listings'&&filters.some(f=>f[0]==='in')&&start===0)page=page.slice(1);
 if(mode==='null-page'&&geographic)page=null;
 if(mode==='oversized'&&geographic)page=Array.from({length:501},()=>data[0]);`)
 .replace('page.map(row=>row.id??row.listing_id)','page?.map(row=>row.id??row.listing_id)')
 .replace("const count=data.length;", "let count=data.length;if(mode==='missing-listing'&&table==='listings'&&filters.some(f=>f[0]==='in')){data=data.filter(r=>r.id!==uuid(2));count=data.length}")
 .replace("if(mode==='missing-listing'&&table==='listings'&&filters.some(f=>f[0]==='in')&&start===0)page=page.slice(1);",'')
 .replace("fs.readFileSync(file,'utf8')+",before?"fs.readFileSync(file.endsWith('/price-meter-comparable-loader.ts')?root+'/scripts/verification/fixtures/engine15-loader-before-completeness.txt':file,'utf8')+":"fs.readFileSync(file,'utf8')+")
 .replace('let checks=0,', 'let pageCap=2;let checks=0,')
 .replace('const loader=load',`let peerObservations=0,distributions=0;
 const builder=load('lib/price-meter-observation-builder.ts'),build=builder.buildPriceMeterObservations;
 builder.buildPriceMeterObservations=(rows,...args)=>{const result=build(rows,...args);peerObservations+=result.filter(o=>o.listingId!==uuid(1)).length;return result};
 const dist=load('lib/price-meter-distribution.ts'),buildDist=dist.buildPriceMeterDistribution;dist.buildPriceMeterDistribution=(...args)=>{distributions++;return buildDist(...args)};
 const loader=load`);
 const tail=String.raw`
 return (async()=>{
 const outputs=[];
 const dto=load('lib/price-meter-comparable-dto.ts');
 for(const transaction of ['sale','rent'])for(const normalizationBasis of ['land','construction'])for(const cap of [1,2,3,7,25,500])for(const dimensions of [[],['year_built'],['bedrooms','year_built']]){
  pageCap=cap;calls=[];rpcIds=[];mode='normal';rows[0].transaction_type=transaction;rows[0].monthly_price=750;request.normalizationBasis=normalizationBasis;
  const result=await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:dimensions});const a=analyze(result,dimensions);
  outputs.push(JSON.parse(JSON.stringify({loaded:result,analysis:a,projection:dto.toPriceMeterComparableEvidenceDTO(a)})));checks++;
 }
 request.normalizationBasis='land';rows[0].transaction_type='sale';let corruptBaseline;
 for(const failure of ['repeated-geography','cross-page-duplicate','duplicate-membership','duplicate-listing','missing-listing','null-page','oversized','truncated','changed-count','missing-count','query-error','hydrate-error']){
  mode=failure;pageCap=2;calls=[];rpcIds=[];peerObservations=0;distributions=0;
  let result,error;try{result=analyze(await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:['year_built']}))}catch(e){error=e}
  if(BEFORE){if(failure==='repeated-geography')corruptBaseline={n:result?.population.sampleSize,status:result?dto.toPriceMeterComparableEvidenceDTO(result).status:null};}
  else {ok(!!error,'fail closed '+failure);ok(peerObservations===0&&distributions===0,'no peer observations or statistics '+failure);}
 }
 mode='normal';pageCap=500;const clean=await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:[]});
 rowFor(uuid(30)).property_type='house';
 const legacy=await loader.verificationLegacyCandidates({subject:clean.subject.identity,geography:canton,subjectListing:rows[0]});outputs.push(JSON.parse(JSON.stringify(legacy)));checks++;
 if(!BEFORE){for(let i=100;i<128;i++)rows.push(listing(i,{canonical_domain_version:null,property_type:'house'}));pageCap=2;const all=await loader.verificationLegacyCandidates({subject:clean.subject.identity,geography:canton,subjectListing:rows[0]});ok(all.length===29&&new Set(all.map(r=>r.id)).size===29,'complete legacy-null transport under capped pages');}
 return {outputs,checks,corruptBaseline};
 })();`;
 return new Function('require','__dirname',source+tail.replaceAll('BEFORE',JSON.stringify(before)))(require,__dirname);
}
(async()=>{const before=await run(true),after=await run(false);require('assert/strict').deepEqual(after.outputs,before.outputs);console.log(JSON.stringify({status:'PASS',validFullResultComparisons:after.outputs.length,checks:after.checks+after.outputs.length,oldRepeatedTransport:before.corruptBaseline,newRepeatedTransport:'rejected',liveIO:false}));})().catch(e=>{console.error(e);process.exitCode=1});
