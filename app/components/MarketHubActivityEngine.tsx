type ActivityEvent = {
  eventType:
    | 'property_viewed'
    | 'property_saved'
    | 'property_shared'
  count: number
}

type MarketHubActivityEngineProps = {
  language: 'en' | 'es'
  propertyEvents: ActivityEvent[]
}

export default function MarketHubActivityEngine({
  language,
  propertyEvents
}: MarketHubActivityEngineProps) {
  const labels =
    language === 'es'
      ? {
          phase: 'Fase 1',
          step: 'Paso 1',
          title: 'Actividad de Propiedades',
          viewed: 'Vistas',
          saved: 'Guardadas',
          shared: 'Compartidas'
        }
      : {
          phase: 'Phase 1',
          step: 'Step 1',
          title: 'Property Activity',
          viewed: 'Viewed',
          saved: 'Saved',
          shared: 'Shared'
        }

  const getLabel = (
    eventType: ActivityEvent['eventType']
  ) => {
    switch (eventType) {
      case 'property_viewed':
        return labels.viewed
      case 'property_saved':
        return labels.saved
      case 'property_shared':
        return labels.shared
    }
  }

  return (
    <section style={card}>
      <div style={eyebrow}>
        {labels.phase} · {labels.step}
      </div>

      <h2 style={heading}>
        {labels.title}
      </h2>

      <div style={grid}>
        {propertyEvents.map(event => (
          <article
            key={event.eventType}
            style={eventCard}
          >
            <div style={count}>
              {event.count}
            </div>

            <div style={label}>
              {getLabel(event.eventType)}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

const card = {
  padding: '1.5rem',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1rem'
}

const eyebrow = {
  marginBottom: '.5rem',
  color: '#777',
  fontSize: '.75rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px'
}

const heading = {
  margin: '0 0 1.25rem',
  color: '#fff',
  fontSize: '1.5rem'
}

const grid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem'
}

const eventCard = {
  padding: '1.25rem',
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '.9rem'
}

const count = {
  color: '#fff',
  fontSize: '2rem',
  fontWeight: 700
}

const label = {
  marginTop: '.35rem',
  color: '#999',
  fontSize: '.9rem'
}