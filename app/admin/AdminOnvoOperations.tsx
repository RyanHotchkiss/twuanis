'use client'
import AdminPaymentStatus from './AdminPaymentStatus'
import {useEffect,useState} from 'react'
import {readAutomatedPayments} from './payment-actions'
export default function AdminOnvoOperations({language}:{language:'en'|'es'}){
 const es=language==='es',t=(a:string,b:string)=>es?b:a
 const[exceptions,setExceptions]=useState(false),[after,setAfter]=useState<string|null>(null),[revision,setRevision]=useState(0),[data,setData]=useState<Awaited<ReturnType<typeof readAutomatedPayments>>|null>(null)
 useEffect(()=>{let live=true;setData(null);readAutomatedPayments(after,exceptions).then(x=>{if(live)setData(x)}).catch(()=>{if(live)setData({ok:false} as Awaited<ReturnType<typeof readAutomatedPayments>>)});return()=>{live=false}},[after,exceptions,revision])
 return <section className="admin-onvo"><h2>{t('Automated SINPE & owner notifications','SINPE automatizado y avisos al propietario')}</h2>
 <p>{t('Read-only operational evidence. Pending is not delivered. ACCEPTED means the email provider accepted the owner notification, not inbox delivery. Customer status is shown on the original purchase page.','Evidencia operativa de solo lectura. Pendiente no significa entregado. ACCEPTED indica aceptación del aviso al propietario por el proveedor de correo, no entrega al buzón. El cliente consulta el estado en la página original de compra.')}</p>
 <p>{t('Uncertain creation: never create another intent automatically. Late, duplicate or unmatched money, refunds and reversals require verified provider evidence and a separate Owner disposition. No grant, refund or reversal override is available here.','Creación incierta: nunca crear otra intención automáticamente. Dinero tardío, duplicado o sin correspondencia, reembolsos y reversiones requieren evidencia verificada del proveedor y una decisión separada del propietario. Aquí no se permite forzar derechos, reembolsos ni reversiones.')}</p>
 <button onClick={()=>{setExceptions(!exceptions);setAfter(null)}}>{exceptions?t('Order operations','Operaciones de pedidos'):t('Unassociated received money','Dinero recibido sin pedido asociado')}</button>
 {!data?<p>{t('Loading…','Cargando…')}</p>:!data.ok?<p role="alert">{t('Operational evidence unavailable.','Evidencia operativa no disponible.')}</p>:<>
 {!data.items.length&&<p>{t('No records.','Sin registros.')}</p>}
 {data.items.map((row:any)=><article key={row.orderId??row.id} style={{overflowWrap:'anywhere'}}><p>{row.orderId??row.id}</p>
 {(row.payment==='RECEIVED_UNMATCHED'||row.payment==='NEEDS_RESOLUTION'||row.reason==='unassociated_received_money')&&<strong>{t('RECEIVED MONEY — OWNER DISPOSITION REQUIRED','DINERO RECIBIDO — REQUIERE DECISIÓN DEL PROPIETARIO')}</strong>}
 {row.unbound&&<strong>{t('CREATION UNCERTAIN — DO NOT REPEAT PAYMENT','CREACIÓN INCIERTA — NO REPETIR EL PAGO')}</strong>}
 <p>{t('Payment','Pago')}: <AdminPaymentStatus status={row.payment??row.state??'PENDING'} language={language}/></p><p>{row.paymentReason??row.reason}</p>{row.amount&&<p>{row.currency} {row.amount}</p>}
 {!exceptions&&<><p>{t('Provider intent / status','Intención / estado del proveedor')}: {row.intentState??'—'} / {row.providerStatus??'—'}</p>
 <p>{t('Fulfillment','Entrega')}: {row.fulfillment??'PENDING'} · {t('Attempts','Intentos')}: {row.fulfillmentAttempts??0}</p>
 {row.nextFulfillmentAttempt&&<p>{t('Next eligible recovery','Próxima recuperación elegible')}: {row.nextFulfillmentAttempt}</p>}
 {row.oldestRecoveryAt&&<p>{t('Recovery pending since','Recuperación pendiente desde')}: {row.oldestRecoveryAt} · {t('Attempts','Intentos')}: {row.recoveryAttempts??0}</p>}
 <p>{t('Owner email','Correo al propietario')}: {row.notification??'NOT_QUEUED'}</p>
 {(row.notification==='NEEDS_RESOLUTION'||row.fulfillmentAttempts>=5||row.recoveryAttempts>=5)&&<p role="status">{t('Operator review required. Preserve this Order and its immutable payment evidence. Automatic retries do not authorize a second payment or duplicate delivery. Exhausted email retries require review before any resend.','Se requiere revisión del operador. Conserve este pedido y su evidencia de pago inmutable. Los reintentos automáticos no autorizan otro pago ni una entrega duplicada. El agotamiento de los reintentos de correo requiere revisión antes de reenviar.')}</p>}</>}
 </article>)}{data.next&&<button onClick={()=>setAfter(data.next)}>{t('Next','Siguiente')}</button>}</>}
 <button onClick={()=>setRevision(x=>x+1)}>{t('Refresh','Actualizar')}</button>{after&&<button onClick={()=>setAfter(null)}>{t('First page','Primera página')}</button>}</section>
}
