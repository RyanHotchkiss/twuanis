'use client'
import {useEffect,useState} from 'react'
import type {AdministrativeAuthority} from '@/lib/administrative-control'
import {adminWorkspaces,adminLabels,type AdminLanguage,type AdminWorkspace} from './admin-contract'
import './admin.css'
import AdminListings from './AdminListings'
import AdminOverview from './AdminOverview'
import AdminPackages from './AdminPackages'
import AdminAddons from './AdminAddons'
import AdminOffers from './AdminOffers'
import AdminPromotions from './AdminPromotions'
import AdminOrders from './AdminOrders'
import AdminPayments from './AdminPayments'
import AdminEntitlements from './AdminEntitlements'
export default function AdminHub({authority}:{authority:AdministrativeAuthority|null}) {
 const [language,setLanguage]=useState<AdminLanguage>('en')
 const [workspace,setWorkspace]=useState<AdminWorkspace>('overview')
 useEffect(()=>{
  const sync=()=>{const p=new URLSearchParams(location.search);const w=p.get('workspace');setWorkspace(adminWorkspaces.includes(w as AdminWorkspace)?w as AdminWorkspace:'overview');setLanguage(p.get('lang')==='es'?'es':'en')}
  sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync)
 },[])
 function navigate(w:AdminWorkspace,l:AdminLanguage=language){if(w!==workspace&&!window.dispatchEvent(new Event('admin-leave',{cancelable:true})))return;const url=new URL(location.href);url.searchParams.set('workspace',w);url.searchParams.set('lang',l);history.pushState(null,'',url);setWorkspace(w);setLanguage(l)}
 const t=adminLabels[language]
 return <main className="admin-hub">
  <header><a href={language==='es'?'/es':'/en'}>TWUANIS</a><h1>{t.title}</h1><label><span className="sr-only">Language / Idioma</span><select value={language} onChange={e=>navigate(workspace,e.target.value as AdminLanguage)}><option value="en">English</option><option value="es">Español</option></select></label></header>
  {!authority?<p role="alert">{t.denied}</p>:<div className="admin-layout">
   <nav aria-label={t.navigation}>{adminWorkspaces.map(w=><button key={w} aria-current={workspace===w?'page':undefined} onClick={()=>navigate(w)}>{t[w]}</button>)}</nav>
   <section className="admin-workspace" aria-labelledby="admin-workspace-title"><h2 id="admin-workspace-title">{t[workspace]}</h2>
    {workspace==='overview'?<>{authority.permissions.includes('listings.read')&&<AdminOverview language={language}/>}<p>{t.account}: <code>{authority.actorId}</code></p><h3>{t.permissions}</h3><ul>{authority.permissions.map(p=><li key={p}><code>{p}</code></li>)}</ul></>:workspace==='listings'?(authority.permissions.includes('listings.read')?<AdminListings language={language} manage={authority.permissions.includes('listings.manage')}/>:<p>{t.listingAccess}</p>):workspace==='packages'?(authority.permissions.includes('packages.read')?<AdminPackages language={language} manage={authority.permissions.includes('packages.manage')}/>:<p>{language==='es'?'Se requiere permiso de lectura de paquetes.':'Package read permission is required.'}</p>):workspace==='addons'?(authority.permissions.includes('addons.read')?<AdminAddons language={language} manage={authority.permissions.includes('addons.manage')}/>:<p>{language==='es'?'Se requiere permiso de lectura de complementos.':'Add-on read permission is required.'}</p>):workspace==='offers'?(authority.permissions.includes('offers.read')?<AdminOffers language={language} manage={authority.permissions.includes('offers.manage')}/>:<p>{language==='es'?'Se requiere permiso de lectura de ofertas.':'Offer read permission is required.'}</p>):workspace==='promotions'?(authority.permissions.includes('promotions.read')?<AdminPromotions language={language} manage={authority.permissions.includes('promotions.manage')}/>:<p>{language==='es'?'Se requiere permiso de lectura de promociones.':'Promotions read permission is required.'}</p>):workspace==='orders'?(authority.permissions.includes('orders.read')?<AdminOrders language={language}/>:<p>{language==='es'?'Se requiere permiso de lectura de pedidos.':'Orders read permission is required.'}</p>):workspace==='payments'?(authority.permissions.includes('payments.read')?<AdminPayments language={language} review={authority.permissions.includes('payments.review')}/>:<p>{language==='es'?'Se requiere permiso de lectura de pagos.':'Payment read permission is required.'}</p>):workspace==='entitlements'?(authority.permissions.includes('entitlements.read')?<AdminEntitlements language={language} manage={authority.permissions.includes('entitlements.manage')} owner={authority.owner}/>:<p>{language==='es'?'Se requiere permiso de lectura de derechos.':'Entitlements read permission is required.'}</p>):<p>{t.future}</p>}
   </section>
  </div>}
 </main>
}
