import type {
  SupabaseClient
} from '@supabase/supabase-js'

import type {
  AddOnProductType,
  AddOnTargetType
} from '@/lib/add-on-catalog'

export type ListingEntitlementStatus =
  | 'pending'
  | 'scheduled'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'cancelled'

export type ListingEntitlementSourceType =
  | 'package_credit'
  | 'purchase'
  | 'manual'
  | 'system'

export type ListingCapabilitySlug =
  | 'featured-listing'
  | 'listing-boost'
  | 'premium-gallery'
  | 'verified-ownership'
  | 'premium-listing-template'
  | 'homepage-exposure'

export type ListingEntitlementRecord = {
  entitlementId: string

  listingId: string
  ownerId: string

  productId: string
  productSlug: string

  productNameEn: string
  productNameEs: string

  productType:
    AddOnProductType

  targetType:
    AddOnTargetType

  status:
    ListingEntitlementStatus

  sourceType:
    ListingEntitlementSourceType

  startsAt: string | null
  expiresAt: string | null

  purchaseRequestId:
    string | null

  assignedBy:
    string | null

  revokedAt:
    string | null

  revokedBy:
    string | null

  revocationReason:
    string | null

  createdAt: string
  updatedAt: string

  isPending: boolean
  isScheduled: boolean
  isCurrentlyActive: boolean
  isExpired: boolean
  isRevoked: boolean
  isCancelled: boolean
}

export type ResolvedListingCapability = {
  slug: ListingCapabilitySlug

  hasAccess: boolean

  activeEntitlements:
    ListingEntitlementRecord[]

  scheduledEntitlements:
    ListingEntitlementRecord[]

  historicalEntitlements:
    ListingEntitlementRecord[]

  activeQuantity: number
}

export type ResolvedListingEntitlements = {
  listingId: string
  ownerId: string

  resolvedAt: string

  entitlements:
    ListingEntitlementRecord[]

  activeEntitlements:
    ListingEntitlementRecord[]

  scheduledEntitlements:
    ListingEntitlementRecord[]

  historicalEntitlements:
    ListingEntitlementRecord[]

  capabilities: {
    featuredListing:
      ResolvedListingCapability

    listingBoost:
      ResolvedListingCapability

    premiumGallery:
      ResolvedListingCapability

    verifiedOwnership:
      ResolvedListingCapability

    premiumListingTemplate:
      ResolvedListingCapability

    homepageExposure:
      ResolvedListingCapability
  }

  /*
   * Any future listing-targeted product appears here
   * automatically, even before a named capability is
   * added above.
   */
  capabilitiesBySlug:
    Record<
      string,
      ResolvedListingCapability
    >
}

