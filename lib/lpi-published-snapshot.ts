import 'server-only'
import {createHash} from 'node:crypto'
// Fingerprint only the already-public, coherently hydrated subject. Never expose
// the private revision field or add an on-load analytical/database acquisition.
export function publishedListingSnapshot(row:unknown):string{
 function canonical(value:any):any{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value}
 return createHash('sha256').update(JSON.stringify(canonical(row))).digest('hex')
}
