import type {
  ReactNode
} from 'react'

import {
  ArrowLeft,
  Bookmark,
  History
} from 'lucide-react'


type SupportedLanguage =
  | 'en'
  | 'es'


type MarketHubIntelligenceEngineProps = {
  language:
    SupportedLanguage

  eyebrow:
    string

  title:
    string

  description:
    string

  icon?:
    ReactNode

  children:
    ReactNode

  savedCount?:
    number

  historyCount?:
    number

  onBackHref?:
    string
}


export default function MarketHubIntelligenceEngine({
  language,
  eyebrow,
  title,
  description,
  icon,
  children,
  savedCount,
  historyCount,
  onBackHref
}: MarketHubIntelligenceEngineProps) {

  const labels =
    language === 'es'
      ? {
          intelligence:
            'Inteligencia',

          saved:
            'Guardados',

          history:
            'Historial',

          back:
            'Volver'
        }
      : {
          intelligence:
            'Intelligence',

          saved:
            'Saved',

          history:
            'History',

          back:
            'Back'
        }


  return (
    <section style={workspace}>

      <header style={engineHeader}>

        <div style={engineIdentity}>

          {onBackHref && (
            <a
              href={onBackHref}
              style={backLink}
            >
              <ArrowLeft
                size={16}
                strokeWidth={1}
              />

              {labels.back}
            </a>
          )}


          <div style={eyebrowRow}>
            <span style={intelligenceEyebrow}>
              {labels.intelligence}
            </span>

            <span style={eyebrowDivider}>
              /
            </span>

            <span style={engineEyebrow}>
              {eyebrow}
            </span>
          </div>


          <div style={titleRow}>

            {icon && (
              <div style={iconShell}>
                {icon}
              </div>
            )}

            <div>
              <h2 style={engineTitle}>
                {title}
              </h2>

              <p style={descriptionStyle}>
                {description}
              </p>
            </div>

          </div>

        </div>


        {(savedCount !== undefined ||
          historyCount !== undefined) && (
          <div style={engineEvidence}>

            {savedCount !== undefined && (
              <div style={evidenceMetric}>
                <Bookmark
                  size={15}
                  strokeWidth={1}
                  color="#C7A44B"
                />

                <div>
                  <div style={metricValue}>
                    {savedCount}
                  </div>

                  <div style={metricLabel}>
                    {labels.saved}
                  </div>
                </div>
              </div>
            )}


            {historyCount !== undefined && (
              <div style={evidenceMetric}>
                <History
                  size={15}
                  strokeWidth={1}
                  color="#C7A44B"
                />

                <div>
                  <div style={metricValue}>
                    {historyCount}
                  </div>

                  <div style={metricLabel}>
                    {labels.history}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </header>


      <div style={headerDivider} />


      <main style={engineCanvas}>
        {children}
      </main>

    </section>
  )
}


const workspace = {
  minWidth: 0
}


const engineHeader = {
  display: 'grid',
  gridTemplateColumns:
    'minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: '2rem',
  padding: '.5rem 0 1.75rem'
}


const engineIdentity = {
  minWidth: 0
}


const backLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.4rem',
  marginBottom: '1.25rem',
  color: '#777',
  textDecoration: 'none',
  fontSize: '.72rem',
  fontWeight: 600
}


const eyebrowRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.45rem',
  marginBottom: '.8rem'
}


const intelligenceEyebrow = {
  color: '#C7A44B',
  fontSize: '.64rem',
  fontWeight: 750,
  letterSpacing: '.15em',
  textTransform: 'uppercase' as const
}


const eyebrowDivider = {
  color: '#393939',
  fontSize: '.65rem'
}


const engineEyebrow = {
  color: '#666',
  fontSize: '.64rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const
}


const titleRow = {
  display: 'grid',
  gridTemplateColumns:
    'auto minmax(0, 1fr)',
  alignItems: 'center',
  gap: '1.1rem'
}


const iconShell = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '4rem',
  height: '4rem',
  color: '#C7A44B',
  background:
    'linear-gradient(145deg, #18150d, #111)',
  border: '1px solid #40361e',
  borderRadius: '999px'
}


const engineTitle = {
  margin: 0,
  color: '#f2efe8',
  fontSize:
    'clamp(1.8rem, 3vw, 3rem)',
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: '-.03em'
}


const descriptionStyle = {
  maxWidth: '760px',
  margin: '.7rem 0 0',
  color: '#858585',
  fontSize: '.88rem',
  lineHeight: 1.65
}


const engineEvidence = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '1px',
  background: '#292929',
  border: '1px solid #292929'
}


const evidenceMetric = {
  minWidth: '110px',
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem',
  padding: '.85rem 1rem',
  background: '#101010'
}


const metricValue = {
  color: '#eee9df',
  fontSize: '1rem',
  fontWeight: 600,
  lineHeight: 1
}


const metricLabel = {
  marginTop: '.28rem',
  color: '#646464',
  fontSize: '.6rem',
  fontWeight: 650,
  letterSpacing: '.05em',
  textTransform: 'uppercase' as const
}


const headerDivider = {
  height: '1px',
  background:
    'linear-gradient(90deg, #3a3322 0%, #272727 38%, transparent 100%)'
}


const engineCanvas = {
  minWidth: 0,
  marginTop: '1.75rem'
}