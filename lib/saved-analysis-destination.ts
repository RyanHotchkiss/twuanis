export function savedAnalysisDestination(record:any,language:'en'|'es'){
 const base=language==='es'?'/es/inteligencia-de-mercado':'/en/market-intelligence'
 if(record.universeReselectionRequired)return `${base}?reselect=1`
 const q=new URLSearchParams(),f=record.filters??{}
 const tabs:Record<string,string>={explorer:'explorer',valuation:'valuation',pricing:'pricing',matching:'matching',comparison:'comparison',scarcity:'scarcity','price-meter':'price-meter','buyer-demand':'buyer-demand'}
 q.set('tab',f.population==='BANK'?record.engine_type:tabs[record.engine_type]??'explorer')
 if(f.population==='BANK'){
  if(f.analysis_question==='market-asking-price-distribution')q.set('tab','asking-price');
  q.set('population','BANK');q.set('transaction_type','bank');q.set('analysis_question',f.analysis_question);q.set('saved',record.id)
 }else for(const [key,value]of Object.entries(f))if(typeof value==='string'&&value)q.set(key,value)
 return `${base}?${q}`
}
