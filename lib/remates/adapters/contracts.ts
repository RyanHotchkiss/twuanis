/** Offline, bounded source evidence only. No retrieval, persistence or canonical identity assignment. */
export type AdapterId='bn'|'bcr'|'bp-inventory'|'bp-catalog'|'bp-auctions'|'bac'
export type SourcePage={url:string;finalUrl:string;status:number;contentType:string;body:string;number:number;terminal:boolean;next:string|null}
export type SourceFixture={capturedAt:string;scope:'SAMPLE';pages:SourcePage[]}
export type Field={path:string;ordinal:number;label:string;raw:string|null;unit:string|null;currency:string|null;page:number;selector:string;validation:'VALID'|'MISSING'|'AMBIGUOUS';kind:string}
export type ParsedRecord={sourceKey:string|null;identityStatus:'SOURCE_LOCAL_ONLY'|'UNRESOLVED';raw:string;fields:Field[];issues:string[];sha256:string;page:number}
export type AdapterResult={adapter:AdapterId;version:string;contentHash:string;records:ParsedRecord[];excluded:number;issues:string[];status:'PARSED'|'PARTIAL'|'FAILED';inventoryComplete:false;retrievalEnabled:false;publicationEnabled:false}
export type Profile={id:AdapterId;host:string;prefix:string;mechanism:'HTML'|'LAYOUT_TEXT';identifiers:string[];required:string[];financial:Record<string,string>;keyPrefix:string}
export const profiles:Record<AdapterId,Profile>={
 bn:{id:'bn',host:'ventadebienes.bncr.fi.cr',prefix:'/',mechanism:'HTML',identifiers:['Código','Código del bien'],required:['Tipo de bien'],financial:{'Valor informativo':'REFERENCE_VALUE','Valor avalúo':'APPRAISAL','Descuento':'DISCOUNT_PERCENT'},keyPrefix:'code'},
 bcr:{id:'bcr',host:'ventadebienes.bancobcr.com',prefix:'/wps/portal/bcrb/bcrbienes/',mechanism:'HTML',identifiers:['Código','Código del bien'],required:['Tipo de bien','Folio'],financial:{'Precio inicial':'REFERENCE_VALUE','Descuento':'DISCOUNT_PERCENT','Monto del descuento':'DISCOUNT_AMOUNT','Precio de venta final':'SELLING_PRICE'},keyPrefix:'code'},
 'bp-inventory':{id:'bp-inventory',host:'srv.bancopopular.fi.cr',prefix:'/Wb_BA_SharepointU/',mechanism:'HTML',identifiers:['codBien'],required:['Tipo de bien','Expediente','Folio'],financial:{'Precio Real':'REFERENCE_VALUE','Precio Venta':'SELLING_PRICE','Descuento':'DISCOUNT_PERCENT','Cuota Aproximada':'FINANCING_AMOUNT'},keyPrefix:'codBien'},
 'bp-catalog':{id:'bp-catalog',host:'www.bancopopular.fi.cr',prefix:'/wp-content/uploads/',mechanism:'LAYOUT_TEXT',identifiers:['Expediente'],required:['Tipo de bien','Folio'],financial:{'Precio base de venta':'SELLING_PRICE','Precio avalúo':'APPRAISAL','Descuento':'DISCOUNT_PERCENT'},keyPrefix:'expediente'},
 'bp-auctions':{id:'bp-auctions',host:'www.bancopopular.fi.cr',prefix:'/wp-content/uploads/',mechanism:'LAYOUT_TEXT',identifiers:['Expediente judicial'],required:['Tipo de bien','Folio'],financial:{'Valor del Mercado':'REFERENCE_VALUE','Base de Primer Remate':'AUCTION_BASE','Base de Segundo Remate':'AUCTION_BASE','Base de Tercer Remate':'AUCTION_BASE'},keyPrefix:'judicial'},
 bac:{id:'bac',host:'www.baccredomatic.com',prefix:'/es-cr/personas/viviendas-adjudicadas',mechanism:'HTML',identifiers:['Folio'],required:['Tipo de bien','País'],financial:{'Precio base':'REFERENCE_VALUE','Precio con Descuento':'SELLING_PRICE','Descuento':'DISCOUNT_PERCENT','Cuota desde':'FINANCING_AMOUNT','Cuota Condominal':'CONDOMINIUM_FEE'},keyPrefix:'folio-candidate'}
}
export const limits=Object.freeze({pages:8,pageBytes:65536,totalBytes:131072,records:25,recordBytes:8192,fields:32})
export {adapterVersion} from './options'
