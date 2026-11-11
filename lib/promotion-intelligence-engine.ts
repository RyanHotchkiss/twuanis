import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getPromotionPerformance,
  type CanonicalPromotionPerformance,
  type PromotionPerformanceMetricKey
} from '@/lib/promotion-performance-engine'

import {
  resolveComparableCohort,
  type ComparableCohortQuality
} from '@/lib/comparable-cohort-engine'

import type {
  PromotionProductSlug
} from '@/lib/promotion-catalog'


/*
 * ---------------------------------------------------------
 * PROMOTION INTELLIGENCE ENGINE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Compare observed behavior for a promoted listing against
 * observed behavior from its canonical comparable cohort
 * over the exact same time windows.
 *
 * This engine reports observed market variance.
 *
 * It does NOT claim that promotion caused the variance.
 */


export type PromotionIntelligenceMetricKey =
  | 'views'
  | 'saves'
  | 'shares'
  | 'whatsappClicks'
  | 'emailInquiries'
  | 'buyerActions'


export type PromotionIntelligenceEvidenceStatus =
  | 'sufficient'
  | 'insufficient_structural_cohort'
  | 'insufficient_cohort_behavior'
  | 'insufficient_duration'
  | 'baseline_zero'
  | 'listing_percentage_unavailable'
  | 'post_period_unavailable'


export type CohortMetricPeriodEvidence = {
  totalObservedEvents:
    number

  averageObservedEventsPerListing:
    number

  listingsWithObservedEvents:
    number

  cohortSize:
    number
}


export type CohortMetricChange = {
  baseline:
    CohortMetricPeriodEvidence

  comparison:
    CohortMetricPeriodEvidence

  absoluteAverageChange:
    number

  percentageChange:
    number | null

  evidenceStatus:
    PromotionIntelligenceEvidenceStatus
}


export type PromotionIntelligenceMetric = {
  metric:
    PromotionIntelligenceMetricKey

  listing: {
    baseline:
      number | null

    comparison:
      number | null

    absoluteChange:
      number | null

    percentageChange:
      number | null
  }

  cohort:
    CohortMetricChange

  observedVariancePercentagePoints:
    number | null

  evidenceStatus:
    PromotionIntelligenceEvidenceStatus
}


export type PromotionIntelligencePeriodComparison = {
  views:
    PromotionIntelligenceMetric

  saves:
    PromotionIntelligenceMetric

  shares:
    PromotionIntelligenceMetric

  whatsappClicks:
    PromotionIntelligenceMetric

  emailInquiries:
    PromotionIntelligenceMetric

  buyerActions:
    PromotionIntelligenceMetric
}


export type CanonicalPromotionIntelligence = {
  listingId:
    string

  entitlementId:
    string

  promotionSlug:
    PromotionProductSlug

  resolvedAt:
    string

  marketComparisonAvailable:
    boolean

  marketComparisonStatus:
    PromotionIntelligenceEvidenceStatus

  cohort: {
    quality:
      ComparableCohortQuality

    selectedCount:
      number

    eligibleCount:
      number

    listingIds:
      string[]
  }

  beforeToDuring:
    PromotionIntelligencePeriodComparison

  duringToAfter:
    PromotionIntelligencePeriodComparison | null

  performance:
    CanonicalPromotionPerformance

  interpretation: {
    available:
      boolean

    structuralCohortSufficient:
      boolean

    behavioralEvidenceSufficient:
      boolean
  }

  notes:
    string[]
}


export type InsufficientPromotionIntelligence = {
  listingId:
    string

  entitlementId:
    string

  resolvedAt:
    string

  status:
    'insufficient_evidence'

  reason:
    string
}


export type PromotionIntelligenceResult =
  | CanonicalPromotionIntelligence
  | InsufficientPromotionIntelligence


type DatabaseActivityEvent = {
  entity_id:
    string | null

  event_type:
    string

  created_at:
    string
}


type ActivityPeriod =
  | 'before'
  | 'during'
  | 'after'


type CohortPeriodEvents = {
  before:
    DatabaseActivityEvent[]

  during:
    DatabaseActivityEvent[]

  after:
    DatabaseActivityEvent[]
}


