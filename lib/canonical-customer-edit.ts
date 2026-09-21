import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { customerRoadDistanceRange } from '@/lib/canonical-customer-road-distance'

// Explicit new customer selections; no conversion of legacy listings.
export async function customerEditDomains(db: SupabaseClient, changes: Record<string, unknown>, row: Record<string, unknown>) {
  const domains: Record<string, any> = {}, content: Record<string,string> = {}
  const semantics = ['property_type','utility','environment','terrain','accessibility','legal_status']
  const facts = ['bedrooms','bathrooms','parking','year_built_range']
  const allowed = [...semantics,...facts,'province','canton','district','property_area','construction_area','distance_to_paved_road_range','current_price','monthly_price','currency','title','description','whatsapp']
  if (Object.keys(changes).some(k=>!allowed.includes(k))) throw new Error('Unsupported canonical edit field.')
  async function term(dimension: string, name: unknown) {
    if (typeof name !== 'string' || !name || name.length>256) throw new Error('Explicit typed selection required.')
    const matches = new Map<string,string>()
    for (const column of ['term_name','term_name_en','term_name_es']) {
      const {data,error}=await db.from('ontology_terms').select('id::text').eq('term_type',dimension).eq('level',1).eq(column,name).limit(2)
      if(error) throw new Error('Selection identity could not be resolved.')
      for(const value of data??[]) matches.set(value.id,value.id)
    }
    if(matches.size!==1) throw new Error('Selection identity is missing or ambiguous.')
    return [...matches.values()][0]
  }
  if(['province','canton','district'].some(k=>k in changes)) {
    let parent='9';const geo:Record<string,string|null>={};
    for(const [level,dimension] of ['province','canton','district'].entries()) {
      const name=dimension in changes?changes[dimension]:row[dimension];
      if(dimension==='district'&&(name===null||name==='')){geo.district=null;continue}
      if(typeof name!=='string'||!name)throw new Error('Province and Canton are required.')
      const {data,error}=await db.from('ontology_terms').select('id::text,official_code').eq('term_type',dimension).eq('level',level+1).eq('parent_id',parent).eq('term_name',name).limit(2)
      if(error||data?.length!==1)throw new Error('Exact geographic identity is unresolved.')
      parent=data[0].id;geo[dimension]=data[0].official_code
    }
    domains.geography=geo
  }
  for(const [key,value] of Object.entries(changes)) {
    if(['title','description','whatsapp'].includes(key)) {
      if(typeof value!=='string')throw new Error('Text required.')
      content[key]=value;continue
    }
    if(semantics.includes(key)) {
      const values = Array.isArray(value)?value:typeof value==='string'?value.split('|').filter(Boolean):value===null?[]:null
      if(!values||values.length>64)throw new Error('Bounded selection required.')
      domains.semantics??={};domains.semantics[key]=await Promise.all(values.map(v=>term(key,v)));continue
    }
    if(facts.includes(key)) {
      const dimension=key==='year_built_range'?'year_built':key
      domains.facts??={}
      if(value===null||value==='')domains.facts[dimension]={kind:'clear'}
      else if(key!=='year_built_range'&&/^\d+(\.\d+)?$/.test(String(value)))domains.facts[dimension]={kind:'exact',value:String(value)}
      else domains.facts[dimension]={kind:'category',term:await term(dimension,value)}
      continue
    }
    if(key==='property_area'||key==='construction_area') {
      if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Explicit SET or CLEAR measurement action required.')
      const action=value as Record<string,unknown>
      domains.measurements??={}
      if(action.kind==='clear'&&Object.keys(action).length===1)domains.measurements[key]={kind:'clear'}
      else if(action.kind==='set'&&Object.keys(action).sort().join(',')==='kind,value'&&typeof action.value==='string'&&/^\d+(\.\d+)?$/.test(action.value)&&Number.isFinite(Number(action.value))&&Number(action.value)>0)domains.measurements[key]={value:action.value}
      else throw new Error('Enter a positive measurement or explicitly choose Clear measurement.')
      continue
    }
    if(key==='distance_to_paved_road_range') {
      domains.facts??={};domains.facts.distance_to_paved_road=customerRoadDistanceRange(value);continue
    }
  }
  if('current_price'in changes||'monthly_price'in changes||'currency'in changes) {
    const key=row.transaction_type==='sale'?'current_price':row.transaction_type==='rent'?'monthly_price':null
    if(!key||('current_price'in changes&&key!=='current_price')||('monthly_price'in changes&&key!=='monthly_price')) throw new Error('Immutable transaction mismatch.')
    domains.money={amount:String(changes[key]??row[key]),currency:changes.currency??row.currency}
  }
  return {domains,content}
}
