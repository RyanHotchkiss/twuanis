'use server'
import {listingOverlayPurchasesEnabled} from '@/lib/lpi-purchase-release'
import {commercialCatalog,readMyCommercial,onvoReadiness} from '@/app/commercial/actions'
import {stripeReadiness,stripeEmbeddedReadiness,createStripeOrder} from '@/app/commercial/stripe-actions'
import {readDirectSinpe} from '@/app/payments/direct-actions'
import {readMySinpe} from '@/app/payments/actions'
import {createServerSupabaseClient} from '@/lib/supabase-server'
import {authorizePopulationCapability} from '@/lib/package-capability-authorization'
import {checkoutSelection,type CheckoutSelection} from '@/lib/checkout-selection'
import {lensDefinition,type Lens,type Request} from '@/lib/lpi-contract'
import {bindQuestion,requireLensQuestion} from '@/lib/lpi-question'
import {measuredPurchase} from '@/lib/measurement/actions'
import {LPI_PACKAGE_IDS} from '@/lib/lpi-purchase-contract'
function selection(input:CheckoutSelection){const q=new URLSearchParams(Object.entries(input).map(([k,v])=>[k,k==='bank'?(v?'1':'0'):String(v)]));const s=checkoutSelection(q);if(!s||s.kind!=='package'||!LPI_PACKAGE_IDS.includes(s.product as typeof LPI_PACKAGE_IDS[number]))throw Error('Invalid Package selection');return s}
export async function loadListingPackage(lens:Lens,language:'en'|'es',currency:'USD'|'CRC'){
 try{const cap=lensDefinition(lens).capability;if(!['en','es'].includes(language)||!['USD','CRC'].includes(currency))throw Error();const c=await commercialCatalog('package',currency);if(!c.ok)return{state:'unavailable' as const};const product=LPI_PACKAGE_IDS.map(id=>c.products.find(p=>p.id===id)).find(p=>p?.allCapabilities.some((v:{id:string})=>v.id===cap));if(!product)return{state:'unavailable' as const};const db=await createServerSupabaseClient(),a=await db.auth.getUser();return{state:'ready' as const,product,account:a.data.user?.id??null,purchaseEnabled:listingOverlayPurchasesEnabled(),sinpe:listingOverlayPurchasesEnabled()&&c.enabled,stripe:listingOverlayPurchasesEnabled()&&await stripeReadiness()}}catch{return{state:'unavailable' as const}}
}
export async function loadOverlayReview(input:CheckoutSelection,lens:Lens){
 if(!listingOverlayPurchasesEnabled())return{state:'unavailable' as const}
 try{const s=selection(input),db=await createServerSupabaseClient(),a=await db.auth.getUser();if(a.error||!a.data.user)return{state:'authentication' as const};const c=await commercialCatalog('package',s.currency);if(!c.ok)throw Error();const p=c.products.find(p=>p.id===s.product);if(!p||!p.allCapabilities.some((v:{id:string})=>v.id===lensDefinition(lens).capability))throw Error();return{state:'ready' as const,product:p,account:a.data.user.id,stripeMode:s.provider==='stripe'&&await stripeEmbeddedReadiness()?'embedded' as const:'hosted' as const,enabled:!!a.data.user.email_confirmed_at&&(s.provider==='stripe'?await stripeReadiness():c.enabled),restriction:!a.data.user.email_confirmed_at?(s.lang==='es'?'Verifique el correo de su cuenta.':'Verify your account email.'):'',selection:s}}catch{return{state:'unavailable' as const}}
}
export async function loadOverlayPayment(order:string,language:'en'|'es'){
 try{if(!['en','es'].includes(language))throw Error();const detail=await readMyCommercial('orders',null,order),row=detail.ok?detail.items[0]:null;if(!row||row.kind!=='package')throw Error();if(row.currency==='USD'||row.paid===true&&row.fulfilled===true)return{state:'ready' as const,row};const instructions=await readMySinpe(order),receiving=instructions.ok?instructions.data?.accounts?.find((a:{id:string})=>a.id===process.env.ONVO_RECEIVING_ACCOUNT_ID):null;const text=receiving&&(language==='es'?receiving.instructionsES:receiving.instructionsEN);if(typeof text!=='string'||!text.trim()||!await onvoReadiness())throw Error();return{state:'ready' as const,row,instructions:text}}catch{return{state:'unavailable' as const}}
}
export async function verifyListingPurchase(order:string,request:Request,account:string){
 try{if(request.context.kind!=='published')return false;const db=await createServerSupabaseClient(),a=await db.auth.getUser();if(a.error||a.data.user?.id!==account)return false;const detail=await readMyCommercial('orders',null,order),row=detail.ok?detail.items[0]:null;if(!row||row.kind!=='package'||!LPI_PACKAGE_IDS.includes(row.product as typeof LPI_PACKAGE_IDS[number])||(row.paid!==true||row.fulfilled!==true)&&!(row.paymentMethod==='direct_sinpe'&&row.receiptActivated===true))return false;if(row.paymentMethod==='direct_sinpe'){const receipt=await readDirectSinpe(order);if(!receipt.ok||receipt.data.state!=='ACTIVE'||receipt.data.receiptActivated!==true)return false}const cap=lensDefinition(request.lens).capability;if(await authorizePopulationCapability(cap,'PRIVATE')!==account)return false;const q=await bindQuestion(request.context);requireLensQuestion(q,request.lens);return await authorizePopulationCapability(cap,'PRIVATE')===account}catch{return false}
}

// Reuse canonical Package creation; never accept client prices, accounts or entitlement claims.
export async function createListingOverlayOrder(input:{request:string;kind:'package'|'addon';product:string;duration?:'day'|'month';bankUpgrade?:boolean;listing?:string;provider:'sinpe'|'stripe'},signal?:Parameters<typeof measuredPurchase>[1],grant?:Parameters<typeof measuredPurchase>[2]){
 if(!listingOverlayPurchasesEnabled())return{ok:false as const,reason:'inactive'}
 if(!input||input.kind!=='package'||!LPI_PACKAGE_IDS.includes(input.product as typeof LPI_PACKAGE_IDS[number])||!['sinpe','stripe'].includes(input.provider)||Object.keys(input).some(k=>!['request','kind','product','duration','bankUpgrade','provider'].includes(k)))return{ok:false as const,reason:'ineligible'}
 const {provider,...canonical}=input
 if(provider==='stripe')return createStripeOrder(canonical)
 return measuredPurchase({...canonical,currency:'CRC'},signal,grant)
}
