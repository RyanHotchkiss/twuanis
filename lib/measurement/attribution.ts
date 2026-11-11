// Fixed acquisition classes only. No URL, click ID, free campaign text or account key is persisted.
export type Acquisition={source:'google'|'direct'|'referral'|'campaign';medium:'organic'|'none'|'referral'|'campaign';at:number}
type Context={first:Acquisition;session:Acquisition;last:number}
const key='tw_measurement_acquisition_v1'
function valid(x:Acquisition|undefined){return !!x&&['google','direct','referral','campaign'].includes(x.source)&&['organic','none','referral','campaign'].includes(x.medium)&&Number.isFinite(x.at)}
export function acquisition(href:string,referrer:string,now=Date.now()):Context{
 const u=new URL(href);let host='';try{host=new URL(referrer).hostname}catch{}
 const entry:Acquisition=u.searchParams.has('utm_source')?{source:'campaign',medium:'campaign',at:now}:host==='www.google.com'||host==='google.com'?{source:'google',medium:'organic',at:now}:host&&host!==u.hostname?{source:'referral',medium:'referral',at:now}:{source:'direct',medium:'none',at:now}
 let old:Context|null=null;try{old=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 const current={first:valid(old?.first)&&now-old!.first.at<=30*86400000?old!.first:entry,session:old&&valid(old.session)&&now-old.last<1800000?old.session:entry,last:now}
 try{localStorage.setItem(key,JSON.stringify(current))}catch{}return current
}
export function noteActivity(now=Date.now()){try{const v=JSON.parse(sessionStorage.getItem(launchKey)||'null');if(v&&now>=v.last&&now-v.last<1800000){const valid=approvedLaunchCampaign('https://twuanis.com/?utm_source='+v.source+'&utm_medium='+v.medium+'&utm_campaign='+v.campaign+'&utm_content='+v.content,now);if(valid)sessionStorage.setItem(launchKey,JSON.stringify(valid))}}catch{}if(discoveryAt&&now-discoveryAt<1800000)discoveryAt=now;try{const old=JSON.parse(localStorage.getItem(key)||'null');if(old&&now-old.last<1800000){old.last=now;localStorage.setItem(key,JSON.stringify(old))}}catch{}}
export function clearAcquisition(preserveLaunch=false){if(!preserveLaunch){try{sessionStorage.removeItem(launchKey)}catch{}}try{localStorage.removeItem(key)}catch{}}
let discovery:'marketplace_search'|'related_property'|'saved_property'|'market_hub'|'knowledge'|'intelligence_report'|'unknown'='unknown'
let discoveryAt=0
export function noteDiscovery(value:typeof discovery){discovery=value;discoveryAt=Date.now()}
export function internalDiscovery(){return Date.now()-discoveryAt<1800000?discovery:'unknown'}
export function clearDiscovery(){discovery='unknown';discoveryAt=0}

// Finite public launch codes only: never addresses, recipient IDs or arbitrary URL text.
const launchKey='tw_measurement_launch_campaign_v1'
export const launchContents=['home','properties','intelligence','packages','footer'] as const
type LaunchContent=typeof launchContents[number]
type LaunchCampaign={source:'twuanis';medium:'email';campaign:'twuanis_launch_20261030';content:LaunchContent;last:number}
export function approvedLaunchCampaign(href:string,now=Date.now()):LaunchCampaign|null{
 try{const u=new URL(href);if(!['https://twuanis.com','https://www.twuanis.com'].includes(u.origin)&&!['localhost','127.0.0.1'].includes(u.hostname))return null
  if(u.searchParams.get('utm_source')!=='twuanis'||u.searchParams.get('utm_medium')!=='email'||u.searchParams.get('utm_campaign')!=='twuanis_launch_20261030')return null
  const content=u.searchParams.get('utm_content') as LaunchContent;if(!launchContents.includes(content))return null
  if(['utm_source','utm_medium','utm_campaign','utm_content'].some(k=>u.searchParams.getAll(k).length!==1))return null
  return {source:'twuanis',medium:'email',campaign:'twuanis_launch_20261030',content,last:now}
 }catch{return null}
}
export function launchPageLocation(href:string,safePath:string,now=Date.now()){
 const u=new URL(href);let campaign=approvedLaunchCampaign(href,now)
 try{if(!campaign){const prior=JSON.parse(sessionStorage.getItem(launchKey)||'null');if(prior&&Number.isFinite(prior.last)&&now>=prior.last&&now-prior.last<1800000)campaign=approvedLaunchCampaign('https://twuanis.com/?utm_source='+prior.source+'&utm_medium='+prior.medium+'&utm_campaign='+prior.campaign+'&utm_content='+prior.content,now)}if(campaign)sessionStorage.setItem(launchKey,JSON.stringify(campaign));else sessionStorage.removeItem(launchKey)}catch{}
 const out=new URL(safePath,u.origin);if(campaign){out.searchParams.set('utm_source',campaign.source);out.searchParams.set('utm_medium',campaign.medium);out.searchParams.set('utm_campaign',campaign.campaign);out.searchParams.set('utm_content',campaign.content)}return out.href
}
export function safeLaunchPageLocation(value:string,isolated=false){
 try{const u=new URL(value);return (['https://twuanis.com','https://www.twuanis.com'].includes(u.origin)||isolated&&['localhost','127.0.0.1'].includes(u.hostname))&&(/^\/(en|es)(\/|$)/.test(u.pathname)||['/protected','/checkout','/payments/:id','/commercial/:id'].includes(u.pathname))&&!/auth|callback|reset|login|saved-analysis|analisis-guardado/.test(u.pathname)&&!u.hash&&!/%|@/.test(u.pathname)&&!/[0-9a-f]{8}-[0-9a-f-]{27}/i.test(u.pathname)&&!!approvedLaunchCampaign(value)&&u.searchParams.size===4}catch{return false}
}
