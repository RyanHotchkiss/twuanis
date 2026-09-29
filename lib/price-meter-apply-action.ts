'use server'

import {validateGeographicApply,validateGeographicCommand} from './price-meter-geographic-command'
import {validateConstructionLandNormalization} from './price-meter-construction-land-command'

import { authorizePriceMeterIntelligenceExecution } from '@/lib/price-meter-authorization'

import { validateSelectedPriceMeterEngines,validateDistributionIdentity } from './price-meter-selected-contract'

import { validatePriceMeterApply } from '@/lib/price-meter-apply-contract'
import { issuePriceMeterApplyPermit } from '@/lib/price-meter-apply-permit'

// This POST-backed Server Action is called only by the Apply click handler.
// Pages, URL restoration, prefetch, and filter effects never call it.
export async function executePriceMeterApply(
  input: unknown, language: 'en' | 'es', source: 'workspace' | 'standalone', selected:unknown, distributionIdentity?:unknown, geographicCommand?:unknown, constructionLandNormalization?:unknown
) {
  await authorizePriceMeterIntelligenceExecution()
  const engines=validateSelectedPriceMeterEngines(selected)
  const cl=engines.includes('construction-land')?validateConstructionLandNormalization(constructionLandNormalization):undefined
  if(cl&&(engines.length!==1||distributionIdentity!==undefined||geographicCommand!==undefined))throw Error('Select one Construction-to-Land question.')
  if(!cl&&constructionLandNormalization!==undefined)throw Error('Unexpected Construction-to-Land identity.')
  if(cl&&input&&typeof input==='object'&&['property_basis','normalization_basis'].some(k=>k in input))throw Error('Construction-to-Land definition must use the explicit command identity.')
  if(engines.some(e=>e==='property-area'||e==='construction-area')){
    if(engines.length!==1||distributionIdentity!==undefined||geographicCommand!==undefined)throw Error('Select one server-defined size relationship.')
    if(input&&typeof input==='object'&&['property_basis','normalization_basis','size_dimension'].some(k=>k in input))throw Error('Size definition is determined by the selected mode.')
  }
  const geography=engines.includes('geography')?validateGeographicCommand(geographicCommand):undefined
  if(geography&&engines.length!==1)throw Error('Geographic comparison requires one explicit question.')
  const filters = geography?validateGeographicApply(input,geography):validatePriceMeterApply(input)
  const identity=engines.includes('distribution')?validateDistributionIdentity(distributionIdentity):undefined
  if ((language !== 'en' && language !== 'es') ||
      (source !== 'workspace' && source !== 'standalone')) {
    throw new Error('Invalid PPM2 Apply request.')
  }
  const engineFilters = { ...filters }
  // Both entry surfaces submit stable IDs/codes. The canonical request resolver
  // resolves exact identities; display labels never select analytical membership.
  const permit = issuePriceMeterApplyPermit(engineFilters, language, geography)
  const { getSelectedPriceMeterAnalysis } = await import('./price-meter-selected-engine')
  return getSelectedPriceMeterAnalysis(engineFilters, language, permit, engines, identity, geography,cl)
}
