import 'server-only'
import { resolveCanonicalMarketRequest,canonicalMarketFilterBoundary } from './canonical-market-request'
import { countMarketNumericalSurvivors,readMarketNumericalSurvivors } from './canonical-market-acquisition'
import { canonicalMarketPrevalence } from './canonical-market-prevalence'
export async function getMarketSummary(filters:Record<string,string|undefined>){
 const request=await resolveCanonicalMarketRequest(filters)
 const boundary=canonicalMarketFilterBoundary(request)
 if(request.year||request.road){
  const rows=await readMarketNumericalSurvivors(request,boundary,['transaction_type'])
  const saleCount=rows.filter(row=>row.transaction_type==='sale').length
  const rentCount=rows.filter(row=>row.transaction_type==='rent').length
  if(saleCount+rentCount!==rows.length)throw Error('Invalid summary transaction evidence.')
  return {engine:'summary' as const,filters,n:rows.length,saleCount,rentCount,state:rows.length?'ESTABLISHED':'EMPTY_POPULATION'}
 }
 const n=await countMarketNumericalSurvivors(request,boundary)
 const saleCount=boundary.transaction==='sale'?n:boundary.transaction==='rent'?0:await countMarketNumericalSurvivors(request,{...boundary,transaction:'sale'})
 const rentCount=boundary.transaction==='rent'?n:boundary.transaction==='sale'?0:await countMarketNumericalSurvivors(request,{...boundary,transaction:'rent'})
 if(saleCount+rentCount!==n)throw Error('Summary population changed during acquisition.')
 return {engine:'summary' as const,filters,n,saleCount,rentCount,state:n?'ESTABLISHED':'EMPTY_POPULATION'}
}
export async function getMarketComposition(filters:Record<string,string|undefined>){
 const request=await resolveCanonicalMarketRequest(filters)
 const rows=await readMarketNumericalSurvivors(request,canonicalMarketFilterBoundary(request),[])
 return {engine:'composition' as const,filters,...await canonicalMarketPrevalence(rows.map(row=>row.id))}
}
