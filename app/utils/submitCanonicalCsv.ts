import { supabase } from '@/lib/supabase'
// One bounded observation per request; keep failed rows available for review/retry.
export async function submitCanonicalCsv(rows:any[],setShow:(v:boolean)=>void,setRows:(v:any[])=>void) {
  if(rows.length>100)throw Error('Import at most 100 observations per batch.')
  const {data:{session},error}=await supabase.auth.getSession()
  if(error||!session)throw Error('Authentication required.')
  const remaining=[];let published=0
  for(const row of rows) {
    try {
      const response=await fetch('/api/import-canonical-csv',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(row)})
      const result=await response.json()
      if(!response.ok||result.success!==true)remaining.push({...row,canonicalImportError:result.error||'Import not confirmed.',retainedEvidenceId:result.evidenceId})
      else published++
    }catch{remaining.push({...row,canonicalImportError:'Import not confirmed. Retry the same observation.'})}
  }
  setRows(remaining)
  if(!remaining.length)setShow(false)

    const failureDetails = remaining
      .map((row, index) => {
        const sourceId =
          row.source_listing_id ||
          row.source_id ||
          `Row ${index + 1}`

        return `${sourceId}: ${row.canonicalImportError}`
      })
      .join('\n')

    alert(
      `${published} published; ${remaining.length} require review or retry.` +
        (failureDetails ? `\n\n${failureDetails}` : '')
    )
}
