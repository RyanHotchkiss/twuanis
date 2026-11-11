import 'server-only'
import {createHash} from 'node:crypto'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {normalizeProfileImage,ImageFailure,MAX_IMAGE_BYTES} from '@/lib/account-identity/image-validation'
export type MediaCommand={operation:'upload.prepare'|'upload.complete'|'reference.retain'|'media.remove';institution:string;source:string;expected:string;reason:string;media:Record<string,unknown>}
export type MediaQuery={institution:string;after?:string;asset?:string}
export type MediaRow=Record<string,unknown>&{id:string;revision:string;state:'STAGED'|'REMOVED';rights_status:'UNVERIFIED';path:string|null}
export const remateUuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const objectPath=/^institutions\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|txt)$/
const hash=(b:Buffer)=>createHash('sha256').update(b).digest('hex')
function invalid():never{throw Error('INVALID_REQUEST')}
async function session(){const db=await createServerSupabaseClient(),a=await db.auth.getUser();if(a.error||!a.data.user)throw Error('AUTHORITY_DENIED');return db}
export async function commandMedia(request:string,c:MediaCommand){
 if(!remateUuid.test(request)||!c||Object.keys(c).some(k=>!['operation','institution','source','expected','reason','media'].includes(k))||!['upload.prepare','upload.complete','reference.retain','media.remove'].includes(c.operation)||!remateUuid.test(c.institution)||!remateUuid.test(c.source)||typeof c.expected!=='string'||!/^([1-9][0-9]{0,18})$/.test(c.expected)||typeof c.reason!=='string'||!c.reason.trim()||c.reason.length>2000||!c.media||Array.isArray(c.media)||typeof c.media!=='object'||Buffer.byteLength(JSON.stringify(c))>10000)invalid()
 const db=await session(),{data,error}=await db.rpc('remate_media_command',{p_request:request,p_command:c});if(error)throw Error(error.code==='42501'?'AUTHORITY_DENIED':['PT409','40001'].includes(error.code)?'STALE_REVISION':error.code==='54000'?'RATE_LIMIT':['23514','23505','22023','22P02','22003'].includes(error.code)?'INVALID_REQUEST':'MEDIA_UNAVAILABLE')
 if(!data||data.ok!==true||!remateUuid.test(data.id)||!remateUuid.test(data.receiptId)||typeof data.revision!=='string'||!/^([1-9][0-9]{0,18})$/.test(data.revision)||typeof data.replayed!=='boolean'||(data.path!==undefined&&(!objectPath.test(data.path)||!data.path.startsWith('institutions/'+c.institution+'/'))))invalid();return data as {ok:true;id:string;receiptId:string;revision:string;path?:string;replayed:boolean}
}
export async function readMedia(q:MediaQuery):Promise<{items:MediaRow[]}>{
 if(!q||Object.keys(q).some(k=>!['institution','after','asset'].includes(k))||!remateUuid.test(q.institution)||(q.after!==undefined&&!remateUuid.test(q.after))||(q.asset!==undefined&&!remateUuid.test(q.asset))||(q.after&&q.asset))invalid()
 const db=await session(),{data,error}=await db.rpc('remate_media_read',{p_query:q});if(error)throw Error('AUTHORITY_DENIED');if(!data||!Array.isArray(data.items)||data.items.length>26)invalid()
 const keys=['id','source_id','offering_id','observation_id','kind','mime','bytes','width','height','output_hash','source_url','rights_status','actor_id','receipt_id','reason','recorded_at','history','revision','state','placeholder','path'],seen=new Set<string>();
 for(const x of data.items){if(!x||!remateUuid.test(x.id)||seen.has(x.id)||Object.keys(x).some(k=>!keys.includes(k))||(x.source_url!==null&&x.source_url!==undefined&&(typeof x.source_url!=='string'||!/^https:\/\/[A-Za-z0-9.-]+(:443)?(\/[^\s?#]*)?$/.test(x.source_url)))||x.rights_status!=='UNVERIFIED'||x.placeholder!==true||!['STAGED','REMOVED'].includes(x.state)||typeof x.revision!=='string'||!/^([1-9][0-9]{0,18})$/.test(x.revision)||Buffer.byteLength(JSON.stringify(x))>10000||(x.path!==null&&(!objectPath.test(x.path)||!x.path.startsWith('institutions/'+q.institution+'/'))))invalid();seen.add(x.id)}return data
}
export async function normalizeRemateFile(bytes:Buffer,mime:string,name:string){
 if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)throw new ImageFailure('size')
 if(mime!=='text/plain'){const image=await normalizeProfileImage(bytes,mime,name);return {...image,mime:'image/webp'}}
 if(!/\.txt$/i.test(name)||name.length>255)throw new ImageFailure('format')
 let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw new ImageFailure('invalid')}
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]|<\/?[a-z!]|<\?|%PDF-|PK\x03\x04/i.test(text))throw new ImageFailure('invalid')
 const data=Buffer.from(text,'utf8');return {data,width:null,height:null,bytes:data.length,sha256:hash(bytes),outputHash:hash(data),mime:'text/plain'}
}
export async function uploadRemateFile(request:string,c:MediaCommand,bytes:Buffer,mime:string,name:string){
 if(c.operation!=='upload.prepare'||Object.keys(c.media).some(k=>!['offering','observation'].includes(k))||!remateUuid.test(String(c.media.offering))||!remateUuid.test(String(c.media.observation))||bytes.length>MAX_IMAGE_BYTES||!bytes.length||!['image/jpeg','image/png','image/webp','text/plain'].includes(mime)||name.length>255)invalid()
 const preparation:MediaCommand={...c,media:{...c.media,hash:hash(bytes),bytes:bytes.length,mime,name}},p=await commandMedia(request,preparation);if(!p.path)invalid()
 // Authorization/reservation precedes expensive image decode. Original bytes are never stored.
 const normalized=await normalizeRemateFile(bytes,mime,name),store=supabaseAdmin.storage.from('remates-media')
 const metadata={originalHash:hash(bytes),originalMime:mime,originalBytes:String(bytes.length),outputHash:normalized.outputHash,mime:normalized.mime,bytes:String(normalized.bytes),width:normalized.width===null?null:String(normalized.width),height:normalized.height===null?null:String(normalized.height)}
 const {error}=await store.upload(p.path,normalized.data,{contentType:normalized.mime,upsert:false,cacheControl:'0',metadata})
 if(error){const existing=await store.download(p.path);if(existing.error||!existing.data||existing.data.size>MAX_IMAGE_BYTES||hash(Buffer.from(await existing.data.arrayBuffer()))!==normalized.outputHash)throw Error('MEDIA_UNAVAILABLE')}
 // Separate deterministic command identity, never reuse preparation receipt for another payload.
 const completeRequest=createHash('sha256').update('remates-complete:'+request).digest('hex');const id=completeRequest.slice(0,8)+'-'+completeRequest.slice(8,12)+'-4'+completeRequest.slice(13,16)+'-a'+completeRequest.slice(17,20)+'-'+completeRequest.slice(20,32)
 return commandMedia(id,{...c,operation:'upload.complete',media:{upload:p.id}})
}
export async function retrieveRemateFile(q:MediaQuery){
 if(!q.asset)invalid();const row=(await readMedia(q)).items[0];if(!row||row.state!=='STAGED'||!row.path||!['IMAGE','DOCUMENT'].includes(String(row.kind)))throw Error('AUTHORITY_DENIED')
 const object=await supabaseAdmin.storage.from('remates-media').download(row.path);if(object.error||!object.data||object.data.size>MAX_IMAGE_BYTES)throw Error('MEDIA_UNAVAILABLE');const bytes=Buffer.from(await object.data.arrayBuffer());if(hash(bytes)!==row.output_hash||bytes.length!==row.bytes)throw Error('MEDIA_UNAVAILABLE')
 const current=(await readMedia(q)).items[0];if(!current||current.state!=='STAGED'||current.path!==row.path||current.revision!==row.revision)throw Error('AUTHORITY_DENIED');return {bytes,mime:String(row.mime)}
}
