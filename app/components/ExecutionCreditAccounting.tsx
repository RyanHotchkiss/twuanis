'use client'
import {useCommercialStatusRevision} from './StripeCheckoutNavigation'
import {useEffect,useState} from 'react'
import {readExecutionCreditAccounting} from '@/app/actions/execution-credits'
import ExecutionCreditPurchase from './ExecutionCreditPurchase'
import Link from 'next/link'
import {measuredReadReport as readOrchestratorReport} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import OrchestratorEvidence from './OrchestratorEvidence'
import {orchestratorNames} from '@/lib/orchestrator-report-presentation'
import type {OrchestratorReport} from '@/lib/orchestrator-contract'
import type {CreditAccounting} from '@/lib/execution-credit-contract'
export default function ExecutionCreditAccounting({language}:{language:'en'|'es'}){
 const stripeRevision=useCommercialStatusRevision()
 const [report,setReport]=useState<OrchestratorReport|null>(null)
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [data,setData]=useState<CreditAccounting|null>(null),[error,setError]=useState(false),[revision,setRevision]=useState(0)
 const [afterPurchase,setAfterPurchase]=useState<string|null>(null)
 const [afterAllocation,setAfterAllocation]=useState<string|null>(null),[afterEvent,setAfterEvent]=useState<string|null>(null)
 useEffect(()=>{let live=true;setData(null);setError(false);readExecutionCreditAccounting(afterAllocation,afterEvent,afterPurchase).then(r=>{if(!live)return;if(r.ok)setData(r.data);else setError(true)}).catch(()=>{if(live)setError(true)});return()=>{live=false}},[afterAllocation,afterEvent,afterPurchase,revision,stripeRevision])
 const date=(value:string|null)=>value?new Intl.DateTimeFormat(es?'es-CR':'en-US',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Costa_Rica'}).format(new Date(value)):t('No automatic expiration','Sin vencimiento automático')
 const kinds:Record<string,string>={INCLUDED_PACKAGE:t('Included Package tokens','Tokens incluidos del paquete'),PURCHASED:t('Purchased tokens','Tokens comprados'),ADMIN_ALLOWANCE:t('Admin monthly allowance','Asignación mensual de administrador'),ALLOCATION_ISSUED:t('Allocation issued','Asignación emitida'),PURCHASE_CREDITED:t('Purchase credited','Compra acreditada'),EXECUTION_RESERVED:t('Execution reserved','Ejecución reservada'),RESERVATION_RELEASED:t('Reservation released','Reserva liberada'),EXECUTION_CONSUMED:t('Token consumed','Token consumido'),ALLOCATION_EXPIRED:t('Allocation expired','Asignación vencida'),ADJUSTMENT:t('Authorized adjustment','Ajuste autorizado'),REFUND:t('Accounting reversal','Reversión contable'),OWNER_COMPLETED:t('Owner execution completed','Ejecución del propietario completada')}
 const packages:Record<string,string>={'pkg-matching-market-comparison':t('Package 2','Paquete 2'),'pkg-pricing-position-relationships':t('Package 3','Paquete 3')}
 return <section aria-label={t('Execution-token accounting','Contabilidad de tokens de ejecución')}>
  <ExecutionCreditPurchase language={language}/><h3>{t('Execution tokens','Tokens de ejecución')}</h3><p>{t('Tokens provide execution capacity. Your current Package and population permissions determine analytical access.','Los tokens proporcionan capacidad de ejecución. Su paquete vigente y sus permisos de población determinan el acceso analítico.')}</p>
  <button type="button" onClick={()=>setRevision(v=>v+1)}>{t('Refresh tokens','Actualizar tokens')}</button>
  {error?<p role="alert">{t('Token accounting is unavailable. No balance is assumed.','La contabilidad de tokens no está disponible. No se supone ningún saldo.')}</p>:!data?<p role="status">{t('Loading token accounting…','Cargando contabilidad de tokens…')}</p>:<>
   <p>{data.ownerUnmetered?t('Owner: unlimited executions without token consumption.','Propietario: ejecuciones ilimitadas sin consumo de tokens.'):<>{t('Available tokens','Tokens disponibles')}: <strong>{data.balance}</strong></>}</p>

   <h4>{t('Token purchases','Compras de tokens')}</h4><div className="commercial-grid">{data.purchases.map(p=><article key={p.id}><h4>{p.quantity} {t('tokens','tokens')}</h4><p>{date(p.createdAt)}</p><p>{p.currency} {p.amount}</p><p>{t('Payment status','Estado del pago')}: {p.paid?t('Approved','Aprobado'):p.state==='expired'?t('Expired','Vencido'):t('Pending','Pendiente')}</p><p>{t('Allocation status','Estado de asignación')}: {p.fulfilled?t('Issued','Emitida'):t('Not issued','No emitida')}</p><p>{t('Tokens issued','Tokens emitidos')}: {p.tokensIssued??'0'} · {t('Remaining','Restantes')}: {p.tokensRemaining??'0'}</p><p>{t('Order','Pedido')}: {p.id}</p>{p.receiptReference&&<p>{t('Receipt reference','Referencia del recibo')}: {p.receiptReference}</p>}<Link href={`/commercial/${p.id}?lang=${language}`}>{t('Order and payment status','Pedido y estado del pago')}</Link></article>)}</div>
   {data.nextPurchase&&<button type="button" onClick={()=>setAfterPurchase(data.nextPurchase)}>{t('More purchases','Más compras')}</button>}
   <h4>{t('Allocations','Asignaciones')}</h4>{data.allocations.length===0?<p>{t('No token allocations.','No hay asignaciones de tokens.')}</p>:<div className="commercial-grid">{data.allocations.map(a=><article key={a.id}><h4>{kinds[a.kind]}</h4><p>{t('Issued','Emitidos')}: {a.quantity} · {t('Available','Disponibles')}: {a.remaining}</p>{a.packageId&&<p>{packages[a.packageId]??a.packageId}</p>}<p>{t('Effective','Vigente desde')}: {date(a.effectiveAt)}</p><p>{t('Expiration','Vencimiento')}: {date(a.expiresAt)}</p><p>{a.active?t('Active','Vigente'):t('Not spendable','No utilizable')}</p>{a.termId&&<p>{t('Entitlement term','Período de derecho')}: {a.termId}</p>}{a.orderId&&<p>{t('Order','Pedido')}: {a.orderId}</p>}</article>)}</div>}
   {data.nextAllocation&&<button type="button" onClick={()=>setAfterAllocation(data.nextAllocation)}>{t('More allocations','Más asignaciones')}</button>}
   <h4>{t('Accounting history','Historial contable')}</h4>{data.events.length===0?<p>{t('No token events.','No hay eventos de tokens.')}</p>:<div className="commercial-grid">{data.events.map(e=><article key={e.id}><h4>{kinds[e.kind]??t('Accounting event','Evento contable')}</h4><p>{t('Quantity','Cantidad')}: {e.quantity}</p><p>{date(e.at)}</p>{(()=>{const reservation=data.events.find(x=>x.executionId===e.executionId&&x.kind==='EXECUTION_RESERVED');const authority=(e.metadata.authority??reservation?.metadata.authority) as Record<string,unknown>|undefined;const identity=authority?.orchestrator;return typeof identity==='string'&&identity in orchestratorNames?<p>{t('Orchestrator','Orquestador')}: {orchestratorNames[identity as keyof typeof orchestratorNames][es?1:0]}</p>:null})()}{e.allocationId&&<p>{t('Allocation provenance','Procedencia de la asignación')}: {kinds[data.allocations.find(x=>x.id===e.allocationId)?.kind??'']??t('Allocation','Asignación')} · {e.allocationId}</p>}{e.executionId&&<p>{t('Execution','Ejecución')}: {e.executionId}</p>}{e.reportId&&<button type="button" onClick={()=>{void readOrchestratorReport(e.reportId!,serverSignal(language)).then(setReport).catch(()=>setError(true))}}>{t('Open completed report','Abrir informe completado')}: {e.reportId}</button>}</article>)}</div>}
   {data.nextEvent&&<button type="button" onClick={()=>setAfterEvent(data.nextEvent)}>{t('More events','Más eventos')}</button>}
   {(afterAllocation||afterEvent||afterPurchase)&&<button type="button" onClick={()=>{setAfterAllocation(null);setAfterEvent(null);setAfterPurchase(null)}}>{t('First page','Primera página')}</button>}
   {report&&<OrchestratorEvidence report={report}/>}<p>{t('Reopening completed reports does not consume a token.','Reabrir informes completados no consume tokens.')}</p>
  </>}
 </section>
}
