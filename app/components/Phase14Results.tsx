'use client'
import { useMemo, useState } from 'react'
import type { Phase14BrowserSuccess } from '@/lib/phase14-browser-contract'
import type { Phase14ListingPresentation } from '@/lib/comparative-discovery-contract'
import { columns, initialSort, joinPresentation, sortRows, pageRows, listingHref, formatValue, type Language, type Sort } from '@/lib/comparative-discovery-presentation'
import styles from './Phase14Discovery.module.css'
export type QuestionLabels = { en: string[]; es: string[] }
export function Phase14Distribution({ result, language }: { result: Phase14BrowserSuccess; language: Language }) {
  const es=language==='es', d=result.distribution
  const stats=[['minimum',es?'Mínimo':'Minimum'],['p10','P10'],['p25','P25'],['median',es?'Mediana':'Median'],['average',es?'Promedio':'Average'],['p75','P75'],['p90','P90'],['maximum',es?'Máximo':'Maximum'],['iqr',es?'Rango intercuartílico':'Interquartile range']] as const
  const marks=['minimum','p10','p25','median','p75','p90','maximum'] as const
  return <section aria-label={es?'Distribución':'Distribution'}><h3>{es?'Distribución':'Distribution'}</h3>
    {d.state==='empty'?<p>{es?'No hay distribución establecida para una población vacía.':'No distribution is established for an empty population.'}</p>:<>
      <p>{result.unit} · n = {result.n.toLocaleString(language)}</p>
      <div className={styles.distribution} role="img" aria-label={es?'Marcadores de cuantiles; valores exactos debajo.':'Quantile markers; exact values below.'}>
        <div className={styles.axis}/>{marks.map(key=>{
          const span=d.maximum!-d.minimum!, left=span===0?50:100*(d[key]!-d.minimum!)/span
          return <span key={key} className={key==='median'?styles.median:styles.marker} style={{left:`${left}%`}} title={`${stats.find(([id])=>id===key)![1]}: ${d[key]}`}/>
        })}
      </div>
      <dl className={styles.stats}>{stats.map(([key,label])=><div key={key}><dt>{label}</dt><dd><strong>{new Intl.NumberFormat(language==='es'?'es-CR':'en-US',{maximumSignificantDigits:16}).format(d[key]!)}</strong></dd></div>)}</dl>
    </>}
  </section>
}
export default function Phase14Results({ result, listings, labels, language }: {
  result: Phase14BrowserSuccess; listings: readonly Phase14ListingPresentation[]; labels: QuestionLabels; language: Language
}) {
  const es=language==='es'
  const [sort,setSort]=useState<Sort>(initialSort), [page,setPage]=useState(1), [size,setSize]=useState(25)
  const [visible,setVisible]=useState(()=>new Set(['title','price','pricePerM2','percentilePosition','percentDifferenceFromMedian','differenceFromMedian','interval','propertyArea','constructionArea',...(result.question.geography.level==='province'?['district','canton']:result.question.geography.level==='canton'?['district']:[])]))
  const rows=useMemo(()=>joinPresentation(result,listings),[result,listings])
  const ordered=useMemo(()=>sortRows(rows,sort),[rows,sort])
  const paged=pageRows(ordered,page,size), pages=Math.max(1,Math.ceil(result.n/size))
  const shown=columns.filter(c=>c.id==='title'||visible.has(c.id))
  const selected=columns.find(c=>c.id===sort.column)!
  const changeSort=(next:Sort)=>{setSort(next);setPage(1)}
  return <div className={styles.results}>
    <section><h3>{es?'Pregunta de mercado':'Market Question'}</h3><ul>{labels[language].map((label,i)=><li key={i}>{label}</li>)}</ul></section>
    <section><h3>{es?'Población analítica':'Analytical Population'}: n = {result.n.toLocaleString(language)}</h3>
      <p>{es?'Esta es la población analítica establecida para la pregunta comprometida. No es una instantánea garantizada.':'This is the established analytical population for the committed question. A snapshot is not guaranteed.'}</p>
      {result.n===0&&<p role="status">{es?'Ningún anuncio pertenece a esta población analítica.':'No listings belong to this analytical population.'}</p>}
    </section>
    <Phase14Distribution result={result} language={language}/>
    <section><h3>{es?'Anuncios en la población analítica':'Listings in Analytical Population'}</h3>
    {result.n>0&&<>
      <p>{result.unit} · {es?'— = no disponible o no aplicable; el precio anunciado conserva su moneda original.':'— = unavailable or not applicable; listing price retains its original currency.'}</p>
      {rows.some(r=>!r.listing)&&<p>{es?'Algunos detalles de anuncios no están disponibles. Los resultados analíticos se conservan.':'Some listing details are unavailable. Analytical results are retained.'}</p>}
      <div className={styles.controls}>
        <label>{es?'Ordenar por':'Sort by'}<select value={sort.column} onChange={e=>changeSort({column:e.target.value,direction:'asc'})}>{columns.filter(c=>c.sortable).map(c=><option key={c.id} value={c.id}>{c[language]}</option>)}</select></label>
        <label>{es?'Dirección':'Direction'}<select value={sort.direction} onChange={e=>changeSort({...sort,direction:e.target.value as Sort['direction']})}><option value="asc">{es?'Ascendente':'Ascending'}</option><option value="desc">{es?'Descendente':'Descending'}</option></select></label>
        <label>{es?'Por página':'Page size'}<select value={size} onChange={e=>{setSize(Number(e.target.value));setPage(1)}}>{[25,50,100].map(n=><option key={n}>{n}</option>)}</select></label>
        <details><summary>{es?'Columnas':'Columns'}</summary><div className={styles.columnMenu}>{columns.map(c=><label key={c.id}><input type="checkbox" disabled={c.id==='title'} checked={c.id==='title'||visible.has(c.id)} onChange={e=>setVisible(old=>{const n=new Set(old);if(e.target.checked)n.add(c.id);else n.delete(c.id);return n})}/>{c[language]}</label>)}</div></details>
      </div>
      <p aria-live="polite">{es?'Orden actual':'Current sort'}: {selected[language]} · {sort.direction==='asc'?(es?'ascendente':'ascending'):(es?'descendente':'descending')}{!visible.has(sort.column)?(es?' (columna oculta)':' (column hidden)'):''}</p>
      <p className={styles.swipe}>{es?'Desliza horizontalmente para ver más columnas.':'Swipe horizontally to see more columns.'}</p>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label={es?'Tabla de población analítica, desplazable horizontalmente':'Analytical population table, horizontally scrollable'}>
        <table><caption className={styles.sr}>{es?'Anuncios en la población analítica':'Listings in Analytical Population'} · {result.unit}</caption>
          <thead><tr>{shown.map(c=><th key={c.id} scope="col" className={c.id==='title'?styles.property:c.id==='price'?styles.priceColumn:undefined} aria-sort={c.sortable?(sort.column===c.id?(sort.direction==='asc'?'ascending':'descending'):'none'):undefined}>
            {c.sortable?<button type="button" onClick={()=>changeSort({column:c.id,direction:sort.column===c.id&&sort.direction==='asc'?'desc':'asc'})}>{c[language]}{sort.column===c.id?(sort.direction==='asc'?' ↑':' ↓'):''}</button>:c[language]}
          </th>)}</tr></thead>
          <tbody>{paged.map(row=><tr key={row.analysis.listingId}>{shown.map(c=>c.id==='title'?<th scope="row" className={styles.property} key={c.id}>
            <a href={listingHref(row.analysis.listingId,result.transaction,language)} className={styles.propertyLink}>
              {row.listing?.thumbnail&&<img src={row.listing.thumbnail} width={56} height={42} loading="lazy" alt=""/>}
              <div><span>{row.listing?.title||(es?'Ver anuncio':'View listing')}</span>{visible.has('price')&&<small className={styles.mobilePrice}>{formatValue(columns[1],row,language)}</small>}</div>
            </a>
          </th>:<td key={c.id} className={c.id==='price'?styles.priceColumn:undefined}>{formatValue(c,row,language)}{c.id==='tailThreshold'&&row.analysis.strictTail?` (P${row.analysis.strictTail.thresholdPercentile})`:''}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <nav className={styles.pagination} aria-label={es?'Paginación de anuncios':'Listing pagination'}>
        <span>{(page-1)*size+1}–{Math.min(page*size,result.n)} {es?'de':'of'} {result.n}</span>
        <button type="button" disabled={page===1} onClick={()=>setPage(p=>p-1)}>{es?'Anterior':'Previous'}</button>
        <span>{es?'Página':'Page'} {page} / {pages}</span>
        <button type="button" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>{es?'Siguiente':'Next'}</button>
      </nav>
    </>}
    </section>
    <p>{es?'TWUANIS REPORTA EVIDENCIA DEL MERCADO. TWUANIS NO PRESCRIBE DECISIONES.':'TWUANIS REPORTS MARKET EVIDENCE. TWUANIS DOES NOT PRESCRIBE DECISIONS.'}</p>
  </div>
}
