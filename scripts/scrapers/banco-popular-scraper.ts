/** Public Banco Popular inventory; no persistence to Twuanis, media downloads or authorization changes. */
import axios from 'axios';
import {load} from 'cheerio';
import Papa from 'papaparse';
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {parse,extractInventoryAreas,extractInventoryPdfAreas,normalizeAppraisalArea} from '../../lib/remates/adapters/bp-inventory';
const base='https://srv.bancopopular.fi.cr/Wb_BA_SharepointU/';
const out='outputs/scrapers/banco-popular';
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const money=(s:string)=>/^[$₡]|^(CRC|USD)/.test(s)?s.replace(/[^\d.,]/g,'').replace(/,/g,''):'';
const currency=(s:string)=>s.includes('₡')||s.includes('CRC')?'CRC':s.includes('$')||s.includes('USD')?'USD':'';
const log:any={started_at:new Date().toISOString(),pages:[],duplicates:0,excluded:[],errors:[],coverage:'Observed province counts and pagination only; not bank-wide completeness'};
let requests=0;
async function get(path:string,data?:Record<string,string>){
 if(++requests>350)throw Error('REQUEST_SAFETY_LIMIT');
 const url=new URL(path,base);if(url.origin!==new URL(base).origin||!url.pathname.startsWith(new URL(base).pathname))throw Error('DESTINATION_DENIED');
 await new Promise(r=>setTimeout(r,1000));
 const r=await axios({url:url.href,method:data?'POST':'GET',data:data?new URLSearchParams(data).toString():undefined,headers:{'User-Agent':'Twuanis public inventory research/1.0',...(data?{'Content-Type':'application/x-www-form-urlencoded'}:{})},timeout:30000,maxRedirects:0,maxContentLength:15*1024*1024,responseType:'text'});
 if(!String(r.headers['content-type']).includes('text/html'))throw Error('UNEXPECTED_MIME');
 const $=load(r.data);$('img[src^="data:"]').remove();$('script,style').remove();
 return $.html();
}
/** Reference-only extraction; never fetch src values or retain embedded image bytes. */
function propertyImageReferences(html:string,sourceUrl:string,expectedId:string){
 const d=load(html),url=new URL(sourceUrl);
 if(url.origin!==new URL(base).origin||url.searchParams.get('codBien')!==expectedId||d('#codBienHidden').attr('value')!==expectedId)throw Error('IMAGE_PROPERTY_IDENTITY_MISMATCH');
 const images:string[]=[],rejected:{reason:string}[]=[];let embedded=0;
 d('#carousel-example-generic .carousel-inner .item img').each((_,e)=>{
   const raw=d(e).attr('src')||d(e).attr('data-src')||'';
   if(/^data:/i.test(raw)){embedded++;return;}
   if(!raw){rejected.push({reason:'IMAGE_REFERENCE_MISSING'});return;}
   try{const image=new URL(raw,sourceUrl);if(image.protocol!=='https:'||image.hostname!=='srv.bancopopular.fi.cr'||image.username||image.password||(image.port&&image.port!=='443')){rejected.push({reason:'IMAGE_DESTINATION_DENIED'});return;}
     if(!images.includes(image.href))images.push(image.href);
   }catch{rejected.push({reason:'INVALID_IMAGE_URL'});}
 });
 const slides=d('#carousel-example-generic .carousel-inner .item').length;
 return {images,embedded,slides,rejected,status:images.length?'ORIGINAL_URL_REFERENCES':embedded?'EMBEDDED_ONLY_NO_EXTERNAL_URL':slides?'SANITIZED_SLIDES_NO_RETAINED_URL':'NO_SOURCE_IMAGES'};
}
function refreshImageReferences(){
 const file=out+'/banco-popular-raw.csv',before=readFileSync(file,'utf8'),parsed=Papa.parse<Record<string,string>>(before,{header:true,skipEmptyLines:true});
 if(parsed.errors.length||parsed.data.length!==102||new Set(parsed.data.map(r=>r.codBien)).size!==102)throw Error('EXPECTED_102_UNIQUE_PROPERTIES');
 const records=parsed.data.map(row=>{const html=readFileSync(out+'/evidence/detail-'+row.codBien+'.html','utf8');if(createHash('sha256').update(html).digest('hex')!==row.source_sha256)throw Error('CAPTURE_HASH_MISMATCH '+row.codBien);const result=propertyImageReferences(html,row.source_url,row.codBien);return {codBien:row.codBien,sourceUrl:row.source_url,captureSHA256:row.source_sha256,...result};});
 const updated:Record<string,string>[]=parsed.data.map((row,n)=>({...row,images:JSON.stringify(records[n].images)}));
 for(let n=0;n<updated.length;n++)for(const key of Object.keys(parsed.data[n]))if(key!=='images'&&updated[n][key]!==parsed.data[n][key])throw Error('ORIGINAL_ATTRIBUTE_CHANGED');
 const csv=Papa.unparse(updated)+'\r\n';if(updated.some((row,n)=>row.images!==parsed.data[n].images))writeFileSync(file,csv);
 const after=readFileSync(file,'utf8'),check=Papa.parse<Record<string,string>>(after,{header:true,skipEmptyLines:true}).data;
 if(check.length!==102)throw Error('ROW_COUNT_CHANGED');for(let n=0;n<check.length;n++)for(const key of Object.keys(parsed.data[n]))if(key!=='images'&&check[n][key]!==parsed.data[n][key])throw Error('PERSISTED_ATTRIBUTE_CHANGED');
 const report={propertiesInspected:102,propertiesWithVerifiedImageUrls:records.filter(r=>r.images.length).length,propertiesWithoutVerifiedImageUrls:records.filter(r=>!r.images.length).length,totalVerifiedImageUrls:records.reduce((n,r)=>n+r.images.length,0),imageBytesDownloaded:0,storageUploads:0,sourceRequests:0,originalPropertyData:'UNCHANGED',beforeCSVHash:createHash('sha256').update(before).digest('hex'),afterCSVHash:createHash('sha256').update(after).digest('hex'),records,scope:'Reprocessed exact previously sanitized captured HTML only; counts verify original source references, not live image availability'};
 writeFileSync(out+'/image-reference-evidence.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,records:undefined}));
}
const characteristicPatterns:Record<string,RegExp>={
 raw_property_area:/(?:terreno valorado|área (?:del )?terreno|terreno de)\s*:?\s*([\d.,]+\s*m[²2])/i,
 raw_construction_area:/(?:construcci[oó]n valorada|área (?:de )?construcci[oó]n)\s*:?\s*([\d.,]+\s*m[²2])/i,
 raw_bedrooms:/\b((?:\d+|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+dormitorios?)\b/i,
 raw_bathrooms:/\b((?:\d+|un|uno|una|dos|tres|cuatro|cinco|seis)\s+baños?)\b/i,
 raw_parking:/\b((?:no cuenta con (?:garaje|parqueo)|sin (?:garaje|parqueo)|cochera|garaje|parqueo)[^.;]{0,80})/i
};
function inventoryFinancial(text:string){const t=clean(text);const f:Record<string,string>={};for(const [key,pattern]of Object.entries({'Precio Real':/Precio Real:\s*((?:₡|\$|CRC|USD)\s*[\d,.]+)/,'Precio Venta':/Precio de Venta:\s*((?:₡|\$|CRC|USD)\s*[\d,.]+)/})){const value=t.match(pattern)?.[1];if(value)f[key]=value;}return f;}
function enrich(row:any){const file=out+'/evidence/detail-'+row.codBien+'.html';
 const areas=extractInventoryAreas(readFileSync(file,'utf8'),row.codBien);
 for(const dimension of ['property_area','construction_area'])if(!row['raw_'+dimension]&&areas[dimension].raw)row['raw_'+dimension]=areas[dimension].raw;
 row.area_source_evidence=JSON.stringify({captureSHA256:row.source_sha256,sourceUrl:row.source_url,propertyId:row.codBien,fields:areas});
 for(const [key,pattern] of Object.entries(characteristicPatterns)){if(!row[key])row[key]=[...row.description.matchAll(new RegExp(pattern.source,'gi'))].map(m=>m[1]).join(' | ');}return row;}
async function main(){
 mkdirSync(out+'/evidence',{recursive:true});
 const root=await get(base);const category=await get('Propiedad/ChangeCategory',{codCategoria:'255'});const $=load(category);
 const categories=$('#dropCategorias option').toArray().map(e=>({id:$(e).attr('value')!,label:clean($(e).text())})).filter(x=>['1','2','3','4','6','7','9'].includes(x.id));
 const provinces=$('#dropProvincias option').toArray().map(e=>({id:$(e).attr('value')!,label:clean($(e).text())})).filter(x=>/^\d+$/.test(x.id));
 if(provinces.length!==7)throw Error('PROVINCE_SELECTOR_CHANGED');log.provinces=provinces;
 const discovered=new Map<string,{url:string,type:string,financial:Record<string,string>}>();
 for(const cat of categories){const categoryPage=load(await get('Propiedad/ChangeCategory',{codCategoria:cat.id}));const categoryProvinces=categoryPage('#dropProvincias option').toArray().map(e=>({id:categoryPage(e).attr('value')!,label:clean(categoryPage(e).text())})).filter(x=>/^\d+$/.test(x.id));for(const p of categoryProvinces){let pending=[1],seen=new Set<number>(),found=new Set<string>();
 while(pending.length){const page=pending.shift()!;if(seen.has(page))continue;if(page>30)throw Error('PAGE_SAFETY_LIMIT');seen.add(page);
 const html=await get(page===1?'Propiedad/ChangeProvince':'Propiedad/ChangePage',{codCategoria:cat.id,codProvincia:p.id,...(page===1?{}:{page:String(page)})});const d=load(html);
 writeFileSync(`${out}/evidence/category-${cat.id}-province-${p.id}-page-${page}.html`,html);
 d('a[href*="DetallePropiedad?"]').each((_,e)=>{const url=new URL(d(e).attr('href')!,base);const id=url.searchParams.get('codBien')!;const card=d(e).closest('.property-item');let type=clean(card.find('.tipo').text());if(!type)type=clean(d(e).parent().parent().find('.tipo').text());if(!/^\d+$/.test(id))throw Error('INVALID_SOURCE_ID');found.add(id);if(discovered.has(id))log.duplicates++;else discovered.set(id,{url:url.href,type:cat.label,financial:inventoryFinancial(d(e).parent().parent().text())});});
 d('.pagination a[href]').each((_,e)=>{const n=Number(new URL(d(e).attr('href')!,base).searchParams.get('page'));if(n>0&&!seen.has(n)&&!pending.includes(n))pending.push(n);});
 log.pages.push({category:cat.id,province:p.id,page,ids:[...found],terminal:pending.length===0});
 }
 const expected=Number(p.label.match(/\((\d+)\)/)?.[1]);if(found.size!==expected)log.errors.push({province:p.id,expected,actual:found.size});console.log('Category',cat.id,'province',p.id,'records',found.size);
 }
 }
 const rows:any[]=[];
 for(const [id,card] of discovered){
 const html=await get(card.url);const d=load(html);const fields:Record<string,string>={};
 d('p > strong').each((_,e)=>{const label=clean(d(e).text()).replace(/:$/,'').trim();const clone=d(e).parent().clone();clone.find('strong').remove();fields[label]=clean(clone.text());});
 for(const [k,v]of Object.entries(card.financial)){if(!fields[k])fields[k]=v;}
 const heading=clean(d('h4').first().text());const expediente=heading.match(/Expediente\s+(.+?)\s*-\s*Folio/)?.[1]||'';const folio=heading.match(/Folio\s+(.+)$/)?.[1]||'';
 const type=card.type||clean(d('.tipo').first().text());
 if(/veh[ií]culo|maquinaria|otros bienes/i.test(type)){log.excluded.push({id,type});continue;}
 if(!type||!expediente||!folio)throw Error('REQUIRED_IDENTITY_OR_TYPE_MISSING '+id);
 const description=clean(d('h3').filter((_,e)=>clean(d(e).text())==='Descripción').parent().parent().find('p').text());
 const normalized='<article><dl>'+Object.entries({codBien:id,'Tipo de bien':type,Expediente:expediente,Folio:folio,...Object.fromEntries(Object.entries(fields).filter(([k])=>['Precio Real','Precio Venta','Descuento','Cuota Aproximada'].includes(k)))}).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')+'</dl></article>';
 const observed_at=new Date().toISOString();const adapted=parse({capturedAt:observed_at,scope:'SAMPLE',pages:[{url:card.url,finalUrl:card.url,status:200,contentType:'text/html',body:normalized,number:1,terminal:true,next:null}]});
 if(adapted.records.length!==1)throw Error('ADAPTER_REJECTED '+id);
 const area=(label:string,pattern:RegExp)=>fields[label]||description.match(pattern)?.[1]||'';
 rows.push({observation_id:randomUUID(),observed_at,source_name:'banco-popular',source_mechanism:'bp-inventory',source_listing_id:id,codBien:id,expediente,folio,source_url:card.url,transaction_type:'sale',property_type:type,province:fields['Provincia']||'',canton:fields['Cantón']||'',district:fields['Distrito']||'',raw_property_area:area('Área Terreno',/(?:área (?:del )?terreno|terreno de)\s*:?\s*([\d.,]+\s*m[²2])/i),raw_construction_area:area('Área Construcción',/construcci[oó]n valorada\s*:\s*([\d.,]+\s*m[²2])/i),raw_bedrooms:fields['Dormitorios']||'',raw_bathrooms:fields['Baños']||'',raw_parking:fields['Parqueos']||'',description,selling_price:money(fields['Precio Venta']||''),reference_amount:money(fields['Precio Real']||''),appraisal_amount:money(fields['Precio Avalúo']||''),discount_percent:(fields['Descuento']||'').replace(/[^\d.]/g,''),currency:currency(fields['Precio Venta']||fields['Precio Real']||''),raw_selling_price:fields['Precio Venta']||'',raw_reference_amount:fields['Precio Real']||'',raw_discount:fields['Descuento']||'',raw_installment_amount:fields['Cuota Aproximada']||'',images:JSON.stringify(propertyImageReferences(html,card.url,id).images),raw_source_fields:JSON.stringify(fields),adapter_evidence:JSON.stringify(adapted.records[0].fields),source_sha256:createHash('sha256').update(html).digest('hex')});
 writeFileSync(`${out}/evidence/detail-${id}.html`,html);if(rows.length%10===0)console.log('Extracted',rows.length);
 }
 rows.forEach(enrich);
 writeFileSync(out+'/banco-popular-raw.csv',Papa.unparse(rows)+'\r\n');log.finished_at=new Date().toISOString();log.requests=requests;log.discovered=discovered.size;log.rows=rows.length;log.inventory_pages=log.pages.length;log.csv_sha256=createHash('sha256').update(Papa.unparse(rows)+'\r\n').digest('hex');writeFileSync(out+'/run-evidence.json',JSON.stringify(log,null,2));console.log(JSON.stringify({rows:rows.length,pages:log.pages.length,errors:log.errors,excluded:log.excluded}));
}
/** Offline appraisal evidence mode. Uses previously observed document lookup and canonical lineage;
 * no acquisition requests, CSV updates, database commands, admission or publication. */
async function extractPdfAreaReferences(){
 const argument=(name:string)=>{const value=process.argv.find(x=>x.startsWith(name+'='))?.slice(name.length+1);if(!value)throw Error('EXPLICIT_PDF_EVIDENCE_ARGUMENT_REQUIRED '+name);return value};
 const lineage=JSON.parse(readFileSync(argument('--pdf-lineage'),'utf8')) as {codBien:string;productionListingId:string;productionPropertyId:string;sourceUrl:string;sourceHTML:string;sourceHTMLSHA256:string;documentUrl:string;documentSHA256:string;documentFolioLines:string[]}[];
 const documents=JSON.parse(readFileSync(argument('--pdf-documents'),'utf8')) as {codBien:string;listingId:string;propertyId:string;detailUrl:string;lookup:{Documento:string;CodError:number};documentUrl:string;path:string;sha256:string;http:number}[];
 const target=argument('--pdf-area-output');
 const csv=readFileSync(out+'/banco-popular-raw.csv','utf8');const parsed=Papa.parse<Record<string,string>>(csv,{header:true,skipEmptyLines:true});
 if(parsed.errors.length||parsed.data.length!==102||new Set(parsed.data.map(r=>r.codBien)).size!==102)throw Error('EXPECTED_102_UNIQUE_PROPERTIES');
 if(!Array.isArray(lineage)||!Array.isArray(documents)||lineage.length!==15||documents.length!==15||new Set(lineage.map(r=>r.codBien)).size!==15||new Set(documents.map(r=>r.codBien)).size!==15||new Set(lineage.map(r=>r.productionListingId)).size!==15||new Set(lineage.map(r=>r.productionPropertyId)).size!==15)throw Error('EXPECTED_15_VERIFIED_ASSOCIATIONS');
 if(target===out+'/banco-popular-raw.csv')throw Error('SOURCE_CSV_OVERWRITE_DENIED');
 const records=[];
 for(const document of documents){
  const link=lineage.find(r=>r.codBien===document.codBien),row=parsed.data.find(r=>r.codBien===document.codBien);
  if(!link||!row||row.source_mechanism!=='bp-inventory'||document.http!==200||document.lookup?.CodError!==0||row.source_url!==link.sourceUrl||row.source_sha256!==link.sourceHTMLSHA256)throw Error('PDF_SOURCE_ASSOCIATION_MISMATCH');
  const verified={codBien:link.codBien,listingId:link.productionListingId,propertyId:link.productionPropertyId,sourceUrl:link.sourceUrl,sourceSHA256:link.sourceHTMLSHA256,documentUrl:link.documentUrl,documentSHA256:link.documentSHA256,documentName:document.lookup.Documento,folio:row.folio,documentFolio:link.documentFolioLines?.length===1?link.documentFolioLines[0].match(/FOLIO REAL Nº\s*([A-Z\d\s\-/]+)/)?.[1]?.trim()||'':'',observedAt:row.observed_at};
  const input={...verified,listingId:document.listingId,propertyId:document.propertyId,sourceUrl:document.detailUrl,documentUrl:document.documentUrl,documentSHA256:document.sha256};
  const evidence=await extractInventoryPdfAreas(readFileSync(document.path),input,verified,readFileSync(link.sourceHTML,'utf8'));
  records.push({...evidence,advertisedMeasurements:{rawPropertyArea:row.raw_property_area,rawConstructionArea:row.raw_construction_area},advertisedConstructionDiscrepancy:!!row.raw_construction_area&&normalizeAppraisalArea(row.raw_construction_area).amount!==evidence.measurements[2].normalizedM2});
 }
 if(readFileSync(out+'/banco-popular-raw.csv','utf8')!==csv)throw Error('ORIGINAL_SOURCE_CSV_CHANGED');
 const result={records,documentsProcessed:records.length,sourceRequests:0,canonicalWrites:0,receiptsCreated:0,canonicalAdmission:false,publicationEnabled:false,sourceUse:'SOURCE-USE UNRESOLVED',sourceCSVHash:createHash('sha256').update(csv).digest('hex')};
 // Do not permit an evidence output path to overwrite a source, document, or application file.
 const {resolve}=await import('node:path');const {existsSync}=await import('node:fs');
 if(existsSync(target)||resolve(target).startsWith(resolve(process.cwd())+'/'))throw Error('NEW_EXTERNAL_EVIDENCE_OUTPUT_REQUIRED');
 writeFileSync(target,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,records:undefined}));
}

