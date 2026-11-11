import type { Phase14BrowserResult } from './phase14-browser-contract'
import type { Phase14CommitInput } from './phase14-question-contract'

export type Phase14ApplicationRequest = { request: Phase14CommitInput; normalization: 'land' | 'construction' }
export type Phase14ListingPresentation = Readonly<{
  listingId: string; title: string | null; thumbnail: string | null
  price: number | null; currency: 'CRC' | 'USD' | null
  propertyArea: number | null; constructionArea: number | null
  bedrooms: number | null; bathrooms: number | null; parking: number | null; yearBuilt: number | null
  province: string | null; canton: string | null; district: string | null
}>
export type Phase14ApplicationResponse = Readonly<{
  analysis: Phase14BrowserResult; listings?: readonly Phase14ListingPresentation[]
  context?: Readonly<{
    analyticalDate:string|null;
    propertyBases:readonly ('land_only'|'improved_property'|'unknown')[];
    hydratedCount:number;excludedCount:number;
    fx:Readonly<{source:'BCCR';rate:number;effectiveDate:string;rateType:'reference_sale';resolutionMode:'exact'|'latest_applicable_prior_observation'}>|null;
  }>
}>
export type Phase14Option = Readonly<{
  id: string; type: string; en: string; es: string; code: string | null; parentId: string | null
}>
export type Phase14Catalog = Readonly<{ state: 'ready'; options: readonly Phase14Option[] } | { state: 'unavailable' }>
