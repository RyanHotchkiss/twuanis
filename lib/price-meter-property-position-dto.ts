import 'server-only'
import type { PositionResult } from './price-meter-property-position-result-contract'
import type { PositionDTO, PositionPlace } from './price-meter-property-position-browser-contract'
const place = (g: PositionPlace): PositionPlace => ({ id:g.id, label:g.label, labelEn:g.labelEn, labelEs:g.labelEs })
export function toPositionDTO(result: PositionResult): PositionDTO {
  if (result.state !== 'ok') return { state:result.state, reason:result.reason }
  const e=result.evidence, r=result.reference, d=e.distribution, t=e.tail, c=e.constructionToLandContext
  return { state:'ok', contractVersion:1, listingId:e.listingId, subjectPricePerM2:e.propertyPricePerM2,
    transactionType:e.transactionType, propertyBasis:e.propertyBasis, normalizationBasis:e.normalizationBasis,
    unit:result.unit, analyticalDate:result.analyticalDate,
    reference:{ geographyLevel:r.geographyLevel, geography:place(r.geography), propertyType:{id:r.propertyType.id,label:r.propertyType.label},
      propertyArea:'unconstrained', constructionArea:'unconstrained', participation:'SUBJECT_INCLUDED' },
    n:e.comparisonPopulationCount, complete:true,
    distribution:{minimum:d.minimum,p10:d.p10,p25:d.p25,median:d.median,p75:d.p75,p90:d.p90,maximum:d.maximum,iqr:d.iqr},
    percentile:e.percentile.position,below:e.percentile.belowCount,equal:e.percentile.equalCount,above:e.percentile.aboveCount,
    difference:e.medianPosition.difference,percentDifference:e.medianPosition.percentDifference,percentageReference:e.medianPosition.percentageReference,
    interval:e.distributionInterval,
    tail:t ? {thresholdPercentile:t.thresholdPercentile,thresholdPricePerM2:t.thresholdPricePerM2,difference:t.differenceFromThreshold,
      percentDifference:t.percentDifferenceFromThreshold,percentageReference:t.percentageReference} : null,
    constructionToLand:c ? {propertyAreaM2:c.propertyAreaM2,constructionAreaM2:c.constructionAreaM2,ratio:c.constructionToLandRatio} : null,
    monetaryMethod:result.fx ? 'bccr_reference_sale' : 'native_crc' }
}
