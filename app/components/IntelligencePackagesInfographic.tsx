'use client'

import {BarChart3, CalendarDays, Check, Landmark, Layers3, Minus} from 'lucide-react'
import catalog from '@/lib/methodology-content/commercial.json'
import {useSiteTheme} from './theme/ThemeProvider'
import './intelligence-packages-infographic.css'

type Language = 'en'|'es'
type PackageId = 'pkg-geographic-distribution-price-range'|'pkg-matching-market-comparison'|'pkg-pricing-position-relationships'

const packageIds:PackageId[]=['pkg-geographic-distribution-price-range','pkg-matching-market-comparison','pkg-pricing-position-relationships']
const packages=Object.fromEntries(catalog.currentPackages.map(value=>[value.id,value.capabilities])) as Record<PackageId,string[]>
const capabilityIds=new Set(catalog.capabilities.map(capability=>capability.id))

if(catalog.capabilities.length!==17||capabilityIds.size!==17||packageIds.some((id,index)=>packages[id]?.length!==[3,7,17][index]))throw Error('Canonical Intelligence Package catalog is inconsistent.')

const tiers=[
  {id:packageIds[0],key:'entertainment',count:3,en:'Entertainment',es:'Entretenimiento',description:{en:'A focused view of the market to explore asking prices, property types, and key market conditions.',es:'Una visión enfocada del mercado para explorar precios de oferta, tipos de propiedades y condiciones clave.'}},
  {id:packageIds[1],key:'professional',count:7,en:'Professional',es:'Profesional',description:{en:'A broader analytical toolkit to compare markets, analyze prices per m², and find matching properties.',es:'Un conjunto analítico más amplio para comparar mercados, analizar precios por m² y encontrar propiedades comparables.'}},
  {id:packageIds[2],key:'corporate',count:17,en:'Corporate',es:'Corporativo',description:{en:'Complete market intelligence with advanced modeling, custom cohorts, and multidimensional analysis.',es:'Inteligencia de mercado completa con modelamiento avanzado, cohortes personalizadas y análisis multidimensional.'}}
] as const

const information=[
  {Icon:CalendarDays,en:'Access Options',es:'Opciones de acceso',copy:{en:'Monthly access or 24-hour access.',es:'Acceso mensual o acceso por 24 horas.'}},
  {Icon:Landmark,en:'Bank Properties & Foreclosures',es:'Propiedades bancarias y remates',copy:{en:'Optional monthly access to eligible bank properties and foreclosures.',es:'Acceso mensual opcional a propiedades bancarias y remates elegibles.'}},
  {Icon:Layers3,en:'Progressive Capabilities',es:'Capacidades progresivas',copy:{en:'Each package includes all capabilities from the prior tier, plus additional analytical engines.',es:'Cada paquete incluye todas las capacidades del nivel anterior, además de motores analíticos adicionales.'}},
  {Icon:BarChart3,en:'Evidence-Based Analysis',es:'Análisis basado en evidencia',copy:{en:"Measure, compare, and explore Costa Rica's real estate market with transparent, data-driven tools.",es:'Mida, compare y explore el mercado inmobiliario de Costa Rica con herramientas transparentes y basadas en datos.'}}
] as const

export default function IntelligencePackagesInfographic({language}:{language:Language}){
  const {theme}=useSiteTheme()
  const es=language==='es'
  const text=(en:string,sp:string)=>es?sp:en
  return <section className="intelligence-packages-native" data-theme={theme} aria-labelledby="intelligence-packages-native-title">
    <header className="intelligence-packages-native-header">
      <div className="intelligence-packages-brand"><span/><strong>TWUANIS</strong><span/></div>
      <h2 id="intelligence-packages-native-title">{text('Real Estate Intelligence Packages','Paquetes de Inteligencia Inmobiliaria')}</h2>
      <p>{text("Explore Costa Rica's real estate market through 3 packages and 17 analytical engines.",'Explore el mercado inmobiliario de Costa Rica a través de 3 paquetes y 17 motores analíticos.')}</p>
    </header>

    <div className="intelligence-packages-tier-grid">
      {tiers.map(tier=><article key={tier.id} className="intelligence-packages-tier" data-tier={tier.key}>
        <h3>{es?tier.es:tier.en}</h3>
        <strong>{tier.count}</strong>
        <span>{text('Analytical Engines','Motores Analíticos')}</span>
        <p>{es?tier.description.es:tier.description.en}</p>
      </article>)}
    </div>

    <div className="intelligence-packages-table-scroll" tabIndex={0} aria-label={text('Package capability comparison','Comparación de capacidades por paquete')}>
      <table className="intelligence-packages-table">
        <thead><tr><th scope="col">{text('Analytical Capability','Capacidad Analítica')}</th>{tiers.map(tier=><th key={tier.id} scope="col" data-tier={tier.key}>{es?tier.es:tier.en}<small>({tier.count})</small></th>)}</tr></thead>
        <tbody>{catalog.capabilities.map(capability=><tr key={capability.id}><th scope="row">{es?capability.name_es:capability.name_en}</th>{tiers.map(tier=>{const included=packages[tier.id].includes(capability.id);return <td key={tier.id} data-tier={tier.key} aria-label={included?text('Included','Incluido'):text('Not included','No incluido')}>{included?<Check aria-hidden="true"/>:<Minus aria-hidden="true"/>}</td>})}</tr>)}</tbody>
      </table>
    </div>

    <div className="intelligence-packages-information">
      {information.map(({Icon,en,es:spanish,copy})=><article key={en}><Icon aria-hidden="true"/><div><h3>{text(en,spanish)}</h3><p>{es?copy.es:copy.en}</p></div></article>)}
    </div>
  </section>
}
