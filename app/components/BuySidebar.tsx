'use client'
import LocationFilter from '@/app/components/filter-bar/LocationFilter'
import PriceFilter from '@/app/components/filter-bar/PriceFilter'
import PropertyTypeFilter from '@/app/components/filter-bar/PropertyTypeFilter'
import ResidentialAttributesS from '@/app/components/filter-bar/ResidentialAttributesS'
import PropertyAreaFilter from '@/app/components/filter-bar/PropertyAreaFilter'
import UtilitiesFilter from '@/app/components/filter-bar/UtilitiesFilter'
import EnvironmentFilter from '@/app/components/filter-bar/EnvironmentFilter'
import AccessibilityFilter from '@/app/components/filter-bar/AccessibilityFilter'
import TerrainFilter from '@/app/components/filter-bar/TerrainFilter'
import LegalStatusFilter from '@/app/components/filter-bar/LegalStatusFilter'
import {
  residential_property_types
} from '@/data/property-data'
import ConstructionAreaFilterS from '@/app/components/filter-bar/ConstructionAreaFilterS'

export default function BuySidebar(props: any) {

const {

                isMobile,
                showMobileFilters,
                setShowMobileFilters,

                showLocationOptions,
                setShowLocationOptions,
                showProvinceOptions,
                setShowProvinceOptions,
                showCantonOptions,
                setShowCantonOptions,
                showDistrictOptions,
                setShowDistrictOptions,
                provinces,
                districts,

                showPriceOptions,
                setShowPriceOptions,

                showproperty_typeOptions,
                setShowproperty_areaOptions,
                showBedroomOptions,
                setShowBedroomOptions,
                showBathroomOptions,
                setShowBathroomOptions,
                showParkingOptions,
                setShowParkingOptions,
                showYearBuiltOptions,
                setShowYearBuiltOptions,
                showConstructionAreaOptions,
                setShowConstructionAreaOptions,
                showResidentialSummary,
                setShowResidentialSummary,
                bedroomOptions,
                bathroomOptions,
                parkingOptions,
                yearBuiltOptions,
                constructionAreaOptions,

                showproperty_areaOptions,

                showutilityOptions,
                setShowutilityOptions,

                showenvironmentOptions,
                setShowenvironmentOptions,

                showAccessibilityOptions,
                setShowAccessibilityOptions,

                showTerrainOptions,
                setShowTerrainOptions,

                showlegal_statusOptions,
                setShowlegal_statusOptions,

                filters,
                setFilters,

                setShowproperty_typeOptions,

                children

                } = props

          const setSelectedprovince = (value: string) => {

                setFilters((prev: any) => ({
                    ...prev,
                    province: value,
                    canton: '',
                    district: ''
                }))

                if (value === '') {
                    setShowLocationOptions(true)
                    setShowProvinceOptions(true)
                    setShowCantonOptions(false)
                    setShowDistrictOptions(false)
                    return
                }

                setShowProvinceOptions(false)
                setShowCantonOptions(true)
                setShowDistrictOptions(false)

                }

                const setSelectedcanton = (value: string) => {

                setFilters((prev: any) => ({
                    ...prev,
                    canton: value,
                    district: ''
                }))

                if (value === '') {
                    setShowLocationOptions(true)
                    setShowProvinceOptions(false)
                    setShowCantonOptions(true)
                    setShowDistrictOptions(false)
                    return
                }

                setShowCantonOptions(false)
                setShowDistrictOptions(true)

                }

                const setSelecteddistrict = (value: string) => {

                setFilters((prev: any) => ({
                    ...prev,
                    district: value
                }))

                if (value === '') {
                    setShowLocationOptions(true)
                    setShowProvinceOptions(false)
                    setShowCantonOptions(false)
                    setShowDistrictOptions(true)
                    return
                }

                setShowProvinceOptions(false)
                setShowCantonOptions(false)
                setShowDistrictOptions(false)

                setShowLocationOptions(false)
                setShowproperty_typeOptions(true)

                }      

  return (

    <div
      style={{
        background: '#000000',
        borderRight: '1px solid #D4AF37',

        padding: '25px',

        display: 'flex',
        flexDirection: 'column',
        gap: '28px',

        position: isMobile
            ? 'fixed'
            : 'sticky',

        top: isMobile
            ? 0
            : '1rem',

        left:
            isMobile && !showMobileFilters
            ? '-100%'
            : '0',

        width:
            isMobile
            ? '85vw'
            : '320px',

        height:
            isMobile
            ? '100vh'
            : 'calc(100vh - 2rem)',

        overflowY: 'auto',

        alignSelf: 'flex-start',

        zIndex: 1500,

        transition: 'left .3s ease'
        }}
    >

      {isMobile && (

        <button
          onClick={() =>
            setShowMobileFilters(false)
          }
          style={{
            position: 'fixed',

            display:
              showMobileFilters
                ? 'block'
                : 'none',

            top: '1.25rem',
            left: '50%',

            transform:
              'translateX(-50%)',

            width:
              'calc(85vw - 2rem)',

            maxWidth: '12rem',

            background: '#ffffff',

            color: '#0E4A86',

            border:
              '2px solid #D4AF37',

            borderRadius: '999rem',

            padding: '.75rem',

            fontWeight: 'bold',

            cursor: 'pointer',

            zIndex: 9999
          }}
        >
          View Properties
        </button>

      )}

      <h2
        style={{
          color: '#fff',
          textAlign: 'center',

          textShadow:
            '-1px -1px 0 #D4AF37,' +
            '1px -1px 0 #D4AF37,' +
            '-1px 1px 0 #D4AF37,' +
            '1px 1px 0 #D4AF37'
        }}
      >
        Filters
      </h2>

<LocationFilter
                showLocationOptions={showLocationOptions}
                setShowLocationOptions={setShowLocationOptions}

                showProvinceOptions={showProvinceOptions}
                setShowProvinceOptions={setShowProvinceOptions}

                showCantonOptions={showCantonOptions}
                setShowCantonOptions={setShowCantonOptions}

                showDistrictOptions={showDistrictOptions}
                setShowDistrictOptions={setShowDistrictOptions}

                provinces={provinces}
                districts={districts}

                selectedprovince={filters.province}
                selectedcanton={filters.canton}
                selecteddistrict={filters.district}

                setSelectedprovince={setSelectedprovince}
                setSelectedcanton={setSelectedcanton}
                setSelecteddistrict={setSelecteddistrict}
                />

<PriceFilter

                showPriceOptions={showPriceOptions}
                setShowPriceOptions={setShowPriceOptions}

                setShowProvinceOptions={setShowProvinceOptions}
                setShowCantonOptions={setShowCantonOptions}
                setShowDistrictOptions={setShowDistrictOptions}

                selectedprice_range={filters.price_range}

                setSelectedprice_range={(value: string) => {

                    setFilters((prev: any) => ({
                    ...prev,
                    price_range: value
                    }))

                    setShowPriceOptions(false)

                    setShowproperty_typeOptions(true)

                }}

                />

<PropertyTypeFilter

                showproperty_typeOptions={showproperty_typeOptions}
                setShowproperty_typeOptions={setShowproperty_typeOptions}

                setShowproperty_areaOptions={setShowproperty_areaOptions}

                setShowBedroomOptions={setShowBedroomOptions}

                setShowProvinceOptions={setShowProvinceOptions}
                setShowCantonOptions={setShowCantonOptions}
                setShowDistrictOptions={setShowDistrictOptions}

                selectedproperty_type={filters.property_type}
                setSelectedproperty_type={(value: string) =>
                    setFilters((prev: any) => ({
                        ...prev,
                        property_type: value
                    }))
                    }
                bedrooms={filters.bedrooms}
                bathrooms={filters.bathrooms}
                parking={filters.parking}

                yearBuiltRange={filters.year_built}
                
                />
            
{residential_property_types.includes(
  filters.property_type
) && (
<ResidentialAttributesS

                    setShowproperty_typeOptions={
                        setShowproperty_typeOptions
                    }

                    setShowproperty_areaOptions={
                        setShowproperty_areaOptions
                    }

                    bedrooms={filters.bedrooms}
                    setBedrooms={(value: string) =>
                        setFilters((prev: any) => ({
                        ...prev,
                        bedrooms: value
                        }))
                    }

                    bathrooms={filters.bathrooms}
                    setBathrooms={(value: string) =>
                        setFilters((prev: any) => ({
                        ...prev,
                        bathrooms: value
                        }))
                    }

                    parking={filters.parking}
                    setParking={(value: string) =>
                        setFilters((prev: any) => ({
                        ...prev,
                        parking: value
                        }))
                    }

                    yearBuiltRange={filters.year_built}
                    setYearBuiltRange={(value: string) =>
                        setFilters((prev: any) => ({
                        ...prev,
                        year_built: value
                        }))
                    }

                    setShowResidentialSummary={
                        setShowResidentialSummary
                    }

                    bedroomOptions={bedroomOptions}
                    bathroomOptions={bathroomOptions}
                    parkingOptions={parkingOptions}
                    yearBuiltOptions={yearBuiltOptions}
                    

                    showBedroomOptions={showBedroomOptions}
                    setShowBedroomOptions={setShowBedroomOptions}

                    showBathroomOptions={showBathroomOptions}
                    setShowBathroomOptions={setShowBathroomOptions}

                    showParkingOptions={showParkingOptions}
                    setShowParkingOptions={setShowParkingOptions}

                    showYearBuiltOptions={showYearBuiltOptions}
                    setShowYearBuiltOptions={setShowYearBuiltOptions}

                    showResidentialSummary={
                        showResidentialSummary
                    }
                />
        )}
        <ConstructionAreaFilterS
            selectedConstructionArea={
                filters.construction_area
            }

            setSelectedConstructionArea={(value: string) => {
                setFilters((prev: any) => ({
                ...prev,
                construction_area: value
                }))
            }}

            showConstructionAreaOptions={
                showConstructionAreaOptions
            }

            setShowConstructionAreaOptions={
                setShowConstructionAreaOptions
            }

            setShowPropertyAreaOptions={
                setShowproperty_areaOptions
            }
            constructionAreaOptions={
                constructionAreaOptions.map(
                    (option: string) => ({
                    en: option,
                    es: option
                    })
                )
                }
            />

<PropertyAreaFilter

                    showproperty_areaOptions={
                        showproperty_areaOptions
                    }

                    setShowproperty_areaOptions={
                        setShowproperty_areaOptions
                    }

                    setShowutilityOptions={
                        setShowutilityOptions
                    }

                    selectedproperty_area={
                        filters.property_area
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

                    setSelectedproperty_area={(value: string) => {

                        setFilters((prev: any) => ({
                            ...prev,
                            property_area: value
                        }))

                        if (value === '') {
                            setShowproperty_areaOptions(true)
                            setShowutilityOptions(true)
                            return
                        }

                        setShowproperty_areaOptions(false)
                        setShowutilityOptions(true)

                        }}

                    />

<UtilitiesFilter

                    selectedutility={filters.utility}

                    setSelectedutility={(value: string[]) => {

                    console.log(
                        'SETTING UTILITY FILTER:',
                        value
                    )

                    setFilters((prev: any) => ({
                        ...prev,
                        utility: value
                    }))

                    }}

                    showutilityOptions={showutilityOptions}

                    setShowutilityOptions={
                        setShowutilityOptions
                    }

                    />

<EnvironmentFilter

                    selectedenvironment={filters.environment}

                    setSelectedenvironment={(value: string[]) => {

                        setFilters((prev: any) => ({
                        ...prev,
                        environment: value
                        }))

                    }}

                    showenvironmentOptions={showenvironmentOptions}

                    setShowenvironmentOptions={
                        setShowenvironmentOptions
                    }

                    setShowutilityOptions={
                        setShowutilityOptions
                        }

                    setShowAccessibilityOptions={
                        setShowAccessibilityOptions
                    }

                    />

<AccessibilityFilter

                selectedaccessibility={filters.accessibility}

                setSelectedaccessibility={(value: string) => {
                    setFilters((prev: any) => ({
                        ...prev,
                        accessibility: value
                    }))
                }}

                showAccessibilityOptions={
                    showAccessibilityOptions
                }

                setShowAccessibilityOptions={
                    setShowAccessibilityOptions
                }

                />

<TerrainFilter

                selectedterrain={filters.terrain}

                setSelectedterrain={(value: string[]) => {

                    setFilters((prev: any) => ({
                    ...prev,
                    terrain: value
                    }))

                }}

                showTerrainOptions={
                    showTerrainOptions
                }

                setShowTerrainOptions={
                    setShowTerrainOptions
                }

                />

<LegalStatusFilter

                selectedlegal_status={filters.legal_status}

                setSelectedlegal_status={(value: string) => {

                    setFilters((prev: any) => ({
                    ...prev,
                    legal_status: value
                    }))

                }}
                        showlegal_statusOptions={
                            showlegal_statusOptions
                        }

                        setShowlegal_statusOptions={
                            setShowlegal_statusOptions
                        }

                        setShowTerrainOptions={
                            setShowTerrainOptions
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
                
      {children}

    </div>

  )

}