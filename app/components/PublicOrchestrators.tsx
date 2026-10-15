 'use client'
import {useEffect,useRef,useState} from 'react'
import OrchestratorWorkspace from './OrchestratorWorkspace'
import OrchestratorExample from './OrchestratorExample'
import type {OrchestratorIdentity} from '@/lib/execution-credit-contract'
import './orchestrator-presentation.css'
const valuation='orchestrator-markets-current-valuation-of-property',comparison='orchestrator-market-comparison'
export default function PublicOrchestrators({language}:{language:'en'|'es'}){
 const region=useRef<HTMLElement>(null)
 const [active,setActive]=useState<OrchestratorIdentity|null>(null),t=(en:string,es:string)=>language==='es'?es:en
 useEffect(()=>{const open=region.current?.querySelector<HTMLDetailsElement>(':scope > details[open]');if(open?.dataset.orchestrator)setActive(open.dataset.orchestrator as OrchestratorIdentity)},[])
 return <section ref={region} className="orchestrator-offerings" aria-label={t('Coordinated market intelligence','Inteligencia coordinada del mercado')}>
 {[valuation,comparison].map(id=><details key={id} data-orchestrator={id} onToggle={e=>{if(e.currentTarget.open)setActive(id as OrchestratorIdentity);else setActive(v=>v===id?null:v)}}>
 <summary>{id===valuation?t("Market’s Current Valuation of Property","Valoración actual de la propiedad según el mercado"):t('Market Comparison Orchestrator','Orquestador de comparación de mercados')}</summary>
 <p>{id===valuation?t('Seventeen existing engines · Package #3. Current asking-market evidence; not an appraisal or a predicted transaction price.','Diecisiete motores existentes · Paquete n.º 3. Evidencia de precios anunciados; no es un avalúo ni una predicción del precio de una transacción.'):t('Seven existing engines · Package #2 or #3. Compare the defined property market using the existing canonical evidence.','Siete motores existentes · Paquete n.º 2 o 3. Compare el mercado definido con la evidencia canónica existente.')}</p>
 <p>{t('Execution requires sign-in, the applicable Package and population authorization. One token per completed substantive report; rejected, failed or entirely undefined executions consume none.','La ejecución requiere iniciar sesión, el paquete aplicable y autorización de población. Un token por informe completado con resultados; las ejecuciones rechazadas, fallidas o totalmente indefinidas no consumen tokens.')}</p>
 <OrchestratorExample language={language} valuation={id===valuation}/>
 {active===id&&<OrchestratorWorkspace language={language} initialOrchestrator={id as OrchestratorIdentity}/>}
 </details>)}
 </section>
}
