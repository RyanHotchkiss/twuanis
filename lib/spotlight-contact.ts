import {parsePhoneNumberFromString} from 'libphonenumber-js/min'
import {listingHref} from './listing-route'
// Only public listing-contact responses are supplied here; no account data or default contact.
export function spotlightWhatsAppLink(value:unknown,id:string,transaction:'sale'|'rent',language:'en'|'es'){
 if(typeof value!=='string'||value.length>80||!/^\+?[\d\s().-]+$/.test(value))return undefined
 const digits=value.replace(/\D/g,'')
 if(!/^[1-9]\d{7,14}$/.test(digits))return undefined
 const phone=parsePhoneNumberFromString('+'+digits)
 if(!phone?.isValid()||phone.ext)return undefined
 const message=language==='es'?'Hola, me interesa su propiedad anunciada en Twuanis. ¿Podría brindarme más información?':"Hello, I'm interested in your property advertised on Twuanis. Could you provide more information?"
 return `https://wa.me/${phone.number.slice(1)}?text=${encodeURIComponent(message+'\nhttps://twuanis.com'+listingHref(id,transaction,language))}`
}
