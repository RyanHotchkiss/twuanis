import type {
  SupabaseClient
} from '@supabase/supabase-js'


/*
 * ---------------------------------------------------------
 * AGGREGATE PROMOTION INTELLIGENCE ENGINE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Convert qualified individual Promotion Intelligence
 * evidence observations into privacy-safe marketplace
 * evidence suitable for commercial consumers.
 *
 * This engine reports observed historical behavior.
 *
 * It does NOT:
 *
 * • claim promotion causality
 * • predict individual listing performance
 * • expose individual evidence observations
 * • average unsupported observations
 * • publish statistically weak cohorts
 */


/*
 * ---------------------------------------------------------
 * PUBLICATION THRESHOLDS
 * ---------------------------------------------------------
 *
 * These thresholds govern whether aggregate evidence may
 * leave the intelligence layer.
 *
 * 0–4 observations:
 *   private / insufficient
 *
 * 5–9:
 *   limited
 *
 * 10–24:
 *   usable
 *
 * 25+:
 *   strong
 *
 * Public commercial evidence requires >= 10 qualifying
 * completed promotion observations.
 */


const MINIMUM_PUBLIC_OBSERVATIONS =
  10

const LIMITED_EVIDENCE_MINIMUM =
  5

const STRONG_EVIDENCE_MINIMUM =
  25


export type AggregatePromotionEvidenceQuality =
  | 'insufficient'
  | 'limited'
  | 'usable'
  | 'strong'


export type AggregatePromotionMetricName =
  | 'views'
  | 'saves'
  | 'shares'
  | 'whatsapp'
  | 'buyer_actions'


export type AggregatePromotionScope = {
  promotionSlug:
    string

  propertyType?:
    string | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  transactionType?:
    string | null
}


export type AggregatePromotionDistribution = {
  minimum:
    number

  percentile25:
    number

  median:
    number

  percentile75:
    number

  maximum:
    number
}


export type AggregatePromotionMetricEvidence = {
  metric:
    AggregatePromotionMetricName

  observationCount:
    number

  listingChange:
    AggregatePromotionDistribution | null

  marketChange:
    AggregatePromotionDistribution | null

  observedVariance:
    AggregatePromotionDistribution | null

  evidenceQuality:
    AggregatePromotionEvidenceQuality

  publishable:
    boolean
}


export type CanonicalAggregatePromotionIntelligence = {
  promotionSlug:
    string

  scope:
    AggregatePromotionScope

  qualifyingPromotionCount:
    number

  distinctListingCount:
    number

  evidenceQuality:
    AggregatePromotionEvidenceQuality

  publishable:
    boolean

  metrics: {
    views:
      AggregatePromotionMetricEvidence

    saves:
      AggregatePromotionMetricEvidence

    shares:
      AggregatePromotionMetricEvidence

    whatsapp:
      AggregatePromotionMetricEvidence

    buyerActions:
      AggregatePromotionMetricEvidence
  }

  observedFrom:
    string | null

  observedThrough:
    string | null

  resolvedAt:
    string

  methodology: {
    statistic:
      'median_with_interquartile_range'

    minimumPublicObservations:
      number

    causalAttribution:
      false

    individualPrediction:
      false
  }

  notes:
    string[]
}


export type AggregatePromotionIntelligenceResult =
  | CanonicalAggregatePromotionIntelligence

  | {
      status:
        'insufficient_evidence'

      promotionSlug:
        string

      scope:
        AggregatePromotionScope

      qualifyingPromotionCount:
        number

      minimumRequired:
        number

      evidenceQuality:
        AggregatePromotionEvidenceQuality

      publishable:
        false

      resolvedAt:
        string

      reason:
        'insufficient_qualifying_promotions'
    }


type DatabasePromotionEvidenceRow = {
  id:
    string

  listing_id:
    string

  promotion_slug:
    string

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

  promotion_duration_hours:
    number | string

  observed_at:
    string

  views_listing_change_pct:
    number | string | null

  views_cohort_change_pct:
    number | string | null

  views_variance_points:
    number | string | null

  views_evidence_status:
    string

  saves_listing_change_pct:
    number | string | null

  saves_cohort_change_pct:
    number | string | null

  saves_variance_points:
    number | string | null

  saves_evidence_status:
    string

  shares_listing_change_pct:
    number | string | null

  shares_cohort_change_pct:
    number | string | null

  shares_variance_points:
    number | string | null

  shares_evidence_status:
    string

  whatsapp_listing_change_pct:
    number | string | null

  whatsapp_cohort_change_pct:
    number | string | null

  whatsapp_variance_points:
    number | string | null

  whatsapp_evidence_status:
    string

  buyer_actions_listing_change_pct:
    number | string | null

  buyer_actions_cohort_change_pct:
    number | string | null

  buyer_actions_variance_points:
    number | string | null

  buyer_actions_evidence_status:
    string

  market_comparison_status:
    string

  interpretation_available:
    boolean

  structural_cohort_sufficient:
    boolean

  behavioral_evidence_sufficient:
    boolean
}


