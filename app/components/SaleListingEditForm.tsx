'use client'

import {
  FormEvent,
  useState
} from 'react'

import {
  useRouter
} from 'next/navigation'

import {
  supabase
} from '@/lib/supabase'

import {
  updateListing
} from '@/app/utils/updateListing'

import {
  provinces,
  districts,
  property_types,
  residential_property_types,
  bedroom_options,
  bathroom_options,
  parking_options,
  year_built_options,
  construction_area_options,
  property_areas,
  utilities,
  terrainOptions
} from '@/data/property-data'

import {
  formatColones,
  convertToUSD
} from '@/app/utils/listing-utils'

import LocationSelectorS from '@/app/components/filter-bar/LocationSelectorS'
import PropertyTypeFilterS from '@/app/components/filter-bar/PropertyTypeFilterS'
import BedroomFilterS from '@/app/components/filter-bar/BedroomFilterS'
import BathroomFilterS from '@/app/components/filter-bar/BathroomFilterS'
import ParkingFilterS from '@/app/components/filter-bar/ParkingFilterS'
import YearBuiltFilterS from '@/app/components/filter-bar/YearBuiltFilterS'
import ConstructionAreaFilterS from '@/app/components/filter-bar/ConstructionAreaFilterS'
import PropertyAreaFilterS from '@/app/components/filter-bar/PropertyAreaFilterS'
import UtilitiesFilterS from '@/app/components/filter-bar/UtilitiesFilterS'
import EnvironmentFilterS from '@/app/components/filter-bar/EnvironmentFilterS'
import AccessibilityFilterS from '@/app/components/filter-bar/AccessibilityFilterS'
import TerrainFilterS from '@/app/components/filter-bar/TerrainFilterS'
import LegalStatusFilterS from '@/app/components/filter-bar/LegalStatusFilterS'
import PriceSelectorS from '@/app/components/filter-bar/PriceSelectorS'
import PropertyDefinitionPanel from '@/app/components/PropertyDefinitionPanel'
import TopBar from '@/app/components/TopBar'

type SaleListingEditFormProps = {
  listing: any
}

function normalizeStringArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item =>
        String(item)
      )
      .filter(Boolean)
  }

  if (
    typeof value === 'string'
  ) {
    if (
      !value.trim()
    ) {
      return []
    }

    try {
      const parsed =
        JSON.parse(value)

      if (
        Array.isArray(parsed)
      ) {
        return parsed
          .map(item =>
            String(item)
          )
          .filter(Boolean)
      }
    } catch {
      return value
        .split('|')
        .map(item =>
          item.trim()
        )
        .filter(Boolean)
    }
  }

  return []
}

function normalizeAccessibility(
  value: unknown
): string {
  if (
    Array.isArray(value)
  ) {
    return value[0]
      ? String(value[0])
      : ''
  }

  return typeof value === 'string'
    ? value
    : ''
}

