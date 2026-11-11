'use client'
import {useEffect,useRef,useState} from 'react'
import {type CheckoutSelection,checkoutSelection} from '@/lib/checkout-selection'
import {methodPurchaseKey,recoverPackagePurchase,beginNewPackageAttempt,type PackageRecovery} from '@/lib/package-checkout-recovery'
import PackageRecoveryNotice from './PackageRecoveryNotice'
import ReceiptPicker from './ReceiptPicker'
import PaymentBrandMark from '@/app/components/PaymentBrandMark'
import '@/app/components/commercial-actions.css'
import './checkout.css'
import {sinpeMoney} from '@/lib/sinpe-journey'
import {RECEIPT_LIMIT,directUuid,type DirectCheckout} from '@/lib/direct-sinpe'
import {readDirectSinpe} from '@/app/payments/direct-actions'
import {readMyCommercial} from '@/app/commercial/actions'
import {createListingOverlayOrder} from './overlay-actions'
import {measuredPurchase} from '@/lib/measurement/actions'
import {context,once,serverSignal} from '@/lib/measurement/runtime'
import {durablePointer} from '@/lib/measurement/durable-consent-client'
import {queueJourneyOrder} from '@/lib/measurement/journey-client'
import '@/app/payments/sinpe-journey.css'
export type DirectOverlay={onAuthentication:()=>void;onBack:()=>void;onReceiptActivated?:(order:string)=>Promise<void>}
export default function DirectSinpeCheckout({selection,name,accountId,enabled,restriction,overlay,existingOrder}:{selection:CheckoutSelection;name:string;accountId?:string;enabled:boolean;restriction?:string;overlay?:DirectOverlay;existingOrder?:string}){
 const es=selection.lang==='es',t=(en:string,sp:string)=>es?sp:en,[data,setData]=useState<DirectCheckout|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[file,setFile]=useState<File|null>(null),[copied,setCopied]=useState(''),[revision,setRevision]=useState(0),[retained,setRetained]=useState<string|null>(existingOrder??null),[receiptStatus,setReceiptStatus]=useState<'checking'|'none'|'stored'|'uncertain'>('checking');const submitting=useRef(false)
 const key=accountId?methodPurchaseKey(accountId,selection):null
 const [recovery,setRecovery]=useState<PackageRecovery>({kind:'new'})
 const fallback=(es?'/es/inteligencia-de-mercado/paquetes':'/en/market-intelligence/packages')+'?checkoutProduct='+selection.product+'&checkoutDuration='+selection.duration+'&checkoutBank='+(selection.bank?'1':'0')+'&checkoutProvider=sinpe'
 useEffect(()=>{const record=()=>once('tw_package_select',{...context(selection.lang),package_id:selection.product,market_variant:selection.bank?'COMBINED':'PRIVATE',duration_kind:selection.duration==='day'?'daily':'monthly',selection_kind:'checkout_review_sinpe'},'checkout-review:'+selection.product+':'+selection.duration+':'+selection.bank+':sinpe');record();window.addEventListener('tw-measurement-consent',record);return()=>window.removeEventListener('tw-measurement-consent',record)},[selection.product,selection.duration,selection.bank,selection.lang])
 useEffect(()=>{let live=true;setLoading(true);setData(null);setError('');setFile(null);setReceiptStatus('checking')
  async function prepare(){try{
   if(!enabled&&!existingOrder)throw Error(restriction||t('Direct SINPE is unavailable. No new Order was created.','El SINPE directo no está disponible. No se creó un pedido nuevo.'))
   let order=existingOrder??null
   if(!existingOrder){if(!accountId||!key)throw Error(t('Sign in again to continue.','Vuelva a iniciar sesión para continuar.'));const recovered=await recoverPackagePurchase(sessionStorage,accountId,selection,async id=>{const r=await readMyCommercial('orders',null,id);return r.ok?r.items[0]??null:null});if(!live)return;setRecovery(recovered);if(recovered.kind!=='new'){setRetained(recovered.order?.id??null);if(recovered.kind==='pending'||recovered.kind==='completed'&&recovered.order?.paymentMethod==='direct_sinpe')order=recovered.order?.id??null;else return}}
   if(!order){if(!key)throw Error(t('Sign in again to continue.','Vuelva a iniciar sesión para continuar.'));let request=sessionStorage.getItem(key);if(!directUuid(request)){request=crypto.randomUUID();sessionStorage.setItem(key,request)}const input={request,kind:'package' as const,product:selection.product,currency:'CRC' as const,duration:selection.duration,bankUpgrade:selection.bank};const made=overlay?await createListingOverlayOrder({request,kind:'package',product:selection.product,duration:selection.duration,bankUpgrade:selection.bank,provider:'sinpe'},serverSignal(selection.lang),durablePointer()):await measuredPurchase(input,serverSignal(selection.lang),durablePointer());if(!made.ok){if('reason'in made&&made.reason==='authentication')overlay?.onAuthentication();throw Error(t('Could not prepare your purchase. Retry this same selection.','No se pudo preparar la compra. Reintente esta misma selección.'))}order=made.id;sessionStorage.setItem(key+':order',order);queueJourneyOrder(order)}
   if(!live)return;setRetained(order);const result=await readDirectSinpe(order);if(!live)return;if(!result.ok)throw Error(t('This purchase already has an Order. Its payment method cannot be changed. Review that existing Order; do not create another purchase.','Esta compra ya tiene un pedido. No se puede cambiar su método de pago. Revise ese pedido existente; no cree otra compra.'))
   if(result.data.state!=='HISTORICAL_PROVIDER_ORDER'&&(result.data.product!==selection.product||result.data.duration!==selection.duration||result.data.bankUpgrade!==selection.bank))throw Error(t('The retained Order has different coverage. Review it before continuing.','El pedido conservado tiene otra cobertura. Revíselo antes de continuar.'))
   setData(result.data)
   if(result.data.receiptActivated){setReceiptStatus('stored')}
   else if(result.data.state==='AWAITING_RECEIPT'||result.data.state==='EXPIRED'){
    const saved=await recoverReceipt(order);if(!live)return;applyReceiptResponse(saved)
   }else setReceiptStatus('none')
  }catch(e){if(live)setError(e instanceof Error?e.message:t('Purchase unavailable.','Compra no disponible.'))}finally{if(live)setLoading(false)}}
  void prepare();return()=>{live=false}
 },[key,existingOrder,enabled,revision,selection.lang])
 async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);setCopied(label)}catch{setCopied(t('Copy unavailable; select the displayed value.','No se pudo copiar; seleccione el valor mostrado.'))}}
 const pendingText=t('Your receipt is saved privately. Package activation is pending recovery. Do not transfer again or upload it again.','Su comprobante está guardado de forma privada. La activación del Paquete está pendiente de recuperación. No vuelva a transferir ni a subirlo.')
 const uncertainText=t('We could not check your saved receipt. Retry recovery on this same Order before uploading again.','No se pudo revisar su comprobante guardado. Reintente la recuperación en este mismo pedido antes de volver a subirlo.')
 async function recoverReceipt(order:string){try{const r=await fetch('/api/direct-sinpe/receipt',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({order})});return await r.json()}catch{return{ok:false,error:'recovery_unavailable'}}}
 function applyReceiptResponse(v:any){
  if(['format','receipt','size'].includes(v.error)){setReceiptStatus('none');setError(t('Choose a valid PDF, JPG, PNG or WebP receipt, up to 5 MB.','Seleccione un comprobante válido PDF, JPG, PNG o WebP de hasta 5 MB.'));return false}
  if(v.receiptStored===true){setReceiptStatus('stored');setFile(null)}
  else if(v.ok===true||v.error==='expired')setReceiptStatus('none')
  else setReceiptStatus('uncertain')
  if(v.ok&&v.data?.receiptActivated){setData(v.data);setError('');return true}
  if(v.receiptStored)setError(v.error==='expired'?t('Your receipt is preserved, but this Order has expired. Owner review is required; do not transfer again.','Su comprobante está conservado, pero este pedido venció. Se requiere revisión del Propietario; no vuelva a transferir.'):pendingText)
  else if(!v.ok&&v.error!=='expired')setError(v.error==='authentication'?t('Sign in again, then reopen this same Order to recover your receipt.','Vuelva a iniciar sesión y abra este mismo pedido para recuperar su comprobante.'):uncertainText)
  else setError('')
  return false
 }
 async function recoverSaved(){if(submitting.current||!data)return;submitting.current=true;setBusy(true);try{const v=await recoverReceipt(data.orderId);if(applyReceiptResponse(v)&&overlay?.onReceiptActivated)await overlay.onReceiptActivated(data.orderId)}finally{submitting.current=false;setBusy(false)}}
 async function submit(){if(submitting.current||!file||!data||data.state!=='AWAITING_RECEIPT'||receiptStatus!=='none')return;submitting.current=true;setBusy(true);setError('');try{
  if(file.size<1||file.size>RECEIPT_LIMIT)throw Error(t('Maximum receipt size: 5 MB.','Tamaño máximo del comprobante: 5 MB.'))
  const body=new FormData();body.set('order',data.orderId);body.set('receipt',file)
  const r=await fetch('/api/direct-sinpe/receipt',{method:'POST',body,credentials:'same-origin'});let v=await r.json()
  if(v.orderId&&v.orderId!==data.orderId||v.data?.orderId&&v.data.orderId!==data.orderId)throw Error('response')
  if(!v.ok&&v.receiptStored){applyReceiptResponse(v);v=await recoverReceipt(data.orderId)}
  if(applyReceiptResponse(v)&&overlay?.onReceiptActivated)await overlay.onReceiptActivated(data.orderId)
 }catch{applyReceiptResponse(await recoverReceipt(data.orderId))}finally{submitting.current=false;setBusy(false)}}

 const activated=data?.receiptActivated===true,canSubmit=data?.state==='AWAITING_RECEIPT'&&receiptStatus==='none',isExpired=data?.state==='EXPIRED',historical=data?.state==='HISTORICAL_PROVIDER_ORDER'
 return <section className="purchase-review sinpe-instructions sinpe-compact sinpe-two-step direct-sinpe-checkout" aria-label={t('Direct SINPE checkout','Pago SINPE directo')}>{!overlay&&<PaymentBrandMark/>}<h1>{t('Pay with SINPE','Pagar con SINPE')}</h1><h2>{name}</h2><p>{selection.duration==='day'?t('24-hour access','Acceso por 24 horas'):t('Monthly access','Acceso mensual')}{selection.bank?' · '+t('Including Bank Properties & Foreclosures','Incluye propiedades bancarias y remates'):''}</p>{loading?<p role="status">{t('Preparing your existing purchase…','Preparando su compra…')}</p>:<>
 {data?.amount&&<p className="sinpe-exact-amount">{t('Amount','Monto')}: <strong>{sinpeMoney(data.amount)}</strong></p>}
 {error&&<p role="alert">{error}</p>}
 {!existingOrder&&<PackageRecoveryNotice onRetry={()=>setRevision(v=>v+1)} showAmount={!data?.amount} recovery={recovery} language={selection.lang} onNew={()=>{if(!key)return;beginNewPackageAttempt(sessionStorage,key,crypto.randomUUID());setRetained(null);setRecovery({kind:'new'});setRevision(v=>v+1)}}/>}
 {activated?<div role="status"><h2>{data.state==='REVOKED'?t('Access revoked','Acceso revocado'):data.state==='ENDED'?t('Coverage ended','La cobertura terminó'):t('Package Activated','Paquete activado')}</h2><p>{data.reconciliation==='RECONCILED'?t('Receipt submitted; access activation recorded. The Owner marked this receipt reconciled.','Comprobante enviado; activación del acceso registrada. El Propietario marcó este comprobante como conciliado.'):data.reconciliation==='UNMATCHED'?t('Receipt submitted; access activation recorded. The Owner marked this receipt unmatched. Access follows the recorded coverage and revocation status.','Comprobante enviado; activación del acceso registrada. El Propietario marcó este comprobante sin coincidencia. El acceso depende de la cobertura y el estado de revocación registrados.'):t('Receipt submitted; access activated under the Owner’s policy. Bank settlement has not been independently verified.','Comprobante enviado; acceso activado según la política del Propietario. La liquidación bancaria no se ha verificado de forma independiente.')}</p>{data.startsAt&&data.endsAt&&<p>{t('Coverage','Cobertura')}: {new Date(data.startsAt).toLocaleString(es?'es-CR':'en-US',{timeZone:'America/Costa_Rica'})} — {new Date(data.endsAt).toLocaleString(es?'es-CR':'en-US',{timeZone:'America/Costa_Rica'})}</p>}{data.state==='SCHEDULED'&&<p>{t('Your existing coverage is preserved; this term starts at the recorded time.','Se conserva su cobertura existente; este período comienza en la fecha registrada.')}</p>}<a href={'/api/direct-sinpe/receipt/'+data.receiptId}>{t('Payment receipt','Comprobante de pago')}</a></div>:(receiptStatus==='stored'||receiptStatus==='uncertain')?<div role="status" className="receipt-recovery"><p>{receiptStatus==='stored'?t('Receipt preserved — activation pending','Comprobante conservado — activación pendiente'):t('Receipt recovery unavailable','Recuperación del comprobante no disponible')}</p>{!isExpired&&<button type="button" disabled={busy} onClick={()=>void recoverSaved()}>{busy?t('Recovering…','Recuperando…'):t('Retry activation','Reintentar activación')}</button>}<p>{t('Keep this Order. No new payment is required.','Conserve este pedido. No se requiere otro pago.')}</p></div>:canSubmit?<><p>{t('SINPE Number','Número SINPE')}: <strong>{data.receivingNumber}</strong></p><div className="sinpe-copy-row"><button className="commercial-action" type="button" onClick={()=>void copy(data.receivingNumber!,t('Number copied','Número copiado'))}>{t('Copy Number','Copiar número')}</button><button className="commercial-action" type="button" onClick={()=>void copy(data.amount!,t('Amount copied','Monto copiado'))}>{t('Copy Amount','Copiar monto')}</button></div><p>{t('Open your banking app and send the SINPE Móvil transfer.','Abre la aplicación de tu banco y realiza el SINPE Móvil.')}</p><form onSubmit={e=>{e.preventDefault();void submit()}}><ReceiptPicker file={file} onChange={setFile} disabled={busy} language={selection.lang}/><p>PDF, JPG, PNG, WebP · {t('Maximum 5 MB','Máximo 5 MB')}</p><button type="submit" disabled={busy||!file}>{busy?t('Submitting…','Enviando…'):t('Submit Receipt','Enviar comprobante')}</button></form></>:recovery.kind!=='new'&&!data?null:<p role="status">{historical?t('This is an existing ONVO Order. Its original payment path is preserved; no new direct payment was created.','Este es un pedido ONVO existente. Se conserva su proceso original; no se creó un pago directo.'):isExpired?t('This Order expired. Do not transfer to it.','Este pedido venció. No realice una transferencia para este pedido.'):t('Direct SINPE is unavailable. No transfer should be made.','El SINPE directo no está disponible. No realice la transferencia.')}</p>}
 {copied&&<p role="status">{copied}</p>}
 {retained&&(!canSubmit||error)&&!activated&&<a href={'/payments/'+retained+'?lang='+selection.lang}>{t('Review existing payment','Revisar pago existente')}</a>}
 {isExpired&&receiptStatus==='none'&&key&&!existingOrder&&<button type="button" onClick={()=>{beginNewPackageAttempt(sessionStorage,key,crypto.randomUUID());setRecovery({kind:'new'});setRetained(null);setRevision(v=>v+1)}}>{t('Prepare a new payment','Preparar un pago nuevo')}</button>}
 </>}{overlay?<button type="button" onClick={overlay.onBack}>{t('Back / Edit Selection','Volver / Editar selección')}</button>:<a href={fallback}>{t('Back / Edit Selection','Volver / Editar selección')}</a>}</section>
}
