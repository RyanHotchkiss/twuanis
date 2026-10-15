import 'server-only'
import {authorizePreviouslyPublicCapability} from './package-capability-authorization'
import { resolveCanonicalMarketRequest,canonicalMarketFilterBoundary } from './canonical-market-request'
import { countMarketNumericalSurvivors,readMarketNumericalSurvivors } from './canonical-market-acquisition'
import { canonicalMarketPrevalence } from './canonical-market-prevalence'
export async function getMarketSummary(filters:Record<string,string|undefined>){
 await authorizePreviouslyPublicCapability('cap-market-summary')

 const request=await resolveCanonicalMarketRequest(filters)
 const boundary=canonicalMarketFilterBoundary(request)
 if(request.year||request.road){
  const rows=await readMarketNumericalSurvivors(request,boundary,['transaction_type'])
  const saleCount=rows.filter(row=>row.transaction_type==='sale').length
  const rentCount=rows.filter(row=>row.transaction_type==='rent').length
  if(saleCount+rentCount!==rows.length)throw Error('Invalid summary transaction evidence.')
  return calculateMarketSummary(filters,saleCount,rentCount)
 }
 const n=await countMarketNumericalSurvivors(request,boundary)
 const saleCount=boundary.transaction==='sale'?n:boundary.transaction==='rent'?0:await countMarketNumericalSurvivors(request,{...boundary,transaction:'sale'})
 const rentCount=boundary.transaction==='rent'?n:boundary.transaction==='sale'?0:await countMarketNumericalSurvivors(request,{...boundary,transaction:'rent'})
 if(saleCount+rentCount!==n)throw Error('Summary population changed during acquisition.')
 return calculateMarketSummary(filters,saleCount,rentCount)
}
export async function getMarketComposition(filters:Record<string,string|undefined>){
 await authorizePreviouslyPublicCapability('cap-market-composition')

 const request=await resolveCanonicalMarketRequest(filters)
 const rows=await readMarketNumericalSurvivors(request,canonicalMarketFilterBoundary(request),[])
 return {engine:'composition' as const,filters,...await canonicalMarketPrevalence(rows.map(row=>row.id))}
}

// Shared calculation for an already authorized, explicitly bounded population.
export function calculateMarketSummary(filters:Record<string,string|undefined>,saleCount:number,rentCount:number){
 if(![saleCount,rentCount].every(n=>Number.isSafeInteger(n)&&n>=0))throw Error('Invalid summary counts.')
 const n=saleCount+rentCount
 return {engine:'summary' as const,filters,n,saleCount,rentCount,state:n?'ESTABLISHED':'EMPTY_POPULATION'}
}
