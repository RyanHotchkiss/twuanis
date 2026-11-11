const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..');let count=0;
function check(v,label){assert.ok(v,label);count++;console.log('PASS',label)}
for(const kind of ['sale','rent']){
 const source=fs.readFileSync(root+`/scripts/scrapers/encuentra24-${kind}-scraper.js`,'utf8');
 const start=source.indexOf('async function scrapeListing('),fetch=source.indexOf('await fetchHtml(',start),capture=source.indexOf('const observation_id = crypto.randomUUID()',start),time=source.indexOf('const observed_at = new Date().toISOString()',start);
 check(fetch<capture&&capture<time&&time<source.indexOf('const flightAd =',start),kind+' captures immediately after source page receipt');
 check(source.includes('  observation_id,\n  observed_at,\n  source_name:'),kind+' source row carries captured metadata');
 check(source.includes("'observation_id',\n    'observed_at',"),kind+' CSV serialization includes metadata');
 const normal=fs.readFileSync(root+`/scripts/scrapers/normalizers/encuentra24-${kind}-normalizer.js`,'utf8');
 const context={require(k){if(k==='fs'||k==='path'||k==='papaparse')return {};throw Error('forbidden '+k)},console};
 vm.createContext(context);vm.runInContext(normal.slice(0,normal.indexOf('const inputFile ='))+'\nthis.normalizeForTest = normalizeRow;',context);
 const row={source_name:'encuentra24',source_listing_id:'source-1',observation_id:'observation-A',observed_at:'2026-09-10T12:34:56.789Z',title:'Casa',raw_bedrooms:'2',raw_bathrooms:'1'};
 const a=context.normalizeForTest(row),retry=context.normalizeForTest(row);
 check(a.observation_id===row.observation_id&&retry.observation_id===a.observation_id,kind+' retry preserves observation identity');
 check(a.observed_at===row.observed_at&&retry.observed_at===a.observed_at,kind+' retry preserves observation time');
 check(a.source_name===row.source_name&&a.source_listing_id===row.source_listing_id,kind+' appearance identity remains distinct');
 const b=context.normalizeForTest({...row,observation_id:'observation-B',observed_at:'2026-09-12T12:34:56.789Z'});
 check(b.observation_id!==a.observation_id&&b.observed_at!==a.observed_at,kind+' distinct genuine observations remain distinct');
 const absent=context.normalizeForTest({...row,observation_id:undefined,observed_at:undefined});
 check(absent.observation_id===undefined&&absent.observed_at===undefined,kind+' missing evidence is not manufactured');
}
console.log('S7 OBSERVATION PROPAGATION ASSERTIONS',count);
