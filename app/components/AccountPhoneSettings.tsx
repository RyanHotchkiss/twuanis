'use client'
import { useEffect, useRef, useState } from 'react'
type PhoneState={phone:string|null;revision:number}
const copy={en:{title:'Optional account phone',country:'Number format',cr:'Costa Rica (+506)',international:'International (+country code)',phone:'Phone number',save:'Save phone',help:'Optional contact information. Phone verification is not required for your account or Intelligence purchases.',loading:'Loading…',pending:'Please wait…',saved:'Phone saved.',retry:'Retry loading',invalid:'Check the phone number.',conflict:'The phone changed. Review the current saved number.',unavailable:'Phone settings are temporarily unavailable.',auth:'Sign in again to manage your phone.'},es:{title:'Teléfono opcional de la cuenta',country:'Formato del número',cr:'Costa Rica (+506)',international:'Internacional (+código de país)',phone:'Número de teléfono',save:'Guardar teléfono',help:'Información de contacto opcional. No se requiere verificar el teléfono para su cuenta ni para comprar Inteligencia.',loading:'Cargando…',pending:'Espere…',saved:'Teléfono guardado.',retry:'Volver a cargar',invalid:'Revise el número de teléfono.',conflict:'El teléfono cambió. Revise el número guardado actual.',unavailable:'La configuración del teléfono no está disponible temporalmente.',auth:'Vuelva a iniciar sesión para administrar su teléfono.'}}
export default function AccountPhoneSettings({language}:{language:'en'|'es'}){
 const t=copy[language],[current,setCurrent]=useState<PhoneState|null>(null),[phone,setPhone]=useState(''),[country,setCountry]=useState('CR'),[pending,setPending]=useState(false),[message,setMessage]=useState(''),[loadError,setLoadError]=useState(false)
 const retry=useRef<{key:string;id:string}|null>(null)
 function accept(next:PhoneState){setCurrent(next);setPhone(next.phone??'')}
 async function load(){setLoadError(false);try{const r=await fetch('/api/account/phone',{cache:'no-store'}),data=await r.json();if(!r.ok||!data.current)throw Error();accept(data.current)}catch{setLoadError(true)}}
 useEffect(()=>{void load()},[])
 async function save(){
  if(!current||pending)return
  const payload={op:'save',revision:current.revision,phone,country},key=JSON.stringify(payload)
  if(retry.current?.key!==key)retry.current={key,id:crypto.randomUUID()}
  setPending(true);setMessage('')
  try{const r=await fetch('/api/account/phone',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,request:retry.current.id})}),data=await r.json();if(r.status>=500)throw Error();retry.current=null;if(data.current)accept(data.current);setMessage(data.ok?t.saved:t[data.reason as keyof typeof t]??t.unavailable)}catch{setMessage(t.unavailable)}finally{setPending(false)}
 }
 return <section className="account-phone" aria-label={t.title}><strong>{t.title}</strong>
 {!current?<><p role="status">{loadError?t.unavailable:t.loading}</p>{loadError&&<button type="button" onClick={load}>{t.retry}</button>}</>:<>
 <label>{t.country}<select value={country} disabled={pending} onChange={e=>setCountry(e.target.value)}><option value="CR">{t.cr}</option><option value="international">{t.international}</option></select></label>
 <label>{t.phone}<input type="tel" autoComplete="tel" value={phone} maxLength={80} disabled={pending} onChange={e=>setPhone(e.target.value)}/></label>
 <button type="button" disabled={pending} onClick={save}>{t.save}</button><p>{t.help}</p></>}
 <p role="status" aria-live="polite">{pending?t.pending:message}</p>
  <style jsx>{`.account-phone{min-width:0;max-width:100%;color:inherit}.account-phone label{display:flex;flex-direction:column;gap:6px;margin:12px 0}.account-phone input,.account-phone select{box-sizing:border-box;width:100%;min-width:0;padding:10px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit}.account-phone option{color:#111;background:#fff}.account-phone button{max-width:100%;min-height:44px;padding:8px 12px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;white-space:normal}.account-phone button:disabled{opacity:.55}.account-phone :focus-visible{outline:3px solid #ff6b00;outline-offset:3px}.account-phone p{overflow-wrap:anywhere}`}</style>
 </section>
}
