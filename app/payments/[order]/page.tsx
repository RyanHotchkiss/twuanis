export const dynamic='force-dynamic'
export const metadata={robots:{index:false,follow:false}}
import SinpePayment from '../SinpePayment'
import {readMySinpe} from '../actions'
export default async function PaymentPage({params,searchParams}:{params:Promise<{order:string}>;searchParams:Promise<{lang?:string}>}){const {order}=await params;const language=(await searchParams).lang==='es'?'es':'en';const r=await readMySinpe(order);return <main style={{maxWidth:800,margin:'auto',padding:24}}><h1>SINPE</h1>{r.ok?<SinpePayment language={language} initial={r.data}/>:<p>{language==='es'?'El pago no está disponible.':'Payment is unavailable.'}</p>}</main>}
