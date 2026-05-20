'use client'

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
  formatColones,
  convertToUSD,
  formatWhatsAppNumber
} from '@/app/utils/listing-utils'

import DefinitionCard from '@/app/components/DefinitionCard'

type PropertyDefinitionPanelProps = {
  propertyData: any
}

export default function PropertyDefinitionPanel({
  propertyData
}: PropertyDefinitionPanelProps) {

  const show_residential_fields =
    [
      'House',
      'Condo',
      'Apartment',
      'Cabin',
      'Villa'
    ].includes(propertyData.property_type)

  return (

    <div style={panel}>

      <h2 style={heading}>
        Property Definition
      </h2>

      <div style={generatedTitleCard}>

        <p style={generatedTitleLabel}>
          Generated Listing Title
        </p>

        <h2 style={generatedTitleValue}>
          {
            generateListingTitle(propertyData)
            || 'Begin Defining Property'
          }
        </h2>

      </div>

      <div style={generatedDescriptionCard}>

        <p style={generatedTitleLabel}>
          Generated Listing Description
        </p>

        <p style={generatedDescriptionValue}>
          {
            generateListingDescription(propertyData)
            || 'Property description will generate automatically.'
          }
        </p>

      </div>

      <div style={definitionGrid}>

        <DefinitionCard
          label="Location"
          value={
            propertyData.province
            ? `${propertyData.province} → ${propertyData.canton || 'Select canton'}`
            : 'Select province'
          }
        />

        <DefinitionCard
          label="District"
          value={
            propertyData.district || 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Property Type"
          value={
            propertyData.property_type || 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Property Area"
          value={
            propertyData.property_area || 'Not Yet Defined'
          }
        />

        {show_residential_fields && (

          <>

            <DefinitionCard
              label="Bedrooms"
              value={
                propertyData.bedrooms || 'Not Yet Defined'
              }
            />

            <DefinitionCard
              label="Bathrooms"
              value={
                propertyData.bathrooms || 'Not Yet Defined'
              }
            />

            <DefinitionCard
              label="Parking"
              value={
                propertyData.parking || 'Not Yet Defined'
              }
            />

            <DefinitionCard
              label="Year Built"
              value={
                propertyData.year_built_range || 'Not Yet Defined'
              }
            />

            <DefinitionCard
              label="Construction Area"
              value={
                propertyData.construction_area || 'Not Yet Defined'
              }
            />

          </>

        )}

        <DefinitionCard
          label="Utility"
          value={
            propertyData.utility.length > 0
            ? propertyData.utility.join(', ')
            : 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Environment"
          value={
            propertyData.environment || 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Accessibility"
          value={
            propertyData.accessibility.length > 0
            ? propertyData.accessibility.join(', ')
            : 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Terrain"
          value={
            propertyData.terrain.length > 0
            ? propertyData.terrain.join(', ')
            : 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Legal Status"
          value={
            propertyData.legal_status || 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Price"
          value={
            propertyData.priceMillions > 0
            ? (
              <>
                {formatColones(
                  propertyData.priceMillions
                )}

                {' · '}

                ${convertToUSD(
                  propertyData.priceMillions
                ).toLocaleString()} USD
              </>
            )
            : 'Not Yet Defined'
          }
        />

        <DefinitionCard
          label="Images"
          value={
            propertyData.images.length > 0
            ? `${propertyData.images.length} Uploaded`
            : 'No Images Uploaded'
          }
        />

        <DefinitionCard
          label="WhatsApp"
          value={
            propertyData.whatsapp
            ? `+506 ${formatWhatsAppNumber(propertyData.whatsapp)}`
            : 'Not Yet Defined'
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