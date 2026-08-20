'use client'

import Link
  from 'next/link'

import {
  useSearchParams
} from 'next/navigation'

import {
  Building2,
  GitCompareArrows,
  Network
} from 'lucide-react'

import PropertyComparisonPanel
  from '@/app/components/comparisons/PropertyComparisonPanel'

import PropertyComparisonEngine
  from '@/app/components/comparisons/PropertyComparisonEngine'

import MarketComparisonPanel
  from '@/app/components/comparisons/MarketComparisonPanel'

import EntityComparisonPanel
  from '@/app/components/comparisons/EntityComparisonPanel'

import MarketComparisonFilters
from '@/app/components/MarketComparisonFilters'

import MarketComparisonResults
  from '@/app/market-comparison/MarketComparisonResults'

type SupportedLanguage =
  | 'en'
  | 'es'


type CompareMode =
  | 'properties'
  | 'markets'
  | 'entities'


type MarketHubCompareProps = {
  language:
    SupportedLanguage

  marketOptions?:
    any

  marketFilters?:
    Record<
      string,
      string | undefined
    >

  marketComparison?:
    any
}


export default function MarketHubCompare({
  language,
  marketOptions,
  marketFilters,
  marketComparison
}: MarketHubCompareProps) {

  const searchParams =
    useSearchParams()


  const requestedMode =
    searchParams.get(
      'compare'
    )


  const validModes:
    CompareMode[] = [
      'properties',
      'markets',
      'entities'
    ]


  const activeMode:
    CompareMode =
    validModes.includes(
      requestedMode as CompareMode
    )
      ? (
          requestedMode as
            CompareMode
        )
      : 'properties'


  const propertyIds =
    searchParams.getAll(
      'property'
    )


  const hasActivePropertyComparison =
    activeMode ===
      'properties' &&
    propertyIds.length >= 2

  const leftMarketFilters = {
    a_transaction_type:
      marketFilters?.a_transaction_type,

    a_province:
      marketFilters?.a_province,

    a_canton:
      marketFilters?.a_canton,

    a_district:
      marketFilters?.a_district,

    a_property_type:
      marketFilters?.a_property_type,

    a_bedrooms:
      marketFilters?.a_bedrooms,

    a_bathrooms:
      marketFilters?.a_bathrooms,

    a_parking:
      marketFilters?.a_parking,

    a_price_range:
      marketFilters?.a_price_range,

    a_property_area:
      marketFilters?.a_property_area,

    a_construction_area:
      marketFilters?.a_construction_area,

    a_year_built:
      marketFilters?.a_year_built,

    a_environment:
      marketFilters?.a_environment,

    a_terrain:
      marketFilters?.a_terrain,

    a_utility:
      marketFilters?.a_utility,

    a_accessibility:
      marketFilters?.a_accessibility,

    a_distance_to_paved_road_range:
      marketFilters?.a_distance_to_paved_road_range,

    a_legal_status:
      marketFilters?.a_legal_status
  }


  const rightMarketFilters = {
    b_transaction_type:
      marketFilters?.b_transaction_type,

    b_province:
      marketFilters?.b_province,

    b_canton:
      marketFilters?.b_canton,

    b_district:
      marketFilters?.b_district,

    b_property_type:
      marketFilters?.b_property_type,

    b_bedrooms:
      marketFilters?.b_bedrooms,

    b_bathrooms:
      marketFilters?.b_bathrooms,

    b_parking:
      marketFilters?.b_parking,

    b_price_range:
      marketFilters?.b_price_range,

    b_property_area:
      marketFilters?.b_property_area,

    b_construction_area:
      marketFilters?.b_construction_area,

    b_year_built:
      marketFilters?.b_year_built,

    b_environment:
      marketFilters?.b_environment,

    b_terrain:
      marketFilters?.b_terrain,

    b_utility:
      marketFilters?.b_utility,

    b_accessibility:
      marketFilters?.b_accessibility,

    b_distance_to_paved_road_range:
      marketFilters?.b_distance_to_paved_road_range,

    b_legal_status:
      marketFilters?.b_legal_status
  }


  const labels =
    language === 'es'
      ? {
          eyebrow:
            'SISTEMA DE COMPARACIÓN',

          title:
            'Compare desde tres perspectivas.',

          description:
            'Compare propiedades individuales, mercados definidos por criterios o entidades del grafo de conocimiento sin mezclar sus significados.',

          properties:
            'Propiedades',

          markets:
            'Mercados',

          entities:
            'Entidades',

          propertiesType:
            'REGISTROS',

          marketsType:
            'COHORTES',

          entitiesType:
            'NODOS',

          propertiesDescription:
            'Compare propiedades específicas lado a lado.',

          marketsDescription:
            'Compare dos poblaciones inmobiliarias definidas independientemente.',

          entitiesDescription:
            'Compare entidades de la ontología mediante estadísticas y conocimiento estructurado.',

          activePropertyEyebrow:
            'COMPARACIÓN ACTIVA',

          activePropertyTitle:
            'Comparación de Propiedades',

          savedPropertyEyebrow:
            'COMPARACIONES GUARDADAS',

          savedPropertyTitle:
            'Comparaciones de Propiedades',

          marketEyebrow:
            'COMPARACIONES DE COHORTES',

          marketTitle:
            'Comparaciones de Mercados',

          entityEyebrow:
            'COMPARACIONES DEL GRAFO',

          entityTitle:
            'Comparaciones de Entidades'
        }
      : {
          eyebrow:
            'COMPARISON SYSTEM',

          title:
            'Compare from three perspectives.',

          description:
            'Compare individual properties, criteria-defined markets, or knowledge-graph entities without mixing their meanings.',

          properties:
            'Properties',

          markets:
            'Markets',

          entities:
            'Entities',

          propertiesType:
            'RECORDS',

          marketsType:
            'COHORTS',

          entitiesType:
            'NODES',

          propertiesDescription:
            'Compare specific properties side by side.',

          marketsDescription:
            'Compare two independently defined real estate populations.',

          entitiesDescription:
            'Compare ontology entities through statistics and structured knowledge.',

          activePropertyEyebrow:
            'ACTIVE COMPARISON',

          activePropertyTitle:
            'Property Comparison',

          savedPropertyEyebrow:
            'SAVED COMPARISONS',

          savedPropertyTitle:
            'Property Comparisons',

          marketEyebrow:
            'COHORT COMPARISONS',

          marketTitle:
            'Market Comparisons',

          entityEyebrow:
            'GRAPH COMPARISONS',

          entityTitle:
            'Entity Comparisons'
        }


  const modes = [
    {
      id:
        'properties' as const,

      label:
        labels.properties,

      type:
        labels.propertiesType,

      description:
        labels.propertiesDescription,

      icon:
        Building2
    },

    {
      id:
        'markets' as const,

      label:
        labels.markets,

      type:
        labels.marketsType,

      description:
        labels.marketsDescription,

      icon:
        GitCompareArrows
    },

    {
      id:
        'entities' as const,

      label:
        labels.entities,

      type:
        labels.entitiesType,

      description:
        labels.entitiesDescription,

      icon:
        Network
    }
  ]


  function getModeHref(
    mode:
      CompareMode
  ) {
    const basePath =
      language === 'es'
        ? '/es/centro-de-mercado'
        : '/en/market-hub'


    const params =
      new URLSearchParams()

    params.set(
      'intelligence',
      'comparison'
    )

    params.set(
      'compare',
      mode
    )


    /*
     * Property IDs belong only to
     * Property Comparison.
     *
     * Preserve them only while remaining
     * in the Property mode.
     */

    if (
      mode === 'properties' &&
      activeMode === 'properties'
    ) {
      propertyIds.forEach(
        propertyId => {
          params.append(
            'property',
            propertyId
          )
        }
      )
    }


    return `${basePath}?${params.toString()}`
  }


  const activeHeading =
    activeMode === 'properties'
      ? {
          eyebrow:
            hasActivePropertyComparison
              ? labels.activePropertyEyebrow
              : labels.savedPropertyEyebrow,

          title:
            hasActivePropertyComparison
              ? labels.activePropertyTitle
              : labels.savedPropertyTitle
        }
      : activeMode === 'markets'
      ? {
          eyebrow:
            labels.marketEyebrow,

          title:
            labels.marketTitle
        }
      : {
          eyebrow:
            labels.entityEyebrow,

          title:
            labels.entityTitle
        }


  return (
    <section style={workspace}>

      <header style={hero}>

        <div style={heroCopy}>

          <div style={eyebrow}>
            {labels.eyebrow}
          </div>

          <h2 style={heroTitle}>
            {labels.title}
          </h2>

          <p style={heroDescription}>
            {labels.description}
          </p>

        </div>

      </header>


      <nav
        aria-label={
          language === 'es'
            ? 'Tipos de comparación'
            : 'Comparison types'
        }
        style={modeNavigation}
      >

        {modes.map(
          mode => {

            const Icon =
              mode.icon

            const selected =
              activeMode ===
              mode.id

            return (
              <Link
                key={mode.id}
                href={
                  getModeHref(
                    mode.id
                  )
                }
                style={{
                  ...modeCard,

                  ...(selected
                    ? selectedModeCard
                    : {})
                }}
              >

                <div style={modeHeader}>

                  <div
                    style={{
                      ...modeIcon,

                      ...(selected
                        ? selectedModeIcon
                        : {})
                    }}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1}
                    />
                  </div>


                  <div
                    style={{
                      ...modeType,

                      color:
                        selected
                          ? '#C7A44B'
                          : '#626262'
                    }}
                  >
                    {mode.type}
                  </div>

                </div>


                <div style={modeLabel}>
                  {mode.label}
                </div>


                <div style={modeDescription}>
                  {mode.description}
                </div>

              </Link>
            )
          }
        )}

      </nav>


      <div style={divider} />


      <section style={activeWorkspace}>

        <div style={workspaceHeader}>

          <div style={workspaceEyebrow}>
            {activeHeading.eyebrow}
          </div>

          <h3 style={workspaceTitle}>
            {activeHeading.title}
          </h3>

        </div>


        <div style={workspaceCanvas}>

          {activeMode ===
            'properties' && (

            hasActivePropertyComparison
              ? (
                <PropertyComparisonEngine
                  language={language}
                />
              )
              : (
                <PropertyComparisonPanel
                  language={language}
                />
              )

          )}


          {activeMode ===
            'markets' && (

            <div style={marketWorkspace}>

              {marketOptions && (
                <section style={marketBuilder}>

                  <div style={marketBuilderHeader}>
                    <div style={workspaceEyebrow}>
                      {language === 'es'
                        ? 'DEFINIR MERCADOS'
                        : 'DEFINE MARKETS'}
                    </div>

                    <h4 style={marketBuilderTitle}>
                      {language === 'es'
                        ? 'Construya Mercado A y Mercado B'
                        : 'Build Market A and Market B'}
                    </h4>

                    <p style={marketBuilderDescription}>
                      {language === 'es'
                        ? 'Cada lado define una población inmobiliaria independiente. Configure ambos mercados y luego ejecute la comparación.'
                        : 'Each side defines an independent real estate population. Configure both markets, then run the comparison.'}
                    </p>
                  </div>

                  <MarketComparisonFilters
                    language={language}
                    options={marketOptions}
                    leftFilters={
                      leftMarketFilters
                    }
                    rightFilters={
                      rightMarketFilters
                    }
                    embedded
                  />

                </section>
              )}


              {marketComparison && (
                <section style={marketResults}>
                  <MarketComparisonResults
                    comparison={
                      marketComparison
                    }
                  />
                </section>
              )}


              <section style={savedMarkets}>
                <div style={marketBuilderHeader}>
                  <div style={workspaceEyebrow}>
                    {language === 'es'
                      ? 'HISTORIAL'
                      : 'HISTORY'}
                  </div>

                  <h4 style={marketBuilderTitle}>
                    {language === 'es'
                      ? 'Comparaciones Guardadas'
                      : 'Saved Market Comparisons'}
                  </h4>
                </div>

                <MarketComparisonPanel
                  language={language}
                />
              </section>

            </div>

          )}


          {activeMode ===
            'entities' && (

            <EntityComparisonPanel
              language={language}
            />

          )}

        </div>

      </section>

    </section>
  )
}


