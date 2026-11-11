'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');let checks=0;
const check=(v,label)=>{assert.ok(v,label);checks++};
const fixture=[['Featured Listing',60,'12','6000'],['Listing Boost',14,'5','2500'],['Homepage Exposure',14,'35','17500'],['Province Exposure',28,'18','9000'],['Property-Type Exposure',28,'18','9000']].map(([name,duration,usd,crc],i)=>({id:'addon-'+i,name_en:name,name_es:'ES '+name,state:'active',termKind:'elapsed_days',durationDays:duration,capacity:i===2?10:null,standardPrices:{USD:usd,CRC:crc},quantityTiers:[]}));
fixture.push({id:'founder',name_en:'Founder',state:'active',termKind:'lifetime',standardPrices:{USD:'500'},quantityTiers:[]},{id:'bulk',name_en:'Bulk',state:'active',termKind:'whole_job',standardPrices:{},quantityTiers:[{min:1,max:25,currency:'USD',unitRate:'0.50'},{min:26,max:100,currency:'USD',unitRate:'0.25'},{min:101,max:500,currency:'USD',unitRate:'0.10'}]});
function harness(catalog,offer={state:'inactive'},bad=false){
 let states=[],cursor=0,deps,cleanup,effects=[],calls=[],parent=[],tree;
 const React={useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=value}]},useEffect(fn,next){if(!deps||next.some((v,i)=>v!==deps[i])){cleanup?.();deps=next;effects.push(()=>{cleanup=fn()})}}};
 const jsx=(type,props)=>({type,props});const m={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/app/components/OfferCatalog.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:m,exports:m.exports,AbortController,fetch:async url=>{calls.push(url);if(bad&&url.startsWith('/api/addon'))return{ok:false};return{ok:true,json:async()=>url.startsWith('/api/offer')?offer:catalog}},require:k=>k==='react'?React:k==='react/jsx-runtime'?{jsx,jsxs:jsx}:(()=>{throw Error(k)})()});
 const onState=v=>parent.push(v);
 function render(lang='en'){cursor=0;tree=m.exports.default({language:lang,onState});effects.splice(0).forEach(f=>f());return tree}
 async function settle(lang='en'){await new Promise(r=>setImmediate(r));return render(lang)}
 return{render,settle,calls,parent,get tree(){return tree},states,cleanup:()=>cleanup?.()};
}
function nodes(x){if(x==null||typeof x==='boolean')return[];if(Array.isArray(x))return x.flatMap(nodes);return typeof x==='object'?[x,...nodes(x.props?.children)]:[x]}
const text=x=>nodes(x).filter(v=>typeof v==='string'||typeof v==='number').join(' ').replace(/\s+/g,' ');
(async()=>{
 for(const lang of ['en','es']){
 const h=harness({state:'canonical',checkoutAvailable:false,products:fixture,next:null});h.render(lang);check(h.parent.at(-1)===true,'loading suppresses legacy');await h.settle(lang);let out=text(h.tree);
 check(h.calls.length===2,'one inactive presentation request plus one catalog request');check(h.calls.every(u=>u.startsWith('/api/offer-catalog')||u.startsWith('/api/addon-catalog')),'no commerce endpoint');
 for(const p of fixture.slice(0,5)){check(out.includes(p.durationDays+' '+(lang==='es'?'días':'days')),p.name_en+' canonical duration');check(out.includes('USD '+p.standardPrices.USD),'canonical standard price');}
 check(out.includes('0.50')&&out.includes('0.25')&&out.includes('0.10'),'standard bulk tiers');check(out.includes(lang==='es'?'Capacidad global':'Global capacity'),'capacity projection');check(out.includes(lang==='es'?'Derecho de precios de por vida':'Lifetime pricing right'),'founder term');
 check(nodes(h.tree).filter(x=>x?.type==='button').length===0,'no acquisition buttons');check(!out.includes('Verified Ownership')&&!out.includes('Market Explorer Exposure'),'no legacy products');check(h.parent.at(-1)===true,'canonical suppresses legacy');
 const selects=nodes(h.tree).filter(n=>n?.type==='select');check(selects.length===1,'standard catalog only currency control');selects[0].props.onChange({target:{value:'CRC'}});h.render(lang);await h.settle(lang);out=text(h.tree);check(out.includes('CRC 6000')&&out.includes('CRC 17500'),'CRC standard prices');check(out.includes(lang==='es'?'No disponible en esta moneda':'Unavailable in this currency'),'unpriced Founder/Bulk');check(h.calls.length===4,'bounded currency change');h.render(lang);await h.settle(lang);check(h.calls.length===4,'rerender no repeated acquisition');h.cleanup();
 }
 for(const catalog of [{state:'unexpected'},{state:'canonical',checkoutAvailable:false,products:Array(26).fill(fixture[0])},{state:'canonical',checkoutAvailable:false,products:[{}]}]){const h=harness(catalog);h.render();await h.settle();check(nodes(h.tree).some(n=>n?.props?.role==='alert')&&h.parent.at(-1)===true,'invalid catalog fails closed');}
 const fail=harness(null,undefined,true);fail.render();await fail.settle();check(fail.parent.at(-1)===true&&text(fail.tree).includes('unavailable'),'transport failure no legacy fallback');
 const legacy=harness({state:'legacy_compatibility'});legacy.render();await legacy.settle();check(legacy.tree===null&&legacy.parent.at(-1)===false,'explicit legacy mode retained');
 const empty=harness({state:'canonical',checkoutAvailable:false,products:[]});empty.render();await empty.settle();check(empty.parent.at(-1)===true&&!text(empty.tree).includes('Purchase'),'empty canonical no fallback');
 const dynamic=harness({state:'canonical',checkoutAvailable:false,products:[{...fixture[0],durationDays:81,standardPrices:{USD:'19'}}]});dynamic.render();await dynamic.settle();check(text(dynamic.tree).includes('81 days')&&text(dynamic.tree).includes('USD 19'),'projection is authority, not copied static terms');
 const active=harness(null,{state:'canonical',products:[{id:'x',name_en:'Offer',pricing:{available:true,currency:'USD',standardPrice:'12',effectivePrice:'3',source:'OFFER'}}]});active.render();await active.settle();check(active.calls.length===1&&text(active.tree).includes('Offer : USD 3'),'existing active Offer path preserved without standard catalog fetch');
 check(fs.readFileSync(root+'/app/components/MarketHubPackages.tsx','utf8').includes('[offerPresentation,setOfferPresentation]=useState(true)'),'parent initially suppresses legacy flash');
 console.log('PASS Step6 canonical catalog repair:',checks,'checks; actual component, mocked read-only transport, no live requests');
})().catch(e=>{console.error(e);process.exitCode=1});
