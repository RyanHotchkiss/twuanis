import type {OntologyTerm} from './buildOntologyNode'
import {validateGeographicRow} from '@/lib/geography/dta-identity'
// Ontology edges remain internal evidence. Only independently verified physical containment maps here.
export function buildRelationshipNode(source:OntologyTerm,target:OntologyTerm,relationshipType:string,lang:'en'|'es'='en'){
 if(relationshipType!=='is_part_of')return null
 const parentType={canton:'province',district:'canton'} as Record<string,string>
 if(parentType[source.term_type]!==target.term_type)return null
 const s=source.slug_en||source.slug,t=target.slug_en||target.slug
 if(!s||!t||!/^[a-z0-9-]+$/.test(s)||!/^[a-z0-9-]+$/.test(t))return null
 try{
  const canonical=(v:OntologyTerm)=>({...v,id:String(v.id),parent_id:v.parent_id===null?null:String(v.parent_id),level:v.level})
  if((typeof source.id==='number'&&!Number.isSafeInteger(source.id))||(typeof target.id==='number'&&!Number.isSafeInteger(target.id)))return null
  const child=validateGeographicRow(canonical(source),source.term_type as 'canton'|'district')
  const parent=validateGeographicRow(canonical(target),target.term_type as 'province'|'canton')
  if(child.parentOntologyTermId!==parent.ontologyTermId||!child.officialCode.startsWith(parent.officialCode))return null
  return {'@type':'AdministrativeArea',identifier:child.officialCode,name:lang==='es'?source.term_name_es||source.term_name:source.term_name_en||source.term_name,containedInPlace:{'@type':'AdministrativeArea',identifier:parent.officialCode,name:lang==='es'?target.term_name_es||target.term_name:target.term_name_en||target.term_name}}
 }catch{return null}
}
