const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),assert=require('assert/strict'),esbuild=require('esbuild'),puppeteer=require('puppeteer');
const root=process.cwd(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'twuanis-navigator-')),out=path.join(root,'outputs/hub-active-question');fs.mkdirSync(out,{recursive:true});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++};
const entry=`import React,{useState,useEffect} from 'react';import{createRoot}from'react-dom/client';import EN from '${root}/app/en/market-intelligence/MarketIntelligenceTabs';import ES from '${root}/app/es/inteligencia-de-mercado/PestanasInteligenciaMercado';import TopBar from '${root}/app/components/TopBar';
window.calls=[];window.pending=[];window.finish=(value)=>window.pending.shift().resolve(value);window.fail=()=>window.pending.shift().reject(Error('fixture failure'));
const options={province:[{id:1,official_code:'1',term_name_en:'San José',term_name_es:'San José'}],canton:[{id:2,parent_id:1,official_code:'102',term_name_en:'Escazú',term_name_es:'Escazú'}],district:[],property_type:[{id:3,slug:'house',term_name_en:'Houses',term_name_es:'Casas'}],bedrooms:[{slug:'3',term_name_en:'3 bedrooms',term_name_es:'3 habitaciones'}]};
function Fixture(){const[tab,setTab]=useState('explorer');const[,rerender]=useState(0);const language=location.pathname.startsWith('/es')?'es':'en';useEffect(()=>{const listener=()=>{setTab(new URLSearchParams(location.search).get('tab')||'explorer');rerender(v=>v+1)};window.addEventListener('fixture-nav',listener);return()=>window.removeEventListener('fixture-nav',listener)},[]);const Tabs=language==='es'?ES:EN;return <main style={{padding:'clamp(1rem,3vw,2rem)',background:'#0a0a0a',color:'#ededed',minHeight:'100vh'}}><TopBar/><header style={{textAlign:'center',marginBottom:32}}><h1 style={{fontSize:'clamp(1.6rem,4vw,3rem)'}}>{language==='es'?'Inteligencia de Mercado':'Market Intelligence'}</h1></header><Tabs activeTab={tab} options={options} filters={{analysis_question:new URLSearchParams(location.search).get('analysis_question')||undefined}} explorerResult={null} priceMeterAnalysis={null} pricingStrategy={null} marketScarcity={null} buyerDemand={null} marketMatches={null} valuation={null} comparison={null}/></main>};createRoot(document.getElementById('root')).render(<Fixture/>);`;
const stubs={
 'asking-price-action':`export async function analyzeAskingPrice(q){window.calls.push(['asking-price',q]);return new Promise((resolve,reject)=>window.pending.push({resolve,reject}))}`,
 'market-inventory-action':`export async function executeMarketQuestion(...args){window.calls.push(args);return new Promise((resolve,reject)=>window.pending.push({resolve,reject}))}`,
 'legacy-hub-action':`export async function executeLegacyHubQuestion(...args){window.calls.push(args);return {}}`,
 'saved-analyses':`export async function saveAnalysis(){return{id:'fixture'}};export async function updateSavedAnalysis(){};export async function getSavedAnalysesByEngine(){return []}`,
 'market-comparisons':`export async function saveMarketComparison(){};export function createMarketComparisonName(){return 'fixture'}`,
 'account-storage':`export async function recordRecentActivity(){}`,
 'activity/markets':`export async function recordMarketViewed(){}`,
};
(async()=>{await esbuild.build({stdin:{contents:entry,loader:'tsx',resolveDir:root},bundle:true,jsx:'automatic',outfile:path.join(dir,'app.js'),plugins:[{name:'offline-boundaries',setup(b){b.onResolve({filter:/^(next\/|@\/lib\/|@\/app\/|.*PriceMeterApplyPanel)/},args=>{if(args.path==='next/link'||args.path==='next/navigation')return{path:args.path,namespace:'fixture'};const key=Object.keys(stubs).find(k=>args.path.endsWith('/'+k));if(key)return{path:key,namespace:'fixture'};if(/(PriceMeterApplyPanel|PricingStrategyResults|BuyerDemandResults|ValuationResults|MarketMatchingResults|MarketScarcityResults|MarketComparisonResults)$/.test(args.path))return{path:'inactive',namespace:'fixture'};});b.onLoad({filter:/.*/,namespace:'fixture'},args=>({resolveDir:root,loader:'tsx',contents:args.path==='next/link'?`import React from 'react';export default function Link({href,prefetch,children,...p}){return <a href={href} {...p} onClick={e=>{e.preventDefault();history.pushState({},'',href);window.dispatchEvent(new Event('fixture-nav'))}}>{children}</a>}`:args.path==='next/navigation'?`export function usePathname(){return location.pathname};export function useSearchParams(){return new URLSearchParams(location.search)};export function useRouter(){return{push(url){history.pushState({},'',url);window.dispatchEvent(new Event('fixture-nav'))}}}`:args.path==='inactive'?`export default function Inactive(){return null}`:stubs[args.path]}))}}]});
const fontPath=path.join(root,'.next/dev/static/media/cc014fcb166cf364-s.p.2cu9iw-l3ih8o.woff2');const fontCss=fs.existsSync(fontPath)?`@font-face{font-family:FixtureCinzel;src:url(data:font/woff2;base64,${fs.readFileSync(fontPath).toString('base64')}) format('woff2');font-weight:100 900}body{--font-cinzel:FixtureCinzel}`:'';
const globals=fs.readFileSync(path.join(root,'app/globals.css'),'utf8').replace('@import "tailwindcss";','').replace(/@theme inline\s*\{[^}]*\}/,'');
fs.writeFileSync(path.join(dir,'index.html'),`<!doctype html><html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${globals}\n${fontCss}\n*{box-sizing:border-box}body{margin:0}button,select{font:inherit}a{background:transparent}h1,h2,h3,p{overflow-wrap:break-word}</style><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script></html>`);
const server=http.createServer((req,res)=>{const name=req.url.split('?')[0];const file=name==='/app.js'?'app.js':name==='/app.css'?'app.css':'index.html';res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(dir,file)))});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;try{browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(`http://127.0.0.1:${server.address().port}`)?r.continue():r.abort());
const pause=()=>new Promise(r=>setTimeout(r,80));
for(const language of ['en','es'])for(const width of [1440,375]){
 const es=language==='es',analysis=es?'Análisis':'Analysis';
 await page.setViewport({width,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}/${language}/market-intelligence`);await page.waitForSelector('article');await page.evaluate(()=>document.fonts.ready);
 if(width===375){await page.evaluate(()=>document.querySelector('nav[aria-label] button').click());await pause()}
 for(const engine of ['explorer','composition','explorer']){
  await page.select(`select[aria-label="${analysis}"]`,engine);await pause();
  ok(await page.$$eval('nav small',els=>els.length)===1,'exactly one navigator question');
  ok(await page.$$eval('nav a:not([aria-current="page"]) small',els=>els.length)===0,'inactive names only');
  ok(await page.$eval('nav a[aria-current="page"] small',e=>getComputedStyle(e).display!=='none'),'active question visible');
  const expected=engine==='composition'?(es?'¿Qué características componen el mercado inmobiliario definido de Costa Rica?':'What characteristics compose the defined Costa Rica real estate market?'):(es?'¿Cuántos anuncios hay en el mercado inmobiliario definido de Costa Rica?':'How many listings are in the defined Costa Rica real estate market?');
  ok(await page.$eval('nav a[aria-current="page"] small',e=>e.textContent)===expected,'correct localized active question');
  ok(await page.$eval('article > header',(e,q)=>e.textContent.includes(q),expected),'workspace question preserved');
  const inactive=engine==='composition'?'nav a[href*="analysis_question=summary"]':'nav a[href*="tab=explorer"][href*="analysis_question=composition"]';
  await page.hover(inactive);await page.focus(inactive);
  ok(await page.$$eval('nav a:not([aria-current="page"]) small',els=>els.length)===0,'hover focus do not expose inactive questions');
  ok(await page.evaluate(()=>window.calls.length)===0,'navigation and question changes zero executions');
  ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow');
  await page.screenshot({path:path.join(out,`${language}-${width}-${engine}.png`),fullPage:true});
 }
 await page.evaluate(()=>document.querySelector('nav a[href*="tab=explorer"][href*="analysis_question=composition"]').click());await pause();
 ok(await page.$eval(`select[aria-label="${analysis}"]`,e=>e.value)==='composition','sidebar synchronizes dropdown');
 if(width===1440){
  const w=await page.$eval('article',e=>e.getBoundingClientRect().width);
  await page.click(`button[aria-label="${es?'Contraer motores':'Collapse engines'}"]`);await pause();
  ok(await page.$eval('article',e=>e.getBoundingClientRect().width)>w+200,'collapse reclaims width');
  await page.click(`button[aria-label="${es?'Expandir motores':'Expand engines'}"]`);await pause();
  ok(await page.$eval('article',e=>e.getBoundingClientRect().width)===w,'expand restores width');
 }
 ok(await page.evaluate(()=>window.calls.length)===0,'all navigation and toggles zero executions');
}
ok(errors.length===0,errors.join('\n'));console.log('ACTIVE QUESTION NAVIGATOR PASS',checks,'screenshots',out)}finally{if(browser)await browser.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
