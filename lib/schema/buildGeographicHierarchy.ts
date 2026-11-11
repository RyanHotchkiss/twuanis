import type {OntologyTerm} from './buildOntologyNode'
import {placeId} from './buildPlaceNode'
import {validateGeographicRow} from '@/lib/geography/dta-identity'
/** Exact physical geography with the existing issued, language-neutral place IDs. */
export function buildGeographicHierarchy(terms:(Omit<OntologyTerm,'slug'> & {slug?:string|null})[],lang:'en'|'es'){
 const accepted=new Map<string,Record<string,unknown>>()
 for(const type of ['province','canton','district'])for(const t of terms.filter(t=>t.term_type===type)){
  if((typeof t.id==='number'&&!Number.isSafeInteger(t.id))||(typeof t.parent_id==='number'&&!Number.isSafeInteger(t.parent_id)))continue
  try{
   const slug=t.slug_en||t.slug
   if(!slug||!/^[a-z0-9-]+$/.test(slug))continue
   const geo=validateGeographicRow({...t,id:String(t.id),parent_id:t.parent_id===null?null:String(t.parent_id)},type as 'province'|'canton'|'district')
   const parent=type==='province'?{'@id':'https://twuanis.com/id/country/costa-rica'}:accepted.get(String(t.parent_id))
   if(!parent)continue
   if(type!=='province'&&!geo.officialCode.startsWith(String(parent.identifier)))continue
   accepted.set(String(t.id),{'@type':'AdministrativeArea','@id':placeId(type,slug),identifier:geo.officialCode,name:lang==='es'?t.term_name_es||t.term_name:t.term_name_en||t.term_name,containedInPlace:{'@id':parent['@id']}})
  }catch{/* Unverified facts cannot produce a guessed place or containment. */}
 }
 return accepted
}
