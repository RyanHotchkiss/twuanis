'use client'

import { useEffect, useState } from 'react'

import {
  uploadListingImages
} from '@/app/utils/uploadListingImages'

import Papa from 'papaparse'
import Link from 'next/link'
import {
                    collapseButton,
                    summaryCard,
                    resetButton,
                    
                    } from '@/app/styles/sell-styles'
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
  terrainOptions,

} from '@/data/property-data'

import {
  generateListingTitle,
  generateListingDescription,
  formatColones,
  convertToUSD,
  formatWhatsAppNumber
} from '@/app/utils/listing-utils'

import AccessibilityFilters from '@/app/components/filter-bar/AccessibilityFilterS'
import EnvironmentFilterS from '@/app/components/filter-bar/EnvironmentFilterS'
import LegalStatusFilterS from '@/app/components/filter-bar/LegalStatusFilterS'
import PropertyAreaFilterS from '@/app/components/filter-bar/PropertyAreaFilterS'
import UtilitiesFilterS from '@/app/components/filter-bar/UtilitiesFilterS'
import BedroomFilterS from '@/app/components/filter-bar/BedroomFilterS'
import BathroomFilterS from '@/app/components/filter-bar/BathroomFilterS'
import ParkingFilterS from '@/app/components/filter-bar/ParkingFilterS'
import YearBuiltFilterS from '@/app/components/filter-bar/YearBuiltFilterS'
import ConstructionAreaFilterS from '@/app/components/filter-bar/ConstructionAreaFilterS'
import LocationSelectorS from '@/app/components/filter-bar/LocationSelectorS'
import TerrainFilterS from '@/app/components/filter-bar/TerrainFilterS'
import PriceSelectorS from '@/app/components/filter-bar/PriceSelectorS'
import ImagePreviewGridS from '@/app/components/ImagePreviewGridS'
import ImageUploaderS from '@/app/components/ImageUploaderS'
import WhatsAppInputS from '@/app/components/WhatsAppInputS'


import CsvStagingModal from '@/app/components/CsvStagingModal'
import PropertyDefinitionPanel from '@/app/components/PropertyDefinitionPanel'
import PropertyTypeFilterS from '@/app/components/filter-bar/PropertyTypeFilterS'
import TopBar from '@/app/components/TopBar'
import CreateListingButtonSXL from '@/app/components/CreateListingButtonSXL'
import AuthOverlay
from '@/app/AuthOverlay'

