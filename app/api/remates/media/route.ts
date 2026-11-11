import {commandMedia,readMedia,uploadRemateFile,retrieveRemateFile,type MediaCommand} from '@/lib/remates/media'
import {readImageBody,ImageFailure} from '@/lib/account-identity/image-validation'
export const runtime='nodejs'
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})
async function handle(request:Request){try{
 if(request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return response({ok:false},403)
 if(request.method==='GET'){const u=new URL(request.url);if([...u.searchParams.keys()].some(k=>!['institution','asset','after'].includes(k)))throw Error('INVALID_REQUEST');const q={institution:u.searchParams.get('institution')||'',...(u.searchParams.has('asset')?{asset:u.searchParams.get('asset')!}:{}),...(u.searchParams.has('after')?{after:u.searchParams.get('after')!}:{})};if(!q.asset)return response({ok:true,data:await readMedia(q)});const file=await retrieveRemateFile(q);return new Response(new Uint8Array(file.bytes),{headers:{'Content-Type':file.mime,'Content-Disposition':'attachment; filename="remates-media.'+(file.mime==='text/plain'?'txt':'webp')+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}})}
 const raw=request.headers.get('x-remate-command')||'';if(raw.length>10000)throw Error('INVALID_REQUEST');const c=JSON.parse(decodeURIComponent(raw)) as MediaCommand,id=request.headers.get('x-remate-request')||''
 if(request.method==='DELETE'){if(c.operation!=='media.remove')throw Error('INVALID_REQUEST');return response({ok:true,data:await commandMedia(id,c)})}
 if(request.method==='POST'){let name:string;try{name=decodeURIComponent(request.headers.get('x-remate-name')||'')}catch{throw Error('INVALID_REQUEST')}return response({ok:true,data:await uploadRemateFile(id,c,await readImageBody(request),request.headers.get('content-type')||'',name)})}
 return response({ok:false},405)
 }catch(e){const code=e instanceof ImageFailure?e.reason:e instanceof Error?e.message:'MEDIA_UNAVAILABLE';return response({ok:false,error:['INVALID_REQUEST','AUTHORITY_DENIED','STALE_REVISION','RATE_LIMIT','format','size','invalid'].includes(code)?code:'MEDIA_UNAVAILABLE'},code==='AUTHORITY_DENIED'?403:code==='STALE_REVISION'?409:code==='RATE_LIMIT'?429:code==='size'?413:code==='MEDIA_UNAVAILABLE'?503:400)}}
export const GET=handle
export const POST=handle
export const DELETE=handle
