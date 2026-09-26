// Real React/browser interaction with a fixture Server Action; no application server or live services.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const {root,fixture,q,load,terms}=require('./market-asking-price-distribution.cjs');
const esbuild=require(root+'/node_modules/esbuild'),puppeteer=require(root+'/node_modules/puppeteer');
let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
async function main(){
 fixture();const response=await load('lib/asking-price-action.ts').analyzeAskingPrice(q());assert.ok(response.ok);const result=response.result;
 fixture(0);const empty=(await load('lib/asking-price-action.ts').analyzeAskingPrice(q())).result;
 const catalog={state:'ready',options:terms.map(t=>({id:t.id,type:t.term_type,code:t.official_code,parentId:t.parent_id,en:t.term_name_en,es:t.term_name_es}))};
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mapd-ui-')),bundle=path.join(temp,'bundle.js');
 const component=root+'/app/components/AskingPriceDistribution.tsx';
 const entry=`import React from '${root}/node_modules/react/index.js';import {createRoot} from '${root}/node_modules/react-dom/client.js';import Engine,{AskingPriceResult} from '${component}';window.React=React;const root=createRoot(document.getElementById('root'));window.mount=(lang)=>root.render(React.createElement(Engine,{key:lang,lang,catalog:window.catalog}));window.showResult=(result,lang)=>root.render(React.createElement('main',{className:'engine'},React.createElement(AskingPriceResult,{result,lang})));window.clear=()=>root.render(null);window.mount('en');`;
 const css=fs.readFileSync(root+'/app/components/AskingPriceDistribution.module.css','utf8');
 await esbuild.build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,platform:'browser',outfile:bundle,define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'offline',setup(b){b.onResolve({filter:/asking-price-action$/},()=>({path:'action',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export async function analyzeAskingPrice(q){window.calls.push(q);return new Promise(resolve=>window.pending.push(resolve))}'}));b.onLoad({filter:/AskingPriceDistribution.module.css$/},()=>({contents:'export default '+JSON.stringify(Object.fromEntries([...css.matchAll(/\.([A-Za-z][\w]*)/g)].map(m=>[m[1],m[1]]))),loader:'js'}));}}]});
 const browser=await puppeteer.launch({headless:true});let blocked=0;
 try{const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',req=>{if(/^https?:/.test(req.url())){blocked++;req.abort()}else req.continue()});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--background:#fff;--foreground:#171717}@media(prefers-color-scheme:dark){:root{--background:#0a0a0a;--foreground:#ededed}}body{margin:0;background:var(--background);color:var(--foreground)}'+css+'</style></head><body><div id="root"></div></body></html>');
 await page.evaluate(c=>{window.catalog=c;window.calls=[];window.pending=[]},catalog);await page.addScriptTag({path:bundle});await page.waitForSelector('form');
 ok(await page.evaluate(()=>window.calls.length===0),'opening zero analytical executions');
 await page.select('form select:nth-of-type(1)','sale'); // First select is transaction.
 const selects=await page.$$('form .controls > label > select');await selects[2].select('1');
 await page.evaluate(()=>{document.querySelector('details').open=true});
 ok(await page.evaluate(()=>window.calls.length===0),'draft/options zero execution');
 await page.evaluate(()=>{const f=document.querySelector('form');f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});
 await page.waitForFunction(()=>window.calls.length===1);ok(await page.$eval('button[type=submit]',e=>e.disabled),'pending disables Analyze');
 await page.evaluate(r=>window.pending.shift()(r),response);await page.waitForSelector('.result');if(process.env.MAPD_SCREENSHOT_DIR){await page.setViewport({width:1280,height:1000});await page.evaluate(()=>document.querySelector('form details').open=false);await page.screenshot({path:path.join(process.env.MAPD_SCREENSHOT_DIR,'mapd-full-desktop.png'),fullPage:true})}ok(await page.evaluate(()=>window.calls.length===1),'one physical submission path');
 await selects[0].select('rent');ok(await page.$eval('.result',e=>e.textContent.includes('Sale')&&!e.textContent.includes('Monthly asking')),'draft does not relabel committed result');
 await page.click('button[type=submit]');await page.waitForFunction(()=>window.pending.length===1);await page.evaluate(()=>window.pending.shift()({ok:false,code:'execution_failed'}));await page.waitForSelector('[role=alert]');ok(await page.$eval('.result',e=>e.textContent.includes('Sale')),'failure retains prior result');
 await page.click('button[type=submit]');await page.waitForFunction(()=>window.pending.length===1);await page.evaluate(r=>window.pending.shift()({ok:true,result:r}),empty);await page.waitForFunction(()=>document.querySelector('.result').textContent.includes('No current listings'));ok(true,'successful zero atomically replaces result');
 // Unmount while a request is in flight, then resolve its stale response.
 await page.click('button[type=submit]');await page.waitForFunction(()=>window.pending.length===1);const before=await page.evaluate(()=>window.calls.length);await page.evaluate(()=>window.mount('es'));await page.waitForFunction(()=>document.querySelector('h1').textContent.startsWith('Distribución'));await page.evaluate(r=>window.pending.shift()(r),response);ok(await page.evaluate(()=>!document.querySelector('.result')),'stale unmounted response discarded');ok(await page.evaluate(n=>window.calls.length===n,before),'locale change zero executions');
 for(const lang of ['en','es'])for(const width of [375,1280]){
  await page.setViewport({width,height:900});await page.evaluate(l=>window.mount(l),lang);await page.waitForFunction(l=>document.querySelector('h1')?.textContent.startsWith(l==='en'?'Market Asking':'Distribución'),{},lang);await page.waitForSelector('form');await page.evaluate(()=>{document.querySelector('details').open=true});
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'builder no overflow '+lang+width);
  const selectLabels=await page.$$eval('label, legend',els=>els.map(e=>e.textContent).join(' '));ok(selectLabels.includes(lang==='en'?'Year Built':'Año de construcción'),'all numerical controls');
  await page.evaluate(({r,l})=>window.showResult(r,l),{r:result,l:lang});await page.waitForSelector('.statistics');
  ok(await page.$$eval('.statistics dd',els=>els.length===9),'all nine metrics '+lang+width);ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'results no overflow '+lang+width);
  ok(await page.$$eval('svg line',els=>els.every(e=>Number.isFinite(Number(e.getAttribute('x1'))))),'finite quantile geometry');
  if(process.env.MAPD_SCREENSHOT_DIR && (lang==='en'&&width===1280||lang==='es'&&width===375))await page.screenshot({path:path.join(process.env.MAPD_SCREENSHOT_DIR,'mapd-'+lang+'-'+width+'.png'),fullPage:true});
 }
 const tied=JSON.parse(JSON.stringify(result));for(const k of Object.keys(tied.statistics))tied.statistics[k]=k==='iqr'?0:10;tied.marketPopulation=tied.askingPricePopulation=1;
 await page.evaluate(r=>window.showResult(r,'en'),tied);await page.waitForFunction(()=>document.querySelectorAll('.statistics dd')[8].textContent.includes('0'));
 ok(await page.$$eval('svg g line',els=>els.every(e=>e.getAttribute('x1')==='300')),'tied markers one shared position');
 const noPrice={...empty,marketPopulation:2,outcome:'no_eligible_prices',exclusions:{missingAmount:2,invalidAmount:0,unsupportedCurrency:0}};await page.evaluate(r=>window.showResult(r,'es'),noPrice);await page.waitForFunction(()=>document.querySelector('.result').textContent.includes('ninguno aporta'));ok(await page.$('.statistics')===null,'no-price no zero statistics');
 for(const color of ['light','dark']){await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:color}]);ok(await page.$eval('.engine',e=>{const s=getComputedStyle(e);return s.color!==s.backgroundColor}),'theme has distinct foreground/background '+color)}
 ok(errors.length===0,'no browser runtime errors '+errors.join(';'));ok(blocked===0,'zero attempted network requests');
 console.log('MARKET ASKING PRICE DISTRIBUTION UI PASS:',checks,'checks; real React, 375/1280px, EN/ES, offline Server Action.');
 }finally{await browser.close();fs.rmSync(temp,{recursive:true,force:true})}
}
main().catch(e=>{console.error(e);process.exitCode=1});
