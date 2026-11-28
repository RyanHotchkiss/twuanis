'use strict';
// Exercise the actual request-local memoization boundary without a database.
const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('typescript');
const moduleRecord={exports:{}};
const source=fs.readFileSync('lib/orchestrator-execution-context.ts','utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('require','module','exports',code)(name=>name==='server-only'?{}:require(name),moduleRecord,moduleRecord.exports);
const {withOrchestratorContext,orchestratorMemo}=moduleRecord.exports;
(async()=>{
 const cache=new Map(),base={identity:{executionId:'e1',accountId:'a1',requestId:'r1',orchestrator:'o',population:'SALE'},phase:'execution',cache,metrics:{hits:0,misses:0}};
 let count=0;const run=()=>Promise.resolve(++count);
 async function acquire(state,kind='population',key='scope'){return withOrchestratorContext(state,()=>orchestratorMemo(kind,key,run))}
 assert.equal(await acquire(base),1);assert.equal(await acquire(base),1);
 for(const patch of [{accountId:'a2'},{executionId:'e2'},{requestId:'r2'},{orchestrator:'o2'},{population:'RENT'}])assert.notEqual(await acquire({...base,identity:{...base.identity,...patch}}),1);
 assert.notEqual(await acquire({...base,phase:'freshness'}),1);
 assert.notEqual(await acquire(base,'dictionary'),1);assert.notEqual(await acquire(base,'population','other-scope'),1);
 let attempts=0;await assert.rejects(()=>withOrchestratorContext(base,()=>orchestratorMemo('failed','key',async()=>{attempts++;throw Error('expected failure')})),/expected failure/);
 assert.equal(await withOrchestratorContext(base,()=>orchestratorMemo('failed','key',async()=>{attempts++;return 'recovered'})),'recovered');assert.equal(attempts,2);
 console.log('PASS: cache isolates account, execution, request, orchestrator, population, phase, key and kind; rejected work can recover.');
})().catch(e=>{console.error(e);process.exitCode=1});
