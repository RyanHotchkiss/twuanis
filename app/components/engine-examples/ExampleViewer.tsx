'use client'
import ExampleAccessCover from './ExampleAccessCover'
import {algorithmInterest} from '@/lib/measurement/analytical'
import {analyticalTerminology} from '@/lib/analytical-terminology'
import {lazy,Suspense,useEffect,useId,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {exampleRelease,loadExample,type PublicExample} from './registry'
import styles from './examples.module.css'
const ExampleReport=lazy(()=>import('./ExampleReport'))
export default function ExampleViewer({engine,engineName,language,textLink=false,compactLabel=false,onOpenChange}:{engine:string;engineName:string;language:'en'|'es';textLink?:boolean;compactLabel?:boolean;onOpenChange?:(open:boolean)=>void}){
 const [ready,setReady]=useState(false),[open,setOpen]=useState(false),[artifact,setArtifact]=useState<PublicExample|null>(null),[failed,setFailed]=useState(false)
 const trigger=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),onOpenChangeRef=useRef(onOpenChange),id=useId(),es=language==='es'
 useEffect(()=>setReady(true),[])
 useEffect(()=>{onOpenChangeRef.current=onOpenChange},[onOpenChange])
 useEffect(()=>{if(!open)return;onOpenChangeRef.current?.(true);return()=>onOpenChangeRef.current?.(false)},[open])
 useEffect(()=>{
  if(!open)return
  const controller=new AbortController(),previous=document.body.style.overflow
  document.body.style.overflow='hidden';dialog.current?.showModal()
  setArtifact(null);setFailed(false)
  void loadExample(engine,controller.signal).then(value=>{if(!controller.signal.aborted)setArtifact(value)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)})
  return()=>{controller.abort();dialog.current?.close();document.body.style.overflow=previous;trigger.current?.focus()}
 },[open,engine])
 if(!exampleRelease(engine))return null
 const title=es?`Ver ejemplo de ejecución de ${engineName}`:`See Example Run of ${engineName}`
 return <><button type="button" className={textLink?styles.textLink:styles.trigger} ref={trigger} disabled={!ready} onClick={()=>{algorithmInterest(engine,language,'example_open');setOpen(true)}}>{textLink?analyticalTerminology(engineName):compactLabel?(es?'Ver ejemplo':'See Example'):title}</button>{open&&createPortal(<dialog className={styles.dialog} ref={dialog} aria-labelledby={id} onKeyDown={event=>{
   if(event.key!=='Tab')return
   const nodes=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],summary,[tabindex="0"]')).filter(node=>node.getClientRects().length>0),first=nodes[0],last=nodes[nodes.length-1]
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }} onCancel={event=>{event.preventDefault();setOpen(false)}}>
  <header className={styles.header}><h2 id={id}>{title}</h2><button type="button" autoFocus onClick={()=>setOpen(false)}>{es?'Cerrar':'Close'}</button></header>
  <div className={styles.body} tabIndex={0} aria-busy={!artifact&&!failed}>{failed?<p role="alert">{es?'El ejemplo no está disponible. Puedes cerrar esta ventana y explorar el paquete.':'The example is unavailable. You can close this window and explore the Package.'}</p>:artifact?<Suspense fallback={<p role="status">{es?'Cargando ejemplo…':'Loading example…'}</p>}><ExampleAccessCover engine={engine} language={language}><ExampleReport artifact={artifact} language={language}/></ExampleAccessCover></Suspense>:<p role="status">{es?'Cargando ejemplo…':'Loading example…'}</p>}</div>
 </dialog>,document.body)}</>
}
