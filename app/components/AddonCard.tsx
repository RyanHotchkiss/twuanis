import { promotionalDeadline } from '@/lib/promotional-deadline'
import type {ReactNode} from 'react'
import type {commercialCatalog} from '@/app/commercial/actions'
import './addon-card.css'
type Product=Extract<Awaited<ReturnType<typeof commercialCatalog>>,{ok:true}>['products'][number]
export const addonAccents:Record<string,string>={
 'addon-2026-founding-membership':'emerald','addon-bulk-listing-import':'teal',
 'addon-homepage-background':'cyan',
 'addon-homepage-exposure-rent':'teal','addon-featured-listing-rent':'coral',
 'addon-featured-listing':'orange','addon-homepage-exposure':'yellow',
 'addon-listing-boost':'coral','addon-property-type-exposure':'lime','addon-province-exposure':'cyan'
}
const purposes: Record<string, [string, string]> = {
  featured_collection: ['Placement in the featured listing collection.', 'Presencia en la colección de anuncios destacados.'],
  priority_over_organic: ['Priority placement above organic listings.', 'Posicionamiento prioritario sobre los anuncios orgánicos.'],
  homepage_carousel: ['One full-width homepage listing, rotating with other eligible purchased placements, subject to capacity.', 'Un anuncio de ancho completo en la página de inicio, en rotación con otras ubicaciones compradas elegibles, sujeto a capacidad.'],
  province_contextual_priority: ['Priority placement within the listing’s province.', 'Posicionamiento prioritario en la provincia del anuncio.'],
  property_type_contextual_priority: ['Priority placement for the listing’s property type.', 'Posicionamiento prioritario para el tipo de propiedad del anuncio.'],
  bulk_import_job: ['Import a batch of listings in one operation. The quantity tier applies to the whole job.', 'Importe un lote de anuncios en una operación. El tramo de cantidad se aplica al trabajo completo.'],
  founding_pricing_entitlement: ['Lifetime price protection under the membership’s recorded policy version; products remain paid.', 'Protección de precios de por vida según la versión registrada de la membresía; los productos siguen siendo de pago.'],
}

export function AddonCardFrame({id,title,draft=false,children}:{id:string;title:string;draft?:boolean;children:ReactNode}){return <article className="addon-card" data-accent={addonAccents[id]} data-addon-id={draft?undefined:id} data-addon-draft-id={draft?id:undefined}><h3>{title}</h3>{children}</article>}

export default function AddonCard({product:p,usd,crc,language,children,displayTitle}:{product:Product;usd:Product['pricing'];crc:Product['pricing'];language:'en'|'es';children?:ReactNode;displayTitle?:string}){
 const es=language==='es',t=(en:string,sp:string)=>es?sp:en
 const local={pricing:crc};p={...p,pricing:usd}
 const price=(value:unknown,currency:'USD'|'CRC')=>value===null||value===undefined?'—':new Intl.NumberFormat(es?'es-CR':'en-US',{style:'currency',currency,currencyDisplay:'narrowSymbol',minimumFractionDigits:currency==='CRC'?0:2,maximumFractionDigits:currency==='CRC'?0:2}).format(Number(value))
        const description = (es ? p.descriptionES : p.descriptionEN) || purposes[p.behavior]?.[es ? 1 : 0]
        const tiers = p.pricing.tiers as { min: number; max: number; standardRate: string; effectiveRate: string; source: string;offerEnd?:string }[] | undefined
        const deadline=p.pricing.offerEnd??tiers?.find(x=>x.offerEnd)?.offerEnd
        const until=(value:string)=>new Intl.DateTimeFormat(es?'es-CR':'en-US',{dateStyle:'long',timeZone:'America/Costa_Rica'}).format(new Date(new Date(value).getTime()-((p.behavior==='featured_collection'||p.id==='addon-homepage-background')?1:0)))
        const discount=p.id!=='addon-2026-founding-membership'&&p.pricing.source==='OFFER'&&Number(p.pricing.effectivePrice)<Number(p.pricing.standardPrice)

 return <AddonCardFrame id={p.id} title={displayTitle||(es ? p.nameES : p.nameEN)}>


          {description && <p>{description}</p>}
          {p.termUnit==='month' && p.termQuantity && <p className="addon-duration">{p.termQuantity} {t('calendar month from successful fulfillment','mes calendario desde la entrega efectiva')}</p>}
          {p.durationDays && <p className="addon-duration">{p.durationDays} {t('days from successful fulfillment', 'días desde la entrega efectiva')}</p>}
          {p.termKind === 'lifetime' && <p className="addon-duration">{t('Lifetime account benefit', 'Beneficio de por vida para la cuenta')}</p>}
          <div className="addon-pricing">
          {tiers?.length ? <table className="addon-tiers"><caption>{t('Whole-job price per accepted listing','Precio del trabajo completo por anuncio aceptado')}</caption><thead><tr><th>{t('Listings','Anuncios')}</th>{(es?['CRC','USD']:['USD','CRC']).map(code=><th key={code}>{code}</th>)}</tr></thead><tbody>{tiers.map(tier=><tr key={tier.min}><td>{tier.min}–{tier.max}</td>{(es?['CRC','USD']:['USD','CRC']).map(code=>{const q=code==='USD'?tier:local?.pricing.tiers?.find((x:{min:number})=>x.min===tier.min);return <td key={code}>{q?.source==='OFFER'&&Number(q.effectiveRate)<Number(q.standardRate)&&<del>{price(q.standardRate,code as 'USD'|'CRC')}</del>} <strong className="addon-tier-price">{price(q?.effectiveRate,code as 'USD'|'CRC')}</strong></td>})}</tr>)}</tbody></table> : <>
            <div className="addon-standard" hidden={p.id==='addon-2026-founding-membership'}>{t('Standard price', 'Precio estándar')}: {discount?<del>{(es?['CRC','USD']:['USD','CRC']).map(code=><span key={code}>{price(code==='USD'?p.pricing.standardPrice:local?.pricing.standardPrice,code as 'USD'|'CRC')} </span>)}</del>:<>{(es?['CRC','USD']:['USD','CRC']).map(code=><span key={code}>{price(code==='USD'?p.pricing.standardPrice:local?.pricing.standardPrice,code as 'USD'|'CRC')} </span>)}</>}</div>
            <div className="addon-price-label">{discount?t('Current offer','Oferta actual'):t('Current price','Precio actual')}</div>
            <div className="addon-current">{(es?['CRC','USD']:['USD','CRC']).map(code=><div key={code}>{price(code==='USD'?(p.pricing.effectivePrice??p.pricing.standardPrice):(local?.pricing.effectivePrice??local?.pricing.standardPrice),code as 'USD'|'CRC')}</div>)}</div>
          </>}
          {deadline&&(p.id==='addon-2026-founding-membership'?<p className="addon-deadline">{es?'La adquisición finaliza el ':'Acquisition ends: '}{until(deadline)}</p>:<div className="addon-deadline"><p>{promotionalDeadline(deadline,language)?.offerEnds}</p><p>{promotionalDeadline(deadline,language)?.standardStarts}</p></div>)}
          </div>
{children}</AddonCardFrame>
}
