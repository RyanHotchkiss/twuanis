'use client'
import {useCallback,useEffect,useRef,useState} from 'react'
import {duplicateRead,duplicateDecision,admissionRead,adminRead} from './actions'
type Evidence=Record<string,unknown>
type Pair={reference:Evidence;priceEqual:boolean|null;verifiedWhatsappEqual:boolean|null;fx:unknown}
type Case={id:string;listing_id:string;created_at:string;proposed:Evidence;candidates:Pair[];status:string;version:number;customer_email:string|null;history:unknown[];admission_history?:unknown[];source_updates?:unknown[]}
function pictures(value:unknown):string[]{
 if(typeof value!=='string')return []
 try{const parsed=JSON.parse(value);if(Array.isArray(parsed))return parsed.filter((p):p is string=>typeof p==='string')}catch{}
 return value.split('|').filter(Boolean)
}
function EvidenceCard({value,es}:{value:Evidence;es:boolean}){
 const labels:Record<string,string>=es?{id:'Identidad canónica del anuncio',title:'Título',description:'Descripción',source_name:'Fuente',source_listing_id:'Identidad de fuente',source_url:'URL de fuente',province:'Provincia',canton:'Cantón',district:'Distrito',canonical_geography:'Identidades geográficas',property_type:'Tipo de propiedad',canonical_type:'Identidad del tipo',transaction_type:'Transacción',property_area:'Área de propiedad (m²)',construction_area:'Área de construcción (m²)',current_price:'Precio de venta',monthly_price:'Precio mensual',currency:'Moneda',verified_contact:'WhatsApp verificado',whatsapp:'WhatsApp proporcionado',owner_id:'Cuenta del cliente',canonical_revision:'Revisión canónica'}:{id:'Canonical listing ID',title:'Title',description:'Description',source_name:'Source',source_listing_id:'Source listing ID',source_url:'Source URL',province:'Province',canton:'Canton',district:'District',canonical_geography:'Canonical geography IDs',property_type:'Property type',canonical_type:'Canonical type ID',transaction_type:'Transaction',property_area:'Property area (m²)',construction_area:'Construction area (m²)',current_price:'Sale asking price',monthly_price:'Monthly asking price',currency:'Currency',verified_contact:'Verified WhatsApp',whatsapp:'Provided WhatsApp',owner_id:'Customer account',canonical_revision:'Canonical revision'}
 const exact=value._exact&&typeof value._exact==='object'?value._exact as Record<string,unknown>:{}
 const display=(k:string)=>{const v=exact[k]??value[k];return v===null||v===undefined?(es?'No disponible':'Not available'):typeof v==='object'?JSON.stringify(v):String(v)}
 const fields=['id','title','description','source_name','source_listing_id','source_url','province','canton','district','canonical_geography','property_type','canonical_type','transaction_type','property_area','construction_area','current_price','monthly_price','currency','verified_contact','whatsapp','owner_id','canonical_revision']
 return <section style={{minWidth:0,overflowWrap:'anywhere'}}><h3>{String(value.title||value.id)}</h3><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{pictures(value.images).map((path,i)=>{const src=/^https?:\/\//.test(path)?path:`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings-images/${path}`;return <img key={path+i} src={src} alt={es?'Fotografía del anuncio':'Listing photograph'} width={160} height={110} style={{objectFit:'contain',maxWidth:'100%'}}/>})}</div><dl>{fields.map(k=><div key={k}><dt><strong>{labels[k]||k}</strong></dt><dd style={{marginLeft:0}}>{display(k)}</dd></div>)}</dl></section>
}
type Feedback={kind:'success'|'error'|'pending';text:string;caseId?:string}
const decisions=['CONFIRM_DUPLICATE','DIFFERENT_PROPERTIES','UNRESOLVED'] as const
type Decision=typeof decisions[number]

export default function AdminDuplicateReview({language}:{language:'en'|'es'}){
 const es=language==='es'
 const [items,setItems]=useState<Case[]>([]),[pending,setPending]=useState<number|null>(null),[history,setHistory]=useState(false),[feedback,setFeedback]=useState<Feedback|null>(null),[loading,setLoading]=useState(false),[submitting,setSubmitting]=useState<Decision|null>(null),[reason,setReason]=useState(''),[selectedCase,setSelectedCase]=useState<string|null>(null),[openHistory,setOpenHistory]=useState<string|null>(null),[cursor,setCursor]=useState<{before:string;beforeId:string}|null>(null)
 const requests=useRef(new Map<string,string>())
 const busy=loading||submitting!==null
 const load=useCallback(async(preserveFeedback=false)=>{
  const requested=selectedCase||new URLSearchParams(location.search).get('case')
  if(!requested){setItems([]);setPending(null);return false}
  setLoading(true)
  const query:Record<string,unknown>={status:history?'all':'pending',...cursor,case:requested}
  query.status='all'
  const r=await duplicateRead(query)
  setLoading(false)
  if(!r.ok){setItems([]);setPending(null);if(!preserveFeedback)setFeedback({kind:'error',caseId:requested,text:es?'La revisión no se pudo actualizar.':'The review could not be refreshed.'});return false}
  setItems(r.data.items);setPending(r.data.pendingCount)
  return true
 },[history,cursor,es,selectedCase])
 useEffect(()=>{void load()},[load])
 const label=(decision:Decision)=>es?({CONFIRM_DUPLICATE:'Confirmar duplicado',DIFFERENT_PROPERTIES:'Propiedades diferentes',UNRESOLVED:'Sin resolver'}[decision]):({CONFIRM_DUPLICATE:'Confirm duplicate',DIFFERENT_PROPERTIES:'Different properties',UNRESOLVED:'Unresolved'}[decision])
 function successfulFeedback(decision:Decision,data:any,review:any,readbackError?:string){
  const caseStatus=typeof review?.status==='string'?review.status:decision
  const recorded=es?`Decisión registrada: ${label(decision)}. Estado del caso: ${caseStatus}.`:`Decision recorded: ${label(decision)}. Case status: ${caseStatus}.`
  const publication=data?.publication&&typeof data.publication==='object'?data.publication as Record<string,unknown>:null
  let outcome=''
  if(decision==='DIFFERENT_PROPERTIES'){
   const publicationOutcome=typeof publication?.outcome==='string'?publication.outcome:''
   if(publication?.publicationCompleted===true&&(publicationOutcome==='succeeded'||publicationOutcome==='noop')) outcome=es?' La propuesta fue admitida y la publicación se completó.':' The proposed listing was admitted and publication completed.'
   else {const detail=typeof publication?.restriction==='string'?publication.restriction:typeof publication?.error==='string'?publication.error:publicationOutcome||'publication_result_missing';outcome=(es?' La propuesta no fue publicada: ':' The proposed listing was not published: ')+detail}
  }else if(decision==='CONFIRM_DUPLICATE') outcome=es?' La propuesta no fue admitida y no se intentó publicar.':' The proposed listing was not admitted and publication was not attempted.'
  else outcome=caseStatus==='AUTOMATIC_REJECTION'?(es?' La actualización de evidencia rechazó automáticamente la propuesta; no se intentó publicar.':' The evidence refresh automatically rejected the proposal; publication was not attempted.'):(es?' El caso permanece sin resolver; no se intentó publicar.':' The case remains unresolved; publication was not attempted.')
  const historyNote=typeof review?.historyCount==='number'?(es?` Historial de decisiones: ${review.historyCount}.`:` Decision history entries: ${review.historyCount}.`):''
  const readbackNote=readbackError?(es?' La decisión se registró, pero no se pudo confirmar el detalle actualizado.':' The decision was recorded, but refreshed detail could not be confirmed.') : ''
  return recorded+outcome+historyNote+readbackNote
 }
 async function decide(c:Case,decision:Decision){
  const trimmed=reason.trim()
  if(trimmed.length<3)return
  setSubmitting(decision)
  setFeedback({kind:'pending',caseId:c.id,text:es?`Procesando: ${label(decision)}…`:`Submitting: ${label(decision)}…`})
  const key=c.id+':'+c.version+':'+decision+':'+trimmed
  let request=requests.current.get(key)
  if(!request){request=crypto.randomUUID();requests.current.set(key,request)}
  const r=await duplicateDecision(request,c.id,c.version,decision,trimmed)
  if(!r.ok){setSubmitting(null);setFeedback({kind:'error',caseId:c.id,text:r.error||(es?'La decisión no se confirmó.':'The decision was not confirmed.')});return}
  setReason('')
  const message=successfulFeedback(decision,r.data,r.review,r.readbackError)
  setFeedback({kind:'success',caseId:c.id,text:message})
  setOpenHistory(c.id)
  const refreshed=await load(true)
  if(!refreshed)setFeedback({kind:'success',caseId:c.id,text:message+(es?' Los resultados no pudieron actualizarse; actualice la evidencia antes de realizar otra decisión.':' Results could not be refreshed; refresh the evidence before another decision.')})
  setSubmitting(null)
 }
 return <section aria-busy={busy}>
  <AdmissionOverview language={language} onInspect={id=>{setSelectedCase(id);setCursor(null);setFeedback(null)}} refreshKey={items.map(c=>c.id+':'+c.version+':'+c.status).join(',')}/>
  {items.length>0&&<h2>{es?'Evidencia de revisión':'Review evidence'}</h2>}
  {items.length>0&&<button disabled={busy} onClick={()=>void load()}>{es?'Actualizar evidencia':'Refresh evidence'}</button>}
  {feedback&&!feedback.caseId&&<p role={feedback.kind==='error'?'alert':'status'} aria-live="polite"><strong>{feedback.kind==='pending'?(es?'Procesando':'Submitting'):feedback.kind==='success'?(es?'Resultado confirmado':'Confirmed result'):(es?'Error':'Error')}</strong>{`: ${feedback.text}`}</p>}
  {items.map(c=><article key={c.id} style={{border:'1px solid currentColor',padding:16,marginBlock:16}}><h3>{c.status}</h3><p>{c.created_at} · {c.customer_email||String(c.proposed.source_name||(es?'cliente':'customer'))} · {c.id}</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:24}}><div><h4>{es?'Propuesto':'Proposed'}</h4><EvidenceCard value={c.proposed} es={es}/></div>{c.candidates.map(pair=><div key={String(pair.reference.id)}><h4>{es?'Existente':'Existing'}</h4><EvidenceCard value={pair.reference} es={es}/><p>{es?'Precio igual':'Equal price'}: {String(pair.priceEqual??'UNKNOWN')} · WhatsApp: {String(pair.verifiedWhatsappEqual??'UNKNOWN')}</p><details><summary>{es?'Evidencia monetaria':'Monetary evidence'}</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(pair.fx,null,2)}</pre></details></div>)}</div><details open={openHistory===c.id} onToggle={event=>setOpenHistory(event.currentTarget.open?c.id:null)}><summary>{es?'Historial de decisiones':'Decision history'}</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify({owner:c.history,admission:c.admission_history,sourceObservations:c.source_updates},null,2)}</pre></details><label>{es?'Motivo de la decisión':'Decision reason'}<textarea disabled={busy} value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)}/></label><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{decisions.map((d,i)=><button key={d} disabled={busy||reason.trim().length<3} onClick={()=>void decide(c,d)}>{submitting===d?(es?'Procesando…':'Submitting…'):es?['Confirmar duplicado','Propiedades diferentes','Sin resolver'][i]:['Confirm duplicate','Different properties','Unresolved'][i]}</button>)}</div>{feedback?.caseId===c.id&&<p role={feedback.kind==='error'?'alert':'status'} aria-live="polite"><strong>{feedback.kind==='pending'?(es?'Procesando':'Submitting'):feedback.kind==='success'?(es?'Resultado confirmado':'Confirmed result'):(es?'Error':'Error')}</strong>{`: ${feedback.text}`}</p>}</article>)}
  {items.length===25&&<button disabled={busy} onClick={()=>{const last=items[items.length-1];setCursor({before:last.created_at,beforeId:last.id})}}>{es?'Siguiente página':'Next page'}</button>}
 </section>
}

