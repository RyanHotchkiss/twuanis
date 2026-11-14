#!/usr/bin/env node
'use strict'

/*
 * Projects observed Wasi attribution onto existing imported listings only.
 * It never creates listings, changes publication state, or clears a valid
 * attribution when a source page does not provide one.
 */
const fs=require('node:fs/promises')
const path=require('node:path')

function unquote(value){return String(value??'').trim().replace(/^['"]|['"]$/g,'')}
async function environment(){
 let file={}
 try{
  const raw=await fs.readFile(path.join(process.cwd(),'.env.local'),'utf8')
  file=Object.fromEntries(raw.split(/\r?\n/).filter(line=>/^[A-Z0-9_]+=/.test(line)).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),unquote(line.slice(at+1))]}))
 }catch(error){if(error.code!=='ENOENT')throw error}
 return {...file,...process.env}
}
function imageUrl(value){
 if(typeof value!=='string'||!value)return null
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null}catch{return null}
}
async function request(base,key,pathname,options={}){
 const response=await fetch(new URL(pathname,base),{...options,headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json',...(options.headers||{})}})
 const text=await response.text()
 if(!response.ok)throw Error(`HTTP_${response.status}:${text.slice(0,300)}`)
 return text?JSON.parse(text):[]
}
async function projectAttribution(rows,sourceName,providedEnv){
 const env=providedEnv||await environment()
 if(!Array.isArray(rows))throw Error('EXTRACTION_ARRAY_REQUIRED')
 const base=env.NEXT_PUBLIC_SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY
 if(!base||!key)throw Error('SERVICE_AUTHORITY_UNAVAILABLE')
 const name=value=>typeof value==='string'&&value.trim()?value.trim().slice(0,200):null
 const eligible=rows.filter(row=>row&&row.source_name===sourceName&&typeof row.source_listing_id==='string'&&(imageUrl(row.agency?.logo_url)||imageUrl(row.listing_agent?.photo_url)||name(row.agency?.name)||name(row.listing_agent?.name)))
 const result={source_name:sourceName,input_rows:rows.length,observed_attribution:eligible.length,matched:0,updated_with_agency_logo:0,updated_with_agency_name:0,updated_with_agent_photo:0,updated_with_agent_name:0,unmatched:[],failed:[]}
 for(const row of eligible){
  const agencyLogo=imageUrl(row.agency?.logo_url),agentPhoto=imageUrl(row.listing_agent?.photo_url)
  const agencyName=name(row.agency?.name),agentName=name(row.listing_agent?.name)
  const body={...(agencyLogo?{agency_logo_url:agencyLogo}:{}),...(agencyName?{agency_name:agencyName}:{}),...(agentPhoto?{listing_agent_photo_url:agentPhoto}:{}),...(agentName?{listing_agent_name:agentName}:{})}
  try{
   const params=new URLSearchParams({source_name:`eq.${sourceName}`,source_listing_id:`eq.${row.source_listing_id}`,listing_origin:'eq.imported',select:'id,listing_status,agency_logo_url,agency_name,listing_agent_photo_url,listing_agent_name'})
   const updated=await request(base,key,`/rest/v1/listings?${params}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)})
   if(!Array.isArray(updated)||updated.length!==1){result.unmatched.push(row.source_listing_id);continue}
   result.matched++
   if(agencyLogo)result.updated_with_agency_logo++
   if(agencyName)result.updated_with_agency_name++
   if(agentPhoto)result.updated_with_agent_photo++
   if(agentName)result.updated_with_agent_name++
  }catch(error){result.failed.push({source_listing_id:row.source_listing_id,error:String(error.message||error)})}
 }
 return result
}

async function main(){
 const [input,sourceName]=process.argv.slice(2)
 if(!input||!sourceName)throw Error('Usage: node refresh-wasi-listing-attribution.js EXTRACTION_JSON SOURCE_NAME')
 const result=await projectAttribution(JSON.parse(await fs.readFile(input,'utf8')),sourceName)
 console.log(JSON.stringify(result,null,2))
 if(result.failed.length)process.exitCode=1
}

module.exports={projectAttribution}
if(require.main===module)main().catch(error=>{console.error(error.message||error);process.exitCode=1})
