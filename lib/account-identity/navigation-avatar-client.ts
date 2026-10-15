 'use client'
import {useEffect,useState} from 'react'
import {supabase} from '@/lib/supabase'
type Avatar={url:string|null;expires:number}
let cached:{account:string;value:Avatar}|null=null
let pending:{account:string;epoch:number;promise:Promise<Avatar>}|null=null
let epoch=0
let activeAccount:string|null=null
function invalidate(){epoch++;cached=null;pending=null}
async function read(account:string):Promise<Avatar>{
 if(cached?.account===account&&cached.value.expires>Date.now())return cached.value
 if(pending?.account===account&&pending.epoch===epoch)return pending.promise
 const version=epoch
 const promise=(async()=>{
  const response=await fetch('/api/account/avatar',{cache:'no-store'})
  const body=await response.json()
  const value={url:response.ok&&body.ok&&typeof body.url==='string'?body.url:null,expires:Date.now()+240_000}
  if(version===epoch)cached={account,value}
  return value
 })().finally(()=>{if(pending?.promise===promise)pending=null})
 pending={account,epoch:version,promise}
 return promise
}
export function useNavigationAvatar(){
 const [avatar,setAvatar]=useState<{account:string;url:string|null}|null>(null)
 const [account,setAccount]=useState<string|null>(null)
 useEffect(()=>{
  let alive=true,sequence=0,current:string|null=null
  const update=(id:string|null,force=false)=>{
   if(!alive)return
   if(id!==current||force)setAvatar(null)
   if(id!==activeAccount||force){invalidate();activeAccount=id}
   current=id;setAccount(id);const seq=++sequence
   if(id)void read(id).then(v=>{if(alive&&sequence===seq&&current===id)setAvatar({account:id,url:v.url})}).catch(()=>{if(alive&&sequence===seq)setAvatar(null)})
   else setAvatar(null)
  }
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>update(session?.user.id??null))
  const changed=()=>update(current,true)
  const focused=()=>update(current)
  window.addEventListener('account-profile-image-changed',changed)
  window.addEventListener('focus',focused)
  return()=>{alive=false;sequence++;subscription.unsubscribe();window.removeEventListener('account-profile-image-changed',changed);window.removeEventListener('focus',focused)}
 },[])
 return avatar?.account===account?avatar.url:null
}
