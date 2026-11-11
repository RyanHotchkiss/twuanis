'use client'
import SharedResult from './ConfigurationFrequencyResult'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type {ExplorerOptions,Filters,Language} from '../market-filters/types'
import {configurationQuestion,configurationShareQuestion,evidenceContext,type ConfigurationResult} from './contract'
import shared from '../market-summary/workspace.module.css'
import styles from './frequency.module.css'
export default function ConfigurationFrequency({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}){
 const es=language==='es',integer=new Intl.NumberFormat(es?'es-CR':'en-US'),percent=new Intl.NumberFormat(es?'es-CR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
 return <CanonicalMarketWorkspace<ConfigurationResult> engine="configuration" options={options} filters={filters} language={language} title={es?'Frecuencia de configuración de propiedades':'Property Configuration Frequency'} primaryQuestion={configurationQuestion[language]}>
 {(committed,heading,id)=><SharedResult committed={committed} heading={heading} id={id} language={language} options={options}/>}
 </CanonicalMarketWorkspace>
}
