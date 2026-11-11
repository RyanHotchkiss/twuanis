'use client'
import {useRef,useEffect} from 'react'
import type {BankCommitted} from '@/lib/saved-universe-contract'
import {resultSynthesis} from '@/lib/universal-result-synthesis'
import {PROPERTY_AREA_RANGE_OPTIONS,CONSTRUCTION_AREA_RANGE_OPTIONS} from '@/lib/market-intelligence-area-ranges'
import AnalyticalResultIntroduction from './AnalyticalResultIntroduction'
import Summary from './market-summary/MarketSummaryResult'
import Composition from './market-composition/MarketCompositionResult'
import Matching from './property-matching/PropertyMatchingResult'
import Comparison from './market-comparison/MarketComparisonResult'
import Configuration from './configuration-frequency/ConfigurationFrequencyResult'
import {AskingPriceResult} from './AskingPriceResult'
import Distribution from './price-meter-distribution/DistributionResult'
import Geography from './price-meter-geography/GeographicResult'
import Size from './price-meter-size/SizeResult'
import ConstructionLand from './price-meter-construction-land/ConstructionLandResult'
import Cohort from './price-meter-comparison/CohortEvidence'
import Cross from './price-meter-cross-dimensional/CrossResult'
import Discovery from './Phase14Results'
import DiscoveryNotes from './price-meter-discovery/DiscoveryEvidenceNotes'
import Position from './price-meter-position/PositionResult'
import Comparable,{ComparableMethodology} from './price-meter-comparables/ComparableResult'
import Ratio from './asking-area-ratio/RatioResult'
import Weighted from './weighted-price/WeightedResult'
import askingStyles from './AskingPriceDistribution.module.css'
import shared from './market-summary/workspace.module.css'
import {priceMeaning} from './HubUniverseContext'
const questions:Record<string,[string,string]>={summary:['How many eligible listings establish this defined inventory?','¿Cuántos anuncios elegibles establecen este inventario definido?'],composition:['What characteristics compose this defined real estate market?','¿Qué características componen este mercado inmobiliario definido?'],matching:['Which listings most closely match the selected known attributes?','¿Qué anuncios coinciden más con los atributos conocidos seleccionados?'],comparison:['How do the two independently defined markets compare?','¿Cómo se comparan los dos mercados definidos independientemente?'],configuration:['What share of the defined market establishes the selected configuration?','¿Qué proporción del mercado definido acredita la configuración seleccionada?'],'market-asking-price-distribution':['How are eligible listed selling prices distributed?','¿Cómo se distribuyen los precios de venta publicados elegibles?'],distribution:['How is Price / m² distributed in the defined population?','¿Cómo se distribuye el precio por m² en la población definida?'],geography:['How do geographic Price / m² cohorts compare with the selected reference?','¿Cómo se comparan las cohortes geográficas de precio por m² con la referencia seleccionada?'],size:['How does Price / m² vary with exact size?','¿Cómo varía el precio por m² con el tamaño exacto?'],'construction-land':['How does Price / m² vary with Construction-to-Land ratios?','¿Cómo varía el precio por m² con las razones construcción/terreno?'],'cohort-comparison':['How does median Price / m² differ between the two defined cohorts?','¿Cómo difiere la mediana del precio por m² entre las dos cohortes definidas?'],'cross-dimensional':['Does the selected relationship persist, vary or reverse across secondary groups?','¿La relación seleccionada persiste, varía o se revierte entre grupos secundarios?'],discovery:['Where does each eligible property sit in the selected Price / m² population?','¿Dónde se sitúa cada propiedad elegible en la población seleccionada de precio por m²?'],position:['Where does the included subject sit in its defined reference population?','¿Dónde se sitúa la propiedad incluida en su población de referencia definida?'],comparables:['How does the subject compare with its defined comparable cohort?','¿Cómo se compara la propiedad con su cohorte comparable definida?'],'asking-area-ratio':['What is the modeled construction-area coefficient divided by the land-area coefficient?','¿Cuál es el coeficiente modelado del área de construcción dividido por el del terreno?'],'weighted-price':['What does the existing weighted-area model establish for this subject and reference?','¿Qué establece el modelo existente de área ponderada para esta propiedad y referencia?']}
export default function BankAnalyticalResult({committed,title}:{committed:BankCommitted;title:string}){
 const {engine,language,labels}=committed,es=language==='es',heading=useRef<HTMLHeadingElement>(null),output=committed.output,r=output.result,q=committed.command,scope=q.scope??q.left?.scope
 useEffect(()=>{heading.current?.focus()},[committed])
 const common={language,heading,id:'bank-'+engine,options:{}},filters={...(q.filters??{}),transaction_type:'bank'},base={labels,filters,result:r}
 const intelligence=r?.saleIntelligence??r?.rentIntelligence,key=scope.propertyBasis==='land_only'?'vacantLandLandNormalized':scope.areaBasis==='construction'?'improvedConstructionNormalized':'improvedLandNormalized'
 let content
 switch(engine){
 case 'summary':content=<Summary {...common} committed={base} resultHeading={heading}/>;break
 case 'composition':content=<Composition {...common} committed={base}/>;break
 case 'matching':content=<Matching {...common} committed={base}/>;break
 case 'configuration':content=<Configuration {...common} committed={base}/>;break
 case 'comparison':{const result={language,analyticalContext:output.analyticalContext,left:output.left.result,right:output.right.result},c={a:q.left.filters??{},b:q.right.filters??{},labels:[labels.filter(l=>!l.startsWith('B:')),labels.filter(l=>!l.startsWith('A:'))],result};content=<><Comparison {...common} committed={c} part="identity"/><Comparison {...common} committed={c} part="result"/></>;break}
 case 'market-asking-price-distribution':content=r.ok?<div className={askingStyles.engine}><AskingPriceResult result={r.result} lang={language}/></div>:<p role="status">{es?'No se estableció la distribución.':'Distribution not established.'}</p>;break
 case 'distribution':{const c={labels,context:r.distributionContext,evidence:intelligence.distributions[key]};content=<><Distribution {...common} committed={c} part="identity"/><Distribution {...common} committed={c} part="result"/></>;break}
 case 'geography':{const c={labels,boundaryLabel:labels.join(' · '),evidence:r.geographicResult};content=<><Geography {...common} committed={c} part="identity"/><Geography {...common} committed={c} part="result"/></>;break}
 case 'size':{const c={labels,context:r.sizeContext,evidence:intelligence.sizeRelationships[scope.areaBasis==='construction'?'constructionArea':'propertyArea']};content=<><Size {...common} committed={c} part="identity"/><Size {...common} committed={c} part="result"/></>;break}
 case 'construction-land':{const c={labels,context:r.constructionLandResult.context,evidence:r.constructionLandResult};content=<><ConstructionLand {...common} committed={c} part="identity"/><ConstructionLand {...common} committed={c} part="result"/></>;break}
 case 'cohort-comparison':content=<Cohort result={r} language={language}/>;break
 case 'cross-dimensional':content=<Cross {...common} part="result" committed={{filters,labels,response:r}}/>;break
 case 'discovery':content=r.analysis?.state==='complete'?<><Discovery result={r.analysis} listings={r.listings??[]} labels={{en:labels,es:labels}} language={language}/><DiscoveryNotes response={r} language={language}/></>:<p role="status">{es?'No se estableció el descubrimiento.':'Discovery not established.'}</p>;break
 case 'position':{const c={request:{listingId:q.subject.listingId,requestedGeographyLevel:q.geographyLevel,requestedNormalizationBasis:scope.areaBasis},response:{result:r,fx:output.fx}};content=<><Position {...common} committed={c} part="result"/><Position {...common} committed={c} part="method"/></>;break}
 case 'comparables':{if(!r.evidence){content=<p role="status">{es?'No se estableció la propiedad comparable.':'Comparable subject not established.'}</p>;break}const p=r.presentation,c={request:{subjectListingId:q.subject.listingId,geographyLevel:q.geographyLevel,normalizationBasis:scope.areaBasis,activeDimensions:q.activeDimensions},response:{...r,subjectTitle:r.context?.subjectTitle??null,analyticalDate:r.context?.analyticalDate,fx:r.context?.fx??null,areaLabels:{property:PROPERTY_AREA_RANGE_OPTIONS.find(o=>o.value===p.baseCohort.propertyAreaRange)?.label??p.baseCohort.propertyAreaRange,construction:CONSTRUCTION_AREA_RANGE_OPTIONS.find(o=>o.value===p.baseCohort.constructionAreaRange)?.label??p.baseCohort.constructionAreaRange}}};content=<><Comparable {...common} committed={c}/><ComparableMethodology language={language}/></>;break}
 case 'asking-area-ratio':content=r.evidence?<><Ratio {...common} committed={r} part="result"/><Ratio {...common} committed={r} part="method"/></>:<p role="status">{es?'La pregunta no es elegible.':'Question is not eligible.'}</p>;break
 case 'weighted-price':content=r.evidence?<Weighted committed={r} language={language} heading={heading}/>:<p role="status">{es?'La propiedad no cumple la pregunta.':'Subject does not satisfy the question.'}</p>;break
 }
 const formatted=engine==='comparison'?output:r
 return <article className={shared.summary} data-bank-result={engine}>
  <AnalyticalResultIntroduction heading={heading} title={title} question={questions[engine]?.[es?1:0]??title} synthesis={resultSynthesis(engine,formatted,language,'BANK')}/>
  <section className={shared.identity}><div><h3>{es?'Definición del mercado confirmada':'Committed market definition'}</h3><ul>{labels.map((label,i)=><li key={i}>{label}</li>)}</ul><p>{priceMeaning('BANK',language)}. {es?'No incluye tasación, referencia ni base de subasta como precio de oferta.':'Appraisal, reference and auction-base amounts are not asking-price observations.'}</p><p>{es?'La evidencia ausente no equivale a cero. Las cifras corresponden a esta pregunta confirmada.':'Missing evidence is not zero. Figures belong to this committed question.'}</p></div></section>
  {content}
 </article>
}