/*
 * ---------------------------------------------------------
 * EVIDENCE POLICY
 * ---------------------------------------------------------
 *
 * Structural cohort:
 *   minimum 5 selected listings
 *
 * Behavioral evidence:
 *   minimum 3 distinct cohort listings with observed
 *   events for the metric in BOTH comparison periods.
 *
 * Promotion Performance already owns:
 *   - 24-hour duration threshold
 *   - baseline-zero protection
 *   - equal-duration listing comparison
 */


const MINIMUM_STRUCTURAL_COHORT_SIZE =
  5


const MINIMUM_BEHAVIORAL_LISTINGS =
  3


const PERFORMANCE_EVENT_TYPES = [
  'listing_viewed',
  'listing_saved',
  'listing_shared',
  'listing_whatsapp_clicked',
  'listing_email_inquiry'
] as const


function round(
  value:
    number,
  decimals =
    2
): number {

  return Number(
    value.toFixed(
      decimals
    )
  )
}


function timestamp(
  value:
    string
): number {

  const result =
    new Date(
      value
    ).getTime()


  if (
    !Number.isFinite(
      result
    )
  ) {

    throw new PromotionIntelligenceError(
      'INVALID_PERFORMANCE_WINDOW',
      `Invalid performance timestamp: ${value}`
    )
  }


  return result
}


function metricEventTypes(
  metric:
    PromotionIntelligenceMetricKey
): string[] {

  switch (
    metric
  ) {

    case 'views':
      return [
        'listing_viewed'
      ]


    case 'saves':
      return [
        'listing_saved'
      ]


    case 'shares':
      return [
        'listing_shared'
      ]


    case 'whatsappClicks':
      return [
        'listing_whatsapp_clicked'
      ]


    case 'emailInquiries':
      return [
        'listing_email_inquiry'
      ]


    case 'buyerActions':
      return [
        'listing_whatsapp_clicked',
        'listing_email_inquiry'
      ]
  }
}


function filterRange({
  events,
  startsAt,
  endsAt
}: {
  events:
    DatabaseActivityEvent[]

  startsAt:
    number

  endsAt:
    number
}) {

  return events.filter(
    event => {

      const eventTime =
        timestamp(
          event.created_at
        )


      return (
        eventTime >=
          startsAt &&
        eventTime <
          endsAt
      )
    }
  )
}


function filterActiveIntervals({
  events,
  performance
}: {
  events:
    DatabaseActivityEvent[]

  performance:
    CanonicalPromotionPerformance
}) {

  return events.filter(
    event => {

      const eventTime =
        timestamp(
          event.created_at
        )


      return performance
        .activeIntervals
        .some(
          interval => {

            const startsAt =
              timestamp(
                interval.startsAt
              )


            const endsAt =
              timestamp(
                interval.endsAt
              )


            return (
              eventTime >=
                startsAt &&
              eventTime <
                endsAt
            )
          }
        )
    }
  )
}


function partitionCohortActivity({
  events,
  performance
}: {
  events:
    DatabaseActivityEvent[]

  performance:
    CanonicalPromotionPerformance
}): CohortPeriodEvents {

  if (
    !performance.before.startsAt ||
    !performance.before.endsAt
  ) {

    throw new PromotionIntelligenceError(
      'INVALID_PERFORMANCE_WINDOW',
      'Promotion Performance does not contain a valid baseline period.'
    )
  }


  const before =
    filterRange({
      events,

      startsAt:
        timestamp(
          performance.before.startsAt
        ),

      endsAt:
        timestamp(
          performance.before.endsAt
        )
    })


  const during =
    filterActiveIntervals({
      events,
      performance
    })


  let after:
    DatabaseActivityEvent[] =
      []


  if (
    performance.after.available &&
    performance.after.startsAt &&
    performance.after.endsAt
  ) {

    after =
      filterRange({
        events,

        startsAt:
          timestamp(
            performance.after.startsAt
          ),

        endsAt:
          timestamp(
            performance.after.endsAt
          )
      })
  }


  return {
    before,
    during,
    after
  }
}


