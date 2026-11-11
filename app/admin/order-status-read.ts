import 'server-only'
import type {AdministrativeAuthority} from '@/lib/administrative-control'
type DB={rpc:(name:string,args:Record<string,unknown>)=>PromiseLike<{data:any;error:any}>}
// Read-only presentation join. Canonical Order states and all financial records
// remain untouched; receipt acceptance never implies verified bank settlement.
export async function orderPresentation(db:DB,data:any,authority:AdministrativeAuthority){
 if(!data)return data
 const rows=Array.isArray(data)?data:[data],ids=new Set(rows.map((r:any)=>r.id)),receipts=new Map<string,any>(),operations=new Map<string,any>()
 let receiptsComplete=!authority.owner,operationsComplete=!authority.permissions.includes('payments.read')
 async function pages(name:string,key:string,consume:(r:any)=>void){let after:string|null=null
  while(true){const result=await db.rpc(name,{p_after:after});if(result.error||!Array.isArray(result.data)||result.data.length>26)throw Error('Presentation reader unavailable')
   const page=result.data.slice(0,25);for(const r of page){if(typeof r[key]!=='string'||after!==null&&r[key]<=after)throw Error('Presentation cursor invalid');consume(r)}
   if(result.data.length<=25)return
   const next=page[24]?.[key];if(!next||next===after)throw Error('Presentation cursor did not advance');after=next
  }
 }
 if(authority.owner)try{await pages('admin_direct_sinpe_receipts','id',r=>{if(ids.has(r.orderId)&&r.activationTermId)receipts.set(r.orderId,r)});receiptsComplete=true}catch{receiptsComplete=false}
 if(authority.permissions.includes('payments.read'))try{await pages('admin_onvo_operations','orderId',r=>{if(ids.has(r.orderId))operations.set(r.orderId,r)});operationsComplete=true}catch{operationsComplete=false}
 const presented=await Promise.all(rows.map(async(row:any)=>{
  const receipt=receipts.get(row.id),matchingReceipt=receipt&&receipt.accountId===row.accountId&&receipt.product===row.productId?{id:receipt.id,activationTermId:receipt.activationTermId,reconciliation:receipt.reconciliation,recoveryName:receipt.recovery?.customerName}:null
  let attemptStates:string[]=[]
  if(authority.permissions.includes('payments.read'))try{const attempts=await db.rpc('admin_sinpe_read',{p_id:null,p_after:null,p_state:null,p_order:row.id});if(!attempts.error&&Array.isArray(attempts.data))attemptStates=[...new Set<string>(attempts.data.filter((p:any)=>p.orderId===row.id).map((p:any)=>p.state).filter((s:any)=>s==='REJECTED'||s==='FAILED'))]}catch{/* Canonical Order status remains available. */}
  return{...row,presentation:{receipt:matchingReceipt,receiptStatusAvailable:authority.owner&&receiptsComplete,providerPayment:operations.get(row.id)?.payment??null,providerStatusAvailable:operationsComplete,attemptStates}}
 }))
 return Array.isArray(data)?presented:presented[0]
}
