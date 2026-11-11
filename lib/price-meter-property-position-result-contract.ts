import 'server-only'
import type { PositionFailure, PositionPlace } from './price-meter-property-position-browser-contract'
import type { PositionRequest } from './price-meter-property-position-request'
import type { PriceMeterPropertyPositionIdentity } from './price-meter-property-position-identity'
import type { PriceMeterPropertyPositionEvidence } from './price-meter-property-position-evidence'
import type { PriceMeterAnalyticalIdentity, PriceMeterFxIdentity } from './price-meter-identity'
export type PositionReference = {
  subjectListingId: string; geographyLevel: PositionRequest['requestedGeographyLevel']; geography: PositionPlace;
  propertyType: { id: string; label: string }; transactionType: 'sale' | 'rent';
  propertyBasis: 'land_only' | 'improved_property'; normalizationBasis: PositionRequest['requestedNormalizationBasis'];
  participation: 'SUBJECT_INCLUDED'; canonicalVersion: 1; listingStatus: 'active';
  propertyArea: 'unconstrained'; constructionArea: 'unconstrained'; analyticalDate: string;
  monetaryPolicy: 'canonical_crc_bccr_reference_sale'; eligibility: 'canonical_exact_normalization'
}
export type PositionResult = PositionFailure | {
  state: 'ok'; contractVersion: 1; subject: PriceMeterPropertyPositionIdentity;
  subjectAnalyticalIdentity: PriceMeterAnalyticalIdentity; reference: PositionReference;
  unit: 'CRC/m²' | 'CRC/m²/month'; analyticalDate: string; fx: PriceMeterFxIdentity | null;
  completeness: { established: true; candidateCount: number; observationCount: number };
  evidence: PriceMeterPropertyPositionEvidence
}