function buildCohortPeriodEvidence({
  events,
  metric,
  cohortSize
}: {
  events:
    DatabaseActivityEvent[]

  metric:
    PromotionIntelligenceMetricKey

  cohortSize:
    number
}): CohortMetricPeriodEvidence {

  const allowedEventTypes =
    metricEventTypes(
      metric
    )


  const matchingEvents =
    events.filter(
      event =>
        allowedEventTypes.includes(
          event.event_type
        )
    )


  const listingIds =
    new Set(
      matchingEvents
        .map(
          event =>
            event.entity_id
        )
        .filter(
          (
            listingId
          ): listingId is string =>
            Boolean(
              listingId
            )
        )
    )


  const totalObservedEvents =
    matchingEvents.length


  const averageObservedEventsPerListing =
    cohortSize >
      0
      ? round(
          totalObservedEvents /
          cohortSize,
          4
        )
      : 0


  return {
    totalObservedEvents,

    averageObservedEventsPerListing,

    listingsWithObservedEvents:
      listingIds.size,

    cohortSize
  }
}


function calculateCohortChange({
  baseline,
  comparison
}: {
  baseline:
    CohortMetricPeriodEvidence

  comparison:
    CohortMetricPeriodEvidence
}): CohortMetricChange {

  const absoluteAverageChange =
    round(
      comparison
        .averageObservedEventsPerListing -
      baseline
        .averageObservedEventsPerListing,
      4
    )


  if (
    baseline
      .listingsWithObservedEvents <
      MINIMUM_BEHAVIORAL_LISTINGS ||
    comparison
      .listingsWithObservedEvents <
      MINIMUM_BEHAVIORAL_LISTINGS
  ) {

    return {
      baseline,

      comparison,

      absoluteAverageChange,

      percentageChange:
        null,

      evidenceStatus:
        'insufficient_cohort_behavior'
    }
  }


  if (
    baseline
      .averageObservedEventsPerListing ===
      0
  ) {

    return {
      baseline,

      comparison,

      absoluteAverageChange,

      percentageChange:
        null,

      evidenceStatus:
        'baseline_zero'
    }
  }


  const percentageChange =
    round(
      (
        absoluteAverageChange /
        baseline
          .averageObservedEventsPerListing
      ) *
      100
    )


  return {
    baseline,

    comparison,

    absoluteAverageChange,

    percentageChange,

    evidenceStatus:
      'sufficient'
  }
}


function getListingMetricChange({
  performance,
  metric,
  period
}: {
  performance:
    CanonicalPromotionPerformance

  metric:
    PromotionIntelligenceMetricKey

  period:
    'beforeToDuring'
    | 'duringToAfter'
}) {

  const comparison =
    period ===
      'beforeToDuring'
      ? performance
          .comparison
          .beforeToDuring
      : performance
          .comparison
          .duringToAfter


  if (
    !comparison
  ) {

    return null
  }


  return comparison[
    metric as PromotionPerformanceMetricKey
  ]
}


