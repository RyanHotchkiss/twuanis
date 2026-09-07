import {
  NextRequest,
  NextResponse
} from 'next/server'

import {
  getPriceMeterAnalysis
} from '@/lib/price-meter-engine'

import {
  buildPriceMeterTransactionCohorts
} from '@/lib/price-meter-transaction-cohort'

import {
  buildPriceMeterAnalyticalCohort
} from '@/lib/price-meter-analytical-cohort'

import {
  resolvePriceMeterGeographicScope
} from '@/lib/price-meter-geographic-scope'

import {
  resolvePriceMeterCrossDimensionalIdentity
} from '@/lib/price-meter-cross-dimensional-identity'

import {
  analyzePriceMeterCrossDimensionalRelationship
} from '@/lib/price-meter-cross-dimensional-analyzer'

import {
  getPriceMeterCrossDimensionalQuestion,
  type PriceMeterCrossDimensionalQuestionKey
} from '@/lib/price-meter-cross-dimensional-question'


type RequestBody = {
  questionKey?:
    string

  filters?:
    Record<
      string,
      string | undefined
    >

  cohortKey?:
    | 'vacantLandLandNormalized'
    | 'improvedLandNormalized'
    | 'improvedConstructionNormalized'
}


const AUTHORIZED_QUESTION_KEYS =
  new Set<
    PriceMeterCrossDimensionalQuestionKey
  >([
    'geography_by_property_area',
    'geography_by_construction_area',
    'geography_by_construction_to_land',
    'property_area_by_geography',
    'property_area_by_construction_to_land',
    'construction_area_by_geography',
    'construction_area_by_construction_to_land',
    'construction_to_land_by_geography',
    'construction_to_land_by_property_area',
    'construction_to_land_by_construction_area'
  ])


function isAuthorizedQuestionKey(
  value:
    string
): value is PriceMeterCrossDimensionalQuestionKey {

  return AUTHORIZED_QUESTION_KEYS.has(
    value as
      PriceMeterCrossDimensionalQuestionKey
  )
}


export async function POST(
  request:
    NextRequest
) {
  try {
    const body =
      await request.json() as
        RequestBody


    if (
      !body.questionKey ||
      !isAuthorizedQuestionKey(
        body.questionKey
      )
    ) {
      return NextResponse.json(
        {
          error:
            'An authorized Cross-Dimensional question is required.'
        },
        {
          status:
            400
        }
      )
    }


    if (
      !body.filters
    ) {
      return NextResponse.json(
        {
          error:
            'The bounded Price / m² market filters are required.'
        },
        {
          status:
            400
        }
      )
    }


    const transactionType =
      body.filters
        .transaction_type


    if (
      transactionType !==
        'sale' &&
      transactionType !==
        'rent'
    ) {
      return NextResponse.json(
        {
          error:
            'Cross-Dimensional analysis requires an explicit Sale or Rent transaction type.'
        },
        {
          status:
            400
        }
      )
    }


    /*
     * -----------------------------------------------------
     * QUESTION AUTHORIZATION
     * -----------------------------------------------------
     *
     * Resolve exactly one canonical Phase 11 question.
     *
     * No alternative questions are calculated here.
     */

    const question =
      getPriceMeterCrossDimensionalQuestion(
        body.questionKey
      )


    /*
     * -----------------------------------------------------
     * RECONSTRUCT THE EXISTING BOUNDED MARKET
     * -----------------------------------------------------
     *
     * This executes only after the explicit POST generated
     * by a user selection.
     *
     * The ordinary Price / m² engine applies the same
     * upstream market filters and canonical observation
     * construction used by the owning Phase 7–9 analysis.
     */

    const marketAnalysis =
      await getPriceMeterAnalysis(
        body.filters,
        'en'
      )


    const observations =
      marketAnalysis
        .observations


    /*
     * -----------------------------------------------------
     * TRANSACTION BOUNDARY
     * -----------------------------------------------------
     */

    const transactionCohorts =
      buildPriceMeterTransactionCohorts(
        observations
      )


    const transactionCohort =
      transactionType ===
        'sale'
        ? transactionCohorts.sale
        : transactionCohorts.rent


    /*
     * -----------------------------------------------------
     * OWNING-PHASE CANONICAL COHORT
     * -----------------------------------------------------
     *
     * Phase 7 can legitimately operate on any of its three
     * existing analytical cohorts. The exact displayed
     * cohort therefore travels explicitly from the owning
     * Phase 7 presentation.
     *
     * Phase 8 and Phase 9 derive their analytical identity
     * directly from the owning relationship.
     */

    let propertyBasis:
      'land_only' |
      'improved_property'

    let normalizationBasis:
      'land' |
      'construction'


    if (
      question.owningPhase ===
        'phase_7_geography'
    ) {
      if (
        body.cohortKey ===
          'vacantLandLandNormalized'
      ) {
        propertyBasis =
          'land_only'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedLandNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedConstructionNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'construction'
      }
      else {
        return NextResponse.json(
          {
            error:
              'Geographic Cross-Dimensional analysis requires an explicit canonical analytical cohort.'
          },
          {
            status:
              400
          }
        )
      }
    }
    else if (
      question.owningPhase ===
        'phase_8_property_area'
    ) {
      propertyBasis =
        'improved_property'

      normalizationBasis =
        'land'
    }
    else if (
      question.owningPhase ===
        'phase_8_construction_area'
    ) {
      propertyBasis =
        'improved_property'

      normalizationBasis =
        'construction'
    }
    else {
      /*
       * Phase 9 contains two analytically distinct
       * normalization relationships.
       *
       * The caller must identify which displayed Phase 9
       * relationship owns this Cross-Dimensional request.
       */

      if (
        body.cohortKey ===
          'improvedLandNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'land'
      }
      else if (
        body.cohortKey ===
          'improvedConstructionNormalized'
      ) {
        propertyBasis =
          'improved_property'

        normalizationBasis =
          'construction'
      }
      else {
        return NextResponse.json(
          {
            error:
              'Construction-to-Land Cross-Dimensional analysis requires an explicit normalization relationship.'
          },
          {
            status:
              400
          }
        )
      }
    }


    const analyticalCohort =
      buildPriceMeterAnalyticalCohort({
        transactionCohort,
        propertyBasis,
        normalizationBasis
      })


    /*
     * -----------------------------------------------------
     * GEOGRAPHIC SCOPE
     * -----------------------------------------------------
     */

    const geographicScope =
      resolvePriceMeterGeographicScope({
        province:
          body.filters.province,

        canton:
          body.filters.canton,

        district:
          body.filters.district
      })


    /*
     * -----------------------------------------------------
     * CROSS-DIMENSIONAL IDENTITY
     * -----------------------------------------------------
     */

    const identity =
      resolvePriceMeterCrossDimensionalIdentity({
        questionKey:
          body.questionKey,

        cohort:
          analyticalCohort,

        geographicScope
      })


    /*
     * -----------------------------------------------------
     * ONE QUESTION → ONE ANALYSIS
     * -----------------------------------------------------
     */

    const evidence =
      analyzePriceMeterCrossDimensionalRelationship({
        identity,

        observations:
          analyticalCohort
            .observations
      })


    return NextResponse.json({
      question,
      identity,
      evidence
    })
  }
  catch (
    error
  ) {
    console.error(
      'Price / m² Cross-Dimensional analysis failed:',
      error
    )


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Cross-Dimensional analysis failed.'
      },
      {
        status:
          500
      }
    )
  }
}