import json,math,ast,statistics
from fractions import Fraction as F
from pathlib import Path
P=Path('/private/tmp/twuanis-orch-final-01');source=ast.parse(Path('/private/tmp/twuanis-phase43/oracle.py').read_text());exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef)],type_ignores=[]),'retained-independent-rational-oracle','exec'))
cache={}
rows=json.load(open(P/'independent-inventory.json'));
for row in rows:
 if row['currency']=='USD'and row['P']is not None:row['P']=str(F(row['P'])*F(500))
ontology={x['id']:x for x in json.load(open(P/'independent-ontology.json'))};checks=[]
def check(case,engine,pop,label,e,a):
 ok=math.isclose(e,a,rel_tol=2e-9,abs_tol=1e-7)if isinstance(e,(int,float))and isinstance(a,(int,float))else e==a
 checks.append({'scenario':case,'engine':engine,'population':pop,'check':label,'expected':e,'actual':a,'pass':ok})
def terms(x,dim):return {v['id']for v in x['terms']if v['dimension']==dim}
def scoped(x,r):return x['tx']==r['scope']['transaction'] and all(v is None or v in terms(x,k)for k,v in r['scope']['geography'].items())and r['scope']['propertyType']in terms(x,'property_type')
lands={'under-100m2':(None,100),'100-500m2':(100,500),'500-1000m2':(500,1000),'1000-5000m2':(1000,5000),'5000m2-1-hectare':(5000,10000),'1-5-hectares':(10000,50000),'over-5-hectares':(50000,None)}
constructions={'under-50m2':(None,50),'50-100m2':(50,100),'100-200m2':(100,200),'200-400m2':(200,400),'400-800m2':(400,800),'800m2-plus':(800,None)}
def interval(x,limits):return x is not None and(limits[0]is None or F(x)>=limits[0])and(limits[1]is None or F(x)<limits[1])
def preference(x,r):
 for k,v in r['filters'].items():
  if k=='property_area':
   if not interval(x['L'],lands[v]):return False
  elif k=='construction_area':
   if not interval(x['C'],constructions[v]):return False
  elif k=='year_built':
   if not any(ontology[t]['slug']==v.lower()for t in terms(x,k)):return False
  elif k in ['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status']:
   if not terms(x,k).intersection(v.split(',')):return False
 return True
def prices(xs):return [F(x['P'])for x in xs if x['P']is not None and F(x['P'])>0]
def ppm(xs):return [F(x['P'])/F(x['L'])for x in xs if x['P']is not None and x['L']is not None and F(x['P'])>0 and F(x['L'])>0]
def cohort(xs,opt):
 if not opt:return xs
 return [x for x in xs if all(any(t['id']==i for t in x['terms'])for i in opt.get('characteristicIds',[]))and(not opt.get('propertyAreaRange')or interval(x['L'],lands[opt['propertyAreaRange']]))and(not opt.get('constructionAreaRange')or interval(x['C'],constructions[opt['constructionAreaRange']]))]
def statistic(case,engine,pop,label,vs,actual):
 if actual is None:return
 for k,v in stats(vs).items():
  if k in actual:check(case,engine,pop,label+'.'+k,v,actual[k])
