export const financialKinds=['SELLING_PRICE','APPRAISAL','REFERENCE','AUCTION_BASE','DISCOUNT_AMOUNT','DISCOUNT_PERCENT','FINANCING_AMOUNT','INSTALLMENT','CONDOMINIUM_FEE'] as const
export type FinancialKind=typeof financialKinds[number]
