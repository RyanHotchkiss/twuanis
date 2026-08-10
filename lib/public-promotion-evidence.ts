import type {
  SupabaseClient
} from '@supabase/supabase-js'

import {
  getAggregatePromotionIntelligence,
  type AggregatePromotionEvidenceQuality,
  type AggregatePromotionMetricEvidence
} from '@/lib/aggregate-promotion-intelligence-engine'

import type {
  PromotionProductSlug
} from '@/lib/promotion-catalog'


/*
 * ---------------------------------------------------------
 * PUBLIC PROMOTION EVIDENCE RESOLVER
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Convert canonical Aggregate Promotion Intelligence into
 * a deliberately restricted, display-safe commercial
 * evidence object.
 *
 * This is the ONLY shape public commercial UI should need.
 *
 * It does not expose:
 *
 * • raw evidence rows
 * • listing IDs
 * • entitlement IDs
 * • individual observations
 * • minimum / maximum outliers
 * • private metrics below publication thresholds
 *
 * It does expose:
 *
 * • qualified sample size
 * • evidence quality
 * • median listing movement
 * • median comparable-market movement
 * • median observed variance
 * • interquartile range
 *
 * Evidence, not claims.
 */


export type PublicPromotionMetricKey =
  | 'views'
  | 'saves'
  | 'shares'
  | 'whatsapp'
  | 'buyerActions'


export type PublicPromotionMetricEvidence = {
  metric:
    PublicPromotionMetricKey

  observationCount:
    number

  evidenceQuality:
    AggregatePromotionEvidenceQuality

  medianListingChangePct:
    number

  medianMarketChangePct:
    number

  medianObservedVariancePoints:
    number

  middle50Variance: {
    low:
      number

    high:
      number
  }
}


export type PublicPromotionEvidence = {
  promotionSlug:
    PromotionProductSlug

  publishable:
    true

  qualifyingPromotionCount:
    number

  distinctListingCount:
    number

  evidenceQuality:
    AggregatePromotionEvidenceQuality

  metrics:
    PublicPromotionMetricEvidence[]

  observedFrom:
    string | null

  observedThrough:
    string | null

  methodology: {
    statistic:
      'median_with_interquartile_range'

    causalAttribution:
      false

    individualPrediction:
      false
  }

  disclaimer:
    string
}


export type PublicPromotionEvidenceUnavailable = {
  promotionSlug:
    PromotionProductSlug

  publishable:
    false

  reason:
    'insufficient_evidence'

  qualifyingPromotionCount:
    number

  minimumRequired:
    number
}


export type PublicPromotionEvidenceResult =
  | PublicPromotionEvidence
  | PublicPromotionEvidenceUnavailable


function mapPublicMetric({
  key,
  evidence
}: {
  key:
    PublicPromotionMetricKey

  evidence:
    AggregatePromotionMetricEvidence
}): PublicPromotionMetricEvidence | null {

  /*
   * Metric-level publication firewall.
   *
   * A promotion may have enough overall evidence while one
   * individual behavioral metric still does not.
   */

  if (
    !evidence.publishable ||
    !evidence.listingChange ||
    !evidence.marketChange ||
    !evidence.observedVariance
  ) {

    return null
  }


  return {
    metric:
      key,

    observationCount:
      evidence.observationCount,

    evidenceQuality:
      evidence.evidenceQuality,

    medianListingChangePct:
      evidence
        .listingChange
        .median,

    medianMarketChangePct:
      evidence
        .marketChange
        .median,

    medianObservedVariancePoints:
      evidence
        .observedVariance
        .median,

    /*
     * Public UI gets robust distribution context without
     * exposing sensational minimum / maximum outliers.
     */

    middle50Variance: {
      low:
        evidence
          .observedVariance
          .percentile25,

      high:
        evidence
          .observedVariance
          .percentile75
    }
  }
}


export class PublicPromotionEvidenceError
  extends Error {

  code:
    | 'PROMOTION_SLUG_REQUIRED'
    | 'PUBLIC_PROMOTION_EVIDENCE_RESOLUTION_FAILED'

  constructor(
    code:
      PublicPromotionEvidenceError['code'],

    message:
      string
  ) {

    super(
      message
    )


    this.name =
      'PublicPromotionEvidenceError'


    this.code =
      code
  }
}


export async function resolvePublicPromotionEvidence({
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
    PromotionProductSlug

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
  PublicPromotionEvidenceResult
> {

  if (
    !promotionSlug
  ) {

    throw new PublicPromotionEvidenceError(
      'PROMOTION_SLUG_REQUIRED',
      'A promotion slug is required to resolve public promotion evidence.'
    )
  }


  let aggregate


  try {

    aggregate =
      await getAggregatePromotionIntelligence({
        supabase,
        promotionSlug,
        propertyType,
        province,
        canton,
        district,
        transactionType,
        now
      })

  } catch (
    error
  ) {

    throw new PublicPromotionEvidenceError(
      'PUBLIC_PROMOTION_EVIDENCE_RESOLUTION_FAILED',

      error instanceof Error
        ? error.message
        : 'Public Promotion Evidence could not be resolved.'
    )
  }


  /*
   * -------------------------------------------------------
   * PROMOTION-LEVEL PUBLICATION FIREWALL
   * -------------------------------------------------------
   */


  if (
    'status' in aggregate
  ) {

    return {
      promotionSlug,

      publishable:
        false,

      reason:
        'insufficient_evidence',

      qualifyingPromotionCount:
        aggregate
          .qualifyingPromotionCount,

      minimumRequired:
        aggregate
          .minimumRequired
    }
  }


  /*
   * -------------------------------------------------------
   * METRIC-LEVEL PUBLICATION FIREWALL
   * -------------------------------------------------------
   */


  const possibleMetrics = [
    mapPublicMetric({
      key:
        'views',

      evidence:
        aggregate
          .metrics
          .views
    }),

    mapPublicMetric({
      key:
        'saves',

      evidence:
        aggregate
          .metrics
          .saves
    }),

    mapPublicMetric({
      key:
        'shares',

      evidence:
        aggregate
          .metrics
          .shares
    }),

    mapPublicMetric({
      key:
        'whatsapp',

      evidence:
        aggregate
          .metrics
          .whatsapp
    }),

    mapPublicMetric({
      key:
        'buyerActions',

      evidence:
        aggregate
          .metrics
          .buyerActions
    })
  ]


  const metrics =
    possibleMetrics.filter(
      (
        metric
      ): metric is PublicPromotionMetricEvidence =>
        metric !==
        null
    )


  return {
    promotionSlug,

    publishable:
      true,

    qualifyingPromotionCount:
      aggregate
        .qualifyingPromotionCount,

    distinctListingCount:
      aggregate
        .distinctListingCount,

    evidenceQuality:
      aggregate
        .evidenceQuality,

    metrics,

    observedFrom:
      aggregate
        .observedFrom,

    observedThrough:
      aggregate
        .observedThrough,

    methodology: {
      statistic:
        'median_with_interquartile_range',

      causalAttribution:
        false,

      individualPrediction:
        false
    },

    disclaimer:
      'Observed historical behavior across qualifying Twuanis promotions. These figures do not establish that promotion caused the observed differences and do not predict the result of an individual future promotion.'
  }
}