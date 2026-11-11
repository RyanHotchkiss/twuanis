import {sinpeMoney} from './sinpe-journey'
export type PaymentQuote={version:'payment-method-v1';product:string;duration:'day'|'month';bankUpgrade:boolean;source:string;offerEnd?:string|null;fx:{rate:string;source:'BCCR';rateType:'reference_sale';effectiveDate:string};sinpe:MethodQuote;stripe:MethodQuote}
export type MethodQuote={available:boolean;chargeCurrency:'USD'|'CRC';chargeAmount:string;displayAmounts:{USD:string;CRC:string};standardDisplayAmounts:{USD:string;CRC:string}}
export function selectedPaymentQuote(quotes:PaymentQuote[]|null|undefined,duration:'day'|'month',bank:boolean){return quotes?.find(q=>q.version==='payment-method-v1'&&q.duration===duration&&q.bankUpgrade===(duration==='month'&&bank))??null}
export function paymentDisplay(amount:string|number|undefined,language:'en'|'es'){const n=Number(amount);if(!Number.isFinite(n)||n<=0)return language==='es'?'No disponible':'Unavailable';return language==='es'?sinpeMoney(n):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n)}
// Legacy account/configuration base, independent of locale and surface.
// Method-scoped recovery adds the provider suffix while preserving immutable existing Orders.
export function packagePurchaseStorageKey(account:string,product:string,duration:'day'|'month',bank:boolean){return 'tw-checkout:package:'+account+':'+product+':'+duration+':'+(duration==='month'&&bank?'bank':'private')}
