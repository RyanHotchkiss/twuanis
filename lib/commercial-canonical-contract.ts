import 'server-only';

/** Step 1 domain vocabulary only. No runtime catalog, checkout or grant API.
 * Mutable records must be resolved from authorized database/server authority.
 * Contract and compatibility ledger: outputs/commercial-administrative/STEP-1.md.
 */
declare const commercialIdentity: unique symbol;
export type CommercialId<K extends string> = string & { readonly [commercialIdentity]: K };
export type Currency = 'USD' | 'CRC';
// Decimal strings avoid introducing floating-point commercial money arithmetic.
export type CommercialMoney = Readonly<{ currency: Currency; decimalAmount: string }>;
export type LocalizedCommercialCopy = Readonly<{ en: string; es: string | null }>;
export type ProductState = 'draft' | 'active' | 'inactive' | 'archived';
export type OfferState = 'scheduled' | 'active' | 'ended' | 'archived';
export type CampaignState = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
export type OrderState = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
export type PaymentState = 'pending' | 'evidence_submitted' | 'under_review' | 'verified' | 'rejected' | 'failed' | 'cancelled';
export type EntitlementState = 'scheduled' | 'active' | 'expired' | 'revoked';
// Step 2 supplies the executable scoped authority vocabulary.
export type { AdministrativePermission } from './administrative-control';
export type CommercialTarget =
  | Readonly<{ kind: 'account'; accountId: string }>
  | Readonly<{ kind: 'listing'; listingId: string }>
  | Readonly<{ kind: 'operation'; operationId: string }>;
export type AddOnFulfillment =
  | Readonly<{ kind: 'placement_entitlement'; target: Extract<CommercialTarget, {kind: 'listing'}> }>
  | Readonly<{ kind: 'founding_pricing_entitlement'; target: Extract<CommercialTarget, {kind: 'account'}> }>
  | Readonly<{ kind: 'import_operation'; target: Extract<CommercialTarget, {kind: 'operation'}> }>
  | Readonly<{ kind: 'listing_experience_entitlement'; target: Extract<CommercialTarget, {kind: 'listing'}> }>;
export type PurchasedTerm =
  | Readonly<{ kind: 'monthly_access'; calendarMonths: number }>
  | Readonly<{ kind: 'trial_access'; elapsedHours: number; monthlyPriceBasis: CommercialMoney; trialId: CommercialId<'trial'> }>
  | Readonly<{ kind: 'placement'; days: number; benefit: string }>
  | Readonly<{ kind: 'founding_pricing'; lifetime: true; eligibilityEvidenceId: string }>
  | Readonly<{ kind: 'import'; quantity: number; unitRate: CommercialMoney; wholeJob: true }>;
export type PurchasedTermsSnapshot = Readonly<{
  orderId: CommercialId<'order'>;
  productId: CommercialId<'product'>;
  productType: 'package' | 'addon';
  target: CommercialTarget;
  quantity: number;
  term: PurchasedTerm;
  price: CommercialMoney;
  selectedOfferId: CommercialId<'offer'> | null;
  founderPricingEvidenceId: string | null;
  fulfillmentTermsVersion: string;
  createdAt: string;
}>;
// Distinct identities: receipt/evidence cannot be used as a verified payment ID.
export type PaymentEvidence = Readonly<{
  paymentId: CommercialId<'payment'>;
  orderId: CommercialId<'order'>;
  provider: string;
  evidenceReference: string;
}>;
export type FulfillmentEvidence = Readonly<{
  fulfillmentId: CommercialId<'fulfillment'>;
  orderId: CommercialId<'order'>;
  verifiedPaymentId: CommercialId<'verified-payment'>;
  entitlementIds: readonly CommercialId<'entitlement'>[];
}>;
// These types are not authentication, authorization, validation or mutation logic.
// Browser input must never be trusted merely because it has this shape.
