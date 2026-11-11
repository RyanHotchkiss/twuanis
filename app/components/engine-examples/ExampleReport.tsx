'use client'
import {HubUniverseProvider} from '../HubUniverseContext'
import {analyticalTerminology} from '@/lib/analytical-terminology'
import {useRef} from 'react'
import WeightedResult,{WeightedDisclosure} from '../weighted-price/WeightedResult'
import type {WeightedSuccess} from '@/lib/weighted-price-contract'
import AdditionalExampleReport from './AdditionalExampleReport'
import MarketSummaryResult from '../market-summary/MarketSummaryResult'
import MarketComparisonResult from '../market-comparison/MarketComparisonResult'
import ComparableResult,{ComparableMethodology,type ComparableCommitted} from '../price-meter-comparables/ComparableResult'
import type {PublicExample} from './registry'
import type {SummaryResult} from '../market-summary/contract'
import type {ComparisonResult} from '../market-comparison/contract'
import type {Filters} from '../market-filters/types'

export default function ExampleReport({artifact,language}:{artifact:PublicExample;language:'en'|'es'}){
 const heading=useRef<HTMLHeadingElement>(null),es=language==='es'
 let report
 if(artifact.engineId==='summary'){
  const input=artifact.input as [string,Filters,string],labels=artifact.labels![language]
  report=<><ul>{labels.map((label,i)=><li key={i}>{label}</li>)}</ul><MarketSummaryResult committed={{filters:input[1],labels,result:artifact.body as SummaryResult}} resultHeading={heading} id="public-summary" language={language} options={{}}/></>
 }else if(artifact.engineId==='comparison'){
  const result=artifact.body as ComparisonResult
  // These exact market labels belong to the approved, fixed San José/Escazú artifact.
  const labels=[es?['En venta','Casa','San José','San José']:['For Sale','House','San José','San José'],es?['En venta','Casa','San José','Escazú']:['For Sale','House','San José','Escazú']]
  const committed={a:result.left.filters,b:result.right.filters,labels,result}
  report=<><MarketComparisonResult committed={committed} language={language} heading={heading} part="identity"/><MarketComparisonResult committed={committed} language={language} heading={heading} part="result"/></>
 }else if(artifact.engineId==='comparables'){
  const committed={request:artifact.input,response:artifact.body} as ComparableCommitted
  report=<><ComparableResult committed={committed} language={language} heading={heading}/><ComparableMethodology language={language}/></>
 }else if(artifact.engineId==='weighted-price'){report=<><WeightedDisclosure language={language}/><WeightedResult committed={artifact.body as WeightedSuccess} language={language} heading={heading}/></>
 }else report=<AdditionalExampleReport artifact={artifact} language={language}/>
 return <HubUniverseProvider population={null}><article data-example-id={artifact.exampleId}><aside><strong>{es?'Ejemplo de ejecución conservado; no es una consulta en vivo.':'Frozen example run; not a live query.'}</strong><p>{es?'Ejecutado':'Executed'}: {artifact.executedAt}</p>{artifact.analyticalDate&&<p>{es?'Fecha analítica':'Analytical date'}: {artifact.analyticalDate}</p>}{artifact.disclosures[language].map((text,i)=><p key={i}>{analyticalTerminology(text)}</p>)}</aside>{report}</article></HubUniverseProvider>
}
