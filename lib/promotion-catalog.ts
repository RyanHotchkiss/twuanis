import type {
  SupabaseClient
} from '@supabase/supabase-js'


export type PromotionProductSlug =
  | 'featured-listing'
  | 'listing-boost'
  | 'homepage-exposure'
  | 'province-exposure'
  | 'property-type-exposure'
  | 'market-explorer-exposure'


export type PromotionSurface =
  | 'buy-results'
  | 'rent-results'
  | 'homepage'
  | 'province'
  | 'property-type'
  | 'market-explorer'


export type PromotionScope =
  | 'marketplace'
  | 'homepage'
  | 'province'
  | 'property-type'
  | 'market-explorer'


export type PromotionPriorityMode =
  | 'featured'
  | 'boost'
  | 'surface-placement'


export type PromotionDurationBehavior =
  | 'entitlement-window'


export type PromotionStackingBehavior =
  | 'stackable'
  | 'non-stackable'


export type PromotionCatalogProduct = {
  slug:
    PromotionProductSlug

  surfaces:
    PromotionSurface[]

  scope:
    PromotionScope

  priorityMode:
    PromotionPriorityMode

  priorityWeight:
    number

  durationBehavior:
    PromotionDurationBehavior

  stackingBehavior:
    PromotionStackingBehavior

  maximumQuantity:
    number | null

  /*
   * Promotion behavior does not own pricing.
   *
   * Commercial pricing remains in add_on_products.
   */
}


type DatabasePromotionProduct = {
  id:
    string

  slug:
    string

  product_type:
    string

  target_type:
    string

  is_stackable:
    boolean

  maximum_quantity:
    number | null

  is_active:
    boolean
}


export type ResolvedPromotionCatalogProduct = {
  productId:
    string

  slug:
    PromotionProductSlug

  surfaces:
    PromotionSurface[]

  scope:
    PromotionScope

  priorityMode:
    PromotionPriorityMode

  priorityWeight:
    number

  durationBehavior:
    PromotionDurationBehavior

  stackingBehavior:
    PromotionStackingBehavior

  maximumQuantity:
    number | null

  isActive:
    boolean
}


export class PromotionCatalogError
  extends Error {

  code:
    | 'PROMOTION_NOT_FOUND'
    | 'PROMOTION_CATALOG_LOAD_FAILED'
    | 'INVALID_PROMOTION_PRODUCT'

  constructor(
    code:
      PromotionCatalogError['code'],

    message:
      string
  ) {

    super(
      message
    )

    this.name =
      'PromotionCatalogError'

    this.code =
      code
  }
}


/*
 * ---------------------------------------------------------
 * CANONICAL PROMOTION BEHAVIOR
 * ---------------------------------------------------------
 *
 * Commercial properties such as:
 *
 * • price
 * • currency
 * • package eligibility
 *
 * belong to the Commercial Platform.
 *
 * This catalog defines only operational marketplace
 * behavior.
 */


const PROMOTION_CATALOG:
  Record<
    PromotionProductSlug,
    PromotionCatalogProduct
  > = {

  'featured-listing': {

    slug:
      'featured-listing',

    surfaces: [
      'buy-results',
      'rent-results'
    ],

    scope:
      'marketplace',

    priorityMode:
      'featured',

    /*
     * Featured placement should outrank ordinary organic
     * results while still requiring the listing to qualify
     * naturally for the result cohort.
     */
    priorityWeight:
      100,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'non-stackable',

    maximumQuantity:
      1
  },


  'listing-boost': {

    slug:
      'listing-boost',

    surfaces: [
      'buy-results',
      'rent-results'
    ],

    scope:
      'marketplace',

    priorityMode:
      'boost',

    /*
     * Lower than Featured Listing.
     *
     * Multiple active boosts may accumulate later through
     * Promotion Resolution, subject to the canonical maximum
     * quantity defined commercially.
     */
    priorityWeight:
      25,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'stackable',

    maximumQuantity:
      4
  },


  'homepage-exposure': {

    slug:
      'homepage-exposure',

    surfaces: [
      'homepage'
    ],

    scope:
      'homepage',

    priorityMode:
      'surface-placement',

    priorityWeight:
      100,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'non-stackable',

    maximumQuantity:
      1
  },


  'province-exposure': {

    slug:
      'province-exposure',

    surfaces: [
      'province'
    ],

    scope:
      'province',

    priorityMode:
      'surface-placement',

    priorityWeight:
      75,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'non-stackable',

    maximumQuantity:
      1
  },


  'property-type-exposure': {

    slug:
      'property-type-exposure',

    surfaces: [
      'property-type'
    ],

    scope:
      'property-type',

    priorityMode:
      'surface-placement',

    priorityWeight:
      75,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'non-stackable',

    maximumQuantity:
      1
  },


  'market-explorer-exposure': {

    slug:
      'market-explorer-exposure',

    surfaces: [
      'market-explorer'
    ],

    scope:
      'market-explorer',

    priorityMode:
      'surface-placement',

    priorityWeight:
      75,

    durationBehavior:
      'entitlement-window',

    stackingBehavior:
      'non-stackable',

    maximumQuantity:
      1
  }
}


