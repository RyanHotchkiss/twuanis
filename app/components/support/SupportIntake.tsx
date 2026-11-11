'use client'
import Link from 'next/link'
import {useEffect,useRef,useState} from 'react'
import {selectionNodes,supportPath,supportTaxonomy,supportWhatsAppUrl,validSupportSelection,type SupportLocale,type SupportSelection} from '@/lib/support/contract'
import {trackSupport} from '@/lib/support/measurement'
import {verifySupportCustomer} from './actions'
import styles from './SupportIntake.module.css'
export default function SupportIntake({language,customerId}:{language:SupportLocale;customerId:string}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const [selection,setSelection]=useState<SupportSelection>({category:'',subject:'',issue:''}),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[opened,setOpened]=useState(false),[error,setError]=useState(''),[authError,setAuthError]=useState(false)
 const lock=useRef(false),nodes=selectionNodes(selection),login='/login?'+new URLSearchParams({lang:language,next:supportPath(language)})
 useEffect(()=>{const opened=()=>{trackSupport(language,'opened')};opened();window.addEventListener('tw-measurement-consent',opened);return()=>window.removeEventListener('tw-measurement-consent',opened)},[language])
 function choose(kind:keyof SupportSelection,value:string){const next=kind==='category'?{category:value,subject:'',issue:''}:kind==='subject'?{...selection,subject:value,issue:''}:{...selection,issue:value};setSelection(next);setOpened(false);setError('');if(value)trackSupport(language,kind,kind==='category'?{category:value}:next)}
 async function openWhatsApp(){
  if(lock.current||opened)return
  if(!validSupportSelection(selection)||!message.trim()||message.length>1500){setError(t('Choose a category, subject and issue, and enter your message.','Seleccione una categoría, un tema y un problema, y escriba su mensaje.'));return}
  lock.current=true;setBusy(true);setError('');setAuthError(false)
  try{const actor=await verifySupportCustomer();if(!actor.ok){setAuthError(true);setError(t('Your session could not be verified. Sign in again before opening WhatsApp.','No se pudo verificar su sesión. Inicie sesión de nuevo antes de abrir WhatsApp.'));return}
   if(actor.userId!==customerId){setAuthError(true);setError(t('The signed-in account changed. Reopen support before sending this request.','La cuenta activa cambió. Vuelva a abrir el soporte antes de enviar esta consulta.'));return}
   // Sensitive URL remains in this handler only: never an href, data attribute, log or analytics field.
   const url=supportWhatsAppUrl(language,actor.userId,selection,message)
   trackSupport(language,'whatsapp_opened',selection);setOpened(true);window.location.assign(url)
  }catch{setError(t('WhatsApp could not be opened. Try again.','No se pudo abrir WhatsApp. Inténtelo de nuevo.'))}finally{lock.current=false;setBusy(false)}
 }
 return <main className={styles.main}><h1>{t('WhatsApp Support','Ayuda por WhatsApp')}</h1><p>{t('Tell us what you need help with. You will review and send your message in WhatsApp.','Cuéntenos en qué necesita ayuda. Podrá revisar y enviar su mensaje en WhatsApp.')}</p>
 <p className={styles.hint}>{t('Your existing customer UUID will be included as a support reference. No saved phone number is required. Do not enter passwords, access codes, email addresses or banking credentials.','Se incluirá su UUID de cliente como referencia de soporte. No necesita un teléfono guardado. No ingrese contraseñas, códigos de acceso, correos electrónicos ni credenciales bancarias.')}</p>
 <section aria-label={t('Support request','Consulta de soporte')} className={styles.fields}>
 <label>{t('Category','Categoría')}<select value={selection.category} disabled={busy} onChange={e=>choose('category',e.target.value)}><option value="">{t('Choose a category','Seleccione una categoría')}</option>{supportTaxonomy.map(c=><option key={c.id} value={c.id}>{c.label[language]}</option>)}</select></label>
 <label>{t('Subject','Tema')}<select value={selection.subject} disabled={busy||!nodes.category} onChange={e=>choose('subject',e.target.value)}><option value="">{t('Choose a subject','Seleccione un tema')}</option>{nodes.category?.subjects.map(s=><option key={s.id} value={s.id}>{s.label[language]}</option>)}</select></label>
 <label>{t('Specific issue','Problema específico')}<select value={selection.issue} disabled={busy||!nodes.subject} onChange={e=>choose('issue',e.target.value)}><option value="">{t('Choose an issue','Seleccione un problema')}</option>{nodes.subject?.issues.map(i=><option key={i.id} value={i.id}>{i.label[language]}</option>)}</select></label>
 <label>{t('Your message','Su mensaje')}<textarea value={message} maxLength={1500} disabled={busy} onChange={e=>{setMessage(e.target.value);setOpened(false)}} aria-describedby="support-message-help"/></label><p id="support-message-help" className={styles.hint}>{t('Only your selections, customer UUID and this message are included. You press Send in WhatsApp.','Solo se incluyen sus selecciones, su UUID de cliente y este mensaje. Usted presiona Enviar en WhatsApp.')}</p>
 </section>
 <div className={styles.actions}><Link href={es?'/es':'/en'}>{t('Back to Twuanis','Volver a Twuanis')}</Link><button className={styles.primary} type="button" disabled={busy||opened} onClick={()=>void openWhatsApp()}>{busy?t('Checking your session…','Verificando su sesión…'):opened?t('WhatsApp opened','WhatsApp abierto'):t('Open WhatsApp','Abrir WhatsApp')}</button></div>
 {opened&&<p><button type="button" onClick={()=>setOpened(false)}>{t('Prepare to open again','Preparar para abrir de nuevo')}</button></p>}
 <p role={error?'alert':'status'} className={`${styles.status} ${error?styles.error:''}`}>{error}</p>{authError&&<Link href={login}>{t('Sign in again','Iniciar sesión de nuevo')}</Link>}
 </main>
}
