import 'server-only'
import {customerEmailConfiguration} from '@/lib/customer-email/delivery'
import type {CustomerEmailEnvelope} from '@/lib/customer-email/templates'
import {sendCustomerTransactionalEmail} from '@/lib/email'
import {listingHref} from '@/lib/listing-route'
// Preparation only. Existing workers may use this transport after separate activation.
export const savedSearchEmailTransport=sendCustomerTransactionalEmail
export type SavedSearchEmailInput={
 delivery:{id:string;saved_search_id:string;listing_id:string;user_id:string;delivery_channel:string|null;delivery_status:string}
 search:{id:string;user_id:string;alerts_enabled:boolean;alert_frequency:string|null;language:string}
 listing:{id:string;listing_status:string;transaction_type:string;title:string}
 account:{id:string;email:string;emailConfirmed:boolean;language:'en'|'es'|null}
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
export function prepareSavedSearchEmail(input:SavedSearchEmailInput,env:Record<string,string|undefined>=process.env):{deliveryId:string;idempotencyKey:string;envelope:CustomerEmailEnvelope}|null{
 const config=customerEmailConfiguration(env);if(!config)return null
 const {delivery:d,search:s,listing:l,account:a}=input
 // A general saved-search alert toggle is NOT explicit email consent.
 if(d.delivery_channel!=='email'||d.delivery_status!=='pending'||!s.alerts_enabled||!['daily','weekly'].includes(s.alert_frequency??'')||!a.emailConfirmed||d.saved_search_id!==s.id||d.listing_id!==l.id||d.user_id!==a.id||s.user_id!==a.id||l.listing_status!=='active'||!['sale','rent'].includes(l.transaction_type)||/[\r\n]/.test(a.email))return null
 const language=a.language??(s.language==='en'?'en':'es'),es=language==='es'
 const title=es?'Nueva propiedad encontrada':'New property found',description=es?'Una nueva propiedad coincide con su búsqueda guardada.':'A new property matches your saved search.'
 const url='https://twuanis.com'+listingHref(l.id,l.transaction_type==='sale'?'sale':'rent',language)
 return {deliveryId:d.id,idempotencyKey:'saved-search-delivery-'+d.id,envelope:{...config,to:a.email,subject:'Twuanis — '+title,text:[title,description,l.title,url].join('\n\n'),html:`<h1>${escape(title)}</h1><p>${escape(description)}</p><p>${escape(l.title)}</p><a href="${escape(url)}">${es?'Ver anuncio':'View listing'}</a>`}}
}
