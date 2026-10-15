'use client'
import {useId,useState} from 'react'
import type {OrchestratorIdentity} from '@/lib/execution-credit-contract'
import IntelligenceHubNavigator from './IntelligenceHubNavigator'
import SidebarArrowToggle from './SidebarArrowToggle'
import OrchestratorWorkspace from './OrchestratorWorkspace'
import OrchestratorExample from './OrchestratorExample'
import styles from './market-summary/workspace.module.css'
const valuation='orchestrator-markets-current-valuation-of-property',comparison='orchestrator-market-comparison'
export default function OrchestratorHub({language}:{language:'en'|'es'}){
 const es=language==='es',id=useId()
 const [selected,setSelected]=useState<OrchestratorIdentity>(valuation)
 const [available,setAvailable]=useState<OrchestratorIdentity[]|null>(null)
 const [collapsed,setCollapsed]=useState(false),[locked,setLocked]=useState(false)
 const basePath=es?'/es/orquestadores':'/en/orchestrators'
 const tabs=[{id:valuation,label:es?'Valoración actual de la propiedad según el mercado':"Market’s Current Valuation of Property"},{id:comparison,label:es?'Orquestador de comparación de mercados':'Market Comparison Orchestrator'}]
 const questions=es?{[valuation]:'¿Qué muestra la evidencia actual de precios anunciados sobre la posición de esta propiedad en el mercado definido?',[comparison]:'¿Cómo se compara el mercado inmobiliario definido según las características seleccionadas y las poblaciones autorizadas?'}:{[valuation]:"What does current asking-market evidence show about this property's position within the defined market?",[comparison]:'How does the defined property market compare across the selected characteristics and authorized populations?'}
 return <div className={styles.hub+' orchestrator-hub'} data-collapsed={collapsed} data-orchestrator-active={selected}>
  <span className={styles.sidebarArrowPosition}><SidebarArrowToggle collapsed={collapsed} label={collapsed?(es?'Expandir orquestadores':'Expand orchestrators'):(es?'Contraer orquestadores':'Collapse orchestrators')} controls={id} onToggle={()=>setCollapsed(v=>!v)}/></span>
  <div id={id} className={styles.sidebarRegion}><IntelligenceHubNavigator tabs={available===null?tabs:tabs.filter(t=>available.includes(t.id as OrchestratorIdentity))} activeTab={selected} basePath={basePath} query="" language={language} presentation={{label:es?'Orquestadores':'Orchestrators',mobileLabel:es?'Orquestadores':'Orchestrators',questions,hrefForTab:key=>basePath+'?orchestrator='+key,onSelect:key=>setSelected(key as OrchestratorIdentity),locked}}/></div>
  <div className={styles.workspace}>
   <div className={styles.hubControls}><OrchestratorExample language={language} valuation={selected===valuation}/></div>
   <OrchestratorWorkspace language={language} initialOrchestrator={valuation} selectedOrchestrator={selected} onOrchestratorChange={setSelected} onSelectionLockChange={setLocked} onAvailableChange={setAvailable}/>
  </div>
 </div>
}
