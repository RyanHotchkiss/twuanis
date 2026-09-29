import type {PriceMeterCrossDimensionalEvidenceSet} from '@/lib/price-meter-cross-dimensional-result-contract'

// Coordinates are display geometry over server-established aggregates only.
export default function CrossPlot({evidence,language}:{evidence:PriceMeterCrossDimensionalEvidenceSet;language:'en'|'es'}){
 const es=language==='es'
 return <section aria-label={es?'Evidencia por grupo':'Evidence by group'} style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:20,marginBlock:24}}>
 {evidence.evidence.map(group=>{
  const points=group.kind==='geographic'?group.geographicStatistics.filter(g=>g.medianPricePerM2!==null).map((g,i)=>({x:i+1,y:g.medianPricePerM2!,label:g.geographyLabel,n:g.sampleSize})):
   group.coordinates.map(c=>({x:'areaM2' in c?c.areaM2:c.constructionToLandRatio,y:c.normalizedPricePerM2,label:'areaM2' in c?`${c.areaM2} m²`:`C/L ${c.constructionToLandRatio}`,n:c.observationCount}))
  const maxX=Math.max(1,...points.map(p=>p.x)),maxY=Math.max(1,...points.map(p=>p.y))
  return <figure key={group.secondaryCohortKey} style={{margin:0,minWidth:0,border:'1px solid #444',borderRadius:8,padding:16}}><figcaption>{group.secondaryCohortLabel} · n = {group.representedObservationCount}</figcaption>
   <svg viewBox="0 0 360 210" role="img" aria-label={`${group.secondaryCohortLabel}: ${es?'medianas observadas del precio por m²':'observed Price / m² medians'}`} style={{width:'100%',display:'block'}}><path d="M35 10V175H350" fill="none" stroke="#888"/><text x="5" y="15" fill="currentColor" fontSize="12">{maxY.toLocaleString(es?'es-CR':'en-US',{maximumFractionDigits:1})}</text><text x="20" y="190" fill="currentColor" fontSize="12">0</text>{points.map((p,i)=><circle key={i} cx={35+p.x/maxX*305} cy={175-p.y/maxY*150} r="5" fill="#f2c86a"><title>{p.label}: {p.y}; n={p.n}</title></circle>)}<text x="180" y="205" textAnchor="middle" fill="currentColor" fontSize="13">{group.kind==='geographic'?(es?'Geografías en el orden de la tabla':'Geographies in table order'):group.kind==='size_relationship'?(es?'Área exacta mediana (m²)':'Median exact area (m²)'):'C/L'}</text></svg>
   <p style={{fontSize:13}}>{es?'Precio por m² en el eje vertical. Cada gráfico usa su propia escala; el eje horizontal va de 0 a':'Price / m² on the vertical axis. Each plot has its own scale; the horizontal axis runs from 0 to'} {maxX.toLocaleString(es?'es-CR':'en-US',{maximumFractionDigits:3})}. {es?'Valores exactos y estados en las tablas siguientes.':'Exact values and states are in the tables below.'}</p>
  </figure>
 })}</section>
}
