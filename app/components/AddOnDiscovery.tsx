import Link from 'next/link'
import AddonCard from './AddonCard'
import { commercialCatalog } from '@/app/commercial/actions'
import './customer-commercial.css'


export async function readAddOnDiscoverySections({language}:{language:'en'|'es'}){
  const [data,crc]=await Promise.all([commercialCatalog('addon','USD'),commercialCatalog('addon','CRC')])
  return {addOns:<AddOnDiscoveryContent language={language} data={data} crc={crc}/>,founding:<AddOnDiscoveryContent language={language} data={data} crc={crc} founding/>}
}
export default async function AddOnDiscovery(props:{language:'en'|'es'}){return (await readAddOnDiscoverySections(props)).addOns}
function AddOnDiscoveryContent({language,data,crc,founding=false}:{language:'en'|'es';data:Awaited<ReturnType<typeof commercialCatalog>>;crc:Awaited<ReturnType<typeof commercialCatalog>>;founding?:boolean}){
  const es = language === 'es', t = (en: string, sp: string) => es ? sp : en
  const hub = es ? '/es/centro-de-mercado?workspace=commercial' : '/en/market-hub?workspace=commercial'
  return <section className="customer-commercial" aria-labelledby={founding?"founding-membership-title":"add-on-discovery-title"}>
    <h2 id={founding?"founding-membership-title":"add-on-discovery-title"} className="intelligence-packages-heading">{founding?t('Founding Membership','Membresía de fundador'):t('Listing Add-on Packages', 'Paquetes complementarios para anuncios')}</h2>
    {!founding&&<p>{t('Separate from Intelligence Packages. Listing add-ons require an eligible listing owned by your account; availability is checked in MarketHub before an order is created.', 'Son independientes de los Paquetes de inteligencia. Los complementos para anuncios requieren un anuncio elegible de su cuenta; el Centro del Mercado verifica la disponibilidad antes de crear un pedido.')}</p>}
    {!data.ok || !crc.ok ? <p role="alert">{t('Add-on prices are temporarily unavailable.', 'Los precios de los complementos no están disponibles temporalmente.')}</p> : <>
      {(founding?['account'] as const:['listing'] as const).map(group=><div key={group}>
      {!founding&&<h3 className="addon-group">{group==='account'?t('Account and Publishing Add-ons','Complementos para cuentas y publicación'):t('Listing Promotion Add-ons','Complementos de promoción de anuncios')}</h3>}
      <div className="commercial-grid">{data.products.filter(p=>p.id!=='addon-bulk-listing-import').filter(p=>founding?p.id==='addon-2026-founding-membership':p.id!=='addon-2026-founding-membership').filter(p=>group==='listing'?p.target==='listing':p.target!=='listing').sort((a,b)=>{const priority:Record<string,number>={'addon-homepage-background':0,'addon-homepage-exposure':1,'addon-homepage-exposure-rent':2,'addon-featured-listing':3,'addon-featured-listing-rent':4};return (priority[a.id]??5)-(priority[b.id]??5)}).map(p => {
        const local = crc.products.find(x => x.id === p.id)
        return <AddonCard key={p.id} product={p} usd={p.pricing} crc={local?.pricing} language={language}>
          {p.id==='addon-homepage-background'?<p>{t('Purchases remain unavailable until inventory capacity and rotation rules are approved. One calendar month; no automatic renewal.','Las compras seguirán desactivadas hasta aprobar la capacidad y las reglas de rotación. Un mes calendario; sin renovación automática.')}</p>:p.target === 'listing' ? <><p>{t('For your own eligible listing. Purchase does not guarantee placement until fulfillment succeeds.', 'Para un anuncio elegible de su cuenta. La compra no garantiza posicionamiento hasta que la entrega se complete.')}</p><Link className="addon-action" href={hub+'&commercial='+(p.target==='listing'?'listings':p.target==='account'?'founder':'bulk')}>{t('Choose a listing in MarketHub', 'Elegir un anuncio en el Centro del Mercado')}</Link></> : <><p>{t('Review eligibility and acquisition in MarketHub.', 'Revise la elegibilidad y adquisición en el Centro del Mercado.')}</p><Link className="addon-action" href={hub+'&commercial='+(p.target==='listing'?'listings':p.target==='account'?'founder':'bulk')}>{t('View commercial options', 'Ver opciones comerciales')}</Link></>}
        </AddonCard>
      })}</div></div>)}
      {!founding&&data.next && <p>{t('More add-ons are available in MarketHub.', 'Hay más complementos disponibles en el Centro del Mercado.')}</p>}
    </>}
  </section>
}
