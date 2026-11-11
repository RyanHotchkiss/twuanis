export type PublicTerm={id:string;type:string;parent:string|null;en:string;es:string}
export type PublicProperty={id:string;terms:PublicTerm[];area:string|null;construction_area?:string|null;images?:string[]}
export type BankProperty={id:string;revision:string;offering_id:string;institution_id:string;institution:string;mechanism:string;state:string;visibility_label:string|null;title:string;source_name:string;source_url:string|null;amount:string|null;currency:string|null;financial_kind:string|null;financial_label:string|null;auction_round:string|null;published_at:string;properties:PublicProperty[]}
export type PublicResult={enabled:boolean;count:number;page:number;items:BankProperty[]}
export type PublicFacets={enabled:boolean;facets:{institutions:{id:string;name:string}[];terms:PublicTerm[]}}
export type ReadResult<T>={ok:true;data:T}|{ok:false}
export const bankPath=(language:'en'|'es')=>language==='es'?'/es/remates':'/en/bank-properties'
// Preserve authoritative decimal digits; never coerce monetary evidence to floating point.
export function exactMoney(value:string,language:'en'|'es'){const [whole,fraction]=value.split('.');return whole.replace(/\B(?=(\d{3})+(?!\d))/g,language==='es'?'.':',')+(fraction?(language==='es'?',':'.')+fraction:'')}
