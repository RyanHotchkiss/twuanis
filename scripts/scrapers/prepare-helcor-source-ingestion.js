#!/usr/bin/env node
'use strict'
const fs=require('node:fs'),path=require('node:path')
const input=process.argv[2],output=process.argv[3]
if(!input||!output)throw Error('Usage: node prepare-helcor-source-ingestion.js INPUT OUTPUT')
const typeMap={Casa:'House','Casa de Playa':'House','Casa de Campo':'House',Lote:'Land',Terreno:'Land','Lote Comercial':'Land',Apartamento:'Condo',Apartaestudio:'Condo',Finca:'Farm','Campos, Chacras y Quintas':'Farm',Local:'Commercial Property',Edificio:'Commercial Property',Oficina:'Commercial Property','Cabaña':'Cabin'}
const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"'
const rows=JSON.parse(fs.readFileSync(input,'utf8')),out=[],rejected={}
for(const row of rows){
 const type=typeMap[row.property_type];const geo=row.geography;const property=row.property_area?.source_value||'',construction=row.construction_area?.source_value||''
 const needs=type==='House'||type==='Cabin'?!property||!construction:type==='Condo'||type==='Commercial Property'?!construction:type==='Land'||type==='Farm'?!property:true
 const reason=!geo.exact_pcd_published?'UNRESOLVED_GEOGRAPHY':!type?'UNSUPPORTED_SOURCE_PROPERTY_TYPE':needs?'MISSING_REQUIRED_EXPLICIT_MEASUREMENT':!row.sale_asking_price?.amount?'MISSING_EXACT_PRICE':!row.whatsapp_numbers?.[0]?'MISSING_WHATSAPP':null
 if(reason){rejected[reason]=(rejected[reason]||0)+1;continue}
 const raw={source_name:'HELCOR',source_listing_id:String(row.source_listing_id),observation_id:`helcor-${row.source_listing_id}-${Date.parse(row.source_evidence.detail_retrieved_at)}`,observed_at:row.source_evidence.detail_retrieved_at,source_type:'realtor',source_url:row.source_url,transaction_type:'sale',property_type:row.property_type,province:geo.province,canton:geo.canton,district:geo.district,title:row.title,description:row.description||'',current_price:String(row.sale_asking_price.amount),currency:row.sale_asking_price.currency,whatsapp:'+'+String(row.whatsapp_numbers[0]).replace(/\D/g,''),raw_property_area:property,raw_construction_area:construction,images:row.image_urls.join('|'),raw_source_attributes:JSON.stringify(row.attributes),raw_geography:JSON.stringify(geo.source_fields),collection_eligibility:typeof row.collection_eligibility==='string'?row.collection_eligibility:'',raw_jsonld:typeof row.raw_jsonld==='string'?row.raw_jsonld:'',raw_price_evidence:typeof row.raw_price_evidence==='string'?row.raw_price_evidence:''}
 out.push({...raw,property_type:type,source_observation_input:JSON.stringify(raw),unresolved_normalizer_review:JSON.stringify({status:'unresolved',canonical_authority:false,values:{}})})
}
const columns=Object.keys(out[0]||{});fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,[columns.join(','),...out.map(r=>columns.map(k=>q(r[k])).join(','))].join('\n')+'\n');fs.writeFileSync(output+'.report.json',JSON.stringify({input_rows:rows.length,publication_ready:out.length,rejected,property_type_mapping:typeMap},null,2)+'\n');console.log(JSON.stringify({output,publication_ready:out.length,rejected},null,2))
