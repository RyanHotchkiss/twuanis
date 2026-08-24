'use client'

import { useEffect, useState } from 'react'


import {
  startListingPublishFlow
} from '@/app/utils/startListingPublishFlow'


import Papa from 'papaparse'

import {
  provinces,
  districts,
  property_types,
  residential_property_types,
  bedroom_options,
  bathroom_options,
  parking_options,
  year_built_options,
  utilities,
  terrainOptions,

} from '@/data/property-data'

import {
  generateListingTitle,
  generateListingDescription,
  formatColones,
  convertToUSD,
  formatWhatsAppNumber
} from '@/app/utils/listing-utils'

import AccessibilityFilterES from '@/app/components/filter-bar/AccessibilityFilterES'
import EnvironmentFilterSES from '@/app/components/filter-bar/EnvironmentFilterSES'
import LegalStatusFilterSES from '@/app/components/filter-bar/LegalStatusFilterSES'
import PropertyAreaFilterES from '@/app/components/filter-bar/PropertyAreaFilterES'
import UtilitiesFilterES from '@/app/components/filter-bar/UtilitiesFilterES'
import ExactPropertyAreaInput
from '@/app/components/listing-input/ExactPropertyAreaInput'
import LocationSelectorS from '@/app/components/filter-bar/LocationSelectorS'
import TerrainFilterES from '@/app/components/filter-bar/TerrainFilterES'
import MonthlyRentSelectorS from '@/app/components/filter-bar/MonthlyRentSelectorS'
import ImagePreviewGridS from '@/app/components/ImagePreviewGridS'
import ImageUploaderS from '@/app/components/ImageUploaderS'
import WhatsAppInputS from '@/app/components/WhatsAppInputS'
import CsvStagingModal from '@/app/components/CsvStagingModal'
import RentalPropertyDefinitionPanelES from '@/app/components/RentalPropertyDefinitionPanelES'
import PropertyTypeFilterES from '@/app/components/filter-bar/PropertyTypeFilterES'
import TopBar from '@/app/components/TopBar'
import MarketHubAuthGate from '@/app/components/MarketHubAuthGate'
import CreateListingButtonSXL from '@/app/components/CreateListingButtonSXL'
import AuthOverlay
from '@/app/AuthOverlay'
import BedroomFilterSES from '@/app/components/filter-bar/BedroomFilterSES'
import BathroomFilterSES from '@/app/components/filter-bar/BathroomFilterSES'
import ParkingFilterSES from '@/app/components/filter-bar/ParkingFilterSES'
import YearBuiltFilterSES from '@/app/components/filter-bar/YearBuiltFilterSES'
import ExactConstructionAreaInput
from '@/app/components/listing-input/ExactConstructionAreaInput'

