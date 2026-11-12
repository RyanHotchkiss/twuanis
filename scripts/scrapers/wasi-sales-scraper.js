#!/usr/bin/env node
'use strict'

/*
 * Public, local-only Wasi extractor. Configuration contains the agency identity
 * and sale start URL; no Twuanis admission, database, or publication action is
 * performed here.
 */
const fs=require('node:fs/promises')
const path=require('node:path')
const {load}=require('cheerio')

const defaultConfig=path.join(__dirname,'wasi-sites','devop-sales.json')
const configPath=process.argv[2]||defaultConfig
const outputRoot=process.argv[3]||path.join(process.cwd(),'work',process.argv[2]?'wasi-sales-extraction':'devop-wasi-sales')
const selectionPath=process.argv[4]||null
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms))
const clean=value=>String(value??'').replace(/\s+/g,' ').trim()
const unique=values=>[...new Set(values.filter(Boolean))]
const now=()=>new Date().toISOString()
const normalize=value=>clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim()
const unquote=value=>String(value??'').trim().replace(/^['"]|['"]$/g,'')

function aliases(term){return [term.term_name,term.term_name_en,term.term_name_es,term.slug,term.slug_en,term.slug_es].filter(Boolean).map(normalize)}
function sourceAliases(value,type){
 const normalized=normalize(value);if(!normalized)return []
 const result=new Set([normalized])
 if(type==='province')result.add(normalized.replace(/\bprovincia\b/g,'').trim())
 if(type==='canton')result.add(normalized.replace(/\bcanton\b|\bcapital\b/g,'').replace(/\s+/g,' ').trim())
 if(type==='district')result.add(normalized.replace(/\bcentro\b/g,'').replace(/\s+/g,' ').trim())
 return [...result].filter(Boolean)
}
function matchTerms(terms,value,type,parentId){return value?terms.filter(term=>term.term_type===type&&(parentId===undefined||Number(term.parent_id)===Number(parentId))&&sourceAliases(value,type).some(alias=>aliases(term).includes(alias))):[]}
function resolveGeography(terms,raw){
 const pm=matchTerms(terms,raw.province,'province'),province=pm.length===1?pm[0]:null
 const cm=province?matchTerms(terms,raw.canton,'canton',province.id):[],canton=cm.length===1?cm[0]:null
 const dm=canton?matchTerms(terms,raw.district,'district',canton.id):[],district=dm.length===1?dm[0]:null
 const reason=(value,matches,parentReady)=>!value?'missing':!parentReady?'hierarchy_conflict':matches.length===0?'unrecognized':matches.length>1?'ambiguous':'resolved'
 return {raw,province,canton,district,reasons:{province:reason(raw.province,pm,true),canton:reason(raw.canton,cm,!!province),district:reason(raw.district,dm,!!canton)},complete:!!(province&&canton&&district)}
}

async function canonicalTerms(){
 const env=Object.fromEntries((await fs.readFile(path.join(process.cwd(),'.env.local'),'utf8')).split(/\r?\n/).filter(line=>/^[A-Z0-9_]+=/.test(line)).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),unquote(line.slice(at+1))]}))
 const base=env.NEXT_PUBLIC_SUPABASE_URL,key=env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if(!base||!key)throw Error('CANONICAL_GEOGRAPHY_ACCESS_UNAVAILABLE')
 const url=new URL('/rest/v1/ontology_terms',base)
 url.searchParams.set('select','id,parent_id,term_type,term_name,term_name_en,term_name_es,slug,slug_en,slug_es,official_code')
 url.searchParams.set('term_type','in.(province,canton,district)')
 const response=await fetch(url,{headers:{apikey:key,authorization:`Bearer ${key}`}})
 if(!response.ok)throw Error(`CANONICAL_GEOGRAPHY_HTTP_${response.status}`)
 const rows=await response.json()
 if(!Array.isArray(rows)||rows.length===0)throw Error('CANONICAL_GEOGRAPHY_EMPTY')
 return rows
}

function propertyTypeGroup(value){const v=normalize(value);return /terreno|lote|finca|land/.test(v)?'undeveloped_land':/apartamento/.test(v)?'apartments':/condominio/.test(v)?'condominiums':/casa|house/.test(v)?'houses':'other'}

async function fetchPublic(url){
 const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; TwuanisResearch/1.0; +https://twuanis.com)','accept':'text/html,application/xhtml+xml'}})
 if(!response.ok)throw Error(`HTTP_${response.status}`)
 return response.text()
}

