import {createHash} from 'node:crypto'
import {assertAdministrativePermission,AdministrativeAccessError} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {directUuid,receiptMime,RECEIPT_LIMIT,RECEIPT_TYPES} from '@/lib/direct-sinpe'
export const runtime='nodejs'
const money=(value:string)=>{const [whole,fraction='']=value.split('.');return whole.replace(/^0+(?=\d)/,'')+'.'+fraction.padEnd(2,'0')}
const response=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private, no-store'}})
export async function POST(request:Request){let receiptStored=false
 try{
  if(!request.headers.get('origin')||new URL(request.headers.get('origin')!).host!==new URL(request.url).host)return response({error:'origin'},403)
  const authority=await assertAdministrativePermission('payments.review');if(!authority.owner)return response({error:'owner'},403)
  const type=request.headers.get('content-type')??'';if(!type.startsWith('multipart/form-data;')||!request.body)return response({error:'format'},415)
  const limit=RECEIPT_LIMIT+65536;if(Number(request.headers.get('content-length'))>limit)return response({error:'size'},413)
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();return response({error:'size'},413)}chunks.push(part.value)}
  const body=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':type}}).formData(),keys=['requestId','orderId','accountId','email','customerName','amount','bankReference','paymentAt','failedUploadAt','failureNote','receipt'];
  if([...body.keys()].some(k=>!keys.includes(k))||keys.some(k=>body.getAll(k).length!==1))return response({error:'input'},400)
  const str=(k:string)=>typeof body.get(k)==='string'?String(body.get(k)).trim():'',requestId=str('requestId'),order=str('orderId'),account=str('accountId'),file=body.get('receipt')
  if(!directUuid(requestId)||!directUuid(order)||!directUuid(account)||!(file instanceof File)||file.size<1||file.size>RECEIPT_LIMIT||!/^\d+(\.\d{1,2})?$/.test(str('amount'))||!str('customerName')||str('customerName').length>120||!str('bankReference')||str('bankReference').length>300||!str('failureNote')||str('failureNote').length>2000||!str('email')||str('email').length>320)return response({error:'input'},400)
  for(const field of ['paymentAt','failedUploadAt'])if(!/(Z|[+-]\d{2}:\d{2})$/.test(str(field))||!Number.isFinite(Date.parse(str(field))))return response({error:'time'},400)
  const db=await createServerSupabaseClient(),before=await db.rpc('admin_order_read',{p_id:order,p_after:null,p_account:null,p_kind:null,p_source:null,p_currency:null}),o=before.data
  if(before.error||o?.id!==order||o.accountId!==account||o.currency!=='CRC'||o.targetType!=='package'||o.terms?.paymentExecution!=='direct_sinpe'||!/^\d+(\.\d{1,2})?$/.test(String(o.terms?.total))||money(String(o.terms.total))!==money(str('amount')))return response({error:'order_association'},403)
  const customer=await db.rpc('admin_administrators_read',{p_lookup:account,p_after:null,p_before:null});if(customer.error||customer.data?.target?.id!==account||customer.data.target.email?.toLowerCase()!==str('email').toLowerCase())return response({error:'customer_association'},403)
  const ready=await db.rpc('direct_sinpe_ready',{});if(ready.error||ready.data!==true)return response({error:'private_storage_unavailable'},503)
  const bytes=Buffer.from(await file.arrayBuffer()),mime=receiptMime(bytes);if(!mime||!RECEIPT_TYPES.includes(file.type as typeof RECEIPT_TYPES[number])||mime!==file.type)return response({error:'format'},415)
  const sha=createHash('sha256').update(bytes).digest('hex'),ext=({'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as const)[mime],path='owner-recovery/'+account+'/'+order+'/'+sha+'.'+ext,storage=supabaseAdmin.storage.from('sinpe-receipts')
  const upload=await storage.upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'0'});if(upload.error){const retained=await storage.download(path);if(retained.error||!retained.data||createHash('sha256').update(Buffer.from(await retained.data.arrayBuffer())).digest('hex')!==sha)return response({error:'storage'},503)}
  receiptStored=true
  const command={orderId:order,accountId:account,email:str('email'),productId:o.productId,amount:String(o.terms.total),currency:'CRC',customerName:str('customerName'),bankReference:str('bankReference'),paymentAt:str('paymentAt'),failedUploadAt:str('failedUploadAt'),failureNote:str('failureNote'),receiptPath:path,sha256:sha,mimeType:mime,fileSize:bytes.length}
  const r=await db.rpc('recover_direct_sinpe_receipt',{p_request:requestId,p_command:command});if(r.error||r.data?.ok!==true)return response({ok:false,error:r.error?.code==='23505'?'conflict':'recovery_pending',receiptStored:true},r.error?.code==='23505'?409:202)
  return response({ok:true,data:r.data,receiptStored:true})
 }catch(error){if(error instanceof AdministrativeAccessError)return response({error:'owner'},403);return response({ok:false,error:receiptStored?'recovery_pending':'unavailable',receiptStored},receiptStored?202:503)}
}
