import type {
  SupabaseClient
} from '@supabase/supabase-js'

import type {
  CanonicalPromotionIntelligence,
  PromotionIntelligenceMetric
} from '@/lib/promotion-intelligence-engine'


/*
 * ---------------------------------------------------------
 * PROMOTION INTELLIGENCE EVIDENCE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Persist one canonical, qualified Promotion Intelligence
 * observation for one completed promotion entitlement.
 *
 * This is the durable analytical fact consumed later by
 * Aggregate Promotion Intelligence.
 *
 * Rules:
 *
 * • completed promotions only
 * • market comparison must be available
 * • interpretation must be available
 * • structural cohort must be sufficient
 * • behavioral evidence must be sufficient
 * • one immutable observation per entitlement
 *
 * This module does NOT aggregate promotion evidence.
 */


export type PromotionIntelligenceEvidenceRecord = {
  id:
    string

  listingId:
    string

  entitlementId:
    string

  productId:
    string

  promotionSlug:
    string

  observedAt:
    string
}


export type PromotionIntelligenceEvidenceResult =
  | {
      status:
        'persisted'

      evidence:
        PromotionIntelligenceEvidenceRecord
    }

  | {
      status:
        'already_persisted'

      evidence:
        PromotionIntelligenceEvidenceRecord
    }

  | {
      status:
        'not_qualified'

      reason:
        PromotionIntelligenceEvidenceQualificationReason
    }


export type PromotionIntelligenceEvidenceQualificationReason =
  | 'promotion_still_active'
  | 'promotion_end_missing'
  | 'market_comparison_unavailable'
  | 'interpretation_unavailable'
  | 'structural_cohort_insufficient'
  | 'behavioral_evidence_insufficient'


type DatabaseListingSnapshot = {
  id:
    string

  created_at:
    string | null

  published_at:
    string | null

  property_type:
    string | null

  province:
    string | null

  canton:
    string | null

  district:
    string | null

  transaction_type:
    string

  price_millions:
    number | null

  monthly_price:
    number | null

  bedrooms:
    string | null

  bathrooms:
    string | null

  property_area:
    string | null

  construction_area:
    string | null
}


type DatabaseEntitlementSnapshot = {
  id:
    string

  listing_id:
    string

  product_id:
    string
}


type DatabaseEvidenceRecord = {
  id:
    string

  listing_id:
    string

  entitlement_id:
    string

  product_id:
    string

  promotion_slug:
    string

  observed_at:
    string
}


function qualifyPromotionIntelligence(
  intelligence:
    CanonicalPromotionIntelligence
):
  PromotionIntelligenceEvidenceQualificationReason |
  null {

  if (
    intelligence.performance
      .promotionStillActive
  ) {

    return 'promotion_still_active'
  }


  if (
    !intelligence.performance
      .promotionEndedAt
  ) {

    return 'promotion_end_missing'
  }


  if (
    !intelligence
      .marketComparisonAvailable
  ) {

    return 'market_comparison_unavailable'
  }


  if (
    !intelligence
      .interpretation
      .available
  ) {

    return 'interpretation_unavailable'
  }


  if (
    !intelligence
      .interpretation
      .structuralCohortSufficient
  ) {

    return 'structural_cohort_insufficient'
  }


  if (
    !intelligence
      .interpretation
      .behavioralEvidenceSufficient
  ) {

    return 'behavioral_evidence_insufficient'
  }


  return null
}


function mapMetric(
  metric:
    PromotionIntelligenceMetric
) {

  return {
    listingBefore:
      metric.listing
        .baseline,

    listingDuring:
      metric.listing
        .comparison,

    listingChangePct:
      metric.listing
        .percentageChange,

    cohortBeforeAvg:
      metric.cohort
        .baseline
        .averageObservedEventsPerListing,

    cohortDuringAvg:
      metric.cohort
        .comparison
        .averageObservedEventsPerListing,

    cohortChangePct:
      metric.cohort
        .percentageChange,

    variancePoints:
      metric
        .observedVariancePercentagePoints,

    evidenceStatus:
      metric
        .evidenceStatus
  }
}


function normalizeEvidenceRecord(
  record:
    DatabaseEvidenceRecord
): PromotionIntelligenceEvidenceRecord {

  return {
    id:
      record.id,

    listingId:
      record.listing_id,

    entitlementId:
      record.entitlement_id,

    productId:
      record.product_id,

    promotionSlug:
      record.promotion_slug,

    observedAt:
      record.observed_at
  }
}


