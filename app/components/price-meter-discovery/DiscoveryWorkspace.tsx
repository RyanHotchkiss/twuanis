'use client'
import {useEffect,useState} from 'react'
import {restoreDiscoveryDraft} from '@/lib/discovery-hub-action'
import {measuredDiscovery} from '@/lib/measurement/actions'
import {serverSignal} from '@/lib/measurement/runtime'
import {commitConfiguration} from '@/lib/measurement/analytical'
import type {Phase14ApplicationRequest,Phase14ApplicationResponse} from '@/lib/comparative-discovery-contract'
import ComparativeDiscoveryAccess from '../ComparativeDiscoveryAccess'
import Phase14Discovery from '../Phase14Discovery'
import EvidenceNotes from './DiscoveryEvidenceNotes'
import AnalysisActions from '../AnalysisActions'
export const discoveryTitle={en:'Comparative Price / m² Discovery',es:'Descubrimiento comparativo de precio / m²'}
export const discoveryQuestion={en:'Where does each eligible listing sit within the defined market’s Price / m² distribution?',es:'¿Dónde se sitúa cada anuncio elegible dentro de la distribución del precio por m² del mercado definido?'}

export default function DiscoveryWorkspace({language,serialized,previewOnly=false}:{language:'en'|'es';serialized?:string;previewOnly?:boolean}){
 const [initial,setInitial]=useState<Phase14ApplicationRequest>(),[restoring,setRestoring]=useState(!!serialized),[invalid,setInvalid]=useState(false)
 useEffect(()=>{let live=true;setInvalid(false);setRestoring(!!serialized);setInitial(undefined)
 if(serialized)restoreDiscoveryDraft(serialized).then(v=>{if(live){setInitial(v??undefined);setInvalid(!v);setRestoring(false)}}).catch(()=>{if(live){setInvalid(true);setRestoring(false)}})
 return()=>{live=false}},[serialized])
 return <ComparativeDiscoveryAccess language={language} previewOnly={previewOnly}>
 {restoring?<p role="status">{language==='es'?'Restaurando la pregunta…':'Restoring question…'}</p>:<>
 {invalid&&<p role="alert">{language==='es'?'No se pudo restaurar la pregunta guardada. Define una nueva pregunta.':'The saved question could not be restored. Define a new question.'}</p>}
 <Phase14Discovery previewOnly={previewOnly} key={serialized??'new'} language={language} hub initialRequest={initial} execute={input=>{commitConfiguration('discovery',language,'sd60ba79a6b33ffb9ed9916978501d7b0860b5b6415b66b5abe02e1fdc9b657cd');return measuredDiscovery(input,serverSignal(language))}} footer={(input,response)=><>
 <EvidenceNotes response={response} language={language}/>
 <AnalysisActions engineType="price-meter" language={language} filters={{analysis_question:'discovery',discovery_request:JSON.stringify(input)}} result={response} defaultName={discoveryTitle[language]}/>
 </>}/>
 </>}
 </ComparativeDiscoveryAccess>
}
