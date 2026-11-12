'use client'
import {useEffect,useRef,useState} from 'react'
import {supabase} from '@/lib/supabase'
import type {AdminLanguage} from './admin-contract'

type UserRow={id:string;email:string|null;confirmed:boolean;createdAt:string|null}
const markerKey='twuanis-owner-workspace-target-v1'
const copy={
 en:{loading:'Loading…',empty:'No registered customers were returned.',enter:'Enter Workspace',entering:'Opening Workspace…',next:'More customers',error:'Customer Workspace access could not be started.',notice:'You will use this customer’s existing Workspace and permissions. Return to Admin restores your Owner session.'},
 es:{loading:'Cargando…',empty:'No se devolvieron clientes registrados.',enter:'Entrar al Espacio de Trabajo',entering:'Abriendo Espacio de Trabajo…',next:'Más clientes',error:'No se pudo iniciar el acceso al Espacio de Trabajo del cliente.',notice:'Usará el Espacio de Trabajo y los permisos existentes de este cliente. Volver a Administración restaura su sesión de Propietario.'}
}
export default function AdminRegisteredUsers({language}:{language:AdminLanguage}){
 const t=copy[language], [users,setUsers]=useState<UserRow[]>([]),[next,setNext]=useState<number|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState('')
 const mounted=useRef(true)
 async function load(targetPage=1,append=false){
  setLoading(true);setMessage('')
  try{const response=await fetch('/api/admin/customer-workspace?page='+targetPage,{cache:'no-store'}),body=await response.json()
   if(!mounted.current)return
   if(!response.ok||!body.ok)throw Error()
   setUsers(existing=>append?[...existing,...body.users]:body.users);setNext(body.next)
  }catch{if(mounted.current)setMessage(t.error)}finally{if(mounted.current)setLoading(false)}
 }
 useEffect(()=>{mounted.current=true;void load();return()=>{mounted.current=false}},[])
 async function enter(target:UserRow){
  if(busy)return;setBusy(target.id);setMessage('')
  try{
   const response=await fetch('/api/admin/customer-workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetId:target.id})})
   const body=await response.json()
   if(!response.ok||!body.ok||body.target?.id!==target.id||typeof body.tokenHash!=='string')throw Error()
   const verified=await supabase.auth.verifyOtp({type:'magiclink',token_hash:body.tokenHash})
   if(verified.error||verified.data.user?.id!==target.id){await fetch('/api/admin/customer-workspace/recovery',{method:'POST'});throw Error()}
   sessionStorage.setItem(markerKey,JSON.stringify({id:target.id,email:target.email}))
   location.assign((language==='es'?'/es/centro-de-mercado':'/en/market-hub')+'?ownerSupport=1')
  }catch{if(mounted.current){setMessage(t.error);setBusy(null)}}
 }
 return <section className="admin-registered-users" aria-busy={loading||!!busy}>
  <p>{t.notice}</p>{message&&<p role="alert">{message}</p>}{loading&&<p role="status">{t.loading}</p>}
  {!loading&&!users.length&&!message&&<p>{t.empty}</p>}
  <ul>{users.map(user=><li key={user.id}><div><strong>{user.email??user.id}</strong><br/><code>{user.id}</code>{!user.confirmed&&<p>{language==='es'?'Correo sin confirmar':'Email not confirmed'}</p>}</div><button disabled={!!busy||!user.confirmed} onClick={()=>void enter(user)}>{busy===user.id?t.entering:t.enter}</button></li>)}</ul>
  {next&&<button disabled={loading||!!busy} onClick={()=>void load(next,true)}>{t.next}</button>}
  <style jsx>{`.admin-registered-users ul{padding:0;list-style:none}.admin-registered-users li{display:flex;gap:1rem;justify-content:space-between;align-items:center;padding:.75rem 0;border-bottom:1px solid var(--border);overflow-wrap:anywhere}.admin-registered-users code{font-size:.8em}.admin-registered-users button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:600px){.admin-registered-users li{align-items:flex-start;flex-direction:column}.admin-registered-users button{width:100%}}`}</style>
 </section>
}
