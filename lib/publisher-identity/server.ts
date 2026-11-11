import 'server-only'
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {assertOwner} from '@/lib/administrative-control'
import {POPULATION_ENGINES} from '@/lib/population-engine-registry'
import {readCollection} from '@/lib/methodology-pages'
import history from './pending-history.json'
import anchor from './pending-anchor.json'
import {validateHistory,publicEngineIdentity,type Authority} from './validation'

/** Current source and approved explanations are consumed, never redefined here. No persistent cache. */
function sourceAuthority():Authority{
 const hashFile=(relative:string)=>createHash('sha256').update(readFileSync(path.join(process.cwd(),relative))).digest('hex')
 const projections=readCollection()
 const engines=new Map(POPULATION_ENGINES.map(([key])=>{
  const pair=projections.filter(p=>p.engineId===key),en=pair.find(p=>p.locale==='en'),es=pair.find(p=>p.locale==='es')
  if(pair.length!==2||!en||!es||en.explanationRevision!==es.explanationRevision||en.historicalReleaseReference!==es.historicalReleaseReference)throw Error('Publisher identity validation unavailable')
  return [key,{sourceRevision:en.historicalReleaseReference,representationRevision:en.explanationRevision,jurisdiction:null}] as const
 }))
 return {registryDigest:hashFile('lib/population-engine-registry.ts'),representationManifestDigest:hashFile('lib/methodology-content/manifest.json'),engines}
}
/** Owner-only non-mutating review. No Server Action, HTTP route, issuer, promotion or new permission. */
export async function reviewPendingPublisherManifest(){
 await assertOwner()
 try{
  const result=validateHistory(history,sourceAuthority(),{keys:new Map()},anchor)
  return {status:'PENDING' as const,engineCount:result.manifest.entries.length,publicationEligible:false as const,issuanceAvailable:false as const,promotionAvailable:false as const}
 }catch{throw Error('Publisher identity review unavailable')}
}
/** Future consumers receive no pending identifiers or protected binding records. */
export function getPublicEngineIdentity(canonicalKey:string,locale:'en'|'es'):null{return publicEngineIdentity(canonicalKey,locale)}
