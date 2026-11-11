import {NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {canonicalAddonCatalogEnabled} from '@/lib/addon-placement-server'
export async function GET(request:Request){
 if(!canonicalAddonCatalogEnabled())return NextResponse.json({state:'legacy_compatibility',checkoutAvailable:false,products:[]})
 const after=new URL(request.url).searchParams.get('after')
 if(after&&after.length>150)return NextResponse.json({error:'Invalid cursor'},{status:400})
 const {data,error}=await supabaseAdmin.rpc('read_addon_catalog',{p_after:after})
 if(error||!Array.isArray(data)||data.length>26)return NextResponse.json({error:'Catalog unavailable'},{status:503})
 return NextResponse.json({state:'canonical',checkoutAvailable:false,products:data.slice(0,25),next:data.length>25?data[24].id:null},{headers:{'Cache-Control':'no-store'}})
}
