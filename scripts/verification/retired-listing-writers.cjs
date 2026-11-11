const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
(async()=>{
 for(const name of ['createListing','createRentalListing','publishListing','unpublishListing','archiveListing','deleteListing']) {
  const m={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/app/utils/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports,require(){return new Proxy({},{get(){throw Error('database/activity access forbidden')}})},fetch(){throw Error('network forbidden')}});
  await assert.rejects(m.exports[name]({id:'canonical'}),/retired/);
  console.log('PASS retired before any database/activity access',name)
 }
 console.log('RETIRED WRITER CHECKS 6')
})().catch(e=>{console.error(e);process.exitCode=1});
