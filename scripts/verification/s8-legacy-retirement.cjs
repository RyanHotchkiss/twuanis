'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS',label)};
function load(file){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(name){if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options.status})}};throw Error('Unexpected runtime dependency '+name)},fetch(){throw Error('Network forbidden')}});return m.exports}
(async()=>{
 const edit=load('app/utils/updateListing.ts');let accessed=0;const forbidden=new Proxy({}, {get(){accessed++;throw Error('Database access forbidden')}});
 for(const updates of [{title:'changed'},{listing_status:'active'},{current_price:1},{canonical_domain_version:1},{images:['x']},{}]){await assert.rejects(edit.updateListing({supabase:forbidden,listingId:'id',updates}),/retired/);ok(accessed===0,'legacy edit rejects before authority/database access '+JSON.stringify(updates))}
 const route=load('app/api/permanently-delete-listing/route.ts');for(const value of [null,1,undefined]){const result=await route.POST({json(){throw Error('Request must not be consumed')},canonical_domain_version:value});ok(result.status===410&&!result.body.success,'permanent deletion retired '+value)}
 const source=fs.readFileSync('app/components/ListingOperationsCenter.tsx','utf8');
 for(const name of ['canPublish','canEdit','canRenew','canUnpublish','canArchive','canRestore','canRemove','canDuplicate']){
 const match=source.match(new RegExp('const '+name+' =\\s*([\\s\\S]*?)(?=\\n\\s*const )'));assert.ok(match,name);
 for(const version of [null,undefined,'1',1]){const result=vm.runInNewContext(match[1],{currentListing:{canonicalDomainVersion:version},lifecycle:{availableActions:{includes:()=>true}}});ok(result===(version===1),name+' discriminator '+version)}
 }
 ok(/const canPermanentDelete = false/.test(source),'no actionable permanent deletion');
 for(const file of ['SaleListingEditForm.tsx','RentalListingEditForm.tsx']){const s=fs.readFileSync('app/components/'+file,'utf8');ok(s.includes('await submitCanonicalCustomerEdit(')&&s.includes('listing.canonical_domain_version === 1'),'canonical form dispatch preserved '+file)}
 console.log('S8 RETIREMENT CHECKS',checks)
})().catch(e=>{console.error(e);process.exitCode=1});
