'use client'
const receiptKey='twuanis.push.registration.v1'
export type PushStatus='unsupported'|'unavailable'|'permission'|'denied'|'off'|'active'|'cleanup'|'error'
export function canCreatePushSubscription(){return !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
function idleStatus():PushStatus{return !canCreatePushSubscription()?'unavailable':Notification.permission==='denied'?'denied':Notification.permission==='default'?'permission':'off'}
function supported(){return typeof window!=='undefined'&&window.isSecureContext&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function remember(id:string|null){try{if(id)localStorage.setItem(receiptKey,id);else localStorage.removeItem(receiptKey)}catch{/* Browser evidence still determines this visit. */}}
function remembered(){try{return localStorage.getItem(receiptKey)}catch{return null}}
async function current(){const registration=await navigator.serviceWorker.getRegistration('/sw.js');return (await registration?.pushManager.getSubscription())??null}
async function command(op:'state'|'subscribe'|'unsubscribe',data:unknown){const r=await fetch('/api/push/'+op,{method:op==='unsubscribe'?'DELETE':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});const result=await r.json();if(!r.ok||!result.ok)throw Error('push_unavailable');return result as {ok:true;active:boolean;registration:string|null}}
export async function inspectPush():Promise<PushStatus>{
 if(!supported())return 'unsupported'
 try{const sub=await current();if(sub){const server=await command('state',{endpoint:sub.endpoint});remember(server.registration);if(server.active){if(Notification.permission==='granted')return 'active';await command('unsubscribe',{endpoint:sub.endpoint});return 'cleanup'}return 'cleanup'}
  const id=remembered();if(id){await command('unsubscribe',{registration:id});remember(null)}
  return idleStatus()
 }catch{return 'error'}
}
export async function subscribeToPush():Promise<PushStatus>{
 if(!supported())return 'unsupported'
 if(!canCreatePushSubscription())return 'unavailable'
 // Permission is requested immediately in the explicit click call, before awaiting other work.
 if(Notification.permission==='denied')return 'denied'
 if(Notification.permission!=='granted'){const permission=await Notification.requestPermission();if(permission!=='granted')return permission==='denied'?'denied':'permission'}
 try{let sub=await current();if(!sub){const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!key)throw Error('push_configuration');const bytes=Uint8Array.from(atob(key.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(key.length/4)*4,'=')),c=>c.charCodeAt(0));const registration=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes})}
  const value=sub.toJSON();const server=await command('subscribe',{endpoint:sub.endpoint,keys:value.keys});remember(server.registration);return server.active?'active':'error'
 }catch{return 'error'}
}
export async function unsubscribeFromPush():Promise<PushStatus>{
 if(!supported())return 'unsupported'
 try{const sub=await current(),id=remembered();if(sub){await command('unsubscribe',{endpoint:sub.endpoint});try{if(!await sub.unsubscribe()&&await current())return 'cleanup'}catch{return 'cleanup'}}else if(id)await command('unsubscribe',{registration:id});remember(null);return idleStatus()}catch{return 'error'}
}
