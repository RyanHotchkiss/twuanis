export const dynamic='force-dynamic'
export const metadata={robots:{index:false,follow:false}}
import OnvoPayment from '../OnvoPayment'
import {readMyCommercial} from '@/app/commercial/actions'
import {onvoAutomationEnabled} from '@/lib/providers/onvo-automation'
import SinpePayment from '../SinpePayment'
import {readMySinpe} from '../actions'
export default async function PaymentPage({params,searchParams}:{params:Promise<{order:string}>;searchParams:Promise<{lang?:string}>}){const {order}=await params;const language=(await searchParams).lang==='es'?'es':'en';if(onvoAutomationEnabled()){const result=await readMyCommercial('orders',null,order);const row=result.ok?result.items[0]:null;return <main style={{maxWidth:800,margin:'auto',padding:24}}><h1>SINPE</h1>{row?<OnvoPayment order={order} language={language} currency={row.currency} amount={row.amount}/>:<p>{language==='es'?'Pedido no disponible.':'Order unavailable.'}</p>}</main>}const r=await readMySinpe(order);return <main style={{maxWidth:800,margin:'auto',padding:24}}><h1>SINPE</h1>{r.ok?<SinpePayment language={language} initial={r.data}/>:<p>{language==='es'?'El pago no está disponible.':'Payment is unavailable.'}</p>}</main>}
