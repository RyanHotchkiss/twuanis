type Props={lang:'en'|'es';analytical?:boolean;unavailable?:boolean}
export default function ListingDetailLoading({lang,analytical=false,unavailable=false}:Props){
 const text=unavailable?(lang==='es'?'La inteligencia de la propiedad no está disponible en este momento.':'Listing intelligence is currently unavailable.'):lang==='es'?(analytical?'Cargando inteligencia de la propiedad…':'Cargando propiedad…'):(analytical?'Loading listing intelligence…':'Loading property…')
 return <section data-listing-loading={unavailable?'unavailable':analytical?'intelligence':'property'} role="status" aria-live="polite" aria-atomic="true" style={{padding:analytical||unavailable?'1.5rem 0':'2rem',color:'var(--foreground)',background:'var(--background)',minHeight:analytical||unavailable?undefined:'12rem'}}><p>{text}</p></section>
}
