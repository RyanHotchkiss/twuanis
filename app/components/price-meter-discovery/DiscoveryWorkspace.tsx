'use client'
import {useEffect,useState} from 'react'
import {executeDiscoveryHub,restoreDiscoveryDraft} from '@/lib/discovery-hub-action'
import type {Phase14ApplicationRequest,Phase14ApplicationResponse} from '@/lib/comparative-discovery-contract'
import ComparativeDiscoveryAccess from '../ComparativeDiscoveryAccess'
import Phase14Discovery from '../Phase14Discovery'
import AnalysisActions from '../AnalysisActions'
export const discoveryTitle={en:'Comparative Price / m² Discovery',es:'Descubrimiento comparativo de precio / m²'}
export const discoveryQuestion={en:'Where does each eligible listing sit within the defined market’s Price / m² distribution?',es:'¿Dónde se sitúa cada anuncio elegible dentro de la distribución del precio por m² del mercado definido?'}

function EvidenceNotes({response,language}:{response:Phase14ApplicationResponse;language:'en'|'es'}){
 const es=language==='es',c=response.context
 return <>
 {c&&<section aria-label={es?'Identidad de la evidencia':'Evidence identity'}>
 <p>{es?'Fecha analítica':'Analytical date'}: {c.analyticalDate??(es?'No establecida':'Not established')}. {es?'Base de propiedad representada':'Represented property basis'}: {c.propertyBases.length?c.propertyBases.map(b=>b==='land_only'?(es?'Terreno vacío':'Vacant Land'):b==='improved_property'?(es?'Propiedad mejorada':'Improved Property'):(es?'Desconocida':'Unknown')).join(' / '):(es?'Sin observaciones elegibles':'No eligible observations')}.</p>
 <p>{es?'Anuncios antes de la elegibilidad analítica':'Listings before analytical eligibility'}: {c.hydratedCount}; {es?'excluidos de la población analítica':'excluded from the analytical population'}: {c.excludedCount}.</p>
 <p>{c.fx?`${c.fx.source} USD → CRC: ${c.fx.rate} · ${c.fx.effectiveDate} · ${es?'referencia de venta':'reference sale'} · ${c.fx.resolutionMode==='exact'?(es?'fecha exacta':'exact date'):(es?'última observación anterior aplicable':'latest applicable prior observation')}`:(es?'No se utilizó conversión USD en esta población.':'No USD conversion was used in this population.')}</p>
 </section>}
 <details><summary>{es?'Metodología':'Methodology'}</summary>
 <p>{es?'Cada candidato es un anuncio canónico elegible. La referencia es la población completa del mercado seleccionado, incluido el propio candidato; no es una cohorte de pares exactos ni una valoración. Se incluyen todos los candidatos elegibles, sin un límite de mejores resultados.':'Each candidate is an eligible canonical listing. The reference is the complete selected market population, including the candidate itself; it is not an exact-peer cohort or a valuation. All eligible candidates are included, without a top-results limit.'}</p>
 <p>{es?'El orden inicial es precio por m² ascendente. Los empates exactos usan el ID del anuncio únicamente para un orden estable, no como rango analítico. El percentil usa rango medio: (cantidad inferior + mitad de los iguales) / n × 100. La diferencia es candidato menos mediana; el porcentaje usa la mediana como referencia. Las colas son estrictamente inferiores a P10 o superiores a P90.':'Initial order is ascending Price / m². Exact ties use listing ID only for stable ordering, not analytical rank. Percentile uses midrank: (count below + half of equals) / n × 100. Difference is candidate minus median; percentage uses the median as reference. Tails are strictly below P10 or above P90.'}</p>
 <p>{es?'La elegibilidad exige estado activo, versión canónica vigente, transacción y geografía seleccionadas, tipo de propiedad y condiciones explícitas, importe positivo y denominador de área exacta válido. La evidencia ausente no es cero. Ordenar columnas, paginar o modificar entradas no vuelve a ejecutar el análisis. Las diferencias describen evidencia de oferta, no causas, valor justo ni recomendaciones.':'Eligibility requires active status, current canonical version, selected transaction and geography, Property Type and explicit constraints, positive amount and a valid exact-area denominator. Missing evidence is not zero. Sorting columns, paging or modifying inputs does not rerun analysis. Differences describe asking evidence, not causes, fair value or recommendations.'}</p>
 </details>
 </>
}
export default function DiscoveryWorkspace({language,serialized}:{language:'en'|'es';serialized?:string}){
 const [initial,setInitial]=useState<Phase14ApplicationRequest>(),[restoring,setRestoring]=useState(!!serialized),[invalid,setInvalid]=useState(false)
 useEffect(()=>{let live=true;setInvalid(false);setRestoring(!!serialized);setInitial(undefined)
 if(serialized)restoreDiscoveryDraft(serialized).then(v=>{if(live){setInitial(v??undefined);setInvalid(!v);setRestoring(false)}}).catch(()=>{if(live){setInvalid(true);setRestoring(false)}})
 return()=>{live=false}},[serialized])
 return <ComparativeDiscoveryAccess language={language}>
 {restoring?<p role="status">{language==='es'?'Restaurando la pregunta…':'Restoring question…'}</p>:<>
 {invalid&&<p role="alert">{language==='es'?'No se pudo restaurar la pregunta guardada. Define una nueva pregunta.':'The saved question could not be restored. Define a new question.'}</p>}
 <Phase14Discovery key={serialized??'new'} language={language} hub initialRequest={initial} execute={executeDiscoveryHub} footer={(input,response)=><>
 <EvidenceNotes response={response} language={language}/>
 <AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'discovery',discovery_request:JSON.stringify(input)}} result={response} defaultName={discoveryTitle[language]}/>
 </>}/>
 </>}
 </ComparativeDiscoveryAccess>
}
