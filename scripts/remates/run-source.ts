/** Offline plan only. No HTTP, DB writes, credentials, autonomous worker or completeness claim. */
import {parseFixture,observationDraft} from '../../lib/remates/adapters/core'
import type {AdapterId,SourceFixture} from '../../lib/remates/adapters/contracts'
export function planSource(id:AdapterId,fixture:SourceFixture,run:string){
 const parsed=parseFixture(id,fixture);return {parsed,scope:'SAMPLE' as const,runOutcome:parsed.status==='FAILED'?'FAILED' as const:'PARTIAL' as const,commands:parsed.records.map(record=>{try{return {ok:true as const,evidence:observationDraft(parsed,record,fixture,run)}}catch{return {ok:false as const,sourceKey:record.sourceKey,reason:'UNRESOLVED_OR_UNSUPPORTED_EVIDENCE'}}}),retrievalEnabled:false as const,ingestionEnabled:false as const,publicationEnabled:false as const}
}
