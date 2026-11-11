import 'server-only'
import {spawn} from 'node:child_process'
import {createHash} from 'node:crypto'
import {join} from 'node:path'
import {parseFixture,sourceUrl} from './core'
import {profiles,type SourceFixture} from './contracts'
import {validateEvidenceLocator} from '../source-locator'
export const pdfLimits=Object.freeze({bytes:2097152,pages:8,timeoutMs:5000,outputBytes:1048576,memoryMb:256})
type Box=[number,number,number,number]
type Item={text:string;box:Box}
type Page={number:number;width:number;height:number;items:Item[]}
export type PdfInput={mechanism:'bp-catalog'|'bp-auctions';url:string;capturedAt:string;documentComplete:boolean}
/** Narrow supported layout: explicit label and value on the same baseline, within one identifier-anchored column. */
function positioned(page:Page,mechanism:PdfInput['mechanism']){
 const key=mechanism==='bp-catalog'?'Expediente':'Expediente judicial';const known=new Set([key,'Tipo de bien','Folio','Provincia','Cantón','Distrito','Área','Fecha de Primer Remate','Fecha de Segundo Remate','Fecha de Tercer Remate','Hora de Remate',...Object.keys(profiles[mechanism].financial)])
 const labels=page.items.filter(i=>known.has(i.text)),labelSet=new Set(labels)
 const anchors=labels.filter(i=>i.text===key).sort((a,b)=>a.box[1]-b.box[1]||a.box[0]-b.box[0])
 if(!anchors.length)throw Error('NO_RECORD_ANCHOR')
 if(anchors.length>25||labels.length>800)throw Error('PDF_LAYOUT_LIMIT')
 const columns=[...new Set(anchors.map(a=>Math.round(a.box[0])))].sort((a,b)=>a-b);if(columns.length>3)throw Error('AMBIGUOUS_COLUMNS')
 return anchors.map(anchor=>{
  const x=Math.round(anchor.box[0]),column=columns.indexOf(x),right=columns[column+1]??page.width
  const next=anchors.filter(a=>Math.round(a.box[0])===x&&a.box[1]>anchor.box[1]+2)[0];const bottom=next?.box[1]??page.height
  const scoped=labels.filter(l=>l.box[0]>=x-1&&l.box[0]<right&&l.box[1]>=anchor.box[1]-1&&l.box[1]<bottom)
  const fields=scoped.map(l=>{
   const candidates=page.items.filter(i=>!labelSet.has(i)&&i.box[0]>=l.box[2]+1&&i.box[2]<right&&Math.abs(i.box[3]-l.box[3])<=2)
   if(candidates.length!==1)throw Error('AMBIGUOUS_LABEL_VALUE')
   const value=candidates[0];return {label:l.text,raw:value.text,box:[l.box[0],Math.min(l.box[1],value.box[1]),value.box[2],Math.max(l.box[3],value.box[3])]}
  })
  if(fields.length>32||new Set(fields.map(f=>f.label)).size!==fields.length)throw Error('CONFLICTING_FIELDS')
  return {box:[Math.min(...fields.map(f=>f.box[0])),Math.min(...fields.map(f=>f.box[1])),Math.max(...fields.map(f=>f.box[2])),Math.max(...fields.map(f=>f.box[3]))],fields}
 })
}
export async function extractBankPdf(bytes:Uint8Array,input:PdfInput,timeoutMs:number=pdfLimits.timeoutMs){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>pdfLimits.timeoutMs)throw Error('INVALID_TIMEOUT')
 if(!Buffer.isBuffer(bytes)&&!(bytes instanceof Uint8Array)||bytes.length<100||bytes.length>pdfLimits.bytes)throw Error('PDF_SIZE_LIMIT')
 if(!input||Object.keys(input).some(k=>!['mechanism','url','capturedAt','documentComplete'].includes(k))||!['bp-catalog','bp-auctions'].includes(input.mechanism)||typeof input.documentComplete!=='boolean'||!Number.isFinite(Date.parse(input.capturedAt)))throw Error('INVALID_PDF_INPUT')
 sourceUrl(input.url,profiles[input.mechanism]);validateEvidenceLocator(input.url,profiles[input.mechanism].host);const raw=Buffer.from(bytes),syntax=raw.toString('latin1')
 // Conservative supported subset. Escaped PDF names are excluded so feature gates cannot be obfuscated.
 if(!/^%PDF-1\.[4-7]/.test(syntax)||!syntax.trimEnd().endsWith('%%EOF')||!syntax.includes('startxref')||/\/(?:Filter|Encrypt|JavaScript|JS|OpenAction|AA|EmbeddedFiles|Launch|XFA|ObjStm|RichMedia)\b|\/[A-Za-z]*#[0-9A-Fa-f]{2}/.test(syntax))throw Error('UNSUPPORTED_PDF')
 const xref=/startxref\s+(\d+)\s+%%EOF\s*$/.exec(syntax);if(!xref||syntax.slice(Number(xref[1]),Number(xref[1])+4)!=='xref')throw Error('INVALID_XREF')
 const decoded=await new Promise<string>((resolve,reject)=>{
  const child=spawn(process.execPath,['--max-old-space-size=256',join(process.cwd(),'lib/remates/adapters/pdf-worker.mjs')],{stdio:['pipe','pipe','pipe'],env:{NODE_ENV:"production"},shell:false});let out='',done=false
  const finish=(error?:Error)=>{if(done)return;done=true;clearTimeout(timer);child.kill('SIGKILL');error?reject(error):resolve(out)}
  const timer=setTimeout(()=>finish(Error('PDF_TIMEOUT')),timeoutMs)
  child.on('error',()=>finish(Error('PDF_DECODER_UNAVAILABLE')));child.stdout.on('data',c=>{out+=c.toString();if(Buffer.byteLength(out)>pdfLimits.outputBytes)finish(Error('PDF_OUTPUT_LIMIT'))});child.stderr.resume();child.on('close',code=>finish(code===0?undefined:Error('PDF_DECODING_FAILED')));child.stdin.on('error',()=>{});child.stdin.end(raw)
 })
 const pages=(JSON.parse(decoded) as {pages:Page[]}).pages;const issues:string[]=[]
 const fixture:SourceFixture={scope:'SAMPLE',capturedAt:input.capturedAt,pages:pages.map(p=>{let rows:ReturnType<typeof positioned>=[];try{rows=positioned(p,input.mechanism)}catch(e){issues.push(`PAGE_${p.number}:${e instanceof Error?e.message:'LAYOUT_FAILED'}`)}return {number:p.number,url:input.url,finalUrl:input.url,status:200,contentType:'application/vnd.twuanis.positioned-text+json',body:JSON.stringify({format:'positioned-label-rows-v1',rows}),terminal:false,next:null}})}
 // One document may have repeated page URL; parse each page independently then combine without pretending full inventory.
 const parts=fixture.pages.map(p=>parseFixture(input.mechanism,{...fixture,pages:[{...p,number:1}]}))
 const records=parts.flatMap((p,i)=>p.records.map(r=>({...r,page:i+1,fields:r.fields.map(f=>({...f,page:i+1}))})))
 const seen=new Map<string,string>();for(const r of records){if(r.sourceKey){const prior=seen.get(r.sourceKey);if(prior){const issue=prior===r.sha256?'DUPLICATE_OBSERVATION':'CONFLICTING_SOURCE_ID';issues.push(issue);for(const v of records.filter(v=>v.sourceKey===r.sourceKey))v.issues.push(issue)}seen.set(r.sourceKey,r.sha256)}}
 if(records.length>25||fixture.pages.reduce((n,p)=>n+Buffer.byteLength(p.body),0)>131072)throw Error('PDF_RECORD_LIMIT')
 const documentSha256=createHash('sha256').update(raw).digest('hex');for(const r of records)for(const f of r.fields){f.selector=`pdf:${documentSha256}/p:${r.page}/${f.selector}`;if(f.selector.length>256)throw Error('PDF_SELECTOR_LIMIT')}
 const result={adapter:input.mechanism,version:parts[0].version,contentHash:createHash('sha256').update(JSON.stringify(fixture)).digest('hex'),records,excluded:parts.reduce((n,p)=>n+p.excluded,0),issues:[...new Set([...issues,...parts.flatMap(p=>p.issues),...(!input.documentComplete?['INCOMPLETE_DOCUMENT']:[])])],status:records.length?'PARTIAL' as const:'FAILED' as const,inventoryComplete:false as const,retrievalEnabled:false as const,publicationEnabled:false as const}
 return {result,documentSha256,byteLength:raw.length,fixture,records,excluded:parts.reduce((n,p)=>n+p.excluded,0),issues:[...new Set([...issues,...parts.flatMap(p=>p.issues),...(!input.documentComplete?['INCOMPLETE_DOCUMENT']:[])])],status:records.length?'PARTIAL' as const:'FAILED' as const,inventoryComplete:false as const,retrievalEnabled:false as const,publicationEnabled:false as const}
}
