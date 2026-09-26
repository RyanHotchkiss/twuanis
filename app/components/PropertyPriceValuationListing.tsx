import Link from 'next/link'
export default function PropertyPriceValuationListing({listingId,lang}:{listingId:string;lang:'en'|'es'}){
 return <section className="my-4 border-t py-4"><Link className="underline" href={`/${lang}/property-price-valuation?listingId=${encodeURIComponent(listingId)}`}>{lang==='es'?'Valoración del precio de la propiedad':'Property Price Valuation'}</Link><p>{lang==='es'?'Compare el precio solicitado con propiedades comparables.':'Compare this asking price with comparable properties.'}</p></section>
}