async function loadExistingEvidence({
  supabase,
  entitlementId
}: {
  supabase:
    SupabaseClient

  entitlementId:
    string
}): Promise<
  PromotionIntelligenceEvidenceRecord |
  null
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'promotion_intelligence_evidence'
      )
      .select(`
        id,
        listing_id,
        entitlement_id,
        product_id,
        promotion_slug,
        observed_at
      `)
      .eq(
        'entitlement_id',
        entitlementId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'EVIDENCE_LOOKUP_FAILED',
      error.message
    )
  }


  if (
    !data
  ) {

    return null
  }


  return normalizeEvidenceRecord(
    data as DatabaseEvidenceRecord
  )
}


async function loadListingSnapshot({
  supabase,
  listingId
}: {
  supabase:
    SupabaseClient

  listingId:
    string
}): Promise<
  DatabaseListingSnapshot
> {

  const {
    data,
    error
  } =
    await supabase
      .from(
        'listings'
      )
      .select(`
        id,
        created_at,
        published_at,
        property_type,
        province,
        canton,
        district,
        transaction_type,
        price_millions,
        monthly_price,
        bedrooms,
        bathrooms,
        property_area,
        construction_area
      `)
      .eq(
        'id',
        listingId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'LISTING_SNAPSHOT_LOAD_FAILED',
      error.message
    )
  }


  if (
    !data
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'LISTING_NOT_FOUND',
      `Listing ${listingId} could not be loaded for Promotion Intelligence evidence.`
    )
  }


  return data as
    DatabaseListingSnapshot
}


async function loadEntitlementSnapshot({
  supabase,
  entitlementId,
  listingId
}: {
  supabase:
    SupabaseClient

  entitlementId:
    string

  listingId:
    string
}): Promise<
  DatabaseEntitlementSnapshot
