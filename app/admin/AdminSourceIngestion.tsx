'use client'
import {useState} from 'react'
import Papa from 'papaparse'
import {submitCanonicalCsv,type CanonicalImportRecord} from '@/app/utils/submitCanonicalCsv'
import type {AdminLanguage} from './admin-contract'

type ImportSummary={records:CanonicalImportRecord[];remaining:Record<string,unknown>[]}
const copy={en:{intro:'Submit externally acquired source observations to the canonical admission pipeline. Every row retains immutable source evidence; acceptance does not bypass duplicate review or publication rules.',choose:'Choose source-ingestion CSV',ready:'observations ready',limit:'A submission may contain at most 100 observations.',submit:'Submit canonical observations',submitting:'Submitting',accepted:'Accepted',holds:'Held for review',rejected:'Rejected / not accepted',errors:'Errors',result:'Submission results',source:'Source ID',outcome:'Canonical outcome',publication:'Publication result',error:'Error',invalid:'The selected CSV could not be parsed.',oversize:'Choose a CSV with no more than 100 observations.',required:'The CSV must contain source observation evidence.',unknown:'Not reported by canonical authority',noPublication:'No separate publication result was returned.',retry:'Rows requiring review or retry remain loaded.'},es:{intro:'Envíe observaciones de fuentes externas al proceso de admisión canónica. Cada fila conserva evidencia inmutable de la fuente; la aceptación no evita las reglas de revisión de duplicados ni de publicación.',choose:'Elegir CSV de ingesta de fuente',ready:'observaciones listas',limit:'Un envío puede contener como máximo 100 observaciones.',submit:'Enviar observaciones canónicas',submitting:'Enviando',accepted:'Aceptadas',holds:'Retenidas para revisión',rejected:'Rechazadas / no aceptadas',errors:'Errores',result:'Resultados del envío',source:'ID de fuente',outcome:'Resultado canónico',publication:'Resultado de publicación',error:'Error',invalid:'No se pudo analizar el CSV seleccionado.',oversize:'Elija un CSV con un máximo de 100 observaciones.',required:'El CSV debe contener evidencia de observación de fuente.',unknown:'No informado por la autoridad canónica',noPublication:'No se devolvió un resultado de publicación separado.',retry:'Las filas que requieren revisión o reintento permanecen cargadas.'}}

function classification(record:CanonicalImportRecord){
 const text=`${record.outcome||''} ${record.error||''}`.toLowerCase()
 if(record.success)return 'accepted'
 if(/duplicate|review|hold|quarantine/.test(text))return 'hold'
 return 'rejected'
}
function publication(record:CanonicalImportRecord,empty:string){
 const result=record.result
 const direct=typeof result?.publication==='string'?result.publication:typeof result?.publicationCompleted==='boolean'?(result.publicationCompleted?'published':'not published'):undefined
 return direct||empty
}
export default function AdminSourceIngestion({language}:{language:AdminLanguage}){
 const t=copy[language], [rows,setRows]=useState<Record<string,unknown>[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[completed,setCompleted]=useState(0),[summary,setSummary]=useState<ImportSummary|null>(null)
 function choose(file:File|undefined){
  setError('');setSummary(null);setCompleted(0);setRows([])
  if(!file)return
  Papa.parse<Record<string,unknown>>(file,{header:true,skipEmptyLines:'greedy',complete:result=>{
   if(result.errors.length){setError(t.invalid);return}
   if(result.data.length>100){setError(t.oversize);return}
   if(!result.data.length||!result.meta.fields?.includes('source_observation_input')||!result.meta.fields?.includes('unresolved_normalizer_review')){setError(t.required);return}
   setRows(result.data)
  },error:()=>setError(t.invalid)})
 }
 async function submit(){
  if(!rows.length||busy)return
  setBusy(true);setError('');setSummary(null);setCompleted(0)
  try{const result=await submitCanonicalCsv(rows,()=>{},setRows,progress=>setCompleted(progress.completed));setSummary(result)}catch(cause){setError(cause instanceof Error?cause.message:t.invalid)}finally{setBusy(false)}
 }
 const records=summary?.records||[], accepted=records.filter(r=>classification(r)==='accepted').length, holds=records.filter(r=>classification(r)==='hold').length,rejected=records.filter(r=>classification(r)==='rejected').length
 return <section className="admin-source-ingestion">
  <p>{t.intro}</p><p>{t.limit}</p>
  <label>{t.choose}<input type="file" accept=".csv,text/csv" disabled={busy} onChange={event=>choose(event.target.files?.[0])}/></label>
  {!!rows.length&&<p>{rows.length} {t.ready}</p>}{error&&<p role="alert">{error}</p>}
  <button onClick={()=>void submit()} disabled={busy||!rows.length}>{busy?`${t.submitting} ${completed}/${rows.length}`:t.submit}</button>
  {busy&&<progress aria-label={t.submitting} max={rows.length} value={completed}/>}
  {summary&&<><h3>{t.result}</h3><dl><div><dt>{t.accepted}</dt><dd>{accepted}</dd></div><div><dt>{t.holds}</dt><dd>{holds}</dd></div><div><dt>{t.rejected}</dt><dd>{rejected}</dd></div><div><dt>{t.errors}</dt><dd>{rejected}</dd></div></dl>{summary.remaining.length>0&&<p>{t.retry}</p>}
   <table><thead><tr><th>{t.source}</th><th>{t.outcome}</th><th>{t.publication}</th><th>{t.error}</th></tr></thead><tbody>{records.map((record,index)=><tr key={`${record.sourceId}-${index}`} className={`result-${classification(record)}`}><td>{record.sourceId}</td><td>{record.outcome||t.unknown}</td><td>{publication(record,t.noPublication)}</td><td>{record.error||'—'}</td></tr>)}</tbody></table>
  </>}
 </section>
}
