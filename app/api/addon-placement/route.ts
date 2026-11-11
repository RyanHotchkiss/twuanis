import {loadAdvertisingPlacements} from '@/lib/addon-homepage-server'
import {NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {canonicalAddonPlacementEnabled,resolveAddonPlacement} from '@/lib/addon-placement-server'
export async function POST(request:Request){
 if(!canonicalAddonPlacementEnabled())return NextResponse.json({enabled:false})
 try{
  const text=await request.text()
  if(text.length>450000)return NextResponse.json({error:'Request too large'},{status:413})
  const body=JSON.parse(text)
  const result=await resolveAddonPlacement(supabaseAdmin,body.ids,body.surface,body.province,body.propertyType)
  const advertising=body.advertising!==false&&(body.surface==='buy'||body.surface==='rent')?await loadAdvertisingPlacements(body.surface==='buy'?'sale':'rent'):undefined
  return NextResponse.json({enabled:true,...result,advertising},{headers:{'Cache-Control':'no-store'}})
 }catch{return NextResponse.json({error:'Placement unavailable'},{status:400})}
}
