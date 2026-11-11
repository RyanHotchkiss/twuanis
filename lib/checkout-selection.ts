export type CheckoutSelection={kind:'package'|'addon'|'credit';product:string;provider:'sinpe'|'stripe';duration:'day'|'month';bank:boolean;currency:'CRC'|'USD';displayCurrency:'CRC'|'USD';lang:'en'|'es';listing?:string;quantity:number}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export function checkoutSelection(q:URLSearchParams):CheckoutSelection|null{
 const kind=q.get('kind'),product=q.get('product'),provider=q.get('provider'),duration=q.get('duration')??'month',lang=q.get('lang')??'en',bank=q.get('bank')??'0',listing=q.get('listing')??undefined,quantity=Number(q.get('quantity')??2),displayCurrency=q.get('displayCurrency')??q.get('currency')??(lang==='es'?'CRC':'USD')
 if(!['package','addon','credit'].includes(kind??'')||!product||! /^[a-z0-9-]{1,150}$/.test(product)||!['sinpe','stripe'].includes(provider??'')||!['day','month'].includes(duration)||!['en','es'].includes(lang)||!['0','1'].includes(bank)||!['CRC','USD'].includes(displayCurrency)||listing&&!uuid.test(listing)||!Number.isSafeInteger(quantity)||![2,5,10,20,50].includes(quantity)||kind!=='package'&&bank==='1'||duration==='day'&&bank==='1')return null
 return {kind:kind as CheckoutSelection['kind'],product,provider:provider as CheckoutSelection['provider'],duration:duration as 'day'|'month',bank:bank==='1',currency:provider==='stripe'?'USD':'CRC',displayCurrency:displayCurrency as 'CRC'|'USD',lang:lang as 'en'|'es',listing,quantity}
}
export function checkoutPath(input:Partial<CheckoutSelection>&Pick<CheckoutSelection,'kind'|'product'|'provider'|'lang'>){
 const q=new URLSearchParams({kind:input.kind,product:input.product,provider:input.provider,lang:input.lang,duration:input.duration??'month',bank:input.bank?'1':'0',displayCurrency:input.displayCurrency??input.currency??(input.lang==='es'?'CRC':'USD'),quantity:String(input.quantity??2)})
 if(input.listing)q.set('listing',input.listing)
 const value=checkoutSelection(q);if(!value)throw Error('Invalid purchase selection')
 q.set('currency',value.currency);return '/checkout?'+q.toString()
}