/*
 * ---------------------------------------------------------
 * BATCH LISTING ENTITLEMENT RESOLUTION
 * ---------------------------------------------------------
 *
 * Canonical cohort resolver.
 *
 * Designed for marketplace surfaces where many listings
 * need entitlement state at once.
 *
 * Instead of:
 *
 * N listings
 * → N listing queries
 * → N entitlement queries
 *
 * this resolver performs:
 *
 * → one listings query
 * → one listing_entitlements query
 *
 * Entitlement lifecycle truth still belongs exclusively
 * to calculateEntitlementState().
 */


  export async function resolveListingEntitlementsBatch({
      supabase,
      listingIds,
      includeInactive = true,
      now = new Date()
    }: {
      supabase:
        SupabaseClient

      listingIds:
        string[]

      includeInactive?:
        boolean

      now?:
        Date
    }): Promise<
      ResolvedListingEntitlementsBatch
    > {

      /*
      * Normalize the cohort first.
      *
      * Duplicate listing IDs must never result in duplicate
      * commercial resolution work.
      */

      const uniqueListingIds =
        Array.from(
          new Set(
            listingIds.filter(
              Boolean
            )
          )
        )


      if (
        uniqueListingIds.length ===
          0
      ) {

        return {
          resolvedAt:
            now.toISOString(),

          requestedListingIds: [],

          customerOwnedListingIds: [],

          externalListingIds: [],

          byListingId: {}
        }
      }


      /*
      * -------------------------------------------------------
      * LOAD LISTING OWNERSHIP IN ONE QUERY
      * -------------------------------------------------------
      */


      const {
        data:
          listingData,

        error:
          listingError
      } =
        await supabase
          .from(
            'listings'
          )
          .select(`
            id,
            owner_id
          `)
          .in(
            'id',
            uniqueListingIds
          )


      if (
        listingError
      ) {

        throw new ListingEntitlementsError(
          'LISTING_NOT_FOUND',
          listingError.message
        )
      }


      const listings =
        (
          listingData ??
          []
        ) as DatabaseListing[]


      /*
      * Fail closed if a requested listing disappeared between
      * cohort resolution and entitlement resolution.
      */

      const returnedListingIds =
        new Set(
          listings.map(
            listing =>
              listing.id
          )
        )


      const missingListingIds =
        uniqueListingIds.filter(
          listingId =>
            !returnedListingIds.has(
              listingId
            )
        )


      if (
        missingListingIds.length >
          0
      ) {

        throw new ListingEntitlementsError(
          'LISTING_NOT_FOUND',
          `Could not resolve listing entitlements because the following listings do not exist: ${missingListingIds.join(', ')}`
        )
      }


      const customerOwnedListings =
        listings.filter(
          listing =>
            Boolean(
              listing.owner_id
            )
        )


      const externalListings =
        listings.filter(
          listing =>
            !listing.owner_id
        )


      const customerOwnedListingIds =
        customerOwnedListings.map(
          listing =>
            listing.id
        )


      const externalListingIds =
        externalListings.map(
          listing =>
            listing.id
        )


      /*
      * External inventory cannot own listing entitlements.
      *
      * It is intentionally excluded from the entitlement
      * query rather than treated as exceptional.
      */

      if (
        customerOwnedListingIds.length ===
          0
      ) {

        return {
          resolvedAt:
            now.toISOString(),

          requestedListingIds:
            uniqueListingIds,

          customerOwnedListingIds: [],

          externalListingIds,

          byListingId: {}
        }
      }


      const ownerByListingId =
        new Map<
          string,
          string
        >()


      for (
        const listing
        of customerOwnedListings
      ) {

        if (
          listing.owner_id
        ) {

          ownerByListingId.set(
            listing.id,
            listing.owner_id
          )
        }
      }


      /*
      * -------------------------------------------------------
      * LOAD ALL ENTITLEMENTS IN ONE QUERY
      * -------------------------------------------------------
      */


      const {
        data:
          entitlementData,

        error:
          entitlementError
      } =
        await supabase
          .from(
            'listing_entitlements'
          )
          .select(`
            id,
            listing_id,
            product_id,
            owner_id,
            status,
            source_type,
            starts_at,
            expires_at,
            purchase_request_id,
            assigned_by,
            revoked_at,
            revoked_by,
            revocation_reason,
            created_at,
            updated_at,

            product:add_on_products (
              id,
              slug,
              name_en,
              name_es,
              product_type,
              target_type
            )
          `)
          .in(
            'listing_id',
            customerOwnedListingIds
          )
          .order(
            'created_at',
            {
              ascending:
                false
            }
          )


      if (
        entitlementError
      ) {

        throw new ListingEntitlementsError(
          'LISTING_ENTITLEMENTS_LOAD_FAILED',
          entitlementError.message
        )
      }


      const nowTimestamp =
        now.getTime()


      const resolvedRecords =
        (
          entitlementData ??
          []
        )
          .map(
            row => {

              const entitlement =
                row as
                  DatabaseListingEntitlement


              const canonicalOwnerId =
                ownerByListingId.get(
                  entitlement.listing_id
                )


              /*
              * Entitlement ownership must agree with canonical
              * listing ownership.
              */

              if (
                !canonicalOwnerId ||
                entitlement.owner_id !==
                  canonicalOwnerId
              ) {

                throw new ListingEntitlementsError(
                  'LISTING_OWNER_MISMATCH',
                  `Entitlement ${entitlement.id} does not match the canonical owner of listing ${entitlement.listing_id}.`
                )
              }

        const product =
          resolveEntitlementProduct(
            entitlement.product
          )
              if (
                !product ||
                product.target_type !==
                  'listing'
              ) {

                throw new ListingEntitlementsError(
                  'INVALID_ENTITLEMENT_PRODUCT',
                  `Entitlement ${entitlement.id} does not reference a valid listing-targeted product.`
                )
              }


              const state =
                calculateEntitlementState({
                  status:
                    entitlement.status,

                  startsAt:
                    entitlement.starts_at,

                  expiresAt:
                    entitlement.expires_at,

                  now:
                    nowTimestamp
                })


              return {
                entitlementId:
                  entitlement.id,

                listingId:
                  entitlement.listing_id,

                ownerId:
                  entitlement.owner_id,

                productId:
                  product.id,

                productSlug:
                  product.slug,

                productNameEn:
                  product.name_en,

                productNameEs:
                  product.name_es,

                productType:
                  product.product_type,

                targetType:
                  product.target_type,

                status:
                  entitlement.status,

                sourceType:
                  entitlement.source_type,

                startsAt:
                  entitlement.starts_at,

                expiresAt:
                  entitlement.expires_at,

                purchaseRequestId:
                  entitlement
                    .purchase_request_id,

                assignedBy:
                  entitlement.assigned_by,

                revokedAt:
                  entitlement.revoked_at,

                revokedBy:
                  entitlement.revoked_by,

                revocationReason:
                  entitlement
                    .revocation_reason,

                createdAt:
                  entitlement.created_at,

                updatedAt:
                  entitlement.updated_at,

                ...state
              } satisfies
                ListingEntitlementRecord
            }
          )


      /*
      * -------------------------------------------------------
      * GROUP ENTITLEMENTS BY LISTING
      * -------------------------------------------------------
      */


      const recordsByListingId =
        resolvedRecords.reduce<
          Record<
            string,
            ListingEntitlementRecord[]
          >
        >(
          (
            grouped,
            entitlement
          ) => {

            if (
              !grouped[
                entitlement.listingId
              ]
            ) {

              grouped[
                entitlement.listingId
              ] = []
            }


            grouped[
              entitlement.listingId
            ].push(
              entitlement
            )


            return grouped
          },
          {}
        )


      /*
      * -------------------------------------------------------
      * BUILD CANONICAL RESULT FOR EACH CUSTOMER LISTING
      * -------------------------------------------------------
      */


      const byListingId:
        Record<
          string,
          ResolvedListingEntitlements
        > = {}


      for (
        const listing
        of customerOwnedListings
      ) {

        if (
          !listing.owner_id
        ) {
          continue
        }


        const allEntitlements =
          recordsByListingId[
            listing.id
          ] ??
          []


        const returnedEntitlements =
          includeInactive
            ? allEntitlements
            : allEntitlements.filter(
                entitlement =>
                  entitlement
                    .isCurrentlyActive
              )


        const activeEntitlements =
          allEntitlements.filter(
            entitlement =>
              entitlement
                .isCurrentlyActive
          )


        const scheduledEntitlements =
          allEntitlements.filter(
            entitlement =>
              entitlement
                .isScheduled
          )


        const historicalEntitlements =
          allEntitlements.filter(
            entitlement =>
              !entitlement
                .isCurrentlyActive &&
              !entitlement
                .isScheduled
          )


        const capabilitiesBySlug =
          allEntitlements.reduce<
            Record<
              string,
              ResolvedListingCapability
            >
          >(
            (
              capabilities,
              entitlement
            ) => {

              const slug =
                entitlement.productSlug


              if (
                !capabilities[
                  slug
                ]
              ) {

                capabilities[
                  slug
                ] =
                  createCapability({
                    slug,

                    entitlements:
                      allEntitlements
                  })
              }


              return capabilities
            },
            {}
          )


        const getNamedCapability = (
          slug:
            ListingCapabilitySlug
        ):
          ResolvedListingCapability => {

          return (
            capabilitiesBySlug[
              slug
            ] ??
            createCapability({
              slug,

              entitlements:
                allEntitlements
            })
          )
        }


        byListingId[
          listing.id
        ] = {

          listingId:
            listing.id,

          ownerId:
            listing.owner_id,

          resolvedAt:
            now.toISOString(),

          entitlements:
            returnedEntitlements,

          activeEntitlements,

          scheduledEntitlements,

          historicalEntitlements,

          capabilities: {

            featuredListing:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .featuredListing
              ),

            listingBoost:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .listingBoost
              ),

            premiumGallery:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .premiumGallery
              ),

            verifiedOwnership:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .verifiedOwnership
              ),

            premiumListingTemplate:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .premiumListingTemplate
              ),

            homepageExposure:
              getNamedCapability(
                NAMED_CAPABILITY_SLUGS
                  .homepageExposure
              )
          },

          capabilitiesBySlug
        }
      }


      return {

        resolvedAt:
          now.toISOString(),

        requestedListingIds:
          uniqueListingIds,

        customerOwnedListingIds,

        externalListingIds,

        byListingId
      }
    }

