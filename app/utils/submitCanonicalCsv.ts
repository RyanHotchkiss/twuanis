import { supabase } from '@/lib/supabase'
export type CanonicalImportRecord={
  sourceId:string
  success:boolean
  listingId?:string
  evidenceId?:string
  outcome?:string
  result?:Record<string,unknown>
  error?:string
}
export type CanonicalImportProgress={completed:number,total:number,record:CanonicalImportRecord}
// One bounded observation per request; keep failed rows available for review/retry.
export async function submitCanonicalCsv(rows:any[],setShow:(v:boolean)=>void,setRows:(v:any[])=>void,onProgress?:(progress:CanonicalImportProgress)=>void) {
  if(rows.length>100)throw Error('Import at most 100 observations per batch.')
  const {data:{session},error}=await supabase.auth.getSession()
  if(error||!session)throw Error('Authentication required.')
  const remaining=[] as any[]
  const records:CanonicalImportRecord[]=[]
  for(const row of rows) {
    const sourceId=typeof row.source_listing_id==='string'?row.source_listing_id:typeof row.source_id==='string'?row.source_id:'Unknown source ID'
    try {
      const response=await fetch('/api/import-canonical-csv',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(row)})
      const result=await response.json() as Record<string,unknown>
      const record:CanonicalImportRecord={sourceId,success:response.ok&&result.success===true,listingId:typeof result.listingId==='string'?result.listingId:undefined,evidenceId:typeof result.evidenceId==='string'?result.evidenceId:undefined,outcome:typeof result.outcome==='string'?result.outcome:undefined,result:result.result&&typeof result.result==='object'&&!Array.isArray(result.result)?result.result as Record<string,unknown>:undefined,error:typeof result.error==='string'?result.error:undefined}
      if(!record.success)remaining.push({...row,canonicalImportError:record.error||'Import not confirmed.',retainedEvidenceId:record.evidenceId})
      records.push(record)
      onProgress?.({completed:records.length,total:rows.length,record})
    }catch{
      const record:CanonicalImportRecord={sourceId,success:false,error:'Import not confirmed. Retry the same observation.'}
      remaining.push({...row,canonicalImportError:record.error})
      records.push(record)
      onProgress?.({completed:records.length,total:rows.length,record})
    }
  }
  setRows(remaining)
  if(!remaining.length)setShow(false)
  return {records,remaining}
}
