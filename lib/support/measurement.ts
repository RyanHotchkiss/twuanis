import {context,emit,interactionKey,once} from '@/lib/measurement/runtime'
import {validSupportEvent,type SupportLocale,type SupportSelection,type SupportStage} from './contract'
export function trackSupport(l:SupportLocale,stage:SupportStage,selection:Partial<SupportSelection>={}){
 const values={stage,support_category:selection.category||'none',support_subject:selection.subject||'none',support_issue:selection.issue||'none'}
 if(!validSupportEvent(values))return false
 const payload={...context(l),...values}
 return stage==='opened'?once('tw_support_interaction',payload,'support-opened'):emit('tw_support_interaction',payload,'support:'+interactionKey())
}
