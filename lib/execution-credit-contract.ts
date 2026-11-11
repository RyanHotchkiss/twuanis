// Customer-visible accounting projection only. Mutation authority lives on the server.
export type CreditKind = 'INCLUDED_PACKAGE' | 'PURCHASED' | 'ADMIN_ALLOWANCE'
export type OrchestratorIdentity = 'orchestrator-market-comparison' | 'orchestrator-markets-current-valuation-of-property'
export type CreditPopulation = 'SALE' | 'RENT' | 'BANK'
export type CreditAllocation = {id:string;kind:CreditKind;quantity:string;remaining:string;active:boolean;packageId:string|null;termId:string|null;orderId:string|null;effectiveAt:string;expiresAt:string|null}
export type CreditEvent = {id:string;kind:string;quantity:string;allocationId:string|null;executionId:string|null;reportId:string|null;at:string;metadata:Record<string,unknown>}
export type CreditPurchase = {id:string;createdAt:string;quantity:string;currency:string;amount:string;state:string;paid:boolean;fulfilled:boolean;allocationId:string|null;tokensIssued:string|null;tokensRemaining:string|null;receiptReference:string|null;provider:string|null}
export type CreditAccounting = {ownerUnmetered:boolean;balance:string;purchases:CreditPurchase[];nextPurchase:string|null;allocations:CreditAllocation[];events:CreditEvent[];nextAllocation:string|null;nextEvent:string|null;purchase:{enabled:false;usdUnit:'1';crcUnit:'500';quantities:readonly number[]}}