const workspace = {
  display: 'grid',
  gap: '1.5rem',
  minWidth: 0
}


const hero = {
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background:
    'linear-gradient(135deg, #151515 0%, #0d0d0d 100%)',
  border:
    '1px solid #252525',
  borderRadius:
    '20px'
}


const heroCopy = {
  maxWidth:
    '820px'
}


const eyebrow = {
  marginBottom:
    '.55rem',
  color:
    '#C7A44B',
  fontSize:
    '.68rem',
  fontWeight:
    700,
  letterSpacing:
    '.14em'
}


const heroTitle = {
  margin:
    0,
  color:
    '#f3f0e8',
  fontSize:
    'clamp(1.8rem, 4vw, 3rem)',
  fontWeight:
    400,
  lineHeight:
    1.08,
  letterSpacing:
    '-.03em'
}


const heroDescription = {
  maxWidth:
    '720px',
  margin:
    '.85rem 0 0',
  color:
    '#808080',
  fontSize:
    '.92rem',
  lineHeight:
    1.65
}


const modeNavigation = {
  display:
    'grid',
  gridTemplateColumns:
    'repeat(3, minmax(0, 1fr))',
  gap:
    '.75rem'
}


const modeCard = {
  minWidth:
    0,
  padding:
    '1.2rem',
  color:
    'inherit',
  background:
    '#101010',
  border:
    '1px solid #242424',
  borderRadius:
    '16px',
  textDecoration:
    'none',
  transition:
    'border-color 160ms ease, background 160ms ease'
}


