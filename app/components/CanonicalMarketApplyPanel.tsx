'use client'
import {useRef,useState} from 'react'
import ConfigurationFrequency from './configuration-frequency/ConfigurationFrequency'
import MarketComparison from './market-comparison/MarketComparison'
import PropertyMatching from './property-matching/PropertyMatching'
import MarketComposition from './market-composition/MarketComposition'
import MarketSummary from './market-summary/MarketSummary'
import styles from './market-summary/workspace.module.css'
import MarketFilters from './MarketFilters'
import AnalysisActions from './AnalysisActions'
import {executeMarketQuestion} from '@/lib/market-inventory-action'
import MarketMatchingResults from '@/app/market-matching/MarketMatchingResults'
import MarketScarcityResults from '@/app/market-scarcity/MarketScarcityResults'
type Workspace='explorer'|'matching'|'scarcity'|'comparison'
export default function CanonicalMarketApplyPanel({workspace,options,filters,language='en',hideSelector=false,inventoryQuestion}:{hideSelector?:boolean;inventoryQuestion?:'summary'|'composition';workspace:Workspace;options:any;filters:Record<string,string|undefined>;language?:'en'|'es'}){
 const [localInventory,setInventory]=useState<'summary'|'composition'>(filters.analysis_question==='composition'?'composition':'summary')
 const inventory=inventoryQuestion??localInventory
 const [committed,setCommitted]=useState<{engine:string;filters:Record<string,string|undefined>;result:any}|null>(null)
 const generation=useRef(0),spanish=language==='es'
 async function apply(draft:Record<string,string|undefined>){
  const engine=workspace==='explorer'?inventory:workspace==='scarcity'?'configuration':workspace
  const snapshot={...draft},ticket=++generation.current
  const result=await executeMarketQuestion(engine,snapshot,language)
  if(ticket===generation.current)setCommitted({engine,filters:snapshot,result})
 }
 const selector=!hideSelector&&workspace==='explorer'&&<label className={styles.selector}>{spanish?'Análisis':'Analysis'} <select value={inventory} onChange={e=>setInventory(e.target.value as 'summary'|'composition')}><option value="summary">{spanish?'Resumen del mercado':'Market Summary'}</option><option value="composition">{spanish?'Composición del mercado':'Market Composition'}</option></select></label>
 if(workspace==='explorer'&&inventory==='summary')return <>{selector}<MarketSummary options={options} filters={filters} language={language}/></>
 if(workspace==='explorer'&&inventory==='composition')return <>{selector}<MarketComposition options={options} filters={filters} language={language}/></>
 if(workspace==='scarcity')return <ConfigurationFrequency options={options} filters={filters} language={language}/>
 if(workspace==='comparison')return <MarketComparison options={options} filters={filters} language={language}/>
 if(workspace==='matching')return <PropertyMatching options={options} filters={filters} language={language}/>
 return <>
  {selector}
  <MarketFilters workspace={workspace} options={options} filters={filters} language={language} onApply={apply}/>
  {!committed&&<p role="status">{spanish?'Aplica los filtros para ejecutar el análisis seleccionado.':'Apply Filters to execute the selected analysis.'}</p>}
  {committed&&<AnalysisActions key={committed.engine} engineType={workspace} language={language} filters={{...committed.filters,analysis_question:committed.engine}} result={committed.result} defaultName={committed.engine}/>}
  {committed?.engine==='matching'&&<MarketMatchingResults filters={committed.filters} matches={committed.result}/>}
  {committed?.engine==='configuration'&&<MarketScarcityResults filters={committed.filters} scarcity={committed.result}/>}
 </>
}
