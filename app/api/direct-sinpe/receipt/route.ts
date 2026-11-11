import {createHash} from 'node:crypto'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {directUuid,receiptMime,RECEIPT_LIMIT,RECEIPT_TYPES} from '@/lib/direct-sinpe'
import {storedDirectReceipt,activateStoredDirectReceipt,type StoredReceipt} from '@/lib/direct-sinpe-receipt-recovery'
export const runtime='nodejs'
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}})
export async function POST(request:Request){
 let receiptStored=false,order:string|null=null
 try{
  const origin=request.headers.get('origin');if(!origin||new URL(origin).host!==new URL(request.url).host)return response({error:'origin'},403)
  const db=await createServerSupabaseClient(),auth=await db.auth.getUser();if(auth.error||!auth.data.user?.email_confirmed_at)return response({error:'authentication'},401)
  const type=request.headers.get('content-type')??'',recovery=type.split(';')[0]==='application/json'
  if((!recovery&&!type.startsWith('multipart/form-data;'))||!request.body)return response({error:'format'},415)
  const bound=recovery?1024:RECEIPT_LIMIT+65536;if(Number(request.headers.get('content-length'))>bound)return response({error:'size'},413)
  const reader=request.body.getReader(),chunks:Uint8Array[]=[];let count=0;while(true){const part=await reader.read();if(part.done)break;count+=part.value.length;if(count>bound){await reader.cancel();return response({error:'size'},413)}chunks.push(part.value)}
  let file:File|null=null
  if(recovery){const body=await new Response(Buffer.concat(chunks)).json();if(!body||Object.keys(body).length!==1||!directUuid(body.order))return response({error:'receipt'},400);order=body.order}
  else{const body=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':type}}).formData(),id=body.get('order'),input=body.get('receipt');if(!directUuid(id)||!(input instanceof File)||input.size<1||input.size>RECEIPT_LIMIT||body.getAll('receipt').length!==1||body.getAll('order').length!==1)return response({error:'receipt'},400);order=id;file=input}
  if(!order)return response({error:'receipt'},400)
  const before=await db.rpc('read_direct_sinpe_checkout',{p_order:order});if(before.error||before.data?.accountId!==auth.data.user.id||before.data?.orderId!==order)return response({error:'ownership'},403)
  if(before.data.receiptActivated)return response({ok:true,data:before.data,receiptStored:true})
  if(before.data.state!=='AWAITING_RECEIPT'&&before.data.state!=='EXPIRED')return response({error:'unavailable'},409)
  let receipt:StoredReceipt|null
  try{receipt=await storedDirectReceipt(auth.data.user.id,order)}catch{return response({ok:false,error:'recovery_unavailable',orderId:order},503)}
  receiptStored=receipt!==null
  if(before.data.state==='EXPIRED')return response({ok:false,error:'expired',receiptStored,orderId:order,data:before.data},409)
  if(!receipt&&recovery)return response({ok:true,data:before.data,receiptStored:false})
  if(!receipt){
   const bytes=Buffer.from(await file!.arrayBuffer()),mime=receiptMime(bytes);if(!mime||!RECEIPT_TYPES.includes(file!.type as typeof RECEIPT_TYPES[number])||mime!==file!.type)return response({error:'format'},415)
   const sha=createHash('sha256').update(bytes).digest('hex'),ext=({'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as const)[mime],path=auth.data.user.id+'/'+order+'/'+sha+'.'+ext
   const storage=supabaseAdmin.storage.from('sinpe-receipts'),upload=await storage.upload(path,bytes,{contentType:mime,upsert:false,cacheControl:'0'})
   if(upload.error){const retained=await storage.download(path);if(retained.error||!retained.data||createHash('sha256').update(Buffer.from(await retained.data.arrayBuffer())).digest('hex')!==sha)return response({ok:false,error:'storage',orderId:order},503)}
   receiptStored=true;receipt={path,sha,mime,size:bytes.length}
  }
  const activated=await activateStoredDirectReceipt(db,order,receipt)
  return activated?response({ok:true,data:activated,receiptStored:true}):response({ok:false,error:'activation_pending',receiptStored:true,orderId:order},202)
 }catch{return response({ok:false,error:receiptStored?'activation_pending':'unavailable',receiptStored,orderId:order},receiptStored?202:503)}
}
