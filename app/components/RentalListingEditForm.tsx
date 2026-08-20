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
  bedroom_options,
  bathroom_options,
  parking_options,
  year_built_options,
  construction_area_options
} from '@/data/property-data'

import LocationSelectorS from '@/app/components/filter-bar/LocationSelectorS'
import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'
import BedroomFilterS from '@/app/components/filter-bar/BedroomFilterS'
import BathroomFilterS from '@/app/components/filter-bar/BathroomFilterS'
import ParkingFilterS from '@/app/components/filter-bar/ParkingFilterS'
import YearBuiltFilterS from '@/app/components/filter-bar/YearBuiltFilterS'
import ExactPropertyAreaInput
from '@/app/components/listing-input/ExactPropertyAreaInput'
import PropertyAreaFilter from '@/app/components/filter-bar/PropertyAreaFilter'
import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'
import EnvironmentFilterS from '@/app/components/filter-bar/EnvironmentFilterS'
import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'
import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'
import MonthlyRentSelectorS from '@/app/components/filter-bar/MonthlyRentSelectorS'
import RentalPropertyDefinitionPanel from '@/app/components/RentalPropertyDefinitionPanel'
import TopBar from '@/app/components/TopBar'
import ExactConstructionAreaInput
from '@/app/components/listing-input/ExactConstructionAreaInput'

import PropertyTypeFilterES from '@/app/components/filter-bar/PropertyTypeFilterES'
import BedroomFilterSES from '@/app/components/filter-bar/BedroomFilterSES'
import BathroomFilterSES from '@/app/components/filter-bar/BathroomFilterSES'
import ParkingFilterSES from '@/app/components/filter-bar/ParkingFilterSES'
import YearBuiltFilterSES from '@/app/components/filter-bar/YearBuiltFilterSES'

import PropertyAreaFilterES from '@/app/components/filter-bar/PropertyAreaFilterES'
import UtilitiesFilterES from '@/app/components/filter-bar/UtilitiesFilterES'
import EnvironmentFilterSES from '@/app/components/filter-bar/EnvironmentFilterSES'
import AccessibilityFilterES from '@/app/components/filter-bar/AccessibilityFilterES'
import TerrainFilterES from '@/app/components/filter-bar/TerrainFilterES'

import RentalPropertyDefinitionPanelES from '@/app/components/RentalPropertyDefinitionPanelES'

import {
  resolveEditableListingImages
} from '@/app/utils/resolveListingImages'

type SupportedLanguage =
  | 'en'
  | 'es'

type RentalListingEditFormProps = {
  listing: any
  language?: SupportedLanguage
}

function normalizeStringArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item))
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return []
  }

  try {
    const parsed = JSON.parse(
      trimmedValue
    )

    if (Array.isArray(parsed)) {
      return parsed
        .map(item => String(item))
        .filter(Boolean)
    }

    if (
      typeof parsed === 'string' &&
      parsed.trim()
    ) {
      return [parsed.trim()]
    }
  } catch {
    // Continue to delimiter parsing.
  }

  return trimmedValue
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeAccessibility(
  value: unknown
): string {
  if (Array.isArray(value)) {
    return value[0]
      ? String(value[0])
      : ''
  }

  return typeof value === 'string'
    ? value
    : ''
}

function normalizeExactAreaMeasurement(
      value: unknown
    ): number | null {
      if (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0
      ) {
        return value
      }

      if (typeof value !== 'string') {
        return null
      }

      const trimmedValue =
        value.trim()

      if (!trimmedValue) {
        return null
      }

      const normalizedValue =
        trimmedValue
          .replace(/,/g, '')
          .replace(/\s*m²\s*$/i, '')
          .trim()

      if (
        !/^\d+(?:\.\d+)?$/.test(
          normalizedValue
        )
      ) {
        return null
      }

      const numericValue =
        Number(normalizedValue)

      if (
        !Number.isFinite(numericValue) ||
        numericValue <= 0
      ) {
        return null
      }

      return numericValue
    }