type MetricColumns = {
  listingChange:
    keyof DatabasePromotionEvidenceRow

  marketChange:
    keyof DatabasePromotionEvidenceRow

  variance:
    keyof DatabasePromotionEvidenceRow

  status:
    keyof DatabasePromotionEvidenceRow
}


const METRIC_COLUMNS:
  Record<
    AggregatePromotionMetricName,
    MetricColumns
  > = {

  views: {
    listingChange:
      'views_listing_change_pct',

    marketChange:
      'views_cohort_change_pct',

    variance:
      'views_variance_points',

    status:
      'views_evidence_status'
  },

  saves: {
    listingChange:
      'saves_listing_change_pct',

    marketChange:
      'saves_cohort_change_pct',

    variance:
      'saves_variance_points',

    status:
      'saves_evidence_status'
  },

  shares: {
    listingChange:
      'shares_listing_change_pct',

    marketChange:
      'shares_cohort_change_pct',

    variance:
      'shares_variance_points',

    status:
      'shares_evidence_status'
  },

  whatsapp: {
    listingChange:
      'whatsapp_listing_change_pct',

    marketChange:
      'whatsapp_cohort_change_pct',

    variance:
      'whatsapp_variance_points',

    status:
      'whatsapp_evidence_status'
  },

  buyer_actions: {
    listingChange:
      'buyer_actions_listing_change_pct',

    marketChange:
      'buyer_actions_cohort_change_pct',

    variance:
      'buyer_actions_variance_points',

    status:
      'buyer_actions_evidence_status'
  }
}


function numericValue(
  value:
    unknown
): number | null {

  if (
    value === null ||
    value === undefined
  ) {

    return null
  }


  const numeric =
    Number(
      value
    )


  return Number.isFinite(
    numeric
  )
    ? numeric
    : null
}


function percentile(
  values:
    number[],

  probability:
    number
): number {

  if (
    values.length === 0
  ) {

    throw new Error(
      'Cannot calculate percentile for an empty distribution.'
    )
  }


  const sorted =
    [
      ...values
    ].sort(
      (
        left,
        right
      ) =>
        left -
        right
    )


  if (
    sorted.length === 1
  ) {

    return sorted[0]
  }


  const position =
    (
      sorted.length -
      1
    ) *
    probability


  const lowerIndex =
    Math.floor(
      position
    )


  const upperIndex =
    Math.ceil(
      position
    )


  if (
    lowerIndex ===
      upperIndex
  ) {

    return sorted[
      lowerIndex
    ]
  }


  const fraction =
    position -
    lowerIndex


  return (
    sorted[
      lowerIndex
    ] *
      (
        1 -
        fraction
      )
    +
    sorted[
      upperIndex
    ] *
      fraction
  )
}


function buildDistribution(
  values:
    number[]
): AggregatePromotionDistribution |
   null {

  if (
    values.length === 0
  ) {

    return null
  }


  const sorted =
    [
      ...values
    ].sort(
      (
        left,
        right
      ) =>
        left -
        right
    )


  return {
    minimum:
      sorted[0],

    percentile25:
      percentile(
        sorted,
        0.25
      ),

    median:
      percentile(
        sorted,
        0.5
      ),

    percentile75:
      percentile(
        sorted,
        0.75
      ),

    maximum:
      sorted[
        sorted.length -
        1
      ]
  }
}


function resolveEvidenceQuality(
  observationCount:
    number
): AggregatePromotionEvidenceQuality {

  if (
    observationCount <
      LIMITED_EVIDENCE_MINIMUM
  ) {

    return 'insufficient'
  }


  if (
    observationCount <
      MINIMUM_PUBLIC_OBSERVATIONS
  ) {

    return 'limited'
  }


  if (
    observationCount <
      STRONG_EVIDENCE_MINIMUM
  ) {

    return 'usable'
  }


  return 'strong'
}


function isMetricEvidenceUsable(
  status:
    unknown
): boolean {

  return (
    status ===
      'sufficient'
  )
}


