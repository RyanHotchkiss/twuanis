import 'server-only'
import {headers} from 'next/headers'
import {createHash} from 'node:crypto'
import {isIP} from 'node:net'
// Owner-supplied exclusion for this release. The address is never returned or logged.
const approvedDigest='d063566459802be9aab768db1b8793856920589dfbfe51ef6129759ee8fbfd7c'
export function sourceMeasurementEligibility(value:string|null,trusted:boolean):'eligible'|'excluded'|'unknown'{
 if(!trusted)return 'unknown'
 if(!value||value.includes(','))return 'unknown'
 const ip=value.trim().toLowerCase().replace(/^::ffff:(?=\d+\.)/,'')
 if(!isIP(ip))return 'unknown'
 return createHash('sha256').update(ip).digest('hex')===approvedDigest?'excluded':'eligible'
}
export async function requestMeasurementEligibility():Promise<'eligible'|'excluded'|'unknown'>{
 if(process.env.VERCEL!=='1')return 'eligible'
 try{return sourceMeasurementEligibility((await headers()).get('x-vercel-forwarded-for'),true)}catch{return 'unknown'}
}
