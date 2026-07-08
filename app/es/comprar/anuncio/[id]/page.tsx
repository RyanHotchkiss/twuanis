import Link from 'next/link'

import { supabase } from '@/lib/supabase'

import JsonLd from '@/app/components/JsonLd'
import TopBarES from '@/app/components/TopBarES'

import { buildListingSchema } from '@/lib/schema-engine'

import {
  getGraphNeighbors,
  getOntologyTermsByIds
} from '@/lib/graph-engine'

export default async function ListingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', id)
                    .single()

                    if (error || !data) {
                    return (
                        <main
                        style={{
                            background: '#000',
                            minHeight: '100vh',
                            color: '#fff',
                            padding: '2rem'
                        }}
                        >
                        Propiedad No Encontrada
                        </main>
                    )
                    }

                    const listing = {
                    ...data,
                    images:
                        Array.isArray(data.images)
                        ? data.images
                        : typeof data.images === 'string'
                        ? (() => {
                            try {
                                return JSON.parse(data.images)
                            } catch {
                                return data.images
                                .split('|')
                                .map((img: string) => img.trim())
                                .filter(Boolean)
                            }
                            })()
                        : []
                    }

const { data: ontologyRows } = await supabase
                    .from('listings_ontology_terms')
                    .select(`
                        ontology_terms (
                        id,
                        parent_id,
                        term_name,
                        term_type,
                        slug,
                        description,
                        official_code,
                        term_name_en,
                        term_name_es,
                        slug_en,
                        slug_es
                        )
                    `)
                    .eq('listing_id', data.id)

                    const ontologyTerms =
                    ontologyRows
                        ?.map((row: any) => row.ontology_terms)
                        .filter(Boolean) || []

                    const termIds =
                    ontologyTerms
                        .map((term: any) => term.id)
                        .filter(Boolean)

let graphRows: any[] = []
let neighborTerms: any[] = []

                    if (termIds.length > 0) {

                    graphRows =
                        await getGraphNeighbors(termIds)

                    const neighborIds = [

                        ...new Set([

                        ...graphRows.map(
                            (row: any) =>
                            row.source_term_id
                        ),

                        ...graphRows.map(
                            (row: any) =>
                            row.target_term_id
                        )

                        ])

                    ]

                    neighborTerms =
                        await getOntologyTermsByIds(
                        neighborIds
                        ) || []

                    }

  const navButton = {
            background:'#FFFFFF',
            border:'.0625rem solid #FFFFFF',
            color:'#000',
            borderRadius:'999rem',
            padding:'.85rem 1.25rem',
            fontWeight:'bold',
            cursor:'pointer',
            transition:'all .2s ease',
            backdropFilter:'blur(10px)'
          }

  

console.log(
  'NEIGHBOR TERMS STATE',
  neighborTerms
)

console.log(
  'GRAPH ROWS STATE',
  graphRows
)

const schema = buildListingSchema({
                    listing,
                    ontologyTerms,
                    neighborTerms,
                    graphRows,
                    lang: 'es',
                    mode: 'buy'
                    })

if (!listing) {

  return (

    <>
      {schema && <JsonLd data={schema} />}

      <main
        style={{
          background: '#000',
          minHeight: '100vh',
          color: '#fff',
          padding: '2rem'
        }}
      >

        Propiedad No Encontrada

      </main>

    </>

  )

}

return (

  <>
    {schema && <JsonLd data={schema} />}

    <main
      style={{
        background: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding: '2rem'
      }}
    >

<TopBarES />

        {/* MAIN LAYOUT */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr .8fr',
            gap: '2rem'
          }}>

        {/* LEFT */}
        <div>

          {/* MAIN IMAGE */}
          <div style={{
            borderRadius: '1.5rem',
            overflow: 'hidden',
            marginBottom: '1rem',
            background: '#111'
          }}>

            {listing.images?.[0] ? (

              <img
                referrerPolicy="no-referrer"
                src={listing.images[0]}
                alt={listing.title}
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />

            ) : (

              <div style={{
                height: '34rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#555'
              }}>
                Sin Imagen
              </div>

            )}

                
                {/* IMAGE GRID */}
                {listing.images?.length > 1 && (

                  <div style={{
                    display:'grid',
                    gridTemplateColumns:'repeat(4, 1fr)',
                    gap:'1rem'
                  }}>

                    {listing.images.slice(1).map(
                      (image:string, index:number) => (

                        <img
                          key={index}
                          referrerPolicy="no-referrer"
                          src={image}
                          alt=""
                          style={{
                            width:'100%',
                            height:'8rem',
                            objectFit:'cover',
                            borderRadius:'1rem',
                            border:'1px solid #222'
                          }}
                        />

                      )
                    )}

                  </div>

                )}
