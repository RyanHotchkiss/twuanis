// Presentation only. Canonical acknowledgement and fulfillment remain authoritative.
export function onvoPaymentView(state:any,expired:boolean,language:'en'|'es'){
 const t=(en:string,es:string)=>language==='es'?es:en
 const paid=state?.canonicalPaid===true,complete=paid&&state?.fulfillment==='COMPLETE'
 const attention=state?.initiation==='PAID_AWAITING_TIMING'||state?.initiation==='NEEDS_RESOLUTION'||state?.fulfillment==='NEEDS_RESOLUTION'
 const failed=!paid&&state?.providerStatus==='failed'
 const status=complete?t('Purchase complete','Compra completada'):
  failed?t('Payment attempt failed or canceled — check this Order','Intento de pago fallido o cancelado — consulte este pedido'):
  attention?t('Payment requires review — do not pay again','El pago requiere revisión — no pague otra vez'):
  paid?t('Payment confirmed, activation pending','Pago confirmado, activación pendiente'):
  !state?t('Payment status unavailable','Estado del pago no disponible'):
  expired?t('Payment deadline expired — do not transfer','Plazo de pago vencido — no transfiera'):
  state.providerStatus==='processing'?t('Verifying payment','Verificando el pago'):
  state.initiation==='AWAITING_TRANSFER'?t('Awaiting transfer','Esperando la transferencia'):
  t('Payment preparation not confirmed','Preparación del pago no confirmada')
 return{paid,complete,attention:attention||failed,status,showInstructions:!!state&&state.initiation==='AWAITING_TRANSFER'&&!expired&&!paid&&!attention&&!failed}
}
