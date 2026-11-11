'use client'
import {useEffect,useRef,useState} from 'react'
import {choose} from '@/lib/measurement/runtime'
import {supabase} from '@/lib/supabase'
import {readPrivacyAccount,preparePrivacyCase,reviewPrivacyCase} from '@/app/measurement/rights-actions'
export default function PrivacyRightsPanel({es}:{es:boolean}){
 const [owner,setOwner]=useState(false),[review,setReview]=useState(''),[reviewStatus,setReviewStatus]=useState('')
 const [account,setAccount]=useState<string|null>(null),[status,setStatus]=useState(''),[receipt,setReceipt]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false)
 const request=useRef(''),cursor=useRef<string|undefined>(undefined),generation=useRef(0)
 useEffect(()=>{let alive=true;const read=async()=>{const version=++generation.current;setReceipt('');setAccount(null);setOwner(false);setReview('');setReviewStatus('');request.current='';cursor.current=undefined;setConfirmed(false);const r=await readPrivacyAccount();if(alive&&version===generation.current){setAccount(r.state==='VERIFIED_ACCOUNT'?r.accountId??null:null);setStatus(r.state);setOwner('owner'in r&&r.owner===true)}};void read();const{data:{subscription}}=supabase.auth.onAuthStateChange(()=>{void read()});return()=>{alive=false;generation.current++;subscription.unsubscribe()}},[])
 async function act(kind:'access'|'correction'|'measurement_erasure'){
  if(!account||busy||kind==='measurement_erasure'&&!confirmed)return
  const version=generation.current;setBusy(true);if(!request.current)request.current=crypto.randomUUID()
  try{const r=await preparePrivacyCase({caseId:request.current,expectedAccount:account,kind,...(kind==='measurement_erasure'&&cursor.current?{cursor:cursor.current}:{})});if(version!==generation.current)return
   setReceipt('receipt'in r&&typeof r.receipt==='string'?r.receipt:'');cursor.current='nextCursor'in r&&typeof r.nextCursor==='string'?r.nextCursor:undefined;setStatus(r.state);if(kind==='measurement_erasure'&&['PAGING','LOGICALLY_SUPPRESSED'].includes(r.state))choose('denied')
  }finally{setBusy(false)}
 }
 const label=status==='DISABLED'?(es?'La integración de solicitudes aún no está activa.':'Request integration is not active yet.'):
 status==='IDENTITY_VERIFIED'?(es?'Verificación preparada. Copie el recibo en su mensaje de privacidad; no concede acceso a su cuenta.':'Verification prepared. Copy the receipt into your privacy message; it does not grant account access.'):
 status==='LOGICALLY_SUPPRESSED'?(es?'Medición vinculada suprimida. La eliminación en proveedores y copias requiere verificación separada.':'Bound measurement suppressed. Erasure at providers and in copies requires separate verification.'):
 status==='PAGING'?(es?'Hay más épocas vinculadas. Continúe con el mismo caso.':'More bound epochs remain. Continue the same case.'):
 status==='AUTHENTICATION_REQUIRED'?(es?'Inicie sesión para verificar su cuenta.':'Sign in to verify your account.'):
 status==='ACCOUNT_CHANGED'?(es?'La cuenta cambió. Vuelva a abrir las preferencias.':'The account changed. Reopen preferences.'):
 status==='VERIFIED_ACCOUNT'?'':(es?'El alcance no está disponible o está incompleto. Contacte al canal de privacidad.':'Scope is unavailable or incomplete. Contact the privacy channel.')
 return <fieldset style={{width:'100%',padding:12,border:'1px solid currentColor'}}><legend>{es?'Solicitudes de privacidad':'Privacy requests'}</legend>
 <p>{es?'Contacto:':'Contact:'} <a href="mailto:privacy@twuanis.com">privacy@twuanis.com</a>. {es?'No envíe contraseñas ni códigos de acceso. El historial anónimo no siempre puede vincularse a una cuenta.':'Do not send passwords or login codes. Anonymous history cannot always be linked to an account.'}</p>
 <div style={{display:'flex',flexWrap:'wrap',gap:8}}><button type="button" disabled={!account||busy} onClick={()=>{request.current='';cursor.current=undefined;void act('access')}}>{es?'Verificar solicitud de acceso':'Verify access request'}</button><button type="button" disabled={!account||busy} onClick={()=>{request.current='';cursor.current=undefined;void act('correction')}}>{es?'Verificar solicitud de rectificación':'Verify correction request'}</button></div>
 <label style={{display:'block',marginTop:12}}><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);request.current='';cursor.current=undefined}}/>{es?'Solicito suprimir la medición vinculada a esta cuenta. Esto no elimina mi cuenta ni los registros comerciales necesarios.':'I request suppression of measurement bound to this account. This does not delete my account or necessary business records.'}</label>
 <button type="button" disabled={!account||busy||!confirmed} onClick={()=>void act('measurement_erasure')}>{cursor.current?(es?'Continuar la solicitud':'Continue request'):(es?'Solicitar supresión de medición':'Request measurement suppression')}</button>
 {label&&<p role="status">{label}</p>}{receipt&&<label style={{display:'block'}}>{es?'Recibo de verificación para el caso de privacidad':'Privacy-case verification receipt'}<textarea readOnly value={receipt} style={{display:'block',width:'100%',minHeight:96,overflowWrap:'anywhere'}}/></label>}
 {owner&&<div><label>{es?'Revisión privada del recibo — Owner':'Private receipt review — Owner'}<textarea value={review} maxLength={1400} onChange={e=>setReview(e.target.value)} style={{display:'block',width:'100%'}}/></label><button type="button" disabled={busy||!review} onClick={()=>{const v=generation.current;setBusy(true);void reviewPrivacyCase(review).then(r=>{if(v===generation.current)setReviewStatus(r.state==='VERIFIED_CASE'?`${r.caseId} · ${r.kind} · ${r.accountId} · ${r.retainedEpochs}`:(es?'Verificación no disponible':'Verification unavailable'))}).finally(()=>setBusy(false))}}>{es?'Verificar recibo':'Verify receipt'}</button><p role="status">{reviewStatus}</p><p>{es?'Solo verifica identidad y alcance retenido; no concede acceso ni certifica eliminación en proveedores.':'Verifies identity and retained scope only; it grants no access and does not certify provider erasure.'}</p></div>}
 </fieldset>
}
