type ListingAttributionProps = {
  language: 'en' | 'es'
  agencyLogoUrl?: string | null
  agencyName?: string | null
  listingAgentPhotoUrl?: string | null
  listingAgentName?: string | null
}

export default function ListingAttribution({
  language,
  agencyLogoUrl,
  agencyName,
  listingAgentPhotoUrl,
  listingAgentName
}: ListingAttributionProps) {
  const agency = agencyLogoUrl || agencyName
  const agent = listingAgentPhotoUrl || listingAgentName
  if (!agency && !agent) return null

  return <section aria-label={language === 'es' ? 'Información del anunciante' : 'Listing attribution'} style={{display:'grid',gap:'.65rem',marginBottom:'1rem',padding:'.75rem',border:'1px solid var(--border)',borderRadius:'.9rem',background:'color-mix(in srgb, var(--surface) 88%, transparent)'}}>
    {agency && <div style={{display:'flex',alignItems:'center',gap:'.65rem',minWidth:0}}>
      {agencyLogoUrl && <span style={{width:'2.35rem',height:'2.35rem',flex:'0 0 2.35rem',borderRadius:'999px',overflow:'hidden',background:'#fff',display:'grid',placeItems:'center',border:'1px solid var(--border)'}}><img src={agencyLogoUrl} alt={agencyName || (language === 'es' ? 'Logo de la agencia' : 'Agency logo')} referrerPolicy="no-referrer" style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}} /></span>}
      <span style={{minWidth:0,display:'grid',gap:'.1rem'}}><span style={{fontSize:'.72rem',letterSpacing:'.07em',textTransform:'uppercase',color:'var(--muted)'}}>{language === 'es' ? 'Agencia' : 'Agency'}</span>{agencyName && <strong style={{overflowWrap:'anywhere'}}>{agencyName}</strong>}</span>
    </div>}
    {agent && <div style={{display:'flex',alignItems:'center',gap:'.65rem',minWidth:0}}>
      {listingAgentPhotoUrl && <img src={listingAgentPhotoUrl} alt={listingAgentName || (language === 'es' ? 'Agente del anuncio' : 'Listing agent')} referrerPolicy="no-referrer" style={{width:'2.35rem',height:'2.35rem',flex:'0 0 2.35rem',borderRadius:'999px',objectFit:'cover',border:'1px solid var(--border)',background:'#fff'}} />}
      <span style={{minWidth:0,display:'grid',gap:'.1rem'}}><span style={{fontSize:'.72rem',letterSpacing:'.07em',textTransform:'uppercase',color:'var(--muted)'}}>{language === 'es' ? 'Agente' : 'Listing agent'}</span>{listingAgentName && <strong style={{overflowWrap:'anywhere'}}>{listingAgentName}</strong>}</span>
    </div>}
  </section>
}
