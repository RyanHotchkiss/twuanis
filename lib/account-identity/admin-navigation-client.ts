'use client'
import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase'
export function useAdminNavigation(){
 const [visible,setVisible]=useState(false)
 useEffect(()=>{
  let alive=true,sequence=0,current:string|null=null
  const update=(account:string|null)=>{
   setVisible(false);current=account;const seq=++sequence
   if(account)void fetch('/api/account/admin-navigation',{cache:'no-store'}).then(async r=>({ok:r.ok,value:await r.json()})).then(r=>{if(alive&&seq===sequence&&current===account)setVisible(r.ok&&r.value.visible===true)}).catch(()=>{})
  }
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>update(session?.user.id??null))
  const focus=()=>update(current)
  window.addEventListener('focus',focus)
  return()=>{alive=false;sequence++;subscription.unsubscribe();window.removeEventListener('focus',focus)}
 },[])
 return visible
}
