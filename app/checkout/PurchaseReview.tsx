'use client'
import {methodPurchaseKey,recoverPackagePurchase,beginNewPackageAttempt,type PackageRecovery} from '@/lib/package-checkout-recovery'
import PackageRecoveryNotice from './PackageRecoveryNotice'
import PaymentBrandMark from '@/app/components/PaymentBrandMark'
import DirectSinpeCheckout from './DirectSinpeCheckout'
import {productAction,queueJourneyOrder} from '@/lib/measurement/journey-client'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import CheckoutCoverage from './CheckoutCoverage'
import SinpeCheckoutPayment from './SinpeCheckoutPayment'
import {context,once} from '@/lib/measurement/runtime'
import {boundedSinpeRead} from '@/lib/sinpe-status-refresh'
import {sinpeMoney} from '@/lib/sinpe-journey'
import SinpePayerFields,{payerErrors,type SinpePayer} from './SinpePayerFields'
import {readMyOnvoPayment} from '@/app/payments/actions'
import {type CheckoutSelection,checkoutPath,checkoutSelection} from '@/lib/checkout-selection'
import {purchaseExecutionCredits,readMyCommercial} from '@/app/commercial/actions'
import {createListingOverlayOrder} from './overlay-actions'
import {createStripeOrder,createStripeCreditOrder} from '@/app/commercial/stripe-actions'
import {useStripeCheckoutNavigation} from '@/app/components/StripeCheckoutNavigation'
import {measuredPurchase as purchaseCommercial} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {durablePointer} from '@/lib/measurement/durable-consent-client'
import {selectedPaymentQuote,packagePurchaseStorageKey} from '@/lib/package-payment-price'
import {commercialTheme} from '@/lib/commercial-theme'
import '@/app/components/commercial-actions.css'
import './checkout.css'
import '@/app/payments/sinpe-journey.css'
export default function PurchaseReview(props:Parameters<typeof ProviderPurchaseReview>[0]){
 const q=selectedPaymentQuote(props.product.paymentPricing,props.selection.duration,props.selection.bank)
 if(props.selection.kind==='package'&&props.selection.provider==='sinpe')return <DirectSinpeCheckout selection={props.selection} name={props.selection.lang==='es'?props.product.nameES:props.product.nameEN} accountId={props.accountId} enabled={props.enabled&&q?.sinpe.available===true} restriction={props.restriction} overlay={props.overlay}/>
 return <ProviderPurchaseReview {...props}/>
}
function ProviderPurchaseReview({selection,product,enabled,restriction,overlay,accountId}:{selection:CheckoutSelection;product:any;enabled:boolean;restriction:string;accountId?:string;overlay?:{onAuthentication:()=>void;onPayment:(order:string)=>void;onStripe:(order:string)=>Promise<void>;onBack:()=>void;stripeMode?:'embedded'|'hosted';onBankChange?:(bank:boolean)=>void;onReceiptActivated?:(order:string)=>Promise<void>}}){
 const es=selection.lang==='es',t=(en:string,sp:string)=>es?sp:en
 const [bank,setBank]=useState(selection.bank),[busy,setBusy]=useState(false),[error,setError]=useState(''),[created,setCreated]=useState<string|null>(null)
 const [payer,setPayer]=useState<SinpePayer>({number:'',identification:'',identificationType:0}),[fieldErrors,setFieldErrors]=useState<ReturnType<typeof payerErrors>>({}),[recovering,setRecovering]=useState(selection.provider==='sinpe'||selection.kind==='package')
 const [packageRecovery,setPackageRecovery]=useState<PackageRecovery>({kind:'new'}),[recoveryRevision,setRecoveryRevision]=useState(0)
 const [coverageReady,setCoverageReady]=useState(selection.kind!=='package')
 const [paymentOrder,setPaymentOrder]=useState<string|null>(null)
 const twoStep=selection.provider==='sinpe'&&selection.kind==='package'
 const locked=useRef(false),navigation=useStripeCheckoutNavigation(selection.lang)
 const daily=selection.kind==='package'&&selection.duration==='day'
 const base=Number(daily?product.dailyPrice:product.pricing.effectivePrice??product.pricing.standardPrice)
 const bankIncluded=product.marketPopulations?.includes('BANK')===true
 const upgrade=Number(product.pricing.bankUpgradePrice?.amount)
 const canBank=selection.kind==='package'&&!daily&&!bankIncluded&&Number.isFinite(upgrade)&&upgrade>=0
 const chosenBank=canBank&&bank,methodQuote=selection.kind==='package'?selectedPaymentQuote(product.paymentPricing,selection.duration,chosenBank):null,total=selection.kind==='package'?Number(methodQuote?.[selection.provider].chargeAmount):base+(chosenBank?upgrade:0)
 const referenceBase=Number(daily?product.secondaryDailyPrice:product.credit?product.currencyQuotes?.[selection.displayCurrency]:product.secondaryPricing?.effectivePrice??product.secondaryPricing?.standardPrice)
 const referenceUpgrade=Number(product.secondaryPricing?.bankUpgradePrice?.amount)
 const referenceTotal=selection.kind==='package'?Number(methodQuote?.[selection.provider].displayAmounts[selection.displayCurrency]):referenceBase+(chosenBank?referenceUpgrade:0)
 const payable=enabled&&(selection.kind!=='package'||methodQuote?.[selection.provider].available===true)&&Number.isFinite(base)&&base>0&&(!daily||product.dailyPrice!=null)&&(!selection.bank||canBank||bankIncluded)&&(selection.provider!=='stripe'||total>=2)
 const money=(n:number)=>selection.currency==='CRC'?sinpeMoney(n):new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency:selection.currency,currencyDisplay:'narrowSymbol',maximumFractionDigits:2}).format(n)
 const hub=es?'/es/centro-de-mercado':'/en/market-hub'
 const edit=selection.kind==='package'?(es?'/es/inteligencia-de-mercado/paquetes':'/en/market-intelligence/packages')+'?currency='+selection.displayCurrency+'&checkoutProduct='+selection.product+'&checkoutDuration='+selection.duration+'&checkoutBank='+(bank?'1':'0')+'&checkoutProvider='+selection.provider:hub+'?workspace=commercial&commercial='+(selection.kind==='credit'?'tokens':selection.listing?'listings':'founder')
 const currentSelection={...selection,bank:chosenBank},storageKey=selection.kind==='package'&&accountId?methodPurchaseKey(accountId,{...selection,bank:chosenBank}):'tw-checkout:'+checkoutPath(currentSelection)
 useEffect(()=>{
  const record=()=>{if(selection.kind!=='package')return;once('tw_package_select',{...context(selection.lang),package_id:selection.product,market_variant:chosenBank?'COMBINED':'PRIVATE',duration_kind:daily?'daily':'monthly',selection_kind:'checkout_review_'+selection.provider},'checkout-review:'+selection.product+':'+selection.duration+':'+chosenBank+':'+selection.provider)}
  record();window.addEventListener('tw-measurement-consent',record)
  return()=>window.removeEventListener('tw-measurement-consent',record)
 },[selection.kind,selection.lang,selection.product,selection.duration,selection.provider,chosenBank,daily])
 const showPayment=(id:string)=>{if(overlay){overlay.onPayment(id);return}if(twoStep){setCreated(id);setPaymentOrder(id);return}window.location.assign('/payments/'+id+'?lang='+selection.lang+'&currency='+selection.displayCurrency)}
 // Retain only the Order reference, never payer data. Refresh must not repeat preparation.
 useEffect(()=>{
  if(selection.kind!=='package'&&selection.provider!=='sinpe'&&!overlay)return
  let live=true;setRecovering(true);setCreated(null);setPaymentOrder(null);setError('')
  async function recover(){try{
   if(selection.kind==='package'){
    if(!accountId)throw Error('authenticated purchase identity required')
    const recovered=await recoverPackagePurchase(sessionStorage,accountId,currentSelection,async id=>{const r=await boundedSinpeRead(()=>readMyCommercial('orders',null,id));return r.ok?r.items[0]??null:null})
    if(!live)return;setPackageRecovery(recovered)
    if(recovered.kind!=='new')setCreated(recovered.order?.id??'')
    return
   }
   let existing=sessionStorage.getItem(storageKey+':order')
   if(existing&&/^[0-9a-f-]{36}$/i.test(existing)){
    if(selection.provider==='stripe'&&overlay){const detail=await boundedSinpeRead(()=>readMyCommercial('orders',null,existing));if(!live)return;if(detail.ok&&detail.items[0]?.currency==='USD'&&detail.items[0]?.product===selection.product){setCreated(existing);overlay.onPayment(existing);return}setCreated(existing);setError(t('Check this existing Order before retrying.','Consulte este pedido existente antes de reintentar.'));return}
    if(selection.provider==='stripe'&&!overlay){setCreated(existing);return}
    const status=await boundedSinpeRead(()=>readMyOnvoPayment(existing));if(!live)return
    if(status.ok&&(status.data?.canonicalPaid===true||status.data?.initiation==='AWAITING_TRANSFER')){showPayment(existing);return}
    // READY means no preparation has been reserved. The retained request UUID reuses the same Order.
    if(twoStep&&(!status.ok||status.data?.initiation!=='READY')){showPayment(existing);return}
    if(!status.ok||status.data?.initiation!=='READY'){setCreated(existing);setError(t('This purchase already has an Order. Check its payment status; do not start another payment.','Esta compra ya tiene un pedido. Consulte su estado; no inicie otro pago.'))}
   }
  }catch{if(live){if(selection.kind==='package')setPackageRecovery({kind:'review'});setError(t('Purchase recovery is unavailable. Check your Orders before continuing.','La recuperación de la compra no está disponible. Revise sus pedidos antes de continuar.'));setCreated('')}}finally{if(live)setRecovering(false)}}
  void recover();return()=>{live=false}
 },[storageKey,selection.provider,recoveryRevision])
 async function confirm(){
  const resuming=selection.kind==='package'&&selection.provider==='stripe'&&packageRecovery.kind==='pending'&&!!created
  if(locked.current||!payable||(created!==null&&!resuming)||recovering||(selection.provider==='sinpe'&&!coverageReady))return;
  if(selection.provider==='sinpe'){const errors=payerErrors(payer,es);setFieldErrors(errors);if(Object.keys(errors).length){requestAnimationFrame(()=>document.querySelector<HTMLElement>('.sinpe-payer [aria-invalid=true]')?.focus());return}}
  productAction('checkout_purchase','checkout');locked.current=true;setBusy(true);setError('')
  const current={...selection,bank:chosenBank},key=storageKey
  let handoff:ReturnType<typeof navigation.begin>|null=null
  try{
   const retainedRequest=sessionStorage.getItem(key),request=retainedRequest&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(retainedRequest)?retainedRequest:crypto.randomUUID();sessionStorage.setItem(key,request)
   if(selection.provider==='stripe'&&(!overlay||overlay.stripeMode==='hosted'))handoff=navigation.begin()
   const input={request,kind:selection.kind==='addon'?'addon' as const:'package' as const,product:selection.product,...(selection.kind==='package'?{duration:selection.duration,bankUpgrade:chosenBank}:selection.listing?{listing:selection.listing}:{})}
   const result=resuming?{ok:true as const,id:created!}:overlay?await createListingOverlayOrder({...input,provider:selection.provider},serverSignal(selection.lang),durablePointer()):selection.kind==='credit'?(selection.provider==='stripe'?await createStripeCreditOrder(request,selection.quantity):await purchaseExecutionCredits({request,product:selection.product,quantity:selection.quantity,currency:'CRC'})):(selection.provider==='stripe'?await createStripeOrder(input):await purchaseCommercial({...input,currency:'CRC'},serverSignal(selection.lang),durablePointer()))
   if(!result.ok){handoff?.cancel();if('reason'in result&&result.reason==='authentication'){overlay?overlay.onAuthentication():window.location.assign('/login?lang='+selection.lang+'&next='+encodeURIComponent(checkoutPath(current)));return}throw Error()}
   queueJourneyOrder(result.id)
   setCreated(result.id)
   if(selection.kind==='package'||selection.provider==='sinpe'||overlay)sessionStorage.setItem(key+':order',result.id)
   // Verify the actual immutable Order before any provider handoff. Never charge a changed quote silently.
   const detail=await boundedSinpeRead(()=>readMyCommercial('orders',null,result.id)),order=detail.ok?detail.items[0]:null
   if(order&&selection.kind==='package'&&selection.provider==='stripe')setPackageRecovery({kind:'pending',order})
   const expectedAmount=resuming&&packageRecovery.kind==='pending'?Number(packageRecovery.order?.amount):total
   if(!order||order.product!==selection.product||order.currency!==selection.currency||Number(order.amount)!==expectedAmount){handoff?.cancel();setError(t('The current price changed. Review the existing Order and its exact total before proceeding. Do not start another purchase.','El precio actual cambió. Revise el pedido existente y su total exacto antes de continuar. No inicie otra compra.'));return}
   if(selection.provider==='stripe'&&overlay){
    if(handoff)await handoff.checkout(result.id)
    await overlay.onStripe(result.id)
   }
   else if(handoff)await handoff.checkout(result.id)
   else {
    // Read canonical state before preparation: a recovered/paid Order must never start again.
    const status=await boundedSinpeRead(()=>readMyOnvoPayment(result.id))
    if(!status.ok)throw Error()
    const state=status.data
    if(state?.canonicalPaid===true||state?.payment==='APPROVED'||state?.initiation==='AWAITING_TRANSFER'){showPayment(result.id);return}
    if(state?.initiation!=='READY')throw Error()
    const response=await fetch('/api/onvo/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:result.id,...payer})}),prepared=await response.json()
    if(!response.ok||prepared.state!=='AWAITING_TRANSFER')throw Error()
    setPayer({number:'',identification:'',identificationType:0})
    showPayment(result.id)
   }
  }catch(e){handoff?.cancel();if(selection.kind==='package'&&e instanceof Error&&e.message==='checkout_expired')setPackageRecovery({kind:'expired',order:packageRecovery.kind==='pending'?packageRecovery.order:undefined});if(selection.kind==='package'&&e instanceof Error&&e.message==='checkout_completed')setPackageRecovery({kind:'completed',order:packageRecovery.kind==='pending'?packageRecovery.order:undefined});setError(t('We could not confirm the next step. Check your existing Orders before retrying. No payment is confirmed here.','No pudimos confirmar el siguiente paso. Revise sus pedidos antes de reintentar. Aquí no se confirma ningún pago.'))}
  finally{setBusy(false);locked.current=false}
 }
 if(twoStep&&paymentOrder)return <SinpeCheckoutPayment order={paymentOrder} language={selection.lang} product={selection.product} name={es?product.nameES:product.nameEN} quotedAmount={total} back={edit} onResume={()=>{setPaymentOrder(null);setCreated(null);setError('')}}/>
 if(twoStep)return <form className="purchase-review sinpe-two-step sinpe-compact" noValidate onSubmit={e=>{e.preventDefault();void confirm()}}>
  <h1>{t('Pay with SINPE Móvil','Pagar con SINPE Móvil')}</h1><h2>{es?product.nameES:product.nameEN}</h2>
  <p className="sinpe-selected-amount"><strong>{t('Exact amount','Monto exacto')}: {sinpeMoney(total)}</strong></p>
  <details className="review-product-details"><summary>{t('Package, duration and existing coverage','Paquete, duración y cobertura actual')}</summary>
   <p>{daily?t('24 consecutive hours','24 horas consecutivas'):`${product.termQuantity} ${t('calendar month(s)','mes(es) calendario')}`}</p>
   {canBank&&<><p>{t('Optional Bank/Remates coverage','Cobertura opcional de bancos/remates')}: {sinpeMoney(upgrade)}</p><label><input type="radio" name="bank" disabled={busy||created!==null||recovering} checked={!bank} onChange={()=>{setBank(false);overlay?.onBankChange?.(false)}}/>{t('Without Bank/Remates','Sin bancos/remates')}</label><label><input type="radio" name="bank" disabled={busy||created!==null||recovering} checked={bank} onChange={()=>{setBank(true);overlay?.onBankChange?.(true)}}/>{t('Include Bank/Remates','Incluir bancos/remates')}</label></>}
   {bankIncluded&&<p>{t('Bank/Remates included.','Incluye bancos/remates.')}</p>}
   <CheckoutCoverage compact product={selection.product} capabilities={(product.allCapabilities??product.capabilities??[]).map((c:any)=>c.id)} es={es} onReady={setCoverageReady}/>
  </details>
  <section><h2>{t('STEP 1 — MAKE THE SINPE TRANSFER','PASO 1 — HAZ EL SINPE')}</h2>
   <p>{t('Enter the payer’s bank details to show the verified receiving number. Preparing these details does not move money.','Completa los datos del pagador para mostrar el número de destino verificado. Preparar estos datos no mueve dinero.')}</p>
   <SinpePayerFields payer={payer} onChange={setPayer} errors={fieldErrors} disabled={busy||created!==null||recovering} es={es}/>
   {restriction&&<p role="alert">{restriction}</p>}{error&&<p role="alert">{error}</p>}{overlay&&navigation.fallback}
   {created!==null?<button type="button" onClick={()=>showPayment(created)}>{t('View this payment','Ver este pago')}</button>:<button type="submit" disabled={!payable||busy||recovering||!coverageReady}>{busy?t('Preparing…','Preparando…'):t('Show SINPE transfer details','Mostrar datos del SINPE')}</button>}
  </section>
  <section><h2>{t('STEP 2 — VERIFY YOUR PAYMENT','PASO 2 — VERIFICA TU PAGO')}</h2><button type="button" disabled>{t('Verify my payment','Verificar mi pago')}</button></section>
  <p>{overlay?<button type="button" onClick={overlay.onBack}>{t('Back / Edit Selection','Volver / Editar selección')}</button>:<Link href={edit}>{t('Back / Edit Selection','Volver / Editar selección')}</Link>}</p>
 </form>
 const ProductDetails=selection.provider==='sinpe'?'details':'div'
 return <form className="purchase-review" data-sinpe-compact={selection.provider==='sinpe'||undefined} noValidate onSubmit={e=>{e.preventDefault();void confirm()}}>{!overlay&&<PaymentBrandMark/>}<h1>{t('Review your purchase','Revise su compra')}</h1><h2 className="review-product-title">{es?product.nameES:product.nameEN}</h2>
 <ProductDetails className={selection.provider==='sinpe'?'review-product-details':undefined}>{selection.provider==='sinpe'&&<summary>{t('Package / product details and optional coverage','Detalles del Paquete / producto y cobertura opcional')}</summary>}
 {selection.kind==='package'?<><p className="review-product-description">{es?product.questionES:product.questionEN}</p><h3 className="review-capability-heading">{t('Included capabilities','Capacidades incluidas')}</h3><ul className="review-capability-list" role="list">{(product.allCapabilities??product.capabilities??[]).map((c:any)=><li key={c.id}>- {es?c.es:c.en}</li>)}</ul><p className="review-access-duration"><strong>{t('Access duration','Duración del acceso')}:</strong> {daily?t('24 consecutive hours from activation','24 horas consecutivas desde la activación'):`${product.termQuantity} ${t('calendar month(s)','mes(es) calendario')}`}</p><p>{t('Private property market analysis using the capabilities listed above.','Análisis del mercado de propiedades privadas con las capacidades indicadas arriba.')}</p>
 <section aria-label={t('Bank / Foreclosure Properties','Propiedades bancarias / remates')}><h3 className="review-bank-heading">{t('Bank / Foreclosure Properties','Propiedades Bancarias / Remates')}</h3>{bankIncluded?<p>{t('Included in this Package. No additional upgrade is needed.','Incluido en este Paquete. No necesita una mejora adicional.')}</p>:canBank?<><p>{t('Not included in the base selection. Optional monthly Bank/Remates access adds the same Package capabilities for eligible bank/foreclosure properties. It does not add algorithms beyond this Package.','No está incluido en la selección base. El acceso mensual opcional a bancos/remates agrega las mismas capacidades del Paquete para propiedades bancarias y remates elegibles. No agrega algoritmos fuera de este Paquete.')}</p><p>{t('Monthly Bank/Remates upgrade','Mejora mensual de bancos/remates')}: {money(upgrade)} · {product.termQuantity} {t('calendar month(s), aligned with this Package','mes(es) calendario, junto con este Paquete')}</p><label><input type="radio" name="bank" disabled={busy||!!created} checked={!bank} onChange={()=>{setBank(false);overlay?.onBankChange?.(false)}}/>{t('Continue without Bank/Remates','Continuar sin bancos/remates')}</label><label><input type="radio" name="bank" disabled={busy||!!created} checked={bank} onChange={()=>{setBank(true);overlay?.onBankChange?.(true)}}/>{t('Add Bank/Remates access','Agregar acceso a bancos/remates')}</label><p>{t('Private + Bank populations are available when the upgrade is fulfilled. Combined comparisons remain limited to your authorized Package capabilities.','Las poblaciones privada y bancaria están disponibles cuando se entrega la mejora. Las comparaciones combinadas se limitan a las capacidades autorizadas de su Paquete.')}</p></>:<p>{daily?t('Not included. Bank/Remates upgrades are monthly only; there is no daily upgrade. Choose monthly access to review that option.','No incluido. Las mejoras de bancos/remates son solo mensuales; no existe una mejora diaria. Elija acceso mensual para revisar esa opción.'):t('No eligible Bank/Remates upgrade is configured for this selection.','No hay una mejora de bancos/remates elegible configurada para esta selección.')}</p>}</section><p>{t('Access expires at the end of the purchased term. This purchase does not authorize automatic renewal. Existing scheduling rules determine the exact start and end, shown after fulfillment.','El acceso vence al finalizar el período comprado. Esta compra no autoriza renovación automática. Las reglas existentes determinan el inicio y fin exactos, mostrados después de la entrega.')}</p></>:product.credit?<><p>{selection.quantity} {t('execution credits','créditos de ejecución')}</p><p>{t('Credits do not grant Package capabilities or Bank/Remates access. Usage follows the existing credit terms.','Los créditos no conceden capacidades de Paquetes ni acceso a bancos/remates. El uso sigue los términos existentes de los créditos.')}</p></>:<><p>{es?product.descriptionES:product.descriptionEN}</p><p>{product.durationDays?`${product.durationDays} ${t('days from fulfillment','días desde la entrega')}`:product.termKind==='lifetime'?t('Lifetime membership protection; eligible products remain paid. Not unlimited access.','Protección de membresía de por vida; los productos elegibles siguen siendo de pago. No es acceso ilimitado.'):t('Commercial benefit and duration follow this product’s configured terms.','El beneficio y la duración siguen los términos configurados de este producto.')}</p>{selection.listing&&<p>{t('Selected listing','Anuncio seleccionado')}: {selection.listing}</p>}</>}
 </ProductDetails>
 {selection.provider==='sinpe'&&<>{selection.kind==='package'&&<p><strong>{t('Duration','Duración')}:</strong> {daily?t('24 consecutive hours from activation','24 horas consecutivas desde la activación'):`${product.termQuantity} ${t('calendar month(s)','mes(es) calendario')}`}</p>}<p>{t('Quantity','Cantidad')}: {selection.kind==='credit'?selection.quantity:1}</p>{selection.kind==='package'?<CheckoutCoverage compact product={selection.product} capabilities={(product.allCapabilities??product.capabilities??[]).map((c:any)=>c.id)} es={es} onReady={setCoverageReady}/>:<p>{t('The benefit becomes available only after verified payment and canonical fulfillment; its configured eligibility and duration still apply.','El beneficio estará disponible solo después de verificar el pago y su entrega canónica; se mantienen la elegibilidad y duración configuradas.')}</p>}</>}
 <dl className="payment-summary"><dt className="review-summary-label">{t('Payment method','Método de pago')}</dt><dd>{selection.provider==='sinpe'?'SINPE Móvil (CRC)':'Stripe (USD)'}</dd><dt className="review-summary-label">{t('Product','Producto')}</dt><dd>{money(selection.kind==='package'&&selection.provider==='stripe'?total:base)}</dd>{chosenBank&&selection.provider!=='stripe'&&<><dt className="review-summary-label">{t('Bank/Remates upgrade','Mejora de bancos/remates')}</dt><dd>{money(upgrade)}</dd></>}<dt>{t('Total payable','Total por pagar')}</dt><dd className="review-total">{money(total)} ({selection.currency})</dd></dl>
 {selection.displayCurrency!==selection.currency&&Number.isFinite(referenceTotal)&&<p>{t('Selected catalog currency','Moneda de catálogo seleccionada')}: {selection.displayCurrency} · {t('Canonical reference total','Total de referencia canónico')}: {new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency:selection.displayCurrency}).format(referenceTotal)}. {t('The payment above is charged only in','El pago de arriba se cobra únicamente en')} {selection.currency}.</p>}<p>{selection.provider==='sinpe'?t('Prepare SINPE payment creates your payment instructions. It does not debit your bank account.','Preparar pago SINPE crea sus instrucciones de pago. No debita su cuenta bancaria.'):t('Confirming proceeds to payment. It does not confirm payment or grant access.','Confirmar continúa al pago. No confirma el pago ni concede acceso.')}</p>{restriction&&<p role="alert">{restriction}</p>}{selection.provider==='stripe'&&total<2&&<p>{t('Stripe requires a minimum total of USD 2. Return and choose SINPE.','Stripe requiere un total mínimo de USD 2. Regrese y elija SINPE.')}</p>}{selection.kind==='package'&&<PackageRecoveryNotice onRetry={()=>setRecoveryRevision(v=>v+1)} recovery={packageRecovery} language={selection.lang} onNew={()=>{beginNewPackageAttempt(sessionStorage,storageKey,crypto.randomUUID());setCreated(null);setPackageRecovery({kind:'new'});setError('');setRecoveryRevision(v=>v+1)}}/>}{error&&<p role="alert">{error}</p>}{navigation.fallback}{created&&overlay?<button type="button" onClick={()=>overlay.onPayment(created)}>{t('Check existing Order','Consultar pedido existente')}</button>:created&&<Link href={'/commercial/'+created+'?lang='+selection.lang}>{t('Review existing Order / payment status','Revisar pedido existente / estado del pago')}</Link>}
 {selection.provider==='sinpe'&&<p className="sinpe-bank-warning"><strong>{t('IMPORTANT: PAYMENT MUST BE SENT FROM YOUR BANKING APP, NOT FROM TWUANIS.','IMPORTANTE: EL PAGO SE REALIZA DESDE LA APLICACIÓN DE SU BANCO, NO DESDE TWUANIS.')}</strong></p>}
 {selection.provider==='sinpe'&&<SinpePayerFields payer={payer} onChange={setPayer} errors={fieldErrors} disabled={busy||created!==null||recovering} es={es}/>}
 <div className="review-actions"><button className="commercial-action" data-commercial-theme={commercialTheme(selection.product)} type="submit" disabled={!payable||busy||(created!==null&&!(selection.kind==='package'&&selection.provider==='stripe'&&packageRecovery.kind==='pending'))||recovering||(selection.provider==='sinpe'&&!coverageReady)}>{busy?t(selection.provider==='sinpe'?'Preparing payment…':'Continuing…',selection.provider==='sinpe'?'Preparando el pago…':'Continuando…'):selection.provider==='sinpe'?t('Prepare SINPE payment','Preparar pago SINPE'):packageRecovery.kind==='pending'?t('Resume secure card payment','Continuar pago seguro con tarjeta'):t('Purchase','Comprar')}</button>{overlay?<button type="button" className="commercial-action commercial-secondary" data-commercial-theme={commercialTheme(selection.product)} onClick={overlay.onBack}>{t('Back / Edit Selection','Volver / Editar selección')}</button>:<Link className="commercial-action commercial-secondary" data-commercial-theme={commercialTheme(selection.product)} href={edit}>{t('Back / Edit Selection','Volver / Editar selección')}</Link>}</div></form>
}
