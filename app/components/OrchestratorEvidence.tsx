'use client'
import {useMemo} from 'react'
import type {OrchestratorReport} from '@/lib/orchestrator-contract'
import {renderOrchestratorReport,downloadableOrchestratorReport,reportCss} from '@/lib/orchestrator-report-presentation'
import styles from './market-summary/workspace.module.css'
export default function OrchestratorEvidence({report,synthetic=false}:{report:OrchestratorReport;synthetic?:boolean}){
 const es=report.language==='es',t=(en:string,sp:string)=>es?sp:en
 const rendered=useMemo(()=>{try{return renderOrchestratorReport(report,{synthetic})}catch{return null}},[report,synthetic])
 function download(){const blob=new Blob([downloadableOrchestratorReport(report,synthetic)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Twuanis-20S-'+report.reportId+'-'+report.language+'.html';a.click();URL.revokeObjectURL(url)}
 if(!rendered)return <p role="alert">{t('This analytical snapshot is incomplete. The existing accounting receipt remains authoritative; no replacement report is generated.','Esta instantánea analítica está incompleta. El recibo contable existente conserva su autoridad; no se genera un informe de reemplazo.')}</p>
 return <div aria-label={t('Completed analytical report','Informe analítico completado')}><style>{reportCss}</style><div dangerouslySetInnerHTML={{__html:rendered}}/><button className={styles.modify} type="button" onClick={download}>{t('Download completed report','Descargar informe completado')}</button>{!synthetic&&report.format==='twuanis-orchestrator-evidence-v2'?<a className={styles.modify} style={{display:'inline-block',maxWidth:'100%',boxSizing:'border-box',whiteSpace:'normal',overflowWrap:'anywhere'}} href={'/api/orchestrator/evidence/'+report.reportId}>{t('Download complete analytical evidence','Descargar evidencia analítica completa')}</a>:null}</div>
}
