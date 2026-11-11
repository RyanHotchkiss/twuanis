import {supportEvidence} from '@/lib/support/contract'
import {journeyConfigure,journeyConsent,journeyIdentity,journeyEligibility,journeyHasConsent,recordJourney,journeyProof} from './journey-client'
import {clearAcquisition,clearDiscovery,noteActivity,noteDiscovery} from './attribution'
import {admit} from './admission'
import type {EventName,EventPayloads} from './types'
import type {ObservationSignal,Projection} from './action-receipt'
export type Consent='unknown'|'denied'|'granted'
export type Mode='off'|'local'|'google'
export type MeasurementProfile='full'|'basic'
let profile:MeasurementProfile='full',journeyEnabled=false,policyNotice=''
const basicNames=new Set(['tw_support_interaction','tw_analytics_select','tw_config_commit','tw_package_view','tw_package_select','tw_save_intent','tw_save_change','tw_share','tw_contact_start','tw_knowledge_view','tw_knowledge_search','tw_knowledge_select','tw_knowledge_engage','page_view','tw_navigation','tw_search_commit','tw_search_part','tw_search_result','tw_search_exit','tw_listing_exposure','tw_listing_view','tw_listing_image','tw_listing_section'])
type RecordEvent={name:EventName;parameters:Record<string,unknown>;key:string;at:number;epoch:string;attempts:number}
let sourceEpoch='',sourceExpires=0
export function setSourceReady(value:string,expires:number){sourceEpoch=value;sourceExpires=expires}
function sourceReady(){return profile==='basic'||mode!=='google'||sourceEpoch===epoch&&sourceExpires>Date.now()}
const gid='G-XPKD8XE7FD',gtm='GTM-W2H54S2R',consentKey='tw_measurement_consent_v1',continuityKey='tw_measurement_browser_v1',consentScopeKey='tw_measurement_consent_scope_v1',promptKey='tw_measurement_prompt_v1'
let collectionEligibility:'pending'|'eligible'|'excluded'='pending'
export function setMeasurementEligibility(value:'pending'|'eligible'|'excluded'){
 collectionEligibility=value
 journeyEligibility(value==='eligible'&&consent==='granted');if(value==='excluded')journeyConsent(false,'owner')
 if(value!=='eligible'){queue=[];if(value==='excluded'){seen.clear();pageSeen.clear();clearAcquisition();clearDiscovery()}if(typeof window!=='undefined'){(window as any)['ga-disable-'+gid]=true;(window as any).__twMeasurementConsent=false;(window as any).__twMeasurementGoogle?.('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})}}
}
let mode:Mode='off',consent:Consent='unknown',epoch='',page='',actor='',authBoundary='',auth:'anonymous'|'authenticated'|'unknown'='unknown',sender:((e:RecordEvent)=>void)|undefined
let handlerTimes:number[]=[]
let seen=new Set<string>(),queue:RecordEvent[]=[],pageSeen=new Set<string>(),seq=0,first=false,continuityKnown=false,session='',last=0
const id=()=>{try{return crypto.randomUUID().replaceAll('-','')}catch{return ''}}
export const interactionKey=id
export function configure(next:Mode,send?:typeof sender,nextProfile:MeasurementProfile='full',durableJourney=false,journeyNotice=''){journeyEnabled=durableJourney;policyNotice=journeyNotice;journeyConfigure(durableJourney,journeyNotice);setMeasurementEligibility('pending');profile=nextProfile;if(profile==='basic'){actor='';authBoundary='';auth='unknown';sourceEpoch='';sourceExpires=0;session='';last=0;first=false;continuityKnown=false;clearAcquisition(true);clearDiscovery();try{localStorage.removeItem(continuityKey);delete (window as any).__twMeasurementAcquisition}catch{}}mode=next==='local'&&typeof location!=='undefined'&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname)?'off':next;sender=send;if(typeof window!=='undefined'){if(mode==='off'||profile==='basic'){queue=[];seen.clear();pageSeen.clear();(window as any).__twMeasurementConsent=false;(window as any)['ga-disable-'+gid]=true;(window as any).__twMeasurementGoogle?.('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})}if(mode==='local')(window as any).__twMeasurementDiagnostics=()=>({events:seen.size,queued:queue.length,handlerTimes:[...handlerTimes]});else delete (window as any).__twMeasurementDiagnostics};try{consent=profile==='basic'&&localStorage.getItem(consentKey)==='denied'?'denied':localStorage.getItem(consentScopeKey)!==consentScope()?'unknown':localStorage.getItem(consentKey)==='granted'?'granted':localStorage.getItem(consentKey)==='denied'?'denied':'unknown'}catch{consent='unknown'}rememberExistingDecision();if(journeyEnabled&&consent==='granted'&&!journeyHasConsent())consent='unknown';epoch=id();page=id()}
function consentScope(){if(journeyEnabled)return mode==='local'?'local:journey-r3':'production:journey-r3';return mode==='google'?(profile==='basic'?'production:ka09-basic-v1':'production:ka09-v1'):mode==='local'?'local:ka09-local-v1':'inactive:ka09-v1'}
// A remembered UI decision is distinct from the bounded collection permission.
// Expiry, temporary policy unavailability and Owner exclusion never erase it.
function rememberDecision(decision:'granted'|'denied'|'dismissed'){
 try{localStorage.setItem(promptKey,JSON.stringify({scope:consentScope(),notice:journeyEnabled?policyNotice:'',decision}))}catch{}
}
function rememberExistingDecision(){
 try{
  if(localStorage.getItem(promptKey)||journeyEnabled&&!policyNotice||localStorage.getItem(consentScopeKey)!==consentScope())return
  const saved=localStorage.getItem(consentKey)
  if(saved==='granted'||saved==='denied'){
   const notice=journeyEnabled?localStorage.getItem('tw_measurement_journey_r4_notice')||policyNotice:''
   localStorage.setItem(promptKey,JSON.stringify({scope:consentScope(),notice,decision:saved}))
  }
 }catch{}
}
export function shouldPromptConsent(){
 if(mode==='off'||journeyEnabled&&!policyNotice)return false
 try{
  const remembered=JSON.parse(localStorage.getItem(promptKey)||'null')
  if(remembered?.scope===consentScope()&&remembered.notice===(journeyEnabled?policyNotice:'')&&['granted','denied','dismissed'].includes(remembered.decision))return false
 }catch{}
 return consent==='unknown'
}
export function dismissConsentPrompt(){if(consent==='unknown')rememberDecision('dismissed')}
export function state(){return {mode,profile,collectionEligibility,consent,epoch,page,auth,session,first,continuityKnown,queued:queue.length}}
function announce(){if(typeof window!=='undefined')window.dispatchEvent(new Event('tw-measurement-consent'))}
export function choose(next:Consent){journeyConsent(false,next==='unknown'?'expiry':'withdrawal');(window as any).__twMeasurementConsent=next==='granted'&&mode==='google'&&collectionEligibility==='eligible';queue=[];seen.clear();pageSeen.clear();epoch=id();page=id();seq=0;consent=next;session='';last=0;first=false;continuityKnown=false;clearDiscovery()
 try{if(next!=='unknown'){localStorage.setItem(consentKey,next);localStorage.setItem(consentScopeKey,consentScope());rememberDecision(next)}if(next!=='granted')localStorage.removeItem(continuityKey)}catch{}
 if(next!=='granted'){clearAcquisition();clearDiscovery();(window as any)['ga-disable-'+gid]=true;(window as any).__twMeasurementGoogle?.('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});const dl=(window as any).twMeasurementLayer;dl?.push(['consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);for(const c of document.cookie.split(';')){const n=c.split('=')[0].trim();if(n==='_ga'||n.startsWith('_ga_'))for(const domain of ['',location.hostname,'.'+location.hostname.replace(/^www\./,'')])document.cookie=n+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'')}}
 journeyConsent(next==='granted');journeyIdentity(actor||null,collectionEligibility==='eligible'&&next==='granted');announce()
}
export function identity(verifiedActor:string|null,authenticated:boolean,boundary=''){if(typeof window==='undefined')return;setMeasurementEligibility('pending');if(profile==='basic'&&!journeyEnabled)return;journeyIdentity(verifiedActor,collectionEligibility==='eligible'&&consent==='granted');const changed=actor!==(verifiedActor||'')||authBoundary!==boundary;authBoundary=boundary;auth=authenticated?'authenticated':'anonymous';if(changed){actor=verifiedActor||'';queue=[];seen.clear();pageSeen.clear();epoch=id();page=id();seq=0;session='';last=0;clearDiscovery();announce()}}
function measurementEnvironment():'isolated_test'|'production'{return mode==='local'||typeof location!=='undefined'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)?'isolated_test':'production'}
export function context(locale:'en'|'es'){return {observed_at_ms:Date.now(),schema_v:'1-proposed' as const,event_id:'e'+id(),locale,page_instance:page,consent_epoch:epoch,environment:measurementEnvironment()}}
export function navigation(){page=id();pageSeen.clear()}
function expiry24(at:number){const d=new Date(at),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+24);const lastDay=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,lastDay));return d.getTime()}
function continuity(now:number){if(now-last>=30*60*1000){session=id();try{let d=JSON.parse(localStorage.getItem(continuityKey)||'null');first=!d||!/^([a-f0-9]{32})$/.test(d.id)||!Number.isFinite(d.at)||d.at>now||now>=expiry24(d.at);if(first)d={id:id(),at:now};localStorage.setItem(continuityKey,JSON.stringify(d));continuityKnown=true}catch{first=false;continuityKnown=false}}last=now}
function send<N extends EventName>(name:N,parameters:EventPayloads[N],dedup:string,source:'browser'|'server'):boolean {
 if(journeyEnabled&&consent==='granted'&&!journeyHasConsent()){choose('unknown');return false}
 const started=mode==='local'&&typeof performance!=='undefined'?performance.now():null
 try{if(profile==='basic'){if(!basicNames.has(name)){if(source==='server'&&name!=='tw_analysis_save')return false;const localKey=epoch+':'+dedup;if(seen.has(localKey))return false;if(seen.size>=1000){const oldest=seen.values().next().value;if(oldest)seen.delete(oldest)}if(journeyEnabled&&collectionEligibility==='eligible'&&consent==='granted'&&(parameters as any).consent_epoch===epoch&&admit(name,parameters,source)){const recorded=recordJourney(name,parameters as Record<string,unknown>,undefined,undefined,source==='server'?'acknowledged':'intent');if(recorded)seen.add(localKey);return recorded}return false}parameters={...parameters};for(const k of ['auth_state','customer_state','continuity_status'])delete (parameters as Record<string,unknown>)[k]}if(collectionEligibility!=='eligible'||!sourceReady()||mode==='off'||consent!=='granted'||!epoch||(name!=='tw_search_part'&&(parameters as any).consent_epoch!==epoch)||!admit(name,parameters,source))return false
 const key=epoch+':'+dedup;if(seen.has(key)||queue.length>=100)return false;if(seen.size>=1000){const oldest=seen.values().next().value;if(oldest)seen.delete(oldest)}
 if(profile!=='basic')continuity(Date.now());noteActivity();if(profile!=='basic'&&name!=='tw_search_part'){const p=parameters as Record<string,unknown>;if(!('auth_state'in p))p.auth_state=auth;if(!('continuity_status'in p))p.continuity_status=continuityKnown?(first?'first_observed_in_available_lookback':'returning_observed'):'unknown'}if(!admit(name,parameters,source))return false;seen.add(key);if(name==='tw_support_interaction'){const support=parameters as EventPayloads['tw_support_interaction'];recordJourney('tw_product_action',{locale:support.locale,selection_kind:supportEvidence(support)},'tw_product_action','contact','intent')}else recordJourney(name,parameters as Record<string,unknown>,name==='tw_analytics_select'?String((parameters as any).selection_kind)+'_'+String((parameters as any).engine_id):undefined,undefined,(parameters as any).outcome==='rejected'?'denied':(parameters as any).outcome==='failure'?'failed':source==='server'?'acknowledged':'intent');queue.push({name,parameters:structuredClone(parameters) as Record<string,unknown>,key,at:Date.now(),epoch,attempts:0});flush();return true
 }catch{return false}finally{if(started!==null&&handlerTimes.length<1000)handlerTimes.push(performance.now()-started)}
}
export function once<N extends EventName>(name:N,parameters:EventPayloads[N],key:string){if(pageSeen.has(key))return false;const ok=emit(name,parameters,page+':'+key);if(ok)pageSeen.add(key);return ok}
export function flush(){if(collectionEligibility!=='eligible'||!sourceReady()||consent!=='granted'){queue=[];return}const current=queue;queue=[];for(const e of current){if(e.epoch!==epoch||Date.now()-e.at>600000)continue;try{if(!sender&&mode==='google'&&!(window as any).twMeasurementLayer){queue.push(e);continue}e.attempts++;if(sender)sender(e);else if(mode==='google'&&(window as any).twMeasurementLayer){const layer=(window as any).twMeasurementLayer;layer.push({tw_parameters:null});layer.push({event:'tw_measurement',tw_event_name:e.name,tw_parameters:e.parameters})}else if(mode==='local')window.dispatchEvent(new CustomEvent('tw-measurement-local',{detail:e}));else if(e.attempts<2)queue.push(e)}catch{if(e.attempts<2)queue.push(e)}}}
export function initializeGoogle(){if(collectionEligibility!=='eligible'||mode!=='google'||consent!=='granted')return
 (window as any).__twMeasurementConsent=true;
 (window as any)['ga-disable-'+gid]=false
 ;(window as any).__twMeasurementGoogle?.('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'})
 if(document.getElementById('tw-measurement-gtm'))return
 const layer:any[]=(window as any).twMeasurementLayer=[];layer.push(['consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);layer.push(['consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);layer.push({'gtm.start':Date.now(),event:'gtm.js'})
 const script=document.createElement('script');script.id='tw-measurement-gtm';script.async=true;script.src='https://www.googletagmanager.com/gtm.js?id='+gtm+'&l=twMeasurementLayer';document.head.appendChild(script)
}
export function safePage(path:string){if(path==='/checkout')return '/checkout';if(/^\/(payments|commercial)\/[0-9a-f-]{36}$/i.test(path))return '/'+path.split('/')[1]+'/:id'
if(!/^\/(en|es)(\/|$)/.test(path)||/[?#@%]/.test(path))return '/protected'
 if(/auth|callback|reset|login|saved-analysis|analisis-guardado|market-hub|centro-de-mercado/.test(path))return path.startsWith('/es')?'/es/centro-de-mercado':'/en/market-hub'
 return path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,':id')}

export function emit<N extends EventName>(name:N,parameters:EventPayloads[N],dedup:string){return send(name,parameters,dedup,'browser')}
export function emitAcknowledged<N extends 'tw_save_change'|'tw_analysis_save'>(name:N,parameters:EventPayloads[N],dedup:string){return send(name,parameters,dedup,'server')}

// Only server-produced action metadata enters this relay; payment/entitlement
// conversions remain excluded until their durable authority contract is resolved.
export function emitActionReceipt(event:Projection,signal:ObservationSignal){
 try{
  if(!['tw_authorization','tw_execution_result','tw_report_retrieve','begin_checkout'].includes(event.name)||
   consent!=='granted'||epoch!==signal.epoch||page!==signal.page||Date.now()<signal.at||Date.now()-signal.at>600000)return false
  const p=event.parameters
  if(p.consent_epoch!==epoch||p.page_instance!==page||p.locale!==signal.locale||p.environment!==signal.environment||
   p.environment!==measurementEnvironment())return false
  if(journeyEnabled&&profile==='basic'&&admit(event.name,p as EventPayloads[typeof event.name],'server'))recordJourney('tw_product_action',p,'server_response_'+event.name,event.name==='begin_checkout'?'checkout':event.name==='tw_report_retrieve'?'report':'execution',p.outcome==='rejected'?'denied':p.outcome==='failure'?'failed':'acknowledged')
  return send(event.name,p as EventPayloads[typeof event.name],'action:'+signal.request+':'+event.name,'server')
 }catch{return false}
}

export function recordDiscovery(value:Parameters<typeof noteDiscovery>[0]){if(profile!=='basic'&&mode!=='off'&&consent==='granted')noteDiscovery(value)}

export function serverSignal(locale:'en'|'es'){
 if(profile==='basic'&&!journeyEnabled||collectionEligibility!=='eligible')return undefined
 if(collectionEligibility!=='eligible'||!sourceReady()||mode==='off'||consent!=='granted')return undefined
 return {consent:'granted' as const,epoch,page,request:'r'+id(),at:Date.now(),locale,environment:measurementEnvironment(),...(journeyProof()?{journey:journeyProof()}: {})}
}

export function reconcileStoredRejection(){if(profile!=='basic'||consent==='denied')return;try{if(localStorage.getItem(consentKey)==='denied')choose('denied')}catch{}}

export function measurementLocale(path:string,search:string):'en'|'es'{if(/^\/es(?:\/|$)/.test(path))return 'es';if(/^\/en(?:\/|$)/.test(path))return 'en';return new URLSearchParams(search).get('lang')==='es'?'es':'en'}

export function reconcileJourneyExpiry(){if(journeyEnabled&&consent==='granted'&&!journeyHasConsent())choose('unknown')}
