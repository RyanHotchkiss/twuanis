const fs=require('fs');
let prefix=fs.readFileSync(__dirname+'/s9-phase12a-integration.cjs','utf8').split('(async()=>{')[0];
prefix=prefix.replace('const loader=load',`let constructed=[];const builder=load('lib/price-meter-observation-builder.ts'),build=builder.buildPriceMeterObservations;builder.buildPriceMeterObservations=(...args)=>{const out=build(...args);constructed.push(...out);return out};const loader=load`);
const body=String.raw`
(async()=>{
 const dto=load('lib/price-meter-comparable-dto.ts'),presentation=load('lib/price-meter-comparable-presentation.ts');let sample;
 for(const transaction of ['sale','rent'])for(const basis of ['land','construction'])for(const currencyCase of ['CRC','USD-subject','USD-peer'])for(const dims of [[],['year_built'],['bedrooms','year_built']]){
 rows[0].transaction_type=transaction;rows[0].monthly_price=750;rows[0].currency=currencyCase==='USD-subject'?'USD':'CRC';rowFor(uuid(2)).currency=currencyCase==='USD-peer'?'USD':'CRC';request.normalizationBasis=basis;
 const results=[],metrics=[];
 for(const selectedOnly of [false,true]){constructed=[];calls=[];rpcIds=[];fxCalls=0;const r=await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:dims,selectedOnly});const a=analyze(r,dims);results.push(JSON.parse(JSON.stringify({r,a,dto:dto.toPriceMeterComparableEvidenceDTO(a),presentation:presentation.buildPriceMeterComparablePresentation({subject:a.subject,observation:r.subject.observation})})));metrics.push({observations:constructed.length,subject:constructed.filter(o=>o.listingId===uuid(1)).length,siblings:constructed.filter(o=>o.normalizationBasis!==basis).length,queries:calls.length,hydrated:rpcIds.length,fx:fxCalls});}
 assert.deepEqual(results[1],results[0]);checks++;ok(metrics[1].siblings===0,'zero unrequested identities');ok(metrics[1].subject===1,'one subject observation');ok(metrics[1].queries===metrics[0].queries&&metrics[1].hydrated===metrics[0].hydrated&&metrics[1].fx===metrics[0].fx,'unchanged acquisition');sample??=metrics;
 }

 mocks['@/lib/geography/resolve-listing-geography'].loadCanonicalGeographyTerms=async()=>[province,canton];
 for(const row of rows){row.canonical_domain_version=null;row.property_type='house';row.province=province.term_name;row.canton=canton.term_name;row.currency='CRC';row.transaction_type='sale'}
 for(const basis of ['land','construction'])for(const dims of [[],['year_built']]){
 request.normalizationBasis=basis;const pair=[];
 for(const selectedOnly of [false,true]){constructed=[];const r=await loader.loadPriceMeterComparableBoundedPopulation({...request,activeDimensions:dims,selectedOnly});const a=analyze(r,dims);pair.push(JSON.parse(JSON.stringify({r,a,dto:dto.toPriceMeterComparableEvidenceDTO(a)})));if(selectedOnly)ok(constructed.every(o=>o.normalizationBasis===basis),'legacy no siblings')}
 assert.deepEqual(pair[1],pair[0]);checks++;
 }
 console.log(JSON.stringify({status:'PASS',checks,parityCases:40,legacyParityCases:4,sample,liveIO:false}));
})().catch(e=>{console.error(e);process.exitCode=1});`;
new Function('require','__dirname',prefix+body)(require,__dirname);
