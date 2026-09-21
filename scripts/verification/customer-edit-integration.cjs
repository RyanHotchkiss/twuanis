const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
const root=process.env.S7_REPO_ROOT||path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let count=0;
function ok(v,s){assert.ok(v,s);count++;console.log('PASS',s)}
function load(file,deps={},globals={}){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:m,exports:m.exports,process:{env:{}},console,require(k){if(k==='server-only')return {};if(k in deps)return deps[k];throw Error(k)},fetch(){throw Error('network forbidden')},...globals});return m.exports}
const road=load('lib/canonical-customer-road-distance.ts');const server=load('lib/canonical-customer-edit.ts',{'@/lib/canonical-customer-road-distance':road});
const row={id:'07000000-0000-0000-0000-000000001501',owner_id:'owner',canonical_domain_version:1,transaction_type:'sale',current_price:'0.5',currency:'USD',province:'Cartago',canton:'Jiménez',district:null};
const noDB={from(){throw Error('unexpected query')}};
(async()=>{
 let r=await server.customerEditDomains(noDB,{distance_to_paved_road_range:'100_500m'},row);ok(r.domains.facts.distance_to_paved_road.kind==='range'&&r.domains.facts.distance_to_paved_road.lower==='100'&&r.domains.facts.distance_to_paved_road.upper_inclusive===false,'range connected to edit domains');
 r=await server.customerEditDomains(noDB,{title:'text'},row);ok(!r.domains.facts&&r.content.title==='text','text edit omits existing exact/range facts');
 r=await server.customerEditDomains(noDB,{current_price:'1'},row);ok(r.domains.money.amount==='1'&&r.domains.money.currency==='USD','sale exact original denomination');
 r=await server.customerEditDomains(noDB,{monthly_price:'0.5'},{...row,transaction_type:'rent'});ok(r.domains.money.amount==='0.5','rent original amount');
 for(const key of ['price_millions','owner_id','rule_set','canonical_domain_version','images','listing_status','transaction_type']){await assert.rejects(server.customerEditDomains(noDB,{[key]:'bad'},row));count++}
 await assert.rejects(server.customerEditDomains(noDB,{monthly_price:'5'},row));count++;
 const terms={from(){let limit;const q={select(){return q},eq(){return q},limit(n){limit=n;return Promise.resolve({data:[{id:'9007199254740993'}]})}};return q}};
 r=await server.customerEditDomains(terms,{property_type:'House'},row);ok(r.domains.semantics.property_type[0]==='9007199254740993','lossless typed selection resolution');
 const ambiguous={from(){const q={select(){return q},eq(){return q},limit(){return Promise.resolve({data:[{id:'1'},{id:'2'}]})}};return q}};
 await assert.rejects(server.customerEditDomains(ambiguous,{property_type:'House'},row));count++;
 // Real HTTP route uses verified owner and forwards only canonical domains/content.
 const calls=[];let current=row;const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:current})};
 const customer={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>q,rpc:async(name,args)=>{calls.push({name,args});return {data:{listing_id:row.id}}}};
 const route=load('app/api/edit-canonical-listing/route.ts',{'next/server':{NextResponse:{json:(body,o)=>({body,status:o?.status||200})}},'@supabase/supabase-js':{createClient:()=>customer},'@/lib/canonical-customer-edit':server});
 const body={listingId:row.id,requestId:'07000000-0000-0000-0000-000000001502',expectedRevision:'1',changes:{distance_to_paved_road_range:'over_5km'}};
 let response=await route.POST({headers:{get:()=>null}});ok(response.status===401&&!calls.length,'HTTP anonymous denied');
 response=await route.POST({headers:{get:()=> 'Bearer t'},json:async()=>body});ok(response.status===200&&calls[0].name==='edit_customer_canonical_listing','HTTP reaches atomic edit boundary');
 ok(calls[0].args.p_domains.facts.distance_to_paved_road.lower_inclusive===false,'HTTP strict greater-than-5000 range');
 for(const version of [null,undefined,'1',2]){current={...row,canonical_domain_version:version};let before=calls.length;response=await route.POST({headers:{get:()=> 'Bearer t'},json:async()=>body});ok(response.status===409&&calls.length===before,'HTTP classification fails closed '+version)}
 // Real browser adapter sends only changed fields and retains identity after loss.
 const storage=new Map(),sent=[];let attempt=0;
 const client=load('app/utils/canonicalCustomerEdit.ts',{}, {crypto:webcrypto,TextEncoder,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:async(url,o)=>{sent.push(JSON.parse(o.body));if(++attempt===1)throw Error('lost');return {ok:true,json:async()=>({success:true})}}});
 const auth={auth:{getUser:async()=>({data:{user:{id:'owner'}}}),getSession:async()=>({data:{session:{access_token:'token'}}})}};
 const initial={distance_to_paved_road_range:'123',priceMillions:'0.5',title:'old',images:[]},changed={...initial,title:'new'};
 await assert.rejects(client.submitCanonicalCustomerEdit(auth,{...row,canonical_revision:'7'},initial,changed));
 await client.submitCanonicalCustomerEdit(auth,{...row,canonical_revision:'7'},initial,changed);
 ok(Object.keys(sent[0].changes).join(',')==='title','browser does not resubmit unchanged exact evidence');
 ok(sent[0].requestId===sent[1].requestId&&sent[0].expectedRevision==='7','browser retry stable and revision lossless');
 ok(storage.size===0,'confirmed browser completion clears pending attempt');
 for(const file of ['SaleListingEditForm.tsx','RentalListingEditForm.tsx']){const s=fs.readFileSync(root+'/app/components/'+file,'utf8');ok(s.includes('submitCanonicalCustomerEdit(supabase, listing, initialPropertyData.current, propertyData, measurementClears)'),'form wired '+file);ok(s.includes("listing.canonical_domain_version === 1 || value ==="),'accessibility change preserves exact distance '+file)}

 await client.submitCanonicalCustomerEdit(auth,{...row,canonical_revision:'7'},{...initial,currency:'USD'},{...initial,currency:'USD',priceMillions:'1'});
 ok(sent.at(-1).changes.current_price==='1'&&sent.at(-1).changes.currency==='USD','money retry payload includes full original denomination');
 const beforeGeo={...initial,province:'Cartago',canton:'Jiménez',district:''};
 await client.submitCanonicalCustomerEdit(auth,{...row,canonical_revision:'7'},beforeGeo,{...beforeGeo,district:'Pejivalle'});
 ok(Object.keys(sent.at(-1).changes).sort().join(',')==='canton,district,province','geography retry carries full explicit selection');
 const geoQueries=[];const geoDB={from(){const filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},limit(n){geoQueries.push({...filters,limit:n});return Promise.resolve({data:filters.term_type==='province'?[{id:'3',official_code:'3'}]:[{id:'304',official_code:'304'}]})}};return q}};
 const geo=await server.customerEditDomains(geoDB,{province:'Cartago',canton:'Jiménez',district:''},row);
 ok(geo.domains.geography.province==='3'&&geo.domains.geography.canton==='304'&&geo.domains.geography.district===null,'geography sends official codes');
 ok(geoQueries.length===2&&geoQueries[0].parent_id==='9'&&geoQueries[1].parent_id==='3'&&geoQueries.every(q=>q.limit===2),'geographic lookup bounded and parent-scoped');
 const legacy=load('app/utils/updateListing.ts',{'@/lib/activity':{recordListingUpdated:async()=>{}}});
 for(const version of [null,1,undefined,'1',2]){
   let writes=0,guard=false;const stored={id:row.id,owner_id:'owner',canonical_domain_version:version};
   const query={select(){return query},eq(){return query},is(k,v){guard=k==='canonical_domain_version'&&v===null;return query},update(){writes++;return query},single:async()=>({data:stored})};
   const db={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>query};
   let failed=false;try{await legacy.updateListing({supabase:db,listingId:row.id,updates:{title:'test'}})}catch{failed=true}
   ok(version===null?!failed&&writes===1&&guard:failed&&writes===0,'legacy helper authority gate '+String(version));
 }
 console.log('CUSTOMER EDIT INTEGRATION ASSERTIONS',count);
})().catch(e=>{console.error(e);process.exitCode=1});