function buildMetricEvidence({
  metric,
  rows
}: {
  metric:
    AggregatePromotionMetricName

  rows:
    DatabasePromotionEvidenceRow[]
}): AggregatePromotionMetricEvidence {

  const columns =
    METRIC_COLUMNS[
      metric
    ]


  const usableRows =
    rows.filter(
      row =>
        isMetricEvidenceUsable(
          row[
            columns.status
          ]
        )
    )


  const listingChanges:
    number[] = []

  const marketChanges:
    number[] = []

  const variances:
    number[] = []


  for (
    const row
    of usableRows
  ) {

    const listingChange =
      numericValue(
        row[
          columns.listingChange
        ]
      )


    const marketChange =
      numericValue(
        row[
          columns.marketChange
        ]
      )


    const variance =
      numericValue(
        row[
          columns.variance
        ]
      )


    /*
     * A metric contributes to aggregate market evidence
     * only when the complete listing-vs-market comparison
     * exists.
     */


    if (
      listingChange ===
        null ||
      marketChange ===
        null ||
      variance ===
        null
    ) {

      continue
    }


    listingChanges.push(
      listingChange
    )


    marketChanges.push(
      marketChange
    )


    variances.push(
      variance
    )
  }


  const observationCount =
    variances.length


  const evidenceQuality =
    resolveEvidenceQuality(
      observationCount
    )


  return {
    metric,

    observationCount,

    listingChange:
      buildDistribution(
        listingChanges
      ),

    marketChange:
      buildDistribution(
        marketChanges
      ),

    observedVariance:
      buildDistribution(
        variances
      ),

    evidenceQuality,

    publishable:
      observationCount >=
        MINIMUM_PUBLIC_OBSERVATIONS
  }
}


function buildNotes({
  qualifyingPromotionCount,
  publishable
}: {
  qualifyingPromotionCount:
    number

  publishable:
    boolean
}): string[] {

  const notes = [
    'Aggregate Promotion Intelligence reports observed historical marketplace behavior.',
    'Observed variance compares promoted-listing percentage movement with comparable-market percentage movement over aligned periods.',
    'Observed variance is not evidence that a promotion caused the difference.',
    'Historical aggregate evidence does not predict the result of an individual future promotion.',
    'Median and interquartile range are used to reduce sensitivity to extreme observations.'
  ]


  if (
    !publishable
  ) {

    notes.push(
      `Public evidence requires at least ${MINIMUM_PUBLIC_OBSERVATIONS} qualifying completed promotion observations.`
    )
  }


  if (
    qualifyingPromotionCount >=
      STRONG_EVIDENCE_MINIMUM
  ) {

    notes.push(
      'The aggregate promotion cohort meets the strong evidence sample threshold.'
    )
  }


  return notes
}


export class AggregatePromotionIntelligenceError
  extends Error {

  code:
    'AGGREGATE_PROMOTION_EVIDENCE_LOAD_FAILED'

  constructor(
    message:
      string
  ) {

    super(
      message
    )


    this.name =
      'AggregatePromotionIntelligenceError'


    this.code =
      'AGGREGATE_PROMOTION_EVIDENCE_LOAD_FAILED'
  }
}


export async function getAggregatePromotionIntelligence({
  supabase,
  promotionSlug,
  propertyType,
  province,
  canton,
  district,
  transactionType,
  now =
    new Date()
}: {
  supabase:
    SupabaseClient

  promotionSlug:
    string

  propertyType?:
    string | null

  province?:
    string | null

  canton?:
    string | null

  district?:
    string | null

  transactionType?:
    string | null

  now?:
    Date
}): Promise<
  AggregatePromotionIntelligenceResult
