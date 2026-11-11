import 'server-only'
import {createHash} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {receiptMime,RECEIPT_LIMIT,type DirectCheckout} from '@/lib/direct-sinpe'

type Database={rpc:(name:string,args:Record<string,unknown>)=>PromiseLike<{data:any;error:any}>}
const extensions={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp'} as const
export type StoredReceipt={path:string;sha:string;mime:keyof typeof extensions;size:number}
export class ReceiptRecoveryUnavailable extends Error{}

// Only server uploads can write this bucket. Its account/Order/content-hash key is
// the durable association even when the later canonical transaction rolls back.
export async function storedDirectReceipt(account:string,order:string):Promise<StoredReceipt|null>{
 const prefix=account+'/'+order,storage=supabaseAdmin.storage.from('sinpe-receipts')
 const listed=await storage.list(prefix,{limit:100,offset:0,sortBy:{column:'created_at',order:'asc'}})
 if(listed.error||!listed.data||listed.data.length===100)throw new ReceiptRecoveryUnavailable()
 for(const item of listed.data){
  const match=/^([a-f0-9]{64})\.(pdf|jpg|png|webp)$/.exec(item.name)
  if(!match||!item.id)continue
  const path=prefix+'/'+item.name,download=await storage.download(path)
  if(download.error||!download.data)throw new ReceiptRecoveryUnavailable()
  if(download.data.size<1||download.data.size>RECEIPT_LIMIT)throw new ReceiptRecoveryUnavailable()
  const bytes=Buffer.from(await download.data.arrayBuffer()),mime=receiptMime(bytes)
  if(!mime||extensions[mime]!==match[2]||createHash('sha256').update(bytes).digest('hex')!==match[1])throw new ReceiptRecoveryUnavailable()
  // Fail closed on inconsistent provider metadata; never alter the original file.
  if(Number(item.metadata?.size)!==bytes.length||item.metadata?.mimetype!==mime)throw new ReceiptRecoveryUnavailable()
  return{path,sha:match[1],mime,size:bytes.length}
 }
 return null
}
export async function activateStoredDirectReceipt(db:Database,order:string,receipt:StoredReceipt):Promise<DirectCheckout|null>{
 const result=await db.rpc('submit_direct_sinpe_receipt',{p_order:order,p_path:receipt.path,p_sha256:receipt.sha,p_mime:receipt.mime,p_size:receipt.size})
 if(!result.error&&result.data?.orderId===order&&result.data.receiptActivated===true)return result.data
 const recovered=await db.rpc('read_direct_sinpe_checkout',{p_order:order})
 return !recovered.error&&recovered.data?.orderId===order&&recovered.data.receiptActivated===true?recovered.data:null
}
