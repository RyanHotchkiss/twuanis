'use client'
import CanonicalMarketWorkspace from '../CanonicalMarketWorkspace'
import type { ExplorerOptions, Filters, Language } from '../market-filters/types'
import { question, type SummaryResult } from './contract'
import styles from './workspace.module.css'
export default function MarketSummary({options,filters,language='en'}:{options:ExplorerOptions;filters:Filters;language?:Language}) {
 const es=language==='es',number=new Intl.NumberFormat(es?'es-CR':'en-US')
 return <CanonicalMarketWorkspace<SummaryResult> options={options} filters={filters} language={language} engine="summary" title={es?'Resumen del mercado':'Market Summary'} primaryQuestion={question[language]}>
  {(committed,resultHeading,id)=><>
   <section className={styles.evidence} aria-labelledby={`${id}-inventory`}>
    <h3 id={`${id}-inventory`} ref={resultHeading} tabIndex={-1}>{es?'Inventario actual':'Current inventory'}</h3>
    <p className={styles.sectionQuestion}>{question[language]}</p>
    <p className={styles.count}><strong>{number.format(committed.result.n)}</strong><span>{es?'anuncios':'listings'}</span></p>
   </section>
   {!committed.filters.transaction_type&&<section className={styles.transactions}>
    <h3>{es?'Por transacción':'By transaction'}</h3>
    <p className={styles.sectionQuestion}>{es?'¿Cuántos anuncios están en venta y cuántos en alquiler en el mercado inmobiliario definido de Costa Rica?':'How many listings are for sale, and how many are for rent, in the defined Costa Rica real estate market?'}</p>
    <dl><div><dt>{es?'En venta':'For sale'}</dt><dd>{number.format(committed.result.saleCount)}</dd></div><div><dt>{es?'En alquiler':'For rent'}</dt><dd>{number.format(committed.result.rentCount)}</dd></div></dl>
   </section>}
   <details className={styles.method}><summary>{es?'Metodología':'Methodology'}</summary><p>{es?'Conteo completo de anuncios activos con datos canónicos vigentes que cumplen la definición del mercado analizado. Cuenta anuncios, no propiedades físicas únicas ni transacciones cerradas.':'Complete count of active listings with current canonical data that meet the analyzed market definition. Counts listings, not unique physical properties or closed transactions.'}</p><p>{es?'Sin restricción de transacción, venta y alquiler subdividen el mismo inventario. Con una transacción seleccionada, el total incluye únicamente esa transacción. Cero es un resultado completo; un fallo no es cero.':'Without a transaction restriction, sale and rent subdivide the same inventory. With a selected transaction, the total includes only that transaction. Zero is a complete result; a failure is not zero.'}</p></details>
  </>}
 </CanonicalMarketWorkspace>
}
