const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
(async()=>{
 const source=fs.readFileSync(root+'/app/utils/updateListing.ts','utf8'),m={exports:{}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports,require:()=>({recordListingUpdated(){throw Error('unexpected activity')}})});
 await assert.rejects(m.exports.updateListing({supabase:{auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from(){throw Error('unexpected DB access')}},listingId:'listing',updates:{images:['stale.jpg']}}),/Unsupported legacy edit field/);
 for(const file of ['SaleListingEditForm','RentalListingEditForm']){
  const s=fs.readFileSync(root+'/app/components/'+file+'.tsx','utf8');assert.ok(!s.slice(s.indexOf('await updateListing('),s.indexOf('router.push(',s.indexOf('await updateListing('))).includes('propertyData.images.map('));assert.ok(s.includes('storageCleanupPending'));assert.ok(s.includes("deleteImage('', operationId)"));assert.ok(s.includes('Reintentar limpieza'));
 }
 const cron=fs.readFileSync(root+'/app/api/cron/cleanup-temporary-listing-images/route.ts','utf8');
 assert.ok(cron.indexOf("rpc('claim_abandoned_listing_token'")<cron.indexOf('.remove('));assert.ok(cron.includes('if (claimed.error) throw claimed.error'));assert.ok(cron.includes('if (!claimed.data) continue'));assert.ok(!cron.includes('.delete()'));
 console.log('PASS 4 media caller/cleanup containment cases (one executable legacy guard, two UI source contracts, one cron source contract)');
})().catch(e=>{console.error(e);process.exitCode=1});