console.log(listing.images)


          </div>
        </div>



        {/* RIGHT */}
        <div>

          <div style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: '1.5rem',
            padding: '2rem',
            position: 'sticky',
            top: '2rem'
          }}>

            <h1 style={{
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {listing.title}
            </h1>

            <p style={{
              color: '#999',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              {listing.description}
            </p>

            <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
            }}>

            {/* LOCATION */}
            <div>

            <span style={label}>
                Ubicación
            </span>

            <div style={entityCard}>
                {listing.province}
                {listing.canton && ` → ${listing.canton}`}
                {listing.district && ` → ${listing.district}`}
            </div>

            </div>

            {/* PROPERTY TYPE */}
            <div>

            <span style={label}>
                Tipo de Propiedad
            </span>

            <div style={entityCard}>
                {listing.property_type}
            </div>

            </div>

            {/* BEDROOMS */}
            {listing.bedrooms && (

            <div>

            <span style={label}>
                Habitaciones
            </span>

            <div style={entityCard}>
                {listing.bedrooms
                  ?.replace('Bedroom', 'Habitación')
                  .replace('Bedrooms', 'Habitaciones')}
            </div>

            </div>

            )}

            {/* BATHROOMS */}
            {listing.bathrooms && (

            <div>

            <span style={label}>
                Baños
            </span>

            <div style={entityCard}>
                {listing.bathrooms
                  ?.replace('Bathroom', 'Baño')
                  .replace('Bathrooms', 'Baños')}
            </div>

            </div>

            )}

            {/* PARKING */}
            {listing.parking && (

            <div>

            <span style={label}>
                Estacionamiento
            </span>

            <div style={entityCard}>
                {listing.parking
                  ?.replace('Vehicle', 'Vehículo')
                  .replace('Vehicles', 'Vehículos')}
            </div>

            </div>

            )}

            {/* YEAR BUILT */}
            {listing.year_built_range && (

            <div>

            <span style={label}>
                Año de Construcción
            </span>

            <div style={entityCard}>
                {listing.year_built_range}
            </div>

            </div>

            )}

            {/* CONSTRUCTION AREA */}
            {listing.construction_area && (

            <div>

            <span style={label}>
                Área de Construcción
            </span>

            <div style={entityCard}>
                {listing.construction_area}
            </div>

            </div>

            )}

            {/* PROPERTY AREA */}
            <div>

            <span style={label}>
                Área de la Propiedad
            </span>

            <div style={entityCard}>
                {listing.property_area}
            </div>

            </div>

            {/* ENVIRONMENT */}
            <div>

            <span style={label}>
                Entorno
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.environment}
                </span>

            </div>

            </div>

            {/* ACCESSIBILITY */}
            <div>

            <span style={label}>
                Accesibilidad
            </span>

            <div style={pillContainer}>

                {(
                  Array.isArray(listing.accessibility)
                    ? listing.accessibility
                    : typeof listing.accessibility === 'string'
                    ? [listing.accessibility]
                    : []
                ).map((item: string) => (

                  <span
                    key={item}
                    style={pillEntity}
                  >
                    {item}
                  </span>

                ))}

            </div>

            </div>

            {/* TERRAIN */}
            <div>

            <span style={label}>
                Terreno
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.terrain)
                ? listing.terrain
                : typeof listing.terrain === 'string'
                ? JSON.parse(listing.terrain)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* UTILITIES */}
            <div>

            <span style={label}>
                Servicios
            </span>

            <div style={pillContainer}>

                {(Array.isArray(listing.utility)
                ? listing.utility
                : typeof listing.utility === 'string'
                ? JSON.parse(listing.utility)
                : []
                ).map((item: string) => (

                <span
                    key={item}
                    style={pillEntity}
                >
                    {item}
                </span>

                ))}

            </div>

            </div>

            {/* LEGAL STATUS */}
            <div>

            <span style={label}>
                Estado Legal
            </span>

            <div style={pillContainer}>

                <span style={pillEntity}>
                {listing.legal_status}
                </span>

            </div>

            </div>

            {/* PRICE */}
            <div>

            <span style={label}>
                Precio
            </span>

            <div style={priceCard}>

                {listing.current_price
                  ? listing.currency === 'USD' ||
                    listing.title?.toUpperCase().includes('USD')
                    ? `$${Number(listing.current_price).toLocaleString()}`
                    : `₡${Number(listing.current_price).toLocaleString()}`
                  : listing.price_millions
                  ? `₡${Number(listing.price_millions).toLocaleString()}M`
                  : 'Precio No Disponible'}

            </div>

            </div>

            {/* WHATSAPP */}
            <div>

            <span style={label}>
                WhatsApp
            </span>

            <div style={entityCard}>
                {listing.whatsapp}
            </div>

            </div>

            </div>

            {/* CONTACT BUTTON */}
            <a
              href={`https://wa.me/${listing.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#FFFFFF',
                color: '#000',
                textDecoration: 'none',
                padding: '1rem',
                borderRadius: '999px',
                fontWeight: 'bold'
              }}
            >
              Contactar Vendedor por WhatsApp
            </a>

          </div>

        </div>

      </div>
    </main>

  </>

  )

}

const label = {
  color: '#777',
  fontSize: '.8rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  display: 'block',
  marginBottom: '.35rem'
}

const entityCard = {
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1rem',
  padding: '1rem 1.25rem',
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.6
}

const pillContainer = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: '.75rem'
}

const pillEntity = {
  background: '#181818',
  border: '1px solid #2a2a2a',
  borderRadius: '999px',
  padding: '.75rem 1rem',
  color: '#ddd',
  fontSize: '.95rem'
}

const priceCard = {
  background: '#FFFFFF',
  color: '#000',
  borderRadius: '1rem',
  padding: '1.25rem',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  textAlign: 'center' as const
}