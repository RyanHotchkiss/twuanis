import {NextRequest,NextResponse} from 'next/server'
import {campaignRequestBytes} from '@/lib/campaign-request-body'
import {createHash} from 'node:crypto'
import {assertAdministrativePermission} from '@/lib/administrative-control'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {supabaseAdmin} from '@/lib/supabase-admin'
export async function POST(req:NextRequest){
 try{
  if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({ok:false},{status:403})
  await assertAdministrativePermission('promotions.manage')
  if(Number(req.headers.get('content-length'))>5*1024*1024)return NextResponse.json({ok:false},{status:413})
  const bounded=await campaignRequestBytes(req,5*1024*1024);const form=await new Response(bounded as BodyInit,{headers:{'Content-Type':req.headers.get('content-type')??''}}).formData(),file=form.get('file'),request=form.get('request')
  if(!(file instanceof File)||typeof request!=='string'||file.size<1||file.size>4*1024*1024||!['image/jpeg','video/mp4'].includes(file.type)||(file.type==='image/jpeg'&&file.size>614400))throw Error('invalid media')
  const bytes=Buffer.from(await file.arrayBuffer())
  if(file.type==='image/jpeg'?(bytes[0]!==255||bytes[1]!==216||bytes[2]!==255):(bytes.length<12||bytes.toString('ascii',4,8)!=='ftyp'))throw Error('invalid media signature')
  const db=await createServerSupabaseClient(),prepared=await db.rpc('admin_campaign_media',{p_request:request,p_mime:file.type,p_bytes:file.size,p_sha256:createHash('sha256').update(bytes).digest('hex')})
  if(prepared.error||typeof prepared.data?.path!=='string'||!/^system\/campaigns\/[a-f0-9-]{36}\.(jpg|mp4)$/.test(prepared.data.path))throw Error('invalid preparation')
  const m=prepared.data,bucket=supabaseAdmin.storage.from('campaign-media')
  if(!m.completed){
   const info=await bucket.info(m.path)
   if(info.error){if(String((info.error as {statusCode?:string}).statusCode)!=='404'&&(info.error as {code?:string}).code!=='not_found')throw Error('uncertain storage');const upload=await bucket.upload(m.path,bytes,{contentType:file.type,upsert:false});if(upload.error)throw Error('incomplete upload')}
   else if(info.data.size!==file.size||info.data.contentType!==file.type)throw Error('storage mismatch')
  }
  const completed=await db.rpc('admin_campaign_media_complete',{p_request:request});if(completed.error)throw Error('incomplete attachment')
  return NextResponse.json({ok:true,id:completed.data.id})
 }catch{return NextResponse.json({ok:false},{status:400})}
}
