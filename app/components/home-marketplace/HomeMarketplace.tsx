"use client"
import {Suspense, useEffect, useRef, useState} from 'react'
import dynamic from 'next/dynamic'
import {useSearchParams} from 'next/navigation'
import TopBar from '../TopBar'
import JsonLd from '../JsonLd'
import {useSiteTheme} from '../theme/ThemeProvider'
import HomeEngineCards from '../home-engine-cards/HomeEngineCards'
import AddonHomepageCarousel from '../marketplace/AddonHomepageCarousel'
import BuyEN from '../marketplace/BuyMarketplaceEN'
import RentEN from '../marketplace/RentMarketplaceEN'
import BuyES from '../marketplace/BuyMarketplaceES'
import RentES from '../marketplace/RentMarketplaceES'
import type {AddonHomepageItem} from '@/lib/addon-homepage-contract'
import {MarketplaceContext, sharedMarketplaceFilters, type MarketplaceFilters} from './MarketplaceContext'
import {runningQuestions} from './questions'
import styles from './home.module.css'
const SellerEN = dynamic(() => import('@/app/en/HomePageClient'))
const SellerES = dynamic(() => import('@/app/es/HomePageClient'))
type Props = {language:'en'|'es'; addonHomepage:AddonHomepageItem[]; ontologyTerms:any[]; ontologyRelationships:any[]; homePageSchema:any[]}
export default function HomeMarketplace(props:Props) {
  return <Suspense fallback={null}><HomeContent {...props}/></Suspense>
}
function HomeContent(props:Props) {
  const {language,addonHomepage,homePageSchema} = props
  const search = useSearchParams()
  const {theme,setTheme} = useSiteTheme()
  const [mode,setMode] = useState<'sale'|'rent'>('sale')
  const [filters,setFilters] = useState<MarketplaceFilters>({})
  const [orienting,setOrienting] = useState(true)
  const [sidebarOrienting,setSidebarOrienting] = useState(true)
  const [arrowOrientation,setArrowOrientation] = useState<'idle'|'collapse'|'expand'>('idle')
  const touched = useRef(false)
  const interact = () => {touched.current = true;setArrowOrientation('idle')}
  useEffect(() => {
    const timer = window.setTimeout(() => {if (!touched.current) setOrienting(false)},5000)
    const delay = window.innerWidth <= 768 ? 2000 : 10000
    const collapseEmphasis = window.setTimeout(() => {if (!touched.current) setArrowOrientation('collapse')},delay-1000)
    const sidebarTimer = window.setTimeout(() => {if (!touched.current) {setSidebarOrienting(false);setArrowOrientation('idle')}},delay)
    const expandEmphasis = window.setTimeout(() => {if (!touched.current) setArrowOrientation('expand')},delay+1000)
    const emphasisEnd = window.setTimeout(() => setArrowOrientation('idle'),delay+3200)
    return () => {[timer,collapseEmphasis,sidebarTimer,expandEmphasis,emphasisEnd].forEach(id=>window.clearTimeout(id))}
  },[])
  // Preserve the existing topbar's seller entry and original publication workflow.
  if (search.get('overlay') === 'posting') {
    const Seller = language === 'es' ? SellerES : SellerEN
    return <Seller {...props} listings={[]} saleCount={0} rentCount={0}/>
  }
  const Marketplace = language === 'es' ? (mode === 'sale' ? BuyES : RentES) : (mode === 'sale' ? BuyEN : RentEN)
  function switchMode(next:'sale'|'rent') {
    if (next === mode) return
    interact()
    setFilters(current => sharedMarketplaceFilters(current))
    setMode(next)
  }
  return <div className={styles.home} data-arrow-theme={theme} data-arrow-orientation={arrowOrientation} onWheelCapture={interact}>
    <div aria-hidden="true" className={styles.backdrop} style={{backgroundImage: `url(${theme === 'dark' ? '/images/home.webp' : '/images/home0.webp'})`}}/>
    <JsonLd data={homePageSchema}/>
    <aside className={styles.banner} aria-label={language === 'es' ? 'Preguntas sobre el mercado' : 'Market questions'}>
      <div className={styles.marquee}>{[0,1].map(copy => <div className={styles.questions} key={copy} aria-hidden={copy === 1}>{runningQuestions[language].map(question => <span key={question}>{question}</span>)}</div>)}</div>
    </aside>
    <TopBar theme={theme} onThemeToggle={() => setTheme(value => value === 'dark' ? 'light' : 'dark')}/>
    <div className={styles.content}>
      <div className="homepage-identity" data-stage={orienting ? 'intro' : 'complete'} aria-hidden={!orienting}><div className="homepage-identity-content">
<section
              style={{
                textAlign: 'center',
                padding: '30px 12px 38px',
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
                  {/* TWUANIS + MOBIUS */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        color:
                          theme === 'dark'
                            ? '#ffffff'
                            : '#000000',
                        fontFamily: 'var(--font-cinzel), serif',
                        fontSize: 'clamp(52px, 16vw, 82px)',
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        textShadow:
                          '1px 1px 0 #c99a32, -1px -1px 0 #c99a32, 0 2px 10px rgba(201,154,50,0.35)',
                      }}
                    >
                      Twuanis
                    </div>

                    <img
                      src={
                            theme === 'dark'
                              ? '/images/twuanis-mobius.svg'
                              : '/images/twuanis-mobius-0.svg'
                          }
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        display: 'block',
                      }}
                    />
                  </div>

                  <div style={mobileDivider0}>
                    <span>◆</span>
                  </div>
                </div>

              <div
                style={{
                  color:
                    theme === 'dark'
                      ? '#ffffff'
                      : '#000000',
                  fontSize: 15,
                  fontWeight: 700,
                  textShadow:
                          '1px 1px 0 #c99a32, 1px 1px 0 #c99a32, 0 2px 10px rgba(201,154,50,0.35)',
                  letterSpacing: '0.11em',
                  lineHeight: 2,
                }}
              >
                {language === 'es' ? 'INTELIGENCIA PARA COMPARAR EL MERCADO INMOBILIARIO' : 'REAL ESTATE MARKET COMPARISON INTELLIGENCE'}
              </div>

                <div style={mobileDivider}>
                    <span>◆</span>
                  </div>

            </section>
      </div></div>
      <HomeEngineCards language={language} categoryPaging initiallyOpen={orienting} onInteract={interact}/>
      <div className={styles.transactions} role="group" aria-label={language === 'es' ? 'Tipo de transacción' : 'Transaction type'}>
        <button type="button" aria-pressed={mode === 'sale'} onClick={() => switchMode('sale')}>{language === 'es' ? 'EN VENTA' : 'FOR SALE'}</button>
        <button type="button" aria-pressed={mode === 'rent'} onClick={() => switchMode('rent')}>{language === 'es' ? 'EN ALQUILER / ARRENDAMIENTO' : 'FOR RENT / LEASE'}</button>
      </div>
      {addonHomepage.length > 0 && <div className={styles.homepagePlacement}><AddonHomepageCarousel items={addonHomepage} language={language}/></div>}
      <MarketplaceContext.Provider value={{filters,setFilters,orienting:sidebarOrienting,arrowOrientation,interact}}>
        <Marketplace key={mode}/>
      </MarketplaceContext.Provider>
    </div>
  </div>
}
const mobileDivider: React.CSSProperties = {
  width: '72%',
  margin: '22px auto',
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

