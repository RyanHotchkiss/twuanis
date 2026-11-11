'use client'
import {useRef,type ComponentProps} from 'react'
import type {PublicExample} from './registry'
import type {ExplorerOptions,Filters} from '../market-filters/types'
import {summaryIdentity} from '../market-summary/contract'
import CanonicalMarketIdentity from '../CanonicalMarketIdentity'
import Composition from '../market-composition/MarketCompositionResult'
import Configuration from '../configuration-frequency/ConfigurationFrequencyResult'
import Matching from '../property-matching/PropertyMatchingResult'
import {AskingPriceResult} from '../AskingPriceResult'
import Distribution from '../price-meter-distribution/DistributionResult'
import Geography from '../price-meter-geography/GeographicResult'
import Size from '../price-meter-size/SizeResult'
import ConstructionLand from '../price-meter-construction-land/ConstructionLandResult'
import Cohort from '../price-meter-comparison/CohortEvidence'
import Cross from '../price-meter-cross-dimensional/CrossResult'
import Discovery from '../Phase14Results'
import DiscoveryNotes from '../price-meter-discovery/DiscoveryEvidenceNotes'
import Position from '../price-meter-position/PositionResult'
import Ratio from '../asking-area-ratio/RatioResult'
import summaryStyles from '../market-summary/workspace.module.css'
import ratioStyles from '../asking-area-ratio/workspace.module.css'
import askingStyles from '../AskingPriceDistribution.module.css'
// Frozen canonical display identities, not a live dictionary or analytical population.
const options:ExplorerOptions={province:[{id:10,official_code:'1',slug:'san-jose',term_name_en:'San Jose',term_name_es:'San José'}],canton:[{id:17,parent_id:10,official_code:'101',slug:'san-jose',term_name_en:'San Jose',term_name_es:'San José'}],property_type:[{id:1115,slug:'house',term_name_en:'House',term_name_es:'Casa'}],bedrooms:[{id:1124,slug:'3-bedrooms',term_name_en:'3 Bedrooms',term_name_es:'3 Habitaciones'}],bathrooms:[{id:1128,slug:'2-bathrooms',term_name_en:'2 Bathrooms',term_name_es:'2 Baños'}]}
type Committed<T extends React.ElementType>=NonNullable<ComponentProps<T>['committed']>
export default function AdditionalExampleReport({artifact,language}:{artifact:PublicExample;language:'en'|'es'}){
 const heading=useRef<HTMLHeadingElement>(null),id='public-'+artifact.engineId,engine=artifact.engineId,es=language==='es'
 const tuple=artifact.input as unknown[],filters=(Array.isArray(tuple)&&typeof tuple[0]==='string'?tuple[1]:{transaction_type:'sale',property_type:'house',province:'1',canton:'101'}) as Filters
 const labels=summaryIdentity(filters,options,language),common={heading,id,language,options}
 let report
 if(engine==='composition'){const result=artifact.body as Committed<typeof Composition>['result'];report=<><CanonicalMarketIdentity committed={{filters,labels}} engine={engine} language={language} options={options}/><Composition {...common} committed={{filters,labels,result}}/></>}
 else if(engine==='configuration'){const result=artifact.body as Committed<typeof Configuration>['result'];report=<><CanonicalMarketIdentity committed={{filters,labels}} engine={engine} language={language} options={options}/><Configuration {...common} committed={{filters,labels,result}}/></>}
 else if(engine==='matching'){const result=artifact.body as Committed<typeof Matching>['result'];report=<><CanonicalMarketIdentity committed={{filters,labels}} engine={engine} language={language} options={options}/><Matching {...common} committed={{filters,labels,result}}/></>}
 else if(engine==='market-asking-price-distribution')report=<AskingPriceResult result={artifact.body as ComponentProps<typeof AskingPriceResult>['result']} lang={language}/>
 else if(engine==='distribution'){const body=artifact.body as Pick<Committed<typeof Distribution>,'context'|'evidence'>,committed={...body,labels};report=<><Distribution {...common} committed={committed} part="identity"/><Distribution {...common} committed={committed} part="result"/></>}
 else if(engine==='geography'){const body=artifact.body as Pick<Committed<typeof Geography>,'evidence'>,committed={...body,labels,boundaryLabel:es?'San José':'San Jose'};report=<><Geography {...common} committed={committed} part="introduction"/><Geography {...common} committed={committed} part="identity"/><Geography {...common} committed={committed} part="result"/></>}
 else if(engine==='size'){const body=artifact.body as Pick<Committed<typeof Size>,'context'|'evidence'>,committed={...body,labels};report=<><Size {...common} committed={committed} part="identity"/><Size {...common} committed={committed} part="result"/></>}
 else if(engine==='construction-land'){const body=artifact.body as Pick<Committed<typeof ConstructionLand>,'evidence'>,committed={...body,context:body.evidence.context,labels};report=<><ConstructionLand {...common} committed={committed} part="identity"/><ConstructionLand {...common} committed={committed} part="result"/></>}
 else if(engine==='cohort-comparison')report=<Cohort result={artifact.body as ComponentProps<typeof Cohort>['result']} language={language}/>
 else if(engine==='cross-dimensional')report=<Cross {...common} part="result" committed={{filters,labels,response:artifact.body as Committed<typeof Cross>['response']}}/>
 else if(engine==='discovery'){const body=artifact.body as {analysis:ComponentProps<typeof Discovery>['result'];listings:ComponentProps<typeof Discovery>['listings'];context:ComponentProps<typeof DiscoveryNotes>['response']['context']};report=<><Discovery result={body.analysis} listings={body.listings} labels={{en:summaryIdentity(filters,options,'en'),es:summaryIdentity(filters,options,'es')}} language={language}/><DiscoveryNotes response={body} language={language}/></>}
 else if(engine==='position'){const committed={request:tuple[0],response:artifact.body} as Committed<typeof Position>;report=<><Position {...common} committed={committed} part="result"/><Position {...common} committed={committed} part="method"/></>}
 else if(engine==='asking-area-ratio'){const committed=artifact.body as Committed<typeof Ratio>;report=<><Ratio {...common} committed={committed} part="result"/><Ratio {...common} committed={committed} part="method"/></>}
 else return null
 return <div className={engine==='asking-area-ratio'?ratioStyles.workspace:engine==='market-asking-price-distribution'?askingStyles.engine:summaryStyles.summary}>{report}</div>
}
