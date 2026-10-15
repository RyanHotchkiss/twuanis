import {load} from 'cheerio'
import {parseFixture} from './core'
import type {SourceFixture} from './contracts'
export const parse=(fixture:SourceFixture)=>parseFixture('bp-inventory',fixture)

/** Banco Popular inventory narrative measurements use decimal commas and grouped dots.
 * Only explicitly labelled measurements with an original square-metre unit qualify.
 * Document evidence/restricted appraisal content is not automatically admitted here.
 */
export function normalizeInventoryArea(raw: string) {
  if (!raw?.trim()) return {status:'MISSING' as const, raw:null, originalUnit:null, amount:null};
  const match=raw.trim().match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,18}))?\s*(m²|m2)$/i);
  if (!match) return {status:'INVALID' as const,raw,originalUnit:null,amount:null};
  const whole=BigInt(match[1].replace(/\./g,'')).toString(),fraction=(match[2]||'').replace(/0+$/,'');
  const amount=whole+(fraction?'.'+fraction:'');
  if (!/[1-9]/.test(amount)||whole.length>29) return {status:'INVALID' as const,raw,originalUnit:match[3],amount:null};
  return {status:'VALID' as const,raw,originalUnit:match[3],amount};
}
export function inventoryAreaFacts(row: Record<string,string>) {
  const land=normalizeInventoryArea(row.raw_property_area||''),construction=normalizeInventoryArea(row.raw_construction_area||'');
  const facts:Record<string,{kind:'exact';value:string;path:string;ordinal:number;unit:'m2'}>={};
  for(const [dimension,area]of [['property_area',land],['construction_area',construction]]as const)
    if(area.status==='VALID')facts[dimension]={kind:'exact',value:area.amount!,path:'csv.normalized_'+dimension,ordinal:0,unit:'m2'};
  return {land,construction,facts,hasArea:Object.keys(facts).length>0};
}
export function extractInventoryAreas(html:string,expectedId:string) {
  const $=load(html);
  if($('#codBienHidden').attr('value')!==expectedId)throw Error('AREA_PROPERTY_IDENTITY_MISMATCH');
  const description=$('h3').filter((_,e)=>$(e).text().trim()==='Descripción').parent().parent().find('p').text().replace(/\s+/g,' ').trim();
  const evidence:Record<string,{raw:string|null;label:string;selector:string;status:string}>={};
  for(const [dimension,label]of [['property_area','Terreno valorado'],['construction_area','Construcción valorada']]as const){
    const pattern=dimension==='property_area'?/(?:Terreno valorado\s*:|Área (?:del )?terreno\s*:|terreno de)\s*([\d.,]+\s*m[²2])/gi:/Construcci[oó]n valorada\s*:\s*([\d.,]+\s*m[²2])/gi;
    const values=[...description.matchAll(pattern)].map(m=>m[1]),unique=[...new Set(values)];
    evidence[dimension]={raw:unique.length===1?unique[0]:null,label,selector:'Descripción paragraph; explicit '+label,status:unique.length>1?'AMBIGUOUS':unique.length===1?'PRESENT':'MISSING'};
  }
  return evidence;
}

