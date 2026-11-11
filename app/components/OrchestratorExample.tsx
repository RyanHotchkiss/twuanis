'use client'
import {useState} from 'react'
import type {OrchestratorReport} from '@/lib/orchestrator-contract'
import OrchestratorEvidence from './OrchestratorEvidence'
import sevenEN from '@/data/orchestrator-examples/seven-en.json'
import sevenES from '@/data/orchestrator-examples/seven-es.json'
import seventeenEN from '@/data/orchestrator-examples/seventeen-en.json'
import seventeenES from '@/data/orchestrator-examples/seventeen-es.json'
import styles from './market-summary/workspace.module.css'
export default function OrchestratorExample({language,valuation}:{language:'en'|'es';valuation:boolean}){
 const [hover,setHover]=useState(false),[open,setOpen]=useState(false),es=language==='es'
 const report=(valuation?(es?seventeenES:seventeenEN):(es?sevenES:sevenEN)) as unknown as OrchestratorReport
 return <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
 <button type="button" className={styles.modify} style={{maxWidth:'100%',whiteSpace:'normal',overflowWrap:'anywhere',boxSizing:'border-box'}} aria-expanded={open} onFocus={()=>setHover(true)} onBlur={()=>setHover(false)} onClick={()=>setOpen(v=>!v)}>{es?'Ver / descargar ejemplo de propiedad deseada por el propietario':'View / download Owner-Desired Property example'}</button>
 {hover&&!open&&<p role="status">{es?'Ejemplo de propiedad deseada por el propietario con datos sintéticos de prueba; no representa el mercado actual. Active el botón para abrir y descargar.':'Owner-Desired Property example with synthetic test evidence; not current market evidence. Activate the button to open and download.'}</p>}
 {(open||hover)&&<div style={{maxHeight:open?undefined:480,overflowY:open?undefined:'auto'}}><OrchestratorEvidence report={report} synthetic/></div>}
 </div>
}
