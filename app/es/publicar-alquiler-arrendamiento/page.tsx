'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
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
  formatWhatsAppNumber
} from '@/app/utils/listing-utils'

import AccessibilityFilters from '@/app/components/filter-bar/AccessibilityFilterS'
import EnvironmentFilterS from '@/app/components/filter-bar/EnvironmentFilterS'
import LegalStatusFilterS from '@/app/components/filter-bar/LegalStatusFilterS'
import PropertyAreaFilterS from '@/app/components/filter-bar/PropertyAreaFilterS'
import UtilitiesFilterS from '@/app/components/filter-bar/UtilitiesFilterS'
import ResidentialAttributesS from '@/app/components/filter-bar/ResidentialAttributesS'
import LocationSelectorS from '@/app/components/filter-bar/LocationSelectorS'
import TerrainFilterS from '@/app/components/filter-bar/TerrainFilterS'
import ImagePreviewGridS from '@/app/components/ImagePreviewGridS'
import ImageUploaderS from '@/app/components/ImageUploaderS'
import WhatsAppInputS from '@/app/components/WhatsAppInputS'
import { createRentalListing } from '@/app/utils/createRentalListing'
import CsvStagingModal from '@/app/components/CsvStagingModal'
import RentalPropertyDefinitionPanel from '@/app/components/RentalPropertyDefinitionPanel'
import PropertyTypeFilterS from '@/app/components/filter-bar/PropertyTypeFilterS'
import TopBarES from '@/app/components/TopBarES'
import MonthlyRentSelectorS from '@/app/components/filter-bar/MonthlyRentSelectorS'
import CreateListingButtonSXL from '@/app/components/CreateListingButtonSXL'
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
    const [show_bathroom_options, setShow_bathroom_options] = useState(false)
    const [show_parking_options, setShow_parking_options] = useState(false)
    const [show_year_built_options, setShow_year_built_options] = useState(false)
    const [show_construction_area_options, setShow_construction_area_options] = useState(false)
    const [showCsvStaging, setShowCsvStaging] = useState(false)
    const [showTerrainOptions, setShowTerrainOptions] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    
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
            accessibility: [] as string[],
            terrain: [] as string[],
            monthly_price: '',
            images: [] as {
                preview: string
                file: File
                uploadedUrl: string
                }[],
            whatsapp: '',
        })
            
        const show_residential_fields =
            residential_property_types.includes(
                propertyData.property_type
            )

        const [showMonthlyRentOptions, setShowMonthlyRentOptions] = useState(true)

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
                        <main style={{
                            background: '#000',
                            minHeight: '100vh',
                            color: '#fff',
                            padding: '1rem'
                        }}>

                            <div style={{
                        maxWidth: '90rem',
                        margin: '0 auto'
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

                                        <TopBarES
                                            onFilterClick={() =>
                                                setShowMobileFilters(true)
                                            }
                                        />

                    
                    <div>

                        <h1 style={{
                        fontSize: '4rem',
                        marginBottom: '.5rem'
                        }}>
                        Define Tu Propiedad de Alquiler
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
                        dentro del marketplace de alquileres.
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
                                    alert('Por favor selecciona primero un archivo CSV')
                                    return
                                    }

                                    Papa.parse(csvFile, {

                                    header: true,

                                    complete: async (results) => {

                                        const formattedData = results.data.map((row: any) => ({

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

                                        images: propertyData.images.map(
                                            (img: any) => img.uploadedUrl
                                            )

                                        }))

                                        console.log(formattedData)

                                        setCsvListings(formattedData)

                                        setShowCsvStaging(true)

                                    }

                                    })

                                }}
                                style={{
                                    background: '#00ff99',
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

<PropertyTypeFilterS

                    showSummaryCard={false}

                    bedrooms={propertyData.bedrooms}

                    bathrooms={propertyData.bathrooms}

                    parking={propertyData.parking}

                    yearBuiltRange={propertyData.year_built_range}

                    constructionArea={propertyData.construction_area}

                    propertyTypes={property_types}

                    residentialPropertyTypes={
                        residential_property_types
                    }

                    showPropertyTypeOptions={
                        showproperty_typeOptions
                    }

                     setShowPropertyAreaOptions={
                    setShowproperty_areaOptions
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

                        setShow_bedroom_options(true)
                        setShow_bathroom_options(false)
                        setShow_parking_options(false)
                        setShow_year_built_options(false)
                        setShow_construction_area_options(false)

                    }}

                    enableResidentialFlow={() => {

                        setShow_bedroom_options(true)
                        setShow_bathroom_options(false)
                        setShow_parking_options(false)
                        setShow_year_built_options(false)
                        setShow_construction_area_options(false)

                    }}

                    />



{/* RESIDENTIAL STRUCTURE ATTRIBUTES */}

                    {show_residential_fields && (

                    <ResidentialAttributesS

                        showResidentialSummary={false}
                        setShowResidentialSummary={() => {}}

                        setShowproperty_typeOptions={
                        setShowproperty_typeOptions
                        }

                        setShowproperty_areaOptions={
                        setShowproperty_areaOptions
                        }

                        bedrooms={propertyData.bedrooms}
                        setBedrooms={(value) =>
                        setPropertyData({
                            ...propertyData,
                            bedrooms: value
                        })
                        }

                        bathrooms={propertyData.bathrooms}
                        setBathrooms={(value) =>
                        setPropertyData({
                            ...propertyData,
                            bathrooms: value
                        })
                        }

                        parking={propertyData.parking}
                        setParking={(value) =>
                        setPropertyData({
                            ...propertyData,
                            parking: value
                        })
                        }

                        yearBuiltRange={propertyData.year_built_range}
                        setYearBuiltRange={(value) =>
                        setPropertyData({
                            ...propertyData,
                            year_built_range: value
                        })
                        }

                        constructionArea={propertyData.construction_area}
                        setConstructionArea={(value) =>
                        setPropertyData({
                            ...propertyData,
                            construction_area: value
                        })
                        }

                        bedroomOptions={bedroom_options}
                        bathroomOptions={bathroom_options}
                        parkingOptions={parking_options}
                        yearBuiltOptions={year_built_options}
                        constructionAreaOptions={construction_area_options}

                        showBedroomOptions={show_bedroom_options}
                        setShowBedroomOptions={setShow_bedroom_options}

                        showBathroomOptions={show_bathroom_options}
                        setShowBathroomOptions={setShow_bathroom_options}

                        showParkingOptions={show_parking_options}
                        setShowParkingOptions={setShow_parking_options}

                        showYearBuiltOptions={show_year_built_options}
                        setShowYearBuiltOptions={setShow_year_built_options}

                        showConstructionAreaOptions={
                        show_construction_area_options
                        }
                        setShowConstructionAreaOptions={
                        setShow_construction_area_options
                        }

                    />

                    )}

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
                    

{/* Monthly Price */}
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



</div> {/* LEFT SIDE */}

{/* RIGHT SIDE */}

                    <div style={{
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
                    }}>

                    <RentalPropertyDefinitionPanel
                            propertyData={propertyData}
                        />
                    <CreateListingButtonSXL
                        onCreateListing={() =>
                            createRentalListing(
                            propertyData,
                            generateListingTitle,
                            generateListingDescription
                            )
                        }
                        />
                    </div>
                </div>
            </div> {/* MAIN GRID */}

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
