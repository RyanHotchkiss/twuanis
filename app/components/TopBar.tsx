'use client'
import {useSiteTheme} from './theme/ThemeProvider'
import {useHomepageEntrance} from './HomepageEntrance'
import PreferencesMenu from './theme/PreferencesMenu'
import HomepageBackgroundPropertyLink from './HomepageBackgroundPropertyLink'
import type {HomepageBackgroundPlacement} from '@/lib/homepage-background-product'

import Link from 'next/link'
import {supabase} from '@/lib/supabase'
import {useNavigationAvatar} from '@/lib/account-identity/navigation-avatar-client'

import {
  Landmark,
  CircleUser,
  Search,
  Megaphone,
  Compass,
  BookOpen,
  Box,
  Menu,
} from 'lucide-react'

import {
  Suspense,
  Fragment,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
  type ReactNode
} from 'react'

import {
  usePathname,
  useSearchParams
} from 'next/navigation'

import {
  getAlternateLanguageUrl
} from '@/lib/language-route'

import './mobile-page-fit.css'

type TopBarProps = {
  homepageBackground?:HomepageBackgroundPlacement|null
  onLabelsChange?: (visible:boolean) => void
  labelsReady?: boolean
  mobileFit?: boolean
  intelligence?: boolean
  onFilterClick?: () => void
  theme?: 'dark' | 'light'
  onThemeToggle?: () => void
  onCollapsedChange?: (
    collapsed: boolean
  ) => void
}

const GOLD = '#C7A44B'
const WHITE = '#FFFFFF'
const UTILITY_ORANGE = '#ff3b00'
const TOPBAR_ICON_SIZE = 36
const TOPBAR_CONTROL_GAP = '.75rem'


function TopBarContent({
  homepageBackground = null,
  intelligence = false,
  mobileFit = false,
  onFilterClick,
  theme: _legacyTheme,
  onThemeToggle: _legacyToggle,
  onCollapsedChange,
  onLabelsChange,
  labelsReady = true
}: TopBarProps) {
  const {theme}=useSiteTheme()
  const homepageStage=useHomepageEntrance()
  const avatar=useNavigationAvatar()
  const [authenticated,setAuthenticated]=useState(false)
  useEffect(()=>{
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setAuthenticated(Boolean(session?.user)))
    return()=>subscription.unsubscribe()
  },[])
  const [failedAvatar,setFailedAvatar]=useState<string|null>(null)
  const introActive=useRef(false),introBefore=useRef<{collapsed:boolean;labels:boolean}|null>(null)

  const pathname =
    usePathname()

  const isHomepage =
  pathname === '/en' ||
  pathname === '/es'

  const [homepageAtTop,setHomepageAtTop]=useState(true)
  const [homepagePromotionFaded,setHomepagePromotionFaded]=useState(false)
  useEffect(()=>{setHomepagePromotionFaded(false);if(!isHomepage)return;const timer=window.setTimeout(()=>setHomepagePromotionFaded(true),5000);return()=>window.clearTimeout(timer)},[isHomepage,pathname])
  const [backgroundPromotionFaded,setBackgroundPromotionFaded]=useState(false)
  useEffect(()=>{setBackgroundPromotionFaded(false);if(!isHomepage)return;const timer=window.setTimeout(()=>setBackgroundPromotionFaded(true),5000);return()=>window.clearTimeout(timer)},[isHomepage,homepageBackground?.listingId])

  const lightTopBarBackground =
  intelligence ? WHITE : isHomepage
    ? 'rgba(255, 255, 255, .92)'
    : 'rgba(248, 243, 229, .94)'

  const searchParams =
    useSearchParams()


  const currentLanguage =
    pathname.startsWith('/es') || ((pathname.startsWith('/commercial/') || pathname.startsWith('/payments/') || pathname==='/checkout') && searchParams.get('lang')==='es') ? 'es' : 'en'

const targetLanguage =
  currentLanguage === 'en'
    ? 'es'
    : 'en'

const commercialRoute = pathname.startsWith('/commercial/') || pathname.startsWith('/payments/') || pathname==='/checkout'
const [currencyRevision,setCurrencyRevision]=useState(0)
useEffect(()=>{const refresh=()=>setCurrencyRevision(v=>v+1);window.addEventListener('twuanis:currency-selection',refresh);return()=>window.removeEventListener('twuanis:currency-selection',refresh)},[])
const currentQuery=currencyRevision&&typeof window!=='undefined'?new URLSearchParams(window.location.search):searchParams
const commercialLanguageQuery = new URLSearchParams(currentQuery.toString())
commercialLanguageQuery.set('lang',targetLanguage)
const languageHref = commercialRoute ? `${pathname}?${commercialLanguageQuery}` :
  getAlternateLanguageUrl({
    pathname,
    searchParams:currentQuery,
    targetLanguage
  })