/*
 * ---------------------------------------------------------
 * TYPE GUARD
 * ---------------------------------------------------------
 */


export function isPromotionProductSlug(
  value:
    string
): value is PromotionProductSlug {

  return Object.prototype
    .hasOwnProperty.call(
      PROMOTION_CATALOG,
      value
    )
}


/*
 * ---------------------------------------------------------
 * STATIC CATALOG ACCESS
 * ---------------------------------------------------------
 */


export function getPromotionCatalogProduct(
  slug:
    PromotionProductSlug
): PromotionCatalogProduct {

  const product =
    PROMOTION_CATALOG[
      slug
    ]

  if (!product) {

    throw new PromotionCatalogError(
      'PROMOTION_NOT_FOUND',
      `Promotion product "${slug}" is not registered in the canonical Promotion Catalog.`
    )
  }

  return product
}


export function getPromotionCatalog():
  PromotionCatalogProduct[] {

  return Object.values(
    PROMOTION_CATALOG
  )
}


/*
 * ---------------------------------------------------------
 * DATABASE-BACKED PROMOTION RESOLUTION
 * ---------------------------------------------------------
 *
 * The database remains authoritative for whether the
 * commercial product exists and is active.
 *
 * This module remains authoritative for what that product
 * means operationally.
 */


export async function resolvePromotionCatalogProduct({
  supabase,
  slug,
  includeInactive = false
}: {
  supabase:
    SupabaseClient

  slug:
    string

  includeInactive?:
    boolean
}): Promise<
  ResolvedPromotionCatalogProduct
> {

  if (
    !isPromotionProductSlug(
      slug
    )
  ) {

    throw new PromotionCatalogError(
      'PROMOTION_NOT_FOUND',
      `Promotion product "${slug}" does not exist in the canonical Promotion Catalog.`
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
        product_type,
        target_type,
        is_stackable,
        maximum_quantity,
        is_active
      `)
      .eq(
        'slug',
        slug
      )
      .eq(
        'product_type',
        'promotion'
      )
      .eq(
        'target_type',
        'listing'
      )


  if (
    !includeInactive
  ) {
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
      .maybeSingle()


  if (error) {

    throw new PromotionCatalogError(
      'PROMOTION_CATALOG_LOAD_FAILED',
      error.message
    )
  }


  if (!data) {

    throw new PromotionCatalogError(
      'PROMOTION_NOT_FOUND',
      `Promotion product "${slug}" does not exist or is inactive.`
    )
  }


  const databaseProduct =
    data as
      DatabasePromotionProduct


  const catalogProduct =
    getPromotionCatalogProduct(
      slug
    )


  /*
   * Fail closed when the commercial catalog and operational
   * catalog disagree about stacking behavior.
   *
   * This prevents Promotion behavior from silently drifting
   * away from what was actually sold.
   */

  const expectedStackable =
    catalogProduct
      .stackingBehavior ===
        'stackable'


  if (
    databaseProduct.is_stackable !==
      expectedStackable
  ) {

    throw new PromotionCatalogError(
      'INVALID_PROMOTION_PRODUCT',
      `Promotion product "${slug}" has inconsistent stacking behavior between the Commercial Catalog and Promotion Catalog.`
    )
  }


  if (
    databaseProduct.maximum_quantity !==
      catalogProduct.maximumQuantity
  ) {

    throw new PromotionCatalogError(
      'INVALID_PROMOTION_PRODUCT',
      `Promotion product "${slug}" has inconsistent maximum quantity between the Commercial Catalog and Promotion Catalog.`
    )
  }


  return {

    productId:
      databaseProduct.id,

    slug,

    surfaces:
      catalogProduct.surfaces,

    scope:
      catalogProduct.scope,

    priorityMode:
      catalogProduct.priorityMode,

    priorityWeight:
      catalogProduct.priorityWeight,

    durationBehavior:
      catalogProduct.durationBehavior,

    stackingBehavior:
      catalogProduct.stackingBehavior,

    maximumQuantity:
      catalogProduct.maximumQuantity,

    isActive:
      databaseProduct.is_active
  }
}


/*
 * ---------------------------------------------------------
 * SURFACE RESOLUTION
 * ---------------------------------------------------------
 */


export function promotionSupportsSurface({
  promotion,
  surface
}: {
  promotion:
    PromotionCatalogProduct |
    ResolvedPromotionCatalogProduct

  surface:
    PromotionSurface
}): boolean {

  return promotion
    .surfaces
    .includes(
      surface
    )
}


/*
 * ---------------------------------------------------------
 * PRIORITY RESOLUTION
 * ---------------------------------------------------------
 *
 * This returns the catalog-defined base weight only.
 *
 * The Promotion Engine will later combine this with:
 *
 * • active entitlement quantity
 * • eligibility
 * • scheduling
 * • scope
 * • organic ranking
 *
 * Promotion Catalog does NOT rank listings itself.
 */


export function resolvePromotionBasePriority(
  promotion:
    PromotionCatalogProduct |
    ResolvedPromotionCatalogProduct
): number {

  return promotion
    .priorityWeight
}