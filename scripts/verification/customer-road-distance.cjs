const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript'),m={exports:{}};let checks=0;
vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/lib/canonical-customer-road-distance.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,require(k){if(k==='server-only')return {};throw Error(k)},fetch(){throw Error('network forbidden')}});
const {customerRoadDistanceRange:range,applyCustomerRoadDistanceEdit:apply}=m.exports;
function ok(v,label){assert.ok(v,label);checks++;console.log('PASS',label)}
const options=['under_100m','100_500m','500_1000m','1_5km','over_5km'];
for(const [value,winner] of [[0,0],[99.999,0],[100,1],[499.999,1],[500,2],[999.999,2],[1000,3],[4999.999,3],[5000,3],[5000.001,4],[1000000,4]]){
 const hits=options.map(range).map(r=> (r.lower_inclusive?value>=Number(r.lower):value>Number(r.lower))&&(r.upper===null||(r.upper_inclusive?value<=Number(r.upper):value<Number(r.upper))));
 ok(hits.filter(Boolean).length===1&&hits[winner],'one authoritative interval for '+value);
}
for(const option of options){const r=range(option);ok(r.kind==='range'&&!('value'in r)&&!('term'in r),'no exact/imputed/category value for '+option)}
for(const value of [0,500,null,'500','[100,500)','__proto__','constructor','legacy-value']){assert.throws(()=>range(value));checks++}
async function run(overrides={}){let calls=[];const input={listingId:'07000000-0000-0000-0000-000000001401',requestId:'07000000-0000-0000-0000-000000001402',expectedRevision:'7',selectedRange:'100_500m',...overrides.input};
 const row={id:input.listingId,owner_id:'owner',canonical_domain_version:1,...overrides.row};
 const q={select(){return q},eq(){return q},async maybeSingle(){return {data:row,error:overrides.readError?Error('read'):null}}};
 const client={auth:{getUser:async()=>({data:{user:overrides.noUser?null:{id:'owner'}}})},from(){return q},rpc:async(name,args)=>{calls.push({name,args});return {data:{listing_id:input.listingId,revision:'8'},error:overrides.rpcError?{message:'stale'}:null}}};
 try{return {value:await apply(client,input),calls}}catch(error){return {error,calls}}
}
(async()=>{
 let r=await run();ok(r.calls.length===1&&r.calls[0].name==='mutate_customer_canonical_listing','established customer boundary');
 ok(JSON.stringify(r.calls[0].args.p_domains)===JSON.stringify({facts:{distance_to_paved_road:range('100_500m')}}),'only approved range domain forwarded');
 ok(r.calls[0].args.p_request==='07000000-0000-0000-0000-000000001402'&&r.calls[0].args.p_expected==='7','revision and stable request forwarded');
 r=await run({input:{selectedRange:undefined}});ok(r.value.unchanged===true&&!r.calls.length,'no new selection preserves existing exact or range evidence without mutation');
 for(const version of [null,undefined,'1',0,2]){r=await run({row:{canonical_domain_version:version}});ok(r.error&&!r.calls.length,'no legacy/unknown conversion '+String(version))}
 for(const options of [{noUser:true},{row:{owner_id:'other'}},{readError:true},{input:{expectedRevision:'9223372036854775808'}},{input:{selectedRange:'legacy-string'}}]){r=await run(options);ok(r.error&&!r.calls.length,'invalid authority/input has no mutation')}
 r=await run({rpcError:true});ok(r.error?.message==='stale','canonical failure not hidden');
 console.log('CUSTOMER ROAD-DISTANCE ASSERTIONS',checks);
})().catch(e=>{console.error(e);process.exitCode=1});