const selectedModeCard = {
  background:
    'linear-gradient(145deg, #16140d, #101010)',
  border:
    '1px solid #4a4027'
}


const modeHeader = {
  display:
    'flex',
  alignItems:
    'center',
  justifyContent:
    'space-between',
  gap:
    '1rem'
}


const modeIcon = {
  display:
    'flex',
  alignItems:
    'center',
  justifyContent:
    'center',
  width:
    '2.5rem',
  height:
    '2.5rem',
  color:
    '#777',
  background:
    '#171717',
  border:
    '1px solid #292929',
  borderRadius:
    '999px'
}


const selectedModeIcon = {
  color:
    '#C7A44B',
  background:
    '#19160e',
  border:
    '1px solid #453a20'
}


const modeType = {
  fontSize:
    '.6rem',
  fontWeight:
    750,
  letterSpacing:
    '.12em'
}


const modeLabel = {
  marginTop:
    '1rem',
  color:
    '#eee',
  fontSize:
    '1.05rem',
  fontWeight:
    600
}


const modeDescription = {
  marginTop:
    '.45rem',
  color:
    '#737373',
  fontSize:
    '.82rem',
  lineHeight:
    1.5
}


const divider = {
  height:
    '1px',
  background:
    'linear-gradient(90deg, #3a3322 0%, #252525 40%, transparent 100%)'
}