function absolute(config,href){
 const url=new URL(href,config.source_website)
 if(url.hostname!==config.allowed_host)throw Error('UNEXPECTED_HOST')
 return url.href
}

function parseListingPage(html,config){
 const $=load(html), listings=[]
 $('.list-properties .item').each((_,node)=>{
  const item=$(node), anchor=item.find('h2 a').first(), href=anchor.attr('href')
  const sourceId=clean(item.find('.code .num').first().text())||String(href||'').match(/\/(\d+)(?:[/?#]|$)/)?.[1]||''
  if(!href||!/^\d+$/.test(sourceId))return
  listings.push({source_listing_id:sourceId,source_url:absolute(config,href),listing_title:clean(anchor.text()),property_type:clean(item.find('.tag1').first().text()),listing_location:clean(item.find('.location,.ubicacion').first().text()),listing_image_urls:unique(item.find('img[src]').map((_,image)=>$(image).attr('src')).get())})
 })
 const next=$('a[aria-label="Next"]').attr('href')
 return {listings,next:next?absolute(config,next):null}
}

function parseDecimal(text){
 const normalized=clean(text).replace(/[^0-9,.-]/g,'')
 if(!normalized)return null
 const lastComma=normalized.lastIndexOf(','),lastDot=normalized.lastIndexOf('.')
 let canonical=normalized
 if(lastComma>=0&&lastDot>=0)canonical=lastComma>lastDot?normalized.replace(/\./g,'').replace(',','.'):normalized.replace(/,/g,'')
 else if(lastComma>=0)canonical=/^\d{1,3}(,\d{3})+$/.test(normalized)?normalized.replace(/,/g,''):normalized.replace(',','.')
 else if(lastDot>=0)canonical=/^\d{1,3}(\.\d{3})+$/.test(normalized)?normalized.replace(/\./g,''):normalized
 const value=Number(canonical)
 return Number.isFinite(value)?value:null
}

function measurement(label,value){
 if(!value)return null
 const original=clean(value),number=parseDecimal(original)
 if(number===null)return {source_label:label,source_value:original,normalized_square_meters:null,normalization:null}
 const unit=(original.match(/(m(?:²|2)|ha|hect[aá]reas?|km(?:²|2)|ft(?:²|2)|pies(?: cuadrados)?)/i)||[])[1]?.toLowerCase()||null
 const factor=unit&&(/^(m²|m2)$/.test(unit)?1:/^(ha|hect)/.test(unit)?10000:/^(km²|km2)$/.test(unit)?1000000:/^(ft²|ft2|pies)/.test(unit)?0.09290304:null)
 return {source_label:label,source_value:original,normalized_square_meters:factor===null?null:number*factor,normalization:factor===null?null:{unit,factor}}
}

function textAfterLabel($,selector,needle){
 let found=null
 $(selector).each((_,node)=>{
  const strong=$(node).find('strong').first(),label=clean(strong.text()).replace(/:$/,'')
  if(label===needle)found=clean($(node).text().replace(strong.text(),''))
 })
 return found
}

function parseDetail(html,seed,config,terms){
 const $=load(html), attributes={}
  const rawJsonLd=[]
  $('script[type="application/ld+json"]').each((_,node)=>{
   const text=$(node).contents().text().trim()
   if(!text)return
   try{
    const value=JSON.parse(text)
    if(Array.isArray(value))rawJsonLd.push(...value)
    else if(value&&typeof value==='object')rawJsonLd.push(value)
   }catch{}
  })
 $('.list-info-1a li,.list-info-2 li').each((_,node)=>{
  const strong=$(node).find('strong').first(),label=clean(strong.text()).replace(/:$/,'')
  if(label)attributes[label]=clean($(node).text().replace(strong.text(),''))
 })
 const lookup=labels=>labels.map(label=>attributes[label]===undefined?null:measurement(label,attributes[label])).find(Boolean)||null
 const priceText=clean($('.blq_precio .pr1').first().text())||clean($('.blq_precio span').first().text())||clean($('.areaPrecio p').last().text())
 const salePriceAmount=parseDecimal(priceText)
 const priceBlock=clean($('.blq_precio').first().text())||clean($('.areaPrecio').first().text())
 const currency=/col[oó]n|₡/i.test(priceBlock)?'CRC':/usd|d[oó]lar|\$/i.test(priceBlock)?'USD':null
 const descriptionHeading=$('h3').filter((_,node)=>/descripci[oó]n adicional/i.test(clean($(node).text()))).first()
 const description=descriptionHeading.length?clean(descriptionHeading.closest('.col-md-12').find('p').last().text()):null
 const whatsapp=unique([
  ...$('a[href*="wa.me/"]').map((_,node)=>String($(node).attr('href')).match(/wa\.me\/(\d+)/)?.[1]||null).get(),
  ...(html.matchAll(/wa\.me\/(\d+)/g)).map(match=>match[1]),
  ...$('.fab.fa-whatsapp,.fab.fa-whatsapp-square').map((_,node)=>clean($(node).parent().text()).match(/\+?\d[\d\s-]{6,}/)?.[0]||null).get()
 ])
 const tel=unique($('a[href^="tel:"]').map((_,node)=>clean($(node).attr('href')).replace(/^tel:/,'')).get())
 const images=unique($('.Gallery a[href], .Gallery img[src]').map((_,node)=>$(node).attr('href')||$(node).attr('src')).get())
 const rawGeography=config.geography?Object.fromEntries(Object.entries(config.geography.source_field_map).map(([canonical,sourceLabel])=>[canonical,attributes[sourceLabel]||null])):null
 const resolvedGeography=rawGeography&&terms?resolveGeography(terms,rawGeography):null
  const collectionReasons=[]
  if(!seed.source_url||new URL(seed.source_url).hostname!==config.allowed_host)collectionReasons.push('SOURCE_URL_NOT_ALLOWED')
  if(!priceText||!salePriceAmount||!currency)collectionReasons.push('EXACT_SOURCE_PRICE_UNAVAILABLE')
  if(!rawJsonLd.length)collectionReasons.push('SOURCE_JSONLD_UNAVAILABLE')
  const collectionEligibility={status:collectionReasons.length?'REJECTED':'ELIGIBLE',reasons:collectionReasons}
  const rawPriceEvidence={flight_price:{amount:{value:salePriceAmount===null?'':String(salePriceAmount)},currency,source_label:'Precio de venta',source_value:priceText||''},source_url:seed.source_url,observed_at:now()}
  return {
  source_name:config.source_name,source_platform:'Wasi',transaction:config.transaction,source_listing_id:attributes.Código||seed.source_listing_id,source_url:seed.source_url,title:clean($('h1.title').first().text())||seed.listing_title,property_type:attributes['Tipo de inmueble']||seed.property_type||null,
  property_area:lookup(config.property_area_labels),construction_area:lookup(config.construction_area_labels),sale_asking_price:{source_value:priceText||null,amount:salePriceAmount,currency,source_label:'Precio de venta'},
  geography:resolvedGeography?{source_fields:{canton_district:attributes['Cantón / Distrito']||null,city:attributes.Ciudad||null,zone:attributes.Zona||null},province:resolvedGeography.province?.term_name||null,canton:resolvedGeography.canton?.term_name||null,district:resolvedGeography.district?.term_name||null,canonical_codes:{province:resolvedGeography.province?.official_code||null,canton:resolvedGeography.canton?.official_code||null,district:resolvedGeography.district?.official_code||null},resolution_reasons:resolvedGeography.reasons,exact_pcd_published:resolvedGeography.complete}:{country:attributes.País||null,province:attributes.Provincia||null,canton:null,district:null,source_city:attributes.Ciudad||null,exact_pcd_published:false},
  whatsapp_numbers:whatsapp,telephone_numbers:tel,description:description||null,image_urls:images,attributes,raw_jsonld:JSON.stringify(rawJsonLd),collection_eligibility:JSON.stringify(collectionEligibility),raw_price_evidence:JSON.stringify(rawPriceEvidence),source_evidence:{property_area_label:lookup(config.property_area_labels)?.source_label??null,construction_area_label:lookup(config.construction_area_labels)?.source_label??null,detail_retrieved_at:rawPriceEvidence.observed_at}
 }
}

async function main(){
 const config=JSON.parse(await fs.readFile(configPath,'utf8'))
 const terms=config.geography?await canonicalTerms():null
 const runAt=now(), discovered=new Map(), pages=[], failures=[]
 if(selectionPath){
  const selected=JSON.parse(await fs.readFile(selectionPath,'utf8'))
  if(!Array.isArray(selected))throw Error('SELECTION_ARRAY_REQUIRED')
  for(const item of selected){
   if(!item||typeof item.source_listing_id!=='string'||typeof item.source_url!=='string')throw Error('SELECTION_IDENTITY_REQUIRED')
   discovered.set(item.source_listing_id,{source_listing_id:item.source_listing_id,source_url:item.source_url,listing_title:item.title||'',property_type:item.property_type||'',listing_location:''})
  }
 }else{
  let url=config.sale_start_url
  while(url&&!pages.includes(url)){
   try{const html=await fetchPublic(url),parsed=parseListingPage(html,config);pages.push(url);parsed.listings.forEach(item=>discovered.set(item.source_listing_id,item));url=parsed.next;await delay(350)}catch(error){failures.push({url,error:String(error.message||error)});break}
  }
 }
 const records=[]
 for(const seed of discovered.values()){
  try{records.push(parseDetail(await fetchPublic(seed.source_url),seed,config,terms));await delay(350)}catch(error){failures.push({url:seed.source_url,source_listing_id:seed.source_listing_id,error:String(error.message||error)})}
 }
 const count=predicate=>records.filter(predicate).length
 const byPropertyType=Object.fromEntries(['houses','apartments','condominiums','undeveloped_land','other'].map(group=>{const rows=records.filter(r=>propertyTypeGroup(r.property_type)===group);return [group,{total:rows.length,with_property_area:rows.filter(r=>!!r.property_area).length,with_construction_area:rows.filter(r=>!!r.construction_area).length,with_both_measurements:rows.filter(r=>!!r.property_area&&!!r.construction_area).length,missing_construction_area:rows.filter(r=>!r.construction_area).length}]}))
 const reasons={};for(const row of records)for(const [level,reason] of Object.entries(row.geography.resolution_reasons||{})){if(reason!=='resolved')reasons[`${level}:${reason}`]=(reasons[`${level}:${reason}`]||0)+1}
 const summary={source_name:config.source_name,source_platform:'Wasi',transaction:'sale',run_started_at:runAt,run_finished_at:now(),listing_pages_discovered:pages.length,sale_listings_discovered:discovered.size,successfully_extracted:records.length,with_property_area:count(r=>!!r.property_area),with_construction_area:count(r=>!!r.construction_area),with_both_measurements:count(r=>!!r.property_area&&!!r.construction_area),missing_either_measurement:count(r=>!r.property_area||!r.construction_area),with_whatsapp:count(r=>r.whatsapp_numbers.length>0),with_image_urls:count(r=>r.image_urls.length>0),with_complete_province_canton_district:count(r=>r.geography.exact_pcd_published),unresolved_or_ambiguous_geography:count(r=>!r.geography.exact_pcd_published),geography_unresolved_reasons:reasons,measurement_completeness_by_property_type:byPropertyType,canonical_geography_terms_loaded:terms?.length||0,failed_or_inaccessible_listing_pages:failures.length,failures}
 const directory=path.join(outputRoot,runAt.replace(/[:.]/g,'-'))
 await fs.mkdir(directory,{recursive:true})
 await fs.writeFile(path.join(directory,'devop-wasi-sales.json'),JSON.stringify(records,null,2)+'\n')
 await fs.writeFile(path.join(directory,'extraction-report.json'),JSON.stringify(summary,null,2)+'\n')
 const examples=records.filter(r=>r.property_area||r.construction_area).slice(0,6).map(r=>`- ${r.source_listing_id}: Property Area ${r.property_area?`${r.property_area.source_label} = ${r.property_area.source_value}`:'missing'}; Construction Area ${r.construction_area?`${r.construction_area.source_label} = ${r.construction_area.source_value}`:'missing'}`).join('\n')
 await fs.writeFile(path.join(directory,'extraction-report.md'),`# ${config.source_name} public sale extraction\n\n- Discovered: ${summary.sale_listings_discovered}\n- Extracted: ${summary.successfully_extracted}\n- Property Area: ${summary.with_property_area}\n- Construction Area: ${summary.with_construction_area}\n- Both: ${summary.with_both_measurements}\n- Missing either: ${summary.missing_either_measurement}\n- WhatsApp: ${summary.with_whatsapp}\n- Image URLs: ${summary.with_image_urls}\n- Complete province/canton/district: ${summary.with_complete_province_canton_district}\n- Unresolved or ambiguous geography: ${summary.unresolved_or_ambiguous_geography}\n- Failed details: ${summary.failed_or_inaccessible_listing_pages}\n\n## Measurement completeness by property type\n${Object.entries(byPropertyType).map(([type,value])=>`- ${type}: ${JSON.stringify(value)}`).join('\n')}\n\n## Explicit source-label examples\n${examples||'- None'}\n`)
 console.log(JSON.stringify({directory,summary},null,2))
}
main().catch(error=>{console.error(error);process.exitCode=1})
