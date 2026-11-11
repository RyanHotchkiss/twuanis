import 'server-only'
import { parsePhoneNumberWithError } from 'libphonenumber-js/max'
export function normalizeAccountPhone(input:unknown,country:unknown):string{
 if(typeof input!=='string'||input.length>80||!['CR','international'].includes(String(country)))throw new Error('invalid')
 const value=input.trim()
 if(!/^[+\d\s().-]+$/.test(value))throw new Error('invalid')
 if(!value.startsWith('+')&&(country!=='CR'||value.replace(/\D/g,'').length!==8))throw new Error('invalid')
 const phone=parsePhoneNumberWithError(value,{defaultCountry:value.startsWith('+')?undefined:'CR',extract:false})
 if(!phone.isValid()||phone.ext)throw new Error('invalid')
 return phone.number
}