export default function SaleListingEditForm({
  listing
}: SaleListingEditFormProps) {
  const router =
    useRouter()

  const [propertyData, setPropertyData] =
    useState({
      province:
        listing.province || '',

      canton:
        listing.canton || '',

      district:
        listing.district || '',

      property_type:
        listing.property_type || '',

      property_area:
        listing.property_area
          ? String(
              listing.property_area
            )
          : '',

      bedrooms:
        listing.bedrooms
          ? String(
              listing.bedrooms
            )
          : '',

      bathrooms:
        listing.bathrooms
          ? String(
              listing.bathrooms
            )
          : '',

      parking:
        listing.parking
          ? String(
              listing.parking
            )
          : '',

      year_built_range:
        listing.year_built_range ||
        '',

      construction_area:
        listing.construction_area
          ? String(
              listing.construction_area
            )
          : '',

      utility:
        normalizeStringArray(
          listing.utility
        ),

      use_type:
        listing.use_type || '',

      legal_status:
        listing.legal_status || '',

      connectivity:
        listing.connectivity || '',

      environment:
        listing.environment || '',

      accessibility:
        normalizeAccessibility(
          listing.accessibility
        ),

      terrain:
        normalizeStringArray(
          listing.terrain
        ),

      priceMillions:
        Number(
          listing.price_millions ||
          0
        ),

      transaction_type: 'buy',

      listing_status:
        listing.listing_status ||
        'active',

      currency:
        listing.currency || 'CRC',

      whatsapp:
        listing.whatsapp || '',

      title:
        listing.title || '',

      description:
        listing.description || '',

      images:
        normalizeStringArray(
          listing.images
        )
    })
      const [
    showLocationOptions,
    setShowLocationOptions
  ] = useState(true)

  const [
    showProvinceOptions,
    setShowProvinceOptions
  ] = useState(true)

  const [
    showCantonOptions,
    setShowCantonOptions
  ] = useState(false)

  const [
    showDistrictOptions,
    setShowDistrictOptions
  ] = useState(false)

  const [
    showPropertyTypeOptions,
    setShowPropertyTypeOptions
  ] = useState(true)

  const [
    showBedroomOptions,
    setShowBedroomOptions
  ] = useState(true)

  const [
    showBathroomOptions,
    setShowBathroomOptions
  ] = useState(true)

  const [
    showParkingOptions,
    setShowParkingOptions
  ] = useState(true)

  const [
    showYearBuiltOptions,
    setShowYearBuiltOptions
  ] = useState(true)

  const [
    showConstructionAreaOptions,
    setShowConstructionAreaOptions
  ] = useState(true)

  const [
    showPropertyAreaOptions,
    setShowPropertyAreaOptions
  ] = useState(true)

  const [
    showUtilityOptions,
    setShowUtilityOptions
  ] = useState(true)

  const [
    showEnvironmentOptions,
    setShowEnvironmentOptions
  ] = useState(true)

  const [
    showAccessibilityOptions,
    setShowAccessibilityOptions
  ] = useState(true)

  const [
    showTerrainOptions,
    setShowTerrainOptions
  ] = useState(true)

  const [
    showLegalStatusOptions,
    setShowLegalStatusOptions
  ] = useState(true)

  const [
    saving,
    setSaving
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState('')

  function setField(
    field: string,
    value: unknown
  ) {
    setPropertyData(
      previous => ({
        ...previous,
        [field]: value
      })
    )
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      !propertyData.title.trim()
    ) {
      setErrorMessage(
        'Please enter a listing title.'
      )

      return
    }

    if (
      !propertyData.priceMillions ||
      propertyData.priceMillions <= 0
    ) {
      setErrorMessage(
        'Please enter a valid sale price.'
      )

      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      await updateListing({
        supabase,
        listingId:
          listing.id,

        updates: {
          province:
            propertyData.province,

          canton:
            propertyData.canton,

          district:
            propertyData.district,

          property_type:
            propertyData.property_type,

          bedrooms:
            propertyData.bedrooms ||
            null,

          bathrooms:
            propertyData.bathrooms ||
            null,

          parking:
            propertyData.parking ||
            null,

          year_built_range:
            propertyData.year_built_range ||
            null,

          construction_area:
            propertyData.construction_area ||
            null,

          property_area:
            propertyData.property_area ||
            null,

          utility:
            propertyData.utility,

          environment:
            propertyData.environment ||
            null,

          accessibility:
            propertyData.accessibility ||
            null,

          terrain:
            propertyData.terrain,

          legal_status:
            propertyData.legal_status ||
            null,

          price_millions:
            propertyData.priceMillions,

          monthly_price:
            null,

          transaction_type:
            'buy',

          listing_status:
            propertyData.listing_status,

          currency:
            propertyData.currency,

          whatsapp:
            propertyData.whatsapp,

          title:
            propertyData.title.trim(),

          description:
            propertyData.description.trim(),

          images:
            propertyData.images
        }
      })

      router.push(
        `/en/buy/listing/${listing.id}`
      )

      router.refresh()
    } catch (error) {
      console.error(
        'SALE LISTING UPDATE ERROR:',
        error
      )

      setErrorMessage(
        'The sale listing could not be updated.'
      )

      setSaving(false)
    }
  }

  function handleCancel() {
    router.push(
      `/en/buy/listing/${listing.id}`
    )
  }

  return (
    <main style={page}>
      <div style={container}>
        <TopBar />

        <header style={header}>
          <div>
            <p style={eyebrow}>
              Sale Listing Management
            </p>

            <h1 style={heading}>
              Edit Sale Listing
            </h1>

            <p style={intro}>
              Update the property definition,
              sale price, contact information,
              and marketplace description.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          style={form}
        >
          <div style={mainGrid}>
            <section style={editorPanel}>
              <LocationSelectorS
                province={
                  propertyData.province
                }
                canton={
                  propertyData.canton
                }
                district={
                  propertyData.district
                }
                setShowPropertyTypeOptions={
                  setShowPropertyTypeOptions
                }
                setProvince={value =>
                  setPropertyData(
                    previous => ({
                      ...previous,
                      province: value,
                      canton: '',
                      district: ''
                    })
                  )
                }
                setCanton={value =>
                  setPropertyData(
                    previous => ({
                      ...previous,
                      canton: value,
                      district: ''
                    })
                  )
                }
                setDistrict={value =>
                  setField(
                    'district',
                    value
                  )
                }
                provinces={provinces}
                districts={districts}
                showLocationOptions={
                  showLocationOptions
                }
                setShowLocationOptions={
                  setShowLocationOptions
                }
                showProvinceOptions={
                  showProvinceOptions
                }
                setShowProvinceOptions={
                  setShowProvinceOptions
                }
                showCantonOptions={
                  showCantonOptions
                }
                setShowCantonOptions={
                  setShowCantonOptions
                }
                showDistrictOptions={
                  showDistrictOptions
                }
                setShowDistrictOptions={
                  setShowDistrictOptions
                }
              />

              <PropertyTypeFilterS
                bedrooms={
                  propertyData.bedrooms
                }
                bathrooms={
                  propertyData.bathrooms
                }
                parking={
                  propertyData.parking
                }
                yearBuiltRange={
                  propertyData.year_built_range
                }
                constructionArea={
                  propertyData.construction_area
                }
                setShowPropertyAreaOptions={
                  setShowPropertyAreaOptions
                }
                setShowBedroomOptions={
                  setShowBedroomOptions
                }
                setShowProvinceOptions={
                  setShowProvinceOptions
                }
                setShowCantonOptions={
                  setShowCantonOptions
                }
                setShowDistrictOptions={
                  setShowDistrictOptions
                }
                selectedPropertyType={
                  propertyData.property_type
                }
                setSelectedPropertyType={
                  value =>
                    setField(
                      'property_type',
                      value
                    )
                }
                propertyTypes={
                  property_types
                }
                residentialPropertyTypes={
                  residential_property_types
                }
                showPropertyTypeOptions={
                  showPropertyTypeOptions
                }
                setShowPropertyTypeOptions={
                  setShowPropertyTypeOptions
                }
                resetResidentialFields={() =>
                  setPropertyData(
                    previous => ({
                      ...previous,
                      bedrooms: '',
                      bathrooms: '',
                      parking: '',
                      year_built_range: '',
                      construction_area: ''
                    })
                  )
                }
              />

              <BedroomFilterS
                selectedBedrooms={
                  propertyData.bedrooms
                }
                setSelectedBedrooms={
                  value =>
                    setField(
                      'bedrooms',
                      value
                    )
                }
                bedroomOptions={
                  bedroom_options
                }
                showBedroomOptions={
                  showBedroomOptions
                }
                setShowBedroomOptions={
                  setShowBedroomOptions
                }
                setShowBathroomOptions={
                  setShowBathroomOptions
                }
              />

              <BathroomFilterS
                selectedBathrooms={
                  propertyData.bathrooms
                }
                setSelectedBathrooms={
                  value =>
                    setField(
                      'bathrooms',
                      value
                    )
                }
                bathroomOptions={
                  bathroom_options
                }
                showBathroomOptions={
                  showBathroomOptions
                }
                setShowBathroomOptions={
                  setShowBathroomOptions
                }
                setShowParkingOptions={
                  setShowParkingOptions
                }
              />

              <ParkingFilterS
                selectedParking={
                  propertyData.parking
                }
                setSelectedParking={
                  value =>
                    setField(
                      'parking',
                      value
                    )
                }
                parkingOptions={
                  parking_options
                }
                showParkingOptions={
                  showParkingOptions
                }
                setShowParkingOptions={
                  setShowParkingOptions
                }
                setShowYearBuiltOptions={
                  setShowYearBuiltOptions
                }
              />

              <YearBuiltFilterS
                selectedYearBuilt={
                  propertyData.year_built_range
                }
                setSelectedYearBuilt={
                  value =>
                    setField(
                      'year_built_range',
                      value
                    )
                }
                yearBuiltOptions={
                  year_built_options
                }
                showYearBuiltOptions={
                  showYearBuiltOptions
                }
                setShowYearBuiltOptions={
                  setShowYearBuiltOptions
                }
                setShowConstructionAreaOptions={
                  setShowConstructionAreaOptions
                }
              />

              <ConstructionAreaFilterS
                selectedConstructionArea={
                  propertyData.construction_area
                }
                setSelectedConstructionArea={
                  value =>
                    setField(
                      'construction_area',
                      value
                    )
                }
                constructionAreaOptions={
                  construction_area_options
                }
                showConstructionAreaOptions={
                  showConstructionAreaOptions
                }
                setShowConstructionAreaOptions={
                  setShowConstructionAreaOptions
                }
                setShowPropertyAreaOptions={
                  setShowPropertyAreaOptions
                }
              />

              <PropertyAreaFilterS
                selectedPropertyArea={
                  propertyData.property_area
                }
                setSelectedPropertyArea={
                  value =>
                    setField(
                      'property_area',
                      value
                    )
                }
                showPropertyAreaOptions={
                  showPropertyAreaOptions
                }
                setShowPropertyAreaOptions={
                  setShowPropertyAreaOptions
                }
                setShowUtilityOptions={
                  setShowUtilityOptions
                }
                propertyAreas={
                  property_areas
                }
              />

              <UtilitiesFilterS
                selectedUtilities={
                  propertyData.utility
                }
                setSelectedUtilities={
                  value =>
                    setField(
                      'utility',
                      value
                    )
                }
                showUtilityOptions={
                  showUtilityOptions
                }
                setShowUtilityOptions={
                  setShowUtilityOptions
                }
                setShowEnvironmentOptions={
                  setShowEnvironmentOptions
                }
                utilities={utilities}
              />
              <EnvironmentFilterS
                selectedEnvironment={
                  propertyData.environment
                }
                setSelectedEnvironment={
                  value =>
                    setField(
                      'environment',
                      value
                    )
                }
                showEnvironmentOptions={
                  showEnvironmentOptions
                }
                setShowEnvironmentOptions={
                  setShowEnvironmentOptions
                }
                setShowUtilityOptions={
                  setShowUtilityOptions
                }
              />

              <AccessibilityFilterS
                selectedAccessibility={
                  propertyData.accessibility
                }
                setSelectedAccessibility={
                  value =>
                    setField(
                      'accessibility',
                      value
                    )
                }
                showAccessibilityOptions={
                  showAccessibilityOptions
                }
                setShowAccessibilityOptions={
                  setShowAccessibilityOptions
                }
              />

              <TerrainFilterS
                selectedTerrain={
                  propertyData.terrain
                }
                setSelectedTerrain={
                  value =>
                    setField(
                      'terrain',
                      value
                    )
                }
                showTerrainOptions={
                  showTerrainOptions
                }
                setShowTerrainOptions={
                  setShowTerrainOptions
                }
                setShowAccessibilityOptions={
                  setShowAccessibilityOptions
                }
                setShowLegalStatusOptions={
                  setShowLegalStatusOptions
                }
                terrainOptions={
                  terrainOptions
                }
              />

              <LegalStatusFilterS
                selectedLegalStatus={
                  propertyData.legal_status
                }
                setSelectedLegalStatus={
                  value =>
                    setField(
                      'legal_status',
                      value
                    )
                }
                showLegalStatusOptions={
                  showLegalStatusOptions
                }
                setShowLegalStatusOptions={
                  setShowLegalStatusOptions
                }
                setShowTerrainOptions={
                  setShowTerrainOptions
                }
              />

              <PriceSelectorS
                priceMillions={
                  propertyData.priceMillions
                }
                setPriceMillions={
                  updater =>
                    setPropertyData(
                      previous => ({
                        ...previous,
                        priceMillions:
                          updater(
                            previous.priceMillions
                          )
                      })
                    )
                }
                formatColones={
                  formatColones
                }
                convertToUSD={
                  convertToUSD
                }
              />

              <section style={textSection}>
                <label style={fieldLabel}>
                  Currency

                  <select
                    value={
                      propertyData.currency
                    }
                    onChange={event =>
                      setField(
                        'currency',
                        event.target.value
                      )
                    }
                    style={input}
                  >
                    <option value="CRC">
                      CRC — Costa Rican Colón
                    </option>

                    <option value="USD">
                      USD — United States Dollar
                    </option>
                  </select>
                </label>

                <label style={fieldLabel}>
                  Listing Title

                  <input
                    type="text"
                    value={
                      propertyData.title
                    }
                    onChange={event =>
                      setField(
                        'title',
                        event.target.value
                      )
                    }
                    style={input}
                  />
                </label>

                <label style={fieldLabel}>
                  Listing Description

                  <textarea
                    value={
                      propertyData.description
                    }
                    onChange={event =>
                      setField(
                        'description',
                        event.target.value
                      )
                    }
                    rows={8}
                    style={textarea}
                  />
                </label>

                <label style={fieldLabel}>
                  WhatsApp Number

                  <input
                    type="tel"
                    value={
                      propertyData.whatsapp
                    }
                    onChange={event =>
                      setField(
                        'whatsapp',
                        event.target.value
                          .replace(
                            /[^\d+]/g,
                            ''
                          )
                      )
                    }
                    style={input}
                  />
                </label>
              </section>

              {propertyData.images.length >
                0 && (
                <section style={imageSection}>
                  <h2 style={sectionHeading}>
                    Current Listing Images
                  </h2>

                  <div style={imageGrid}>
                    {propertyData.images.map(
                      (
                        imageUrl,
                        index
                      ) => (
                        <article
                          key={`${imageUrl}-${index}`}
                          style={imageCard}
                        >
                          <img
                            src={imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={imageStyle}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setField(
                                'images',
                                propertyData.images.filter(
                                  (
                                    _,
                                    imageIndex
                                  ) =>
                                    imageIndex !==
                                    index
                                )
                              )
                            }
                            style={removeButton}
                          >
                            Remove
                          </button>
                        </article>
                      )
                    )}
                  </div>
                </section>
              )}

              {errorMessage && (
                <div style={errorBox}>
                  {errorMessage}
                </div>
              )}

              <div style={actions}>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  style={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButton,
                    opacity:
                      saving
                        ? 0.6
                        : 1
                  }}
                >
                  {saving
                    ? 'Saving Changes...'
                    : 'Save Sale Listing'}
                </button>
              </div>
            </section>

            <aside style={previewPanel}>
              <PropertyDefinitionPanel
                propertyData={
                  propertyData
                }
              />
            </aside>
          </div>
        </form>
      </div>
    </main>
  )
}
const page = {
  minHeight: '100vh',
  padding: '1rem',
  background: '#000',
  color: '#fff'
}

