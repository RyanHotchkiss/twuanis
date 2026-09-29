const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');let checks=0;const eq=(a,b)=>{assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));checks++};
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return{};throw Error('Projection attempted runtime dependency/acquisition: '+k)}});return m.exports}
const {explainMarketPreference:explain}=load('lib/market-matching-explanation.ts');
const req={terms:[{id:'1',dimension:'utility',label:'Fiber'},{id:'2',dimension:'legal_status',label:'Titled'},{id:'3',dimension:'parking',label:'Two spaces'}],year:null,road:null,propertyArea:{min:500,max:1000}};
const ev={canonical:new Map([['a',{facts:[{dimension:'parking',kind:'category',category_term_id:'4'}],selections:[{dimension:'utility',ontology_term_id:'1',term_name:'Fiber'},{dimension:'utility',ontology_term_id:'99',term_name:'UNRELATED'},{dimension:'legal_status',ontology_term_id:'5',term_name:'Concession'}]}]]),classifications:new Map()};
const pref=(dimension,identity,state)=>({dimension,identity,state,label:'x'}),row={id:'a',property_area:'1250',owner_id:'SECRET'};
let x=explain(req,row,ev,pref('utility','1','MATCH'));eq(x.candidate,{kind:'term',id:'1',label:'Fiber'});eq(JSON.stringify(x).includes('UNRELATED'),false);eq(x.selected.id,'1');
x=explain(req,row,ev,pref('legal_status','2','NONMATCH'));eq(x.candidate,{kind:'term',id:'5',label:'Concession'});
x=explain(req,row,ev,pref('parking','3','NONMATCH'));eq(x.candidate,{kind:'term',id:'4'});
x=explain(req,row,ev,pref('property_area','range','NONMATCH'));eq(x.candidate,{kind:'exact',value:'1250'});eq(x.selected,{kind:'range',lower:'500',upper:'1000',lowerInclusive:true,upperInclusive:false});eq(JSON.stringify(x).includes('SECRET'),false);
x=explain(req,{id:'missing',property_area:null},ev,pref('property_area','range','UNKNOWN'));eq(x.candidate,{kind:'unknown'});
req.year={interval:{lower:1980,upper:1990,lowerInclusive:true,upperInclusive:false}};ev.canonical.get('a').facts.push({dimension:'year_built',kind:'range',range_lower:'1975',range_upper:'1985',lower_inclusive:true,upper_inclusive:false});x=explain(req,row,ev,pref('year_built','range','UNKNOWN'));eq(x.candidate,{kind:'range',lower:'1975',upper:'1985',lowerInclusive:true,upperInclusive:false});eq(x.selected.lower,'1980');
ev.classifications.set('a',new Set(['3']));x=explain(req,row,ev,pref('parking','3','MATCH'));eq(x.candidate,{kind:'term',id:'3',label:'Two spaces'});
console.log('MATCHING EXPLANATION PASS',checks,'pure projection checks; no runtime acquisition dependencies');
