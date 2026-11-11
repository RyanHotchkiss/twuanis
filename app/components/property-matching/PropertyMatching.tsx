'use client'
import SharedResult from './PropertyMatchingResult'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {optionLabel} from '../market-filters/utils'
import {summaryLabel,type SummaryKey} from '../market-summary/contract'
import type {MatchEvidence,MatchExplanation} from '@/lib/market-matching-evidence-contract'
import shared from '../market-summary/workspace.module.css'
import styles from './matching.module.css'
type Preference={dimension:string;identity:string;label:string;state:'MATCH'|'NONMATCH'|'UNKNOWN';explanation?:MatchExplanation}
type Listing={id:string;transaction?:'sale'|'rent';title:string|null;images:string[];formattedPrice:string|null;province:string|null;canton:string|null;property_type:string|null;matchScore:number|null;confirmedMatches:number;confirmedNonmatches:number;unknown:number;preferences:Preference[]}
type Result={totalListings:number;listings:Listing[]}
export default function PropertyMatching({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}){
 const es=language==='es',number=new Intl.NumberFormat(es?'es-CR':'en-US',{maximumFractionDigits:2})
 const question=es?'¿Qué anuncios coinciden más con los atributos de propiedad seleccionados?':'Which listings most closely match the selected property attributes?'
 function evidence(v:MatchEvidence|undefined,dimension:string):string{
  if(!v)return es?'Explicación no disponible en este resultado guardado':'Explanation unavailable in this saved result'
  if(v.kind==='alternatives')return v.values.map(value=>evidence(value,dimension)).join(' / ')
  if(v.kind==='unknown')return es?'Desconocida':'Unknown'
  if(v.kind==='term'){const option=(options[dimension as keyof ExplorerOptions]??[]).find(o=>typeof o==='object'&&String(o.id)===v.id);return option?optionLabel(option,language):v.label??(es?'Categoría registrada (etiqueta no disponible)':'Recorded category (label unavailable)')}
  const unit=['property_area','construction_area'].includes(dimension)?' m²':dimension==='distance_to_paved_road'?' m':''
  if(v.kind==='exact')return v.value+unit
  return `${v.lowerInclusive?'[':'('}${v.lower??'−∞'}, ${v.upper??'∞'}${v.upperInclusive?']':')'}${unit}`
 }
 return <CanonicalMarketWorkspace<Result> engine="matching" options={options} filters={filters} language={language} title={es?'Coincidencia de propiedades':'Property Matching'} primaryQuestion={question}>
 {(committed,heading,id)=><SharedResult committed={committed} heading={heading} id={id} language={language} options={options}/>}
 </CanonicalMarketWorkspace>
}