const container = {
  width: '100%',
  maxWidth: '90rem',
  margin: '0 auto'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '2rem',
  margin: '3rem 0'
}

const eyebrow = {
  margin: '0 0 .5rem',
  color: '#fff',
  fontSize: '.8rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize:
    'clamp(2.5rem, 6vw, 4rem)'
}

const intro = {
  maxWidth: '48rem',
  margin: '1rem 0 0',
  color: '#888',
  fontSize: '1.05rem',
  lineHeight: 1.7
}

const form = {
  width: '100%'
}

const mainGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(min(100%, 32rem), 1fr))',
  gap: '2rem',
  alignItems: 'start'
}

const editorPanel = {
  display: 'flex',
  flexDirection:
    'column' as const,
  gap: '2rem',
  padding: '2rem',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1.5rem'
}

const previewPanel = {
  position:
    'sticky' as const,
  top: '1rem',
  padding: '2rem',
  background: '#0d0d0d',
  border: '1px solid #222',
  borderRadius: '1.5rem'
}

const textSection = {
  display: 'grid',
  gap: '1.25rem',
  paddingTop: '1rem',
  borderTop:
    '1px solid #292929'
}

const fieldLabel = {
  display: 'grid',
  gap: '.55rem',
  color: '#aaa',
  fontSize: '.85rem',
  fontWeight: 600
}