export type ResolvedListingEntitlementsBatch = {
    resolvedAt:
      string

    requestedListingIds:
      string[]

    customerOwnedListingIds:
      string[]

    externalListingIds:
      string[]

    byListingId:
      Record<
        string,
        ResolvedListingEntitlements
      >
  }

type DatabaseListing = {
  id: string
  owner_id: string | null
}

type DatabaseAddOnProduct = {
  id: string
  slug: string

  name_en: string
  name_es: string

  product_type:
    AddOnProductType

  target_type:
    AddOnTargetType
}

function resolveEntitlementProduct(
    product:
      DatabaseListingEntitlement['product']
  ): DatabaseAddOnProduct | null {

    if (
      Array.isArray(
        product
      )
    ) {
      return (
        product[0] ??
        null
      )
    }

    return (
      product ??
      null
    )
  }

type DatabaseListingEntitlement = {
  id: string

  listing_id: string
  product_id: string
  owner_id: string

  status:
    ListingEntitlementStatus

  source_type:
    ListingEntitlementSourceType

  starts_at: string | null
  expires_at: string | null

  purchase_request_id:
    string | null

  assigned_by:
    string | null

  revoked_at:
    string | null

  revoked_by:
    string | null

  revocation_reason:
    string | null

  created_at: string
  updated_at: string

  product:
  | DatabaseAddOnProduct
  | DatabaseAddOnProduct[]
  | null
}

