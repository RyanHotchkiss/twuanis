// Presentation-only contract. No engine or acquisition imports.
import { getUi } from '../market-filters/translations'
import { optionLabel, optionValue } from '../market-filters/utils'
import { transactionOptions } from '../market-filters/options'
import { MARKET_YEAR_BUILT_OPTIONS } from '@/lib/market-year-built-options'
import { pavedRoadDistanceRangeOptions } from '@/data/property-data'
import type { ExplorerOptions, FilterOption, Filters, Language } from '../market-filters/types'
export const summaryKeys = ['transaction_type','property_type','province','canton','district','bedrooms','bathrooms','parking','year_built','property_area','construction_area','utility','environment','terrain','accessibility','legal_status','distance_to_paved_road_range'] as const
export type SummaryKey = typeof summaryKeys[number]
export type SummaryResult = {engine:'summary';n:number;saleCount:number;rentCount:number;state:string}
export const question = {
 en:'How many listings are in the defined Costa Rica real estate market?',
 es:'¿Cuántos anuncios hay en el mercado inmobiliario definido de Costa Rica?'
}
export function supportingQuestion(transaction:'sale'|'rent',language:Language) {
 return language==='es'
  ? `¿Cuántos anuncios están ${transaction==='sale'?'en venta':'en alquiler'} en el mercado inmobiliario definido de Costa Rica?`
  : `How many listings are ${transaction==='sale'?'for sale':'for rent'} in the defined Costa Rica real estate market?`
}
export function summaryLabel(key:SummaryKey,language:Language) {
 const ui=getUi(language)
 const keys={transaction_type:'transaction',property_type:'propertyType',year_built:'yearBuilt',property_area:'propertyArea',construction_area:'constructionArea',utility:'utilities',legal_status:'legalStatus',distance_to_paved_road_range:'distanceToPavedRoad'} as const
 return ui[(keys[key as keyof typeof keys] || key) as keyof typeof ui]
}
export function summaryOptions(key:SummaryKey,options:ExplorerOptions,language:Language,draft?:Filters):FilterOption[] {
 if(key==='transaction_type')return transactionOptions[language]
 if(key==='year_built')return MARKET_YEAR_BUILT_OPTIONS.map(o=>({slug:o.key,term_name_en:o.en,term_name_es:o.es}))
 if(key==='distance_to_paved_road_range')return pavedRoadDistanceRangeOptions.map(o=>({slug:o.value,term_name_en:o.en,term_name_es:o.es}))
 const values=options[key] || []
 if(draft && (key==='canton'||key==='district')) {
  const parentKey=key==='canton'?'province':'canton'
  const parent=options[parentKey]?.find(o=>optionValue(o)===draft[parentKey])
  return typeof parent==='object' && parent.id!==undefined ? values.filter(o=>typeof o==='object'&&o.parent_id===parent.id) : []
 }
 return values
}
export function summaryOptionMatches(key:SummaryKey,option:FilterOption,value:string) {
 return optionValue(option)===value || !['province','canton','district'].includes(key) && typeof option==='object' && option.id!==undefined && String(option.id)===value
}
export function summarySnapshot(filters:Filters):Filters {
 return Object.fromEntries(summaryKeys.filter(k=>filters[k]).map(k=>[k,filters[k]]))
}
export function summaryIdentity(filters:Filters,options:ExplorerOptions,language:Language) {
 const parts:string[]=[]
 for(const key of summaryKeys){
  if(!filters[key])continue
  const values=filters[key]!.split(',').map(value=>{
   const option=summaryOptions(key,options,language).find(o=>summaryOptionMatches(key,o,value))
   if(!option)throw Error('Unavailable input identity.')
   return optionLabel(option,language)
  })
  const label=values.join(' / ')
  parts.push(['transaction_type','property_type','province','canton','district'].includes(key)?label:`${summaryLabel(key,language)}: ${label}`)
 }
 if(!filters.transaction_type)parts.unshift(language==='es'?'Venta y alquiler':'Sale and rent')
 if(!filters.property_type)parts.splice(1,0,language==='es'?'Todos los tipos de propiedad':'All property types')
 if(!filters.province&&!filters.canton&&!filters.district)parts.splice(2,0,'Costa Rica')
 return parts
}
