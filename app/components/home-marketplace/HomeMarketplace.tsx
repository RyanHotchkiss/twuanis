"use client"
import {Suspense, useEffect, useRef, useState} from 'react'
import dynamic from 'next/dynamic'
import {useSearchParams} from 'next/navigation'
import {formatListingCount} from '@/lib/listing-count-format'
import TopBar from '../TopBar'
import {useVisibleHomepageEntrance} from '../HomepageEntrance'
import JsonLd from '../JsonLd'
import {useSiteTheme} from '../theme/ThemeProvider'
import HomeEngineCards from '../home-engine-cards/HomeEngineCards'
import BuyEN from '../marketplace/BuyMarketplaceEN'
import RentEN from '../marketplace/RentMarketplaceEN'
import BuyES from '../marketplace/BuyMarketplaceES'
import RentES from '../marketplace/RentMarketplaceES'
import BankMarketplace from '../remates/BankMarketplace'
import {presentHomepageBackground,type HomepageBackgroundPlacement} from '@/lib/homepage-background-product'
import type {AddonHomepageItem} from '@/lib/addon-homepage-contract'
import {MarketplaceContext, sharedMarketplaceFilters, type MarketplaceFilters} from './MarketplaceContext'
import styles from './home.module.css'
import ValuationMethodology from './ValuationMethodology'
const SellerEN = dynamic(() => import('@/app/en/HomePageClient'))
const SellerES = dynamic(() => import('@/app/es/HomePageClient'))
type Props = {inventory:{sale:number|null;rent:number|null};homepageBackground?:HomepageBackgroundPlacement|null; language:'en'|'es'; addonHomepage:AddonHomepageItem[]; ontologyTerms:any[]; ontologyRelationships:any[]; homePageSchema:any[]}
export default function HomeMarketplace(props:Props) {
  return <Suspense fallback={null}><HomeContent {...props}/></Suspense>
}
function HomeContent(props:Props) {
  const {language,addonHomepage,homePageSchema} = props
  const background=presentHomepageBackground(props.homepageBackground)
  const search = useSearchParams()
  const {theme,setTheme} = useSiteTheme()
  const [showNavigationLabels,setShowNavigationLabels] = useState(true)
  const entrance = useVisibleHomepageEntrance()
  const [mode,setMode] = useState<'sale'|'rent'|'bank'>('sale')
  const [swipeAppeared,setSwipeAppeared] = useState(false)
  useEffect(() => {
    if (entrance !== 'complete' || swipeAppeared) return
    const button = document.querySelector('[data-swipe-text]')
    if (!button) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio === 1)) {setSwipeAppeared(true); observer.disconnect()}
    }, {threshold:1})
    observer.observe(button)
    return () => observer.disconnect()
  }, [entrance, swipeAppeared, mode])
  const [filters,setFilters] = useState<MarketplaceFilters>({})
  const orienting = entrance === 'intro'
  const [sidebarOrienting,setSidebarOrienting] = useState(true)
  const [arrowOrientation,setArrowOrientation] = useState<'idle'|'collapse'|'expand'>('idle')
  const touched = useRef(false)
  const interact = () => {touched.current = true;setArrowOrientation('idle')}
  useEffect(() => {
    const delay = window.innerWidth <= 768 ? 1500 : 10000
    const collapseEmphasis = window.setTimeout(() => {if (!touched.current) setArrowOrientation('collapse')},delay-1000)
    const sidebarTimer = window.setTimeout(() => {setSidebarOrienting(false);setArrowOrientation('idle')},delay)
    const expandEmphasis = window.setTimeout(() => {if (!touched.current) setArrowOrientation('expand')},delay+1000)
    const emphasisEnd = window.setTimeout(() => setArrowOrientation('idle'),delay+3200)
    return () => {[collapseEmphasis,sidebarTimer,expandEmphasis,emphasisEnd].forEach(id=>window.clearTimeout(id))}
  },[])
  // Preserve the existing topbar's seller entry and original publication workflow.
  if (search.get('overlay') === 'posting') {
    const Seller = language === 'es' ? SellerES : SellerEN
    return <Seller {...props} listings={[]} saleCount={0} rentCount={0}/>
  }
  const Marketplace = language === 'es' ? (mode === 'sale' ? BuyES : RentES) : (mode === 'sale' ? BuyEN : RentEN)
  function switchMode(next:'sale'|'rent'|'bank') {
    if (next === mode) return
    interact()
    setFilters(current => sharedMarketplaceFilters(current))
    setSwipeAppeared(false)
    setMode(next)
  }
  return <div className={styles.home} data-home-editorial-root data-arrow-theme={theme} data-arrow-orientation={arrowOrientation} onWheelCapture={interact}>
    <div aria-hidden="true" className={styles.backdrop} style={{backgroundImage: `url(${background?.image??(theme === 'dark' ? '/images/home.webp' : '/images/home0.webp')})`}}/>
    <JsonLd data={homePageSchema}/>
    <TopBar homepageBackground={background} labelsReady={swipeAppeared} onLabelsChange={setShowNavigationLabels} theme={theme} onThemeToggle={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}/>
    <div className={styles.content}>
      <div className="homepage-identity" data-stage={entrance} aria-hidden={!orienting}><div className="homepage-identity-content">
