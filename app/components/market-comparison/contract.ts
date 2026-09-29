// Browser-safe presentation contract. Statistics are established on the server.
import type {CompositionResult} from '../market-composition/contract'
export const comparisonQuestion={en:'How do two defined Costa Rica real estate markets differ?',es:'¿Cómo difieren dos mercados inmobiliarios definidos de Costa Rica?'}
export type Metric='averageSalePrice'|'medianSalePrice'|'averageRent'|'medianRent'|'averagePropertyArea'|'averageConstructionArea'
export type ComparisonSide={filters:Record<string,string|undefined>;sampleSize:number;prevalence:Omit<CompositionResult,'engine'>;metrics?:Record<Metric,number|null>;averageSalePriceCRC:string|null;averageSalePriceUSD:string|null;medianSalePriceCRC:string|null;medianSalePriceUSD:string|null;averageRentCRC:string|null;averageRentUSD:string|null;medianRentCRC:string|null;medianRentUSD:string|null;averagePropertyArea:string|null;averageConstructionArea:string|null}
export type ComparisonResult={language:'en'|'es';left:ComparisonSide;right:ComparisonSide}
export function pairWidths(a:number|null|undefined,b:number|null|undefined):[number|null,number|null]{
 const valid=(v:number|null|undefined):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0
 const max=Math.max(valid(a)?a:0,valid(b)?b:0)
 return [valid(a)?(max?a/max*100:0):null,valid(b)?(max?b/max*100:0):null]
}