const input = {
  width: '100%',
  padding: '1rem',
  background: '#090909',
  color: '#fff',
  border: '1px solid #333',
  borderRadius: '.85rem',
  fontSize: '1rem',
  outline: 'none'
}

const textarea = {
  ...input,
  minHeight: '12rem',
  resize:
    'vertical' as const,
  lineHeight: 1.6
}

const imageSection = {
  paddingTop: '1rem',
  borderTop:
    '1px solid #292929'
}

const sectionHeading = {
  margin: '0 0 1rem',
  color: '#fff',
  fontSize: '1.1rem'
}

const imageGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '1rem'
}

const imageCard = {
  overflow: 'hidden',
  background: '#090909',
  border: '1px solid #292929',
  borderRadius: '1rem'
}

const imageStyle = {
  display: 'block',
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit:
    'cover' as const
}

const removeButton = {
  width: '100%',
  padding: '.7rem',
  background: 'transparent',
  color: '#aaa',
  border: 0,
  borderTop:
    '1px solid #292929',
  cursor: 'pointer'
}

const errorBox = {
  padding: '1rem',
  background: '#2a1010',
  color: '#ffb4b4',
  border: '1px solid #6b2222',
  borderRadius: '.85rem'
}

const actions = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  paddingTop: '1rem',
  borderTop:
    '1px solid #292929'
}

const secondaryButton = {
  padding: '.9rem 1.4rem',
  background: 'transparent',
  color: '#fff',
  border: '1px solid #444',
  borderRadius: '999px',
  fontWeight: 700,
  cursor: 'pointer'
}

const primaryButton = {
  padding: '.9rem 1.4rem',
  background: '#fff',
  color: '#000',
  border: 0,
  borderRadius: '999px',
  fontWeight: 800,
  cursor: 'pointer'
}