'use client'

import ListingIntelligencePanel from './ListingIntelligencePanel'
import type {Context,Lang} from '@/lib/lpi-contract'
import styles from './ListingIntelligenceAside.module.css'

/**
 * The publish pages share one placement for the existing draft intelligence
 * experience.  This wrapper deliberately does not derive or own listing data:
 * it only provides the responsive right-column presentation.
 */
export default function ListingIntelligenceAside({context,language}:{context:Context;language:Lang}){
  return <aside className={styles.aside}>
    <ListingIntelligencePanel context={context} language={language}/>
  </aside>
}