const isSpanish =
  currentLanguage === 'es'

const currentLanguageHref=pathname+(currentQuery.toString()?'?'+currentQuery.toString():'')
const languageUrls={
  en:isSpanish?languageHref:currentLanguageHref,
  es:isSpanish?currentLanguageHref:languageHref
}


  const [showLabels, setShowLabels] =
    useState(true)

  const [collapsed, setCollapsed] =
    useState(false)

  useEffect(() => {
    onCollapsedChange?.(
      collapsed
    )
  }, [
    collapsed,
    onCollapsedChange
  ])

  const [manuallyExpanded, setManuallyExpanded] =
    useState(false)

  const [isMobile, setIsMobile] =
    useState(false)

  useEffect(()=>{if(!isHomepage)return;setCollapsed(false);setManuallyExpanded(false)},[isHomepage,pathname])
  const homepageNavigation=useRef<HTMLDivElement>(null)

  const expandedNavigation = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if(!manuallyExpanded||collapsed)return
    const outside=(event:MouseEvent)=>{
      const target=event.target
      if(!(target instanceof Node)||expandedNavigation.current?.contains(target))return
      // The existing Preferences dialog is portaled, but belongs to this menu.
      if(target instanceof Element&&target.closest('.site-preferences'))return
      setCollapsed(true);setManuallyExpanded(false)
    }
    document.addEventListener('click',outside,true)
    return()=>document.removeEventListener('click',outside,true)
  },[manuallyExpanded,collapsed])
  const [navigationSpace, setNavigationSpace] = useState({height:0,width:0})

  useLayoutEffect(() => {
    if (collapsed || manuallyExpanded) return
    const node = isHomepage ? homepageNavigation.current : expandedNavigation.current
    if (!node) return
    const measure = () => {
      const style = getComputedStyle(node)
      setNavigationSpace({height:node.getBoundingClientRect().height +
        (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0),width:node.getBoundingClientRect().width})
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [isHomepage, collapsed, manuallyExpanded, isMobile])


  useEffect(() => {
    const mediaQuery =
      window.matchMedia('(max-width: 768px)')

    const updateIsMobile = () => {
      setIsMobile(mediaQuery.matches)
    }

    updateIsMobile()

    mediaQuery.addEventListener(
      'change',
      updateIsMobile
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateIsMobile
      )
    }
  }, [])

  const [labelCycle,setLabelCycle]=useState(0)
  const [hoveredItem, setHoveredItem] =
    useState<string | null>(null)

  useEffect(() => {

      if(isHomepage)return
      setShowLabels(true)
      onLabelsChange?.(true)
      if (!labelsReady) return
      const timer =
        window.setTimeout(() => {
          setShowLabels(false)
          onLabelsChange?.(false)
        }, 5000)

      return () =>
        window.clearTimeout(timer)

    }, [onLabelsChange, labelsReady,isHomepage,isMobile])


  useEffect(()=>{
    if(!isHomepage)return
    setShowLabels(true);onLabelsChange?.(true)
    const timer=window.setTimeout(()=>{setShowLabels(false);onLabelsChange?.(false)},8000)
    return()=>window.clearTimeout(timer)
  },[isHomepage,pathname,onLabelsChange,labelCycle])

  useEffect(() => {

  let lastScrollY =
    window.scrollY

  // Reuse this scroll-position listener; visibility is independent of menu/tour state.
  if(isHomepage)setHomepageAtTop(window.scrollY<=0)

  function handleScroll() {
    const currentScrollY = window.scrollY
    if(isHomepage)setHomepageAtTop(currentScrollY<=0)
    if(introActive.current)return

    // Mobile home: scroll may collapse, but reopening is always an explicit user action.
    if(isHomepage){
      if(currentScrollY<=12&&lastScrollY>12){
        setCollapsed(false);setManuallyExpanded(false);setLabelCycle(value=>value+1)
      }
      if(currentScrollY>lastScrollY+6&&!manuallyExpanded){
        setCollapsed(true)
      }
      lastScrollY=currentScrollY
      return
    }

    /*
     * TOP OF PAGE
     *
     * Full navigation is always visible.
     */
    if (currentScrollY <= 12) {

      if(!isMobile||!isHomepage||homepageStage==='intro'||manuallyExpanded){setCollapsed(false);setManuallyExpanded(false)}

      lastScrollY =
        currentScrollY

      return
    }

    /*
     * SCROLLING DOWN
     *
     * Collapse full navigation into
     * the floating hamburger.
     */
    if (
      currentScrollY >
      lastScrollY + 6 &&
      !manuallyExpanded
    ) {
      setCollapsed(true)
    }

    /*
     * SCROLLING UP
     *
     * Restore full navigation immediately.
     */
    if (
      currentScrollY <
      lastScrollY - 6
    ) {
      setCollapsed(false)
      setManuallyExpanded(false)
    }

    lastScrollY =
      currentScrollY
  }

  window.addEventListener(
    'scroll',
    handleScroll,
    { passive: true }
  )

  return () =>
    window.removeEventListener(
      'scroll',
      handleScroll
    )

}, [manuallyExpanded,isMobile,isHomepage,homepageStage,pathname,collapsed])


  useEffect(()=>{const reveal=(event:Event)=>{const value=(event as CustomEvent).detail;if(value?.end){introActive.current=false;if(introBefore.current){setCollapsed(introBefore.current.collapsed);setShowLabels(introBefore.current.labels);introBefore.current=null}return}if(!introBefore.current)introBefore.current={collapsed,labels:showLabels};introActive.current=true;setCollapsed(Boolean(value?.collapsed));setShowLabels(true)};window.addEventListener('tw-intro-nav',reveal);return()=>window.removeEventListener('tw-intro-nav',reveal)},[collapsed,showLabels])

  function labelVisible(
    item: string
  ) {

    if (showLabels) {
      return true
    }

    if (isMobile) {
      return false
    }

    return hoveredItem === item
  }


  function itemStyle() {

    return {
      display: 'flex',
      flexDirection:
        'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      background: 'transparent',
      border: 'none',
      padding: 0,
      minWidth: 0,
      cursor: 'pointer',
      WebkitTapHighlightColor:
        'transparent',
      transition:
        'opacity .2s ease'
    }
  }


  function labelStyle(
    visible: boolean,
    mobileLabel = false
  ) {

    return {
      color:
        theme === 'dark'
          ? '#d8d8d8'
          : '#000000',
      fontSize:
        mobileLabel
          ? '.62rem'
          : '.68rem',
      fontWeight: 400,
      lineHeight: 1.15,
      textAlign:
        'center' as const,
      whiteSpace:
        'pre-line' as const,
      marginTop: '.35rem',

      opacity:
        visible
          ? 1
          : 0,

      maxHeight:
        visible
          ? '3rem'
          : '0',

      transform:
        visible
          ? 'translateY(0)'
          : 'translateY(-4px)',

      overflow: 'hidden',

      transition:
        'opacity .45s ease, max-height .45s ease, transform .45s ease'
    }
  }


  function navigationLabel(item:string, desktop:string, mobile:string) {
    const visible = labelVisible(item)
    return <>
      <span className="topbar-desktop-label" style={labelStyle(visible)}>{desktop}</span>
      <span className="topbar-mobile-label" style={labelStyle(visible,true)}>{mobile.split('\n').map((word,index)=><Fragment key={index}>{index>0 && <br/>}{word}</Fragment>)}</span>
    </>
  }

  function sellNavigation() {
    return <Link data-tour-id="N05"
      href={isSpanish ? '/es?overlay=posting' : '/en?overlay=posting'}
      style={itemStyle()}
      onMouseEnter={() => setHoveredItem('sell')}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <Megaphone size={TOPBAR_ICON_SIZE} strokeWidth={0.65} color={UTILITY_ORANGE}/>
      {navigationLabel('sell',isSpanish?'Vender\nAlquilar\nArrendar':'Sell\nRent-Out\nLease-Out',isSpanish?'Vende':'Sell\nRent')}
    </Link>
  }

  const homepageInner = isHomepage ? {position:'relative' as const,top:'auto',left:'auto',transform:'none',margin:0,minWidth:0} : {}
  function homepageFrame(content:ReactNode,floating:boolean){
    if(!isHomepage)return <>
      {/* Fixed navigation must not remove the sticky bar's document space. */}
      {floating && <div aria-hidden="true" data-navigation-spacer style={{height:navigationSpace.height,width:navigationSpace.width,maxWidth:'100%',margin:'0 auto',flexShrink:0,overflowAnchor:'none'}}/>}
      {content}
    </>
    return <>{floating&&<div data-home-navigation-spacer aria-hidden="true" style={{height:navigationSpace.height,width:"100%",flexShrink:0}}/>}<div ref={homepageNavigation} className="homepage-navigation-row" data-floating={floating} style={{position:floating?'fixed':'sticky',top:isMobile?'calc(var(--question-ticker-height, 0px) + 1.5rem)':'calc(var(--question-ticker-height, 0px) + 1rem)',zIndex:floating?9999:3000,...floating?{left:collapsed?'0':'50%',transform:collapsed?'none':'translateX(-50%)'}:{}}}>
      <HomepageBackgroundPropertyLink placement={homepageBackground} language={isSpanish?'es':'en'} faded={backgroundPromotionFaded}/>
      {content}
      <Link data-homepage-background-promotion data-measure-control="homepage_background" data-faded={homepagePromotionFaded} data-scroll-hidden={!homepageAtTop} aria-hidden={!homepageAtTop||undefined} tabIndex={homepageAtTop?undefined:-1} className="homepage-background-promotion" href={isSpanish?'/es/inteligencia-de-mercado/paquetes?tab=addons':'/en/market-intelligence/packages?tab=addons'}>{isSpanish?'Haga de su propiedad el fondo de la página de inicio de Twuanis':'Make Your Property the Twuanis Homepage Background'}</Link>
    </div></>
  }

  if (collapsed) {

  return homepageFrame(<div data-homepage-expand={isHomepage||undefined}
      className={isHomepage?'homepage-topbar-control-shell':undefined}
      style={{...floatingHamburgerShell(
  theme,
  lightTopBarBackground
), border: '2px solid var(--border)',...(!isHomepage&&isMobile?{left:'5px',transform:'none'}:{}),...homepageInner,...isMobile?{display:'flex',alignItems:'center',justifyContent:'center'}:{},...isHomepage?{position:'fixed' as const,top:'calc(var(--question-ticker-height, 0px) + env(safe-area-inset-top) + 8px)',right:'max(8px,env(safe-area-inset-right))',left:'auto',transform:'none',scale:.9,transformOrigin:'right top'}:{}}}
    >
        <button
          data-tour-id="N11"
          type="button"
          aria-label={
            isSpanish
              ? 'Abrir navegación'
              : 'Open navigation'
          }
          onClick={() => {
            setCollapsed(false)
            setManuallyExpanded(true)
          }}
          style={{...hamburgerButton,...isMobile?{flexShrink:0}:{}}}
        >
          {isMobile&&isHomepage?<Menu size={26} strokeWidth={1} color="#dfb94d" aria-hidden="true"/>:(<Menu
            size={32}
            strokeWidth={0.8}
            color={
              theme === 'dark'
                ? WHITE
                : '#000000'
            }
          />)}
        </button>
      </div>,true)

  }


  const expandedShell = manuallyExpanded
    ? floatingTopBarShell(theme, lightTopBarBackground)
    : stickyShell(theme, isMobile, lightTopBarBackground)

  const sharedContainer = {
    ...expandedShell,
    position: 'relative' as const,
    top: 'auto',
    left: 'auto',
    transform: 'none',
    zIndex: 'auto',
    margin: 0,
    alignSelf: 'center' as const,
    padding: '1em',
  }
  const navigationGroupStyle={
    ...sharedContainer,
    border:'2px solid var(--border)',
    display:'flex',
    alignItems:'center' as const,
    justifyContent:'center' as const,
  }

  return homepageFrame(<div
      ref={expandedNavigation}
      className={`twuanis-topbar-row${isHomepage?' homepage-topbar-control-shell':''}`}
      data-floating={manuallyExpanded}
      style={{...expandedShell,display:'flex',alignItems:'stretch',gap:'2em',padding:0,background:'transparent',border:'none',boxShadow:'none',backdropFilter:'none',WebkitBackdropFilter:'none',...homepageInner}}
    >

      <div className="twuanis-topbar-sell-container" style={{...sharedContainer,border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <nav className="twuanis-top-navigation" data-labels-visible={showLabels} style={{...navContainer,width:'auto',overflowX:'visible'}}>
          {sellNavigation()}
        </nav>
      </div>

      <div
        className="twuanis-mobile-topbar"
        data-floating={manuallyExpanded}
        style={{...sharedContainer,display:'flex',alignItems:'stretch',gap:'clamp(.35rem, 1.5vw, 1.15rem)',padding:0,background:'transparent',border:'none',boxShadow:'none',backdropFilter:'none',WebkitBackdropFilter:'none'}}
      >

      <div className="twuanis-topbar-navigation-group" style={navigationGroupStyle}>
      <nav className="twuanis-top-navigation" data-labels-visible={showLabels} style={{...navContainer,width:'auto',overflowX:'visible'}}>

        {/* MARKETHUB */}
        <Link data-tour-id="N01"
          href={
            isSpanish
              ? '/es/centro-de-mercado'
              : '/en/market-hub'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('hub')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          {avatar && avatar!==failedAvatar ? <img src={avatar} alt="" width={TOPBAR_ICON_SIZE} height={TOPBAR_ICON_SIZE} onError={()=>setFailedAvatar(avatar)}
            style={{width:TOPBAR_ICON_SIZE,height:TOPBAR_ICON_SIZE,aspectRatio:'1 / 1',maxWidth:'100%',objectFit:'cover',borderRadius:'50%',boxSizing:'border-box',border:`0.65px solid ${theme==='dark'?WHITE:'#000000'}`,flexShrink:0}}
          /> : (
          <CircleUser
            size={TOPBAR_ICON_SIZE}
            strokeWidth={0.65}
            color={
                theme === 'dark'
                  ? WHITE
                  : '#000000'
              }
          />
          )}

          {navigationLabel('hub',isSpanish?'Espacio de\nTrabajo':'Workspace',isSpanish?'Esp.':'Work.')}
        </Link>


        {/* INTELLIGENCE HUB */}
        <Link data-tour-id="N02"
          href={
            isSpanish
              ? '/es/inteligencia-de-mercado'
              : '/en/market-intelligence'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('intelligence')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Compass
            size={TOPBAR_ICON_SIZE}
            strokeWidth={0.65}
            color={
                theme === 'dark'
                  ? WHITE
                  : '#000000'
              }
          />

          {navigationLabel('intelligence',isSpanish?'Algoritmos':'Algorithms',isSpanish?'Alg.':'Alg.')}
        </Link>
      </nav>
      </div>


      <div className="twuanis-topbar-navigation-group" style={navigationGroupStyle}>
      <nav className="twuanis-top-navigation" data-labels-visible={showLabels} style={{...navContainer,width:'auto',overflowX:'visible'}}>
        {/* BUY */}
        <Link data-tour-id="N03"
          href={
            isSpanish
              ? '/es?overlay=looking'
              : '/en?overlay=looking'
          }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('buy')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Search
            size={TOPBAR_ICON_SIZE}
            strokeWidth={0.65}
            color={GOLD}
          />

          {navigationLabel('buy',isSpanish?'Comprar\nAlquilar\nArrendar':'Buy\nRent\nLease',isSpanish?'Comp.':'Buy')}
        </Link>


        <Link className="topbar-desktop-only-destination" data-tour-id="N04" href={isSpanish?'/es/remates':'/en/bank-properties'} aria-label={isSpanish?'Remates':'Bank Properties'} style={itemStyle()} onMouseEnter={()=>setHoveredItem('banks')} onMouseLeave={()=>setHoveredItem(null)}>
          <Landmark size={TOPBAR_ICON_SIZE} strokeWidth={0.65} color={GOLD}/>
          {navigationLabel('banks',isSpanish?'Remates':'Bank\nProperties',isSpanish?'Remates':'Bank')}
        </Link>

      </nav>
      </div>


      <div className="twuanis-topbar-navigation-group" style={navigationGroupStyle}>
      <nav className="twuanis-top-navigation" data-labels-visible={showLabels} style={{...navContainer,width:'auto',overflowX:'visible'}}>
        {/* PACKAGES */}
        <Link data-tour-id="N07"
          href={
              isSpanish
                ? '/es/inteligencia-de-mercado/paquetes'
                : '/en/market-intelligence/packages'
            }
          style={itemStyle()}
          onMouseEnter={() =>
            setHoveredItem('packages')
          }
          onMouseLeave={() =>
            setHoveredItem(null)
          }
        >
          <Box
            size={TOPBAR_ICON_SIZE}
            strokeWidth={0.65}
            color={UTILITY_ORANGE}
          />

          {navigationLabel('packages',isSpanish?'Paquetes':'Packages',isSpanish?'Paq.':'Pks.')}
        </Link>


        {/* KNOWLEDGE — same navigation controls and responsive behavior. */}
        <Link data-tour-id="N08"
          href={isSpanish ? '/es/conocimiento' : '/en/knowledge'}
          aria-label={isSpanish ? 'conocimiento' : 'knowledge'}
          aria-current={pathname === '/en/knowledge' || pathname.startsWith('/en/knowledge/') || pathname === '/es/conocimiento' || pathname.startsWith('/es/conocimiento/') ? 'page' : undefined}
          style={itemStyle()}
          onMouseEnter={() => setHoveredItem('knowledge')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <BookOpen size={TOPBAR_ICON_SIZE} strokeWidth={0.65} color={UTILITY_ORANGE}/>
          {navigationLabel('knowledge',isSpanish ? 'conocimiento' : 'knowledge',isSpanish ? 'Saber' : 'Know')}
        </Link>

      </nav>
      </div>

      <div className="twuanis-topbar-navigation-group" style={navigationGroupStyle}>
      <nav className="twuanis-top-navigation" data-labels-visible={showLabels} style={{...navContainer,width:'auto',overflowX:'visible'}}>
        <PreferencesMenu authenticated={authenticated} languageUrls={languageUrls} language={isSpanish?'es':'en'} iconSize={TOPBAR_ICON_SIZE} buttonStyle={itemStyle()} showLabel mobileLabel={isSpanish?'Pref.':'Pref.'} labelStyle={labelStyle(labelVisible('appearance'))} mobileLabelStyle={labelStyle(labelVisible('appearance'),true)} onMouseEnter={()=>setHoveredItem('appearance')} onMouseLeave={()=>setHoveredItem(null)}/>

      </nav>
      </div>
    </div>
    </div>,manuallyExpanded)

}


export default function TopBar(
  props: TopBarProps
) {

  return (
    <Suspense fallback={null}>
      <TopBarContent {...props} />
    </Suspense>
  )

}


const stickyShell = (
  theme: 'dark' | 'light',
  isMobile: boolean,
  lightBackground: string
) => ({
  position:
    'sticky' as const,

  top: isMobile
    ? 'calc(var(--question-ticker-height, 0px) + 1.5rem)'
    : 'calc(var(--question-ticker-height, 0px) + 1rem)',

  zIndex: 3000,

  width: 'fit-content',

  maxWidth: '100%',

  margin:
  isMobile
    ? '0 auto 1rem'
    : '0 auto',

  padding: '.55rem .7rem',

  background:
  theme === 'dark'
    ? 'rgba(0, 0, 0, .88)'
    : lightBackground,

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease',
})


const navContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: TOPBAR_CONTROL_GAP,
  flexWrap: 'nowrap' as const,
  width: '100%',
  overflowX: 'auto' as const,
  scrollbarWidth: 'none' as const,
  msOverflowStyle: 'none' as const
}


const hamburgerButton = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  padding: '.2rem',
  cursor: 'pointer',
  WebkitTapHighlightColor:
    'transparent'
}

const floatingHamburgerShell = (
  theme: 'dark' | 'light',
  lightBackground: string
) => ({
  position:
    'fixed' as const,

  top:
    'calc(var(--question-ticker-height, 0px) + 1rem)',

  left:
    '50%',

  transform:
    'translateX(-50%)',

  zIndex:
    9999,

  width:
    'fit-content',

  padding:
    '.55rem .7rem',

  background:
    theme === 'dark'
      ? 'rgba(0, 0, 0, .88)'
      : lightBackground,

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease'
})

const floatingTopBarShell = (
  theme: 'dark' | 'light',
  lightBackground: string
) => ({
  position:
    'fixed' as const,

  top:
    'calc(var(--question-ticker-height, 0px) + 1rem)',

  left:
    '50%',

  transform:
    'translateX(-50%)',

  zIndex:
    9999,

  width:
    'fit-content',

  maxWidth:
    'calc(100vw - 2rem)',

  margin:
    0,

  padding:
    '.55rem .7rem',

  background:
  theme === 'dark'
    ? 'rgba(0, 0, 0, .88)'
    : lightBackground,

  backdropFilter:
    'blur(14px)',

  WebkitBackdropFilter:
    'blur(14px)',

  border:
    theme === 'dark'
      ? '1px solid rgba(255,255,255,.07)'
      : '1px solid rgba(0,0,0,.10)',

  borderRadius:
    '18px',

  boxShadow:
    theme === 'dark'
      ? '0 8px 30px rgba(0,0,0,.28)'
      : '0 8px 30px rgba(0,0,0,.14)',

  transition:
    'background .25s ease, border-color .25s ease, box-shadow .25s ease'
})
