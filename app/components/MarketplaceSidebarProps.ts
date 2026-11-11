import type {Dispatch, SetStateAction} from 'react'

// Required visibility callbacks shared by the existing four marketplace sidebars.
export type MarketplaceSidebarProps = {
  setShowAccessibilityOptions: Dispatch<SetStateAction<boolean>>
  setShowBathroomOptions: Dispatch<SetStateAction<boolean>>
  setShowBedroomOptions: Dispatch<SetStateAction<boolean>>
  setShowCantonOptions: Dispatch<SetStateAction<boolean>>
  setShowConstructionAreaOptions: Dispatch<SetStateAction<boolean>>
  setShowDistrictOptions: Dispatch<SetStateAction<boolean>>
  setShowLocationOptions: Dispatch<SetStateAction<boolean>>
  setShowMobileFilters: Dispatch<SetStateAction<boolean>>
  setShowParkingOptions: Dispatch<SetStateAction<boolean>>
  setShowPriceOptions: Dispatch<SetStateAction<boolean>>
  setShowProvinceOptions: Dispatch<SetStateAction<boolean>>
  setShowResidentialSummary: Dispatch<SetStateAction<boolean>>
  setShowTerrainOptions: Dispatch<SetStateAction<boolean>>
  setShowYearBuiltOptions: Dispatch<SetStateAction<boolean>>
  setShowenvironmentOptions: Dispatch<SetStateAction<boolean>>
  setShowlegal_statusOptions: Dispatch<SetStateAction<boolean>>
  setShowproperty_areaOptions: Dispatch<SetStateAction<boolean>>
  setShowproperty_typeOptions: Dispatch<SetStateAction<boolean>>
  setShowutilityOptions: Dispatch<SetStateAction<boolean>>
  showAccessibilityOptions: boolean
  showBathroomOptions: boolean
  showBedroomOptions: boolean
  showCantonOptions: boolean
  showConstructionAreaOptions: boolean
  showDistrictOptions: boolean
  showLocationOptions: boolean
  showMobileFilters: boolean
  showParkingOptions: boolean
  showPriceOptions: boolean
  showProvinceOptions: boolean
  showResidentialSummary: boolean
  showTerrainOptions: boolean
  showYearBuiltOptions: boolean
  showenvironmentOptions: boolean
  showlegal_statusOptions: boolean
  showproperty_areaOptions: boolean
  showproperty_typeOptions: boolean
  showutilityOptions: boolean
  setFilters: Dispatch<SetStateAction<any>>
  [key: string]: any
}
