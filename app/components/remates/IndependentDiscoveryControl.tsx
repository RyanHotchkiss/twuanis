'use client'
import {useEffect,useRef,useState} from 'react'
import {independentDiscoveryState,independentDiscoveryCommand} from '@/app/actions/remates-discovery'
export default function IndependentDiscoveryControl({language}:{language:'en'|'es'}){
 const t=(en:string,es:string)=>language==='es'?es:en;
 const [state,S]=useState<{enabled:boolean;revision:string}|null>(null),[busy,B]=useState(false),[error,E]=useState(''),[receipt,R]=useState('');
 const pending=useRef<{id:string;input:{expected:string;enabled:boolean;reason:string;reviewed:boolean}}|null>(null),lock=useRef(false);
 useEffect(()=>{let live=true;independentDiscoveryState().then(x=>{if(live){if(x.ok)S(x.data);else E(x.error)}});return()=>{live=false}},[]);
 async function refresh(){if(lock.current)return;lock.current=true;B(true);try{const x=await independentDiscoveryState();if(!x.ok)throw Error(x.error);S(x.data);pending.current=null;E('')}catch(e){E(e instanceof Error?e.message:'DISCOVERY_UNAVAILABLE')}finally{lock.current=false;B(false)}}
 async function transition(){
  if(!state||lock.current)return;
  const enabled=pending.current?.input.enabled??!state.enabled;
  if(!window.confirm(t(`Authorize public discovery ${enabled?'ON':'OFF'} at revision ${pending.current?.input.expected??state.revision}? Retrieval and notifications remain unchanged.`,`¿Autorizar descubrimiento público ${enabled?'ON':'OFF'} en revisión ${pending.current?.input.expected??state.revision}? Recuperación y notificaciones permanecen sin cambios.`)))return;
  lock.current=true;B(true);E('');
  if(!pending.current)pending.current={id:crypto.randomUUID(),input:{expected:state.revision,enabled,reason:'Explicit Owner-confirmed Bank Properties public discovery transition; retrieval and notifications unchanged',reviewed:true}};
  try{const x=await independentDiscoveryCommand(pending.current.id,pending.current.input);if(!x.ok)throw Error(x.error);S({enabled:x.data.enabled,revision:x.data.revision});R(x.data.receiptId);pending.current=null}catch(e){E(e instanceof Error?e.message:'DISCOVERY_UNAVAILABLE')}finally{lock.current=false;B(false)}
 }
 return <section aria-labelledby="bank-discovery-heading"><h4 id="bank-discovery-heading">{t('Owner operational controls','Controles operativos del Owner')}</h4><p>{t('Public Discovery','Descubrimiento público')}: {state?(state.enabled?'ON':'OFF'):t('Unavailable','No disponible')} · {t('Revision','Revisión')}: {state?.revision??'—'}</p><p>{t('Discovery applies to the existing Bank Properties & Remates marketplace. Publication, retrieval and notifications remain separately controlled.','El descubrimiento corresponde al mercado existente de Propiedades Bancarias y Remates. Publicación, recuperación y notificaciones siguen controladas por separado.')}</p><button disabled={busy} onClick={()=>void refresh()}>{t('Refresh state','Actualizar estado')}</button><button disabled={busy||!state} onClick={()=>void transition()}>{pending.current?t('Retry confirmed command','Reintentar comando confirmado'):state?.enabled?t('Turn discovery OFF','Desactivar descubrimiento'):t('Turn discovery ON','Activar descubrimiento')}</button>{error&&<p role="alert">{error}</p>}{receipt&&<p role="status">{t('Canonical receipt','Recibo canónico')}: {receipt}</p>}</section>
}
