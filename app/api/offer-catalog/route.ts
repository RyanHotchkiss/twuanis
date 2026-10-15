import {NextResponse} from 'next/server'
import {supabaseAdmin} from '@/lib/supabase-admin'
// Separate presentation activation; this never changes enforcement or enables acquisition.
export async function GET(request:Request){
 const headers={'Cache-Control':'no-store'}
 if(process.env.TWUANIS_OFFER_PRESENTATION!=='canonical')return NextResponse.json({state:'inactive',checkoutAvailable:false},{headers})
 const params=new URL(request.url).searchParams,kind=params.get('kind')??'addon',currency=params.get('currency')??'USD',after=params.get('after')
 if(!['package','addon'].includes(kind)||!['USD','CRC'].includes(currency)||(after!==null&&after.length>150))return NextResponse.json({error:'Invalid request'},{status:400,headers})
 const catalog=await supabaseAdmin.rpc(kind==='package'?'read_intelligence_package_catalog':'read_addon_catalog',{p_after:after})
 if(catalog.error||!Array.isArray(catalog.data)||catalog.data.length>26)return NextResponse.json({error:'Catalog unavailable'},{status:503,headers})
 const products=catalog.data.slice(0,25)
 const prices=products.length?await supabaseAdmin.rpc('read_offer_prices',{p_kind:kind,p_products:products.map(p=>p.id),p_currency:currency}):{data:[],error:null}
 if(prices.error||!Array.isArray(prices.data)||prices.data.length!==products.length)return NextResponse.json({error:'Pricing unavailable'},{status:503,headers})
 // Explicit public projection; no private configuration, audit, Order, or authority payload.
 return NextResponse.json({state:'canonical',checkoutAvailable:false,next:catalog.data.length>25?products[24].id:null,products:products.map(p=>({id:p.id,name_en:p.name_en,name_es:p.name_es,termQuantity:p.termQuantity,termUnit:p.termUnit,durationDays:p.durationDays,termKind:p.termKind,capacity:p.capacity,pricing:prices.data.find((r:{productId:string})=>r.productId===p.id)}))},{headers})
}
