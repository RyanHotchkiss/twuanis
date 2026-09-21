// Offline: evaluate the actual normalizer functions, never the CLI/file writer.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),Papa=require(root+'/node_modules/papaparse');let checks=0;
function ok(v,message){assert.ok(v,message);checks++;console.log('PASS',message)}
for(const kind of ['sale','rent']) {
 const source=fs.readFileSync(root+`/scripts/scrapers/normalizers/encuentra24-${kind}-normalizer.js`,'utf8');
 const code=source.slice(0,source.indexOf('const inputFile = process.argv[2]'));
 const context={require(name){if(name==='fs')return new Proxy({},{get(){throw Error('filesystem activity forbidden')}});if(name==='path')return path;if(name==='papaparse')return Papa;throw Error(name)},fetch(){throw Error('network forbidden')},row:{source_name:'encuentra24',source_listing_id:'example',observation_id:'observed-id',observed_at:'2026-09-01T12:34:56Z',transaction_type:kind,raw_bathrooms:'2.5',raw_bedrooms:'7',raw_parking:'5',raw_year_built:'1997',raw_property_area:'1.25 ha',raw_construction_area:'85.75 m²',description:'casa cerca de playa',monthly_price:'123.45',currency:'USD',unknown_source_field:'unmodified\ntext',images:'https://photos.encuentra24.com/example.jpg'}};
 vm.createContext(context);vm.runInContext(code+'\nresult=normalizeRow(row)',context);
 const n=context.result,raw=JSON.parse(n.source_observation_input),review=JSON.parse(n.unresolved_normalizer_review);
 ok(JSON.stringify(raw)===JSON.stringify(context.row),kind+' all input fields preserved without modification');
 ok(raw.raw_bathrooms==='2.5'&&raw.raw_year_built==='1997',kind+' exact fractional/year evidence not replaced by labels');
 ok(raw.raw_property_area==='1.25 ha'&&raw.raw_construction_area==='85.75 m²',kind+' original measurement strings/units retained');
 ok(raw.monthly_price==='123.45',kind+' original monetary fraction retained');
 ok(review.status==='unresolved'&&review.canonical_authority===false,kind+' transformed values explicitly noncanonical');
 ok(review.values.bathrooms===n.bathrooms&&review.values.environment===n.environment,kind+' heuristic outputs retained separately');
 ok(n.observation_id===context.row.observation_id&&n.observed_at===context.row.observed_at,kind+' genuine observation metadata unchanged');
 const csv=Papa.unparse([n]);const parsed=Papa.parse(csv,{header:true}).data[0];
 ok(JSON.stringify(JSON.parse(parsed.source_observation_input))===JSON.stringify(context.row),kind+' CSV escaping round-trips raw snapshot');
 ok(JSON.parse(parsed.unresolved_normalizer_review).canonical_authority===false,kind+' CSV round-trips review distinction');
 context.row={};vm.runInContext('result=normalizeRow(row)',context);
 ok(!('observation_id' in JSON.parse(context.result.source_observation_input))&&context.result.observation_id===undefined,kind+' missing metadata never fabricated');
}
console.log('CSV PROVENANCE ASSERTIONS',checks);
