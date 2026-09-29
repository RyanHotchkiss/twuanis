export function hubEngineUrl(basePath:string,query:string,engine:string) {
 const params=new URLSearchParams(query)
 params.set('tab',engine==='composition'?'explorer':engine==='weighted-price'||engine==='asking-area-ratio'||engine==='comparables'||engine==='position'||engine==='discovery'||engine==='cross-dimensional'||engine==='cohort-comparison'||engine==='geography'||engine==='size'||engine==='construction-land'?'price-meter':engine)
 if(engine==='composition'||engine==='explorer')params.set('analysis_question',engine==='composition'?'composition':'summary')
 if(engine==='geography'||engine==='price-meter')params.set('analysis_question',engine==='geography'?'geography':'distribution')
 if(engine==='construction-land')params.set('analysis_question','construction-land')
 if(engine==='weighted-price')params.set('analysis_question','weighted-price')
 if(engine==='asking-area-ratio')params.set('analysis_question','asking-area-ratio')
 if(engine==='comparables')params.set('analysis_question','comparables')
 if(engine==='position')params.set('analysis_question','position')
 if(engine==='discovery')params.set('analysis_question','discovery')
 if(engine==='cross-dimensional')params.set('analysis_question','cross-dimensional')
 if(engine==='cohort-comparison')params.set('analysis_question','cohort-comparison')
 if(engine==='size')params.set('analysis_question','property-area')
 return `${basePath}?${params}`
}
