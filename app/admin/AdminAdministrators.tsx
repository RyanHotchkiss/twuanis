'use client'
import {useEffect,useRef,useState} from 'react'
import {supabase} from '@/lib/supabase'
import type {AdminLanguage} from './admin-contract'
type Account={id:string;email:string|null;confirmed:boolean;active:boolean;owner:boolean;topAdministrator:boolean;permissions:string[]}
type Audit={id:string;actorId:string|null;targetId:string|null;operation:string;at:string;result:string;beforePermissions:string[]|null;afterPermissions:string[]|null}
type Evidence={target:Account|null;administrators:Account[];events:Audit[];permissions:string[]}
type Command={requestId:string;targetId:string;operation:string;permission?:string;reason:string}
const copy={
 en:{search:'Find an existing account',hint:'Enter the exact email address or account UUID. Only confirmed accounts can be activated.',lookup:'Email or account UUID',find:'Find account',roster:'Administrative accounts',more:'Next page',first:'First page',none:'No account found.',confirmed:'Email confirmed',unconfirmed:'Email not confirmed — activation unavailable',active:'Active Administrator',inactive:'Inactive Administrator',owner:'Owner — protected',top:'Top Administrator — protected',activate:'Activate Administrator',deactivate:'Deactivate Administrator',permissions:'Workspace permissions',grant:'Grant',revoke:'Revoke',reason:'Reason for this change',confirm:'Confirm change',cancel:'Cancel',audit:'Administrative audit',empty:'No recorded changes.',older:'Older changes',latest:'Latest changes',loading:'Loading…',error:'The request could not be confirmed. Retry the same change safely or reload the evidence.',denied:'Owner access is required.',success:'Change confirmed and recorded.',note:'Activation does not grant workspace permissions. Protected authority cannot be deactivated here.',noGrant:'No workspace permissions granted.',refresh:'Refresh evidence',retry:'Retry the same change',succeeded:'Succeeded',denial:'Denied'},
 es:{search:'Buscar una cuenta existente',hint:'Ingrese el correo exacto o el UUID de la cuenta. Solo pueden activarse cuentas con correo confirmado.',lookup:'Correo o UUID de la cuenta',find:'Buscar cuenta',roster:'Cuentas administrativas',more:'Página siguiente',first:'Primera página',none:'No se encontró la cuenta.',confirmed:'Correo confirmado',unconfirmed:'Correo no confirmado — activación no disponible',active:'Administrador activo',inactive:'Administrador inactivo',owner:'Propietario — protegido',top:'Administrador principal — protegido',activate:'Activar administrador',deactivate:'Desactivar administrador',permissions:'Permisos por espacio de trabajo',grant:'Otorgar',revoke:'Revocar',reason:'Motivo del cambio',confirm:'Confirmar cambio',cancel:'Cancelar',audit:'Auditoría administrativa',empty:'No hay cambios registrados.',older:'Cambios anteriores',latest:'Cambios recientes',loading:'Cargando…',error:'No se pudo confirmar la solicitud. Reintente el mismo cambio de forma segura o vuelva a cargar la información.',denied:'Se requiere acceso de Propietario.',success:'Cambio confirmado y registrado.',note:'La activación no otorga permisos. Las autoridades protegidas no pueden desactivarse aquí.',noGrant:'No se han otorgado permisos.',refresh:'Actualizar información',retry:'Reintentar el mismo cambio',succeeded:'Exitoso',denial:'Denegado'}
}
export default function AdminAdministrators({language}:{language:AdminLanguage}){
 const t=copy[language], [lookup,setLookup]=useState(''),[query,setQuery]=useState(''),[data,setData]=useState<Evidence|null>(null),[after,setAfter]=useState<string|null>(null),[before,setBefore]=useState<string|null>(null)
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[reason,setReason]=useState(''),[pending,setPending]=useState<Command|null>(null),[retry,setRetry]=useState<Command|null>(null)
 const serial=useRef(0),mounted=useRef(true),mutating=useRef(false)
 const selected=data?.target
 async function load(q=query,a=after,b=before){
  const id=++serial.current;setLoading(true)
  const p=new URLSearchParams();if(q)p.set('lookup',q);if(a)p.set('after',a);if(b)p.set('before',b)
  try{const r=await fetch('/api/administrators?'+p,{cache:'no-store'});const body=await r.json()
   if(!mounted.current||id!==serial.current)return
   if(!r.ok||!body.ok){setData(null);setMessage(r.status===403?t.denied:t.error);return}
   setData(body.data)
  }catch{if(mounted.current&&id===serial.current){setData(null);setMessage(t.error)}}
  finally{if(mounted.current&&id===serial.current)setLoading(false)}
 }
 useEffect(()=>{
  mounted.current=true;void load()
  const refresh=()=>{if(!mutating.current)void load()}
  const {data:auth}=supabase.auth.onAuthStateChange(event=>{
   if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return
   ++serial.current;setData(null);setPending(null);setRetry(null);setReason('');setMessage('')
   if(event!=='SIGNED_OUT')queueMicrotask(()=>{if(mounted.current)void load()})
  })
  window.addEventListener('focus',refresh)
  return()=>{mounted.current=false;++serial.current;auth.subscription.unsubscribe();window.removeEventListener('focus',refresh)}
 },[])
 useEffect(()=>{const preventLeave=(e:Event)=>{if(mutating.current)e.preventDefault()};window.addEventListener('admin-leave',preventLeave);return()=>window.removeEventListener('admin-leave',preventLeave)},[])
 function propose(operation:string,permission?:string){if(!selected||!reason.trim()||mutating.current)return;setMessage('');setPending({requestId:crypto.randomUUID(),targetId:selected.id,operation,permission,reason:reason.trim()})}
 async function execute(c:Command){
  if(mutating.current)return;mutating.current=true;setBusy(true);setPending(null);setMessage('')
  try{const r=await fetch('/api/administrators',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(c)});const body=await r.json()
   if(!mounted.current)return
   if(!r.ok||!body.ok){setRetry(c);setMessage(t.error);if(r.status===403)setData(null);return}
   setRetry(null);setReason('');setMessage(t.success);await load()
  }catch{if(mounted.current){setRetry(c);setMessage(t.error)}}
  finally{mutating.current=false;if(mounted.current)setBusy(false)}
 }
 function select(q:string){if(busy)return;setLookup(q);setQuery(q);setPending(null);setMessage('');void load(q)}
 return <div className="admin-administrators" aria-busy={loading||busy}>
  <p>{t.note}</p>
  <form onSubmit={e=>{e.preventDefault();select(lookup.trim())}}><label htmlFor="admin-account-lookup">{t.lookup}</label><div className="admin-account-search"><input id="admin-account-lookup" value={lookup} maxLength={320} onChange={e=>setLookup(e.target.value)} disabled={busy}/><button disabled={busy||loading||lookup.trim().length<3}>{t.find}</button><button type="button" disabled={busy||loading} onClick={()=>{setMessage('');void load()}}>{t.refresh}</button></div><p>{t.hint}</p></form>
  {message&&<p role="status">{message}</p>}{loading&&<p role="status">{t.loading}</p>}
  {retry&&<button disabled={busy} onClick={()=>void execute(retry)}>{t.retry}</button>}
  {query&&data&&!selected&&<p>{t.none}</p>}
  {selected&&<section aria-label={t.search} className="admin-account-panel"><h3>{selected.email??selected.id}</h3><code>{selected.id}</code><p>{selected.confirmed?t.confirmed:t.unconfirmed}</p><p>{selected.owner?t.owner:selected.topAdministrator?t.top:selected.active?t.active:t.inactive}</p>
   <label htmlFor="admin-change-reason">{t.reason}</label><textarea id="admin-change-reason" value={reason} maxLength={2000} onChange={e=>setReason(e.target.value)} disabled={busy}/>
   {!selected.owner&&!selected.topAdministrator&&<button disabled={busy||!reason.trim()||(!selected.active&&!selected.confirmed)} onClick={()=>propose(selected.active?'administrator.deactivate':'administrator.activate')}>{selected.active?t.deactivate:t.activate}</button>}
   <h4>{t.permissions}</h4>{!selected.permissions.length&&<p>{t.noGrant}</p>}
   <ul className="admin-permission-list">{data?.permissions.map(p=><li key={p}><code>{p}</code><button disabled={busy||!selected.active||!selected.confirmed||selected.owner||selected.topAdministrator||!reason.trim()} onClick={()=>propose(selected.permissions.includes(p)?'permission.revoke':'permission.grant',p)}>{selected.permissions.includes(p)?t.revoke:t.grant}</button></li>)}</ul>
  </section>}
  {pending&&<section role="region" aria-label={t.confirm} className="admin-account-panel"><p><strong>{pending.operation}</strong> · <code>{pending.targetId}</code></p>{pending.permission&&<p><code>{pending.permission}</code></p>}<p>{pending.reason}</p><button disabled={busy} onClick={()=>void execute(pending)}>{t.confirm}</button><button disabled={busy} onClick={()=>setPending(null)}>{t.cancel}</button></section>}
  <h3>{t.roster}</h3><ul className="admin-account-roster">{data?.administrators.slice(0,25).map(a=><li key={a.id}><button disabled={busy} onClick={()=>select(a.id)}>{a.email??a.id}</button><span>{a.owner?t.owner:a.topAdministrator?t.top:a.active?t.active:t.inactive}</span></li>)}</ul>
  <div className="admin-account-search">{after&&<button disabled={busy||loading} onClick={()=>{setAfter(null);void load(query,null,before)}}>{t.first}</button>}{data&&data.administrators.length>25&&<button disabled={busy||loading} onClick={()=>{const a=data.administrators[24].id;setAfter(a);void load(query,a,before)}}>{t.more}</button>}</div>
  <h3>{t.audit}</h3>{data&&!data.events.length&&<p>{t.empty}</p>}<ol className="admin-account-audit">{data?.events.slice(0,20).map(e=><li key={e.id}><p><time dateTime={e.at}>{new Date(e.at).toLocaleString(language==='es'?'es-CR':'en-US')}</time> · {e.operation} · {e.result==='succeeded'?t.succeeded:t.denial}</p><p><code>{e.actorId}</code> → <code>{e.targetId}</code></p>{e.beforePermissions&&e.afterPermissions&&<p>{e.beforePermissions.join(', ')||'—'} → {e.afterPermissions.join(', ')||'—'}</p>}</li>)}</ol>
  <div className="admin-account-search">{before&&<button disabled={busy||loading} onClick={()=>{setBefore(null);void load(query,after,null)}}>{t.latest}</button>}{data&&data.events.length>20&&<button disabled={busy||loading} onClick={()=>{const b=data.events[19].id;setBefore(b);void load(query,after,b)}}>{t.older}</button>}</div>
  <style jsx>{`.admin-account-search{display:flex;gap:.5rem;flex-wrap:wrap;margin:.5rem 0}.admin-account-search input{flex:1;min-width:0;width:100%}.admin-account-panel{padding:1rem 0;border-bottom:1px solid var(--border)}.admin-account-panel textarea{display:block;width:100%;max-width:40rem;margin:.5rem 0}.admin-permission-list li,.admin-account-roster li{display:flex;gap:.75rem;justify-content:space-between;align-items:center;flex-wrap:wrap;margin:.5rem 0}.admin-account-audit li{margin:1rem 0}.admin-account-panel code,.admin-account-audit code{overflow-wrap:anywhere}button:disabled{opacity:.55;cursor:not-allowed}@media(max-width:600px){.admin-account-search>*{width:100%}.admin-account-roster li{align-items:flex-start;flex-direction:column}.admin-permission-list{padding-left:0}.admin-account-panel{padding:.75rem 0}}`}</style>
 </div>
}
