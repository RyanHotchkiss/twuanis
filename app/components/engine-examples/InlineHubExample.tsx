'use client'
import {lazy,Suspense,useEffect,useState} from 'react'
import ExampleAccessCover from './ExampleAccessCover'
import {loadExample,type PublicExample} from './registry'
import type {Lens,Lang} from '@/lib/lpi-contract'
import styles from './inline-example.module.css'
import reportStyles from './examples.module.css'
const ExampleReport=lazy(()=>import('./ExampleReport'))
const engines={asking:'asking-price',matching:'matching',frequency:'scarcity',position:'position'} as const
// The Hub's exact public artifact and report; no analytical execution or new example data.
export default function InlineHubExample({lens,language}:{lens:Lens;language:Lang}){
 const [artifact,setArtifact]=useState<PublicExample|null>(null),[failed,setFailed]=useState(false)
 useEffect(()=>{const controller=new AbortController();setArtifact(null);setFailed(false);void loadExample(engines[lens],controller.signal).then(value=>{if(!controller.signal.aborted)setArtifact(value)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});return()=>controller.abort()},[lens])
 return <ExampleAccessCover engine={engines[lens]} language={language}><div className={styles.example} data-inline-hub-example={lens} aria-label={language==='es'?'Ejemplo conservado de Intelligence Hub':'Frozen Intelligence Hub example'}>
  <div className={`${styles.content} ${reportStyles.body}`} data-example-content>{artifact?<Suspense fallback={<p role="status">{language==='es'?'Cargando ejemplo…':'Loading example…'}</p>}><ExampleReport artifact={artifact} language={language}/></Suspense>:<p role={failed?'alert':'status'}>{language==='es'?(failed?'El ejemplo no está disponible.':'Cargando ejemplo…'):(failed?'The example is unavailable.':'Loading example…')}</p>}</div>
  <div className={styles.watermark} aria-hidden="true" data-example-watermark><span>EXAMPLE</span></div>
 </div></ExampleAccessCover>
}