for d in sorted((P/'paired').iterdir()):
 f=d/'after/live-report.json'
 if not f.exists():continue
 report=json.load(open(f));r=report['request'];pop=report['population'];case=d.name;subject=next((x for x in rows if x['id']==r['subject'].get('listingId')and x['population']==r['subject'].get('population')),None)
 audit=json.load(open(d/'after/acquisition-audit.json'))
 for population in ['PRIVATE','BANK']:
  scopedrows=[x for x in rows if x['population']==population and scoped(x,r)]if pop in [population,'COMBINED']else[]
  wanted=[x for x in scopedrows if preference(x,r)];ids={population+':'+x['id']for x in scopedrows};wantedids={population+':'+x['id']for x in wanted}
  for a in [x for x in audit if x['kind']=='engine-cohort'and x['populations']==[population]]:
   check(case,a['engine'],population,'exact raw canonical membership',sorted(ids),sorted(a['before']));check(case,a['engine'],population,'exact eligible/preference membership',sorted(ids if a['engine']in['matching','configuration']else wantedids),sorted(a['items']))
  for e in report['engines']:
   engine=e['id'];part=e['result']['private'if population=='PRIVATE'else'bank'];check(case,engine,population,'source separation',pop in[population,'COMBINED'],part is not None)
   if part is None:continue
   o=part['result'];n=len(wanted);vs=ppm(wanted);ps=prices(wanted);check(case,engine,population,'independent raw scoped N',len(scopedrows),part['n'])
   if engine=='summary':check(case,engine,population,'eligible N',n,o['n'])
   elif engine=='composition':
    for dim in o['dimensions']:
     name=dim['dimension'];counts={}
     for x in wanted:
      for t in terms(x,name):counts[t]=counts.get(t,0)+1
     check(case,engine,population,name+' denominator',n,dim['denominatorN']);check(case,engine,population,name+' known',sum(bool(terms(x,name))for x in wanted),dim['representedN'])
     check(case,engine,population,name+' exact term counts',counts,{t['termId']:t['count']for t in dim['terms']})
   elif engine=='market-asking-price-distribution':statistic(case,engine,population,'asking',ps,o.get('statistics'))
   elif engine=='matching':
    if not r['filters']:check(case,engine,population,'unselected preferences undefined','UNDEFINED',e['state'])
    for v in o:
     x=next(x for x in scopedrows if population+':'+x['id']==v['id']);check(case,engine,population,'matched identity in reference market',True,v['id']in ids)
     # One selected semantic term: independent MATCH / NONMATCH / UNKNOWN and score.
     if len(r['filters'])==1:
      k,val=next(iter(r['filters'].items()))
      if k in ['bedrooms','bathrooms','parking','utility','environment','terrain','accessibility','legal_status']:
       known=bool(terms(x,k));match=bool(terms(x,k)&set(val.split(',')));check(case,engine,population,v['id']+' match',int(match),v['confirmedMatches']);check(case,engine,population,v['id']+' unknown',int(not known),v['unknown']);check(case,engine,population,v['id']+' score',100 if match else(0 if known else None),v['matchScore'])
   elif engine=='comparison':
    if n:
     for k,v in {'averageSalePrice':float(sum(ps)/len(ps))if r['scope']['transaction']=='sale'else None,'medianSalePrice':quant(ps,F(1,2))if r['scope']['transaction']=='sale'else None,'averagePropertyArea':float(sum(F(x['L'])for x in wanted)/n),'averageConstructionArea':float(sum(F(x['C'])for x in wanted)/n)}.items():check(case,engine,population,k,v,o['metrics'][k])
   elif engine=='configuration':check(case,engine,population,'reference market N',len(scopedrows),o['marketSize']);check(case,engine,population,'configuration N',n,o['matchingCount'])
   elif engine=='distribution':statistic(case,engine,population,'ppm2',vs,o)
   elif engine=='geography'and isinstance(o,list):
    for g in o:
     level=g['level'];tid=g['geography'][level]['id'];xs=[x for x in wanted if tid in terms(x,level)];statistic(case,engine,population,tid,ppm(xs),g['distribution']);check(case,engine,population,tid+' median delta',quant(ppm(xs),F(1,2))-quant(vs,F(1,2)),g['medianDifferenceFromSelectedMarket'])
   elif engine=='size'and o:
    check(case,engine,population,'represented N',n,o['population']['representedObservationCount'])
    for b in o['population']['bands']:
     xs=[x for x in wanted if interval(x['L'],lands[b['range']])];check(case,engine,population,b['range']+' N',len(xs),b['observationCount']);check(case,engine,population,b['range']+' median',quant(ppm(xs),F(1,2)),b['medianNormalizedRatio'])
   elif engine=='construction-land'and o:
    for band in o['cohorts']:
     a=band['definition'];lo=a['minimumInclusive']if a['minimumInclusive']is not None else a['minimumExclusive'];hi=a['maximumExclusive'];xs=[x for x in wanted if F(x['C'])/F(x['L'])>=F(str(lo))and(hi is None or F(x['C'])/F(x['L'])<F(str(hi)))];check(case,engine,population,a['key']+' N',len(xs),band['n']);check(case,engine,population,a['key']+' ratio',quant([F(x['C'])/F(x['L'])for x in xs],F(1,2)),band['medianExactRatio']);check(case,engine,population,a['key']+' ppm2',quant(ppm(xs),F(1,2)),band['medianPricePerM2'])
   elif engine=='cohort-comparison'and o and 'cohortA'in o:
    for side in ['cohortA','cohortB']:statistic(case,engine,population,side,ppm(cohort(wanted,r['options'].get(side))),o[side])
   elif engine=='cross-dimensional'and o and 'inputObservationCount'in o:
    check(case,engine,population,'exact input N',n,o['inputObservationCount'])
    for v in o['evidence']:
     if v['secondaryCohortKey']in lands:
      xs=[x for x in wanted if interval(x['L'],lands[v['secondaryCohortKey']])];check(case,engine,population,v['secondaryCohortKey']+' N',len(xs),v['representedObservationCount'])
      if 'selectedMarketMedianPricePerM2'in v:check(case,engine,population,v['secondaryCohortKey']+' median',quant(ppm(xs),F(1,2)),v['selectedMarketMedianPricePerM2'])
   elif engine=='discovery':
    statistic(case,engine,population,'ppm2',vs,o['statistics']);check(case,engine,population,'qualified membership',sorted(wantedids),sorted(x['listingId']for x in o['comparisons']))
    for v in o['comparisons']:
     x=next(x for x in wanted if population+':'+x['id']==v['listingId']);price=F(x['P'])/F(x['L']);below=sum(p<price for p in vs);equal=sum(p==price for p in vs);check(case,engine,population,v['listingId']+' midrank',float((below+F(equal,2))/n*100),v['evidence']['percentilePosition'])
   elif engine=='position'and o and subject and 'percentile'in o:
    p=F(subject['P'])/F(subject['L']);below=sum(v<p for v in vs);equal=sum(v==p for v in vs)
    for k,v in {'belowCount':below,'equalCount':equal,'aboveCount':n-below-equal,'position':float((below+F(equal,2))/n*100)if n else None}.items():check(case,engine,population,k,v,o['percentile'][k])
   elif engine=='comparables'and o and subject and 'sampleSize'in o:
    landBucket=next(v for v in lands.values()if interval(subject['L'],v));constructionBucket=next(v for v in constructions.values()if interval(subject['C'],v));level=r['options']['geographyLevel']
    xs=[x for x in wanted if interval(x['L'],landBucket)and interval(x['C'],constructionBucket)and terms(x,level)==terms(subject,level)and(x['population']!=subject['population']or x['id']!=subject['id'])];check(case,engine,population,'subject-excluded comparable N',len(xs),o['sampleSize'])
    if o.get('evidence'):statistic(case,engine,population,'comparable ppm2',ppm(xs),o['evidence']['distribution'])
   elif engine in ['asking-area-ratio','weighted-price']and o:
    xs=wanted;question=r['options'].get('ratioQuestion')
    if question:
     xs=[x for x in xs if all((question[k]['min']is None or F(x[f])>=F(question[k]['min']))and(question[k]['max']is None or F(x[f])<=F(question[k]['max']))for k,f in [('propertyArea','L'),('constructionArea','C')])]
    if engine=='weighted-price'and subject:xs=[x for x in xs if x['population']!=subject['population']or x['id']!=subject['id']]
    weight=o if engine=='asking-area-ratio'else o.get('weighting');
    if weight and 'n'in weight:
     check(case,engine,population,'ratio complete N',len(xs),weight['n'])
     if weight.get('state')=='established':
      f=[{'P':F(x['P']),'L':F(x['L']),'C':F(x['C'])}for x in xs];beta=ols(f)
      for k,v in zip(['intercept','propertyArea','constructionArea'],beta):check(case,engine,population,k,float(v),weight['coefficients'][k])
      check(case,engine,population,'coefficient ratio',float(beta[2]/beta[1]),weight['ratio'])
      for k,v in robust_interval(f).items():check(case,engine,population,'HC3 Fieller '+k,v,weight['interval'][k])
      if engine=='weighted-price'and o.get('distribution'):
       weighted=[F(x['P'])/(F(x['L'])+beta[2]/beta[1]*F(x['C']))for x in xs];statistic(case,engine,population,'weighted',weighted,o['distribution']);check(case,engine,population,'weighted exact N',len(weighted),o['distribution']['n'])
       if subject and o.get('subject'):
        value=F(subject['P'])/(F(subject['L'])+beta[2]/beta[1]*F(subject['C']));below=sum(v<value for v in weighted);equal=sum(v==value for v in weighted);median=quant(weighted,F(1,2));difference=float(value)-median
        expected={'weightedPrice':float(value),'belowCount':below,'equalCount':equal,'aboveCount':len(weighted)-below-equal,'percentilePosition':float((below+F(equal,2))/len(weighted)*100),'difference':difference,'percentDifference':difference/median*100}
        for key,val in expected.items():check(case,engine,population,'weighted subject '+key,val,o['subject'][key])
(P/'independent-checks.json').write_text(json.dumps({'method':'Independent database memberships; retained rational-arithmetic oracle. Numerical tolerance only for independently implemented binary64 arithmetic; exact baseline equality is separately required.','checks':checks},indent=2));bad=[x for x in checks if not x['pass']];print('Independent checks',len(checks),'failed',len(bad),'engines',len(set(x['engine']for x in checks)));print(json.dumps(bad[:25],indent=2))
