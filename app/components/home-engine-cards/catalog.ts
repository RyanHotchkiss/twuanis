// Homepage presentation only. Names/questions reuse current Hub contracts, not engine implementations.
import {question as summaryQuestion} from '../market-summary/contract'
import {compositionQuestion} from '../market-composition/contract'
import {comparisonQuestion} from '../market-comparison/contract'
import {configurationQuestion} from '../configuration-frequency/contract'
import {distributionQuestion} from '../price-meter-distribution/contract'
import {geographicQuestion} from '../price-meter-geography/contract'
import {sizeQuestion} from '../price-meter-size/contract'
import {constructionLandQuestion} from '../price-meter-construction-land/contract'
import {cohortQuestion,cohortTitle} from '../price-meter-comparison/contract'
import {crossQuestion,crossTitle} from '../price-meter-cross-dimensional/contract'
import {positionHubQuestion,positionHubTitle} from '@/lib/position-hub-contract'
import {comparablesQuestion,comparablesTitle} from '@/lib/comparables-hub-contract'
import {ratioQuestion,ratioTitle} from '@/lib/asking-area-ratio-contract'
import {weightedQuestion,weightedTitle} from '@/lib/weighted-price-contract'
import {hubEngineUrl} from '../intelligence-hub-navigation'
export const askingQuestion={en:'How are asking prices distributed across the defined Costa Rica real estate market?',es:'¿Cómo se distribuyen los precios de oferta en el mercado inmobiliario definido de Costa Rica?'}
export const matchingQuestion={en:'Which listings most closely match the selected property attributes?',es:'¿Qué anuncios coinciden más con los atributos de propiedad seleccionados?'}
export const discoveryQuestion={en:'Where does each eligible listing sit within the defined market’s Price / m² distribution?',es:'¿Dónde se sitúa cada anuncio elegible dentro de la distribución del precio por m² del mercado definido?'}
type Copy={en:string;es:string}
export type Card={id:string;name:Copy;question:Copy}
const card=(id:string,en:string,es:string,question:Copy):Card=>({id,name:{en,es},question})
export const homeCards:Card[]=[
 card('explorer','Market Summary','Resumen del mercado',summaryQuestion),
 card('composition','Market Composition','Composición del mercado',compositionQuestion),
 card('asking-price','Market Asking Price Distribution','Distribución de precios de oferta del mercado',askingQuestion),
 card('matching','Property Matching','Coincidencia de Propiedades',matchingQuestion),
 card('comparison','Market Comparison','Comparación de Mercados',comparisonQuestion),
 card('scarcity','Property Configuration Frequency','Frecuencia de configuración de propiedades',configurationQuestion),
 card('price-meter','Price / m² Distribution','Distribución del precio por m²',distributionQuestion),
 card('geography','Geographic Price / m² Comparison','Comparación geográfica del precio por m²',geographicQuestion),
 card('size','Size → Price / m²','Tamaño → Precio por m²',sizeQuestion),
 card('construction-land','Construction-to-Land → Price / m²','Construcción / Terreno → Precio por m²',constructionLandQuestion),
 {id:'cohort-comparison',name:cohortTitle,question:cohortQuestion},
 {id:'cross-dimensional',name:crossTitle,question:crossQuestion},
 card('discovery','Comparative Price / m² Discovery','Descubrimiento comparativo de precio / m²',discoveryQuestion),
 {id:'position',name:positionHubTitle,question:positionHubQuestion},
 {id:'comparables',name:comparablesTitle,question:comparablesQuestion},
 {id:'asking-area-ratio',name:ratioTitle,question:ratioQuestion},
 {id:'weighted-price',name:weightedTitle,question:weightedQuestion}
]
export const homeRows=[
 {id:'market',heading:{en:'Market Inventory & Distribution Lenses',es:'Perspectivas del inventario y la distribución del mercado'},ids:['explorer','composition','asking-price','scarcity','price-meter'],color:'#2ecc71'},
 {id:'comparison',heading:{en:'Matching, Comparison & Discovery Engines',es:'Motores de coincidencia, comparación y descubrimiento'},ids:['matching','comparison','cohort-comparison','discovery'],color:'#ff3b00'},
 {id:'relationships',heading:{en:'Price / m² Relationship Engines',es:'Motores de relaciones del precio por m²'},ids:['geography','size','construction-land','cross-dimensional'],color:'#0066cc'},
 {id:'property',heading:{en:'Property-Specific Reference Lenses',es:'Perspectivas de referencia específicas de la propiedad'},ids:['position','comparables'],color:'#ffd700'},
 {id:'weighting',heading:{en:'Asking-Price Relationship & Normalization Engines',es:'Motores de relaciones del precio de oferta y normalización'},ids:['asking-area-ratio','weighted-price'],color:'#ffd700'}
]
export function cardUrl(id:string,language:'en'|'es'){return hubEngineUrl(language==='es'?'/es/inteligencia-de-mercado':'/en/market-intelligence','',id)}