export class ListingEntitlementsError
  extends Error {
  code:
    | 'LISTING_ID_REQUIRED'
    | 'LISTING_NOT_FOUND'
    | 'LISTING_OWNER_NOT_FOUND'
    | 'LISTING_OWNER_MISMATCH'
    | 'LISTING_ENTITLEMENTS_LOAD_FAILED'
    | 'INVALID_ENTITLEMENT_PRODUCT'

  constructor(
    code:
      ListingEntitlementsError['code'],
    message: string
  ) {
    super(message)

    this.name =
      'ListingEntitlementsError'

    this.code =
      code
  }
}

const NAMED_CAPABILITY_SLUGS = {
  featuredListing:
    'featured-listing',

  listingBoost:
    'listing-boost',

  premiumGallery:
    'premium-gallery',

  verifiedOwnership:
    'verified-ownership',

  premiumListingTemplate:
    'premium-listing-template',

  homepageExposure:
    'homepage-exposure'
} as const satisfies
  Record<
    string,
    ListingCapabilitySlug
  >

function parseTimestamp(
  value: string | null
): number | null {
  if (!value) {
    return null
  }

  const timestamp =
    new Date(
      value
    ).getTime()

  return Number.isFinite(
    timestamp
  )
    ? timestamp
    : null
}

