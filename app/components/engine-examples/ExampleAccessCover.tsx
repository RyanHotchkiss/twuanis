'use client'
import {useEffect,useRef,useState,type ReactNode} from 'react'
import {supabase} from '@/lib/supabase'
import {readExamplePresentationAccess} from '@/lib/example-presentation-access'
import {useHubUniverse} from '../HubUniverseContext'
import styles from './example-access-cover.module.css'

export default function ExampleAccessCover({engine,language,children}:{engine:string;language:'en'|'es';children:ReactNode}){
 const universe=useHubUniverse(),population=universe==='BANK'?'BANK':'PRIVATE'
 const identity=`${engine}:${population}`
 const [decision,setDecision]=useState<{identity:string;account:string|null;allowed:boolean}|null>(null)
 const actor=useRef<string|null|undefined>(undefined),generation=useRef(0)
 useEffect(()=>{
  let alive=true
  async function refresh(hide=false){
   const ticket=++generation.current
   if(hide)setDecision(null)
   try{const grant=await readExamplePresentationAccess(engine,population)
    if(alive&&ticket===generation.current)setDecision({identity,account:grant?.account??null,allowed:!!grant?.account&&grant.account===actor.current})
   }catch{if(alive&&ticket===generation.current)setDecision({identity,account:null,allowed:false})}
  }
  const subscription=supabase.auth.onAuthStateChange((_event,session)=>{
   const next=session?.user.id??null,changed=actor.current!==next
   actor.current=next
   if(changed){setDecision(null);queueMicrotask(()=>void refresh(true))}
  })
  const resume=()=>{if(document.visibilityState==='visible')void refresh()}
  void refresh(true)
  window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume)
  const interval=setInterval(resume,30000)
  return()=>{alive=false;generation.current++;clearInterval(interval);subscription.data.subscription.unsubscribe();window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume)}
 },[engine,population,identity])
 const pending=!decision||decision.identity!==identity
 const allowed=!pending&&decision.allowed&&decision.account===actor.current
 const covered=pending||allowed
 return <div className={styles.boundary} data-example-access={pending?'pending':allowed?'authorized':'discovery'} data-covered={covered||undefined}>
  <div className={covered?styles.hidden:undefined} inert={covered} aria-hidden={covered||undefined}>{children}</div>
  {covered&&<div className={allowed?styles.authorized:styles.pending} role="status">{pending?(language==='es'?'Comprobando acceso…':'Checking access…'):(language==='es'?'Ejecutar algoritmo para ver resultados':'Run Algorithm for Results')}</div>}
 </div>
}
