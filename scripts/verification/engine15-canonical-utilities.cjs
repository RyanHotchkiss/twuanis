const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'s9-phase12a-integration.cjs'),'utf8').split('(async()=>{')[0];
const strict=source.replace("calls.push({table,filters,cols,start,single});", "if(table==='listings')assert.ok(!/(?:^|[,\\s])utilities(?:[,\\s]|$)/.test(cols),'nonexistent utilities projection');calls.push({table,filters,cols,start,single});");
const body=String.raw`
(async()=>{
 const utility={id:1156,term_type:'utility',term_name:'Water',term_name_en:'Water',term_name_es:'Agua',slug:'water',slug_en:'water',slug_es:'agua'};
 terms.push(utility);
 for(const id of [uuid(1),uuid(2)])assignments.push({listing_id:id,ontology_term_id:'1156',ontology_terms:utility});
 const result=await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:['utility']});
 const resultAnalysis=analyze(result,['utility']);
 ok(result.subject.characteristics.some(t=>t.ontologyTermId===1156),'canonical subject utility relationship');
 ok(result.memberships.find(m=>m.listingId===uuid(2)).ontologyTermIds.includes(1156),'canonical peer utility relationship');
 ok(!result.memberships.find(m=>m.listingId===uuid(3)).ontologyTermIds.includes(1156),'absent utility not fabricated');
 ok(resultAnalysis.population.sampleSize===1,'exact one comparable peer with same utility');
 assignments.splice(assignments.findIndex(a=>a.listing_id===uuid(1)&&a.ontology_term_id==='1156'),1);
 const absent=await loader.loadPriceMeterComparableBoundedPopulation(request);
 ok(!absent.subject.characteristics.some(t=>t.termType==='utility'),'subject without utilities stays absent');
 ok(analyze(absent).population.sampleSize===27,'unconstrained membership unchanged');
 await assert.rejects(()=>loader.loadPriceMeterComparableBoundedPopulation({...request,subjectListingId:uuid(999999)}),/not found/);checks++;
 console.log(JSON.stringify({status:'PASS',checks,liveIO:false}));
})().catch(e=>{console.error(e);process.exitCode=1});`;
new Function('require','__dirname',strict+body)(require,__dirname);