function normalizeCsvTextArray(
  value: unknown
): string[] {

  if (Array.isArray(value)) {
    return value
      .map(item =>
        String(item).trim()
      )
      .filter(item =>
        item &&
        item !== '{}' &&
        item !== '[]'
      )
  }

  if (
    value === null ||
    value === undefined
  ) {
    return []
  }

  const text =
    String(value).trim()

  if (
    !text ||
    text === '{}' ||
    text === '[]'
  ) {
    return []
  }

  return text
    .split('|')
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeCsvText(
  value: unknown
): string {

  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  const text =
    String(value).trim()

  if (
    !text ||
    text === '{}' ||
    text === '[]'
  ) {
    return ''
  }

  return text
}

export default function SellPage() {

    const [showLocationOptions, setShowLocationOptions] = useState(true)
    const [show_province_options, setShow_province_options] = useState(true)
    const [show_canton_options, setShow_canton_options] = useState(false)
    const [show_district_options, setShow_district_options] = useState(false)
    const [showproperty_typeOptions, setShowproperty_typeOptions] = useState(true)
    const [showproperty_areaOptions, setShowproperty_areaOptions] = useState(true)
    const [showutilityOptions, setShowutilityOptions] = useState(true)
    const [showenvironmentOptions, setShowenvironmentOptions] = useState(true)
    const [showAccessibilityOptions, setShowAccessibilityOptions] = useState(true)
    const [showlegal_statusOptions, setShowlegal_statusOptions] = useState(true)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvListings, setCsvListings] = useState<any[]>([])
    const [show_bedroom_options, setShow_bedroom_options] = useState(true)
    const [show_bathroom_options, setShow_bathroom_options] = useState(true)
    const [show_parking_options, setShow_parking_options] = useState(true)
    const [show_year_built_options, setShow_year_built_options] = useState(true)
    const [show_construction_area_options, setShow_construction_area_options] = useState(true)
    const [showCsvStaging, setShowCsvStaging] = useState(false)
    const [showTerrainOptions, setShowTerrainOptions] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [showAuthOverlay, setShowAuthOverlay] = useState(false)
    const [showMonthlyRentOptions, setShowMonthlyRentOptions] = useState(true)

 const [propertyData, setPropertyData] = useState({
                    province: '',
                    canton: '',
                    district: '',
                    property_type: '',
                    property_area: null as number | null,
                    bedrooms: '',
                    bathrooms: '',
                    parking: '',
                    year_built_range: '',
                    construction_area: null as number | null,
                    utility: [] as string[],
                    use_type: '',
                    legal_status: '',
                    connectivity: '',
                    environment: '',
                    accessibility: '',
                    distance_to_paved_road_range: '',
                    terrain: [] as string[],
                    monthly_price: '',

                    transaction_type: 'rent',
                    listing_status: 'active',
                    currency: 'CRC',

                    images: [] as {
                        preview: string
                        file: File
                        uploadedUrl: string
                    }[],
                    whatsapp: '',
                    })

           const show_residential_fields =
                residential_property_types.some(
                    (type) => type.en === propertyData.property_type
                )
            
            const handleImageUpload = (
            event: React.ChangeEvent<HTMLInputElement>
            ) => {

            const files = event.target.files

            if (!files) return

            const imageObjects = Array.from(files).map(file => ({
                preview: URL.createObjectURL(file),
                file,
                uploadedUrl: ''
                }))

            setPropertyData({
                ...propertyData,
                images: [
                    ...propertyData.images,
                    ...imageObjects
                    ]
            })

            }

            function addWhatsAppDigit(digit: string) {
            if (propertyData.whatsapp.length >= 8) return
            setPropertyData({
                ...propertyData,
                whatsapp: propertyData.whatsapp + digit
            })
            }

           function deleteWhatsAppDigit() {
                    setPropertyData({
                        ...propertyData,
                        whatsapp: propertyData.whatsapp.slice(0, -1)
                    })
                    }

                    /* PUT IT HERE */
                    useEffect(() => {

                    function handleResize() {

                        setIsMobile(window.innerWidth <= 768)

                    }

                    handleResize()

                    window.addEventListener(
                        'resize',
                        handleResize
                    )

                    return () => {

                        window.removeEventListener(
                        'resize',
                        handleResize
                        )

                    }

                    }, [])

                    
            return (
                <MarketHubAuthGate>
                    <main style={{
                        background: '#000',
                        minHeight: '100vh',
                        color: '#D4AF37',
                        padding: '1rem'
                    }}>

                <div style={{
                maxWidth: '90rem',
                margin: '0 auto',
                width: '100%',
                overflowX: 'hidden'
                }}>


    {/* HEADER */}
    
                    <div style={{
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '2rem',
                    flexWrap: 'wrap'
                    }}>

                                        <TopBar
                                            onFilterClick={() =>
                                                setShowMobileFilters(true)
                                            }
                                        />

                    <div>

                        <h1 style={{
                        fontSize: '4rem',
                        marginBottom: '.5rem'
                        }}>
                        Define Tu Propiedad
                        </h1>

                        <p style={{
                        color: '#888',
                        fontSize: '1.1rem',
                        maxWidth: '50rem',
                        lineHeight: '1.7'
                        }}>
                       Define progresivamente las características
                        ambientales, logísticas, legales y contextuales
                        de tu propiedad para crear una entidad estructurada
                        dentro del marketplace.
                        </p>

                    </div>

  {/* RIGHT CSV TOOL */}
                    <div style={{
                        background: '#111',
                        border: '1px solid #222',
                        borderRadius: '1rem',
                        padding: '1rem',
                        minWidth: '18rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '.75rem'
                    }}>

                        <h2 style={{
                        fontSize: '1rem',
                        margin: 0
                        }}>
                        Carga Masiva CSV
                        </h2>

                        <label
                        style={{
                            background: '#1a1a1a',
                            border: '1px dashed #444',
                            borderRadius: '.75rem',
                            padding: '1rem',
                            cursor: 'pointer',
                            textAlign: 'center',
                            color: '#888',
                            fontSize: '.9rem'
                        }}
                        >

                        <input
                            type="file"
                            accept=".csv"
                            style={{
                            display: 'none'
                            }}
                            onChange={(e) => {

                            if (e.target.files?.[0]) {
                                setCsvFile(e.target.files[0])
                            }

                            }}
                        />

                        {csvFile
                            ? csvFile.name
                            : 'Cargar CSV'}

                        </label>

                        <button
                                onClick={() => {

                                    if (!csvFile) {
                                    alert('Please select a CSV file first')
                                    return
                                    }

                                    Papa.parse(csvFile, {

                                    header: true,

                                    complete: async (results) => {

                                        

                                        const formattedData = results.data
                                            .filter((row: any) =>
                                                row.province ||
                                                row.canton ||
                                                row.district ||
                                                row.property_type
                                            )
                                            .map((row: any) => {

                                                const utility =
                                                normalizeCsvTextArray(
                                                    row.utility
                                                )

                                                const terrain =
                                                normalizeCsvTextArray(
                                                    row.terrain
                                                )

                                                const accessibility =
                                                normalizeCsvText(
                                                    row.accessibility
                                                )

                                                const normalizedRow = {
                                                ...row,

                                                utility,

                                                accessibility,

                                                distance_to_paved_road_range:
                                                    row.distance_to_paved_road_range ||
                                                    null,

                                                terrain,

                                                images:
                                                    row.images
                                                }

                                                return {
                                                ...normalizedRow,

                                                title:
                                                    generateListingTitle(
                                                    normalizedRow
                                                    ),

                                                description:
                                                    generateListingDescription(
                                                    normalizedRow
                                                    )
                                                }
                                            })

                                    
console.log(
  'CSV LENGTH:',
  formattedData.length
)

console.log(
  'SECOND RECORD:',
  formattedData[1]
)

console.log(formattedData)

console.log(
  'UTILITY:',
  formattedData[0]?.utility
)

console.log(
  'ENVIRONMENT:',
  formattedData[0]?.environment
)

console.log(
  'ACCESSIBILITY:',
  formattedData[0]?.accessibility
)

console.log(
  'TERRAIN:',
  formattedData[0]?.terrain
)

console.log(
  'FIRST CSV RECORD:',
  formattedData[0]
)

console.log(
'FORMATTED DATA:',
formattedData
)

                                        setCsvListings(formattedData)

                                        setShowCsvStaging(true)

                                    }

                                    })

                                }}
                                style={{
                                    background: '#D4AF37',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '999px',
                                    padding: '.85rem 1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                                >
                                Importar CSV
                                </button>

                    </div>

                    </div>


{/* MAIN GRID */}
        <div style={{
            display: 'grid',

            gridTemplateColumns: isMobile
                ? '1fr'
                : '1fr 1fr',

            gap: '2rem',

            alignItems: 'start'
            }}>
                {/* LEFT SIDE */}
                <div style={{
                    background: '#111',
                    border: '.0625rem solid #222',
                    borderRadius: '1.5rem',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>

{/* LOCATION */}

<LocationSelectorS

                    province={propertyData.province}
                    canton={propertyData.canton}
                    district={propertyData.district}

                    setShowPropertyTypeOptions={
                    setShowproperty_typeOptions
                    }

                    setProvince={(value) =>
                        setPropertyData(prev => ({
                        ...prev,
                        province: value,
                        canton: '',
                        district: ''
                        }))
                    }

                    setCanton={(value) =>
                        setPropertyData(prev => ({
                        ...prev,
                        canton: value,
                        district: ''
                        }))
                    }

                    setDistrict={(value) =>
                        setPropertyData(prev => ({
                        ...prev,
                        district: value
                        }))
                    }

                    provinces={provinces}
                    districts={districts}

                    showLocationOptions={showLocationOptions}
                    setShowLocationOptions={setShowLocationOptions}

                    showProvinceOptions={show_province_options}
                    setShowProvinceOptions={setShow_province_options}

                    showCantonOptions={show_canton_options}
                    setShowCantonOptions={setShow_canton_options}

                    showDistrictOptions={show_district_options}
                    setShowDistrictOptions={setShow_district_options}

                    />

{/* PROPERTY TYPE */}

<PropertyTypeFilterES

                        bedrooms={propertyData.bedrooms}
                        bathrooms={propertyData.bathrooms}
                        parking={propertyData.parking}

                        yearBuiltRange={
                            propertyData.year_built_range
                        }

                        selectedproperty_type={
                            propertyData.property_type
                        }

                        setSelectedproperty_type={(value) =>
                            setPropertyData({
                                ...propertyData,
                                property_type: value
                            })
                        }

                        showproperty_typeOptions={
                            showproperty_typeOptions
                        }

                        setShowproperty_typeOptions={
                            setShowproperty_typeOptions
                        }

                        setShowproperty_areaOptions={
                            setShowproperty_areaOptions
                        }

                        setShowBedroomOptions={
                            setShow_bedroom_options
                        }

                        setShowProvinceOptions={
                            setShow_province_options
                        }

                        setShowCantonOptions={
                            setShow_canton_options
                        }

                        setShowDistrictOptions={
                            setShow_district_options
                        }

                    />



{/* RESIDENTIAL STRUCTURE ATTRIBUTES */}

                    <BedroomFilterSES
                        selectedBedrooms={propertyData.bedrooms}
                        setSelectedBedrooms={(value) =>
                            setPropertyData({
                            ...propertyData,
                            bedrooms: value
                            })
                        }
                        bedroomOptions={bedroom_options}
                        showBedroomOptions={show_bedroom_options}
                        setShowBedroomOptions={setShow_bedroom_options}
                        setShowBathroomOptions={setShow_bathroom_options}
                        />

                    <BathroomFilterSES
                        selectedBathrooms={propertyData.bathrooms}
                        setSelectedBathrooms={(value) =>
                            setPropertyData({
                            ...propertyData,
                            bathrooms: value
                            })
                        }
                        bathroomOptions={bathroom_options}
                        showBathroomOptions={show_bathroom_options}
                        setShowBathroomOptions={setShow_bathroom_options}
                        setShowParkingOptions={setShow_parking_options}
                        />

                    <ParkingFilterSES
                        selectedParking={propertyData.parking}
                        setSelectedParking={(value) =>
                            setPropertyData({
                            ...propertyData,
                            parking: value
                            })
                        }
                        parkingOptions={parking_options}
                        showParkingOptions={show_parking_options}
                        setShowParkingOptions={setShow_parking_options}
                        setShowYearBuiltOptions={setShow_year_built_options}
                        />

                    <YearBuiltFilterSES
                        selectedYearBuilt={propertyData.year_built_range}
                        setSelectedYearBuilt={(value) =>
                            setPropertyData({
                            ...propertyData,
                            year_built_range: value
                            })
                        }
                        yearBuiltOptions={year_built_options}
                        showYearBuiltOptions={show_year_built_options}
                        setShowYearBuiltOptions={setShow_year_built_options}
                        setShowConstructionAreaOptions={
                            setShow_construction_area_options
                        }
                        />

                    <ExactConstructionAreaInput
                        valueSquareMeters={
                            propertyData.construction_area
                        }
                        onChange={(valueSquareMeters) =>
                            setPropertyData(prev => ({
                                ...prev,
                                construction_area: valueSquareMeters
                            }))
                        }
                        language="es"
                        initiallyOpen={
                            show_construction_area_options
                        }
                    />

{/* PROPERTY AREA */}
                    
                    <ExactPropertyAreaInput
                        valueSquareMeters={
                            propertyData.property_area
                        }
                        onChange={(valueSquareMeters) =>
                            setPropertyData(prev => ({
                                ...prev,
                                property_area: valueSquareMeters
                            }))
                        }
                        language="es"
                        initiallyOpen={
                            showproperty_areaOptions
                        }
                    />

<UtilitiesFilterES
                        selectedutility={propertyData.utility}

                        setSelectedutility={(value) =>
                            setPropertyData({
                                ...propertyData,
                                utility: value
                            })
                        }

                        showutilityOptions={showutilityOptions}

                        setShowutilityOptions={
                            setShowutilityOptions
                        }

                        setShowenvironmentOptions={
                            setShowenvironmentOptions
                        }

                        setShowProvinceOptions={
                            setShow_province_options
                        }

                        setShowCantonOptions={
                            setShow_canton_options
                        }

                        setShowDistrictOptions={
                            setShow_district_options
                        }
                    />
                

{/* environment */}
<EnvironmentFilterSES
                    selectedEnvironment={propertyData.environment}
                    setSelectedEnvironment={(value) =>
                        setPropertyData({
                        ...propertyData,
                        environment: value
                        })
                    }
                    showEnvironmentOptions={showenvironmentOptions}
                    setShowEnvironmentOptions={
                        setShowenvironmentOptions
                    }
                    setShowUtilityOptions={
                        setShowutilityOptions
                    }
                    />



{/* accessibility */}

            <AccessibilityFilterES
                selectedaccessibility={
                    propertyData.accessibility
                }

                setSelectedaccessibility={(value: string) =>
                    setPropertyData(prev => ({
                    ...prev,
                    accessibility: value,
                    distance_to_paved_road_range:
                        value === 'Unpaved Road to Property'
                        ? prev.distance_to_paved_road_range
                        : ''
                    }))
                }

                selectedPavedRoadDistanceRange={
                    propertyData.distance_to_paved_road_range
                }

                setSelectedPavedRoadDistanceRange={(value: string) =>
                    setPropertyData(prev => ({
                    ...prev,
                    distance_to_paved_road_range: value
                    }))
                }

                showAccessibilityOptions={
                    showAccessibilityOptions
                }

                setShowAccessibilityOptions={
                    setShowAccessibilityOptions
                }
            />

{/* TERRAIN */}
<TerrainFilterES

                            selectedterrain={propertyData.terrain}

                            setSelectedterrain={(value) =>
                                setPropertyData({
                                    ...propertyData,
                                    terrain: value
                                })
                            }

                            showTerrainOptions={
                                showTerrainOptions
                            }

                            setShowTerrainOptions={
                                setShowTerrainOptions
                            }

                        />
                    
{/* LEGAL STATUS */}
<LegalStatusFilterSES
                        selectedLegalStatus={propertyData.legal_status}
                        setSelectedLegalStatus={(value) =>
                            setPropertyData({
                            ...propertyData,
                            legal_status: value
                            })
                        }
                        showLegalStatusOptions={
                            showlegal_statusOptions
                        }
                        setShowLegalStatusOptions={
                            setShowlegal_statusOptions
                        }
                        setShowTerrainOptions={

                            setShowTerrainOptions

                        }
                        />
                    

{/* price */}
<MonthlyRentSelectorS

                            monthlyPrice={propertyData.monthly_price}

                            setMonthlyPrice={(value) => {

                                setPropertyData({
                                    ...propertyData,
                                    monthly_price: value
                                })

                                if (value !== '') {

                                    setShowTerrainOptions(false)

                                }

                            }}

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

{/* IMAGE UPLOADER */}
<ImageUploaderS
                        handleImageUpload={handleImageUpload}
                        />

{/* IMAGE PREVIEW GRID */}
<ImagePreviewGridS
                        images={propertyData.images}
                        removeImage={(index) => {

                            setPropertyData({
                            ...propertyData,
                            images: propertyData.images.filter(
                                (_, i) => i !== index
                            )
                            })

                        }}
                        />

{/* WHATSAPP */}
<WhatsAppInputS
                    whatsapp={propertyData.whatsapp}
                    addWhatsAppDigit={addWhatsAppDigit}
                    deleteWhatsAppDigit={deleteWhatsAppDigit}
                    formatWhatsAppNumber={
                        formatWhatsAppNumber
                    }
                    />

{/* CREATE LISTING BUTTON */}
 <CreateListingButtonSXL
                 onCreateListing={async () => {
 
                     console.log(
                     'CREATE LISTING BUTTON CLICKED'
                     )
 
                     console.log(
                     'WHATSAPP:',
                     propertyData.whatsapp
                     )
 
                     if (!propertyData.whatsapp) {
 
                     alert(
                         'Please enter your WhatsApp number'
                     )
 
                     return
 
                     }
 
                     try {
                        await startListingPublishFlow({
                            phone:
                            propertyData.whatsapp,

                            propertyData
                        })

                        alert(
                            '¡Tuanis! Revise su WhatsApp.'
                        )
                        } catch (error) {
                        console.error(
                            'LISTING PUBLISH FLOW ERROR:',
                            error
                        )

                        alert(
                            error instanceof Error
                            ? error.message
                            : 'Ocurrió un error.'
                        )
                        }
 
                 }}
                 />
 
                 </div> {/* LEFT SIDE */}
 
                 {/* RIGHT SIDE */}
 
                 <div
                 style={{
                     background: '#0d0d0d',
                     border: '.0625rem solid #222',
                     borderRadius: '1.5rem',
                     padding: '2rem',
 
                     position: isMobile
                     ? 'relative'
                     : 'sticky',
 
                     top: isMobile
                     ? '0'
                     : '1rem',
 
                     height: 'fit-content',
 
                     width: '100%'
                 }}
                 >
 
                 <RentalPropertyDefinitionPanelES
                     propertyData={propertyData}
                 />
 
                 </div>
 
                 </div>
 
                 </div>
 
                 {/* MAIN GRID */}
 
                 {/* CSV STAGING MODAL */}
 
                 {showCsvStaging && (
 
                 <CsvStagingModal
                csvListings={csvListings}
                setCsvListings={setCsvListings}
                setShowCsvStaging={setShowCsvStaging}
                isRentLease={true}
                />
 
                 )}
 
                     </main>
            </MarketHubAuthGate>
        )
    }