'use client'
import {useEffect,useRef,useState,type FormEvent} from 'react'
import {supabase} from '@/lib/supabase'
export default function AccountDeletion({language}:{language:'en'|'es'}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [password,setPassword]=useState(''),[ack,setAck]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('')
 const alive=useRef(true)
 const [phase,setPhase]=useState('NONE')
 const [account,setAccount]=useState<string|null>(null)
 const [allowed,setAllowed]=useState<boolean|null>(null)
 useEffect(()=>{let live=true;alive.current=true;void fetch('/api/account/delete',{cache:'no-store'}).then(async r=>({ok:r.ok,data:await r.json()})).then(r=>{if(live){setAllowed(r.ok&&r.data.ok&&r.data.allowed===true&&typeof r.data.accountId==='string');setAccount(r.data.accountId??null);setPhase(r.data.phase??'NONE')}}).catch(()=>{if(live)setAllowed(false)});return()=>{live=false;alive.current=false}},[])
 const request=useRef<string|null>(null)
 async function remove(e:FormEvent){
  e.preventDefault();if(busy||!allowed||!account||!ack||!password)return
  setBusy(true);setStatus('');request.current??=crypto.randomUUID()
  try{
   const r=await fetch('/api/account/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:request.current,expectedAccount:account,password,acknowledged:ack})}),b=await r.json()
   setPassword('')
   if(!r.ok||b.ok!==true){setStatus(b.reason==='protected'?t('This protected account cannot be deleted through Settings.','Esta cuenta protegida no puede eliminarse desde Configuración.'):b.reason==='reauth'?t('Confirm your current password. If MFA is enabled, complete a fresh MFA sign-in first.','Confirme su contraseña actual. Si usa MFA, complete primero un nuevo inicio de sesión con MFA.'):t('Deletion is not confirmed. Your account may still exist. Sign in and retry; contact support if the problem persists.','La eliminación no está confirmada. Es posible que su cuenta aún exista. Inicie sesión y reintente; contacte a soporte si el problema persiste.'));return}
   // Full navigation discards in-memory private state; provider clears its own account storage.
   const session=await supabase.auth.getSession()
   if(!alive.current||(session.data.session?.user.id&&session.data.session.user.id!==account))return
   await supabase.auth.signOut({scope:'local'})
   window.dispatchEvent(new Event('account-profile-image-changed'))
   window.location.replace(es?'/es':'/en')
  }catch{setPassword('');setStatus(t('Deletion could not be confirmed. Retry after signing in.','No se pudo confirmar la eliminación. Reintente después de iniciar sesión.'))}finally{setBusy(false)}
 }
 return <section className="account-deletion" aria-labelledby="settings-account-management"><h2 id="settings-account-management">{t('Account Management','Administración de la cuenta')}</h2>
  <p>{t('Permanently delete your login, profile photo, preferences and saved account data. Required financial and audit history remains without login access. Deletion does not issue a refund. Owner and protected administrator accounts cannot use this control.','Elimine permanentemente su acceso, foto de perfil, preferencias y datos guardados. El historial financiero y de auditoría necesario se conserva sin acceso a la cuenta. La eliminación no genera un reembolso. Las cuentas de Propietario y administradores protegidos no pueden usar este control.')}</p>
  {['CLEANUP_PENDING','STORAGE_READY'].includes(phase)&&<p>{t('Deletion is pending. Profile images may already be removed. Retry Delete Account to finish; login remains until deletion is confirmed.','La eliminación está pendiente. Es posible que las fotos de perfil ya se hayan eliminado. Reintente Eliminar cuenta para finalizar; el acceso permanece hasta confirmar la eliminación.')}</p>}
  {allowed===false&&<p>{t('Deletion is unavailable for this account or could not be authorized.','La eliminación no está disponible para esta cuenta o no se pudo autorizar.')}</p>}
  <form onSubmit={remove}><label>{t('Current password','Contraseña actual')}<input type="password" autoComplete="current-password" required value={password} disabled={busy} onChange={e=>setPassword(e.target.value)}/></label>
   <label style={{display:'flex',flexDirection:'row',alignItems:'flex-start'}}><input style={{width:'auto',flexShrink:0}} type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>{t('I understand that account deletion is permanent.','Entiendo que la eliminación de la cuenta es permanente.')}</label>
   <button type="submit" disabled={busy||!allowed||!ack||!password}>{busy?t('Deleting…','Eliminando…'):t('Delete Account','Eliminar cuenta')}</button><p role="status">{status}</p>
  </form><style jsx>{`.account-deletion{min-width:0;padding:20px;border:1px solid var(--border);border-radius:18px;background:var(--surface-raised)}h2{margin:0 0 16px}label{display:flex;flex-direction:column;gap:7px;margin:16px 0}input{box-sizing:border-box;min-width:0;width:100%;padding:12px;border:1px solid var(--border);border-radius:9px;background:var(--surface);color:inherit;font:inherit}button{box-sizing:border-box;min-height:44px;max-width:100%;padding:10px 14px;border:1px solid currentColor;border-radius:9px;background:transparent;color:inherit;font:inherit;white-space:normal;overflow-wrap:anywhere}button:disabled{opacity:.55}:focus-visible{outline:3px solid #ff6b00;outline-offset:3px}p{overflow-wrap:anywhere;line-height:1.5}@media(max-width:390px){.account-deletion{padding:12px}}`}</style></section>
}
