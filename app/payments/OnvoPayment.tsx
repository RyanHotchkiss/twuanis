'use client'
import {productAction} from '@/lib/measurement/journey-client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {onvoPaymentView} from '@/lib/providers/onvo-payment-view'
import {sinpeDestination,sinpeMoney} from '@/lib/sinpe-journey'
import {boundedSinpeRead,SINPE_STATUS_MAX_AUTOMATIC_READS,sinpeStatusDelay,sinpeStatusSettled} from '@/lib/sinpe-status-refresh'
import {readMyOnvoPayment,readMyPaymentCoverage} from './actions'
import './sinpe-journey.css'
export default function OnvoPayment({order,language,currency,amount,instructions,deadline,name,onVerified,termQuantity,termUnit,durationDays,twoStep=false,onResumePreparation,restartHref}:{twoStep?:boolean;onResumePreparation?:()=>void;restartHref?:string;onVerified?:()=>void;order:string;instructions:string;deadline:string;language:'en'|'es';currency:string;amount:string;name?:string;termQuantity?:number;termUnit?:string;durationDays?:number}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [now,setNow]=useState(()=>Date.now()),[busy,setBusy]=useState(true),[message,setMessage]=useState(''),[state,setState]=useState<any>(null),[copied,setCopied]=useState(''),[coverage,setCoverage]=useState<{bankAccess:boolean}|null>(null),[automaticPaused,setAutomaticPaused]=useState(false)
 const refreshHandle=useRef<()=>void>(()=>{})
 const expired=!Number.isFinite(Date.parse(deadline))||now>Date.parse(deadline)
 useEffect(()=>{const tick=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(tick)},[deadline])
 useEffect(()=>{
  let live=true,inFlight=false,automaticReads=0,failures=0,timer:ReturnType<typeof setTimeout>|undefined,lastState:any=null
  const clear=()=>{if(timer!==undefined){clearTimeout(timer);timer=undefined}}
  const schedule=()=>{clear();if(!live||document.hidden||sinpeStatusSettled(lastState,deadline,Date.now()))return;if(automaticReads>=SINPE_STATUS_MAX_AUTOMATIC_READS){setAutomaticPaused(true);return}timer=setTimeout(()=>void refresh(true),sinpeStatusDelay(failures))}
  async function refresh(automatic:boolean){
   if(!live||inFlight||document.hidden)return
   if(automatic&&automaticReads>=SINPE_STATUS_MAX_AUTOMATIC_READS){setAutomaticPaused(true);return}
   clear();inFlight=true;if(automatic)automaticReads++;setBusy(true)
   try{const r=await boundedSinpeRead(()=>readMyOnvoPayment(order));if(!live)return
    if(r.ok){if(!automatic)productAction('payment_status_response','payment_status','acknowledged');lastState=r.data;setState(r.data);failures=0;setMessage('')}
    else{lastState=null;setState(null);failures++;setMessage(es?'El estado no está disponible temporalmente. No envíe otro pago.':'Status is temporarily unavailable. Do not send another payment.')}
   }catch{if(live){lastState=null;setState(null);failures++;setMessage(es?'No se pudo obtener el estado del pago. Consulte de nuevo este mismo pedido; no envíe otro pago.':'Payment status could not be retrieved. Check this same Order again; do not send another payment.')}}
   finally{inFlight=false;if(live){setBusy(false);schedule()}}
  }
  setState(null);setCoverage(null);setAutomaticPaused(false)
  // Initial + at most 19 timed reads. Existing reads only: never POST or confirm an Intent.
  void refresh(true)
  const returned=()=>{if(document.hidden)clear();else void refresh(false)}
  refreshHandle.current=()=>{productAction('payment_status_check','payment_status');void refresh(false)}
  window.addEventListener('focus',returned);document.addEventListener('visibilitychange',returned)
  return()=>{live=false;clear();refreshHandle.current=()=>{};window.removeEventListener('focus',returned);document.removeEventListener('visibilitychange',returned)}
 },[order,es,deadline])
 useEffect(()=>{let live=true;if(state?.canonicalPaid===true&&state?.fulfillment==='COMPLETE')boundedSinpeRead(()=>readMyPaymentCoverage(order)).then(r=>{if(live)setCoverage(r)}).catch(()=>{});return()=>{live=false}},[order,state?.canonicalPaid,state?.fulfillment])
 const {paid,complete,attention,status,showInstructions}=onvoPaymentView(state,expired,language)
 const verifiedCallback=useRef(onVerified);verifiedCallback.current=onVerified
 useEffect(()=>{if(complete)verifiedCallback.current?.()},[complete])
 const destination=sinpeDestination(instructions),canTransfer=showInstructions&&state?.providerStatus!=='canceled'&&currency==='CRC'&&Number.isFinite(Number(amount))&&Number(amount)>0&&!!destination
 const date=(s:string)=>new Date(s).toLocaleString(es?'es-CR':'en-US',{timeZone:'America/Costa_Rica'})
 async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setCopied(label)}catch{setCopied(t('Select and copy the displayed information.','Seleccione y copie la información mostrada.'))}}
 const paymentExpired=expired||state?.initiation==='EXPIRED'
 if(twoStep)return <section className="sinpe-instructions sinpe-compact sinpe-two-step" aria-busy={busy}>
  <h1>{t('Pay with SINPE Móvil','Pagar con SINPE Móvil')}</h1><h2>{name??t('Your Package','Tu Paquete')}</h2>
  <p className="sinpe-selected-amount"><strong>{t('Exact amount','Monto exacto')}: {sinpeMoney(amount)}</strong></p>
  {complete?<div role="status"><h2>{state.accessState==='ACTIVE'?t('Payment confirmed! Your Package is active.','¡Pago confirmado! Tu Paquete está activo.'):state.accessState==='SCHEDULED'?t('Payment confirmed! Your Package is scheduled.','¡Pago confirmado! Tu Paquete está programado.'):t('Payment confirmed. Review your Package access.','Pago confirmado. Revisa el acceso a tu Paquete.')}</h2>
   {state.startsAt&&<p>{t('Access begins','Inicio del acceso')}: {date(state.startsAt)}</p>}{state.endsAt&&<p>{t('Access ends','Fin del acceso')}: {date(state.endsAt)}</p>}
   {state.accessState==='EXPIRED'&&<p>{t('This purchased access has expired.','Este acceso comprado ha vencido.')}</p>}{state.accessState==='REVOKED'&&<p>{t('This purchased access has been revoked.','Este acceso comprado fue revocado.')}</p>}
  </div>:<>
   <section><h2>{t('STEP 1 — MAKE THE SINPE TRANSFER','PASO 1 — HAZ EL SINPE')}</h2>
    {canTransfer?<><div className="sinpe-transfer-details"><p>{t('SINPE receiving number','Número SINPE de destino')}: <strong>{destination}</strong></p><button type="button" onClick={()=>void copy(destination!.replace(/[ -]/g,''),t('Number copied','Número copiado'))}>{t('Copy number','Copiar número')}</button><p>{t('Amount','Monto')}: <strong>{sinpeMoney(amount)}</strong></p><button type="button" onClick={()=>void copy(amount,t('Amount copied','Monto copiado'))}>{t('Copy amount','Copiar monto')}</button><p role="status">{copied}</p></div><p>{t('Open your banking app and make the SINPE Móvil transfer.','Abre la aplicación de tu banco y realiza el SINPE Móvil.')}</p></>:<p>{busy?t('Checking this Order…','Consultando este pedido…'):paid?t('Payment confirmed. Do not pay again.','Pago confirmado. No pagues otra vez.'):paymentExpired?t('This payment has expired. Do not send a transfer.','Este pago venció. No envíes una transferencia.'):t('Verified transfer details are not available yet. Do not send money.','Los datos de transferencia verificados todavía no están disponibles. No envíes dinero.')}</p>}
   </section>
   <section><h2>{t('STEP 2 — VERIFY YOUR PAYMENT','PASO 2 — VERIFICA TU PAGO')}</h2>
    <p role="status">{busy?t('Checking your payment…','Verificando tu pago…'):paid?(attention?t('Payment confirmed; access requires review. Do not pay again.','Pago confirmado; el acceso requiere revisión. No pagues otra vez.'):t('Payment confirmed. Package activation is pending. Do not pay again.','Pago confirmado. La activación del Paquete está pendiente. No pagues otra vez.')):paymentExpired?t('The payment deadline has passed. If you already sent it, verify this same Order; do not pay again.','Venció el plazo de pago. Si ya enviaste el SINPE, verifica este mismo pedido; no pagues otra vez.'):message?t('Payment status is unavailable. Try again; no new Order will be created.','El estado del pago no está disponible. Vuelve a intentar; no se creará otro pedido.'):state?.initiation==='AWAITING_TRANSFER'?t('We have not received your payment yet. You can verify again.','Todavía no hemos recibido tu pago. Puedes volver a verificar.'):status}</p>
    <button type="button" disabled={busy} onClick={()=>refreshHandle.current()}>{t('Verify my payment','Verificar mi pago')}</button>
    {state?.initiation==='READY'&&!paymentExpired&&onResumePreparation&&<button type="button" onClick={onResumePreparation}>{t('Complete payer details','Completar datos del pagador')}</button>}
    {paymentExpired&&!paid&&restartHref&&<p><Link href={restartHref}>{t('Return to Packages to prepare a new payment','Volver a los Paquetes para preparar un nuevo pago')}</Link></p>}
   </section>
  </>}
  <details className="sinpe-order-details"><summary>{t('Order and access details','Detalles del pedido y del acceso')}</summary><p>{t('Order','Pedido')}: {order}</p><p>{t('Payment deadline','Fecha límite de pago')}: {date(deadline)} (Costa Rica)</p>{termQuantity&&<p>{t('Duration','Duración')}: {termUnit==='day'?t('24 hours','24 horas'):`${termQuantity} ${t('calendar month(s)','mes(es) calendario')}`}</p>}<p>{t('ONVO verifies payment automatically. Existing Package scheduling still applies.','ONVO verifica el pago automáticamente. Se mantiene la programación de cobertura del Paquete.')}</p><Link href={(es?'/es/centro-de-mercado':'/en/market-hub')+'?workspace=commercial&commercial=rights'}>{t('View Package access','Ver acceso al Paquete')}</Link></details>
 </section>
 return <section className="sinpe-instructions sinpe-compact" aria-busy={busy}>
 <h2>{paid?t('Payment verified','Pago verificado'):t('Pay with SINPE Móvil','Pagar con SINPE Móvil')}</h2>
 <h3>{name??t('Your purchase','Su compra')}</h3>
 {!paid&&<p className="sinpe-bank-warning"><strong>{t('IMPORTANT: PAYMENT MUST BE SENT FROM YOUR BANKING APP, NOT FROM TWUANIS.','IMPORTANTE: EL PAGO SE REALIZA DESDE LA APLICACIÓN DE SU BANCO, NO DESDE TWUANIS.')}</strong></p>}
 {termQuantity&&<p>{t('Duration','Duración')}: {termUnit==='day'?t('24 consecutive hours','24 horas consecutivas'):`${termQuantity} ${t('calendar month(s)','mes(es) calendario')}`}</p>}{durationDays&&<p>{t('Duration','Duración')}: {durationDays} {t('days from fulfillment','días desde la entrega')}</p>}
 <p>{paid?t('Amount paid','Monto pagado'):t('Exact Order amount','Monto exacto del pedido')}: <strong>{currency==='CRC'?sinpeMoney(amount):currency+' '+amount}</strong></p>
 <p>{t('Payment deadline','Fecha límite de pago')}: {date(deadline)} (Costa Rica)</p>
 <p role="status">{busy?t('Checking payment status…','Consultando el estado del pago…'):canTransfer?t('Payment pending — awaiting your bank transfer','Pago pendiente — esperando su transferencia bancaria'):status}</p>{message&&<p role="status">{message}</p>}
 {paid?<>
 {!complete&&<p>{attention?t('Payment is verified but access requires review. Do not pay again.','El pago está verificado, pero el acceso requiere revisión. No pague otra vez.'):t('Payment is verified. Fulfillment is pending; new purchased access has not been confirmed for this Order. Do not pay again.','El pago está verificado. La entrega del beneficio está pendiente; aún no se ha confirmado el nuevo acceso comprado para este pedido. No pague otra vez.')}</p>}
 {complete&&<p>{t('Canonical fulfillment is complete.','La entrega canónica del beneficio está completa.')} {state.accessState==='SCHEDULED'?t('Your purchased access is scheduled, not active yet.','Su acceso comprado está programado; aún no está activo.'):state.accessState==='ACTIVE'?t('Your purchased access is active.','Su acceso comprado está activo.'):state.accessState==='EXPIRED'?t('This purchased access has expired.','Este acceso comprado ha vencido.'):state.accessState==='REVOKED'?t('This purchased access has been revoked.','Este acceso comprado fue revocado.'):t('Review the delivered benefit in MarketHub.','Revise el beneficio entregado en el Centro del Mercado.')}</p>}
 {state?.startsAt&&<p><strong>{state.accessState==='SCHEDULED'?t('Purchased access scheduled start','Inicio programado del acceso comprado'):t('Actual access start','Inicio real del acceso')}:</strong> {date(state.startsAt)} (Costa Rica)</p>}{state?.endsAt&&<p>{t('Actual access end','Fin real del acceso')}: {date(state.endsAt)} (Costa Rica)</p>}
 {complete&&coverage&&<p>{coverage.bankAccess?t('Your account currently includes Bank/Remates access for this Package’s capabilities.','Su cuenta incluye actualmente acceso a bancos/remates para las capacidades de este Paquete.'):t('Bank/Remates access is not currently active for all of this Package’s capabilities.','El acceso a bancos/remates no está activo actualmente para todas las capacidades de este Paquete.')}</p>}
 </>:<>
 {canTransfer&&<><ol><li>{t('Open your banking app.','Abra la aplicación de su banco.')}</li><li>{t('Select SINPE Móvil.','Seleccione SINPE Móvil.')}</li><li>{t('Send the exact amount to the number displayed below.','Envíe el monto exacto al número indicado abajo.')}</li></ol>
 <section className="sinpe-transfer-details" aria-label={t('SINPE transfer details','Datos de transferencia SINPE')}>
 <p>{t('Recipient SINPE Móvil number','Número SINPE Móvil del destinatario')}: <strong>{destination}</strong></p><button type="button" onClick={()=>void copy(destination!.replace(/[ -]/g,''),t('SINPE number copied','Número SINPE copiado'))}>{t('Copy SINPE number','Copiar número SINPE')}</button>
 <p>{t('Exact amount','Monto exacto')}: <strong>{sinpeMoney(amount)}</strong></p><button type="button" onClick={()=>void copy(amount,t('Amount copied','Monto copiado'))}>{t('Copy amount','Copiar monto')}</button>
 <p role="status">{copied}</p>
 </section><p>{t('Twuanis will automatically verify the transfer with ONVO. You do not need to upload a receipt or manually confirm that you sent the payment. Send the exact amount once from the bank account matching your payer information.','Twuanis verificará automáticamente la transferencia con ONVO. No necesita subir comprobantes ni confirmar manualmente el envío. Envíe el monto exacto una sola vez desde la cuenta bancaria que corresponde a los datos del pagador ingresados.')}</p></>}
 {state?.initiation==='PAID_AWAITING_TIMING'?<p>{t('Payment was reported and requires a timing review. New access is not confirmed. Do not pay again.','Se reportó el pago y requiere revisar el plazo. El nuevo acceso no está confirmado. No pague otra vez.')}</p>:expired?<p>{t('The payment deadline has passed. Do not send a transfer. If you already sent it, check this same Order; do not pay again.','Venció el plazo de pago. No envíe una transferencia. Si ya la envió, consulte este mismo pedido; no pague otra vez.')}</p>:attention?<p>{t('This payment needs review. Do not send another transfer.','Este pago requiere revisión. No envíe otra transferencia.')}</p>:null}
 {showInstructions&&!canTransfer&&<p role="alert">{t('Authorized transfer details are unavailable. Do not transfer money; return to this same Order later.','Los datos de transferencia autorizados no están disponibles. No transfiera dinero; regrese luego a este mismo pedido.')}</p>}
 {state?.initiation==='READY'&&!expired&&<p>{t('Payment preparation has not been confirmed. Return to your existing purchase review; do not transfer without authorized instructions.','No se ha confirmado la preparación del pago. Regrese a la revisión existente de la compra; no transfiera sin instrucciones autorizadas.')}</p>}
 </>}
 {!complete&&<><p>{automaticPaused?t('Automatic refresh has paused after repeated checks. You may refresh this same Order’s status without starting another payment.','La actualización automática se pausó después de varias consultas. Puede actualizar el estado de este mismo pedido sin iniciar otro pago.'):sinpeStatusSettled(state,deadline,now)?t('Check this same Order for updates. Do not send another payment.','Consulte este mismo pedido para ver actualizaciones. No envíe otro pago.'):t('Status updates automatically while this page is visible and when you return from your banking app. ONVO verification does not require a confirmation button.','El estado se actualiza automáticamente mientras esta página está visible y al regresar de la aplicación de su banco. La verificación de ONVO no requiere un botón de confirmación.')}</p><button type="button" disabled={busy} onClick={()=>refreshHandle.current()}>{t('Check payment status','Consultar estado del pago')}</button></>}
 <p>{t('Order reference','Referencia del pedido')}: <strong>{order}</strong></p>
 <p><Link href={(es?'/es/centro-de-mercado':'/en/market-hub')+'?workspace=commercial&commercial=rights'}>{t('Open MarketHub / Package access','Abrir Centro del Mercado / acceso al Paquete')}</Link> · <Link href={'/commercial/'+order+'?lang='+language}>{t('Purchase details','Detalles de la compra')}</Link></p></section>
}
