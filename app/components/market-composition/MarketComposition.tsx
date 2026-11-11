'use client'
import SharedResult from './MarketCompositionResult'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {compositionQuestion,compositionLensQuestion,dimensionLabel,type CompositionResult} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './composition.module.css'

export default function MarketComposition({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}) {
 const es=language==='es',locale=es?'es-CR':'en-US'
 const integer=new Intl.NumberFormat(locale),percent=new Intl.NumberFormat(locale,{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2})
 return <CanonicalMarketWorkspace<CompositionResult> options={options} filters={filters} language={language} engine="composition" title={es?'Composición del mercado':'Market Composition'} primaryQuestion={compositionQuestion[language]}>
  {(committed,heading,id)=><SharedResult committed={committed} heading={heading} id={id} language={language} options={options}/>}
 </CanonicalMarketWorkspace>
}
