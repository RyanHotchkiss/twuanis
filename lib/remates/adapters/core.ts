import {load} from 'cheerio'
import {validateEvidenceLocator} from '../source-locator'
import {createHash} from 'node:crypto'
import {profiles,limits,adapterVersion,type AdapterId,type SourceFixture,type AdapterResult,type ParsedRecord,type Field,type Profile} from './contracts'
const hash=(s:string)=>createHash('sha256').update(s,'utf8').digest('hex')
const norm=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es')
const realEstate=new Set(['casa','casas','apartamento','apartamentos','lote','lotes','terreno','terrenos','finca','fincas','local comercial','bodega','edificio','inmueble','bienes inmuebles'])
const vehicles=new Set(['vehículo','vehículos','vehiculo','vehiculos','automóvil','automoviles','motocicleta','maquinaria','equipo','embarcación'])
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function sourceUrl(raw:string,p:Profile){
 if(typeof raw!=='string'||raw.length>2048||/[\s\\]/.test(raw))throw Error('UNSAFE_URL')
 const u=new URL(raw);if(u.protocol!=='https:'||u.hostname!==p.host||u.username||u.password||u.port||u.hash||!u.pathname.startsWith(p.prefix)||(p.id==='bac'&&u.search))throw Error('UNSAFE_URL')
 return u
}
type Pair={label:string;raw:string;location:string}
function pairs(html:string):Pair[]{const $=load(html),out:Pair[]=[]; $('script,style,iframe,object').remove();
 $('dt').each((i,e)=>{const d=$(e).next();if(d.is('dd'))out.push({label:$(e).text().trim(),raw:d.text().trim(),location:`dt:${i}`})});
 $('tr').each((i,e)=>{const c=$(e).children('th,td');if(c.length===2)out.push({label:c.eq(0).text().trim(),raw:c.eq(1).text().trim(),location:`tr:${i}`})});return out}
