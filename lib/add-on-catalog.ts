import type {
  SupabaseClient
} from '@supabase/supabase-js'

export type AddOnProductType =
  | 'promotion'
  | 'presentation'
  | 'verification'
  | 'publishing_capacity'
  | 'membership'

export type AddOnTargetType =
  | 'listing'
  | 'account'

export type AddOnDurationType =
  | 'days'
  | 'listing_lifetime'
  | 'permanent'
  | 'single_use'

export type AvailableAddOn = {
  id: string
  slug: string

  nameEn: string
  nameEs: string

  descriptionEn: string
  descriptionEs: string

  productType:
    AddOnProductType

  targetType:
    AddOnTargetType

  priceUsd: number
  priceCrc: number

  durationType:
    AddOnDurationType

  durationDays:
    number | null

  isStackable: boolean

  maximumQuantity:
    number | null

  requiresManualApproval:
    boolean

  displayOrder: number

  isActive: boolean
}

type DatabaseAddOnEligibility = {
  package_id: string
}

type DatabaseAddOnProduct = {
  id: string
  slug: string

  name_en: string
  name_es: string

  description_en: string
  description_es: string

  product_type:
    AddOnProductType

  target_type:
    AddOnTargetType

  price_usd: number
  price_crc: number

  duration_type:
    AddOnDurationType

  duration_days:
    number | null

  is_stackable: boolean

  maximum_quantity:
    number | null

  requires_manual_approval:
    boolean

  display_order: number

  is_active: boolean

  package_eligibility:
    DatabaseAddOnEligibility[]
}

export class AddOnCatalogError
  extends Error {
  code:
    | 'PACKAGE_ID_REQUIRED'
    | 'ADD_ON_CATALOG_LOAD_FAILED'

  constructor(
    code:
      AddOnCatalogError['code'],
    message: string
  ) {
    super(message)

    this.name =
      'AddOnCatalogError'

    this.code =
      code
  }
}

export async function resolveAvailableAddOns({
  supabase,
  packageId,
  includeInactive = false
}: {
  supabase: SupabaseClient
  packageId: string
  includeInactive?: boolean
}): Promise<AvailableAddOn[]> {
  if (!packageId) {
    throw new AddOnCatalogError(
      'PACKAGE_ID_REQUIRED',
      'A package ID is required to resolve available add-ons.'
    )
  }

  let query =
    supabase
      .from(
        'add_on_products'
      )
      .select(`
        id,
        slug,
        name_en,
        name_es,
        description_en,
        description_es,
        product_type,
        target_type,
        price_usd,
        price_crc,
        duration_type,
        duration_days,
        is_stackable,
        maximum_quantity,
        requires_manual_approval,
        display_order,
        is_active,

        package_eligibility:add_on_product_packages!inner (
          package_id
        )
      `)
      .eq(
        'package_eligibility.package_id',
        packageId
      )
      .order(
        'display_order',
        {
          ascending: true
        }
      )

  if (!includeInactive) {
    query =
      query.eq(
        'is_active',
        true
      )
  }

  const {
    data,
    error
  } =
    await query

  if (error) {
    throw new AddOnCatalogError(
      'ADD_ON_CATALOG_LOAD_FAILED',
      error.message
    )
  }

  const products =
    (
      data ?? []
    ) as DatabaseAddOnProduct[]

  return products.map(
    product => ({
      id:
        product.id,

      slug:
        product.slug,

      nameEn:
        product.name_en,

      nameEs:
        product.name_es,

      descriptionEn:
        product.description_en,

      descriptionEs:
        product.description_es,

      productType:
        product.product_type,

      targetType:
        product.target_type,

      priceUsd:
        product.price_usd,

      priceCrc:
        product.price_crc,

      durationType:
        product.duration_type,

      durationDays:
        product.duration_days,

      isStackable:
        product.is_stackable,

      maximumQuantity:
        product.maximum_quantity,

      requiresManualApproval:
        product.requires_manual_approval,

      displayOrder:
        product.display_order,

      isActive:
        product.is_active
    })
  )
}