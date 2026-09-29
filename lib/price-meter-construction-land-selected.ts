import 'server-only'
import {resolvePriceMeterConstructionLandIdentity} from './price-meter-construction-land'
import {buildPriceMeterConstructionLandPopulation} from './price-meter-construction-land-population'
import {buildPriceMeterConstructionLandStatistics} from './price-meter-construction-land-statistics'
import {buildPriceMeterConstructionLandLandRelationship,buildPriceMeterConstructionLandConstructionRelationship} from './price-meter-construction-land-relationship'
import type {PriceMeterAnalyticalIdentity} from './price-meter-identity'

import {validateConstructionLandNormalization} from './price-meter-construction-land-command'

// Orchestration and aggregate projection only. Mathematics remains in the shared builders.
export function buildSelectedConstructionLand(identities:PriceMeterAnalyticalIdentity[],transactionType:'sale'|'rent',input:unknown){
  const normalizationBasis=validateConstructionLandNormalization(input)
  const observations=identities.flatMap(identity=>{
    const resolved=resolvePriceMeterConstructionLandIdentity(identity)
    return resolved&&resolved.transactionType===transactionType?[resolved]:[]
  })
  const population=buildPriceMeterConstructionLandPopulation({transactionType,observations})
  if(normalizationBasis==='land'){
    const statistics=buildPriceMeterConstructionLandStatistics(population,'land')
    return {normalizationBasis,relationship:buildPriceMeterConstructionLandLandRelationship(statistics),cohorts:statistics.cohorts.map(c=>({definition:c.definition,n:c.observationCount,medianExactRatio:c.medianExactRatio,medianPricePerM2:c.landNormalized.median}))}
  }
  const statistics=buildPriceMeterConstructionLandStatistics(population,'construction')
  return {normalizationBasis,relationship:buildPriceMeterConstructionLandConstructionRelationship(statistics),cohorts:statistics.cohorts.map(c=>({definition:c.definition,n:c.observationCount,medianExactRatio:c.medianExactRatio,medianPricePerM2:c.constructionNormalized.median}))}
}
