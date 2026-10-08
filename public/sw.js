// No caching/offline changes. Unbound legacy payloads are intentionally suppressed.
self.addEventListener('push', event => {
 event.waitUntil((async()=>{
  try{
   const payload=event.data?.json();
   if(!payload||typeof payload.recipient!=='string'||typeof payload.subscriptionHash!=='string')return;
   const subscription=await self.registration.pushManager.getSubscription();if(!subscription)return;
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(subscription.endpoint))),b=>b.toString(16).padStart(2,'0')).join('');
   if(hash!==payload.subscriptionHash)return;
   const response=await fetch('/api/push/delivery',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:subscription.endpoint,recipient:payload.recipient})});
   if(!response.ok||!(await response.json()).ok)return;
   // No external URL or arbitrary notification option can be supplied by a payload.
   const url=new URL(payload.url||'/en/market-hub',self.location.origin);if(url.origin!==self.location.origin||!['/en/market-hub','/es/centro-de-mercado'].includes(url.pathname))return;
   await self.registration.showNotification(typeof payload.title==='string'?payload.title.slice(0,120):'MarketHub',{body:typeof payload.message==='string'?payload.message.slice(0,1000):'',icon:'/icons/icon-192.png',badge:'/icons/badge-72.png',data:{url:url.pathname}});
  }catch{/* Missing auth, network uncertainty or invalid payload never displays private content. */}
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const url=new URL(event.notification.data?.url||'/en/market-hub',self.location.origin);if(url.origin!==self.location.origin||!['/en/market-hub','/es/centro-de-mercado'].includes(url.pathname))return;const windows=await clients.matchAll({type:'window',includeUncontrolled:true});const existing=windows.find(c=>c.url===url.href);if(existing)await existing.focus();else await clients.openWindow(url.pathname)})())});
