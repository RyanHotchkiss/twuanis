import type { PositionGeography, PositionNormalization } from './price-meter-property-position-request'
export type PositionState = 'ok' | 'subject_unavailable' | 'subject_ineligible' | 'normalization_not_applicable' | 'reference_definition_invalid' | 'reference_evidence_incomplete' | 'reference_population_empty' | 'subject_participation_invalid' | 'execution_unavailable'
export type PositionPlace = { id: string; label: string; labelEn: string | null; labelEs: string | null }
export type PositionFailure = { state: Exclude<PositionState, 'ok'>; reason: string }
export type PositionConfiguration = {
  state: 'ok' | 'reference_definition_invalid'; listingId: string;
  geographies: Partial<Record<PositionGeography, PositionPlace>>;
  normalizations: PositionNormalization[]; defaultGeography: 'district' | null;
  defaultNormalization: PositionNormalization; propertyType: { id: string; label: string };
  reason: 'ready' | 'district_not_established'
}
export type PositionDTO = PositionFailure | {
  state: 'ok'; contractVersion: 1; listingId: string; subjectPricePerM2: number;
  transactionType: 'sale' | 'rent'; propertyBasis: 'land_only' | 'improved_property';
  normalizationBasis: PositionNormalization; unit: 'CRC/m²' | 'CRC/m²/month'; analyticalDate: string;
  reference: { geographyLevel: PositionGeography; geography: PositionPlace; propertyType: { id: string; label: string }; propertyArea: 'unconstrained'; constructionArea: 'unconstrained'; participation: 'SUBJECT_INCLUDED' };
  n: number; complete: true;
  distribution: { minimum: number | null; p10: number | null; p25: number | null; median: number | null; p75: number | null; p90: number | null; maximum: number | null; iqr: number | null };
  percentile: number; below: number; equal: number; above: number;
  difference: number; percentDifference: number; percentageReference: 'selected_population_median';
  interval: 'below_p10' | 'p10_to_p25' | 'p25_to_median' | 'at_median' | 'median_to_p75' | 'p75_to_p90' | 'above_p90';
  tail: null | { thresholdPercentile: 10 | 90; thresholdPricePerM2: number; difference: number; percentDifference: number; percentageReference: 'selected_population_p10' | 'selected_population_p90' };
  constructionToLand: null | { propertyAreaM2: number; constructionAreaM2: number; ratio: number };
  monetaryMethod: 'native_crc' | 'bccr_reference_sale'
}
