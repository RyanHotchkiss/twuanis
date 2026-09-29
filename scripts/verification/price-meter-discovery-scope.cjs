// Engine 13: reuse real Phase 14 modules, fake only external boundaries. No live I/O.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..');
const src=fs.readFileSync(root+'/scripts/verification/phase14-step15.cjs','utf8');
let prefix=src.split('const browserHarness=')[0];
prefix=prefix.replace("'phase14-browser-result','phase14-application'","'discovery-hub-action','phase14-browser-result','phase14-application'")
 .replace("load('lib/comparative-discovery-action.ts')","load('lib/discovery-hub-action.ts')")
 .replaceAll('action15.analyzePhase14Market','action15.executeDiscoveryHub')
 .replace("{n:26,change:","{n:25},{n:51},{n:501},{n:26,usd:true,change:")
 .replace("const action15=","let selectedCalls=[];const engine13Build=builder.buildPriceMeterObservations;builder.buildPriceMeterObservations=(...a)=>{selectedCalls.push(a[1]);return engine13Build(...a)};const action15=")
 .replace("const p=prepare11(scenario);","const p=prepare11(scenario);selectedCalls=[];")
 .replace("return fixtures;",`const catalog={state:'ready',options:[...geos.map(g=>({id:g.id,type:g.term_type,en:g.term_type+' Geography',es:g.term_type+' Geografía',code:g.official_code,parentId:g.parent_id})),{id:'9007199254740993',type:'property_type',en:'House',es:'Casa',code:null,parentId:null}]};
 for(const f of fixtures){eq(await action15.restoreDiscoveryDraft(JSON.stringify(f.request)),identity.preparePhase14Question(f.request.request)?{request:identity.preparePhase14Question(f.request.request),normalization:f.request.normalization}:null)}
 for(const invalid of ['{}','null','bad',JSON.stringify({request:{},normalization:'both'})])eq(await action15.restoreDiscoveryDraft(invalid),null);
 console.log(JSON.stringify({part:'engine13-restore-and-execution',status:'PASS',checks,liveIO:false}));if(process.env.ENGINE13_FIXTURE_PATH)fs.writeFileSync(process.env.ENGINE13_FIXTURE_PATH,JSON.stringify({fixtures,catalog}));return fixtures;`)
 .replace("fixtures.push({request:","eq(response.context.hydratedCount,scenario.n);eq(response.context.excludedCount,0);eq(distributionCalls,1);eq(observationCalls,scenario.n);eq(selectedCalls.filter(x=>x===p.basis).length,scenario.n);eq(selectedCalls.filter(x=>x!==p.basis).length,0);console.log(JSON.stringify({engine13:true,n:scenario.n,metrics:physical(),unselectedObservationBuilds:selectedCalls.filter(x=>x!==p.basis).length,presentationReads:presentationRequests.length,presentationRPCs:presentationRPCs.length,bytes:Buffer.byteLength(JSON.stringify(response)),context:response.context}));fixtures.push({request:");
// Prefix uses new Function with the established harness's explicit module allowlist.
new Function('require','__dirname',prefix+`\nreturn new Function('require','__dirname',harness+'\\n'+setup+'\\n'+system)(require,__dirname);`)(require,__dirname).catch(e=>{console.error(e);process.exitCode=1});
