'use client'
import SharedResult from './MarketSummaryResult'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type { ExplorerOptions, Filters, Language } from '../market-filters/types'
import { question, type SummaryResult } from './contract'
import styles from './workspace.module.css'
export default function MarketSummary({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}) {
 const es=language==='es',number=new Intl.NumberFormat(es?'es-CR':'en-US')
 return <CanonicalMarketWorkspace<SummaryResult> options={options} filters={filters} language={language} engine="summary" title={es?'Resumen del mercado':'Market Summary'} primaryQuestion={question[language]}>
  {(committed,resultHeading,id)=><SharedResult committed={committed} resultHeading={resultHeading} id={id} language={language} options={options}/>}
 </CanonicalMarketWorkspace>
}
