// Browser presentation types only; canonical acquisition and counting stay server-side.
import type {ExplorerOptions,FilterOption,Language} from '../market-filters/types'
import {optionLabel} from '../market-filters/utils'
export type CompositionShare={count:number;percentage:number|null}
export type CompositionTerm=CompositionShare&{termId:string;label:{en:string;es:string};nonmatchCount?:number;unknownCount?:number}
export type CompositionNumerical={
 overlappingGroups:true
 exactValues:(CompositionShare&{key:string;kind:'exact';value:string})[]
 ranges:(CompositionShare&{key:string;kind:'range';lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean})[]
 coverage:{recordedEvidenceN:number;missingEvidenceN:number;exactFactN:number;rangeFactN:number;categoryFactN:number;positiveMembershipN:number;categoryEstablishedN:number;categoryUnestablishedN:number;recordedButUnclassifiedN:number;recordedEvidencePercentage:number|null;missingEvidencePercentage:number|null;categoryEstablishedPercentage:number|null;categoryUnestablishedPercentage:number|null}
}
export type CompositionDimension={dimension:string;denominatorN:number;representedN:number;unrepresentedN:number;terms:CompositionTerm[];numerical?:CompositionNumerical}
export type CompositionResult={engine:'composition';n:number;dimensions:CompositionDimension[]}

// Formatting only: preserve all fractional digits; do not coerce exact facts through Number.
export function compositionValueLabel(value:string,dimension:string,language:Language):string {
 const [whole,fraction]=value.split('.')
 const grouped=dimension==='year_built'?whole:whole.replace(/\B(?=(\d{3})+(?!\d))/g,language==='es'?'.':',')
 return grouped+(fraction===undefined?'':(language==='es'?',':'.')+fraction)
}
export function compositionRangeLabel(range:CompositionNumerical['ranges'][number],dimension:string,language:Language):string {
 return `${range.lowerInclusive?'[':'('}${range.lower===null?'−∞':compositionValueLabel(range.lower,dimension,language)}; ${range.upper===null?'+∞':compositionValueLabel(range.upper,dimension,language)}${range.upperInclusive?']':')'}`
}
function presentationId(value:unknown):string|null {
 if(typeof value==='number')return Number.isSafeInteger(value)?String(value):null
 return typeof value==='string'&&/^-?\d+$/.test(value)?value:null
}
export function compositionDistrictLabel(term:CompositionTerm,options:ExplorerOptions,language:Language):{text:string;qualified:boolean} {
 const unique=(family:'district'|'canton'|'province',id:string|null)=>{
  if(id===null)return undefined
  const matches=(options[family]??[]).filter((o):o is Exclude<FilterOption,string>=>typeof o==='object'&&presentationId(o.id)===id)
  return matches.length===1?matches[0]:undefined
 }
 const district=unique('district',term.termId),canton=unique('canton',district?presentationId(district.parent_id):null),province=unique('province',canton?presentationId(canton.parent_id):null)
 if(district&&canton&&province&&optionLabel(canton,language)&&optionLabel(province,language))return {text:`${term.label[language]}, ${optionLabel(canton,language)}, ${optionLabel(province,language)}`,qualified:true}
 return {text:`${term.label[language]} (${language==='es'?'ID canónico del distrito':'canonical district ID'}: ${term.termId}; ${language==='es'?'nombres de los niveles superiores no disponibles':'parent labels unavailable'})`,qualified:false}
}

export const compositionQuestion={en:'What characteristics compose the defined Costa Rica real estate market?',es:'¿Qué características componen el mercado inmobiliario definido de Costa Rica?'}
export const compositionLensQuestion={en:'How many listings have each characteristic, and what share of the defined Costa Rica real estate market do they represent?',es:'¿Cuántos anuncios tienen cada característica y qué porcentaje representan del mercado inmobiliario definido de Costa Rica?'}
export function dimensionLabel(key:string,language:'en'|'es'){
 const labels:Record<string,[string,string]>={province:['Province','Provincia'],canton:['Canton','Cantón'],district:['District','Distrito'],property_type:['Property type','Tipo de propiedad'],bedrooms:['Bedrooms','Dormitorios'],bathrooms:['Bathrooms','Baños'],parking:['Parking','Estacionamiento'],year_built:['Year built','Año de construcción'],utility:['Utilities','Servicios'],environment:['Environment','Entorno'],terrain:['Terrain','Terreno'],accessibility:['Accessibility','Accesibilidad'],legal_status:['Legal status','Estado legal']}
 return labels[key]?.[language==='es'?1:0]??key
}
