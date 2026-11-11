'use client'
import type {ReactNode} from 'react'
import {isTypedBathroomSelection,bathroomSelectionLabel} from '@/lib/bathroom-selection'
import {summaryKeys,summaryIdentity,summaryLabel,summaryOptions,summaryOptionMatches} from './market-summary/contract'
import {optionLabel} from './market-filters/utils'
import type {Filters,ExplorerOptions,Language} from './market-filters/types'
import styles from './market-summary/workspace.module.css'
export default function CanonicalMarketIdentity({committed,engine,options,language,modify}:{committed:{filters:Filters;labels:string[]};engine:string;options:ExplorerOptions;language:Language;modify?:ReactNode}){const es=language==='es',grouped=engine==='matching'||engine==='configuration';return <div className={styles.identity}>
   <div><p className={styles.eyebrow}>{engine==='matching'?(es?'Población de búsqueda':'Search population'):(es?'Definición del mercado':'Market definition')}</p><ul aria-label={es?'Mercado analizado':'Analyzed market'}>{(grouped?summaryIdentity(Object.fromEntries(Object.entries(committed.filters).filter(([k])=>summaryKeys.slice(0,5).includes(k as never))),options,language):committed.labels).map((label,i)=><li key={i}>{label}</li>)}</ul>{grouped&&<><p className={styles.eyebrow} style={{marginTop:16}}>{engine==='configuration'?(es?'Configuración de propiedad':'Property configuration'):(es?'Atributos seleccionados':'Matching attributes')}</p><ul>{summaryKeys.slice(5).filter(k=>committed.filters[k]).map(k=><li key={k}>{summaryLabel(k,language)}: {k==='bathrooms'&&isTypedBathroomSelection(committed.filters[k])?bathroomSelectionLabel(committed.filters[k]!,language):committed.filters[k]!.split(',').map(v=>optionLabel(summaryOptions(k,options,language).find(o=>summaryOptionMatches(k,o,v))!,language)).join(' / ')}</li>)}</ul>{!summaryKeys.slice(5).some(k=>committed.filters[k])&&<p>{engine==='configuration'?(es?'Sin restricciones: todo el mercado definido':'No constraints: entire defined market'):(es?'Ninguno seleccionado':'None selected')}</p>}</>}</div>
   {modify}
  </div>
}
