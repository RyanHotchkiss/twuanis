'use client'

import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react'
import {usePathname} from 'next/navigation'

import {HOMEPAGE_INTRO_MS, HOMEPAGE_EXIT_MS} from '@/lib/homepage-presentation-timing'

type Stage = 'intro' | 'collapsing' | 'complete'
const EntranceContext = createContext<Stage>('complete')
const IntroReadyContext = createContext<() => void>(() => {})

// One route-scoped clock coordinates the identity and existing floating mark.
export default function HomepageEntranceProvider({children}: {children: ReactNode}) {
  const pathname = usePathname()
  const isHome = pathname === '/en' || pathname === '/es'
  const [state, setState] = useState<{path: string; stage: Stage}>({path: pathname, stage: 'intro'})
  const [readyPath,setReadyPath] = useState<string|null>(null)
  const markReady = useCallback(() => setReadyPath(pathname), [pathname])
  const stage = isHome ? (state.path === pathname ? state.stage : 'intro') : 'complete'

  useEffect(() => {
    setState({path: pathname, stage: 'intro'})
    if (!isHome || readyPath !== pathname) return
    const collapse = window.setTimeout(() => setState({path: pathname, stage: 'collapsing'}), HOMEPAGE_INTRO_MS)
    const complete = window.setTimeout(() => setState({path: pathname, stage: 'complete'}), HOMEPAGE_INTRO_MS + HOMEPAGE_EXIT_MS)
    return () => { window.clearTimeout(collapse); window.clearTimeout(complete) }
  }, [pathname, isHome, readyPath])

  return <EntranceContext.Provider value={stage}><IntroReadyContext.Provider value={markReady}>{children}</IntroReadyContext.Provider></EntranceContext.Provider>
}

export function useHomepageEntrance() { return useContext(EntranceContext) }

// Start the shared clock only once the actual introduction has mounted.
export function useVisibleHomepageEntrance() {
  const markReady = useContext(IntroReadyContext)
  useEffect(() => { markReady() }, [markReady])
  return useHomepageEntrance()
}

export function HomepageIdentity({children}: {children: ReactNode}) {
  const stage = useVisibleHomepageEntrance()
  return <div className="homepage-identity" data-stage={stage} aria-hidden={stage === 'complete'}>
    <div className="homepage-identity-content">{children}</div>
  </div>
}
