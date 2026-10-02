'use client'
import {askingQuestion,matchingQuestion,discoveryQuestion} from './home-engine-cards/catalog'
import {weightedQuestion} from '@/lib/weighted-price-contract'
import {ratioQuestion} from '@/lib/asking-area-ratio-contract'
import {comparablesQuestion} from '@/lib/comparables-hub-contract'
import {positionHubQuestion} from '@/lib/position-hub-contract'
import {crossQuestion} from './price-meter-cross-dimensional/contract'
import {cohortQuestion} from './price-meter-comparison/contract'
import {constructionLandQuestion} from './price-meter-construction-land/contract'
import {geographicQuestion} from './price-meter-geography/contract'
import {sizeQuestion} from './price-meter-size/contract'
import {distributionQuestion} from './price-meter-distribution/contract'
import {configurationQuestion} from './configuration-frequency/contract'
import {comparisonQuestion} from './market-comparison/contract'
import Link from 'next/link'
import {
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { hubEngineUrl } from './intelligence-hub-navigation'
import { useId, useState } from 'react'
import { compositionQuestion } from './market-composition/contract'
import { question } from './market-summary/contract'
import styles from './market-summary/workspace.module.css'
export default function IntelligenceHubNavigator({tabs,activeTab,basePath,query,language}:{tabs:readonly {id:string;label:string;disabled?:boolean}[];activeTab:string;basePath:string;query:string;language:'en'|'es'}) {
 const [expanded,setExpanded]=useState(true),id=useId()
 return <nav className={styles.navigator} aria-label={language==='es'?'Motores de inteligencia':'Intelligence engines'}>
    
    <button
        type="button"
        className={styles.mobileNavToggle}
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() =>
            setExpanded(value => !value)
        }
        >
        <span>
            {language === 'es'
            ? 'Motores'
            : 'Engines'}
            {' · '}
            {
            activeTab === 'explorer'
                ? (
                language === 'es'
                    ? 'Resumen del mercado'
                    : 'Market Summary'
                )
                : tabs.find(
                    tab => tab.id === activeTab
                )?.label
            }
        </span>

        {expanded
            ? (
            <ChevronUp
                size={20}
                strokeWidth={1.25}
                aria-hidden="true"
            />
            )
            : (
            <ChevronDown
                size={20}
                strokeWidth={1.25}
                aria-hidden="true"
            />
            )}
        </button>
    
    <div id={id} className={styles.navItems} data-expanded={expanded}>{tabs.map(tab=>{
  const label=tab.id==='explorer'?(language==='es'?'Resumen del mercado':'Market Summary'):tab.label
  return tab.disabled?<span key={tab.id} aria-disabled="true">{label}</span>:<Link key={tab.id} prefetch={false} href={hubEngineUrl(basePath,query,tab.id)} aria-current={activeTab===tab.id?'page':undefined}>
   {label}{activeTab===tab.id&&(tab.id==='weighted-price'||tab.id==='asking-area-ratio'||tab.id==='explorer'||tab.id==='composition'||tab.id==='asking-price'||tab.id==='matching'||tab.id==='comparison'||tab.id==='scarcity'||tab.id==='price-meter'||tab.id==='geography'||tab.id==='size'||tab.id==='construction-land'||tab.id==='cohort-comparison'||tab.id==='cross-dimensional'||tab.id==='comparables'||tab.id==='position'||tab.id==='discovery')&&<small className={styles.navQuestion}>{tab.id==='weighted-price'?weightedQuestion[language]:tab.id==='asking-area-ratio'?ratioQuestion[language]:tab.id==='comparables'?comparablesQuestion[language]:tab.id==='position'?positionHubQuestion[language]:tab.id==='discovery'?discoveryQuestion[language]:tab.id==='cross-dimensional'?crossQuestion[language]:tab.id==='cohort-comparison'?cohortQuestion[language]:tab.id==='construction-land'?constructionLandQuestion[language]:tab.id==='size'?sizeQuestion[language]:tab.id==='geography'?geographicQuestion[language]:tab.id==='price-meter'?distributionQuestion[language]:tab.id==='scarcity'?configurationQuestion[language]:tab.id==='comparison'?comparisonQuestion[language]:tab.id==='matching'?matchingQuestion[language]:tab.id==='asking-price'?askingQuestion[language]:(tab.id==='composition'?compositionQuestion:question)[language]}</small>}
  </Link>
 })}</div></nav>
}
