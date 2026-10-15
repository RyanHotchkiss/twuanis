'use client'

import { monetaryPreview } from '@/lib/monetary-preview'

import {
  generatedTitleCard,
  generatedTitleLabel,
  generatedTitleValue,
  generatedDescriptionCard,
  generatedDescriptionValue
} from '@/app/styles/sell-styles'

import {
  generateListingTitle,
  generateListingDescription,
  formatWhatsAppNumber
} from '@/app/utils/listing-utils'

import DefinitionCard from '@/app/components/DefinitionCard'

type PropertyDefinitionPanelProps = {
  propertyData: any
  saleAmountUnit?: 'major' | 'crc_millions'
  usdToCrcRate: number | null
}

export default function PropertyDefinitionPanelES({
  propertyData,
  usdToCrcRate,
  saleAmountUnit = 'crc_millions'
}: PropertyDefinitionPanelProps) {

  const show_residential_fields =
    [
      'Casa',
      'Condominio',
      'Apartamento',
      'Cabaña',
      'Villa'
    ].includes(propertyData.property_type)

  return (

    <div style={panel}>

      <h2 style={heading}>
        Definición de la Propiedad
      </h2>

      <div style={generatedTitleCard}>

        <p style={generatedTitleLabel}>
          Título Generado del Anuncio
        </p>

        <h2 style={generatedTitleValue}>
          {
            generateListingTitle(propertyData, 'es')
            || 'Comience a Definir la Propiedad'
          }
        </h2>

      </div>

      <div style={generatedDescriptionCard}>

        <p style={generatedTitleLabel}>
          Descripción Generada del Anuncio
        </p>

        <p style={generatedDescriptionValue}>
          {
            generateListingDescription(propertyData, 'es')
            || 'La descripción de la propiedad se generará automáticamente.'
          }
        </p>

      </div>

      <div style={definitionGrid}>

        <DefinitionCard
          label="Ubicación"
          value={
            propertyData.province
            ? `${propertyData.province} → ${propertyData.canton || 'Seleccione cantón'}`
            : 'Seleccione provincia'
          }
        />

        <DefinitionCard
          label="Distrito"
          value={
            propertyData.district || 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Tipo de Propiedad"
          value={
            propertyData.property_type || 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Área de la Propiedad"
          value={
            propertyData.property_area || 'Aún No Definido'
          }
        />

        {show_residential_fields && (

          <>

                      <DefinitionCard
              label="Habitaciones"
              value={
                propertyData.bedrooms || 'Aún No Definido'
              }
            />

            <DefinitionCard
              label="Baños"
              value={
                propertyData.bathrooms || 'Aún No Definido'
              }
            />

            <DefinitionCard
              label="Parqueos"
              value={
                propertyData.parking || 'Aún No Definido'
              }
            />

            <DefinitionCard
              label="Año de Construcción"
              value={
                propertyData.year_built_range || 'Aún No Definido'
              }
            />

            <DefinitionCard
              label="Área de Construcción"
              value={
                propertyData.construction_area || 'Aún No Definido'
              }
            />

          </>

        )}

        <DefinitionCard
          label="Servicios"
          value={
            Array.isArray(propertyData.utility) &&
            propertyData.utility.length > 0
            ? propertyData.utility.join(', ')
            : 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Entorno"
          value={
            propertyData.environment || 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Accesibilidad"
          value={
            Array.isArray(propertyData.accessibility)
            ? (
                propertyData.accessibility.length > 0
                ? propertyData.accessibility.join(', ')
                : 'Aún No Definido'
              )
            : (
                propertyData.accessibility || 'Aún No Definido'
              )
          }
        />

        <DefinitionCard
          label="Terreno"
          value={
            Array.isArray(propertyData.terrain) &&
            propertyData.terrain.length > 0
            ? propertyData.terrain.join(', ')
            : 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Estado Legal"
          value={
            propertyData.legal_status || 'Aún No Definido'
          }
        />

        <DefinitionCard
          label="Precio"
          value={monetaryPreview(propertyData.priceMillions, propertyData.currency, saleAmountUnit, usdToCrcRate, 'es')}
        />

                <DefinitionCard
          label="Imágenes"
          value={
            propertyData.images.length > 0
            ? `${propertyData.images.length} Cargadas`
            : 'No Hay Imágenes Cargadas'
          }
        />

        <DefinitionCard
          label="WhatsApp"
          value={
            propertyData.whatsapp
            ? `+506 ${formatWhatsAppNumber(propertyData.whatsapp)}`
            : 'Aún No Definido'
          }
        />

      </div>

    </div>

  )

}

const panel = {
  background:'#0d0d0d',
  border:'.0625rem solid #222',
  borderRadius:'1.5rem',
  padding:'2rem'
}

const heading = {
  fontSize:'2rem',
  marginBottom:'2rem'
}

const definitionGrid = {
  display:'flex',
  flexDirection:'column' as const,
  gap:'1rem'
}