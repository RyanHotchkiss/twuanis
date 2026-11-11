'use client'
import {useHubUniverse} from './HubUniverseContext'
import {resultSynthesis} from '@/lib/universal-result-synthesis'
import AnalyticalSynthesis from './AnalyticalSynthesis'
export default function ResultSynthesis({engine,evidence,language}:{engine:string;evidence:any;language:'en'|'es'}){
 const population=useHubUniverse()
 if(!population||population==='BANK')return null
 return <AnalyticalSynthesis>{resultSynthesis(engine,evidence,language,population)}</AnalyticalSynthesis>
}
