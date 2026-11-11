import 'server-only'
import {cache} from 'react'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import type {Metadata} from 'next'
import {localMethodologyPreviewEnabled} from './methodology-publication'
import manifest from './methodology-content/manifest.json'
import {POPULATION_ENGINES} from './population-engine-registry'
export type Locale='en'|'es'
export type Projection={engineId:string;name:string;locale:Locale;explanationRevision:string;historicalReleaseReference:string;question:string;applications:string[];inputs:{name:string;meaning:string;unit:string;required:boolean;missingBehavior:string}[];calculationStages:{id:string;meaning:string;formulaRefs:string[]}[];formulas:{id:string;equation:string;variables:{symbol:string;meaning:string;unit:string}[];statisticalMethod:string;denominator:string;normalization:string;precisionAndRounding:string}[];population:{definition:string;eligibility:string[];exclusions:string[]};outputs:{name:string;meaning:string;unit:string;interpretation:string}[];resultStates:Record<string,string>;supportedInterpretation:string;unsupportedInterpretations:string[];packageMembership:{packageId:string;capabilityId:string;availability:string}[]}
export const previewEnabled=localMethodologyPreviewEnabled
export const collectionPath=(l:Locale)=>l==='es'?'/es/conocimiento/metodologias':'/en/knowledge/methodologies'
export const pagePath=(id:string,l:Locale)=>`${collectionPath(l)}/${id}`
export const packagesPath=(l:Locale)=>l==='es'?'/es/inteligencia-de-mercado/paquetes':'/en/market-intelligence/packages'
const digest=(s:Buffer)=>createHash('sha256').update(s).digest('hex')
// Request-scoped React cache only. No stale process cache: source loss/drift blocks both locales.
export const readCollection=cache(()=>{
 const dir=path.join(process.cwd(),'lib/methodology-content')
 for(const [file,expected] of Object.entries(manifest.sources))if(digest(readFileSync(path.join(process.cwd(),file)))!==expected)throw Error('Methodology verification unavailable')
 const rows:Projection[]=[]
 for(const [file,expected]of Object.entries(manifest.files)){
  const bytes=readFileSync(path.join(dir,file));if(digest(bytes)!==expected)throw Error('Methodology verification unavailable')
  rows.push(JSON.parse(bytes.toString()) as Projection)
 }
 if(rows.length!==34||POPULATION_ENGINES.length!==17)throw Error('Methodology verification unavailable')
 for(const engine of POPULATION_ENGINES){
  const pair=rows.filter(p=>p.engineId===engine[0]);const en=pair.find(p=>p.locale==='en'),es=pair.find(p=>p.locale==='es')
  if(pair.length!==2||!en||!es||en.explanationRevision!==es.explanationRevision||en.historicalReleaseReference!==es.historicalReleaseReference||JSON.stringify(en.formulas.map(f=>[f.id,f.equation,f.variables.map(v=>v.symbol)]))!==JSON.stringify(es.formulas.map(f=>[f.id,f.equation,f.variables.map(v=>v.symbol)]))||JSON.stringify(en.packageMembership)!==JSON.stringify(es.packageMembership))throw Error('Methodology verification unavailable')
 }
 const bytes=readFileSync(path.join(dir,'commercial.json'));if(digest(bytes)!==manifest.commercialSHA256)throw Error('Package verification unavailable')
 const commercial=JSON.parse(bytes.toString()) as {configObservedAt:string;capabilities:{id:string;name_en:string;name_es:string}[]}
 for(const engine of POPULATION_ENGINES){const c=commercial.capabilities.find(c=>c.id===engine[3]);if(!c||rows.some(p=>p.engineId===engine[0]&&p.name!==(p.locale==='en'?c.name_en:c.name_es)))throw Error('Methodology verification unavailable')}
 return rows
})
export function readPage(id:string,locale:Locale){return readCollection().find(p=>p.engineId===id&&p.locale===locale)}
export function metadataFor(id:string,l:Locale):Metadata{
 if(!previewEnabled())return {title:'Twuanis',robots:{index:false,follow:false}}
 try{const p=readPage(id,l);if(!p)return {robots:{index:false,follow:false}}
 return {title:`${p.name} | Twuanis`,description:p.question,robots:{index:false,follow:false},alternates:{canonical:`https://twuanis.com${pagePath(id,l)}`,languages:{en:`https://twuanis.com${pagePath(id,'en')}`,es:`https://twuanis.com${pagePath(id,'es')}`}}}}
 catch{return {title:l==='es'?'Metodología no disponible':'Methodology unavailable',robots:{index:false,follow:false}}}
}
export const commercialObservedAt=manifest.commercialObservedAt
