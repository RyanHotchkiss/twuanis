import taxonomy from './taxonomy.json'
export type SupportLocale='en'|'es'
export const supportTaxonomy=taxonomy
export const SUPPORT_DESTINATION='https://wa.me/50687945363'
export const supportPath=(l:SupportLocale)=>l==='es'?'/es/soporte':'/en/support'
export type SupportSelection={category:string;subject:string;issue:string}
export type SupportStage='opened'|'category'|'subject'|'issue'|'whatsapp_opened'
export const supportStages=['opened','category','subject','issue','whatsapp_opened'] as const
export function selectionNodes(v:SupportSelection){const category=taxonomy.find(c=>c.id===v.category),subject=category?.subjects.find(s=>s.id===v.subject),issue=subject?.issues.find(i=>i.id===v.issue);return {category,subject,issue}}
export function validSupportSelection(v:SupportSelection){const n=selectionNodes(v);return !!(n.category&&n.subject&&n.issue)}
export function validSupportEvent(v:{stage:unknown;support_category:unknown;support_subject:unknown;support_issue:unknown}){
 if(!supportStages.includes(v.stage as SupportStage)||![v.support_category,v.support_subject,v.support_issue].every(x=>typeof x==='string'))return false
 const {category,subject,issue}=selectionNodes({category:String(v.support_category),subject:String(v.support_subject),issue:String(v.support_issue)})
 return v.stage==='opened'?v.support_category==='none'&&v.support_subject==='none'&&v.support_issue==='none':v.stage==='category'?!!category&&v.support_subject==='none'&&v.support_issue==='none':v.stage==='subject'?!!category&&!!subject&&v.support_issue==='none':!!category&&!!subject&&!!issue
}
export function supportEvidence(v:{stage:string;support_category:string;support_subject:string;support_issue:string}){return ['support',v.stage,v.support_category,v.support_subject,v.support_issue].join('.')}
export function supportMessage(l:SupportLocale,id:string,v:SupportSelection,message:string){
 if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)||!validSupportSelection(v)||!message.trim()||message.length>1500)throw Error('invalid_support_request')
 const n=selectionNodes(v),es=l==='es'
 return [es?'SOPORTE TWUANIS':'TWUANIS SUPPORT','',(es?'UUID del cliente: ':'Customer UUID: ')+id,'',[es?'Soporte':'Support',n.category!.label[l],n.subject!.label[l],n.issue!.label[l]].join(' > '),'',es?'Mensaje del cliente:':'Customer message:',message.trim()].join('\n')
}
export const supportWhatsAppUrl=(l:SupportLocale,id:string,v:SupportSelection,message:string)=>SUPPORT_DESTINATION+'?text='+encodeURIComponent(supportMessage(l,id,v,message))

/** Support-only evidence uses the same controlled taxonomy at client and server ingestion. */
export function validSupportEvidence(value:string){
 const parts=value.split('.')
 return parts.length===5&&parts[0]==='support'&&validSupportEvent({stage:parts[1],support_category:parts[2],support_subject:parts[3],support_issue:parts[4]})
}
