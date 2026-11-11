'use client'
import {usePathname} from 'next/navigation'
import {useHubUniverse} from './HubUniverseContext'
import type {ReactNode} from 'react'
import styles from './AnalyticalSynthesis.module.css'
import {isSynthesis,type Synthesis} from '@/lib/analytical-synthesis-segments'

// Presentation only. The caller supplies a conclusion from committed evidence.
export default function AnalyticalSynthesis({children,primary=false}:{children:ReactNode|Synthesis;primary?:boolean}){
 const pathname=usePathname(),population=useHubUniverse();if(population==='BANK'&&!primary)return null
 return <p className={population?styles.synthesis:styles.legacy} data-analytical-synthesis><strong className={styles.prefix}>{pathname==='/es'||pathname?.startsWith('/es/')?'Resumen de resultados:':'Results summary:'}</strong>{' '}{isSynthesis(children)?children.map((segment,index)=>segment.kind==='evidence'?<span key={index} className={styles.evidence} data-synthesis-evidence>{segment.text}</span>:segment.text):children}</p>
}
