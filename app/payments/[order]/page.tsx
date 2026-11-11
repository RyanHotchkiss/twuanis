import DirectSinpeCheckout from '@/app/checkout/DirectSinpeCheckout'
import OrderPage from '@/app/commercial/[order]/page'
import CommercialPageShell from '@/app/components/CommercialPageShell'
import {onvoReadiness,readMyCommercial} from '@/app/commercial/actions'
import {onvoAutomationEnabled} from '@/lib/providers/onvo-automation'
import {sinpeMoney} from '@/lib/sinpe-journey'
import OnvoPayment from '../OnvoPayment'
import {readMySinpe} from '../actions'
export default async function PaymentPage({params,searchParams}:{params:Promise<{order:string}>;searchParams:Promise<{lang?:string;currency?:string}>}){
 const {order}=await params,query=await searchParams,language=query.lang==='es'?'es':'en',es=language==='es'
 const result=await readMyCommercial('orders',null,order),row=result.ok?result.items[0]:null
 if(row?.paymentMethod==='direct_sinpe')return <CommercialPageShell><DirectSinpeCheckout existingOrder={order} enabled selection={{kind:'package',product:row.product,provider:'sinpe',currency:'CRC',displayCurrency:es?'CRC':'USD',lang:language,duration:row.termUnit==='day'?'day':'month',bank:row.bankUpgradeSelected===true,quantity:2}} name={(es?row.nameES:row.nameEN)||row.product}/></CommercialPageShell>
 // USD orders retain their existing canonical Stripe checkout and status page.
 if(row?.currency==='USD')return <OrderPage params={params} searchParams={searchParams}/>
 const displayCurrency=query.currency==='USD'||query.currency==='CRC'?query.currency:es?'CRC':'USD'
 if(!onvoAutomationEnabled())return <CommercialPageShell><h1>SINPE Móvil</h1><p>{es?'Pago SINPE automatizado no disponible.':'Automated SINPE payment unavailable.'}</p></CommercialPageShell>
 const payment=await readMySinpe(order),receiving=payment.ok?payment.data?.accounts?.find((a:{id:string})=>a.id===process.env.ONVO_RECEIVING_ACCOUNT_ID):null
 const text=es?receiving?.instructionsES:receiving?.instructionsEN,instructions=typeof text==='string'&&await onvoReadiness()?text:''
 return <CommercialPageShell>{row?<><OnvoPayment order={order} language={language} currency={row.currency} amount={row.amount} deadline={row.deadline} name={(es?row.nameES:row.nameEN)||row.product} instructions={instructions} twoStep={row.kind==='package'} restartHref={es?'/es/inteligencia-de-mercado/paquetes':'/en/market-intelligence/packages'} termQuantity={row.termQuantity} termUnit={row.termUnit} durationDays={row.durationDays}/>
 <details className="sinpe-order-details"><summary>{es?'Detalles registrados del pedido':'Recorded Order details'}</summary>{(displayCurrency==='CRC'?['CRC','USD']:['USD','CRC']).map(currency=>{const amount=row.currencyQuotes?.[currency]?.total??(currency===row.currency?row.amount:null);return <p key={currency}>{currency}: {amount==null?(es?'No se registró cotización de referencia':'No reference quote recorded'):currency==='CRC'?sinpeMoney(amount):new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(amount))}</p>})}{row.kind==='package'&&<p>{es?'Mejora opcional de bancos/remates':'Optional Bank/Remates upgrade'}: {typeof row.bankUpgradeSelected==='boolean'?(row.bankUpgradeSelected?(es?'Seleccionada':'Selected'):(es?'No seleccionada':'Not selected')):(es?'Detalle del pedido no disponible':'Order detail unavailable')}</p>}</details></>:<p>{es?'Pago SINPE automatizado no disponible.':'Automated SINPE payment unavailable.'}</p>}</CommercialPageShell>
}
