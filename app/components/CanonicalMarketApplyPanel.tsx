'use client'
import {useRef,useState} from 'react'
import MarketFilters from './MarketFilters'
import AnalysisActions from './AnalysisActions'
import {saveMarketComparison,createMarketComparisonName} from '@/lib/market-comparisons'
import {executeMarketQuestion} from '@/lib/market-inventory-action'
import MarketMatchingResults from '@/app/market-matching/MarketMatchingResults'
import MarketScarcityResults from '@/app/market-scarcity/MarketScarcityResults'
import MarketComparisonResults from '@/app/market-comparison/MarketComparisonResults'
type Workspace='explorer'|'matching'|'scarcity'|'comparison'
export default function CanonicalMarketApplyPanel({workspace,options,filters,language='en'}:{workspace:Workspace;options:any;filters:Record<string,string|undefined>;language?:'en'|'es'}){
 const [inventory,setInventory]=useState<'summary'|'composition'>(filters.analysis_question==='composition'?'composition':'summary')
 const [committed,setCommitted]=useState<{engine:string;filters:Record<string,string|undefined>;result:any}|null>(null)
 const [saveStatus,setSaveStatus]=useState('')
 const generation=useRef(0),spanish=language==='es'
 async function apply(draft:Record<string,string|undefined>){
  const engine=workspace==='explorer'?inventory:workspace==='scarcity'?'configuration':workspace
  const snapshot={...draft},ticket=++generation.current
  const result=await executeMarketQuestion(engine,snapshot,language)
  if(ticket===generation.current)setCommitted({engine,filters:snapshot,result})
 }
 return <>
  {workspace==='explorer'&&<label>{spanish?'Análisis':'Analysis'} <select value={inventory} onChange={e=>setInventory(e.target.value as 'summary'|'composition')}>
   <option value="summary">{spanish?'Resumen del mercado':'Market Summary'}</option><option value="composition">{spanish?'Composición del mercado':'Market Composition'}</option>
  </select></label>}
  <MarketFilters workspace={workspace} options={options} filters={filters} language={language} onApply={apply}/>
  {!committed&&<p role="status">{spanish?'Aplica los filtros para ejecutar el análisis seleccionado.':'Apply Filters to execute the selected analysis.'}</p>}
  {committed&&workspace!=='comparison'&&<AnalysisActions key={committed.engine} engineType={workspace} language={language} filters={{...committed.filters,analysis_question:committed.engine}} result={committed.result} defaultName={committed.engine}/>}
  {committed&&workspace==='comparison'&&<><button disabled={saveStatus==='saving'} onClick={async()=>{setSaveStatus('saving');try{await saveMarketComparison({name:createMarketComparisonName({filters:committed.filters,language}),filters:committed.filters,result:committed.result,language});setSaveStatus(spanish?'Guardado':'Saved')}catch{setSaveStatus(spanish?'No se pudo guardar':'Could not save')}}}>{spanish?'Guardar comparación':'Save comparison'}</button><p role="status">{saveStatus==='saving'?(spanish?'Guardando…':'Saving…'):saveStatus}</p></>}
  {committed?.engine==='summary'&&<section aria-live="polite"><h2>{spanish?'Resumen del mercado':'Market Summary'}</h2><p>{spanish?'Inventario establecido':'Established inventory'}: {committed.result.n}</p><p>{spanish?'Venta':'Sale'}: {committed.result.saleCount} · {spanish?'Alquiler':'Rent'}: {committed.result.rentCount}</p></section>}
  {committed?.engine==='composition'&&<section aria-live="polite"><h2>{spanish?'Composición del mercado':'Market Composition'}</h2><p>n = {committed.result.n}</p>{committed.result.dimensions.map((d:any)=><div key={d.dimension}><h3>{dimensionLabel(d.dimension,language)}</h3><p>{spanish?'Propiedades representadas':'Represented listings'}: {d.representedN} / {d.denominatorN}</p><ul>{d.terms.map((t:any)=><li key={t.termId}>{t.label[language]}: {t.count} ({t.percentage?.toFixed(2)}%)</li>)}</ul></div>)}</section>}
  {committed?.engine==='matching'&&<MarketMatchingResults filters={committed.filters} matches={committed.result}/>}
  {committed?.engine==='configuration'&&<MarketScarcityResults filters={committed.filters} scarcity={committed.result}/>}
  {committed?.engine==='comparison'&&<MarketComparisonResults comparison={committed.result}/>}
 </>
}

function dimensionLabel(key:string,language:'en'|'es'){
 const labels:Record<string,[string,string]>={province:['Province','Provincia'],canton:['Canton','Cantón'],district:['District','Distrito'],property_type:['Property Type','Tipo de propiedad'],bedrooms:['Bedrooms','Dormitorios'],bathrooms:['Bathrooms','Baños'],parking:['Parking','Estacionamiento'],year_built:['Year Built','Año de construcción'],utility:['Utilities','Servicios'],environment:['Environment','Entorno'],terrain:['Terrain','Terreno'],accessibility:['Accessibility','Accesibilidad'],legal_status:['Legal Status','Estado legal']}
 return labels[key]?.[language==='es'?1:0]??key
}