<section data-home-editorial
              style={{
                textAlign: 'center',
                padding: '30px 32px 4px',
              }}
            >
              <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: 20,
                  }}
                >
                  {/* Existing 20S artwork, centered independently of font preferences. */}
                  <div data-homepage-brand style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%'}}>
                    <img src={theme === 'dark' ? '/images/black-20S-logo.svg' : '/images/white-20s-logo.svg'} alt="Twuanis 20S" style={{display:'block',width:'clamp(128px, 20vw, 224px)',height:'auto',aspectRatio:'1144 / 1152',flexShrink:0}}/>
                  </div>

                  <div style={mobileDivider0}>
                    <span>◆</span>
                  </div>
                </div>

              <div data-homepage-heading-container
                style={{
                  width: 'fit-content',
                  margin: '0 auto',
                  padding: '4px 0',
                  boxSizing: 'border-box',
                  maxWidth: '100%',
                  color:
                    theme === 'dark'
                      ? '#ffffff'
                      : '#000000',
                  fontSize: 15,
                  fontWeight: 400,
                  textShadow: 'none',
                  letterSpacing: '0.11em',
                  lineHeight: 2,
                }}
              >
                <span data-homepage-headline role="heading" aria-level={1} style={{display:'block',fontSize:'clamp(22.5px, 2.5vw, 32.5px)'}}><span className="home-text-pill">{language === 'es' ? <><span>Valoración de</span>{' '}<span>Bienes Raíces</span>{' '}<span>en Costa Rica</span></> : <><span>Costa Rica</span>{' '}<span>Real Estate</span>{' '}<span>Valuation</span></>}</span></span>
                <span data-homepage-market-basis style={{display:'block',fontSize:'clamp(14px, 1.6vw, 20px)',fontStyle:'italic',marginTop:'1rem',marginBottom:'1rem',lineHeight:1.5,overflowWrap:'anywhere'}}><span className="home-text-pill home-market-basis-pill"><span className="home-market-basis-copy">{language === 'es' ? 'Basada en Precios Actuales del Mercado' : 'Based on Current Market Prices'}</span><ValuationMethodology language={language}/></span></span>
                <span data-homepage-engines style={{display:'block',fontSize:'clamp(18px, 2.1vw, 27px)',marginBottom:'1rem'}}><span className="home-text-pill"><span style={{color:'#ff3b00',textShadow:'none'}}>17</span>{language === 'es' ? ' Algoritmos de Comparación de Precios' : ' Price Comparison Algorithms'}</span></span>
                <span data-homepage-subtitle style={{display:'block',fontSize:'clamp(14px, 1.6vw, 20px)'}}><span className="home-sale-counter" style={{background:"var(--surface-raised)"}}> <span data-inventory-sale style={{color:'#FF3B00'}}>{props.inventory.sale == null ? '—' : formatListingCount(props.inventory.sale,language)}</span>{language === 'es' ? ' Anuncios de Venta' : ' For Sale Listings'}</span>{' · '}<span className="home-rent-counter" style={{background:"var(--surface-raised)"}}><span data-inventory-rent style={{color:'#FF3B00'}}>{props.inventory.rent == null ? '—' : formatListingCount(props.inventory.rent,language)}</span>{language === 'es' ? ' Anuncios de Alquiler / Arrendamiento' : ' For Rent / Lease Listings'}</span></span>
              </div>

                <div style={mobileDivider}>
                    <span>◆</span>
                  </div>

            </section>
      </div></div>
      <HomeEngineCards language={language} categoryPaging initiallyOpen={orienting} onInteract={interact}/>
      <div id="home-mobile-filter-arrow" className={styles.mobileFilterArrow}/>
      <div className={styles.transactions} role="group" aria-label={language === 'es' ? 'Tipo de transacción' : 'Transaction type'}>
        <button type="button" data-market="sale" aria-pressed={mode === 'sale'} onClick={() => switchMode('sale')}>{language === 'es' ? 'EN VENTA' : 'FOR SALE'}</button>
        <button type="button" data-market="rent" aria-pressed={mode === 'rent'} onClick={() => switchMode('rent')}>{language === 'es' ? 'EN ALQUILER / ARRENDAMIENTO' : 'FOR RENT / LEASE'}</button>
        <button type="button" data-market="bank" aria-pressed={mode === 'bank'} onClick={() => switchMode('bank')}>{language === 'es' ? 'PROPIEDADES BANCARIAS Y REMATES' : 'BANK PROPERTIES & REMATES'}</button>
      </div>

      <div data-home-listings-boundary><MarketplaceContext.Provider value={{addonHomepage,filters,setFilters,orienting:sidebarOrienting,arrowOrientation,interact,showNavigationLabels}}>
        {mode === 'bank' ? <BankMarketplace key={mode} language={language}/> : <Marketplace key={mode}/>}
      </MarketplaceContext.Provider></div>
    </div>
  </div>
}
const mobileDivider: React.CSSProperties = {
  width: '72%',
  margin: '22px auto 0',
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(201,154,50,.8), transparent)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#c99a32',
  fontSize: 10,
}

const mobileDivider0: React.CSSProperties = {
  width: '72%',
  margin: '22px auto',
  height: 1,
  background:
    'linear-gradient(90deg, transparent, rgba(255, 59, 0, 0.8), transparent)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ff3b00',
  fontSize: 10,
}

