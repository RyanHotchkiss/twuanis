import {redirect} from 'next/navigation'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {checkoutSelection,checkoutPath} from '@/lib/checkout-selection'
import {commercialCatalog,executionCreditCatalog} from '@/app/commercial/actions'
import {readFounderAddonAcquisition} from '@/app/commercial/addon-actions'
import {stripeReadiness,readStripeListingAvailability} from '@/app/commercial/stripe-actions'
import CommercialPageShell from '@/app/components/CommercialPageShell'
import PurchaseReview from './PurchaseReview'
export const dynamic='force-dynamic'
export const metadata={robots:{index:false,follow:false}}
export default async function CheckoutPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const raw=await searchParams,q=new URLSearchParams();for(const [k,v]of Object.entries(raw))if(typeof v==='string')q.set(k,v)
 const selection=checkoutSelection(q)
 if(!selection)return <CommercialPageShell><p>Invalid purchase selection / Selección de compra inválida.</p></CommercialPageShell>
 const db=await createServerSupabaseClient(),auth=await db.auth.getUser()
 if(auth.error||!auth.data.user)redirect('/login?lang='+selection.lang+'&next='+encodeURIComponent(checkoutPath(selection)))
 const es=selection.lang==='es',t=(en:string,sp:string)=>es?sp:en
 let product:any=null,enabled=false,reason='',founder:any=null
 if(selection.kind==='credit'){
  const catalog=await executionCreditCatalog(selection.currency)
  if(catalog.ok){const price=catalog.prices.find(p=>p.quantity===selection.quantity);if(price)product={id:price.productId,nameEN:'Additional execution credits',nameES:'Créditos de ejecución adicionales',pricing:{effectivePrice:price.total,available:true},quantity:price.quantity,currencyQuotes:price.currencyQuotes,credit:true};enabled=catalog.enabled}
 }else{
  const catalog=await commercialCatalog(selection.kind,selection.currency,null,selection.listing)
  if(catalog.ok){product=catalog.products.find(p=>p.id===selection.product);enabled=catalog.enabled;if(selection.listing){const state=selection.provider==='stripe'?await readStripeListingAvailability(selection.listing):catalog.availability;const available=state?.products.find(p=>p.id===selection.product);if(!available?.available){reason=t('This listing is not currently eligible for this promotion. Review existing purchases and listing eligibility in MarketHub.','Este anuncio no es elegible actualmente para esta promoción. Revise las compras y la elegibilidad en el Centro del Mercado.');enabled=false}}}
  if(selection.kind==='addon'&&selection.product==='addon-2026-founding-membership'){const r=await readFounderAddonAcquisition();founder=r.ok?r.data:null;if(!founder?.available){enabled=false;reason=founder?.active?t('Your membership is already active.','Su membresía ya está activa.'):t('Membership acquisition is unavailable. Review eligibility or an existing Order in MarketHub.','La adquisición de membresía no está disponible. Revise la elegibilidad o un pedido existente en el Centro del Mercado.')}}
 }
 if(selection.provider==='stripe')enabled=await stripeReadiness()&&!reason
 if(!auth.data.user.email_confirmed_at){enabled=false;reason=t('Verify your account email before purchasing.','Verifique el correo de su cuenta antes de comprar.')}
 if(!product||!(selection.kind==='package'&&selection.duration==='day'?Number(product.dailyPrice)>0:product.pricing?.available)||selection.kind==='credit'&&product.id!==selection.product)return <CommercialPageShell><p role="alert">{t('This product or price is unavailable. Return to the catalog.','Este producto o precio no está disponible. Regrese al catálogo.')}</p></CommercialPageShell>
 return <CommercialPageShell><PurchaseReview accountId={auth.data.user.id} selection={selection} product={product} enabled={enabled} restriction={reason}/></CommercialPageShell>
}
