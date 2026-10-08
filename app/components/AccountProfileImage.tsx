'use client'
import { useEffect, useRef, useState } from 'react'
type State={revision:number;assetId:string|null;hasImage:boolean;url:string|null}
const en={title:'Profile photo',choose:'Upload Photo',replace:'Replace Photo',remove:'Remove Photo',busy:'Uploading…',removing:'Removing…',success:'Profile photo updated.',removed:'Profile photo removed.',loading:'Loading profile photo…',format:'Choose a JPEG, PNG or WebP image.',size:'Choose an image no larger than 5 MiB.',invalid:'This image is invalid, damaged, animated or too large when decoded.',storage:'Unable to complete the request. Try again.',conflict:'Your profile changed. Review the current image and try again.',rate:'Upload limit reached. Try again later.',auth:'Sign in to manage your photo.',hint:'JPEG, PNG or WebP · maximum 5 MiB',retry:'Retry',alt:'Your profile photo'}
const es:typeof en={title:'Foto de perfil',choose:'Subir fotografía',replace:'Reemplazar fotografía',remove:'Eliminar fotografía',busy:'Subiendo…',removing:'Eliminando…',success:'Se actualizó la foto de perfil.',removed:'Se eliminó la foto de perfil.',loading:'Cargando la foto de perfil…',format:'Seleccione una imagen JPEG, PNG o WebP.',size:'Seleccione una imagen de hasta 5 MiB.',invalid:'La imagen es inválida, está dañada, es animada o es demasiado grande al decodificarse.',storage:'No se pudo completar la solicitud. Inténtelo de nuevo.',conflict:'Su perfil cambió. Revise la imagen actual e inténtelo de nuevo.',rate:'Alcanzó el límite de cargas. Inténtelo más tarde.',auth:'Inicie sesión para administrar su foto.',hint:'JPEG, PNG o WebP · máximo 5 MiB',retry:'Reintentar',alt:'Su foto de perfil'}
export default function AccountProfileImage({language}:{language:'en'|'es'}){
 const t=language==='es'?es:en, picker=useRef<HTMLInputElement>(null), alive=useRef(true),pending=useRef(false), sequence=useRef(0)
 const [state,setState]=useState<State|null>(null),[busy,setBusy]=useState<'upload'|'remove'|null>(null),[error,setError]=useState<keyof typeof en|null>(null),[message,setMessage]=useState<'success'|'removed'|null>(null)
 const retry=useRef<{file:File;id:string;revision:number}|null>(null)
 async function load(){const seq=++sequence.current;try{const r=await fetch('/api/account/profile-image',{cache:'no-store'}),v=await r.json();if(!alive.current||seq!==sequence.current)return;if(!r.ok||!v.ok){setError(v.reason in t?v.reason:'storage');return}setState(v)}catch{if(alive.current)setError('storage')}}
 useEffect(()=>{alive.current=true;void load();return()=>{alive.current=false}},[])
 // Renew only on explicit revisit/focus; no periodic polling or per-render request.
 useEffect(()=>{const refresh=()=>{if(!pending.current)void load()};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh)},[])
 async function upload(file:File,repeat=false){if(pending.current||!state)return
 setError(null);setMessage(null)
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('format');return}if(file.size>5*1024*1024){setError('size');return}
 const attempt=repeat&&retry.current?retry.current:{file,id:crypto.randomUUID(),revision:state.revision};retry.current=attempt;sequence.current++;pending.current=true;setBusy('upload')
 try{const r=await fetch('/api/account/profile-image',{method:'POST',headers:{'Content-Type':file.type,'X-Image-Name':encodeURIComponent(file.name),'X-Image-Request':attempt.id,'X-Profile-Revision':String(attempt.revision)},body:file}),v=await r.json()
 if(!alive.current)return;if(!r.ok||!v.ok){setError(v.reason in t?v.reason:'storage');if(v.reason==='conflict'){retry.current=null;await load()}return}retry.current=null;setState(v);setMessage('success');window.dispatchEvent(new Event('account-profile-image-changed'))
 }catch{if(alive.current)setError('storage')}finally{pending.current=false;if(alive.current)setBusy(null)}}
 async function remove(){if(pending.current||!state)return;sequence.current++;pending.current=true;setBusy('remove');setError(null);setMessage(null);retry.current=null
 try{const r=await fetch('/api/account/profile-image',{method:'DELETE',headers:{'X-Image-Request':crypto.randomUUID(),'X-Profile-Revision':String(state.revision)}}),v=await r.json();if(!alive.current)return;if(!r.ok||!v.ok){setError(v.reason in t?v.reason:'storage');if(v.reason==='conflict')await load();return}setState(v);setMessage('removed');window.dispatchEvent(new Event('account-profile-image-changed'))}
 catch{if(alive.current)setError('storage')}finally{pending.current=false;if(alive.current)setBusy(null)}}
 return <div style={{display:'grid',gap:12,minWidth:0,maxWidth:'100%'}}><div>{t.title}</div>
 {state?.url?<img src={state.url} onError={()=>setError('storage')} alt={t.alt} style={{width:96,height:96,objectFit:'cover',borderRadius:'50%',maxWidth:'100%'}}/>:<div aria-label={t.title} style={{width:96,height:96,borderRadius:'50%',background:'var(--surface-raised)'}}/>}
 <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t.choose} hidden onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file)}}/>
 <div style={{display:'flex',flexWrap:'wrap',gap:8}}><button type="button" disabled={!!busy||!state} onClick={()=>picker.current?.click()} style={button}>{busy==='upload'?t.busy:state?.hasImage?t.replace:t.choose}</button>
 {state?.hasImage&&<button type="button" disabled={!!busy} onClick={remove} style={button}>{busy==='remove'?t.removing:t.remove}</button>}</div>
 <small>{t.hint}</small>{!state&&!error&&<p role="status">{t.loading}</p>}{message&&<p role="status">{t[message]}</p>}
 {error&&<><p role="alert">{t[error]}</p><button type="button" disabled={!!busy} style={button} onClick={()=>{setError(null);if(retry.current)void upload(retry.current.file,true);else void load()}}>{t.retry}</button></>}
 </div>
}
const button={minHeight:44,padding:'0.6rem 0.8rem',border:'1px solid var(--border)',borderRadius:'0.75rem',background:'var(--surface-raised)',color:'var(--foreground)',cursor:'pointer',maxWidth:'100%'}