type AdmissionRow={id:string;listing_id:string;case_id:string|null;created_at:string;outcome:string;status:string;source_name:string;run_id:string|null;proposed:Evidence;candidates:Pair[]}
type Run={source_name:string;run_id:string;started_at:string;state:string;admission_linkage_recorded:boolean}
type Overview={counts:{accepted:number;autoRejected:number;pending:number;historicalFlagged:number}|null;items:AdmissionRow[];total:number|null;hasMore:boolean;sources:string[];runs:Run[];coverage:string}
function AdmissionOverview({language,onInspect,refreshKey}:{language:'en'|'es';onInspect:(id:string)=>void;refreshKey:string}){
 const es=language==='es';const [source,setSource]=useState(''),[run,setRun]=useState(''),[outcome,setOutcome]=useState(''),[history,setHistory]=useState(false),[cursor,setCursor]=useState<{before:string;beforeId:string}|null>(null),[data,setData]=useState<Overview|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(false),[reload,setReload]=useState(0),[inspected,setInspected]=useState<Evidence|null>(null)
 useEffect(()=>{let active=true;setBusy(true);setData(null);setError(false);void admissionRead({...source?{source}:{},...run?{run}:{},...outcome?{outcome}:{},history,...cursor}).then(r=>{if(!active)return;setBusy(false);if(!r.ok){setError(true);return}setData(r.data)}).catch(()=>{if(active){setBusy(false);setError(true)}});return()=>{active=false}},[source,run,outcome,history,cursor,reload,refreshKey])
 async function inspectAccepted(id:string){setInspected(null);const r=await adminRead({mode:'detail',listing:id});if(r.ok&&r.data)setInspected(r.data);else setError(true)}
 const reset=()=>setCursor(null),label=(s:string)=>s==='customer'?(es?'Clientes':'Customer submissions'):s
 const names=es?['Aceptados','Rechazados automáticamente','Pendientes de revisión']:['Accepted','Auto-rejected','Flagged for review']
 const reason=(r:AdmissionRow)=>{const price=r.candidates.some(p=>p.priceEqual===true),phone=r.candidates.some(p=>p.verifiedWhatsappEqual===true);return price&&phone?(es?'AMBAS':'BOTH'):price?(es?'Coincidencia de precio':'Price match'):phone?(es?'Coincidencia de WhatsApp verificado':'Verified WhatsApp match'):'—'}
 const selectedRun=data?.runs.find(r=>r.run_id===run)
 return <section style={{minWidth:0,maxWidth:'100%',overflowWrap:'anywhere'}} aria-label={es?'Resultados de admisión':'Admission results'}><div style={{display:'flex',flexWrap:'wrap',gap:12}}>{names.map((name,i)=><div key={name} style={{border:'1px solid currentColor',padding:16,flex:'1 1 180px',minWidth:0}}><strong>{name}</strong><p data-counter={i} style={{fontSize:'2rem',margin:0}}>{data?.counts?[data.counts.accepted,data.counts.autoRejected,data.counts.pending][i]:'…'}</p></div>)}</div>
 <p>{es?'Una primera aceptación por anuncio independiente; las propuestas retenidas se muestran por separado. Sin inventario histórico ni intentos brutos. Las actualizaciones no suman aceptaciones.':'One first acceptance per independent listing; held proposals are shown separately. No historical inventory or raw attempts. Updates never add acceptances.'}</p>
 <div style={{display:'flex',flexWrap:'wrap',gap:12,marginBlock:16}}><label style={{flex:'1 1 200px',minWidth:0,maxWidth:'100%'}}>{es?'Fuente':'Source'} <select style={{maxWidth:'100%',display:'block'}} aria-label={es?'Fuente':'Source'} value={source} onChange={e=>{setSource(e.target.value);setRun('');reset()}}><option value="">{es?'Todas las fuentes':'All sources'}</option>{Array.from(new Set([...(data?.sources||[]),...source?[source]:[]])).map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label>
 <label style={{flex:'1 1 240px',minWidth:0,maxWidth:'100%'}}>{es?'Ejecución de adquisición':'Acquisition run'} <select style={{maxWidth:'100%',display:'block'}} aria-label={es?'Ejecución de adquisición':'Acquisition run'} disabled={!source||source==='customer'} value={run} onChange={e=>{setRun(e.target.value);reset()}}><option value="">{es?'Todas / sin identidad registrada':'All / no recorded run identity'}</option>{data?.runs.map(r=><option key={r.run_id} value={r.run_id}>{r.started_at} · {r.run_id} · {r.state==='COMPLETED'?(es?'Completada':'Completed'):(es?'En curso':'Acquiring')}</option>)}</select></label>
 <label style={{flex:'1 1 200px',minWidth:0,maxWidth:'100%'}}>{es?'Resultado':'Outcome'} <select style={{maxWidth:'100%',display:'block'}} aria-label={es?'Resultado':'Outcome'} value={outcome} onChange={e=>{setOutcome(e.target.value);reset()}}><option value="">{es?'Todos':'All'}</option>{['ACCEPTED','AUTOMATIC_REJECTION','REVIEW_REQUIRED'].map((v,i)=><option key={v} value={v}>{names[i]}</option>)}</select></label>
 <label><input type="checkbox" checked={history} onChange={e=>{setHistory(e.target.checked);reset()}}/>{es?'Incluir casos resueltos':'Include resolved cases'}</label><button disabled={busy} onClick={()=>setReload(x=>x+1)}>{es?'Actualizar resultados':'Refresh results'}</button>{cursor&&<button onClick={reset}>{es?'Primera página':'First page'}</button>}</div>
 {busy&&<p role="status">{es?'Cargando resultados…':'Loading results…'}</p>}{error&&<p role="alert">{es?'No se pudieron consultar los resultados. Totales desconocidos.':'Results could not be read. Totals unknown.'}</p>}
 {data?.coverage==='NO_RECORDED_RUN_LINKAGE'&&<p role="status">{es?'Esta ejecución no tiene vínculos de admisión registrados. No se pueden establecer sus totales.':'This run has no recorded admission linkage. Its totals cannot be established.'}</p>}
 {source&&source!=='customer'&&!run&&data?.runs.length===0&&<p>{es?'No hay identidad de ejecución registrada para esta fuente.':'No recorded run identity is available for this source.'}</p>}
 {selectedRun&&<p role="status">{selectedRun.state==='ACQUIRING'?(es?'Ejecución sin completar: pueden seguir llegando resultados o la adquisición puede estar interrumpida.':'No canonical run completion recorded: results may still be arriving or acquisition may be interrupted.'):(es?'Ejecución completada; solo resultados con vínculo registrado.':'Run completed; recorded linked outcomes only.')}</p>}
 {data?.total===0&&<p>{es?'No hay resultados para estos filtros.':'No results for these filters.'}</p>}
 {data&&<div style={{overflowX:'auto',maxWidth:'100%'}}><table style={{width:'100%',minWidth:1450,borderCollapse:'collapse'}}><thead><tr>{(es?['Resultado','Tipo de propiedad','Transacción','Ubicación','Fuente','Ejecución de adquisición','Fecha','Anuncios existentes','Anuncio propuesto','Motivo','Estado de revisión','Inspeccionar']:['Outcome','Property type','Transaction','Location','Source','Acquisition run','Submitted / acquired','Existing listings','Proposed listing','Reason','Review status','Inspect']).map(h=><th key={h} scope="col" style={{padding:8,textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead><tbody>{data.items.map(r=><tr key={r.id}>{[r.outcome==='ACCEPTED'?names[0]:r.outcome==='AUTOMATIC_REJECTION'?names[1]:names[2],String(r.proposed.property_type||r.proposed.canonical_type||'—'),r.proposed.transaction_type==='sale'?(es?'Venta':'Sale'):r.proposed.transaction_type==='rent'?(es?'Alquiler':'Rent'):String(r.proposed.transaction_type||'—'),[r.proposed.province,r.proposed.canton,r.proposed.district].filter(Boolean).join(' / ')||JSON.stringify(r.proposed.canonical_geography||{}),label(r.source_name),r.run_id|| (es?'No registrada':'Not recorded'),r.created_at,r.candidates.map(p=>String(p.reference.id)).join(', ')||'—',r.listing_id,reason(r),({ACCEPTED:names[0],REVIEW_REQUIRED:names[2],UNRESOLVED:es?'Sin resolver':'Unresolved',AUTOMATIC_REJECTION:names[1],CONFIRM_DUPLICATE:es?'Duplicado confirmado':'Confirmed duplicate',DIFFERENT_PROPERTIES:es?'Propiedades diferentes':'Different properties',NO_MATCH_AFTER_REVISION:es?'Sin coincidencia tras revisión':'No match after revision'} as Record<string,string>)[r.status]||r.status].map((v,i)=><td key={i} style={{padding:8,maxWidth:260,overflowWrap:'anywhere'}}>{v}</td>)}<td>{r.case_id?<button onClick={()=>onInspect(r.case_id!)}>{es?'Inspeccionar':'Inspect'}</button>:<button onClick={()=>void inspectAccepted(r.listing_id)}>{es?'Inspeccionar':'Inspect'}</button>}</td></tr>)}</tbody></table></div>}
 {inspected&&<aside><button onClick={()=>setInspected(null)}>{es?'Cerrar inspección':'Close inspection'}</button><EvidenceCard value={inspected} es={es}/></aside>}
 {data?.hasMore&&<button disabled={busy} onClick={()=>{const last=data.items[data.items.length-1];setCursor({before:last.created_at,beforeId:last.id})}}>{es?'Siguiente página de resultados':'Next results page'}</button>}
 </section>
}
