"use client"
import {productAction} from '@/lib/measurement/journey-client'
import {bathroomPresentation} from '@/lib/bathroom-presentation'

import {useRef,useState} from 'react'
import {PropertyAuthenticationRequired,propertySignIn,propertyInteractionMessage} from '@/lib/property-interaction-errors'

import Link from 'next/link'
import {Heart} from 'lucide-react'
import {useCarouselSlideActive} from './StableCarouselFrame'
import {useListingMeasurement} from '../measurement/useListingMeasurement'
import {recordDiscovery as noteDiscovery} from '@/lib/measurement/runtime'
import {context,emit,interactionKey} from '@/lib/measurement/runtime'
import { bankPath, exactMoney } from '@/lib/remates/public-types'
import { listingHref } from '@/lib/listing-route'

type PropertyCardProps = {
  spotlight?: boolean
  spotlightContactHref?: string
  placementKind?: 'paid' | 'demonstration'
  prefetchListing?: boolean
  imageLoading?: 'eager' | 'lazy'
  property: any

  theme:
    | 'dark'
    | 'light'

  transactionType:
    | 'buy'
    | 'rent'

  language?:
    | 'en'
    | 'es'

  isFavorite:
    boolean

  isSelected:
    boolean

  compareDisabled:
    boolean

  onToggleFavorite:
    () => void | Promise<void>

  onToggleCompare:
    () => void
}

