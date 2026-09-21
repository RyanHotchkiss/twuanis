/* Phase 10 requires at least eight observations independently in each cohort. */


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