console.log('BedroomFilterS =', BedroomFilterS)

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
    

  const [propertyData, setPropertyData] = useState({
    province: '',
    canton: '',
    district: '',
    property_type: '',
    property_area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    year_built_range: '',
    construction_area: '',
    utility: [] as string[],
    use_type: '',
    legal_status: '',
    connectivity: '',
    environment: '',
    accessibility: '',
    terrain: [] as string[],
    priceMillions: 0,
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
                
            const priceOptions = Array.from(
            { length: 500 },
            (_, i) => i + 1
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

                    /* THEN YOUR RETURN */

console.log('BedroomFilterS', BedroomFilterS)

                    return (

                    <main style={{
                        background: '#000',
                        minHeight: '100vh',
                        color: '#FFFFFF',
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
                        Define Your Property
                        </h1>

                        <p style={{
                        color: '#888',
                        fontSize: '1.1rem',
                        maxWidth: '50rem',
                        lineHeight: '1.7'
                        }}>
                        Progressively define the environmental,
                        logistical, legal, and contextual characteristics
                        of your property to create a structured marketplace entity.
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
                        Bulk CSV Upload
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
                            : 'Upload CSV'}

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
                                        .map((row: any) => ({

                                            ...row,

                                            utility: row.utility
                                            ? [row.utility]
                                            : [],

                                            accessibility: row.accessibility
                                            ? [row.accessibility]
                                            : [],

                                            terrain: row.terrain
                                            ? [row.terrain]
                                            : [],

                                            title: generateListingTitle(row),

                                            description: generateListingDescription({

                                            ...row,

                                            utility: row.utility
                                                ? [row.utility]
                                                : [],

                                            terrain: row.terrain
                                                ? [row.terrain]
                                                : []

                                            }),

                                            images: row.images

                                        }))


                                        setCsvListings(formattedData)

                                        setShowCsvStaging(true)

                                    }

                                    })

                                }}
                                style={{
                                    background: '#FFFFFF',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '999px',
                                    padding: '.85rem 1rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                                >
                                Import CSV
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

<PropertyTypeFilterS

                    bedrooms={propertyData.bedrooms}

                    bathrooms={propertyData.bathrooms}

                    parking={propertyData.parking}

                    yearBuiltRange={
                    propertyData.year_built_range
                    }

                    constructionArea={
                    propertyData.construction_area
                    }
                    
                    setShowPropertyAreaOptions={
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

                    selectedPropertyType={
                        propertyData.property_type
                    }

                    setSelectedPropertyType={(value) =>
                        setPropertyData({
                        ...propertyData,
                        property_type: value
                        })
                    }

                    propertyTypes={property_types}

                    residentialPropertyTypes={
                        residential_property_types
                    }

                    showPropertyTypeOptions={
                        showproperty_typeOptions
                    }

                    setShowPropertyTypeOptions={
                        setShowproperty_typeOptions
                    }

                    resetResidentialFields={() => {

                        setPropertyData(prev => ({
                        ...prev,
                        bedrooms:'',
                        bathrooms:'',
                        parking:'',
                        year_built_range:'',
                        construction_area:''
                        }))

                       
                    }}

                   
                    />



{/* RESIDENTIAL STRUCTURE ATTRIBUTES */}

                    <BedroomFilterS
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

                    <BathroomFilterS
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

                    <ParkingFilterS
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

                    <YearBuiltFilterS
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

                    <ConstructionAreaFilterS
                        selectedConstructionArea={propertyData.construction_area}
                        setSelectedConstructionArea={(value) =>
                            setPropertyData({
                            ...propertyData,
                            construction_area: value
                            })
                        }
                        constructionAreaOptions={construction_area_options}
                        showConstructionAreaOptions={show_construction_area_options}
                        setShowConstructionAreaOptions={
                            setShow_construction_area_options
                        }
                        setShowPropertyAreaOptions={
                            setShowproperty_areaOptions
                        }
                        />

{/* PROPERTY AREA */}
                    
                    <PropertyAreaFilterS
                        selectedPropertyArea={
                            propertyData.property_area
                        }
                        setSelectedPropertyArea={(value) =>
                            setPropertyData({
                            ...propertyData,
                            property_area: value
                            })
                        }
                        showPropertyAreaOptions={
                            showproperty_areaOptions
                        }
                        setShowPropertyAreaOptions={
                            setShowproperty_areaOptions
                        }
                        setShowUtilityOptions={
                            setShowutilityOptions
                        }
                        propertyAreas={property_areas}
                    />

{/* UTILITIES */}
                   <UtilitiesFilterS
                    selectedUtilities={
                        propertyData.utility
                    }
                    setSelectedUtilities={(value) =>
                        setPropertyData({
                        ...propertyData,
                        utility: value
                        })
                    }
                    showUtilityOptions={
                        showutilityOptions
                    }
                    setShowUtilityOptions={
                        setShowutilityOptions
                    }
                    setShowEnvironmentOptions={
                        setShowenvironmentOptions
                    }
                    utilities={utilities}
                />
                

{/* environment */}
                  <EnvironmentFilterS
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

                    <AccessibilityFilters
                        selectedAccessibility={propertyData.accessibility}
                        setSelectedAccessibility={(value) =>
                            setPropertyData({
                            ...propertyData,
                            accessibility: value
                            })
                        }

                        showAccessibilityOptions={showAccessibilityOptions}
                        setShowAccessibilityOptions={
                            setShowAccessibilityOptions
                        }
                        />

{/* TERRAIN */}
                   <TerrainFilterS
                        selectedTerrain={
                            propertyData.terrain
                        }
                        setSelectedTerrain={(value) =>
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

                        setShowAccessibilityOptions={
                        setShowAccessibilityOptions
                        }

                        setShowLegalStatusOptions={
                        setShowlegal_statusOptions
                        }
                        terrainOptions={terrainOptions}
                        />

                    
{/* LEGAL STATUS */}
                    <LegalStatusFilterS
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
                        <PriceSelectorS
                    priceMillions={
                        propertyData.priceMillions
                    }
                    setPriceMillions={(updater) =>
                        setPropertyData(prev => ({
                        ...prev,
                        priceMillions: updater(
                            prev.priceMillions
                        )
                        }))
                    }
                    formatColones={formatColones}
                    convertToUSD={convertToUSD}
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

                    const uploadedImageUrls =
                        await uploadListingImages(
                        propertyData.images
                        )

                    const updatedPropertyData = {
                        ...propertyData,
                        images: uploadedImageUrls
                    }

console.log(
  'SENDING LISTING DATA:',
  updatedPropertyData
)

fetch('/api/send-otp')

                    const response = await fetch(
                        '/api/send-otp',
                        {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                            'application/json'
                        },
                        body: JSON.stringify({
                            phone:
                            propertyData.whatsapp,
                            listingData:
                            updatedPropertyData
                        })
                        }
                    )

                    const data =
                        await response.json()

                    if (!data.success) {

                        alert(
                        data.error ||
                        'Failed to send WhatsApp link'
                        )

                        return

                    }

                    alert(
                        'Tuanis! Check your WhatsApp.'
                    )

                    } catch (error) {

                    console.error(error)

                    alert(
                        'Something went wrong.'
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

                <PropertyDefinitionPanel
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
                />

                )}

                </main>

                )

                }