export default function RentalListingEditForm({
  listing,
  language = 'en'
}: RentalListingEditFormProps) {
  const router = useRouter()

  const labels =
  language === 'es'
    ? {
        eyebrow:
          'Administración de Publicaciones de Alquiler',

        heading:
          'Editar Publicación de Alquiler',

        intro:
          'Actualice la definición de la propiedad, el alquiler mensual, la información de contacto y la descripción de la publicación.',

        titleRequired:
          'Ingrese un título para la publicación.',

        rentRequired:
          'Ingrese un alquiler mensual válido.',

        updateError:
          'No se pudo actualizar la publicación de alquiler.',

        currency:
          'Moneda',

        crc:
          'CRC — Colón Costarricense',

        usd:
          'USD — Dólar Estadounidense',

        listingTitle:
          'Título de la Publicación',

        listingDescription:
          'Descripción de la Publicación',

        whatsapp:
          'Número de WhatsApp',

        currentImages:
          'Imágenes Actuales de la Publicación',

        remove:
          'Eliminar',

        moveLeft:
          'Mover a la izquierda',

        moveRight:
          'Mover a la derecha',

        cancel:
          'Cancelar',

        saving:
          'Guardando Cambios...',

        save:
          'Guardar Publicación de Alquiler'
      }
    : {
        eyebrow:
          'Rental Listing Management',

        heading:
          'Edit Rental Listing',

        intro:
          'Update the property definition, monthly rent, contact information, and marketplace description.',

        titleRequired:
          'Please enter a listing title.',

        rentRequired:
          'Please enter a valid monthly rent.',

        updateError:
          'The rental listing could not be updated.',

        currency:
          'Currency',

        crc:
          'CRC — Costa Rican Colón',

        usd:
          'USD — United States Dollar',

        listingTitle:
          'Listing Title',

        listingDescription:
          'Listing Description',

        whatsapp:
          'WhatsApp Number',

        currentImages:
          'Current Listing Images',

        remove:
          'Remove',

        moveLeft:
          'Move Left',

        moveRight:
          'Move Right',

        cancel:
          'Cancel',

        saving:
          'Saving Changes...',

        save:
          'Save Rental Listing'
      }

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
        normalizeExactAreaMeasurement(
          listing.property_area
        ),

      bedrooms:
        listing.bedrooms
          ? String(listing.bedrooms)
          : '',

      bathrooms:
        listing.bathrooms
          ? String(listing.bathrooms)
          : '',

      parking:
        listing.parking
          ? String(listing.parking)
          : '',

      year_built_range:
        listing.year_built_range || '',

      construction_area:
        normalizeExactAreaMeasurement(
          listing.construction_area
        ),

      utility:
        normalizeStringArray(
          listing.utility
        ),

      legal_status:
        listing.legal_status || '',

      environment:
        listing.environment || '',

      accessibility:
        normalizeAccessibility(
          listing.accessibility
        ),

      distance_to_paved_road_range:
        listing.distance_to_paved_road_range || '',

      terrain:
        normalizeStringArray(
          listing.terrain
        ),

      monthly_price:
        listing.monthly_price
          ? String(listing.monthly_price)
          : '',

      transaction_type: 'rent',

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
        resolveEditableListingImages(
          listing.images
        )
    })
      const [showLocationOptions, setShowLocationOptions] =
    useState(true)

  const [showProvinceOptions, setShowProvinceOptions] =
    useState(true)

  const [showCantonOptions, setShowCantonOptions] =
    useState(false)

  const [showDistrictOptions, setShowDistrictOptions] =
    useState(false)

  const [showPropertyTypeOptions, setShowPropertyTypeOptions] =
    useState(true)

  const [showBedroomOptions, setShowBedroomOptions] =
    useState(true)

  const [showBathroomOptions, setShowBathroomOptions] =
    useState(true)

  const [showParkingOptions, setShowParkingOptions] =
    useState(true)

  const [showYearBuiltOptions, setShowYearBuiltOptions] =
    useState(true)

  const [
    showConstructionAreaOptions,
    setShowConstructionAreaOptions
  ] = useState(true)

  const [showPropertyAreaOptions, setShowPropertyAreaOptions] =
    useState(true)

  const [showUtilityOptions, setShowUtilityOptions] =
    useState(true)

  const [showEnvironmentOptions, setShowEnvironmentOptions] =
    useState(true)

  const [
    showAccessibilityOptions,
    setShowAccessibilityOptions
  ] = useState(true)

  const [showTerrainOptions, setShowTerrainOptions] =
    useState(true)

  const [showLegalStatusOptions, setShowLegalStatusOptions] =
    useState(true)

  const [
    showMonthlyRentOptions,
    setShowMonthlyRentOptions
  ] = useState(true)

  const [saving, setSaving] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState('')

  function setField(
    field: string,
    value: unknown
  ) {
    setPropertyData(previous => ({
      ...previous,
      [field]: value
    }))
  }

  async function getAccessToken() {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      return session?.access_token ?? null
    }

    async function deleteImage(
    imageValue: string
  ) {
    const token =
      await getAccessToken()

    if (!token) {
      return
    }

    const response =
      await fetch(
        '/api/delete-listing-image',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            listingId: listing.id,
            imageValue
          })
        }
      )

    const result =
      await response.json()

    if (!result.success) {
      alert(result.error)
      return
    }

    setField(
        'images',
        resolveEditableListingImages(
          result.images
        )
      )
    }

    async function reorderImages(
      images: string[]
    ) {
      const token =
        await getAccessToken()

      if (!token) {
        return
      }

      const response =
        await fetch(
          '/api/reorder-listing-images',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`
            },

            body: JSON.stringify({
              listingId: listing.id,
              images
            })
          }
        )

      const result =
        await response.json()

      if (!result.success) {
        alert(result.error)
        return
      }

      setField(
        'images',
        resolveEditableListingImages(
          result.images
        )
      )
    }

    async function moveImage(
      currentIndex: number,
      direction: -1 | 1
    ) {
      const targetIndex =
        currentIndex + direction

      if (
        targetIndex < 0 ||
        targetIndex >=
          propertyData.images.length
      ) {
        return
      }

      const reorderedImages = [
        ...propertyData.images
      ]

      const currentImage =
        reorderedImages[
          currentIndex
        ]

      reorderedImages[
        currentIndex
      ] =
        reorderedImages[
          targetIndex
        ]

      reorderedImages[
        targetIndex
      ] =
        currentImage

      await reorderImages(
        reorderedImages.map(
          image =>
            image.storedValue
        )
      )
    }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!propertyData.title.trim()) {
      setErrorMessage(
        labels.titleRequired
      )

      return
    }

    if (
      !propertyData.monthly_price ||
      Number(propertyData.monthly_price) <= 0
    ) {
      setErrorMessage(
        labels.rentRequired
      )

      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      await updateListing({
        supabase,
        listingId: listing.id,
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
            propertyData.bedrooms || null,

          bathrooms:
            propertyData.bathrooms || null,

          parking:
            propertyData.parking || null,

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

          distance_to_paved_road_range:
            propertyData.accessibility ===
              'Unpaved Road to Property'
                ? propertyData.distance_to_paved_road_range ||
                  null
                : null,

          terrain:
            propertyData.terrain,

          legal_status:
            propertyData.legal_status ||
            null,

          monthly_price:
            Number(
              String(
                propertyData.monthly_price
              ).replace(/[^\d.]/g, '')
            ),

          price_millions: null,

          transaction_type: 'rent',

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
            propertyData.images.map(
              image =>
                image.storedValue
            )
        }
      })

      router.push(
        language === 'es'
          ? `/es/alquilar-arrendar/listing/${listing.id}`
          : `/en/rent-lease/listing/${listing.id}`
      )

      router.refresh()
    } catch (error) {
      console.error(
        'RENTAL LISTING UPDATE ERROR:',
        error
      )

      setErrorMessage(
        labels.updateError
      )

      setSaving(false)
    }
  }

  function handleCancel() {
    router.push(
      language === 'es'
        ? `/es/alquilar-arrendar/listing/${listing.id}`
        : `/en/rent-lease/listing/${listing.id}`
    )
  }

  return (
    <main style={page}>
      <div style={container}>
        <TopBar />

        <header style={header}>
          <div>
            <p style={eyebrow}>
              {labels.eyebrow}
            </p>

            <h1 style={heading}>
              {labels.heading}
            </h1>

            <p style={intro}>
              {labels.intro}
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

              <PropertyTypeFilter
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
                selectedproperty_type={
                  propertyData.property_type
                }
                setSelectedproperty_type={
                  value =>
                    setField(
                      'property_type',
                      value
                    )
                }
                showproperty_typeOptions={
                  showPropertyTypeOptions
                }
                setShowproperty_typeOptions={
                  setShowPropertyTypeOptions
                }
                setShowproperty_areaOptions={
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
              />

              {language === 'es' ? (
                <BedroomFilterSES
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
              ) : (
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
              )}

              {language === 'es' ? (
                <BathroomFilterSES
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
              ) : (
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
              )}

              {language === 'es' ? (
                <ParkingFilterSES
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
              ) : (
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
              )}

              {language === 'es' ? (
                <YearBuiltFilterSES
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
              ) : (
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
              )}

              {language === 'es' ? (
                <ExactConstructionAreaInput
                  valueSquareMeters={
                    propertyData.construction_area
                  }
                  onChange={(valueSquareMeters) =>
                    setField(
                      'construction_area',
                      valueSquareMeters
                    )
                  }
                  language="es"
                  initiallyOpen={
                    showConstructionAreaOptions
                  }
                />
              ) : (
                <ExactConstructionAreaInput
                  valueSquareMeters={
                    propertyData.construction_area
                  }
                  onChange={(valueSquareMeters) =>
                    setField(
                      'construction_area',
                      valueSquareMeters
                    )
                  }
                  language="en"
                  initiallyOpen={
                    showConstructionAreaOptions
                  }
                />
              )}

              {language === 'es' ? (
                <ExactPropertyAreaInput
                  valueSquareMeters={
                    propertyData.property_area
                  }
                  onChange={(valueSquareMeters) =>
                    setField(
                      'property_area',
                      valueSquareMeters
                    )
                  }
                  language="es"
                  initiallyOpen={
                    showPropertyAreaOptions
                  }
                />
              ) : (
                <ExactPropertyAreaInput
                  valueSquareMeters={
                    propertyData.property_area
                  }
                  onChange={(valueSquareMeters) =>
                    setField(
                      'property_area',
                      valueSquareMeters
                    )
                  }
                  language="en"
                  initiallyOpen={
                    showPropertyAreaOptions
                  }
                />
              )}
              
              {language === 'es' ? (
                <UtilitiesFilterES
                  selectedutility={
                    propertyData.utility
                  }
                  setSelectedutility={
                    value =>
                      setField(
                        'utility',
                        value
                      )
                  }
                  showutilityOptions={
                    showUtilityOptions
                  }
                  setShowutilityOptions={
                    setShowUtilityOptions
                  }
                  setShowenvironmentOptions={
                    setShowEnvironmentOptions
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
                />
              ) : (
                <UtilitiesFilter
                  selectedutility={
                    propertyData.utility
                  }
                  setSelectedutility={
                    (value: string[]) =>
                      setField(
                        'utility',
                        value
                      )
                  }
                  showutilityOptions={
                    showUtilityOptions
                  }
                  setShowutilityOptions={
                    setShowUtilityOptions
                  }
                />
              )}



              {language === 'es' ? (
                <EnvironmentFilterSES
                  selectedEnvironment={
                    propertyData.environment
                  }
                  setSelectedEnvironment={
                    (value: string) =>
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
              ) : (
                <EnvironmentFilterS
                    selectedEnvironment={
                      propertyData.environment
                    }
                    setSelectedEnvironment={
                      (value: string) =>
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
              )}

              {language === 'es' ? (
                <AccessibilityFilterES
                  selectedaccessibility={
                    propertyData.accessibility
                  }

                  setSelectedaccessibility={
                    (value: string) => {
                      setPropertyData(prev => ({
                        ...prev,
                        accessibility: value,
                        distance_to_paved_road_range:
                          value ===
                          'Unpaved Road to Property'
                            ? prev.distance_to_paved_road_range
                            : ''
                      }))
                    }
                  }

                  selectedPavedRoadDistanceRange={
                    propertyData.distance_to_paved_road_range
                  }

                  setSelectedPavedRoadDistanceRange={
                    (value: string) =>
                      setField(
                        'distance_to_paved_road_range',
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
              ) : (
                <TerrainFilter
                  selectedterrain={
                    propertyData.terrain
                  }
                  setSelectedterrain={
                    (value: string[]) =>
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
                />
              )}

              <MonthlyRentSelectorS
                monthlyPrice={
                  propertyData.monthly_price
                }
                setMonthlyPrice={
                  (value: string) => {
                    setField(
                      'monthly_price',
                      value
                    )

                    if (value !== '') {
                      setShowTerrainOptions(false)
                    }
                  }
                }
                showMonthlyRentOptions={
                  showMonthlyRentOptions
                }
                setShowMonthlyRentOptions={
                  setShowMonthlyRentOptions
                }
                setShowTerrainOptions={
                  setShowTerrainOptions
                }
              />

              <section style={textSection}>
                <label style={fieldLabel}>
                  {labels.currency}

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
                      {labels.crc}
                    </option>

                    <option value="USD">
                      {labels.usd}
                    </option>
                  </select>
                </label>

                <label style={fieldLabel}>
                  {labels.listingTitle}

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
                  {labels.listingDescription}
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
                  {labels.whatsapp}

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
                    {labels.currentImages}
                  </h2>

                  <div style={imageGrid}>
                    {propertyData.images.map(
                        (
                          listingImage,
                          index
                        ) => (
                        <article
                          key={`${listingImage.storedValue}-${index}`}
                          style={imageCard}
                        >
                          <img
                            src={listingImage.displayUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={image}
                          />

                          <div style={imageActions}>
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() =>
                                moveImage(
                                  index,
                                  -1
                                )
                              }
                              style={{
                                ...imageActionButton,
                                opacity:
                                  index === 0
                                    ? 0.35
                                    : 1
                              }}
                            >
                              {labels.moveLeft}
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                propertyData.images.length - 1
                              }
                              onClick={() =>
                                moveImage(
                                  index,
                                  1
                                )
                              }
                              style={{
                                ...imageActionButton,
                                opacity:
                                  index ===
                                  propertyData.images.length - 1
                                    ? 0.35
                                    : 1
                              }}
                            >
                              {labels.moveRight}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteImage(
                                  listingImage.storedValue
                                )
                              }
                              style={removeButton}
                            >
                              {labels.remove}
                            </button>
                          </div>
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
                  {labels.cancel}
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
                    ? labels.saving
                    : labels.save}
                </button>
              </div>
            </section>

            <aside style={previewPanel}>
              {language === 'es' ? (
                <RentalPropertyDefinitionPanelES
                  propertyData={propertyData}
                />
              ) : (
                <RentalPropertyDefinitionPanel
                  propertyData={propertyData}
                />
              )}
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
  color: '#D4AF37'
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
  color: '#D4AF37',
  fontSize: '.8rem',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: 'clamp(2.5rem, 6vw, 4rem)'
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
  flexDirection: 'column' as const,
  gap: '2rem',
  padding: '2rem',
  background: '#111',
  border: '1px solid #222',
  borderRadius: '1.5rem'
}

const previewPanel = {
  position: 'sticky' as const,
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
  borderTop: '1px solid #292929'
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
  resize: 'vertical' as const,
  lineHeight: 1.6
}

const imageSection = {
  paddingTop: '1rem',
  borderTop: '1px solid #292929'
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

const image = {
  display: 'block',
  width: '100%',
  aspectRatio: '4 / 3',
  objectFit: 'cover' as const
}

const removeButton = {
  gridColumn: '1 / -1',
  width: '100%',
  padding: '.7rem',
  background: 'transparent',
  color: '#ff9b9b',
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
  borderTop: '1px solid #292929'
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
  background: '#D4AF37',
  color: '#000',
  border: 0,
  borderRadius: '999px',
  fontWeight: 800,
  cursor: 'pointer'
}

const imageActions = {
  display: 'grid',
  gridTemplateColumns:
    '1fr 1fr',
  gap: '.5rem',
  padding: '.6rem'
}

const imageActionButton = {
  padding: '.65rem',
  background: '#151515',
  color: '#ddd',
  border: '1px solid #333',
  borderRadius: '.6rem',
  cursor: 'pointer'
}