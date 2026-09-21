const assert=require('node:assert/strict'),fs=require('node:fs');
const root='/Users/cassidydaddy/twuanis/outputs/CG-S11-B';const {execute,validate}=require(root+'/storage-delete-reviewed.cjs');
const m=JSON.parse(fs.readFileSync(root+'/storage-manifest.json','utf8'));
(async()=>{let tests=0;
for(const mode of ['success','replay','lostresponse','denied','replacement','new-object','changed-bucket','wrong-bucket']){
 const objects=new Map(m.objects.map(x=>[x.key,{id:x.id,version:'v1'}]));const extra='future-object.jpg';if(mode==='replay')objects.clear();if(mode==='replacement')objects.set(m.objects[0].key,{id:'replacement'});if(mode==='new-object')objects.set(extra,{id:'future'});
 const records=[],removed=[];let buckets=0;
 const api={async getBucket(){buckets++;return {data:{id:mode==='wrong-bucket'?'wrong':'listings-images',name:'listings-images',public:mode==='changed-bucket'&&buckets>1?false:true},error:null}},async info(k){return objects.has(k)?{data:objects.get(k),error:null}:{data:null,error:{statusCode:404}}},async remove(keys){assert.equal(keys.length,1);removed.push(keys[0]);if(mode==='denied')return {error:{statusCode:403}};objects.delete(keys[0]);if(mode==='lostresponse')throw Error('response lost');return {error:null}}};
 if(mode==='changed-bucket'||mode==='wrong-bucket'){await assert.rejects(()=>execute(m,api,async x=>records.push(x)));tests++;continue}
 const c=await execute(m,api,async x=>records.push(x),mode==='replay'?new Set(m.objects.map(x=>x.key)):new Set());assert.equal(c.attempted,300);
 assert.equal(c.failed,mode==='denied'?300:mode==='replacement'?1:0);
 if(mode==='replay'){assert.equal(removed.length,0);assert.equal(c.retryCount,300)}else assert.equal(c.retryCount,0);
 if(mode==='replacement'){assert.ok(objects.has(m.objects[0].key));assert.ok(!removed.includes(m.objects[0].key))}
 if(mode==='new-object')assert.ok(objects.has(extra));
 if(mode==='lostresponse')assert.equal(c.deleted,300);
 assert.equal(records.filter(x=>x.event==='attempt').length,300);tests++;
}
assert.throws(()=>validate({...m,reviewed_count:301}));tests++;
assert.throws(()=>validate({...m,objects:m.objects.map((x,i)=>i?x:{...x,key:'https://external.invalid/a'})}));tests++;
console.log('PASS '+tests+' storage offline scenarios; zero network or real deletion');})().catch(e=>{console.error(e);process.exitCode=1});
