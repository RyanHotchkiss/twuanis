'use client'

import WeightedWorkspace from './weighted-price/WeightedWorkspace'
import RatioWorkspace from './asking-area-ratio/RatioWorkspace'
import ComparableWorkspace from './price-meter-comparables/ComparableWorkspace'
import PositionWorkspace from './price-meter-position/PositionWorkspace'
import DiscoveryWorkspace from './price-meter-discovery/DiscoveryWorkspace'
import CrossWorkspace from './price-meter-cross-dimensional/CrossWorkspace'
import CohortWorkspace from './price-meter-comparison/CohortWorkspace'
import ConstructionLandWorkspace from './price-meter-construction-land/ConstructionLandWorkspace'
import GeographicWorkspace from './price-meter-geography/GeographicWorkspace'
import SizeWorkspace from './price-meter-size/SizeWorkspace'
import DistributionWorkspace from './price-meter-distribution/DistributionWorkspace'
import { startTransition, useState, useRef } from 'react'
import ComparativeDiscoveryAccess from './ComparativeDiscoveryAccess'
import MarketFilters from '@/app/components/MarketFilters'
import AnalysisActions from '@/app/components/AnalysisActions'
import PriceMeterResults from '@/app/price-per-square-meter/PriceMeterResults'
import ResultadosPrecioMetro from '@/app/es/precio-por-metro-cuadrado/ResultadosPrecioMetro'
import { executePriceMeterApply } from '@/lib/price-meter-apply-action'
import { validatePriceMeterApply, type PriceMeterApplyFilters } from '@/lib/price-meter-apply-contract'

import { PRICE_METER_ENGINES,type SelectedPriceMeterEngine } from '@/lib/price-meter-selected-contract'

type Result = Awaited<ReturnType<typeof executePriceMeterApply>>

export default function PriceMeterApplyPanel({ options, filters, language, source }: {
  options: any
  filters: Record<string, string | undefined>
  language: 'en' | 'es'
  source: 'workspace' | 'standalone'
}) {
  const [applied, setApplied] = useState<{ filters: PriceMeterApplyFilters; result: Result } | null>(null)
  const spanish = language === 'es'
  const [selected,setSelected]=useState<SelectedPriceMeterEngine>(PRICE_METER_ENGINES.includes(filters.analysis_question as SelectedPriceMeterEngine)?filters.analysis_question as SelectedPriceMeterEngine:'distribution')
  const generation=useRef(0)

  function apply(draft: Record<string, string | undefined>): Promise<void> {
    const snapshot = validatePriceMeterApply(draft)
    const engines=[selected],ticket=++generation.current
    return new Promise((resolve, reject) => {
      startTransition(async () => {
        try {
          const result = await executePriceMeterApply(snapshot, language, source, engines)
          // Replace result and its identity together, only after success.
          if(ticket===generation.current)setApplied({ filters: snapshot, result })
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  if (filters.analysis_question === 'weighted-price') return <WeightedWorkspace key={filters.weighted_request || 'new-weighted-question'} language={language} serialized={filters.weighted_request}/>
  if (filters.analysis_question === 'asking-area-ratio') return <RatioWorkspace key={filters.ratio_request || 'new-ratio-question'} language={language} serialized={filters.ratio_request}/>

  if (filters.analysis_question === 'comparables') return <ComparableWorkspace language={language} serialized={filters.comparable_request}/>

  if (filters.analysis_question === 'position') return <PositionWorkspace language={language} serialized={filters.position_request}/>

  if (filters.analysis_question === 'discovery') return <DiscoveryWorkspace language={language} serialized={filters.discovery_request}/>

  if (filters.analysis_question === 'cross-dimensional') return <CrossWorkspace options={options} filters={filters} language={language}/>

  if (filters.analysis_question === 'cohort-comparison') return <CohortWorkspace options={options} filters={filters} language={language}/>

  return <>
    <details open={source==='standalone'?true:undefined}><summary>{spanish?'Modo de análisis PPM2':'PPM2 analysis mode'}</summary>
    <label style={{display:"block",maxWidth:"100%"}}>{spanish?'Análisis':'Analysis'} <select style={{maxWidth:"100%",width:"100%"}} value={selected} onChange={e=>setSelected(e.target.value as SelectedPriceMeterEngine)}>{PRICE_METER_ENGINES.map(key=><option key={key} value={key}>{({distribution:spanish?'Distribución del precio por m²':'Price / m² Distribution',geography:spanish?'Comparación geográfica del precio por m²':'Geographic Price / m² Comparison','property-area':spanish?'Área del terreno':'Property Area','construction-area':spanish?'Área de construcción':'Construction Area','construction-land':spanish?'Relación construcción/terreno':'Construction-to-Land'})[key]}</option>)}</select></label>
    </details>
    {selected==='construction-land'?<ConstructionLandWorkspace options={options} filters={filters} language={language} source={source}/>:selected==='property-area'||selected==='construction-area'?<SizeWorkspace key={selected} initialMode={selected} options={options} filters={filters} language={language} source={source}/>:selected==='geography'?<GeographicWorkspace options={options} filters={filters} language={language} source={source}/>:selected==='distribution'?<DistributionWorkspace options={options} filters={filters} language={language} source={source}/>:<>
    <MarketFilters workspace="price-meter" options={options} filters={filters}
      language={language} onApply={apply} appliedFilters={applied?.result.selectedEngines.includes(selected)?applied.filters:undefined} />
    {applied ? <>
      <AnalysisActions engineType="price-meter" language={language}
        filters={{...applied.filters,analysis_question:applied.result.selectedEngines[0]}} result={applied.result}
        defaultName={spanish ? 'Precio por Metro Cuadrado' : 'Price per Square Meter'} />
      {spanish
        ? <ResultadosPrecioMetro filters={applied.filters} analysis={applied.result} />
        : <PriceMeterResults filters={applied.filters} analysis={applied.result} />}
    </> : <p role="status" style={{ color: '#aaa' }}>
      {spanish ? 'Aplica los filtros para generar el análisis.' : 'Apply Filters to generate the analysis.'}
    </p>}
    </>}
    <p className="my-4"><a className="underline" href={`/${language}/property-price-valuation`}>{spanish ? 'Valoración del precio de la propiedad' : 'Property Price Valuation'}</a></p>
    <ComparativeDiscoveryAccess language={language} />
  </>
}
