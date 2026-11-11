import 'server-only'
import {cache} from 'react'
import {createHash} from 'node:crypto'
import {supabaseAdmin} from '@/lib/supabase-admin'
import {readCollection,pagePath,packagesPath,previewEnabled,type Projection} from '@/lib/methodology-pages'
import {POPULATION_ENGINES} from '@/lib/population-engine-registry'
import {CATEGORIES,type Category,type Entry} from './core'
import {publicRootCategory} from './definitions'
import {terms,projectTerms,goodTerm,PREDICATES,type Term} from './terms'
export {readTermKnowledge,verifyTermKnowledgeRevision,readApprovedCanonicalEdges} from './terms'
type Package={id:string;name_en:string;name_es:string;question_en:string;question_es:string;capabilities:string[];termUnit:string;termQuantity:number;acquisitionAvailable:boolean}
const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex')
const names=(en:string,es:string)=>({en,es})
const ref=(p:Projection)=>p.explanationRevision
/** Request-scoped projection. No persistent index, no listing hydration, no engine execution. */
export const readKnowledge=cache(async()=>{
 const observedAt=new Date().toISOString();const state=Object.fromEntries(CATEGORIES.map(c=>[c,'AVAILABLE'])) as Record<Category,'AVAILABLE'|'UNAVAILABLE'>
 const [tr,pr]=await Promise.allSettled([terms(),supabaseAdmin.rpc('read_intelligence_package_catalog',{})]);let allTerms:Term[]=[];let packages:Package[]=[];let profiles:Projection[]=[]
 if(tr.status==='fulfilled')allTerms=tr.value;else for(const c of ['geography','classification','characteristics','relationships'] as Category[])state[c]='UNAVAILABLE'
 if(pr.status==='fulfilled'&&!pr.value.error&&Array.isArray(pr.value.data))packages=pr.value.data as Package[];else state.packages='UNAVAILABLE'
 try{profiles=readCollection()}catch{for(const c of ['methodologies','mathematics','populations'] as Category[])state[c]='UNAVAILABLE'}
 const {good,byId,entries,add}=projectTerms(allTerms)
 const en=profiles.filter(p=>p.locale==='en');for(const p of en){const es=profiles.find(v=>v.engineId===p.engineId&&v.locale==='es');if(!es)continue
  const base:Entry={key:'method:'+p.engineId,category:'methodologies',names:names(p.name,es.name),aliases:[p.engineId],definitions:names(p.question,es.question),authority:'Approved methodology explanation',version:ref(p),links:[]}
  if(previewEnabled())base.links.push({kind:'documentation',label:names('Algorithm Information Page','Página informativa del algoritmo'),href:{en:pagePath(p.engineId,'en'),es:pagePath(p.engineId,'es')}})
  base.sections=([{title:names('Supported interpretation','Interpretación sustentada'),text:p.supportedInterpretation,lang:'en'},{title:names('Supported interpretation','Interpretación sustentada'),text:es.supportedInterpretation,lang:'es'},{title:names('Limitations','Limitaciones'),text:p.unsupportedInterpretations.join('\n'),lang:'en'},{title:names('Limitations','Limitaciones'),text:es.unsupportedInterpretations.join('\n'),lang:'es'}]);add(base)
  add({key:'population:'+p.engineId,category:'populations',names:names('Population: '+p.name,'Población: '+es.name),aliases:[p.engineId],definitions:names(p.population.definition,es.population.definition),sections:[{title:names('Eligibility','Elegibilidad'),text:p.population.eligibility.join('\n'),lang:'en'},{title:names('Eligibility','Elegibilidad'),text:es.population.eligibility.join('\n'),lang:'es'},{title:names('Exclusions','Exclusiones'),text:p.population.exclusions.join('\n'),lang:'en'},{title:names('Exclusions','Exclusiones'),text:es.population.exclusions.join('\n'),lang:'es'}],authority:base.authority,version:ref(p),links:[{kind:'documentation',label:base.names,target:base.key}]})
  for(const f of p.formulas){const other=es.formulas.find(v=>v.id===f.id);if(!other)continue
   const key='math:'+p.engineId+':'+f.id;add({key,category:'mathematics',names:names(p.name+' · '+f.id,es.name+' · '+f.id),aliases:[f.id,...f.variables.flatMap(v=>[v.symbol,v.meaning,v.unit]),...other.variables.flatMap(v=>[v.meaning,v.unit])],definitions:names(f.statisticalMethod,other.statisticalMethod),sections:[{title:names('Equation','Ecuación'),text:f.equation,lang:'en'},{title:names('Limitations','Limitaciones'),text:p.unsupportedInterpretations.join('\n'),lang:'en'},{title:names('Limitations','Limitaciones'),text:es.unsupportedInterpretations.join('\n'),lang:'es'},...(['en','es'] as const).flatMap(l=>{const q=l==='en'?f:other;return [{title:names('Variables and units','Variables y unidades'),text:q.variables.map(v=>v.symbol+' — '+v.meaning+' ['+v.unit+']').join('\n'),lang:l},{title:names('Denominator, normalization and precision','Denominador, normalización y precisión'),text:[q.denominator,q.normalization,q.precisionAndRounding].join('\n'),lang:l}]})],authority:base.authority,version:ref(p),links:[{kind:'documentation',label:base.names,target:base.key},{kind:'documentation',label:names('Population, eligibility and exclusions','Población, elegibilidad y exclusiones'),target:'population:'+p.engineId}]});base.links.push({kind:'documentation',label:names('Mathematical definition: '+f.id,'Definición matemática: '+f.id),target:key})
  }
 }
 if(packages.length!==3||packages.some((p,i)=>!Array.isArray(p.capabilities)||p.capabilities.length!==[3,7,17][i]||!p.name_en||!p.name_es||!p.question_en||!p.question_es||p.termUnit!=='month'||p.termQuantity!==1)){packages=[];state.packages='UNAVAILABLE'}
 for(const p of packages){const key='package:'+p.id,e:Entry={key,category:'packages',names:names(p.name_en,p.name_es),aliases:[p.id],definitions:names(p.question_en,p.question_es),authority:'Current canonical Package catalog',version:'current',sections:[{title:names('Configured duration','Duración configurada'),text:String(p.termQuantity)+' '+p.termUnit,lang:'en'},{title:names('Configured duration','Duración configurada'),text:String(p.termQuantity)+' mes',lang:'es'}],links:[{kind:'commercial',label:names('Current Package information','Información actual de los Paquetes'),href:{en:packagesPath('en'),es:packagesPath('es')}}]};
  for(const id of p.capabilities){const engine=POPULATION_ENGINES.find(v=>v[3]===id),m=engine?entries.find(x=>x.key==='method:'+engine[0]):undefined;if(m){e.links.push({kind:'commercial',label:m.names,target:m.key});m.links.push({kind:'commercial',label:e.names,target:key})}}
  add(e)
 }
 return {entries,state,observedAt,terms:good,sourceFingerprint:digest(allTerms),byId,scope:{terms:allTerms.length,queryCount:2,listingQueries:0,engineExecutions:0},definitionDiagnostics:{verified:entries.filter(e=>e.termId&&e.key.startsWith('term:')&&e.definitionStatus==='VERIFIED_LOCAL').length,incomplete:entries.filter(e=>e.termId&&e.key.startsWith('term:')&&e.definitionStatus!=='VERIFIED_LOCAL').length}}
})
export async function canonicalRelationships(termId:string,edgePage:number,sourceFingerprint:string,direction:'outgoing'|'incoming'='outgoing'){
 if(!/^\d+$/.test(termId)||!Number.isSafeInteger(edgePage)||edgePage<1||edgePage>1000)throw Error('INVALID_REFERENCE')
 const start=(edgePage-1)*25
 const r=await supabaseAdmin.from('ontology_relationships').select('source_term_id::text,target_term_id::text,relationship_type',).in('relationship_type',PREDICATES).eq(direction==='outgoing'?'source_term_id':'target_term_id',termId).order('source_term_id').order('target_term_id').order('relationship_type').range(start,start+24)
 if(r.error||!Array.isArray(r.data)||r.data.length>25)throw Error('RELATIONSHIPS_UNAVAILABLE')
 const current=await terms();if(digest(current)!==sourceFingerprint)throw Error('SOURCE_CHANGED')
 const currentMap=new Map(current.map(t=>[t.id,t]));const permitted=new Set(current.filter(t=>goodTerm(t)&&(t.term_type!=='root'||publicRootCategory(t,currentMap)!==null)).map(t=>t.id));const rows=(r.data as unknown as {source_term_id:string;target_term_id:string;relationship_type:string}[]).filter(e=>permitted.has(e.source_term_id)&&permitted.has(e.target_term_id));return {rows,total:rows.length,hasMore:r.data.length===25}
}