function rows(body:string,p:Profile):{raw:string;pairs:Pair[]}[]{
 if(p.mechanism==='HTML'){const $=load(body);const candidates=$('article, [data-remate-record], .property-detail');if(candidates.length>limits.records)throw Error('RECORD_LIMIT');
 if(candidates.length)return candidates.toArray().map(e=>({raw:$.html(e),pairs:pairs($.html(e))}));return [{raw:body,pairs:pairs(body)}]}
 // Positioned PDF text must be supplied by an authorized extraction step; line-order pairing is forbidden.
 const doc=JSON.parse(body);if(!doc||Object.keys(doc).some(k=>!['format','rows'].includes(k))||doc.format!=='positioned-label-rows-v1'||!Array.isArray(doc.rows)||doc.rows.length>limits.records)throw Error('LAYOUT_CHANGED')
 return doc.rows.map((r:unknown)=>{if(!r||typeof r!=='object'||Array.isArray(r))throw Error('LAYOUT_CHANGED');const x=r as Record<string,unknown>;
 if(Object.keys(x).some(k=>!['box','fields'].includes(k))||!Array.isArray(x.box)||x.box.length!==4||x.box.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<0)||x.box[2]<=x.box[0]||x.box[3]<=x.box[1]||!Array.isArray(x.fields)||x.fields.length>limits.fields)throw Error('LAYOUT_CHANGED');
 const items=x.fields.map((f:unknown,i:number)=>{if(!f||typeof f!=='object'||Array.isArray(f))throw Error('LAYOUT_CHANGED');const a=f as Record<string,unknown>;if(Object.keys(a).some(k=>!['label','raw','box'].includes(k))||typeof a.label!=='string'||typeof a.raw!=='string'||!Array.isArray(a.box)||a.box.length!==4||a.box.some((n,j)=>typeof n!=='number'||!Number.isFinite(n)||n<(x.box as number[])[j%2]||n>(x.box as number[])[j%2+2])||a.box[2]<=a.box[0]||a.box[3]<=a.box[1])throw Error('LAYOUT_CHANGED');return {label:a.label,raw:a.raw,location:`rowbox:${JSON.stringify(x.box)}/field:${i}/box:${JSON.stringify(a.box)}`}});
 return {raw:JSON.stringify(x),pairs:items}})
}
function parseRecord(r:{raw:string;pairs:Pair[]},p:Profile,page:number):ParsedRecord|'EXCLUDED'{
 if(Buffer.byteLength(r.raw)>limits.recordBytes||r.pairs.length>limits.fields)throw Error('RECORD_LIMIT');const issues:string[]=[],fields:Field[]=[];
 const values=(label:string)=>r.pairs.filter(a=>norm(a.label)===norm(label)),get=(label:string)=>values(label).length===1?values(label)[0].raw:null;
 const kind=get('Tipo de bien');if(kind&&vehicles.has(norm(kind)))return 'EXCLUDED';if(!kind||!realEstate.has(norm(kind)))issues.push('PROPERTY_TYPE_UNRESOLVED');
 if(p.id==='bac'&&norm(get('País')||'')!=='costa rica')return 'EXCLUDED';
 for(const name of p.required)if(!get(name))issues.push('MISSING_OR_CONFLICTING:'+name);
 const id=p.identifiers.map(get).find(x=>x&&x.trim())||null;let sourceKey=id?`${p.keyPrefix}:${id}`:null;
 if(id&&(id.length>100||/[\x00-\x1f]/.test(id)))sourceKey=null;
 if(!sourceKey)issues.push('SOURCE_ID_UNRESOLVED');if(p.id==='bac')issues.push('STABLE_CMS_ID_UNVERIFIED');
 const known=new Map(Object.entries(p.financial).map(([k,v])=>[norm(k),v]));const counts=new Map<string,number>();
 for(const f of r.pairs){if(f.label.length>256||f.raw.length>1024||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(f.raw))throw Error('FIELD_LIMIT');
 const name=norm(f.label),ordinal=counts.get(name)||0;counts.set(name,ordinal+1);const financial=known.get(name),type=financial||(/folio|expediente|código|codbien/.test(name)?'IDENTIFIER':/provincia|cantón|canton|distrito/.test(name)?'GEOGRAPHIC_EVIDENCE':/estado|disponibilidad|fecha|hora|remate/.test(name)?'DISPOSITION_EVIDENCE':'CHARACTERISTIC');
 // Keep original monetary syntax: no separator guessing, FX, discount arithmetic or financial selection.
 const currencies=[...new Set([...f.raw.matchAll(/\b(CRC|USD)\b|₡|\$/g)].map(m=>m[0]==='₡'?'CRC':m[0]))];
 const currency=financial&&financial!=='DISCOUNT_PERCENT'&&currencies.length===1&&['CRC','USD'].includes(currencies[0])?currencies[0]:null;let validation:Field['validation']=!f.raw?'MISSING':values(f.label).length>1?'AMBIGUOUS':'VALID';
 if(financial&&((financial!=='DISCOUNT_PERCENT'&&!currency)||currencies.length>1||/\d[,.]\d{3}(?:\D|$)/.test(f.raw)||!/[0-9]/.test(f.raw)))validation='AMBIGUOUS';
 if(financial==='DISCOUNT_PERCENT'&&(!f.raw.includes('%')||currencies.length))validation='AMBIGUOUS';
 if(validation==='AMBIGUOUS')issues.push('AMBIGUOUS:'+f.label);
 fields.push({path:`bank.${name.replace(/[^a-z0-9]+/g,'_').slice(0,70)}_${hash(name).slice(0,12)}`,ordinal,label:f.label,raw:f.raw||null,unit:financial==='DISCOUNT_PERCENT'?'%':/m²|m2/.test(f.raw)?'m²':null,currency,page,selector:f.location,validation,kind:type});
 }
 for(const [label,kind] of Object.entries(p.financial))if(!values(label).length){const name=norm(label);fields.push({path:`bank.${name.replace(/[^a-z0-9]+/g,'_').slice(0,70)}_${hash(name).slice(0,12)}`,ordinal:0,label,raw:null,unit:kind==='DISCOUNT_PERCENT'?'%':null,currency:null,page,selector:'missing-label',validation:'MISSING',kind})}
 if(fields.length>limits.fields||fields.some(f=>f.selector.length>256))throw Error('FIELD_LIMIT');
 if(!r.pairs.length)throw Error('LAYOUT_CHANGED');
 return {sourceKey,identityStatus:sourceKey?'SOURCE_LOCAL_ONLY':'UNRESOLVED',raw:r.raw,fields,issues,sha256:hash(r.raw),page}
}
export function parseFixture(id:AdapterId,input:SourceFixture):AdapterResult{
 const p=Object.hasOwn(profiles,id)?profiles[id]:undefined;if(!p)throw Error('UNKNOWN_ADAPTER');if(!input||Object.keys(input).some(k=>!['capturedAt','scope','pages'].includes(k))||input.scope!=='SAMPLE'||typeof input.capturedAt!=='string'||!/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(input.capturedAt)||!Number.isFinite(Date.parse(input.capturedAt))||!Array.isArray(input.pages)||!input.pages.length||input.pages.length>limits.pages)throw Error('INVALID_FIXTURE');
 const records:ParsedRecord[]=[],issues:string[]=[],seen=new Map<string,string>();let excluded=0,total=0,priorNext:string|null=null;const urls=new Set<string>();
 for(const [index,page] of input.pages.entries()){
 if(!page||Object.keys(page).some(k=>!['url','finalUrl','status','contentType','body','number','terminal','next'].includes(k))||typeof page.body!=='string'||page.number!==index+1||typeof page.terminal!=='boolean'||!(page.next===null||typeof page.next==='string')||typeof page.contentType!=='string')throw Error('INVALID_PAGE');
 const u=sourceUrl(page.url,p);sourceUrl(page.finalUrl,p);if(urls.has(u.href))throw Error('PAGINATION_CYCLE');urls.add(u.href);total+=Buffer.byteLength(page.body);if(total>limits.totalBytes||Buffer.byteLength(page.body)>limits.pageBytes)throw Error('BODY_LIMIT');
 if(index&&priorNext!==u.href)issues.push('PAGINATION_GAP');if(page.status!==200||page.url!==page.finalUrl){issues.push(page.url!==page.finalUrl?'REDIRECTED_NOT_DETAIL':'HTTP_FAILURE');continue}
 if(!page.contentType.startsWith(p.mechanism==='HTML'?'text/html':'application/vnd.twuanis.positioned-text+json')){issues.push('CONTENT_TYPE_CHANGED');continue}
 if(page.next){sourceUrl(page.next,p);if(page.terminal)issues.push('TERMINAL_WITH_NEXT')}
 if(index<input.pages.length-1&&(page.terminal||!page.next))issues.push('EARLY_TERMINAL');
 priorNext=page.next===null?null:sourceUrl(page.next,p).href;
 try{for(const row of rows(page.body,p)){const r=parseRecord(row,p,page.number);if(r==='EXCLUDED'){excluded++;continue}if(records.length>=limits.records)throw Error('RECORD_LIMIT');if(r.sourceKey){const old=seen.get(r.sourceKey);if(old===r.sha256){issues.push('DUPLICATE_OBSERVATION');continue}if(old){issues.push('CONFLICTING_SOURCE_ID');r.issues.push('CONFLICTING_SOURCE_ID');for(const prior of records.filter(x=>x.sourceKey===r.sourceKey))prior.issues.push('CONFLICTING_SOURCE_ID')}seen.set(r.sourceKey,r.sha256)}records.push(r)}}catch(e){if(e instanceof Error&&['RECORD_LIMIT','FIELD_LIMIT'].includes(e.message))throw e;issues.push('LAYOUT_CHANGED')}
 }
 const last=input.pages.at(-1)!;if(!last.terminal||last.next)issues.push('INCOMPLETE_PAGINATION');if(!records.length)issues.push(excluded?'NO_REAL_ESTATE':'LAYOUT_CHANGED');
 return {adapter:id,version:adapterVersion(id),contentHash:hash(JSON.stringify(input)),records,excluded,issues:[...new Set(issues)],status:!records.length?'FAILED':issues.length||records.some(r=>r.issues.length)?'PARTIAL':'PARSED',inventoryComplete:false,retrievalEnabled:false,publicationEnabled:false}
}
/** R-04-compatible retention projection only. Source URL query handling is fail-closed, never rewritten. */
export function observationDraft(result:AdapterResult,record:ParsedRecord,input:SourceFixture,run:string){
 if(result.contentHash!==hash(JSON.stringify(input))||result.version!==adapterVersion(result.adapter)||record.sha256!==hash(record.raw)||!uuid.test(run)||!result.records.includes(record)||record.issues.some(x=>x.startsWith('MISSING')||['SOURCE_ID_UNRESOLVED','PROPERTY_TYPE_UNRESOLVED','CONFLICTING_SOURCE_ID','LAYOUT_CHANGED'].includes(x))||!record.sourceKey)throw Error('UNRESOLVED_RECORD');
 const page=input.pages.find(p=>p.number===record.page)!;const u=sourceUrl(page.url,profiles[result.adapter]);validateEvidenceLocator(page.url,u.hostname);
 const draft={key:hash(`${result.version}:${result.contentHash}:${record.page}:${record.sourceKey}`),record_key:record.sourceKey,run,retrieved_at:input.capturedAt,published_at:null,updated_at:null,url:page.url,parser_version:result.version,parse_status:'PARSED',raw:record.raw,fields:record.fields.map(({kind:_,...f})=>({...f,validation:f.validation==='AMBIGUOUS'?'UNVALIDATED':f.validation}))};if(Buffer.byteLength(JSON.stringify(draft))>14000)throw Error('R04_CONTRACT_LIMIT');return draft
}
