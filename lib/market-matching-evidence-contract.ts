// Browser-safe explanatory vocabulary; no evaluation logic.
export type MatchEvidence =
 | {kind:'unknown'}
 | {kind:'term';id:string;label?:string}
 | {kind:'exact';value:string}
 | {kind:'range';lower:string|null;upper:string|null;lowerInclusive:boolean;upperInclusive:boolean}
export type MatchExplanation={selected:MatchEvidence;candidate:MatchEvidence}
