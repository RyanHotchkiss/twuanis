import 'server-only'
import { randomUUID } from 'node:crypto'
import { authorizePriceMeterIntelligenceExecution } from './price-meter-authorization'
import { supabaseAdmin } from './supabase-admin'
import { resolveDtaGeography } from './geography/resolve-dta-geography'
import { preparePhase14Question, phase14ReferenceTerms, establishPhase14Question, serializePhase14Question, Phase14QuestionError, type Phase14Question } from './phase14-question'

export type Phase14ExecutionEnvelope = Readonly<{
  question:Phase14Question
  canonicalQuestionSerialization:string
  authenticatedUserId:string
  entitlement:'price-m2-intelligence'
  executionId:string
}>
const envelopes=new WeakSet<object>()
// Server-internal function, not a Server Action. No client-supplied dependencies or authority.
export async function commitPhase14Question(input:unknown):Promise<Phase14ExecutionEnvelope> {
  const prepared=preparePhase14Question(input)
  const authenticatedUserId=await authorizePriceMeterIntelligenceExecution()
  const g=prepared.question.geography
  const resolved=await resolveDtaGeography({[g.level]:g.officialCode},async()=>supabaseAdmin)
  const ids=[...phase14ReferenceTerms(prepared).keys()],rows:Record<string,unknown>[]=[]
  // Narrow complete reference reads only. No listing, membership or hydration access.
  for (let offset=0;offset<ids.length;offset+=25) {
    const batch=ids.slice(offset,offset+25)
    const {data,error,count}=await supabaseAdmin.from('ontology_terms')
      .select('id::text,term_type,level,term_name',{count:'exact'})
      .in('id',batch).order('id').limit(batch.length+1)
    if (error) throw error
    if (!Array.isArray(data) || count!==batch.length || data.length!==batch.length || data.some(row=>!batch.includes(row.id))) throw new Phase14QuestionError()
    rows.push(...data)
  }
  const question=establishPhase14Question(prepared,resolved,rows)
  const envelope=Object.freeze({question,canonicalQuestionSerialization:serializePhase14Question(question),authenticatedUserId,entitlement:'price-m2-intelligence' as const,executionId:randomUUID()})
  envelopes.add(envelope);return envelope
}
export function assertPhase14ExecutionEnvelope(value:Phase14ExecutionEnvelope):void {
  if (!envelopes.has(value)) throw new Phase14QuestionError()
}
