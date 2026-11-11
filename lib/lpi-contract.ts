// Browser-safe integration vocabulary. No engine, database or provider imports.
export const LPI_LENSES = [
 {id:'asking',capability:'cap-market-asking-price-distribution',en:'Market Asking Price Distribution',es:'Distribución de Precios de Oferta del Mercado'},
 {id:'matching',capability:'cap-property-matching',en:'Property Matching',es:'Coincidencia de Propiedades'},
 {id:'frequency',capability:'cap-property-configuration-frequency',en:'Property Configuration Frequency',es:'Frecuencia de Configuración de Propiedades'},
 {id:'position',capability:'cap-property-price-m2-position',en:'Property Price / m² Position',es:'Posición del Precio por m² de la Propiedad'},
] as const
export type Lens = typeof LPI_LENSES[number]['id']
export type Lang = 'en'|'es'
export type Draft = Record<string,unknown>
export type Context = {kind:'published';id:string;transaction:'sale'|'rent';snapshot?:string} | {kind:'draft';transaction:'sale'|'rent';draft:Draft}
export type Request = {lens:Lens;context:Context;language:Lang}
export type Filters = Record<string,string|undefined>
export type Question = {transaction:'sale'|'rent';district:string;propertyType:string;filters:Filters;revision:string;listingId?:string;basis?:'land'|'construction';amount:number|null;currency:string|null;unsupported:string[]}
export class QuestionUnavailable extends Error {}
export function lensDefinition(id:unknown){const lens=LPI_LENSES.find(l=>l.id===id);if(!lens)throw new QuestionUnavailable('Unknown lens');return lens}
// Price is a marker, never a defining cohort input. Files and publication content
// never leave the existing form through this analytical boundary.
export const DRAFT_KEYS = ['province','canton','district','property_type','utility','environment','terrain','accessibility','legal_status','bedrooms','bathrooms','parking','year_built_range','distance_to_paved_road_range','property_area','construction_area','currency','priceMillions','monthly_price'] as const
export function draftSnapshot(value:Draft):Draft {return Object.fromEntries(DRAFT_KEYS.filter(k=>value[k]!==undefined).map(k=>[k,value[k]]))}
export function contextKey(context:Context):string {
 if(context.kind==='published')return JSON.stringify(context)
 const d=draftSnapshot(context.draft);delete d.priceMillions;delete d.monthly_price;delete d.currency
 return JSON.stringify({transaction:context.transaction,draft:d})
}
// Only an explicit Run dispatches work. Concurrent same-lens clicks share a single
// promise; changing context invalidates delivery without pretending to cancel SQL.
export function createRunController<T>() {
 let generation=0;const pending=new Map<string,Promise<T>>()
 return {invalidate(){generation++;pending.clear()},run(key:string,operation:()=>Promise<T>,deliver:(v:T)=>void){
  const prior=pending.get(key);if(prior)return prior
  const g=generation;const p=Promise.resolve().then(operation).then(v=>{if(g===generation)deliver(v);return v}).finally(()=>{if(pending.get(key)===p)pending.delete(key)})
  pending.set(key,p);return p
 }}
}
