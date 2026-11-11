'use client'
import {useEffect,useRef,useState} from 'react'
import PaymentBrandMark from './PaymentBrandMark'
import EmailAuthModal from './EmailAuthModal'
import PurchaseReview from '@/app/checkout/PurchaseReview'
import OnvoPayment from '@/app/payments/OnvoPayment'
import StripeEmbeddedCheckout from './StripeEmbeddedCheckout'
import {useStripeCheckoutNavigation} from './StripeCheckoutNavigation'
import {boundedSinpeRead} from '@/lib/sinpe-status-refresh'
import {loadOverlayReview,loadOverlayPayment} from '@/app/checkout/overlay-actions'
import {checkoutPath,type CheckoutSelection} from '@/lib/checkout-selection'
import type {Lens} from '@/lib/lpi-contract'
import './ListingCheckoutOverlay.css'
type Review=Awaited<ReturnType<typeof loadOverlayReview>>;type Payment=Awaited<ReturnType<typeof loadOverlayPayment>>
export default function ListingCheckoutOverlay({selection,lens,onClose,onAccount,onPaid,onSelection}:{selection:CheckoutSelection;lens:Lens;onClose:()=>void;onAccount:(account:string)=>boolean;onPaid:(order:string,account:string)=>Promise<boolean>;onSelection:(selection:CheckoutSelection)=>void}){
 const dialog=useRef<HTMLDialogElement>(null),callbacks=useRef({onClose,onAccount,onPaid});callbacks.current={onClose,onAccount,onPaid}
 const[review,setReview]=useState<Review|null>(null),[order,setOrder]=useState<string|null>(null),[payment,setPayment]=useState<Payment|null>(null),[message,setMessage]=useState(''),[refresh,setRefresh]=useState(0),[reviewRevision,setReviewRevision]=useState(0)
 const live=useRef(true),checking=useRef<Promise<void>|null>(null),account=useRef<string|null>(null),done=useRef(false);const es=selection.lang==='es'
 useEffect(()=>{live.current=true;const oldOverflow=document.body.style.overflow,focus=document.activeElement as HTMLElement|null,scrollX=window.scrollX,scrollY=window.scrollY;document.body.style.overflow='hidden';dialog.current?.showModal();return()=>{live.current=false;dialog.current?.close();document.body.style.overflow=oldOverflow;window.scrollTo(scrollX,scrollY);focus?.focus({preventScroll:true})}},[])
 useEffect(()=>{let active=true;setReview(null);loadOverlayReview(selection,lens).then(r=>{if(!active)return;if(r.state==='ready'){if(!callbacks.current.onAccount(r.account)){setReview({state:'unavailable'});setMessage(es?'La cuenta cambió. Cierre y ejecute de nuevo.':'Account changed. Close and run again.');return}account.current=r.account}setReview(r)}).catch(()=>{if(active)setReview({state:'unavailable'})});return()=>{active=false}},[checkoutPath(selection),lens,refresh])
 async function check(){if(!order||done.current)return;if(checking.current)return checking.current;const id=order;const p=(async()=>{try{const r=await boundedSinpeRead(()=>loadOverlayPayment(id,selection.lang));if(!live.current)return;setPayment(r);if(r.state==='ready'&&r.row.paid===true&&r.row.fulfilled===true&&account.current){if(await callbacks.current.onPaid(id,account.current)){done.current=true}else if(live.current)setMessage(es?'Pago verificado; se requiere acceso activo para continuar. Puede volver a comprobar el estado.':'Payment verified; active access is required to continue. You may check status again.')}}catch{if(live.current)setMessage(es?'Estado no disponible. Conserve este pedido; no pague de nuevo.':'Status unavailable. Keep this Order; do not pay again.')}})().finally(()=>{checking.current=null});checking.current=p;return p}
 const checkRef=useRef(check);checkRef.current=check
 useEffect(()=>{if(!order)return;let n=0;void checkRef.current();const timer=window.setInterval(()=>{if(++n>120){clearInterval(timer);return}void checkRef.current()},5000);const focus=()=>{void checkRef.current()};window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus)}},[order])
 return <dialog ref={dialog} className="lpi-checkout-overlay" aria-label={es?'Compra sin salir de la propiedad':'Purchase without leaving the property'} onCancel={e=>{e.preventDefault();onClose()}}><header><h2>{es?'Acceso a Inteligencia':'Intelligence access'}</h2><PaymentBrandMark/><button autoFocus type="button" onClick={onClose}>{es?'Cerrar':'Close'}</button></header><div className="lpi-checkout-content">
 {!review?<p role="status">{es?'Cargando…':'Loading…'}</p>:review.state==='authentication'?<><EmailAuthModal redirectTo={typeof window==='undefined'?undefined:window.location.pathname} onClose={onClose} onAuthenticated={id=>{if(callbacks.current.onAccount(id)){account.current=id;setRefresh(v=>v+1)}}}/><p>{es?'La verificación por correo o recuperación de contraseña puede salir de esta página. Si se pierde el contexto, ejecute de nuevo explícitamente.':'Email verification or password recovery may leave this page. If context is lost, explicitly run again.'}</p></>:review.state==='unavailable'?<p role="alert">{es?'La compra integrada no está disponible. Cierre para conservar la propiedad.':'In-context purchase is unavailable. Close to retain the property.'}</p>:<>
 {review.selection.provider==='stripe'&&review.stripeMode==='hosted'&&<p role="status">{es?'El pago seguro con tarjeta se abrirá en una pestaña nueva de Stripe. Esta propiedad permanecerá aquí.':'Secure card payment will open in a new Stripe tab. This property will remain here.'}</p>}
 <div hidden={!!order&&!(review.selection.provider==='stripe'&&review.stripeMode==='hosted')}><PurchaseReview accountId={review.account} key={reviewRevision} selection={review.selection} product={review.product} enabled={review.enabled} restriction={review.restriction||(!review.enabled?(es?'Este método no está disponible actualmente. No se creará un pedido.':'This payment method is currently unavailable. No Order will be created.'):'')} overlay={{stripeMode:review.stripeMode,onBankChange:bank=>onSelection({...review.selection,bank}),onAuthentication:()=>setReview({state:'authentication'}),onPayment:setOrder,onStripe:async id=>{setOrder(id)},onBack:onClose,onReceiptActivated:async id=>{if(account.current)await callbacks.current.onPaid(id,account.current)}}}/></div>
 {order&&<><p>{es?'Referencia del pedido':'Order reference'}: {order}</p>
 {payment?.state==='ready'&&payment.row.currency==='CRC'?<OnvoPayment order={order} language={selection.lang} currency="CRC" amount={payment.row.amount} deadline={payment.row.deadline} name={es?payment.row.nameES:payment.row.nameEN} instructions={payment.instructions??''} twoStep onResumePreparation={()=>{setOrder(null);setPayment(null);setReviewRevision(v=>v+1)}} onVerified={()=>{void checkRef.current()}}/>:payment?.state==='ready'&&payment.row.currency==='USD'&&!payment.row.paid?(review.stripeMode==='embedded'?<StripeEmbeddedCheckout order={order} language={selection.lang} onComplete={()=>{void checkRef.current()}}/>:<HostedCardPayment order={order} language={selection.lang}/>):<p role="status">{es?'Consultando confirmación canónica y acceso.':'Checking canonical confirmation and access.'}</p>}
 <button type="button" onClick={()=>void checkRef.current()}>{es?'Consultar estado':'Check status'}</button></>}
 </>}

 {message&&<p role="status">{message}</p>}
 </div></dialog>
}

function HostedCardPayment({order,language}:{order:string;language:'en'|'es'}){
 const navigation=useStripeCheckoutNavigation(language),[busy,setBusy]=useState(false),[error,setError]=useState(false),es=language==='es'
 return <section aria-label={es?'Pago seguro con tarjeta':'Secure card payment'}><button type="button" disabled={busy} onClick={()=>{if(busy)return;const handoff=navigation.begin();setBusy(true);setError(false);void handoff.checkout(order).catch(()=>{setError(true)}).finally(()=>setBusy(false))}}>{es?'Abrir pago seguro con tarjeta':'Open secure card payment'}</button>{navigation.fallback}{error&&<p role="alert">{es?'No se pudo abrir Stripe. Conserva este pedido; vuelve a intentar abrir el pago.':'Stripe could not open. Keep this Order; retry opening checkout.'}</p>}</section>
}