export default function PropertyCard({
  spotlight = false,
  spotlightContactHref,
  placementKind,
  prefetchListing = true,
  imageLoading = 'eager',
  property,
  transactionType,
  language = 'en',
  theme,
  isFavorite,
  isSelected,
  compareDisabled,
  onToggleFavorite,
  onToggleCompare
}: PropertyCardProps) {

  const favoriteLock=useRef(false)
  const [favoritePending,setFavoritePending]=useState(false)
  const [favoriteError,setFavoriteError]=useState('')
  const bank = property.market === 'remates'
  const carouselActive=useCarouselSlideActive()
  const measurementRef=useListingMeasurement(String(property.id),language,bank?'bank':'private','exposure','self',placementKind!=='demonstration'&&carouselActive)
  compareDisabled = compareDisabled || bank
  const noImageLabel =
    language === 'es'
      ? 'Sin Imagen'
      : 'No Image'

  const selectedLabel =
    language === 'es'
      ? 'Seleccionado'
      : 'Selected'

  const compareLabel =
    language === 'es'
      ? '+ Comparar'
      : '+ Compare'

  const bedsLabel =
    language === 'es'
      ? 'Hab.'
      : 'Beds'

  const bathsLabel =
    language === 'es'
      ? 'Baños'
      : 'Baths'

  const parkingLabel =
    language === 'es'
      ? 'Parqueo'
      : 'Parking'

  const constructionLabel =
    language === 'es'
      ? 'Construcción'
      : 'Construction'

  const agencyLogoUrl =
    typeof property.agency_logo_url === 'string' && property.agency_logo_url
      ? property.agency_logo_url
      : null

  const listingAgentPhotoUrl =
    typeof property.listing_agent_photo_url === 'string' && property.listing_agent_photo_url
      ? property.listing_agent_photo_url
      : null

  return (
    <Link data-placement-kind={placementKind} prefetch={prefetchListing} onClick={()=>noteDiscovery('marketplace_search')}
      href={bank ? `${bankPath(language)}/${property.id}` : listingHref(property.id, transactionType === 'rent' ? 'rent' : 'sale', language)}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        minWidth: 0
      }}
    >
      <article data-spotlight-card={spotlight||undefined} ref={measurementRef}
        style={{
          background:
          theme === 'dark'
              ? '#181818'
              : '#ffffff',

          border:
            theme === 'dark'
              ? '1px solid #222'
              : '1px solid rgba(0,0,0,.12)',

          color:
            theme === 'dark'
              ? '#ffffff'
              : '#111111',
          borderRadius: '22px',
          overflow: 'hidden',
          cursor: 'pointer',
          height: '100%'
        }}
      >
        {/* PROPERTY IMAGE */}
        <div data-spotlight-image={spotlight||undefined}
          style={{
            aspectRatio: '4 / 3',
            overflow: 'hidden',
            position: 'relative',
            background: '#111'
          }}
        >
          {Array.isArray(property.images) &&
          property.images[0] ? (
            <img
              loading={imageLoading}
              decoding="async"
              referrerPolicy="no-referrer"
              src={property.images[0]}
              alt={property.title || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                background:
                  'linear-gradient(135deg, #222 0%, #333 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#555',
                fontSize: '20px'
              }}
            >
              {noImageLabel}
            </div>
          )}

          {property.market === 'remates' && <>
            {property.images?.[0] && <div aria-hidden="true" data-bank-image-overlay style={{position:'absolute',inset:0,background:'rgba(240,242,243,0.22)',pointerEvents:'none'}} />}
            <span data-bank-ribbon style={{position:'absolute',top:12,left:12,padding:'6px 12px',borderRadius:6,background:'#f0f2f3',color:'#111',fontSize:13,fontWeight:700,pointerEvents:'none'}}>{language === 'es' ? 'Remate' : 'Bank Property'}</span>
          </>}

          {spotlight&&spotlightContactHref&&<button type="button" data-spotlight-whatsapp data-contact-href={spotlightContactHref} aria-label={language==='es'?'Contactar al anunciante por WhatsApp':'Contact advertiser on WhatsApp'} onClick={event=>{event.preventDefault();event.stopPropagation();productAction('seller_whatsapp','contact');window.open(spotlightContactHref,'_blank','noopener,noreferrer')}} style={{position:'absolute',left:16,top:16,width:44,height:44,borderRadius:999,border:'1px solid #ffffff',background:'#25D366',color:'#ffffff',display:'flex',alignItems:'center',justifyContent:'center',padding:0,zIndex:1}}>
           <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path vectorEffect="non-scaling-stroke" d="M20.5 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.3-4.5a8.5 8.5 0 1 1 16.2-4Z"/><path vectorEffect="non-scaling-stroke" d="m8 7 2 3-1 1c1 2 2 3 4 3l1-1 3 2c-1 3-4 2-7 0S6 8 8 7Z"/></svg>
          </button>}

          {agencyLogoUrl && <img
            src={agencyLogoUrl}
            alt={language === 'es' ? 'Logo de la agencia' : 'Agency logo'}
            referrerPolicy="no-referrer"
            style={{position:'absolute',top:'1rem',left:spotlight&&spotlightContactHref?'4.25rem':'1rem',width:'1.9rem',height:'1.9rem',objectFit:'contain',borderRadius:'.3rem',background:'rgba(255,255,255,.92)',padding:'.12rem',boxSizing:'border-box',zIndex:2}}
          />}

          {favoriteError&&<span role="alert" style={{position:'absolute',top:64,left:12,right:12,zIndex:21,background:'var(--surface)',color:'var(--foreground)',padding:8,borderRadius:8}}>{favoriteError}</span>}
          {/* FAVORITE */}
          <button disabled={favoritePending} aria-pressed={isFavorite}
            type="button"
            aria-label={
              isFavorite
                ? (language==='es'?'Quitar de favoritos':'Remove from favorites')
                : (language==='es'?'Agregar a favoritos':'Add to favorites')
            }
            onClick={async event => {
              event.preventDefault()
              event.stopPropagation()

              emit('tw_save_intent',{...context(language),listing_id:String(property.id),action:isFavorite?'remove':'save'},'save:'+interactionKey())
              if(favoriteLock.current)return
              favoriteLock.current=true;setFavoritePending(true);setFavoriteError('')
              try {await onToggleFavorite()} catch(error){setFavoriteError(propertyInteractionMessage(error,language));if(error instanceof PropertyAuthenticationRequired)propertySignIn(language)} finally {favoriteLock.current=false;setFavoritePending(false)}
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '2.75rem',
              height: '2.75rem',
              borderRadius: '999px',
              border:
                '1px solid rgba(255,255,255,.15)',
              background:
                'rgba(0,0,0,.55)',
              backdropFilter:
                'blur(8px)',
              WebkitBackdropFilter:
                'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 0,
              zIndex: 20
            }}
          >
            <Heart size={24} strokeWidth={0} fill={isFavorite?'#D4AF37':'#fff'} aria-hidden="true" style={{display:'block',flexShrink:0,transition:'fill .2s ease'}}/>
          </button>

          {listingAgentPhotoUrl && <img
            src={listingAgentPhotoUrl}
            alt={language === 'es' ? 'Agente de la propiedad' : 'Listing agent'}
            referrerPolicy="no-referrer"
            style={{position:'absolute',right:'1rem',bottom:'1rem',width:'1.9rem',height:'1.9rem',objectFit:'cover',borderRadius:'999px',border:'1px solid rgba(255,255,255,.85)',background:'#fff',zIndex:20}}
          />}

          {/* COMPARE */}
          <button
            type="button"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()

              onToggleCompare()
            }}
            disabled={compareDisabled}
            style={{
              position: 'absolute',
              left: '1rem',
              bottom: '1rem',
              zIndex: 20,

              border:
                isSelected
                  ? '1px solid #fff'
                  : '1px solid rgba(255,255,255,.25)',

              borderRadius:
                '999px',

              padding:
                '.55rem .8rem',

              background:
                isSelected
                  ? '#fff'
                  : 'rgba(0,0,0,.65)',

              color:
                isSelected
                  ? '#000'
                  : '#fff',

              backdropFilter:
                'blur(8px)',

              WebkitBackdropFilter:
                'blur(8px)',

              cursor:
                compareDisabled
                  ? 'not-allowed'
                  : 'pointer',

              fontSize:
                '.75rem',

              fontWeight:
                700,

              opacity:
                compareDisabled
                  ? 0.45
                  : 1
            }}
          >
            {isSelected
              ? selectedLabel
              : compareLabel}
          </button>
        </div>

        {/* PROPERTY CONTENT */}
        <div data-spotlight-details={spotlight||undefined} tabIndex={spotlight?0:undefined} role={spotlight?'region':undefined} aria-label={spotlight?(language==='es'?'Detalles de la propiedad':'Property details'):undefined}
          style={{
            padding: '1.25rem'
          }}
        >
          <h2
            style={{
              fontSize: '1.25rem',
              marginBottom: '.75rem'
            }}
          >
            {property.title}
          </h2>

          <p
            style={{
            color:
              theme === 'dark'
                ? '#888'
                : '#555',
              marginBottom: '16px'
            }}
          >
            {[
              property.province,
              property.canton,
              property.district
            ]
              .filter(Boolean)
              .join(' → ')}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            {property.property_type && (
              <span style={pill(theme)}>
                {bank ? property.marketplace_property_type_label : property.property_type}
              </span>
            )}

            {bank && <span style={pill(theme)}>
              {property.bank_evidence.financial_kind === 'AUCTION_BASE'
                ? (language === 'es' ? 'Base del remate' : 'Auction base')
                : property.bank_evidence.financial_kind === 'SELLING_PRICE'
                  ? (language === 'es' ? 'Precio de venta' : 'Selling price')
                  : (language === 'es' ? 'Precio no publicado' : 'Price not published')}
              {property.bank_evidence.auction_round ? ` (${property.bank_evidence.auction_round})` : ''}
              {property.marketplace_original_price && property.marketplace_original_currency
                ? `: ${property.marketplace_original_currency} ${exactMoney(property.marketplace_original_price, language)}` : ''}
            </span>}
            {!bank && property.marketplace_original_price && (
              <span style={pill(theme)}>
                {property.marketplace_original_currency ===
                'USD'
                  ? `$${Number(
                      property.marketplace_original_price
                    ).toLocaleString()}`
                  : `₡${Number(
                      property.marketplace_original_price
                    ).toLocaleString()}`}

                {transactionType === 'rent'
                  ? '/month'
                  : ''}
              </span>
            )}

            {property.property_area && (
                <span style={pill(theme)}>
                  {bank ? `${language === 'es' ? 'Área de terreno' : 'Land Area'}: ${exactMoney(String(property.property_area),language)} m²` : `${property.property_area} m²`}
                </span>
              )}

            {bank && property.construction_area && <span style={pill(theme)}>{language === 'es' ? 'Área de construcción' : 'Construction Area'}: {exactMoney(String(property.construction_area),language)} m²</span>}

            {!bank && transactionType === 'rent' &&
              property.construction_area && (
                <span style={pill(theme)}>
                  {property.construction_area} m²{' '}
                  {constructionLabel}
                </span>
              )}

            {property.bedrooms && (
              <span style={pill(theme)}>
                {property.bedrooms}{' '}
                {bedsLabel}
              </span>
            )}

            {bathroomPresentation(property,language) && (
              <span style={pill(theme)}>
                {bathroomPresentation(property,language)}
              </span>
            )}

            {property.parking && (
              <span style={pill(theme)}>
                {property.parking}{' '}
                {parkingLabel}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

const pill = (
  theme: 'dark' | 'light'
) => ({
  background:
    theme === 'dark'
      ? '#181818'
      : '#f2f2ef',

  border:
    theme === 'dark'
      ? '1px solid #2a2a2a'
      : '1px solid rgba(0,0,0,.12)',

  color:
    theme === 'dark'
      ? '#bbb'
      : '#333',

  padding:
    '10px 14px',

  borderRadius:
    '999px',

  cursor:
    'pointer',

  transition:
    'all .2s ease'
})