function calculateEntitlementState({
  status,
  startsAt,
  expiresAt,
  now
}: {
  status:
    ListingEntitlementStatus

  startsAt:
    string | null

  expiresAt:
    string | null

  now:
    number
}) {
  const startTime =
    parseTimestamp(
      startsAt
    )

  const expirationTime =
    parseTimestamp(
      expiresAt
    )

  const startHasArrived =
    startTime === null ||
    startTime <= now

  const expirationHasPassed =
    expirationTime !== null &&
    expirationTime <= now

  const isRevoked =
    status === 'revoked'

  const isCancelled =
    status === 'cancelled'

  const isPending =
    status === 'pending'

  const isScheduled =
    status === 'scheduled' &&
    !isRevoked &&
    !isCancelled &&
    !expirationHasPassed &&
    !startHasArrived

  /*
   * The canonical active-state decision.
   *
   * A row only grants access when:
   * - its stored status is active,
   * - its start time has arrived,
   * - its expiration has not passed,
   * - and it has not been revoked or cancelled.
   */
  const isCurrentlyActive =
    status === 'active' &&
    startHasArrived &&
    !expirationHasPassed &&
    !isRevoked &&
    !isCancelled

  const isExpired =
    status === 'expired' ||
    expirationHasPassed

  return {
    isPending,
    isScheduled,
    isCurrentlyActive,
    isExpired,
    isRevoked,
    isCancelled
  }
}

function createCapability({
  slug,
  entitlements
}: {
  slug: string
  entitlements:
    ListingEntitlementRecord[]
}): ResolvedListingCapability {
  const matchingEntitlements =
    entitlements.filter(
      entitlement =>
        entitlement.productSlug ===
        slug
    )

  const activeEntitlements =
    matchingEntitlements.filter(
      entitlement =>
        entitlement.isCurrentlyActive
    )

  const scheduledEntitlements =
    matchingEntitlements.filter(
      entitlement =>
        entitlement.isScheduled
    )

  const historicalEntitlements =
    matchingEntitlements.filter(
      entitlement =>
        !entitlement.isCurrentlyActive &&
        !entitlement.isScheduled
    )

  return {
    slug:
      slug as ListingCapabilitySlug,

    hasAccess:
      activeEntitlements.length > 0,

    activeEntitlements,

    scheduledEntitlements,

    historicalEntitlements,

    activeQuantity:
      activeEntitlements.length
  }
}

