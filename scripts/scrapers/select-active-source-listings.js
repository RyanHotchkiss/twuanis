#!/usr/bin/env node
'use strict'

/* Build a source-identity-preserving refresh selection; it never mutates data. */
const fs=require('node:fs/promises')
const path=require('node:path')
const [sourceName,outputDir]=process.argv.slice(2)
if(!sourceName||!outputDir)throw Error('Usage: node select-active-source-listings.js SOURCE_NAME OUTPUT_DIRECTORY')
function unquote(value){return String(value??'').trim().replace(/^['"]|['"]$/g,'')}
async function main(){
 const raw=await fs.readFile(path.join(process.cwd(),'.env.local'),'utf8')
 const env=Object.fromEntries(raw.split(/\r?\n/).filter(line=>/^[A-Z0-9_]+=/.test(line)).map(line=>{const at=line.indexOf('=');return [line.slice(0,at),unquote(line.slice(at+1))]}))
 const base=env.NEXT_PUBLIC_SUPABASE_URL,key=env.SUPABASE_SERVICE_ROLE_KEY
 if(!base||!key)throw Error('SERVICE_AUTHORITY_UNAVAILABLE')
 const url=new URL('/rest/v1/listings',base)
 url.searchParams.set('select','source_listing_id,source_url,title,property_type,transaction_type')
 url.searchParams.set('source_name',`eq.${sourceName}`)
 url.searchParams.set('listing_origin','eq.imported')
 url.searchParams.set('listing_status','eq.active')
 url.searchParams.set('order','source_listing_id.asc')
 const response=await fetch(url,{headers:{apikey:key,authorization:`Bearer ${key}`}})
 if(!response.ok)throw Error(`HTTP_${response.status}`)
 const rows=await response.json()
 if(!Array.isArray(rows))throw Error('LISTING_SELECTION_UNAVAILABLE')
 const byTransaction={sale:[],rent:[]}
 for(const row of rows){
  if(!['sale','rent'].includes(row.transaction_type)||typeof row.source_listing_id!=='string'||typeof row.source_url!=='string')throw Error('ACTIVE_SOURCE_IDENTITY_INCOMPLETE')
  byTransaction[row.transaction_type].push({source_listing_id:row.source_listing_id,source_url:row.source_url,title:typeof row.title==='string'?row.title:'',property_type:typeof row.property_type==='string'?row.property_type:''})
 }
 await fs.mkdir(outputDir,{recursive:true})
 await Promise.all(Object.entries(byTransaction).map(([transaction,selection])=>fs.writeFile(path.join(outputDir,`${sourceName.toLowerCase()}-${transaction}-active-selection.json`),JSON.stringify(selection,null,2)+'\n')))
 console.log(JSON.stringify({source_name:sourceName,sale:byTransaction.sale.length,rent:byTransaction.rent.length,output_directory:outputDir},null,2))
}
main().catch(error=>{console.error(error.message||error);process.exitCode=1})
