'use client'
import { useEffect, useRef, useState, useId, type ReactNode } from 'react'
import { analyzePhase14Market, loadPhase14Options } from '@/lib/comparative-discovery-action'
import type { Phase14ApplicationRequest, Phase14ApplicationResponse, Phase14Catalog, Phase14Option, Phase14ListingPresentation } from '@/lib/comparative-discovery-contract'
import type { Phase14BrowserSuccess, Phase14BrowserFailureCode } from '@/lib/phase14-browser-contract'
import type { Phase14Filters, Phase14FactConstraint, Phase14FactDimension, Phase14SemanticDimension, Phase14PropertyAreaKey, Phase14ConstructionAreaKey } from '@/lib/phase14-question-contract'
import { matchesSubmission, type Language } from '@/lib/comparative-discovery-presentation'
import Phase14Results, { type QuestionLabels } from './Phase14Results'
import styles from './Phase14Discovery.module.css'
const dimensions = {
  property_type:['Property type','Tipo de propiedad'],environment:['Environment','Entorno'],terrain:['Terrain','Terreno'],utility:['Utilities','Servicios'],accessibility:['Accessibility','Accesibilidad'],legal_status:['Legal status','Estado legal'],
  bedrooms:['Bedrooms','Dormitorios'],bathrooms:['Bathrooms','Baños'],parking:['Parking','Estacionamientos'],year_built:['Year built','Año de construcción'],
} as const
const semantics: Phase14SemanticDimension[]=['environment','terrain','utility','accessibility','legal_status']
const facts: Phase14FactDimension[]=['bedrooms','bathrooms','parking','year_built']
const areaOptions = {
  propertyArea:[['under-100m2','<100 m²'],['100-500m2','[100, 500) m²'],['500-1000m2','[500, 1,000) m²'],['1000-5000m2','[1,000, 5,000) m²'],['5000m2-1-hectare','[5,000, 10,000) m²'],['1-5-hectares','[10,000, 50,000) m²'],['over-5-hectares','≥50,000 m²']],
  constructionArea:[['under-50m2','<50 m²'],['50-100m2','[50, 100) m²'],['100-200m2','[100, 200) m²'],['200-400m2','[200, 400) m²'],['400-800m2','[400, 800) m²'],['800m2-plus','≥800 m²']],
} as const
export function constraintLabel(c:Phase14FactConstraint,options:readonly Phase14Option[],language:Language):string {
  if(c.kind==='exact')return `= ${c.value}`
  if(c.kind==='category')return `${language==='es'?'Categoría':'Category'}: ${options.find(o=>o.id===c.termId)?.[language] ?? (language==='es'?'Etiqueta no disponible':'Label unavailable')}`
  const r=c.interval
  return r.lower===null?`${r.upperInclusive?'≤':'<'} ${r.upper}`:r.upper===null?`${r.lowerInclusive?'≥':'>'} ${r.lower}`:`${r.lowerInclusive?'[':'('}${r.lower}, ${r.upper}${r.upperInclusive?']':')'}`
}
function FactControl({dimension,options,selected,onChange,language}:{dimension:Phase14FactDimension;options:readonly Phase14Option[];selected:readonly Phase14FactConstraint[];onChange:(v:Phase14FactConstraint[])=>void;language:Language}) {
  const es=language==='es', [kind,setKind]=useState('exact'), [value,setValue]=useState(''), [category,setCategory]=useState(''), [lower,setLower]=useState(''),[upper,setUpper]=useState(''),[li,setLi]=useState(true),[ui,setUi]=useState(false)
  const valid=kind==='exact'?/^\d+(\.\d+)?$/.test(value):kind==='category'?!!category:!!(lower||upper)&&(!lower||/^\d+(\.\d+)?$/.test(lower))&&(!upper||/^\d+(\.\d+)?$/.test(upper))
  const label=dimensions[dimension][es?1:0]
  function add(){
    if(!valid)return
    const next:Phase14FactConstraint=kind==='exact'?{kind:'exact',value}:kind==='category'?{kind:'category',termId:category}:{kind:'interval',interval:{lower:lower||null,upper:upper||null,lowerInclusive:!!lower&&li,upperInclusive:!!upper&&ui}}
    onChange([...selected,next]);setValue('');setCategory('');setLower('');setUpper('')
  }
  return <fieldset><legend>{label}</legend><div className={styles.constraint}>
    <label>{es?'Tipo de evidencia':'Evidence type'}<select value={kind} onChange={e=>setKind(e.target.value)}><option value="exact">{es?'Exacta':'Exact'}</option><option value="category">{es?'Categoría':'Category'}</option><option value="interval">{es?'Intervalo':'Interval'}</option></select></label>
    {kind==='exact'?<label>{es?'Valor exacto':'Exact value'}<input inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)}/></label>:kind==='category'?<label>{es?'Categoría':'Category'}<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">{es?'Seleccionar':'Select'}</option>{options.filter(o=>o.type===dimension).map(o=><option key={o.id} value={o.id}>{o[language]}</option>)}</select></label>:<>
      <label>{es?'Límite inferior (vacío = sin límite)':'Lower bound (blank = unbounded)'}<input inputMode="decimal" value={lower} onChange={e=>setLower(e.target.value)}/></label>
      <label className={styles.check}><input type="checkbox" checked={li} disabled={!lower} onChange={e=>setLi(e.target.checked)}/>{es?'Incluye límite inferior':'Includes lower bound'}</label>
      <label>{es?'Límite superior (vacío = sin límite)':'Upper bound (blank = unbounded)'}<input inputMode="decimal" value={upper} onChange={e=>setUpper(e.target.value)}/></label>
      <label className={styles.check}><input type="checkbox" checked={ui} disabled={!upper} onChange={e=>setUi(e.target.checked)}/>{es?'Incluye límite superior':'Includes upper bound'}</label>
    </>}
    <button type="button" disabled={!valid} onClick={add}>{es?'Agregar condición':'Add condition'}</button>
  </div><ul>{selected.map((c,i)=><li key={i}>{constraintLabel(c,options,language)} <button type="button" aria-label={`${es?'Quitar':'Remove'} ${label}: ${constraintLabel(c,options,language)}`} onClick={()=>onChange(selected.filter((_,j)=>i!==j))}>{es?'Quitar':'Remove'}</button></li>)}</ul></fieldset>
}
const failures:Record<Phase14BrowserFailureCode,[string,string]>={
  invalid_request:['Check the market question and selected constraints.','Revisa la pregunta de mercado y las condiciones seleccionadas.'],
  authentication_required:['Sign in to analyze this market.','Inicia sesión para analizar este mercado.'],
  entitlement_required:['Your account does not currently have access to this analysis.','Tu cuenta no tiene acceso actualmente a este análisis.'],
  execution_failed:['The analysis could not be completed. Try again.','No se pudo completar el análisis. Inténtalo de nuevo.'],
}
export default function Phase14Discovery({language,hub=false,initialRequest,execute=analyzePhase14Market,footer}:{language:Language;hub?:boolean;initialRequest?:Phase14ApplicationRequest;execute?:(input:Phase14ApplicationRequest)=>Promise<Phase14ApplicationResponse>;footer?:(input:Phase14ApplicationRequest,response:Phase14ApplicationResponse)=>ReactNode}) {
  const es=language==='es', [catalog,setCatalog]=useState<Phase14Catalog|null>(null)
  const [province,setProvince]=useState(''),[canton,setCanton]=useState(''),[district,setDistrict]=useState(''),[transaction,setTransaction]=useState(''),[propertyType,setPropertyType]=useState(''),[normalization,setNormalization]=useState('')
  const [semantic,setSemantic]=useState<Partial<Record<Phase14SemanticDimension,string[]>>>({}),[fact,setFact]=useState<Partial<Record<Phase14FactDimension,Phase14FactConstraint[]>>>({})
  const [propertyArea,setPropertyArea]=useState(''),[constructionArea,setConstructionArea]=useState('')
  const [pending,setPending]=useState(false),[error,setError]=useState<Phase14BrowserFailureCode|null>(null)
  const [committed,setCommitted]=useState<{result:Phase14BrowserSuccess;listings:readonly Phase14ListingPresentation[];labels:QuestionLabels;generation:number;input:Phase14ApplicationRequest;response:Phase14ApplicationResponse}|null>(null)
  const [open,setOpen]=useState(true),formId=useId(),heading=useRef<HTMLHeadingElement>(null)
  const lock=useRef(false), generation=useRef(0)
  useEffect(()=>{let live=true;loadPhase14Options().then(v=>{if(live)setCatalog(v)}).catch(()=>{if(live)setCatalog({state:'unavailable'})});return()=>{live=false;generation.current++}},[])
  const options=catalog?.state==='ready'?catalog.options:[]
  const byId=(id:string)=>options.find(o=>o.id===id)
  const geo=byId(district||canton||province)
  const ready=!!(geo&&transaction&&propertyType&&normalization&&catalog?.state==='ready')
  function restore(input:Phase14ApplicationRequest){
    const q=input.request.question,g=options.find(o=>o.type===q.geography.level&&o.code===q.geography.officialCode)
    const c=g?.type==='district'?byId(g.parentId??''):g?.type==='canton'?g:undefined
    const p=g?.type==='province'?g:byId(c?.parentId??'')
    const validTerms=Object.entries(q.filters?.semantics??{}).every(([dim,ids])=>ids.every(id=>options.some(o=>o.type===dim&&o.id===id)))&&Object.entries(q.filters?.facts??{}).every(([dim,items])=>items.every(item=>item.kind!=='category'||options.some(o=>o.type===dim&&o.id===item.termId)))
    const ancestors=input.request.ancestorAssertions
    if(!g||!p||!validTerms||ancestors?.provinceCode&&ancestors.provinceCode!==p.code||ancestors?.cantonCode&&ancestors.cantonCode!==c?.code||!options.some(o=>o.type==='property_type'&&o.id===q.propertyType.termId)){setError('invalid_request');return}
    setProvince(p.id);setCanton(c?.id??'');setDistrict(g.type==='district'?g.id:'');setTransaction(q.transaction);setPropertyType(q.propertyType.termId);setNormalization(input.normalization)
    setSemantic(Object.fromEntries(Object.entries(q.filters?.semantics??{}).map(([k,v])=>[k,[...v]])))
    setFact(Object.fromEntries(Object.entries(q.filters?.facts??{}).map(([k,v])=>[k,[...v]])))
    setPropertyArea(q.filters?.propertyArea??'');setConstructionArea(q.filters?.constructionArea??'')
  }
  useEffect(()=>{if(initialRequest&&catalog?.state==='ready'){generation.current++;lock.current=false;setPending(false);setError(null);restore(initialRequest);setOpen(true)}},[initialRequest,catalog])
  useEffect(()=>{if(hub&&committed)heading.current?.focus()},[committed,hub])
  async function analyze(){
    if(lock.current||!ready||!geo)return
    lock.current=true;setPending(true);setError(null);const token=++generation.current
    const filters:Phase14Filters={semantics:Object.fromEntries(Object.entries(semantic).filter(([,v])=>v.length)),facts:Object.fromEntries(Object.entries(fact).filter(([,v])=>v.length)),...(propertyArea?{propertyArea:propertyArea as Phase14PropertyAreaKey}:{}),...(constructionArea?{constructionArea:constructionArea as Phase14ConstructionAreaKey}:{})}
    const input:Phase14ApplicationRequest={request:{question:{version:1,transaction:transaction as 'sale'|'rent',geography:{level:geo.type as 'province'|'canton'|'district',officialCode:geo.code!},propertyType:{termId:propertyType},filters},ancestorAssertions:{provinceCode:byId(province)!.code!,...(canton?{cantonCode:byId(canton)!.code!}:{})}},normalization:normalization as 'land'|'construction'}
    const labels={} as QuestionLabels
    for(const lang of ['en','es'] as const){
      const s=lang==='es',lines=[`${s?'Geografía':'Geography'}: ${[province,canton,district].filter(Boolean).map(id=>byId(id)![lang]).join(' → ')}`,`${s?'Transacción':'Transaction'}: ${transaction==='sale'?(s?'Venta':'Sale'):(s?'Alquiler':'Rent')}`,`${dimensions.property_type[s?1:0]}: ${byId(propertyType)![lang]}`,`${s?'Normalización':'Normalization'}: ${normalization==='land'?(s?'Terreno':'Land'):(s?'Construcción':'Construction')}`]
      for(const dim of semantics)if(semantic[dim]?.length)lines.push(`${dimensions[dim][s?1:0]}: ${semantic[dim]!.map(id=>byId(id)![lang]).join(' / ')}`)
      for(const dim of facts)if(fact[dim]?.length)lines.push(`${dimensions[dim][s?1:0]}: ${fact[dim]!.map(c=>constraintLabel(c,options,lang)).join(' / ')}`)
      if(propertyArea)lines.push(`${s?'Área de terreno':'Land area'}: ${areaOptions.propertyArea.find(o=>o[0]===propertyArea)![1]}`)
      if(constructionArea)lines.push(`${s?'Área de construcción':'Construction area'}: ${areaOptions.constructionArea.find(o=>o[0]===constructionArea)![1]}`)
      labels[lang]=lines
    }
    try {
      const response=await execute(input)
      if(token!==generation.current)return
      if(response.analysis.state==='error'){setError(response.analysis.code);return}
      if(!matchesSubmission(response.analysis,input,geo.id)){setError('execution_failed');return}
      setCommitted({result:response.analysis,listings:response.listings??[],labels,generation:token,input,response});if(hub)setOpen(false)
    }catch{if(token===generation.current)setError('execution_failed')}
    finally{if(token===generation.current){lock.current=false;setPending(false)}}
  }
  return <section className={styles.panel} data-hub={hub} aria-label={es?'Descubrimiento comparativo de precio por m²':'Comparative Price / m² Discovery'}>
    <h2>{es?'Descubrimiento comparativo de precio / m²':'Comparative Price / m² Discovery'}</h2>
    <p>{hub?(es?'¿Dónde se sitúa cada anuncio elegible dentro de la distribución del precio por m² del mercado definido?':'Where does each eligible listing sit within the defined market’s Price / m² distribution?'):(es?'Define una pregunta de mercado y ejecuta el análisis explícitamente.':'Define a market question and explicitly run the analysis.')}</p>
    {catalog===null?<p role="status">{es?'Cargando opciones…':'Loading options…'}</p>:catalog.state==='unavailable'?<p role="alert">{es?'Las opciones no están disponibles. Vuelve a abrir esta página.':'Options are unavailable. Reopen this page.'}</p>:null}
    {hub&&committed&&<button type="button" disabled={pending} aria-expanded={open} aria-controls={formId} onClick={()=>{if(!open)restore(committed.input);setOpen(!open)}}>{es?'Modificar':'Modify'}</button>}
    <form id={formId} hidden={hub&&!open} onSubmit={e=>{e.preventDefault();void analyze()}}>
      <fieldset disabled={pending||catalog?.state!=='ready'}><legend>{es?'Pregunta pendiente':'Pending question'}</legend><div className={styles.fields}>
        {(['province','canton','district'] as const).map((type,i)=>{const value=[province,canton,district][i],parent=[null,province,canton][i];return <label key={type}>{(es?['Provincia','Cantón','Distrito']:['Province','Canton','District'])[i]}<select value={value} disabled={i>0&&!parent} onChange={e=>{if(i===0){setProvince(e.target.value);setCanton('');setDistrict('')}else if(i===1){setCanton(e.target.value);setDistrict('')}else setDistrict(e.target.value)}}>
          <option value="">{i===0?(es?'Seleccionar provincia':'Select province'):(es?'Sin selección adicional':'No further selection')}</option>{options.filter(o=>o.type===type&&(i===0||o.parentId===parent)).map(o=><option key={o.id} value={o.id}>{o[language]}</option>)}
        </select></label>})}
        <label>{es?'Transacción':'Transaction'}<select value={transaction} onChange={e=>setTransaction(e.target.value)}><option value="">{es?'Seleccionar':'Select'}</option><option value="sale">{es?'Venta':'Sale'}</option><option value="rent">{es?'Alquiler':'Rent'}</option></select></label>
        <label>{dimensions.property_type[es?1:0]}<select value={propertyType} onChange={e=>setPropertyType(e.target.value)}><option value="">{es?'Seleccionar':'Select'}</option>{options.filter(o=>o.type==='property_type').map(o=><option key={o.id} value={o.id}>{o[language]}</option>)}</select></label>
        <label>{es?'Normalización':'Normalization'}<select value={normalization} onChange={e=>setNormalization(e.target.value)}><option value="">{es?'Seleccionar':'Select'}</option><option value="land">{es?'Terreno':'Land'}</option><option value="construction">{es?'Construcción':'Construction'}</option></select></label>
      </div>
      <details><summary>{es?'Condiciones opcionales':'Optional constraints'}</summary><p>{es?'Agrega solo las condiciones deseadas. Las condiciones numéricas se agregan explícitamente.':'Select only the desired constraints. Numerical conditions are added explicitly.'}</p><div className={styles.fields}>
        {semantics.map(dim=><label key={dim}>{dimensions[dim][es?1:0]}<select multiple value={semantic[dim]??[]} onChange={e=>setSemantic(old=>({...old,[dim]:Array.from(e.target.selectedOptions,o=>o.value)}))}>{options.filter(o=>o.type===dim).map(o=><option key={o.id} value={o.id}>{o[language]}</option>)}</select><button type="button" onClick={()=>setSemantic(old=>({...old,[dim]:[]}))}>{es?'Quitar selección':'Clear selection'}</button></label>)}
      </div>{facts.map(dim=><FactControl key={dim} dimension={dim} language={language} options={options} selected={fact[dim]??[]} onChange={v=>setFact(old=>({...old,[dim]:v}))}/>)}
      <div className={styles.fields}>{(['propertyArea','constructionArea'] as const).map(key=><label key={key}>{key==='propertyArea'?(es?'Área de terreno':'Land area'):(es?'Área de construcción':'Construction area')}<select value={key==='propertyArea'?propertyArea:constructionArea} onChange={e=>(key==='propertyArea'?setPropertyArea:setConstructionArea)(e.target.value)}><option value="">{es?'Sin condición':'No constraint'}</option>{areaOptions[key].map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>)}</div>
      </details>
      <button type="submit" disabled={!ready||pending}>{pending?(es?'Analizando…':'Analyzing…'):(es?'Analizar mercado':'Analyze Market')}</button>
      </fieldset>
    </form>
    {pending&&<p role="status">{es?'Analizando la pregunta enviada. El resultado anterior permanece visible.':'Analyzing the submitted question. The previous result remains visible.'}</p>}
    {error&&<p role="alert">{failures[error][es?1:0]}</p>}
    {committed&&<div key={committed.generation} aria-busy={pending}>
      {hub&&<h3 ref={heading} tabIndex={-1}>{es?'Evidencia del mercado comprometido':'Committed market evidence'}</h3>}
      <Phase14Results result={committed.result} listings={committed.listings} labels={committed.labels} language={language}/>
      {footer?.(committed.input,committed.response)}
    </div>}
  </section>
}
