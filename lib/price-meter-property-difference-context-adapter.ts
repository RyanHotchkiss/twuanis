import 'server-only'
import type { PositionExecution } from './price-meter-property-position-execution'
import type { ContextKey } from './price-meter-property-difference-context-request'
import type { ContextItem } from './price-meter-property-difference-context-result-contract'
import type { ContextDistribution,ContextMetric } from './price-meter-property-difference-context-browser-contract'
export type EstablishedExecution=PositionExecution & {working:NonNullable<PositionExecution['working']>;result:Extract<PositionExecution['result'],{state:'ok'}>}
export const emptyDistribution=():ContextDistribution=>({minimum:null,p10:null,p25:null,median:null,p75:null,p90:null,maximum:null,iqr:null})
export function distribution(d:ContextDistribution):ContextDistribution {return {minimum:d.minimum,p10:d.p10,p25:d.p25,median:d.median,p75:d.p75,p90:d.p90,maximum:d.maximum,iqr:d.iqr}}
export const metric=(key:string,value:number|null,unit='',reason:string|null=null):ContextMetric=>({key,value,unit,state:value===null?'withheld':'established',reason:value===null?reason||'mathematical_degeneracy':null})
export function contextBase(e:EstablishedExecution,key:ContextKey,index:number,phase:7|8|9|10):ContextItem {
 const r=e.result.reference
 return {questionKey:key,index,phase,state:'established',reason:null,
  populations:[{key:'reference',geography:{id:r.geography.id,level:r.geographyLevel,label:r.geography.label},propertyType:{id:r.propertyType.id,label:r.propertyType.label},propertyArea:r.propertyArea,constructionArea:r.constructionArea,constructionLand:null,characteristics:[],n:e.result.evidence.comparisonPopulationCount,representedN:null,subjectIncluded:true}],
  universe:{transactionType:r.transactionType,propertyBasis:r.propertyBasis,normalizationBasis:r.normalizationBasis,unit:e.result.unit,analyticalDate:e.result.analyticalDate,monetaryMethod:e.result.fx?'bccr_reference_sale':'native_crc'},
  monetaryProvenance:e.result.fx,metrics:[],groups:[]}
}
