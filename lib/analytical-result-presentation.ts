// Presentation over existing canonical identities and already-calculated evidence only.
import type {ExplorerOptions,FilterOption,Language} from '@/app/components/market-filters/types'
import {normalize,optionLabel,optionValue} from '@/app/components/market-filters/utils'
import {property_types} from '@/data/property-data'
import {resultSynthesis} from './universal-result-synthesis'
import type {GeographicEvidence} from '@/app/components/price-meter-geography/contract'
export function canonicalResultLabel(options:ExplorerOptions,dimension:keyof ExplorerOptions,identity:string|undefined,fallback:string,language:Language):string{
 const choices=options[dimension]??[]
 const exact=identity?choices.find(o=>typeof o==='object'&&(String(o.id)===identity||optionValue(o)===identity||o.slug===identity)):undefined
 if(exact)return optionLabel(exact,language)
 // Verified canonical House identity; wording reuses the existing bilingual product dictionary.
 if(dimension==='property_type'&&identity==='1115')return property_types.find(p=>p.en==='House')![language]
 const candidates=choices.filter(o=>typeof o==='object'&&[o.term_name,o.term_name_en,o.term_name_es,o.slug,o.slug_en,o.slug_es].some(v=>v&&normalize(v)===normalize(fallback)))
 return candidates.length===1?optionLabel(candidates[0],language):fallback
}
export function geographicResultLabel(key:string,fallback:string,options:ExplorerOptions,language:Language):string{
 const part=key.split('|').at(-1)??'',split=part.split(':')
 return canonicalResultLabel(options,split[0] as keyof ExplorerOptions,split[1],fallback,language)
}
export function rangeResultLabel(label:string,language:Language):string{
 const f=new Intl.NumberFormat(language==='es'?'es-CR':'en-US',{maximumFractionDigits:3})
 return label.replace(/\d[\d,]*/g,n=>f.format(Number(n.replaceAll(',','')))).replace('Under ',language==='es'?'Menos de ':'Under ').replace('Over ',language==='es'?'Más de ':'Over ').replace('hectares',language==='es'?'hectáreas':'hectares')
}
export function geographicResultSynthesis(evidence:GeographicEvidence,boundaryLabel:string,options:ExplorerOptions,language:Language){
 const rows=evidence.rows.map(row=>({...row,geography:{...row.geography,label:canonicalResultLabel(options,evidence.comparisonLevel,row.geography.id,row.geography.label,language)}}))
 return resultSynthesis('geography',{evidence:{...evidence,rows},boundaryLabel},language,evidence.transactionType==='rent'?'RENT':'SALE')
}
