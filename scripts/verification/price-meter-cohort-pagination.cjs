// Reuse the established fake PostgREST client against the unchanged real candidate loader.
const fs=require('fs'),vm=require('vm'),path=require('path');
const base=fs.readFileSync(path.join(__dirname,'s9-comparison-population.cjs'),'utf8').split('(async()=>')[0];
(async()=>{for(const size of [0,1,24,25,26,499,500,501]){
 let source=base.replace(/const source=\[.*?\];/,`const source=Array.from({length:${size}},(_,i)=>listing(i));`)
 .replaceAll('from+2','from+500');
 source+=`(async()=>{const result=await load('lib/price-meter-comparison-candidate-loader.ts').loadPriceMeterComparisonCandidates(req);ok(result.listings.length===${size},'complete population');ok(new Set(result.listings.map(r=>r.id)).size===${size},'distinct union');const geographies=calls.filter(c=>c.filters.some(([k,v])=>k==='ontology_term_id'&&v==='100'));ok(geographies.length===Math.max(1,Math.ceil(${size}/500)),'exact geography pages');ok(calls.length===Math.max(1,Math.ceil(${size}/500))+2*Math.ceil(${size}/25),'bounded semantic/listing pages');console.log('ENGINE 11 PAGINATION',${size},'MOCK READS',calls.length,'CHECKS',checks)})()`;
 await vm.runInNewContext(source,{require,console,process},{filename:'cohort-pagination-fixture'});
}})().catch(e=>{console.error(e);process.exitCode=1});
