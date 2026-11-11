import './payment-status.css'
export function paymentStatusKind(status:string){
 const s=status.toUpperCase()
 if(['PAID','APPROVED','SUCCEEDED','RECEIPT_ACCEPTED'].includes(s))return'approved'
 if(['FAILED','FAILURE'].includes(s))return'failed'
 if(s==='REJECTED')return'rejected'
 if(['EXPIRED','ENDED'].includes(s))return'expired'
 if(['PENDING','PROCESSING','REVIEW_PENDING','AWAITING_RECEIPT','CREATED'].includes(s))return'pending'
 if(['RECEIVED_UNMATCHED','NEEDS_RESOLUTION'].includes(s))return'resolution'
 return'unknown'
}
export default function AdminPaymentStatus({status,language}:{status:string;language:'en'|'es'}){
 const kind=paymentStatusKind(status),es=language==='es'
 const labels={approved:es?'APROBADO':'APPROVED',pending:es?'PENDIENTE':'PENDING',failed:es?'FALLIDO':'FAILED',rejected:es?'RECHAZADO':'REJECTED',expired:es?'VENCIDO':'EXPIRED',resolution:es?'PENDIENTE DE RESOLUCIÓN':'PENDING RESOLUTION',unknown:es?'ESTADO NO DISPONIBLE':'STATUS UNAVAILABLE'}
 return <strong className={'admin-payment-status admin-payment-status--'+kind} data-payment-status={kind}>{labels[kind]}</strong>
}
