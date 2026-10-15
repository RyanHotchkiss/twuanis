import {inventoryAreaFacts} from '../../lib/remates/adapters/bp-inventory';
/** CSV preparation for existing authenticated Remates commands. CLI is dry-run only. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import Papa from 'papaparse';
import type {readPublication} from '../../lib/remates/publication';
import type {readInstitutionRegistry} from '../../lib/remates/institutions';
import type {commandEvidence} from '../../lib/remates/evidence';
import type {commandIdentity} from '../../lib/remates/identity';
import type {commandClassification} from '../../lib/remates/classification';
import type {commandFinancial} from '../../lib/remates/financial-evidence';
import type {commandIngestion} from '../../lib/remates/ingestion';
import type {readInstitutionAuthority} from '../../lib/remates/authority';
import {adapterVersion} from '../../lib/remates/adapters/options';
type Row=Record<string,string>;
export type Transport={readPublication:typeof readPublication;readInstitutionRegistry:typeof readInstitutionRegistry;readInstitutionAuthority:typeof readInstitutionAuthority;commandEvidence:typeof commandEvidence;commandIdentity:typeof commandIdentity;commandClassification:typeof commandClassification;commandFinancial:typeof commandFinancial;commandIngestion:typeof commandIngestion};
type Family='evidence'|'identity'|'classification'|'financial'|'ingestion';
export type Step={key:string;request:string;family:Family;command:any;reviewed:boolean};
export type Journal=Record<string,{payloadHash:string;result:any}>;
export type Context={institution:string;source:string;revision:string};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function requestId(key:string){const h=hash(key);return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
const allowed:Record<Family,string[]>={evidence:['run.retain','observation.retain'],identity:['identity.propose','identity.decide'],classification:['classification.record'],financial:['financial.retain','financial.select'],ingestion:['ingestion.record']};
export function readRows(file:string){const csv=readFileSync(file,'utf8');const p=Papa.parse<Row>(csv,{header:true,skipEmptyLines:true});if(p.errors.length)throw Error('INVALID_CSV');return {rows:p.data,csvHash:hash(csv)};}
export async function verifyRegistration(t:Transport,c:Context){
 if(!uuid.test(c.institution)||!uuid.test(c.source)||!/^\d+$/.test(c.revision))throw Error('INVALID_CONTEXT');
 async function pages(q:any){const items:any[]=[];for(let n=0;n<100;n++){const r=await t.readInstitutionAuthority(q);items.push(...r.items);if(r.items.length<26)return {items,authority:r};q={...q,after:r.items[24].id};}throw Error('REGISTRY_READ_LIMIT');}
 const i=await pages({mode:'institutions'});const institution=i.items.find(x=>x.id===c.institution);
 if(!institution||institution.approval_status!=='APPROVED'||institution.participation_state!=='ACTIVE')throw Error('INSTITUTION_NOT_ACTIVE');
 // Caller selects an existing reviewed UUID; a name alone never establishes bank identity.
 const s=await pages({mode:'sources',institution:c.institution});const src=await t.readInstitutionRegistry({mode:'sources',target:c.institution});const source=src.items.find(x=>x.id===c.source);if(!s.items.some(x=>x.id===c.source)||source?.origin_host!=='srv.bancopopular.fi.cr')throw Error('SOURCE_INSTITUTION_OR_ORIGIN_MISMATCH');
 if(!source||source.channel==='INSTITUTION'||source.adapter_version!==adapterVersion('bp-inventory')||source.revision!==c.revision)throw Error('SOURCE_REGISTRATION_OR_REVISION_MISMATCH');
 if(!s.authority.owner||!uuid.test(s.authority.actor))throw Error('CANONICAL_OWNER_REQUIRED');
 return {institution,source,actor:s.authority.actor};
}
/** Lossless source-format normalization; no arithmetic, FX, appraisal substitution or float conversion. */
export function normalizeMoney(raw:string,currency:string,expected?:string){
 if(!raw)return {status:'MISSING',raw:null,currency:null,amount:null};
 const m=raw.trim().match(/^(₡|CRC|\$|USD)\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,18})?$/);
 if(!m)throw Error('AMBIGUOUS_SOURCE_MONEY');const originalCurrency=['₡','CRC'].includes(m[1])?'CRC':'USD';
 if(currency!==originalCurrency)throw Error('SOURCE_CURRENCY_CONFLICT');const amount=m[2].replace(/,/g,'')+(m[3]||'');
 const exact=(x:string)=>{if(!/^\d+(?:\.\d+)?$/.test(x))throw Error('INVALID_DECIMAL');const [whole,fraction='']=x.split('.');return BigInt(whole).toString()+'.'+fraction.replace(/0+$/,'');};
 if(expected!==undefined&&exact(amount)!==exact(expected))throw Error('SOURCE_AMOUNT_CONFLICT');
 return {status:'VALID',raw:originalCurrency+' '+amount,currency:originalCurrency,amount};
}
export function prepare(rows:Row[],csvHash:string,c?:Context){
 const seen=new Set<string>();const steps:Step[]=[];const reports:any[]=[];const reviewTemplates:any[]=[];
 const base={institution:c?.institution||'$REVIEWED_INSTITUTION',source:c?.source||'$REVIEWED_SOURCE',expected:c?.revision||'$CURRENT_SOURCE_REVISION',reason:'Banco Popular acquired CSV evidence; no identity approval or publication'};
 for(let offset=0;offset<rows.length;offset+=25){const part=rows.slice(offset,offset+25);const key=`bp-input-v4-area:${csvHash}:run:${offset/25}`;steps.push({key,request:requestId(key),family:'evidence',reviewed:false,command:{...base,operation:'run.retain',evidence:{key,started_at:part.map(r=>r.observed_at).sort()[0],ended_at:part.map(r=>r.observed_at).sort().at(-1),outcome:'PARTIAL',scope:'Retained CSV detail observations only; no complete bank inventory or absence claim',pages:part.map(r=>({key:`codBien:${r.codBien}`,status:'RETAINED'}))}}});
 for(const row of part){const rejected:string[]=[];const unresolved=['REGISTRATION_NOT_AUTHENTICATED','IDENTITY_REVIEW_REQUIRED','CANONICAL_CLASSIFICATION_REVIEW_REQUIRED','FINANCIAL_SELECTION_REVIEW_REQUIRED','CURRENT_POLICY_AND_FRESHNESS_NOT_VERIFIED'];
 if(!/^\d+$/.test(row.codBien)||row.codBien!==row.source_listing_id)rejected.push('INVALID_SOURCE_ID');if(seen.has(row.codBien))rejected.push('DUPLICATE_SOURCE_ID');seen.add(row.codBien);
 try{const u=new URL(row.source_url);if(u.protocol!=='https:'||u.hostname!=='srv.bancopopular.fi.cr'||u.pathname!=='/Wb_BA_SharepointU/Propiedad/DetallePropiedad'||u.searchParams.get('codBien')!==row.codBien||u.username||u.password||u.port)rejected.push('SOURCE_URL_MISMATCH');}catch{rejected.push('INVALID_SOURCE_URL');}
 if(!uuid.test(row.observation_id)||!/^\d{4}-\d\d-\d\dT.*Z$/.test(row.observed_at)||!Number.isFinite(Date.parse(row.observed_at)))rejected.push('INVALID_OBSERVATION_METADATA');
 if(row.source_mechanism!=='bp-inventory'||row.transaction_type!=='sale')rejected.push('WRONG_SOURCE_OR_TRANSACTION');
 if(!row.folio||!row.expediente)unresolved.push('MISSING_REGISTRY_EVIDENCE');if(!row.province||!row.canton||!row.property_type)unresolved.push('MISSING_MINIMUM_CLASSIFICATION');
 let selling=normalizeMoney('',row.currency),reference=normalizeMoney('',row.currency);try{selling=normalizeMoney(row.raw_selling_price,row.currency,row.selling_price||undefined);reference=normalizeMoney(row.raw_reference_amount,row.currency,row.reference_amount||undefined);}catch(e){rejected.push(e instanceof Error?e.message:'INVALID_FINANCIAL_EVIDENCE');}
 if(!row.selling_price)unresolved.push('SELLING_PRICE_UNRESOLVED_UNPRICED_REVIEW_REQUIRED');else if(!/^\d+(\.\d+)?$/.test(row.selling_price)||Number(row.selling_price)<=0||!['CRC','USD'].includes(row.currency))rejected.push('INVALID_SELLING_PRICE');
 // Full original row is immutable raw evidence; raw strings remain separate from interpreted numeric columns.
 const field=(name:string,label:string,raw:string,validation='VALID',currency:string|null=null)=>({path:`csv.${name}`,ordinal:0,label,raw:raw||null,validation:raw?validation:'MISSING',unit:null as string|null,currency,page:null,selector:`CSV column ${name}`});
 const areas=inventoryAreaFacts(row);
 if(!areas.hasArea)unresolved.push('AREA_EVIDENCE_REQUIRED');
 for(const [dimension,area]of [['property_area',areas.land],['construction_area',areas.construction]]as const)if(area.status==='INVALID')unresolved.push('INVALID_'+dimension.toUpperCase());
 const fields=[field('codBien','codBien',row.codBien),field('expediente','Expediente',row.expediente),field('folio','Folio',row.folio),field('property_type','Tipo de bien',row.property_type),...['province','canton','district'].map(n=>field(n,n,row[n])),field('raw_selling_price','Precio Venta',row.raw_selling_price,'UNVALIDATED',row.currency||null),field('raw_reference_amount','Precio Real',row.raw_reference_amount,'UNVALIDATED',row.currency||null),field('raw_discount','Descuento',row.raw_discount,'UNVALIDATED'),field('raw_installment_amount','Cuota Aproximada',row.raw_installment_amount,'UNVALIDATED',row.currency||null),...['raw_property_area','raw_construction_area','raw_bedrooms','raw_bathrooms','raw_parking'].map(n=>field(n,n,row[n],'UNVALIDATED'))];
 for(const [dimension,area]of [['property_area',areas.land],['construction_area',areas.construction]]as const){const original=fields.find(f=>f.path==='csv.raw_'+dimension);if(original)original.unit=area.originalUnit;}
 for(const [dimension,area]of [['property_area',areas.land],['construction_area',areas.construction]]as const)fields.push({...field('normalized_'+dimension,dimension,area.amount||'',area.status==='VALID'?'VALID':'MISSING'),unit:area.amount?'m2':null,selector:'CSV raw_'+dimension+'; inventory decimal-comma/grouped-dot m2 normalization; original retained separately'});
 let imageUrls: string[] = [];
 try { const parsed = JSON.parse(row.images || '[]'); if (Array.isArray(parsed)) imageUrls = parsed.filter((url:unknown):url is string=>typeof url==='string').slice(0,32); } catch { unresolved.push('IMAGE_REFERENCES_REVIEW_REQUIRED'); }
 imageUrls.forEach((url,ordinal)=>fields.push({...field('image_url','Original bank image URL',url,/^https:\/\/srv\.bancopopular\.fi\.cr\/(?!.*(?:[?#\s]|\.\.))[^?#\s]+\.(?:jpg|jpeg|png|webp)$/i.test(url)?'VALID':'UNVALIDATED'),ordinal}));
 fields.push(field('normalized_selling_price','Precio Venta',selling.raw||'',selling.status,selling.currency),field('normalized_reference_amount','Precio Real',reference.raw||'',reference.status,reference.currency));
 const obsKey=`bp-input-v4-area:${csvHash}:${row.codBien}:observation`;const command={...base,operation:'observation.retain',evidence:{key:obsKey,record_key:`codBien:${row.codBien}`,run:`$receipt:${key}:id`,retrieved_at:row.observed_at,published_at:null,updated_at:null,url:row.source_url,parser_version:adapterVersion('bp-inventory'),parse_status:'PARSED',raw:JSON.stringify(row),fields}};
 if(Buffer.byteLength(JSON.stringify(command))>16384)rejected.push('EVIDENCE_COMMAND_SIZE_LIMIT');
 if(!rejected.length)steps.push({key:obsKey,request:requestId(obsKey),family:'evidence',command,reviewed:false});
 reviewTemplates.push({codBien:row.codBien,reviewed:false,notice:'Placeholders require actual canonical reads and explicit review; never executable as supplied',identity:{...base,operation:'identity.propose',identity:{observation:`$receipt:${obsKey}:id`,expected_binding:'$CURRENT_BINDING_REVISION',parcels:[{expected:'$CURRENT_OR_NEW_PROPERTY_REVISION',identifiers:[{kind:'REGISTRY',jurisdiction:'$REVIEWED_REGISTRY_JURISDICTION',value:row.folio,path:'csv.folio',ordinal:0}]}]}},classification:{...base,operation:'classification.record',classification:{property:'$REVIEWED_PROPERTY_UUID',expected_property:'$CURRENT_PROPERTY_REVISION',expected:'$CURRENT_CLASSIFICATION_REVISION',observation:`$receipt:${obsKey}:id`,geography:Object.fromEntries(['province','canton','district'].map(n=>[n,row[n]?{term:`$REVIEWED_${n.toUpperCase()}_TERM`,path:`csv.${n}`,ordinal:0}:null])),semantics:{property_type:[{term:'$REVIEWED_PROPERTY_TYPE_TERM',path:'csv.property_type',ordinal:0}],utility:[],environment:[],terrain:[],accessibility:[],legal_status:[]},facts:areas.facts,reviewed:false}},financial:{...base,operation:'financial.retain',financial:{offering:'$REVIEWED_OFFERING_UUID',observation:`$receipt:${obsKey}:id`,path:'csv.normalized_selling_price',ordinal:0,kind:'SELLING_PRICE',status:selling.status,amount:selling.amount,currency:selling.currency,round:null}},financial_reference:{...base,operation:'financial.retain',financial:{offering:'$REVIEWED_OFFERING_UUID',observation:`$receipt:${obsKey}:id`,path:'csv.normalized_reference_amount',ordinal:0,kind:'REFERENCE',status:reference.status,amount:reference.amount,currency:reference.currency,round:null}},ingestion:{...base,operation:'ingestion.record',lifecycle:{offering:'$REVIEWED_OFFERING_UUID',observation:`$receipt:${obsKey}:id`,binding_revision:'$CURRENT_BINDING_REVISION'}},source_evidence_anchors:{normalized_reference:'csv.normalized_reference_amount',original_selling:'csv.raw_selling_price',reference:'csv.raw_reference_amount',discount:'csv.raw_discount',installment:'csv.raw_installment_amount'},manual_decisions:['identity.decide','classification review','financial.select'],publication:'FORBIDDEN_IN_THIS_UTILITY'});
 reports.push({codBien:row.codBien,source_url:row.source_url,observation_id:row.observation_id,observed_at:row.observed_at,evidence_ready:!rejected.length,status:rejected.length?'REJECTED':'REQUIRES_REVIEW',rejected,unresolved,selling_price:row.selling_price,reference_amount:row.reference_amount,normalized_selling_assertion:selling,normalized_reference_assertion:reference,area_evidence:areas,publication_eligible:false});
 }}return {csvHash,steps,reports,reviewTemplates};
}
function substitute(value:any,journal:Journal):any{if(typeof value==='string'&&value.startsWith('$receipt:')){const m=value.match(/^\$receipt:(.*):([A-Za-z]+)$/);const v=m&&journal[m[1]]?.result[m[2]];if(!v)throw Error('UNRESOLVED_RECEIPT_REFERENCE');return v;}if(Array.isArray(value))return value.map(x=>substitute(x,journal));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,substitute(v,journal)]));return value;}
/** Existing authenticated functions must be supplied by their existing server session, never service-role bypass. */
export async function executeReviewed(t:Transport,c:Context,steps:Step[],journal:Journal,persist:(j:Journal)=>Promise<void>){
 await verifyRegistration(t,c);
 for(const step of steps){if(!step.reviewed||!allowed[step.family]?.includes(step.command.operation)||!uuid.test(step.request))throw Error('EXPLICIT_REVIEW_REQUIRED_OR_OPERATION_FORBIDDEN');const command=substitute(step.command,journal);if(/\$[A-Z_]+/.test(JSON.stringify(command)))throw Error('UNRESOLVED_REVIEW_PLACEHOLDER');if(command.institution!==c.institution||command.source!==c.source||command.expected!==c.revision)throw Error('COMMAND_SCOPE_MISMATCH');
 const signature=hash(JSON.stringify(command));const previous=journal[step.key];if(previous){if(previous.payloadHash!==signature)throw Error('CHANGED_RETRY_PAYLOAD');continue;}
 // Recheck registration before each mutation; database contracts independently enforce authority and revisions.
 await verifyRegistration(t,c);
 const fn={evidence:t.commandEvidence,identity:t.commandIdentity,classification:t.commandClassification,financial:t.commandFinancial,ingestion:t.commandIngestion}[step.family];
 const result=await (fn as any)(step.request,command);if(result?.ok!==true||!uuid.test(result.id)||!uuid.test(result.receiptId))throw Error('UNCONFIRMED_RECEIPT');journal[step.key]={payloadHash:signature,result};await persist(journal);
 }
 return journal;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve('scripts/remates/banco-popular-batch.ts')){
 if(process.argv.some(x=>['--execute','--publish','--activate'].includes(x)))throw Error('CLI_IS_NONMUTATING_ONLY');
 const file=process.argv[2]||'outputs/scrapers/banco-popular/banco-popular-raw.csv';const {rows,csvHash}=readRows(file);const plan=prepare(rows,csvHash);const out='outputs/scrapers/banco-popular/batch-preparation';mkdirSync(out,{recursive:true});writeFileSync(out+'/evidence-command-plan.REVIEW-ONLY.json',JSON.stringify(plan.steps,null,2));writeFileSync(out+'/review-required-record-commands.json',JSON.stringify(plan.reviewTemplates,null,2));writeFileSync(out+'/record-validation.json',JSON.stringify(plan.reports,null,2));
 const summary={records_processed:rows.length,evidence_ready:plan.reports.filter(r=>r.evidence_ready).length,rejected:plan.reports.filter(r=>r.status==='REJECTED').length,publication_eligible:0,requiring_review:plan.reports.filter(r=>r.status==='REQUIRES_REVIEW').length,selling_price_assertions_passing:plan.reports.filter(r=>r.normalized_selling_assertion.status==='VALID').length,financial_original_syntax_blocked:0,unpriced:rows.filter(r=>!r.selling_price).length,registration:'NOT VERIFIED: authenticated canonical Owner session and reviewed existing institution/source UUIDs required',canonical_validation:'PARTIAL: no live authority, canonical references, source policy, identity or financial review asserted',production_ingestion:'NOT EXECUTED',production_publication:'NOT EXECUTED',discovery:'UNCHANGED',csv_sha256:csvHash};writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
}
