'use client'

import {createContext, useContext, useEffect, useState, type ReactNode} from 'react'
import {usePathname} from 'next/navigation'

type Stage = 'intro' | 'collapsing' | 'complete'
const EntranceContext = createContext<Stage>('complete')

// One route-scoped clock coordinates the identity and existing floating mark.
export default function HomepageEntranceProvider({children}: {children: ReactNode}) {
  const pathname = usePathname()
  const isHome = pathname === '/en' || pathname === '/es'
  const [state, setState] = useState<{path: string; stage: Stage}>({path: pathname, stage: 'intro'})
  const stage = isHome ? (state.path === pathname ? state.stage : 'intro') : 'complete'

  useEffect(() => {
    setState({path: pathname, stage: 'intro'})
    if (!isHome) return
    const collapse = window.setTimeout(() => setState({path: pathname, stage: 'collapsing'}), 5000)
    const complete = window.setTimeout(() => setState({path: pathname, stage: 'complete'}), 5500)
    return () => { window.clearTimeout(collapse); window.clearTimeout(complete) }
  }, [pathname, isHome])

  return <EntranceContext.Provider value={stage}>{children}</EntranceContext.Provider>
}

export function useHomepageEntrance() { return useContext(EntranceContext) }

export function HomepageIdentity({children}: {children: ReactNode}) {
  const stage = useHomepageEntrance()
  return <div className="homepage-identity" data-stage={stage} aria-hidden={stage === 'complete'}>
    <div className="homepage-identity-content">{children}</div>
  </div>
}
