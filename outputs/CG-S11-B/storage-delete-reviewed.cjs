'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function validate(manifest){
 if(manifest.reviewed_count!==300||manifest.objects.length!==300)throw Error('Reviewed 300-object manifest required');
 const keys=new Set(),ids=new Set();for(const x of manifest.objects){if(x.bucket!=='listings-images'||typeof x.key!=='string'||!x.key||x.key.startsWith('/')||/^https?:/i.test(x.key)||x.key.split('/').some(p=>p==='.'||p==='..')||typeof x.id!=='string'||!x.id||keys.has(x.key)||ids.has(x.id))throw Error('Invalid/duplicate manifest entry');keys.add(x.key);ids.add(x.id)}
}
async function execute(manifest,api,record,priorAttempts=new Set()){
 validate(manifest);const before=await api.getBucket('listings-images');if(before.error||!before.data||before.data.id!=='listings-images')throw Error('Bucket metadata unavailable');
 const config=x=>JSON.stringify({id:x.id,name:x.name,public:x.public,file_size_limit:x.file_size_limit??x.fileSizeLimit??null,allowed_mime_types:x.allowed_mime_types??x.allowedMimeTypes??null});
 const counts={manifest:300,attempted:0,retryCount:0,deleteRequests:0,deleted:0,alreadyAbsent:0,failed:0};
 const absent=e=>e&&(String(e.statusCode)==='404'||e.code==='NoSuchKey');
 for(const item of manifest.objects){counts.attempted++;if(priorAttempts.has(item.key))counts.retryCount++;await record({event:'attempt',...item});
  try{
   const info=await api.info(item.key);
   if(info.error){if(absent(info.error)){counts.alreadyAbsent++;await record({event:'verified_absent',...item});continue}throw Error('Metadata lookup failed')}
   if(!info.data||info.data.id!==item.id)throw Error('Object identity mismatch; replacement is not authorized');
   await record({event:'delete_requested',...item,version:info.data.version??null});counts.deleteRequests++;
   // A lost response may follow a successful delete: final metadata, not response alone, decides.
   try{await api.remove([item.key])}catch{}
   const after=await api.info(item.key);
   if(!absent(after.error))throw Error('Deletion not verified; retain bounded retry state');
   counts.deleted++;await record({event:'verified_deleted',...item});
  }catch(e){counts.failed++;await record({event:'failed',...item,reason:e.message})}
 }
 const after=await api.getBucket('listings-images');
 if(after.error||!after.data||config(after.data)!==config(before.data))throw Error('Bucket configuration preservation failed');
 await record({event:'summary',...counts,bucketPreserved:true});return counts;
}
module.exports={validate,execute};
if(require.main===module){(async()=>{
 const flags=new Set(process.argv.slice(2));
 if(!['--execute-reviewed-storage-only','--ack-maintenance','--ack-db-purge-committed'].every(x=>flags.has(x)))throw Error('S11-C explicit execution acknowledgements required');
 const manifestPath=path.join(__dirname,'storage-manifest.json'),bytes=fs.readFileSync(manifestPath),manifest=JSON.parse(bytes),digest=hash(bytes);
 // Digest supplied by the reviewed package, not inferred from whatever file is present.
 if(process.env.S11_REVIEWED_MANIFEST_SHA256!==digest)throw Error('Reviewed manifest hash required');
 const url=process.env.S11_STORAGE_URL,key=process.env.S11_STORAGE_SERVICE_KEY;
 if(url!=='https://szhpqemhjyvvqgjgsmsw.supabase.co'||!key)throw Error('Explicit intended target URL and server credential required');
 const journal=process.env.S11_STORAGE_JOURNAL;if(!journal||!path.isAbsolute(journal))throw Error('Absolute durable journal path required');
 const lock=fs.openSync(journal+'.lock','wx',0o600);let fd;
 try{
  const priorAttempts=new Set();
  if(fs.existsSync(journal)){const rows=fs.readFileSync(journal,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);if(rows.some(x=>x.manifestSha256!==digest))throw Error('Journal manifest mismatch');for(const row of rows)if(row.event==='attempt')priorAttempts.add(row.key)}
  fd=fs.openSync(journal,'a',0o600);
  const record=async row=>{fs.writeSync(fd,JSON.stringify({at:new Date().toISOString(),manifestSha256:digest,...row})+'\n');fs.fsyncSync(fd)};
  const {createClient}=require('../../node_modules/@supabase/supabase-js');
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),bucket=client.storage.from('listings-images');
  const result=await execute(manifest,{getBucket:n=>client.storage.getBucket(n),info:k=>bucket.info(k),remove:ks=>bucket.remove(ks)},record,priorAttempts);
  console.log(JSON.stringify(result));if(result.failed)process.exitCode=1;
 }finally{if(fd!==undefined)fs.closeSync(fd);fs.closeSync(lock);fs.unlinkSync(journal+'.lock')}
})().catch(e=>{console.error(e.message);process.exitCode=1})}
