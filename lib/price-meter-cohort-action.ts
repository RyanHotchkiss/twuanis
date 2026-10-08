'use server'
import {authorizePriceMeterIntelligenceExecution} from '@/lib/price-meter-authorization'
import {getExplorerOptions} from '@/lib/explorer-options-engine'
import {parsePriceMeterComparisonRequest} from '@/lib/price-meter-comparison-request-parser'
import {issuePriceMeterComparisonPermit} from '@/lib/price-meter-comparison-permit'
import {getPriceMeterComparisonAnalysis} from '@/lib/price-meter-comparison-engine'
import {comparisonKeys} from '@/app/components/price-meter-comparison/contract'
import type {CohortResult,Label} from '@/app/components/price-meter-comparison/contract'

export async function executePriceMeterCohortComparison(input:unknown,language:'en'|'es'):Promise<CohortResult|{invalidRequest:true;message:string}>{
 await authorizePriceMeterIntelligenceExecution('cap-user-defined-cohort-price-m2-comparison')
 if((language!=='en'&&language!=='es')||!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid comparison request.')
 const params:Record<string,string|undefined>={}
 for(const [key,value]of Object.entries(input)){
  if(!comparisonKeys.includes(key)||typeof value!=='string')throw Error('Invalid comparison input.')
  params[key]=value
 }
 const options=await getExplorerOptions()
 let request:ReturnType<typeof parsePriceMeterComparisonRequest>
 try { request=parsePriceMeterComparisonRequest({params,options}) }
 catch (error) {
  const reason=error instanceof Error?error.message:''
  const es=language==='es'
  const message=reason.includes('duplicate_characteristic')
   ?(es?'Las dos características de cada cohorte deben ser distintas.':'The two characteristics within each cohort must be distinct.')
   :reason.includes('area_constraint')||reason.includes('area_range')
   ?(es?'Cada cohorte requiere al menos una restricción de área válida.':'Each cohort requires at least one valid area constraint.')
   :reason.includes('Vacant Land')
   ?(es?'El terreno vacío no admite normalización por área de construcción.':'Vacant Land cannot use construction normalization.')
   :reason.includes('reference')
   ?(es?'Selecciona explícitamente A o B como referencia porcentual.':'Explicitly select A or B as the percentage reference.')
   :reason.includes('geography')||reason.includes('canonical')
   ?(es?'No se pudo resolver una identidad canónica seleccionada o su jerarquía. Revisa ambas cohortes.':'A selected canonical identity or hierarchy could not be resolved. Check both cohorts.')
   :(es?'Completa la identidad compartida y ambas cohortes con dos características distintas y restricciones válidas.':'Complete the shared identity and both cohorts with two distinct characteristics and valid constraints.')
  return {invalidRequest:true,message}
 }
 const analysis=await getPriceMeterComparisonAnalysis({request,language,permit:issuePriceMeterComparisonPermit(request,language)})
 function geography(prefix:'a'|'b'):Label[]{return (['province','canton','district'] as const).flatMap(type=>{
  const value=params[`${prefix}_${type}`];if(!value)return []
  const term=options[type].find(o=>[o.official_code,o.slug,o.slug_en,o.slug_es].includes(value))!
  return [{id:term.id,term_name:term.term_name,term_name_en:term.term_name_en,term_name_es:term.term_name_es}]
 })}
 // Explicit aggregate allowlist. Never serialize comparison populations or distribution arrays.
 return {request:analysis.request,analyticalIdentity:analysis.analyticalIdentity,
  fx:analysis.fxIdentity,
  geography:{A:geography('a'),B:geography('b')},
  evidence:analysis.comparison.evidence,medianDifference:analysis.comparison.medianDifference}
}
