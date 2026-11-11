import {NextRequest,NextResponse} from 'next/server'
import {campaignRequestBytes} from '@/lib/campaign-request-body'
import {randomUUID} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {campaignRoute} from '@/lib/campaign-contract'
const cookie='twuanis-campaign-session'
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export async function POST(req:NextRequest){
 const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
 // Dormant until separate production activation. No DB/auth request while disabled.
 if(process.env.TWUANIS_CAMPAIGNS!=='canonical')return response({items:[]})
 if(req.headers.get('origin')!==req.nextUrl.origin||Number(req.headers.get('content-length')??0)>4096)return response({},400)
 try{
  const raw=new TextDecoder().decode(await campaignRequestBytes(req,4096));const body=JSON.parse(raw)
  const old=req.cookies.get(cookie)?.value;const session=old&&uuid.test(old)?old:null
  if(body.operation==='events'){
   if(!session||!Array.isArray(body.events)||body.events.length>6)return response({},400)
   const result=await supabaseAdmin.rpc('report_campaign_events',{p_session:session,p_events:body.events});return response({ok:!result.error},result.error?400:200)
  }
  if(body.operation!=='resolve'||typeof body.path!=='string')return response({},400)
  const context=campaignRoute(body.path);if(!context)return response({items:[]})
  const db=await createServerSupabaseClient();const user=await db.auth.getUser()
  // Absence is anonymous; auth infrastructure errors fail closed rather than selecting an audience.
  if(user.error&&user.error.name!=='AuthSessionMissingError')return response({items:[]})
  const result=await supabaseAdmin.rpc('resolve_owned_campaigns',{p_session:session??randomUUID(),p_surfaces:context.surfaces,p_language:context.language,p_authenticated:!!user.data.user})
  if(result.error||!result.data||!uuid.test(result.data.session)||!Array.isArray(result.data.items)||result.data.items.length>3)return response({items:[]})
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL
  const items=result.data.items.map((item:Record<string,unknown>)=>({token:item.token,surface:item.surface,headline:item.headline,copy:item.copy,cta:item.cta,destination:item.destination,alt:item.alt,image:typeof item.image==='string'?`${base}/storage/v1/object/public/campaign-media/${item.image}`:null,video:typeof item.video==='string'?`${base}/storage/v1/object/public/campaign-media/${item.video}`:null}))
  const r=response({items});r.cookies.set(cookie,result.data.session,{httpOnly:true,sameSite:'lax',secure:req.nextUrl.protocol==='https:',path:'/'})
  return r
 }catch{return response({items:[]})}
}
