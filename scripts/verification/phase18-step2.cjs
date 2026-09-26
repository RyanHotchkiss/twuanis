// Offline verification of the four Phase 18 Step 2 repairs. Never starts the app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),ts=require(root+'/node_modules/typescript');
const prefix=fs.readFileSync(root+'/scripts/verification/phase14-step13.cjs','utf8').split('async function main(){')[0];
const {loader,hookHarness,nodes,React,dom}=new Function('require','__dirname',prefix+'\nreturn {loader,hookHarness,nodes,React,dom};')(require,__dirname);
global.fetch=()=>{throw Error('Live I/O prohibited')};
let category='A';const counts={A:0,B:0,C:0,D:0};
const ok=(v,m)=>{assert.ok(v,m);counts[category]++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);counts[category]++};
const read=f=>fs.readFileSync(root+'/'+f,'utf8');
const render=(C,p)=>dom.renderToStaticMarkup(React.createElement(C,p));
const clone=v=>JSON.parse(JSON.stringify(v));
function frozen(v){if(v&&typeof v==='object'){Object.values(v).forEach(frozen);Object.freeze(v)}return v}
async function main(){
 // Execute both real saved-analysis pages with only external I/O replaced.
 for(const lang of ['en','es'])for(const engine of ['price-meter','explorer','valuation','pricing','matching','comparison','scarcity','buyer-demand']){
  let destination,loaded,activity;
  const saved={id:'saved-id',engine_type:engine,filters:{province:'san-jose',bedrooms:'3',empty:'',missing:null}};
  const file=lang==='en'?'app/en/saved-analysis/[id]/page.tsx':'app/es/analisis-guardado/[id]/page.tsx';
  const module={exports:{}};new Function('module','exports','require',ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(module,module.exports,n=>{
   if(n==='next/navigation')return{redirect:u=>{destination=u}};
   if(n==='@/lib/load-analysis')return{loadAnalysis:async id=>{loaded=id;return saved}};
   if(n==='@/lib/account-storage')return{recordRecentActivity:async(...a)=>{activity=a}};
   throw Error('Unexpected dependency '+n);
  });
  await module.exports.default({params:Promise.resolve({id:saved.id})});const u=new URL(destination,'https://offline.invalid');
  const tabs={'price-meter':'price-meter',explorer:'explorer',valuation:'valuation',pricing:'pricing-strategy',matching:'property-matching',comparison:'market-comparison',scarcity:'market-frequency','buyer-demand':'buyer-demand'};
  eq(u.pathname,lang==='en'?'/en/market-intelligence':'/es/inteligencia-de-mercado');eq(u.searchParams.get('tab'),tabs[engine]);eq(u.searchParams.get('province'),'san-jose');eq(u.searchParams.get('bedrooms'),'3');ok(!u.searchParams.has('empty')&&!u.searchParams.has('missing'));eq(loaded,saved.id);eq(activity[0],'market_reopened');eq(saved.engine_type,engine);
 }
 // Evaluate the actual PPM2 Market Hub href conditional, without mounting unrelated widgets.
 const hub=ts.createSourceFile('hub.tsx',read('app/components/MarketHubMarketIntelligence.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let href;
 function walk(n){if(ts.isPropertyAssignment(n)&&n.name.getText(hub)==="'price-per-square-meter'"&&ts.isObjectLiteralExpression(n.initializer)){const p=n.initializer.properties.find(p=>p.name?.getText(hub)==='href');if(p)href=p.initializer.getText(hub)}ts.forEachChild(n,walk)}walk(hub);ok(href);
 for(const language of ['en','es'])eq(vm.runInNewContext(href,{language}),language==='en'?'/en/market-intelligence?tab=price-meter':'/es/inteligencia-de-mercado?tab=price-meter');
 ok(read('lib/market-intelligence-workspace.ts').includes("case 'price-meter':"));
 for(const [f,url]of[['app/price-per-square-meter/page.tsx','/price-per-square-meter'],['app/es/precio-por-metro-cuadrado/page.tsx','/es/precio-por-metro-cuadrado']]){ok(read(f).includes('href="'+url+'"'));ok(read(f).includes('href="'+url+'?mode=comparison"'))}
 category='B';const route=loader()('lib/listing-route.ts'),discovery=loader()('lib/comparative-discovery-presentation.ts');
 const cardFile='app/components/marketplace/PropertyCard.tsx';
 // Actual card JSX, with Next Link represented as an anchor and no runtime navigation.
 const m={exports:{}};new Function('module','exports','require',ts.transpileModule(read(cardFile),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(m,m.exports,n=>n==='next/link'?{__esModule:true,default:'a'}:n==='react/jsx-runtime'?require(root+'/node_modules/react/jsx-runtime'):n==='@/lib/listing-route'?route:(()=>{throw Error(n)})());
 for(const language of ['en','es'])for(const transaction of ['sale','rent'])for(const id of ['00000000-0000-0000-0000-000000000001','id with / ? & ñ']){
  const stem=language==='en'?`/en/${transaction==='sale'?'buy':'rent-lease'}/listing/`:`/es/${transaction==='sale'?'comprar':'alquilar-arrendar'}/anuncio/`;const expected=stem+encodeURIComponent(id);
  eq(route.listingHref(id,transaction,language),expected);eq(discovery.listingHref(id,transaction,language),expected);eq(decodeURIComponent(expected.slice(stem.length)),id);
  const tree=m.exports.default({property:{id,title:'Listing',source_url:'https://external.invalid'},language,transactionType:transaction==='sale'?'buy':'rent',theme:'dark',isFavorite:false,isSelected:false,compareDisabled:false,onToggleFavorite(){},onToggleCompare(){}});
  eq(tree.props.href,expected);ok(tree.props.href.startsWith('/'));ok(!tree.props.href.includes('external.invalid'));eq(nodes(tree,n=>n.type==='button').length,2);
 }
 ok(!/import |require\(|fetch\(/.test(read('lib/listing-route.ts')),'route helper has no runtime dependencies');
 category='C';const evidence=frozen({status:'ok',propertyPricePerM2:1234567.89,comparisonPopulationCount:12345,distribution:{median:987654.32},medianPosition:{difference:-1234.56,percentDifference:-12.34},percentile:{position:67.89},populationTrail:{steps:[{dimension:'bedrooms',beforeCount:23456,afterCount:12345,removedCount:11111}]}});
 const presentation={geographyOptions:[{level:'province',label:{en:'Province',es:'Provincia'}}],normalizationOptions:[{basis:'land',label:{en:'Land',es:'Terreno'}}],baseCohort:{propertyType:{en:'House',es:'Casa'},propertyAreaRange:'100–200 m²',constructionAreaRange:'50–100 m²'},optionalDimensions:[{dimension:'bedrooms',label:{en:'Bedrooms',es:'Dormitorios'},value:{en:'3',es:'3'}}]};
 const original=clone(evidence),outputs={};
 for(const lang of ['en','es']){
  const h=hookHarness(),Component=loader({react:h.react})('app/components/PriceMeterComparableListing.tsx').default;
  h.render(Component,{listingId:'id',lang});h.states.splice(0,h.states.length,presentation,'province','land',['bedrooms'],evidence,false,false,true,null);
  const html=dom.renderToStaticMarkup(h.render(Component,{listingId:'id',lang}));outputs[lang]=html;
  const format=v=>new Intl.NumberFormat(lang==='en'?'en-US':'es-CR',{maximumFractionDigits:2}).format(v);
  for(const v of [1234567.89,12345,987654.32,-1234.56,-12.34,67.89,23456,11111])ok(html.includes(format(v)),lang+' formatted '+v);
  ok(html.includes(format(-12.34)+'%'));ok(html.includes(format(67.89)+'%'));ok(html.includes('100–200 m²'));ok(html.includes('50–100 m²'));eq(evidence,original);
 }
 ok(outputs.en!==outputs.es);ok(!read('app/components/PriceMeterComparableListing.tsx').includes('.toLocaleString()'));
 // All raw evidence, omitted fields and request construction remain independent of locale.
 category='D';const chartFiles={en:['app/price-per-square-meter/PriceMeterSizeRelationshipChart.tsx','app/price-per-square-meter/PriceMeterConstructionLandRelationshipChart.tsx','app/price-per-square-meter/PriceMeterConstructionLandDistributionChart.tsx'],es:['app/es/precio-por-metro-cuadrado/PrecioMetroRelacionTamanoChart.tsx','app/es/precio-por-metro-cuadrado/PrecioMetroRelacionConstruccionTerrenoChart.tsx','app/es/precio-por-metro-cuadrado/PrecioMetroDistribucionConstruccionTerrenoChart.tsx']};
 const specimens=[];
 for(const lang of ['en','es']){
  for(const [idx,file]of chartFiles[lang].entries()){
   const C=loader()(file);
   for(const basis of idx===2?['land']:['land','construction']){
    const points=frozen(idx===0?[{area:100,ratio:30000},{area:500,ratio:20000},{area:1000,ratio:10000}]:[{constructionToLandRatio:.1,normalizedPricePerM2:30000,observationCount:11},{constructionToLandRatio:.5,normalizedPricePerM2:20000,observationCount:22},{constructionToLandRatio:2,normalizedPricePerM2:10000,observationCount:33}]);
    const cohorts=frozen([0,1,2,3,4].map(i=>({definition:{key:'band'+i,label:['0–0.10','0.10–0.25','0.25–0.50','0.50–1.00','>1.00'][i]},observationCount:[0,12,23,34,45][i]})));
    const props=idx===2?{cohorts}:{coordinates:points,areaLabel:basis==='land'?(lang==='en'?'Property Area':'Área de terreno'):(lang==='en'?'Construction Area':'Área de construcción'),ratioLabel:basis==='land'?'land m²':'construction m²',normalizationUnitLabel:basis==='land'?'land m²':'construction m²',transactionType:'sale'};
    const before=clone(props),html=render(C.default,props);eq(props,before);
    const locale=lang==='en'?'en-US':'es-CR';
    if(idx!==2){
      for(const value of [30000,20000,10000])ok(html.includes(new Intl.NumberFormat(locale,{style:'currency',currency:'CRC',maximumFractionDigits:2}).format(value)),'supplied Price / m² label retained');
      if(idx===0)for(const value of [100,500,1000])ok(html.includes(new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(value)+' m²'),'supplied area label retained');
      else {for(const value of [.1,.5,2])ok(html.includes(new Intl.NumberFormat(locale,{maximumFractionDigits:3}).format(value)+' : 1'),'supplied C:L ratio retained');for(const n of [11,22,33])ok(html.includes('n = '+n),'cohort n retained')}
    }else for(const c of cohorts)ok(html.includes(c.definition.label.replace('>','&gt;')),'all structural cohort labels retained');
ok(html.includes('tabindex="0"'));ok(html.includes('role="region"'));ok(!html.includes('overflow:hidden'));
    specimens.push({lang,kind:idx===2?'bars':'points',name:file+':'+basis,html,points:idx===2?5:3});
    const empty=render(C.default,idx===2?{cohorts:[]}:{...props,coordinates:[]});ok(!empty.includes('role="region"'));
   }
  }
  const file=lang==='en'?'app/price-per-square-meter/PriceMeterComparisonResults.tsx':'app/es/precio-por-metro-cuadrado/ResultadosComparacionPrecioMetro.tsx';
  const term={termName:'Fixture',termNameEn:'Fixture',termNameEs:'Ejemplo',term_name:'Cartago',term_name_en:'Cartago',term_name_es:'Cartago'};
  const cohort=median=>({population:{definition:{geography:term,propertyType:term,characteristics:[term,term]},sampleSize:24},distribution:{sampleSize:24,median,p25:median-100,p75:median+100}});
  const analysis=frozen({analyticalIdentity:{transactionType:'sale',propertyBasis:'improved_property',normalizationBasis:'land',analyticalCurrency:'CRC'},comparison:{transactionType:'sale',cohortA:cohort(12345),cohortB:cohort(12000),evidence:{comparisonSufficient:true,minimumSampleSize:3,cohortA:{sampleSize:24,sufficient:true},cohortB:{sampleSize:24,sufficient:true}},medianDifference:{cohortAMedian:12345,cohortBMedian:12000,absoluteDifference:345,percentageDifference:2.875,referenceCohort:'B'}}});
  const before=clone(analysis),html=render(loader()(file).default,{analysis});eq(analysis,before);ok(html.includes(lang==='en'?'Cohort A':'Cohorte A'));ok(html.includes(lang==='en'?'Cohort B':'Cohorte B'));specimens.push({lang,kind:'grid',name:file,html});
 }
 const puppeteer=require(root+'/node_modules/puppeteer');
 const browser=await puppeteer.launch({executablePath:process.env.PHASE18_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--disable-background-networking','--disable-component-update','--no-first-run']});
 const layouts=[];
 try{
  const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>r.abort());
  for(const width of [320,375,768,1440])for(const sample of specimens){
   await page.setViewport({width,height:900});await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#eee;font:16px Arial}main{padding:32px;max-width:1400px;margin:auto;min-width:0}</style></head><body><main>'+sample.html+'</main></body></html>');
   const m=await page.evaluate(()=>{
    const region=document.querySelector('[role="region"]'),grid=[...document.querySelectorAll('div')].find(e=>e.style.gridTemplateColumns.includes('320px'));
    const labels=[...document.querySelectorAll('div')].filter(e=>e.style.transform==='translateX(-50%)'&&e.style.display==='grid');
    return {document:document.documentElement.scrollWidth,viewport:innerWidth,region:region?{client:region.clientWidth,scroll:region.scrollWidth,tab:region.tabIndex,overflow:getComputedStyle(region).overflowX}:null,labels:labels.map(e=>({text:e.textContent,width:e.getBoundingClientRect().width,whiteSpace:getComputedStyle(e).whiteSpace,height:e.getBoundingClientRect().height})),grid:grid?[...grid.children].map(e=>({left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top,right:e.getBoundingClientRect().right,text:e.textContent})):null,bars:[...document.querySelectorAll('div')].filter(e=>e.style.gridTemplateRows==='auto 220px auto').map(e=>e.textContent)};
   });
   ok(m.document<=width,JSON.stringify({sample:sample.name,width,...m}));
   if(sample.kind==='grid'){
    eq(m.grid.length,2);ok(m.grid[0].text.includes(sample.lang==='en'?'Cohort A':'Cohorte A'));ok(m.grid[1].text.includes(sample.lang==='en'?'Cohort B':'Cohorte B'));
    ok(m.grid.every(r=>r.right<=width));if(width<=375){eq(m.grid[0].left,m.grid[1].left);ok(m.grid[0].top<m.grid[1].top)}if(width===1440)eq(m.grid[0].top,m.grid[1].top);
   }else{
    eq(m.region.tab,0);eq(m.region.overflow,'auto');if(width<=768)ok(m.region.scroll>m.region.client);if(width===1440)eq(m.region.scroll,m.region.client);
    if(sample.kind==='points'){eq(m.labels.length,sample.points);for(const label of m.labels){ok(label.text.length>0);ok(label.width>=180);eq(label.whiteSpace,'normal');ok(label.height>0)}}else{eq(m.bars.length,5);for(const value of ['0','12','23','34','45'])ok(m.bars.some(s=>s.includes('n = '+value)))}
    await page.$eval('[role="region"]',e=>{e.scrollLeft=e.scrollWidth});const end=await page.$eval('[role="region"]',e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));eq(end.left,end.max,'last evidence reachable');
    if(width===320){await page.$eval('[role="region"]',e=>{e.scrollLeft=0;e.focus()});await page.keyboard.press('ArrowRight');await new Promise(r=>setTimeout(r,120));ok(await page.$eval('[role="region"]',e=>e.scrollLeft>0),'keyboard scroll')}
   }
   layouts.push({width,language:sample.lang,kind:sample.kind,documentWidth:m.document});
  }
 }finally{await browser.close()}
 console.log(JSON.stringify({status:'PASS',assertions:counts,total:Object.values(counts).reduce((a,b)=>a+b,0),browserFixtures:layouts.length,widths:[320,375,768,1440],network:'blocked',services:'none'},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