> {

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
        product_id
      `)
      .eq(
        'id',
        entitlementId
      )
      .maybeSingle()


  if (
    error
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'ENTITLEMENT_LOAD_FAILED',
      error.message
    )
  }


  if (
    !data
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'ENTITLEMENT_NOT_FOUND',
      `Promotion entitlement ${entitlementId} could not be loaded.`
    )
  }


  const entitlement =
    data as
      DatabaseEntitlementSnapshot


  if (
    entitlement.listing_id !==
      listingId
  ) {

    throw new PromotionIntelligenceEvidenceError(
      'ENTITLEMENT_LISTING_MISMATCH',
      'Promotion Intelligence listing does not match the entitlement listing.'
    )
  }


  return entitlement
}


export class PromotionIntelligenceEvidenceError
  extends Error {

  code:
    | 'EVIDENCE_LOOKUP_FAILED'
    | 'LISTING_SNAPSHOT_LOAD_FAILED'
    | 'LISTING_NOT_FOUND'
    | 'ENTITLEMENT_LOAD_FAILED'
    | 'ENTITLEMENT_NOT_FOUND'
    | 'ENTITLEMENT_LISTING_MISMATCH'
    | 'EVIDENCE_INSERT_FAILED'

  constructor(
    code:
      PromotionIntelligenceEvidenceError['code'],

    message:
      string
  ) {

    super(
      message
    )


    this.name =
      'PromotionIntelligenceEvidenceError'


    this.code =
      code
  }
}


export async function persistPromotionIntelligenceEvidence({
  supabase,
  intelligence
}: {
  supabase:
    SupabaseClient

  intelligence:
    CanonicalPromotionIntelligence
}): Promise<
  PromotionIntelligenceEvidenceResult
> {

  /*
   * -------------------------------------------------------
   * 1. QUALIFY CANONICAL INTELLIGENCE
   * -------------------------------------------------------
   */


  const qualificationFailure =
    qualifyPromotionIntelligence(
      intelligence
    )


  if (
    qualificationFailure
  ) {

    return {
      status:
        'not_qualified',

      reason:
        qualificationFailure
    }
  }


  /*
   * -------------------------------------------------------
   * 2. IDEMPOTENCY
   * -------------------------------------------------------
   *
   * One completed promotion entitlement may contribute
   * exactly one canonical aggregate evidence observation.
   *
   * Existing evidence is returned, never rewritten.
   */


  const existing =
    await loadExistingEvidence({
      supabase,

      entitlementId:
        intelligence
          .entitlementId
    })


  if (
    existing
  ) {

    return {
      status:
        'already_persisted',

      evidence:
        existing
    }
  }


  /*
   * -------------------------------------------------------
   * 3. SNAPSHOT LISTING + ENTITLEMENT CONTEXT
   * -------------------------------------------------------
   */


  const [
    listing,
    entitlement
  ] =
    await Promise.all([
      loadListingSnapshot({
        supabase,

        listingId:
          intelligence
            .listingId
      }),

      loadEntitlementSnapshot({
        supabase,

        entitlementId:
          intelligence
            .entitlementId,

        listingId:
          intelligence
            .listingId
      })
    ])


  /*
   * -------------------------------------------------------
   * 4. MAP CANONICAL METRIC EVIDENCE
   * -------------------------------------------------------
   */


  const views =
    mapMetric(
      intelligence
        .beforeToDuring
        .views
    )


  const saves =
    mapMetric(
      intelligence
        .beforeToDuring
        .saves
    )


  const shares =
    mapMetric(
      intelligence
        .beforeToDuring
        .shares
    )


  const whatsapp =
    mapMetric(
      intelligence
        .beforeToDuring
        .whatsappClicks
    )


  const email =
    mapMetric(
      intelligence
        .beforeToDuring
        .emailInquiries
    )


  const buyerActions =
    mapMetric(
      intelligence
        .beforeToDuring
        .buyerActions
    )


  const promotionEndedAt =
    intelligence
      .performance
      .promotionEndedAt


  /*
   * qualification above already guarantees this.
   *
   * The guard remains here so TypeScript and runtime
   * invariants agree.
   */


  if (
    !promotionEndedAt
  ) {

    return {
      status:
        'not_qualified',

      reason:
        'promotion_end_missing'
    }
  }


  /*
   * -------------------------------------------------------
   * 5. PERSIST CANONICAL OBSERVATION
   * -------------------------------------------------------
   */


  const {
    data,
    error
  } =
    await supabase
      .from(
        'promotion_intelligence_evidence'
      )
      .insert({

        /*
         * Lineage
         */

        listing_id:
          intelligence
            .listingId,

        entitlement_id:
          intelligence
            .entitlementId,

        product_id:
          entitlement
            .product_id,

        promotion_slug:
          intelligence
            .promotionSlug,


        /*
         * Listing market snapshot
         */

        property_type:
          listing
            .property_type,

        province:
          listing
            .province,

        canton:
          listing
            .canton,

        district:
          listing
            .district,

        transaction_type:
          listing
            .transaction_type,

        price_millions:
          listing
            .price_millions,

        monthly_price:
          listing
            .monthly_price,

        bedrooms:
          listing
            .bedrooms,

        bathrooms:
          listing
            .bathrooms,

        property_area:
          listing
            .property_area,

        construction_area:
          listing
            .construction_area,

        listing_created_at:
          listing
            .created_at,

        listing_published_at:
          listing
            .published_at,


        /*
         * Promotion window snapshot
         */

        promotion_started_at:
          intelligence
            .performance
            .promotionStartedAt,

        promotion_ended_at:
          promotionEndedAt,

        promotion_duration_hours:
          intelligence
            .performance
            .activeDurationHours,


        /*
         * Comparable cohort snapshot
         */

        cohort_quality:
          intelligence
            .cohort
            .quality,

        cohort_selected_count:
          intelligence
            .cohort
            .selectedCount,

        cohort_eligible_count:
          intelligence
            .cohort
            .eligibleCount,


        /*
         * Views
         */

        views_listing_before:
          views
            .listingBefore,

        views_listing_during:
          views
            .listingDuring,

        views_listing_change_pct:
          views
            .listingChangePct,

        views_cohort_before_avg:
          views
            .cohortBeforeAvg,

        views_cohort_during_avg:
          views
            .cohortDuringAvg,

        views_cohort_change_pct:
          views
            .cohortChangePct,

        views_variance_points:
          views
            .variancePoints,

        views_evidence_status:
          views
            .evidenceStatus,


        /*
         * Saves
         */

        saves_listing_before:
          saves
            .listingBefore,

        saves_listing_during:
          saves
            .listingDuring,

        saves_listing_change_pct:
          saves
            .listingChangePct,

        saves_cohort_before_avg:
          saves
            .cohortBeforeAvg,

        saves_cohort_during_avg:
          saves
            .cohortDuringAvg,

        saves_cohort_change_pct:
          saves
            .cohortChangePct,

        saves_variance_points:
          saves
            .variancePoints,

        saves_evidence_status:
          saves
            .evidenceStatus,


        /*
         * Shares
         */

        shares_listing_before:
          shares
            .listingBefore,

        shares_listing_during:
          shares
            .listingDuring,

        shares_listing_change_pct:
          shares
            .listingChangePct,

        shares_cohort_before_avg:
          shares
            .cohortBeforeAvg,

        shares_cohort_during_avg:
          shares
            .cohortDuringAvg,

        shares_cohort_change_pct:
          shares
            .cohortChangePct,

        shares_variance_points:
          shares
            .variancePoints,

        shares_evidence_status:
          shares
            .evidenceStatus,


        /*
         * WhatsApp
         */

        whatsapp_listing_before:
          whatsapp
            .listingBefore,

        whatsapp_listing_during:
          whatsapp
            .listingDuring,

        whatsapp_listing_change_pct:
          whatsapp
            .listingChangePct,

        whatsapp_cohort_before_avg:
          whatsapp
            .cohortBeforeAvg,

        whatsapp_cohort_during_avg:
          whatsapp
            .cohortDuringAvg,

        whatsapp_cohort_change_pct:
          whatsapp
            .cohortChangePct,

        whatsapp_variance_points:
          whatsapp
            .variancePoints,

        whatsapp_evidence_status:
          whatsapp
            .evidenceStatus,


        /*
         * Email inquiries
         */

        email_listing_before:
          email
            .listingBefore,

        email_listing_during:
          email
            .listingDuring,

        email_listing_change_pct:
          email
            .listingChangePct,

        email_cohort_before_avg:
          email
            .cohortBeforeAvg,

        email_cohort_during_avg:
          email
            .cohortDuringAvg,

        email_cohort_change_pct:
          email
            .cohortChangePct,

        email_variance_points:
          email
            .variancePoints,

        email_evidence_status:
          email
            .evidenceStatus,


        /*
         * Buyer actions
         */

        buyer_actions_listing_before:
          buyerActions
            .listingBefore,

        buyer_actions_listing_during:
          buyerActions
            .listingDuring,

        buyer_actions_listing_change_pct:
          buyerActions
            .listingChangePct,

        buyer_actions_cohort_before_avg:
          buyerActions
            .cohortBeforeAvg,

        buyer_actions_cohort_during_avg:
          buyerActions
            .cohortDuringAvg,

        buyer_actions_cohort_change_pct:
          buyerActions
            .cohortChangePct,

        buyer_actions_variance_points:
          buyerActions
            .variancePoints,

        buyer_actions_evidence_status:
          buyerActions
            .evidenceStatus,


        /*
         * Global evidence state
         */

        market_comparison_status:
          intelligence
            .marketComparisonStatus,

        interpretation_available:
          intelligence
            .interpretation
            .available,

        structural_cohort_sufficient:
          intelligence
            .interpretation
            .structuralCohortSufficient,

        behavioral_evidence_sufficient:
          intelligence
            .interpretation
            .behavioralEvidenceSufficient,


        /*
         * Complete canonical evidence
         */

        evidence:
          intelligence,


        /*
         * Observation timestamp
         */

        observed_at:
          intelligence
            .resolvedAt
      })
      .select(`
        id,
        listing_id,
        entitlement_id,
        product_id,
        promotion_slug,
        observed_at
      `)
      .single()


  if (
    error ||
    !data
  ) {

    /*
     * Another writer may have persisted the same canonical
     * entitlement after our initial lookup but before this
     * insert.
     *
     * Re-read before declaring failure.
     */


    const concurrentExisting =
      await loadExistingEvidence({
        supabase,

        entitlementId:
          intelligence
            .entitlementId
      })


    if (
      concurrentExisting
    ) {

      return {
        status:
          'already_persisted',

        evidence:
          concurrentExisting
      }
    }


    throw new PromotionIntelligenceEvidenceError(
      'EVIDENCE_INSERT_FAILED',

      error?.message ??
      'Promotion Intelligence evidence could not be persisted.'
    )
  }


  return {
    status:
      'persisted',

    evidence:
      normalizeEvidenceRecord(
        data as DatabaseEvidenceRecord
      )
  }
}