> {

  /*
   * -------------------------------------------------------
   * 1. BUILD CANONICAL SCOPE
   * -------------------------------------------------------
   */


  const scope:
    AggregatePromotionScope = {

    promotionSlug,

    propertyType:
      propertyType ??
      null,

    province:
      province ??
      null,

    canton:
      canton ??
      null,

    district:
      district ??
      null,

    transactionType:
      transactionType ??
      null
  }


  /*
   * -------------------------------------------------------
   * 2. LOAD QUALIFIED PERSISTED EVIDENCE
   * -------------------------------------------------------
   *
   * 5H.2 already rejects unqualified evidence.
   *
   * We nevertheless reassert the canonical evidence
   * requirements here so corrupted/manual rows cannot
   * silently enter public aggregate intelligence.
   */


  let query =
    supabase
      .from(
        'promotion_intelligence_evidence'
      )
      .select(`
        id,
        listing_id,
        promotion_slug,
        property_type,
        province,
        canton,
        district,
        transaction_type,
        promotion_duration_hours,
        observed_at,

        views_listing_change_pct,
        views_cohort_change_pct,
        views_variance_points,
        views_evidence_status,

        saves_listing_change_pct,
        saves_cohort_change_pct,
        saves_variance_points,
        saves_evidence_status,

        shares_listing_change_pct,
        shares_cohort_change_pct,
        shares_variance_points,
        shares_evidence_status,

        whatsapp_listing_change_pct,
        whatsapp_cohort_change_pct,
        whatsapp_variance_points,
        whatsapp_evidence_status,

        buyer_actions_listing_change_pct,
        buyer_actions_cohort_change_pct,
        buyer_actions_variance_points,
        buyer_actions_evidence_status,

        market_comparison_status,
        interpretation_available,
        structural_cohort_sufficient,
        behavioral_evidence_sufficient
      `)
      .eq(
        'promotion_slug',
        promotionSlug
      )
      .eq(
        'market_comparison_status',
        'sufficient'
      )
      .eq(
        'interpretation_available',
        true
      )
      .eq(
        'structural_cohort_sufficient',
        true
      )
      .eq(
        'behavioral_evidence_sufficient',
        true
      )


  if (
    propertyType !==
      undefined &&
    propertyType !==
      null
  ) {

    query =
      query.eq(
        'property_type',
        propertyType
      )
  }


  if (
    province !==
      undefined &&
    province !==
      null
  ) {

    query =
      query.eq(
        'province',
        province
      )
  }


  if (
    canton !==
      undefined &&
    canton !==
      null
  ) {

    query =
      query.eq(
        'canton',
        canton
      )
  }


  if (
    district !==
      undefined &&
    district !==
      null
  ) {

    query =
      query.eq(
        'district',
        district
      )
  }


  if (
    transactionType !==
      undefined &&
    transactionType !==
      null
  ) {

    query =
      query.eq(
        'transaction_type',
        transactionType
      )
  }


  const {
    data,
    error
  } =
    await query


  if (
    error
  ) {

    throw new AggregatePromotionIntelligenceError(
      error.message
    )
  }


  const rows =
    (
      data ??
      []
    ) as
      DatabasePromotionEvidenceRow[]


  /*
   * -------------------------------------------------------
   * 3. RESOLVE PROMOTION-LEVEL EVIDENCE
   * -------------------------------------------------------
   */


  const qualifyingPromotionCount =
    rows.length


  const evidenceQuality =
    resolveEvidenceQuality(
      qualifyingPromotionCount
    )


  const publishable =
    qualifyingPromotionCount >=
      MINIMUM_PUBLIC_OBSERVATIONS


  if (
    !publishable
  ) {

    return {
      status:
        'insufficient_evidence',

      promotionSlug,

      scope,

      qualifyingPromotionCount,

      minimumRequired:
        MINIMUM_PUBLIC_OBSERVATIONS,

      evidenceQuality,

      publishable:
        false,

      resolvedAt:
        now.toISOString(),

      reason:
        'insufficient_qualifying_promotions'
    }
  }


  /*
   * -------------------------------------------------------
   * 4. AGGREGATE EACH CANONICAL METRIC
   * -------------------------------------------------------
   */


  const views =
    buildMetricEvidence({
      metric:
        'views',

      rows
    })


  const saves =
    buildMetricEvidence({
      metric:
        'saves',

      rows
    })


  const shares =
    buildMetricEvidence({
      metric:
        'shares',

      rows
    })


  const whatsapp =
    buildMetricEvidence({
      metric:
        'whatsapp',

      rows
    })

  const buyerActions =
    buildMetricEvidence({
      metric:
        'buyer_actions',

      rows
    })


  /*
   * -------------------------------------------------------
   * 5. OBSERVATION RANGE
   * -------------------------------------------------------
   */


  const observationTimes =
    rows
      .map(
        row =>
          new Date(
            row.observed_at
          )
      )
      .filter(
        date =>
          !Number.isNaN(
            date.getTime()
          )
      )
      .sort(
        (
          left,
          right
        ) =>
          left.getTime() -
          right.getTime()
      )


  const observedFrom =
    observationTimes.length >
      0
      ? observationTimes[
          0
        ].toISOString()
      : null


  const observedThrough =
    observationTimes.length >
      0
      ? observationTimes[
          observationTimes.length -
          1
        ].toISOString()
      : null


  /*
   * -------------------------------------------------------
   * 6. DISTINCT LISTINGS
   * -------------------------------------------------------
   */


  const distinctListingCount =
    new Set(
      rows.map(
        row =>
          row.listing_id
      )
    ).size


  /*
   * -------------------------------------------------------
   * 7. RETURN CANONICAL AGGREGATE INTELLIGENCE
   * -------------------------------------------------------
   */


  return {
    promotionSlug,

    scope,

    qualifyingPromotionCount,

    distinctListingCount,

    evidenceQuality,

    publishable:
      true,

    metrics: {
      views,
      saves,
      shares,
      whatsapp,
      buyerActions
    },

    observedFrom,

    observedThrough,

    resolvedAt:
      now.toISOString(),

    methodology: {
      statistic:
        'median_with_interquartile_range',

      minimumPublicObservations:
        MINIMUM_PUBLIC_OBSERVATIONS,

      causalAttribution:
        false,

      individualPrediction:
        false
    },

    notes:
      buildNotes({
        qualifyingPromotionCount,
        publishable:
          true
      })
  }
}