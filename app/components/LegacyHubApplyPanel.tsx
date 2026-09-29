'use client'
import { useState } from 'react'
import MarketFilters from './MarketFilters'
import AnalysisActions from './AnalysisActions'
import PricingStrategyResults from '@/app/pricing-strategy/PricingStrategyResults'
import ValuationResults from '@/app/valuation/ValuationResults'
import BuyerDemandResults from '@/app/buyer-demand/BuyerDemandResults'
import { executeLegacyHubQuestion } from '@/lib/legacy-hub-action'
export default function LegacyHubApplyPanel({engine,options,filters,language}:{engine:'pricing'|'valuation'|'buyer-demand';options:any;filters:Record<string,string|undefined>;language:'en'|'es'}) {
 const [committed,setCommitted]=useState<{filters:Record<string,string|undefined>;result:any}|null>(null)
 async function apply(draft:Record<string,string|undefined>) {
  const snapshot={...draft}
  const result=await executeLegacyHubQuestion(engine,snapshot,language)
  setCommitted({filters:snapshot,result})
 }
 return <>
  <MarketFilters workspace={engine} options={options} filters={filters} language={language} onApply={apply}/>
  {!committed && <p role="status">{language==='es'?'Aplica los filtros para ejecutar este análisis.':'Apply Filters to execute this analysis.'}</p>}
  {committed && <>
   <AnalysisActions engineType={engine} language={language} filters={committed.filters} result={committed.result} defaultName={engine}/>
   {engine==='pricing' && <PricingStrategyResults filters={committed.filters} strategy={committed.result}/>}
   {engine==='valuation' && <ValuationResults filters={committed.filters} valuation={committed.result}/>}
   {engine==='buyer-demand' && <BuyerDemandResults filters={committed.filters} demand={committed.result}/>}
  </>}
 </>
}
