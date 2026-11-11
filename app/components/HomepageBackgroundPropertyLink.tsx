import Link from 'next/link'
import {listingHref} from '@/lib/listing-route'
import {presentHomepageBackground,type HomepageBackgroundPlacement} from '@/lib/homepage-background-product'
export default function HomepageBackgroundPropertyLink({placement,language,faded}:{placement:HomepageBackgroundPlacement|null;language:'en'|'es';faded:boolean}){
 const background=presentHomepageBackground(placement)
 if(!background)return null
 return <Link data-homepage-background-property data-faded={faded} className="homepage-background-promotion homepage-background-property" href={listingHref(background.listingId,background.transaction,language)}>{language==='es'?'Ver propiedad del fondo':'View Background Property'}</Link>
}
