const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),ts=require('typescript');let checks=0;
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/components/market-comparison/contract.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){throw Error('Unexpected runtime dependency '+k)}});
function check(a,b,w){assert.deepEqual(Array.from(m.exports.pairWidths(a,b)),w);checks++}
check(100,200,[50,100]);check(200,100,[100,50]);check(200,200,[100,100]);check(null,200,[null,100]);check(200,null,[100,null]);check(null,null,[null,null]);check(undefined,undefined,[null,null]);check(0,200,[0,100]);check(0,0,[0,0]);check(Infinity,200,[null,100]);check(NaN,-1,[null,null]);check(0.25,0.5,[50,100]);
assert.equal(m.exports.comparisonQuestion.en,'How do two defined Costa Rica real estate markets differ?');checks++;assert.equal(m.exports.comparisonQuestion.es,'¿Cómo difieren dos mercados inmobiliarios definidos de Costa Rica?');checks++;
console.log('MARKET COMPARISON PRESENTATION PASS',checks,'offline scale/identity checks');