function buildMetricIntelligence({
  performance,
  metric,
  baselineEvents,
  comparisonEvents,
  cohortSize,
  period
}: {
  performance:
    CanonicalPromotionPerformance

  metric:
    PromotionIntelligenceMetricKey

  baselineEvents:
    DatabaseActivityEvent[]

  comparisonEvents:
    DatabaseActivityEvent[]

  cohortSize:
    number

  period:
    'beforeToDuring'
    | 'duringToAfter'
}): PromotionIntelligenceMetric {

  const listingChange =
    getListingMetricChange({
      performance,
      metric,
      period
    })


  const baseline =
    buildCohortPeriodEvidence({
      events:
        baselineEvents,

      metric,

      cohortSize
    })


  const comparison =
    buildCohortPeriodEvidence({
      events:
        comparisonEvents,

      metric,

      cohortSize
    })


  const cohortChange =
    calculateCohortChange({
      baseline,
      comparison
    })


  if (
    !listingChange
  ) {

    return {
      metric,

      listing: {
        baseline:
          null,

        comparison:
          null,

        absoluteChange:
          null,

        percentageChange:
          null
      },

      cohort:
        cohortChange,

      observedVariancePercentagePoints:
        null,

      evidenceStatus:
        'post_period_unavailable'
    }
  }


  if (
    listingChange
      .evidenceStatus ===
      'insufficient_duration'
  ) {

    return {
      metric,

      listing: {
        baseline:
          listingChange.baseline,

        comparison:
          listingChange.comparison,

        absoluteChange:
          listingChange.absoluteChange,

        percentageChange:
          listingChange.percentageChange
      },

      cohort:
        cohortChange,

      observedVariancePercentagePoints:
        null,

      evidenceStatus:
        'insufficient_duration'
    }
  }


  if (
    listingChange
      .percentageChange ===
      null
  ) {

    return {
      metric,

      listing: {
        baseline:
          listingChange.baseline,

        comparison:
          listingChange.comparison,

        absoluteChange:
          listingChange.absoluteChange,

        percentageChange:
          null
      },

      cohort:
        cohortChange,

      observedVariancePercentagePoints:
        null,

      evidenceStatus:
        listingChange
          .evidenceStatus ===
          'baseline_zero'
          ? 'baseline_zero'
          : 'listing_percentage_unavailable'
    }
  }


  if (
    cohortChange
      .evidenceStatus !==
      'sufficient' ||
    cohortChange
      .percentageChange ===
      null
  ) {

    return {
      metric,

      listing: {
        baseline:
          listingChange.baseline,

        comparison:
          listingChange.comparison,

        absoluteChange:
          listingChange.absoluteChange,

        percentageChange:
          listingChange.percentageChange
      },

      cohort:
        cohortChange,

      observedVariancePercentagePoints:
        null,

      evidenceStatus:
        cohortChange
          .evidenceStatus
    }
  }


  const observedVariancePercentagePoints =
    round(
      listingChange
        .percentageChange -
      cohortChange
        .percentageChange
    )


  return {
    metric,

    listing: {
      baseline:
        listingChange.baseline,

      comparison:
        listingChange.comparison,

      absoluteChange:
        listingChange.absoluteChange,

      percentageChange:
        listingChange.percentageChange
    },

    cohort:
      cohortChange,

    observedVariancePercentagePoints,

    evidenceStatus:
      'sufficient'
  }
}


function buildPeriodComparison({
  performance,
  baselineEvents,
  comparisonEvents,
  cohortSize,
  period
}: {
  performance:
    CanonicalPromotionPerformance

  baselineEvents:
    DatabaseActivityEvent[]

  comparisonEvents:
    DatabaseActivityEvent[]

  cohortSize:
    number

  period:
    'beforeToDuring'
    | 'duringToAfter'
}): PromotionIntelligencePeriodComparison {

  return {
    views:
      buildMetricIntelligence({
        performance,

        metric:
          'views',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      }),

    saves:
      buildMetricIntelligence({
        performance,

        metric:
          'saves',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      }),

    shares:
      buildMetricIntelligence({
        performance,

        metric:
          'shares',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      }),

    whatsappClicks:
      buildMetricIntelligence({
        performance,

        metric:
          'whatsappClicks',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      }),

    emailInquiries:
      buildMetricIntelligence({
        performance,

        metric:
          'emailInquiries',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      }),

    buyerActions:
      buildMetricIntelligence({
        performance,

        metric:
          'buyerActions',

        baselineEvents,

        comparisonEvents,

        cohortSize,

        period
      })
  }
}


function periodHasSufficientEvidence(
  comparison:
    PromotionIntelligencePeriodComparison
): boolean {

  const metrics = [
    comparison.views,
    comparison.saves,
    comparison.whatsappClicks,
    comparison.buyerActions
  ]


  return metrics.some(
    metric =>
      metric.evidenceStatus ===
        'sufficient'
  )
}


export class PromotionIntelligenceError
  extends Error {

  code:
    | 'LISTING_ID_REQUIRED'
    | 'ENTITLEMENT_ID_REQUIRED'
    | 'PROMOTION_PERFORMANCE_FAILED'
    | 'COHORT_RESOLUTION_FAILED'
    | 'ACTIVITY_LOAD_FAILED'
    | 'INVALID_PERFORMANCE_WINDOW'

  constructor(
    code:
      PromotionIntelligenceError['code'],

    message:
      string
  ) {

    super(
      message
    )


    this.name =
      'PromotionIntelligenceError'


    this.code =
      code
  }
}


export async function getPromotionIntelligence({
  supabase,
  listingId,
  entitlementId,
  cohortLimit = 25,
  now = new Date()
}: {
  supabase:
    SupabaseClient

  listingId:
    string

  entitlementId:
    string

  cohortLimit?:
    number

  now?:
    Date
}): Promise<
  PromotionIntelligenceResult