if(process.argv.includes('--pdf-area-references-only')){extractPdfAreaReferences().catch(e=>{console.error(e.message);process.exitCode=1;});}else if(process.argv.includes('--area-references-only')){
 const parsed=Papa.parse<Record<string,string>>(readFileSync(out+'/banco-popular-raw.csv','utf8'),{header:true,skipEmptyLines:true});
 if(parsed.errors.length||parsed.data.length!==102||new Set(parsed.data.map(r=>r.codBien)).size!==102)throw Error('EXPECTED_102_UNIQUE_PROPERTIES');
 const before=JSON.parse(JSON.stringify(parsed.data))as Record<string,string>[];
 for(const row of parsed.data){const html=readFileSync(out+'/evidence/detail-'+row.codBien+'.html','utf8');if(createHash('sha256').update(html).digest('hex')!==row.source_sha256)throw Error('CAPTURE_HASH_MISMATCH');
  const areas=extractInventoryAreas(html,row.codBien);for(const dimension of ['property_area','construction_area'])if(!row['raw_'+dimension]&&areas[dimension].raw)row['raw_'+dimension]=areas[dimension].raw;
  row.area_source_evidence=JSON.stringify({captureSHA256:row.source_sha256,sourceUrl:row.source_url,propertyId:row.codBien,fields:areas});
 }
 for(let i=0;i<before.length;i++)for(const key of Object.keys(before[i]))if(!['raw_property_area','raw_construction_area','area_source_evidence'].includes(key)&&before[i][key]!==parsed.data[i][key])throw Error('UNRELATED_SOURCE_ATTRIBUTE_CHANGED');
 const target=process.argv.find(x=>x.startsWith('--area-output='))?.slice('--area-output='.length);if(!target)throw Error('EXPLICIT_AREA_OUTPUT_REQUIRED');
 writeFileSync(target,Papa.unparse(parsed.data)+'\r\n');console.log('Area references reprocessed for102 exact identities; no source requests. Output '+target);
}else if(process.argv.includes('--image-references-only')){refreshImageReferences();}else if(process.argv.includes('--verify-image-extraction')){
 const assert=require('node:assert/strict'),url=base+'Propiedad/DetallePropiedad?codBien=123&codCategoria=2';
 const html='<input id="codBienHidden" value="123"><img src="/logo.png"><div id="carousel-example-generic"><div class="carousel-inner"><div class="item"><img src="../Public/a.jpg"><img src="../Public/a.jpg"><img src="data:image/png;base64,TEST"><img src="https://other.invalid/x.jpg"></div></div></div><div class="advertisement"><img src="/ad.jpg"></div>';
 const result=propertyImageReferences(html,url,'123');assert.deepEqual(result.images,[base+'Public/a.jpg']);assert.equal(result.embedded,1);assert.equal(result.rejected.length,1);assert.throws(()=>propertyImageReferences(html,url,'124'));console.log('PASS original references, identity mismatch denial, duplicates, inline media exclusion, foreign host denial, logo/ad exclusion');
}else if(process.argv.includes('--reparse')){const rows=Papa.parse(readFileSync(out+'/banco-popular-raw.csv','utf8'),{header:true,skipEmptyLines:true}).data as any[];const inventory=new Map<string,Record<string,string>>();for(const file of readdirSync(out+'/evidence').filter(x=>x.startsWith('category-'))){const d=load(readFileSync(out+'/evidence/'+file,'utf8'));d('a[href*=\"DetallePropiedad?\"]').each((_,e)=>{const id=new URL(d(e).attr('href')!,base).searchParams.get('codBien')!;inventory.set(id,inventoryFinancial(d(e).parent().parent().text()));});}for(const row of rows){const f=inventory.get(row.codBien)||{};if(!row.raw_reference_amount&&f['Precio Real']){row.raw_reference_amount=f['Precio Real'];row.reference_amount=money(f['Precio Real']);if(!row.currency)row.currency=currency(f['Precio Real']);}row.raw_inventory_financial=JSON.stringify(f);}rows.forEach(enrich);const csv=Papa.unparse(rows)+'\r\n';writeFileSync(out+'/banco-popular-raw.csv',csv);const run=JSON.parse(readFileSync(out+'/run-evidence.json','utf8'));run.csv_sha256=createHash('sha256').update(csv).digest('hex');run.characteristic_policy='Explicit descriptive text only; raw narrative counts may describe multiple structures and are not canonical numeric totals';writeFileSync(out+'/run-evidence.json',JSON.stringify(run,null,2));}else main().catch(e=>{console.error(e.message);process.exitCode=1;});
