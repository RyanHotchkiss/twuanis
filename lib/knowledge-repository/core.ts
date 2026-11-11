import 'server-only'
export type Locale='en'|'es'
export const CATEGORIES=['geography','classification','characteristics','methodologies','mathematics','populations','packages','relationships'] as const
export type Category=typeof CATEGORIES[number]
export type Entry={key:string;category:Category;names:Record<Locale,string>;aliases:string[];definitions:Record<Locale,string|null>;sourceText?:string;sections?:{title:Record<Locale,string>;text:string;lang:Locale}[];authority:string;version:string;links:{kind:'canonical'|'documentation'|'navigation'|'commercial';label:Record<Locale,string>;target?:string;href?:Record<Locale,string>}[];termId?:string;definitionStatus?:'VERIFIED_LOCAL'|'INCOMPLETE'|'SOURCE_MISMATCH'|'BLOCKED'|'NAVIGATION_VIEW'}
export const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/g,' ').trim()
export function parseQuery(input:Record<string,string|string[]|undefined>){
 const one=(key:string)=>{const v=input[key];if(Array.isArray(v))throw Error('INVALID_QUERY');return v||''}
 const q=one('q'),category=one('category'),entry=one('entry'),view=one('view'),rawPage=one('page')||'1',rawEdges=one('edges')||'1',direction=one('direction')||'outgoing'
 if(!['outgoing','incoming'].includes(direction)||q.length>120||/[\u0000-\u001f\u007f]/.test(q)||category&&!CATEGORIES.includes(category as Category)||entry.length>240||view&&!['glossary','index'].includes(view)||!/^\d{1,4}$/.test(rawPage)||+rawPage<1||+rawPage>1000||!/^\d{1,4}$/.test(rawEdges)||+rawEdges<1||+rawEdges>1000)throw Error('INVALID_QUERY')
 return {q,category:category as Category|'',entry,view: view||'index',page:+rawPage,edgePage:+rawEdges,direction:direction as 'outgoing'|'incoming'}
}
/** A presentation selection over the same governed corpus, never another authority. */
export function entriesForView(entries:Entry[],view:string){
 if(view!=='glossary')return entries
 return entries.filter(e=>e.definitionStatus!=='NAVIGATION_VIEW'&&!e.key.startsWith('relations:')&&!e.key.startsWith('term:root:')
  &&(e.definitionStatus===undefined||e.definitionStatus==='VERIFIED_LOCAL')
  &&typeof e.definitions.en==='string'&&!!e.definitions.en.trim()&&typeof e.definitions.es==='string'&&!!e.definitions.es.trim())
}
export function search(entries:Entry[],query:ReturnType<typeof parseQuery>,locale:Locale){
 const q=normalize(query.q),tokens=q.split(' ').filter(Boolean)
 const scored=entriesForView(entries,query.view).filter(e=>!query.category||e.category===query.category).map(e=>{
  const labels=[e.names.en,e.names.es,...e.aliases].map(normalize),body=normalize([e.definitions.en||'',e.definitions.es||''].join(' '))
  const exact=labels.includes(q),starts=labels.some(l=>l.startsWith(q)),matches=tokens.every(t=>labels.some(l=>l.includes(t))||body.includes(t))
  return {e,score:exact?0:starts?1:2,matches:!q||matches}
 }).filter(r=>r.matches).sort((a,b)=>a.score-b.score||normalize(a.e.names[locale]).localeCompare(normalize(b.e.names[locale]),'en')||a.e.key.localeCompare(b.e.key,'en'))
 const pageSize=20,total=scored.length;return {items:scored.slice((query.page-1)*pageSize,query.page*pageSize).map(r=>r.e),total,page:query.page,pages:Math.max(1,Math.ceil(total/pageSize)),pageSize}
}
export const root=(l:Locale)=>l==='en'?'/en/knowledge':'/es/conocimiento'
export function href(l:Locale,values:Record<string,string|number|undefined>={}){const q=new URLSearchParams();for(const [k,v] of Object.entries(values))if(v!==undefined&&v!=='')q.set(k,String(v));return root(l)+(q.size?'?'+q.toString():'')}