/** Appraisal measurements are source evidence only. Never feed these into inventoryAreaFacts. */
export type InventoryPdfAssociation = {
  codBien:string; listingId:string; propertyId:string; sourceUrl:string; sourceSHA256:string;
  documentUrl:string; documentSHA256:string; documentName:string; folio:string; documentFolio:string; observedAt:string;
};
type PdfAreaItem={text:string;box:[number,number,number,number]};
export type InventoryPdfPage={number:number;width:number;height:number;items:PdfAreaItem[];omittedItems?:number};
export function normalizeAppraisalArea(raw:string) {
  const match=raw.match(/^(\d{1,3}(?:[. ]\d{3})+|\d+)(?:,(\d{1,18}))?\s*(m²|m2)$/i);
  if(!match)return {status:'INVALID' as const,amount:null,originalValue:null,originalUnit:null};
  const whole=BigInt(match[1].replace(/[. ]/g,'')).toString();
  const amount=whole+(match[2]!==undefined?'.'+match[2]:'');
  if(whole.length>29||!/[1-9]/.test(amount))return {status:'INVALID' as const,amount:null,originalValue:match[1]+(match[2]!==undefined?','+match[2]:''),originalUnit:match[3]};
  return {status:'VALID' as const,amount,originalValue:match[1]+(match[2]!==undefined?','+match[2]:''),originalUnit:match[3]};
}
/** Pair explicit labels and values on the same PDF baseline, bounded to the measured column. */
export function extractAppraisalAreaPages(pages:InventoryPdfPage[],association:InventoryPdfAssociation) {
  const measurements=(['PLAN_AREA','REGISTRY_AREA','CONSTRUCTION_TOTAL'] as const).map(identity=>{
    const labelPattern=identity==='PLAN_AREA'?/^Área de plano\s*:$/i:identity==='REGISTRY_AREA'?/^Área de registro\s*:$/i:/^Total Construcción$/i;
    const candidates=pages.flatMap(page=>page.items.filter(item=>labelPattern.test(item.text)).map(label=>{
      const right=identity==='CONSTRUCTION_TOTAL'?page.width*0.35:page.width*0.5;
      const items=page.items.filter(item=>item.box[0]>=label.box[2]&&item.box[2]<right&&Math.abs(item.box[3]-label.box[3])<=1).sort((a,b)=>a.box[0]-b.box[0]);
      const raw=items.map(item=>item.text).join(' '),normalized=normalizeAppraisalArea(raw);
      return {page:page.number,label:label.text,sourceItems:[label,...items],originalText:[label.text,...items.map(i=>i.text)].join(' '),raw,originalValue:normalized.originalValue,originalUnit:normalized.originalUnit,normalizedM2:normalized.amount,validation:normalized.status,box:[label.box[0],Math.min(label.box[1],...items.map(i=>i.box[1])),Math.max(label.box[2],...items.map(i=>i.box[2])),Math.max(label.box[3],...items.map(i=>i.box[3]))],selector:`pdf:${association.documentSHA256}/p:${page.number}/label:${label.text}/box:${JSON.stringify(label.box)}`};
    }));
    const status=candidates.length>1?'AMBIGUOUS':candidates.length===0?'MISSING':candidates[0].validation==='VALID'?'EXTRACTED':'INVALID';
    return {identity,status,candidates,normalizedM2:status==='EXTRACTED'?candidates[0].normalizedM2:null,sourceUse:'SOURCE-USE UNRESOLVED' as const,canonicalAdmitted:false as const,publicationEnabled:false as const,...association};
  });
  const restrictions=pages.flatMap(page=>page.items.filter(i=>/uso exclusivo del Banco Popular|prohibida su utilización para otros usos/i.test(i.text)).map(i=>({page:page.number,originalText:i.text,box:i.box})));
  const plan=measurements[0].normalizedM2,registry=measurements[1].normalizedM2;
  // Compare decimal magnitudes exactly, without dropping original precision in the evidence.
  const magnitude=(s:string)=>s.includes('.')?s.replace(/0+$/,'').replace(/\.$/,''):s;
  return {association,measurements,restrictions,status:measurements.every(m=>m.status==='EXTRACTED')?'EXTRACTED':'PARTIAL',contradictions:plan&&registry&&magnitude(plan)!==magnitude(registry)?['PLAN_REGISTRY_DISCREPANCY']:[],sourceUse:'SOURCE-USE UNRESOLVED',canonicalAdmitted:false,publicationEnabled:false};
}
export async function extractInventoryPdfAreas(bytes:Uint8Array,input:InventoryPdfAssociation,verified:InventoryPdfAssociation,sourceHTML:string) {
  const {createHash}=await import('node:crypto');
  const {spawn}=await import('node:child_process');
  const {join}=await import('node:path');
  const {sourceUrl}=await import('./core');
  const {profiles}=await import('./contracts');
  const {validateEvidenceLocator}=await import('../source-locator');
  const fields:(keyof InventoryPdfAssociation)[]=['codBien','listingId','propertyId','sourceUrl','sourceSHA256','documentUrl','documentSHA256','documentName','folio','documentFolio','observedAt'];
  if(!input||!verified||fields.some(k=>typeof input[k]!=='string'||!input[k]||input[k]!==verified[k])||Object.keys(input).some(k=>!fields.includes(k as keyof InventoryPdfAssociation)))throw Error('PDF_PROPERTY_ASSOCIATION_MISMATCH');
  if(!/^\d{1,12}$/.test(input.codBien)||![input.listingId,input.propertyId].every(s=>/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(s))||![input.sourceSHA256,input.documentSHA256].every(s=>/^[0-9a-f]{64}$/.test(s))||!Number.isFinite(Date.parse(input.observedAt)))throw Error('PDF_PROPERTY_ASSOCIATION_MISMATCH');
  const url=sourceUrl(input.sourceUrl,profiles['bp-inventory']);validateEvidenceLocator(input.sourceUrl,profiles['bp-inventory'].host);
  sourceUrl(input.documentUrl,profiles['bp-inventory']);validateEvidenceLocator(input.documentUrl,profiles['bp-inventory'].host);
  if(url.searchParams.get('codBien')!==input.codBien||!/^AVALUO-[A-Za-z0-9_-]+\.pdf$/.test(input.documentName)||input.documentUrl!==`https://srv.bancopopular.fi.cr/Wb_BA_SharepointU/Public/${input.documentName}`)throw Error('PDF_SOURCE_IDENTITY_MISMATCH');
  if(createHash('sha256').update(sourceHTML).digest('hex')!==input.sourceSHA256)throw Error('PDF_SOURCE_HASH_MISMATCH');
  const $=load(sourceHTML);if($('#codBienHidden').attr('value')!==input.codBien)throw Error('PDF_SOURCE_IDENTITY_MISMATCH');
  const heading=$('h4').first().text().replace(/\s+/g,' ').trim();if(heading.match(/Folio\s+(.+)$/)?.[1]!==input.folio)throw Error('PDF_SOURCE_FOLIO_MISMATCH');
  if(!(bytes instanceof Uint8Array)||bytes.length<100||bytes.length>8388608)throw Error('PDF_SIZE_LIMIT');
  if(createHash('sha256').update(bytes).digest('hex')!==input.documentSHA256)throw Error('PDF_DOCUMENT_HASH_MISMATCH');
  const decoded=await new Promise<string>((resolve,reject)=>{
    const child=spawn(process.execPath,['--max-old-space-size=256',join(process.cwd(),'lib/remates/adapters/pdf-worker.mjs'),'--bp-inventory-area-evidence'],{stdio:['pipe','pipe','pipe'],env:{NODE_ENV:'production'},shell:false});let out='',done=false;
    const finish=(error?:Error)=>{if(done)return;done=true;clearTimeout(timer);child.kill('SIGKILL');error?reject(error):resolve(out)};
    const timer=setTimeout(()=>finish(Error('PDF_TIMEOUT')),20000);
    child.on('error',()=>finish(Error('PDF_DECODER_UNAVAILABLE')));child.stdout.on('data',c=>{out+=c.toString();if(Buffer.byteLength(out)>8388608)finish(Error('PDF_OUTPUT_LIMIT'))});child.stderr.resume();child.on('close',code=>finish(code===0?undefined:Error('PDF_DECODING_FAILED')));child.stdin.on('error',()=>{});child.stdin.end(bytes);
  });
  const pages=(JSON.parse(decoded) as {pages:InventoryPdfPage[]}).pages;
  const folios=pages.flatMap(page=>page.items.filter(i=>/^INSCRIPCIÓN:$/.test(i.text)).map(label=>page.items.filter(i=>i.box[0]>=label.box[2]&&Math.abs(i.box[3]-label.box[3])<=1).sort((a,b)=>a.box[0]-b.box[0]).map(i=>i.text).join(' ').match(/FOLIO REAL Nº\s*([A-Z\d\s\-/]+)/)?.[1]?.replace(/[\s/]+/g,'').replace(/-+/g,'-')));
  if(!folios.length||folios.some(f=>f!==input.documentFolio.replace(/[\s/]+/g,'').replace(/-+/g,'-')))throw Error('PDF_DOCUMENT_FOLIO_MISMATCH');
  return {...extractAppraisalAreaPages(pages,input),documentPages:pages.map(page=>({number:page.number,omittedItems:page.omittedItems||0}))};
}
