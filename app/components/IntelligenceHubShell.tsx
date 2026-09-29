'use client'
import { useId, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { hubEngineUrl } from './intelligence-hub-navigation'
import {weightedTitle} from '@/lib/weighted-price-contract'
import {ratioTitle} from '@/lib/asking-area-ratio-contract'
import {comparablesTitle} from '@/lib/comparables-hub-contract'
import {positionHubTitle} from '@/lib/position-hub-contract'
import {crossTitle} from './price-meter-cross-dimensional/contract'
import {cohortTitle} from './price-meter-comparison/contract'
import SidebarArrowToggle from './SidebarArrowToggle'
import IntelligenceHubNavigator from './IntelligenceHubNavigator'
import styles from './market-summary/workspace.module.css'

export default function IntelligenceHubShell({tabs,activeTab,query,basePath,language,embedded,children}:{tabs:readonly {id:string;label:string;disabled?:boolean}[];activeTab:string;query:string;basePath:string;language:'en'|'es';embedded:boolean;children:ReactNode}) {
 const [collapsed,setCollapsed]=useState(false),id=useId(),router=useRouter()
 const es=language==='es'
 const engines=tabs.filter(tab=>!tab.disabled && tab.id!=='valuation' && tab.id!=='pricing').flatMap(tab=>tab.id==='explorer'?[{...tab,label:es?'Resumen del mercado':'Market Summary'},{id:'composition',label:es?'Composición del mercado':'Market Composition'},{id:'asking-price',label:es?'Distribución de precios de oferta del mercado':'Market Asking Price Distribution'}]:tab.id==='price-meter'?[tab,{id:'geography',label:es?'Comparación geográfica del precio por m²':'Geographic Price / m² Comparison'},{id:'size',label:es?'Tamaño → Precio por m²':'Size → Price / m²'},{id:'construction-land',label:es?'Construcción/terreno → Precio por m²':'Construction-to-Land → Price / m²'},{id:'cohort-comparison',label:cohortTitle[language]},{id:'cross-dimensional',label:crossTitle[language]},{id:'discovery',label:language==='es'?'Descubrimiento comparativo de precio / m²':'Comparative Price / m² Discovery'},{id:'position',label:positionHubTitle[language]},{id:'comparables',label:comparablesTitle[language]},{id:'asking-area-ratio',label:ratioTitle[language]},{id:'weighted-price',label:weightedTitle[language]}]:[tab])
 const question=new URLSearchParams(query).get('analysis_question')
 const activeEngine=activeTab==='price-meter'&&question==='weighted-price'?'weighted-price':activeTab==='price-meter'&&question==='asking-area-ratio'?'asking-area-ratio':activeTab==='price-meter'&&question==='comparables'?'comparables':activeTab==='price-meter'&&question==='position'?'position':activeTab==='price-meter'&&question==='discovery'?'discovery':activeTab==='price-meter'&&question==='cross-dimensional'?'cross-dimensional':activeTab==='price-meter'&&question==='cohort-comparison'?'cohort-comparison':activeTab==='price-meter'&&question==='construction-land'?'construction-land':activeTab==='explorer'&&question==='composition'?'composition':activeTab==='price-meter'&&(question==='property-area'||question==='construction-area')?'size':activeTab==='price-meter'&&question==='geography'?'geography':activeTab
 if(embedded)return <>{children}</>
 return <div className={styles.hub} data-collapsed={collapsed}>
  <span className={styles.sidebarArrowPosition}><SidebarArrowToggle collapsed={collapsed} label={collapsed?(es?'Expandir motores':'Expand engines'):(es?'Contraer motores':'Collapse engines')} controls={id} onToggle={()=>setCollapsed(v=>!v)}/></span>
  <div id={id} className={styles.sidebarRegion}><IntelligenceHubNavigator tabs={engines} activeTab={activeEngine} basePath={basePath} query={query} language={language}/></div>
  <div className={styles.workspace}>
   <div className={styles.hubControls}>

    <label className={styles.selector}>{es?'Análisis':'Analysis'} <select aria-label={es?'Análisis':'Analysis'} value={activeEngine} onChange={e=>router.push(hubEngineUrl(basePath,query,e.target.value))}>{engines.map(engine=><option key={engine.id} value={engine.id} disabled={engine.disabled}>{engine.label}</option>)}</select></label>
   </div>
   {children}
  </div>
 </div>
}
