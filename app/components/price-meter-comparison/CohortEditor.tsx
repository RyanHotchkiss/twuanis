'use client'
import FilterSelect from '../market-filters/FilterSelect'
import {optionValue,optionLabel} from '../market-filters/utils'
import type {ExplorerOptions,Filters,FilterOption} from '../market-filters/types'
import {PROPERTY_AREA_RANGE_OPTIONS,CONSTRUCTION_AREA_RANGE_OPTIONS} from '@/lib/market-intelligence-area-ranges'
import {PRICE_METER_CONSTRUCTION_LAND_COHORTS} from '@/lib/price-meter-construction-land-cohorts'
import {characteristicTypes} from './contract'
import styles from '../market-summary/workspace.module.css'
const names:Record<string,[string,string]>={province:['Province','Provincia'],canton:['Canton','Cantón'],district:['District','Distrito'],property_type:['Property Type','Tipo de propiedad'],bedrooms:['Bedrooms','Dormitorios'],bathrooms:['Bathrooms','Baños'],parking:['Parking','Estacionamiento'],year_built:['Year Built','Año de construcción'],environment:['Environment','Entorno'],terrain:['Terrain','Terreno'],utility:['Utilities','Servicios'],accessibility:['Accessibility','Accesibilidad'],legal_status:['Legal Status','Estado legal'],property_area:['Property Area constraint','Restricción de área del terreno'],construction_area:['Construction Area constraint','Restricción de área de construcción'],construction_land_cohort:['Construction-to-Land constraint','Restricción construcción/terreno']}
export function CohortEditor({prefix,draft,options,language,onChange}:{prefix:'a'|'b';draft:Filters;options:ExplorerOptions;language:'en'|'es';onChange:(key:string,value:string)=>void}){
 const es=language==='es',cohort=`${es?'Cohorte':'Cohort'} ${prefix.toUpperCase()}`
 const label=(key:string)=>names[key]?.[es?1:0]??key
 function choices(key:string):FilterOption[]{
  if(key==='property_area'||key==='construction_area')return (key==='property_area'?PROPERTY_AREA_RANGE_OPTIONS:CONSTRUCTION_AREA_RANGE_OPTIONS).map(o=>({slug:o.value,term_name:o.label.replace('Under',es?'Menos de':'Under').replace('Over',es?'Más de':'Over')}))
  if(key==='construction_land_cohort')return PRICE_METER_CONSTRUCTION_LAND_COHORTS.map(o=>({slug:o.key,term_name:o.minimumExclusive!==null?`0 < C/L < ${o.maximumExclusive}`:o.maximumExclusive===null?`C/L ≥ ${o.minimumInclusive}`:`${o.minimumInclusive} ≤ C/L < ${o.maximumExclusive}`}))
  if(key.endsWith('_type')&&key.startsWith('characteristic'))return characteristicTypes.map(t=>({slug:t,term_name:label(t)}))
  if(key.startsWith('characteristic'))return options[draft[`${prefix}_${key}_type`] as keyof ExplorerOptions]??[]
  const available=options[key as keyof ExplorerOptions]??[]
  if(key!=='canton'&&key!=='district')return available
  const parentKey=key==='canton'?'province':'canton',selected=draft[`${prefix}_${parentKey}`]
  const parent=(options[parentKey]??[]).find(o=>optionValue(o)===selected)
  return typeof parent==='object'?available.filter(o=>typeof o==='object'&&String(o.parent_id)===String(parent.id)):[]
 }
 function field(key:string,caption=label(key)){
  const dimension=draft[`${prefix}_${key}_type`],selected=draft[`${prefix}_${key}`]??''
  if(/^characteristic_[12]$/.test(key)&&(dimension==='bedrooms'||dimension==='bathrooms')){
   const exact=selected.startsWith('exact:')
   return <div key={key}><label>{cohort} · {caption} · {es?'Tipo de evidencia':'Evidence type'}<select value={exact?'exact':'category'} onChange={e=>onChange(`${prefix}_${key}`,e.target.value==='exact'?'exact:':'')}><option value="category">{es?'Categoría registrada':'Recorded category'}</option><option value="exact">{es?'Conteo canónico exacto':'Exact canonical count'}</option></select></label>{exact?<label>{es?'Conteo exacto verificado':'Verified exact count'}<input type="number" min={dimension==='bathrooms'?'0.01':'0'} step={dimension==='bathrooms'?'any':'1'} value={selected.slice(6)} onChange={e=>onChange(`${prefix}_${key}`,'exact:'+e.target.value)}/></label>:<FilterSelect compact label={`${cohort} · ${caption}`} filterKey={`${prefix}_${key}`} filters={draft} options={choices(key)} language={language} emptyLabel={es?'Seleccionar':'Select'} onFilterChange={onChange}/>}</div>
  }
  return <FilterSelect key={key} compact label={`${cohort} · ${caption}`} filterKey={`${prefix}_${key}`} filters={draft} options={choices(key)} language={language} emptyLabel={es?'Seleccionar':'Select'} onFilterChange={onChange}/>}
 return <fieldset className={styles.fieldset}><legend>{cohort}</legend><div className={styles.inputGrid}>{['province','canton','district','property_type'].map(k=>field(k))}</div><p>{es?'Se requieren ambas características positivas, distintas entre sí.':'Both distinct positive characteristics are required.'}</p><div className={styles.inputGrid}>{[1,2].flatMap(n=>[field(`characteristic_${n}_type`,`${es?'Dimensión':'Dimension'} ${n}`),field(`characteristic_${n}`,`${es?'Característica':'Characteristic'} ${n}`)])}</div><p>{es?'Selecciona al menos una restricción de área. Los rangos son restricciones, no mediciones exactas.':'Select at least one area constraint. Ranges are constraints, not exact measurements.'}</p><div className={styles.inputGrid}>{['property_area','construction_area','construction_land_cohort'].map(k=>field(k))}</div></fieldset>
}

