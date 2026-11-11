'use server'
import {executePropertyPriceValuation} from './property-price-valuation-engine'
import {authorizeLegacyPropertyValuationExecution} from './price-meter-authorization'
import {valuationTerms,option} from './property-price-valuation-data'
import type {CatalogResponse,Response} from './property-price-valuation-contract'
export async function evaluatePropertyPriceValuation(input:unknown):Promise<Response>{return executePropertyPriceValuation(input)}
export async function loadPropertyPriceValuationOptions():Promise<CatalogResponse>{
 try{await authorizeLegacyPropertyValuationExecution();return {ok:true,options:(await valuationTerms()).map(option)}}catch{return {ok:false}}
}