export async function resolveListingEntitlements({
  supabase,
  listingId,
  ownerId,
  includeInactive = true,
  now = new Date()
}: {
  supabase: SupabaseClient

  listingId: string

  /*
   * Optional ownership assertion.
   * Server routes should provide this when resolving
   * entitlements for an authenticated listing owner.
   */
  ownerId?: string

  /*
   * true:
   * Return pending, scheduled, expired, revoked,
   * cancelled, and active records.
   *
   * false:
   * Return only currently active records.
   */
  includeInactive?: boolean

  /*
   * Injectable for deterministic testing.
   */
  now?: Date
}): Promise<ResolvedListingEntitlements> {
  if (!listingId) {
    throw new ListingEntitlementsError(
      'LISTING_ID_REQUIRED',
      'A listing ID is required to resolve listing entitlements.'
    )
  }

  const {
    data: listingData,
    error: listingError
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        owner_id
      `)
      .eq(
        'id',
        listingId
      )
      .maybeSingle()

  if (listingError) {
    throw new ListingEntitlementsError(
      'LISTING_NOT_FOUND',
      listingError.message
    )
  }

  if (!listingData) {
    throw new ListingEntitlementsError(
      'LISTING_NOT_FOUND',
      'The selected listing does not exist.'
    )
  }

  const listing =
    listingData as DatabaseListing

  if (!listing.owner_id) {
    throw new ListingEntitlementsError(
      'LISTING_OWNER_NOT_FOUND',
      'The selected listing does not have a customer owner.'
    )
  }

  if (
    ownerId &&
    ownerId !== listing.owner_id
  ) {
    throw new ListingEntitlementsError(
      'LISTING_OWNER_MISMATCH',
      'The authenticated user does not own this listing.'
    )
  }

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listing_entitlements'
      )
      .select(`
        id,
        listing_id,
        product_id,
        owner_id,
        status,
        source_type,
        starts_at,
        expires_at,
        purchase_request_id,
        assigned_by,
        revoked_at,
        revoked_by,
        revocation_reason,
        created_at,
        updated_at,

        product:add_on_products (
          id,
          slug,
          name_en,
          name_es,
          product_type,
          target_type
        )
      `)
      .eq(
        'listing_id',
        listingId
      )
      .eq(
        'owner_id',
        listing.owner_id
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (error) {
      throw new ListingEntitlementsError(
        'LISTING_ENTITLEMENTS_LOAD_FAILED',
        error.message
      )
    }

    const nowTimestamp =
      now.getTime()

  const resolvedRecords =
    (
      data ?? []
    )
      .map(row => {
        const entitlement =
          row as
            DatabaseListingEntitlement

        const product =
          resolveEntitlementProduct(
            entitlement.product
          )

        if (
          !product ||
          product.target_type !==
            'listing'
        ) {
          throw new ListingEntitlementsError(
            'INVALID_ENTITLEMENT_PRODUCT',
            `Entitlement ${entitlement.id} does not reference a valid listing-targeted product.`
          )
        }

        const state =
          calculateEntitlementState({
            status:
              entitlement.status,

            startsAt:
              entitlement.starts_at,

            expiresAt:
              entitlement.expires_at,

            now:
              nowTimestamp
          })

        return {
          entitlementId:
            entitlement.id,

          listingId:
            entitlement.listing_id,

          ownerId:
            entitlement.owner_id,

          productId:
            product.id,

          productSlug:
            product.slug,

          productNameEn:
            product.name_en,

          productNameEs:
            product.name_es,

          productType:
            product.product_type,

          targetType:
            product.target_type,

          status:
            entitlement.status,

          sourceType:
            entitlement.source_type,

          startsAt:
            entitlement.starts_at,

          expiresAt:
            entitlement.expires_at,

          purchaseRequestId:
            entitlement
              .purchase_request_id,

          assignedBy:
            entitlement.assigned_by,

          revokedAt:
            entitlement.revoked_at,

          revokedBy:
            entitlement.revoked_by,

          revocationReason:
            entitlement
              .revocation_reason,

          createdAt:
            entitlement.created_at,

          updatedAt:
            entitlement.updated_at,

          ...state
        } satisfies
          ListingEntitlementRecord
      })

  const returnedEntitlements =
    includeInactive
      ? resolvedRecords
      : resolvedRecords.filter(
          entitlement =>
            entitlement.isCurrentlyActive
        )

  const activeEntitlements =
    resolvedRecords.filter(
      entitlement =>
        entitlement.isCurrentlyActive
    )

  const scheduledEntitlements =
    resolvedRecords.filter(
      entitlement =>
        entitlement.isScheduled
    )

  const historicalEntitlements =
    resolvedRecords.filter(
      entitlement =>
        !entitlement.isCurrentlyActive &&
        !entitlement.isScheduled
    )

  const capabilitiesBySlug =
    resolvedRecords.reduce<
      Record<
        string,
        ResolvedListingCapability
      >
    >(
      (
        capabilities,
        entitlement
      ) => {
        const slug =
          entitlement.productSlug

        if (!capabilities[slug]) {
          capabilities[slug] =
            createCapability({
              slug,
              entitlements:
                resolvedRecords
            })
        }

        return capabilities
      },
      {}
    )

  const getNamedCapability = (
    slug:
      ListingCapabilitySlug
  ): ResolvedListingCapability => {
    return (
      capabilitiesBySlug[slug] ??
      createCapability({
        slug,
        entitlements:
          resolvedRecords
      })
    )
  }

  return {
    listingId,

    ownerId:
      listing.owner_id,

    resolvedAt:
      now.toISOString(),

    entitlements:
      returnedEntitlements,

    activeEntitlements,

    scheduledEntitlements,

    historicalEntitlements,

    capabilities: {
      featuredListing:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .featuredListing
        ),

      listingBoost:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .listingBoost
        ),

      premiumGallery:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .premiumGallery
        ),

      verifiedOwnership:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .verifiedOwnership
        ),

      premiumListingTemplate:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .premiumListingTemplate
        ),

      homepageExposure:
        getNamedCapability(
          NAMED_CAPABILITY_SLUGS
            .homepageExposure
        )
    },

    capabilitiesBySlug
  }
}