export function DraftCohortSummary({draft,options,language}:{draft:Filters;options:ExplorerOptions;language:'en'|'es'}){
 const es=language==='es'
 function value(prefix:string,key:string){const selected=draft[`${prefix}_${key}`];if(!selected)return null
 if(selected.startsWith('exact:'))return `${es?'Exactamente':'Exactly'} ${selected.slice(6)} ${names[draft[`${prefix}_${key}_type`]??'']?.[es?1:0]??''}`
 const type=key.startsWith('characteristic')?draft[`${prefix}_${key}_type`]:key
 const option=(options[type as keyof ExplorerOptions]??[]).find(o=>optionValue(o)===selected)
 return option?optionLabel(option,language):selected}
 return <>{(['a','b'] as const).map(prefix=><section key={prefix}><h4>{es?'Cohorte':'Cohort'} {prefix.toUpperCase()}</h4><p>{['province','canton','district'].map(k=>value(prefix,k)).filter(Boolean).join(' › ')}</p><p>{value(prefix,'property_type')}</p><p>{es?'Requiere ambas':'Requires both'}: {[1,2].map(n=>value(prefix,`characteristic_${n}`)??(es?'Sin seleccionar':'Not selected')).join(es?' y ':' and ')}</p>{(['property_area','construction_area'] as const).map(k=>draft[`${prefix}_${k}`]&&<p key={k}>{names[k][es?1:0]}: {(k==='property_area'?PROPERTY_AREA_RANGE_OPTIONS:CONSTRUCTION_AREA_RANGE_OPTIONS).find(o=>o.value===draft[`${prefix}_${k}`])?.label.replace('Under',es?'Menos de':'Under').replace('Over',es?'Más de':'Over')}</p>)}{draft[`${prefix}_construction_land_cohort`]&&<p>{es?'Construcción/terreno':'Construction-to-Land'}: {PRICE_METER_CONSTRUCTION_LAND_COHORTS.find(o=>o.key===draft[`${prefix}_construction_land_cohort`])?.label}</p>}</section>)}</>
}