const activeWorkspace = {
  minWidth:
    0
}


const workspaceHeader = {
  marginBottom:
    '1.25rem'
}


const workspaceEyebrow = {
  color:
    '#696969',
  fontSize:
    '.64rem',
  fontWeight:
    700,
  letterSpacing:
    '.12em'
}


const workspaceTitle = {
  margin:
    '.35rem 0 0',
  color:
    '#eee',
  fontSize:
    '1.35rem',
  fontWeight:
    500
}


const workspaceCanvas = {
  minWidth:
    0
}

const marketWorkspace = {
  display: 'grid',
  gap: '1.5rem'
}


const marketBuilder = {
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '18px'
}


const marketBuilderHeader = {
  marginBottom: '1.5rem'
}


const marketBuilderTitle = {
  margin: '.35rem 0 0',
  color: '#eee',
  fontSize: '1.2rem',
  fontWeight: 600
}


const marketBuilderDescription = {
  maxWidth: '680px',
  margin: '.55rem 0 0',
  color: '#777',
  fontSize: '.88rem',
  lineHeight: 1.55
}


const marketResults = {
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '18px'
}


const savedMarkets = {
  padding:
    'clamp(1.25rem, 3vw, 2rem)',
  background: '#0d0d0d',
  border: '1px solid #202020',
  borderRadius: '18px'
}