> {

  if (
    !listingId ||
    !listingId.trim()
  ) {

    throw new PromotionIntelligenceError(
      'LISTING_ID_REQUIRED',
      'A listing ID is required to resolve Promotion Intelligence.'
    )
  }


  if (
    !entitlementId ||
    !entitlementId.trim()
  ) {

    throw new PromotionIntelligenceError(
      'ENTITLEMENT_ID_REQUIRED',
      'A promotion entitlement ID is required to resolve Promotion Intelligence.'
    )
  }


  const resolvedAt =
    now.toISOString()


  /*
   * -------------------------------------------------------
   * 1. PROMOTED LISTING PERFORMANCE
   * -------------------------------------------------------
   */


  let performanceResult


  try {

    performanceResult =
      await getPromotionPerformance({
        supabase,
        listingId,
        entitlementId,
        now
      })

  } catch (
    error
  ) {

    throw new PromotionIntelligenceError(
      'PROMOTION_PERFORMANCE_FAILED',

      error instanceof Error
        ? error.message
        : 'Promotion Performance could not be resolved.'
    )
  }


  if (
    'status' in performanceResult
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        performanceResult.reason
    }
  }


  const performance =
    performanceResult


  /*
   * -------------------------------------------------------
   * 2. CANONICAL COMPARABLE COHORT
   * -------------------------------------------------------
   */


  let cohortResult


  try {

    cohortResult =
      await resolveComparableCohort({
        listingId,
        limit:
          cohortLimit
      })

  } catch (
    error
  ) {

    throw new PromotionIntelligenceError(
      'COHORT_RESOLUTION_FAILED',

      error instanceof Error
        ? error.message
        : 'Comparable cohort could not be resolved.'
    )
  }


  if (
    'status' in cohortResult
  ) {

    return {
      listingId,

      entitlementId,

      resolvedAt,

      status:
        'insufficient_evidence',

      reason:
        cohortResult.reason
    }
  }


  const cohort =
    cohortResult


  const cohortListingIds =
    cohort.listings.map(
      listing =>
        listing.id
    )


  /*
   * Structural comparability is not enough.
   *
   * Fewer than five peers means we preserve the cohort
   * itself but do not produce market-behavior conclusions.
   */


  const structuralCohortSufficient =
    cohort.selectedCount >=
      MINIMUM_STRUCTURAL_COHORT_SIZE


  /*
   * -------------------------------------------------------
   * 3. RESOLVE COMPLETE ANALYSIS RANGE
   * -------------------------------------------------------
   */


  if (
    !performance.before.startsAt
  ) {

    throw new PromotionIntelligenceError(
      'INVALID_PERFORMANCE_WINDOW',
      'Promotion Performance does not expose a baseline start.'
    )
  }


  const analysisStart =
    performance.before.startsAt


  const analysisEnd =
    performance.after.available &&
    performance.after.endsAt
      ? performance.after.endsAt
      : performance.during.endsAt


  if (
    !analysisEnd
  ) {

    throw new PromotionIntelligenceError(
      'INVALID_PERFORMANCE_WINDOW',
      'Promotion Performance does not expose an analysis end.'
    )
  }


  /*
   * -------------------------------------------------------
   * 4. LOAD COHORT ACTIVITY ONCE
   * -------------------------------------------------------
   */


  const {
    data:
      activityData,

    error:
      activityError
  } =
    await supabase
      .from(
        'activity_events'
      )
      .select(`
        entity_id,
        event_type,
        created_at
      `)
      .eq(
        'entity_type',
        'listing'
      )
      .in(
        'entity_id',
        cohortListingIds
      )
      .in(
        'event_type',
        PERFORMANCE_EVENT_TYPES
      )
      .gte(
        'created_at',
        analysisStart
      )
      .lt(
        'created_at',
        analysisEnd
      )
      .order(
        'created_at',
        {
          ascending:
            true
        }
      )


  if (
    activityError
  ) {

    throw new PromotionIntelligenceError(
      'ACTIVITY_LOAD_FAILED',
      activityError.message
    )
  }


  const cohortActivity =
    (
      activityData ??
      []
    ) as DatabaseActivityEvent[]


  /*
   * -------------------------------------------------------
   * 5. APPLY IDENTICAL PROMOTION WINDOWS TO COHORT
   * -------------------------------------------------------
   */


  const periods =
    partitionCohortActivity({
      events:
        cohortActivity,

      performance
    })


  /*
   * -------------------------------------------------------
   * 6. BEFORE → DURING MARKET-AWARE COMPARISON
   * -------------------------------------------------------
   */


  const beforeToDuring =
    buildPeriodComparison({
      performance,

      baselineEvents:
        periods.before,

      comparisonEvents:
        periods.during,

      cohortSize:
        cohort.selectedCount,

      period:
        'beforeToDuring'
    })


  /*
   * -------------------------------------------------------
   * 7. DURING → AFTER MARKET-AWARE COMPARISON
   * -------------------------------------------------------
   */


  const duringToAfter =
    performance.after.available &&
    performance.after.complete &&
    performance
      .comparison
      .duringToAfter
      ? buildPeriodComparison({
          performance,

          baselineEvents:
            periods.during,

          comparisonEvents:
            periods.after,

          cohortSize:
            cohort.selectedCount,

          period:
            'duringToAfter'
        })
      : null


  /*
   * -------------------------------------------------------
   * 8. EVIDENCE RESOLUTION
   * -------------------------------------------------------
   */


  const behavioralEvidenceSufficient =
    structuralCohortSufficient &&
    periodHasSufficientEvidence(
      beforeToDuring
    )


  const marketComparisonAvailable =
    structuralCohortSufficient &&
    behavioralEvidenceSufficient &&
    performance
      .interpretationAvailable


  let marketComparisonStatus:
    PromotionIntelligenceEvidenceStatus


  if (
    !structuralCohortSufficient
  ) {

    marketComparisonStatus =
      'insufficient_structural_cohort'

  } else if (
    !performance
      .interpretationAvailable
  ) {

    marketComparisonStatus =
      'insufficient_duration'

  } else if (
    !behavioralEvidenceSufficient
  ) {

    marketComparisonStatus =
      'insufficient_cohort_behavior'

  } else {

    marketComparisonStatus =
      'sufficient'
  }


  /*
   * -------------------------------------------------------
   * 9. CANONICAL INTELLIGENCE
   * -------------------------------------------------------
   */


  const notes: string[] = [
    'Promotion Intelligence compares the promoted listing with its canonical comparable cohort over identical time windows.',
    'Comparable cohort movement represents observed market behavior, not a causal control experiment.',
    'Observed variance is the promoted listing percentage change minus the comparable cohort percentage change.',
    'Observed variance must not be described as behavior caused by promotion.',
    'Market-aware interpretation requires at least five structurally comparable listings.',
    'Metric-level market comparison requires observed events from at least three distinct cohort listings in both comparison periods.',
    'Zero Activity Engine events mean no matching event was observed; they do not prove historical instrumentation coverage was complete.'
  ]


  if (
    !structuralCohortSufficient
  ) {

    notes.push(
      'The canonical comparable cohort is too small for market-aware Promotion Intelligence.'
    )
  }


  if (
    structuralCohortSufficient &&
    !behavioralEvidenceSufficient
  ) {

    notes.push(
      'A structurally usable cohort exists, but current Activity Engine evidence is too sparse for market-behavior conclusions.'
    )
  }


  if (
    !performance
      .interpretationAvailable
  ) {

    notes.push(
      'The promotion period does not yet satisfy the Promotion Performance duration requirement.'
    )
  }


  if (
    !duringToAfter
  ) {

    notes.push(
      'A complete market-aware post-promotion comparison period is not yet available.'
    )
  }


  return {
    listingId,

    entitlementId,

    promotionSlug:
      performance.promotionSlug,

    resolvedAt,

    marketComparisonAvailable,

    marketComparisonStatus,

    cohort: {
      quality:
        cohort.quality,

      selectedCount:
        cohort.selectedCount,

      eligibleCount:
        cohort.eligibleCount,

      listingIds:
        cohortListingIds
    },

    beforeToDuring,

    duringToAfter,

    performance,

    interpretation: {
      available:
        marketComparisonAvailable,

      structuralCohortSufficient,

      behavioralEvidenceSufficient
    },

    notes
  }
}