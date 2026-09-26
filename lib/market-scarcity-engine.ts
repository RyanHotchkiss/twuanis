import 'server-only'
import { resolveCanonicalMarketRequest } from './canonical-market-request'
import { countCanonicalMarket } from './canonical-market-population'
import { countMarketNumericalSurvivors } from './canonical-market-acquisition'

// Historical route name retained; the surviving product is Configuration Frequency.
// No Rare Configuration Discovery, powerset, weighting, or scarcity score executes.
export async function getMarketScarcity(filters:Record<string,string|undefined>,language:'en'|'es'='en'){
  const request=await resolveCanonicalMarketRequest(filters,language)
  const marketSize=await countCanonicalMarket(request.base)
  const configuration=request.terms.filter(t=>t.dimension!=='property_type')
  const numerator={...request.base,membershipGroups:[...request.base.membershipGroups,...configuration.map(t=>[t.id])],
    propertyArea:request.propertyArea,constructionArea:request.constructionArea}
  const hasConfiguration=configuration.length>0||!!request.year||!!request.road||!!request.propertyArea||!!request.constructionArea
  const matchingCount=marketSize===0?0:hasConfiguration?await countMarketNumericalSurvivors(request,numerator):marketSize
  if(matchingCount>marketSize)throw Error('Configuration population changed during acquisition.')
  const percentage=marketSize?matchingCount/marketSize*100:null
  const attributes=[...configuration.map(t=>({category:t.dimension,value:t.label,termId:t.id})),
    ...(['year_built','distance_to_paved_road_range','property_area','construction_area'] as const)
      .flatMap(key=>filters[key]?[{category:key,value:filters[key]!,termId:null}]:[])]
  return {language,filters,marketSize,matchingCount,percentage,
    state:marketSize?'ESTABLISHED':'EMPTY_BASE_MARKET',
    denominator:'distinct active canonical listings satisfying transaction, geography and property type',
    unknownPolicy:'Unknown evidence does not establish configuration membership.',
    scarcityShare:percentage===null?null:`${percentage.toFixed(2)}%`,
    selectedCombination:hasConfiguration?{attributes,explanation:language==='es'
      ?`${matchingCount} de ${marketSize} propiedades satisfacen la configuración seleccionada.`
      :`${matchingCount} of ${marketSize} listings establish the selected configuration.`}:null,
    combinations:[]}
}
