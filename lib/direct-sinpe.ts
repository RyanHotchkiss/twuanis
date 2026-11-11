export const RECEIPT_LIMIT=5*1024*1024
export const RECEIPT_TYPES=['application/pdf','image/jpeg','image/png','image/webp'] as const
export const directUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
export type DirectCheckout={state:'AWAITING_RECEIPT'|'ACTIVE'|'SCHEDULED'|'ENDED'|'REVOKED'|'EXPIRED'|'UNAVAILABLE'|'HISTORICAL_PROVIDER_ORDER';orderId:string;accountId?:string;product?:string;amount?:string;currency?:'CRC';duration?:'day'|'month';bankUpgrade?:boolean;receivingNumber?:string;deadline?:string;receiptId?:string|null;receiptActivated?:boolean;bankVerified?:false;reconciliation?:string;startsAt?:string;endsAt?:string}
export function receiptMime(bytes:Uint8Array):typeof RECEIPT_TYPES[number]|null{
 if(bytes.length>=5&&String.fromCharCode(...bytes.subarray(0,5))==='%PDF-')return'application/pdf'
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return'image/jpeg'
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))return'image/png'
 if(bytes.length>=12&&String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP')return'image/webp'
 return null
}
