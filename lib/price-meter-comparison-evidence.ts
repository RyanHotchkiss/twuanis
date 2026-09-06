/*
 * ---------------------------------------------------------
 * PRICE / M² COMPARISON EVIDENCE
 * ---------------------------------------------------------
 *
 * Purpose:
 *
 * Define the minimum evidence requirement for authorizing
 * a Phase 10 Price / m² comparison.
 *
 * This policy is intentionally separate from confidence.
 *
 * Evidence sufficiency answers:
 *
 * - May Phase 10 produce a comparison?
 *
 * Confidence answers:
 *
 * - How much confidence does Twuanis have in an
 *   authorized cohort result?
 *
 * The current minimum happens to align with the beginning
 * of the canonical Low Confidence range, but the two rules
 * remain analytically independent.
 */


export const
PRICE_METER_COMPARISON_MINIMUM_SAMPLE_SIZE =
  8


export function
hasSufficientPriceMeterComparisonEvidence(
  sampleSize:
    number
): boolean {

  return (
    Number.isInteger(
      sampleSize
    ) &&
    sampleSize >=
      PRICE_METER_COMPARISON_MINIMUM_SAMPLE_SIZE
  )
}