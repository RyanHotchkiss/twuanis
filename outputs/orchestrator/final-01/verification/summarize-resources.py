from pathlib import Path
import json,re
P=Path('/private/tmp/twuanis-orch-final-01');out=[]
for d in (P/'runs').iterdir():
 if not(d/'capture-run-result.json').exists() or not(d/'database-resources.json').exists():continue
 r=json.load(open(d/'capture-run-result.json'));samples=json.load(open(d/'database-samples.json'));pids={};peakrss=peakpss=maxcon=maxactive=0;io={}
 for s in samples:
  rss=pss=0
  for part in re.split('PID:',s.get('proc',''))[1:]:
   lines=part.splitlines();pid=lines[0]
   if len(lines)<2 or ')'not in lines[1]:continue
   stat=lines[1].rsplit(')',1)[1].split();ticks=int(stat[11])+int(stat[12]);v=pids.setdefault(pid,{'firstTicks':ticks,'lastTicks':ticks,'rssPeakKiB':0,'pssPeakKiB':0});v['lastTicks']=ticks
   for k in ['Rss','Pss']:
    m=re.search(r'^'+k+r':\s+(\d+) kB',part,re.M);n=int(m.group(1))if m else(int(stat[21])*4 if k=='Rss'else 0);v[k.lower()+'PeakKiB']=max(v[k.lower()+'PeakKiB'],n)
    if k=='Rss':rss+=n
    else:pss+=n
   for k in ['read_bytes','write_bytes']:
    m=re.search(r'^'+k+r':\s+(\d+)',part,re.M);n=int(m.group(1))if m else 0;v.setdefault('first_'+k,n);v['last_'+k]=n
  peakrss=max(peakrss,rss);peakpss=max(peakpss,pss);maxcon=max(maxcon,len(s['connections']));maxactive=max(maxactive,sum(x['state']=='active'for x in s['connections']))
 for v in pids.values():v['sampledCpuSeconds']=(v['lastTicks']-v['firstTicks'])/100
 summary={'run':d.name,'state':r['result'],'wallSeconds':r['wallMs']/1000,'appCpuSeconds':(r['cpu']['user']+r['cpu']['system'])/1e6,'appPeakRssMiB':r['peakRss']/1048576,'databasePeakSummedRssMiB':peakrss/1024,'databasePeakSummedPssMiB':peakpss/1024 if peakpss else None,'databaseSampledCpuSeconds':sum(v['sampledCpuSeconds']for v in pids.values()),'databaseConnectionsPeak':maxcon,'databaseActivePeak':maxactive,'httpCalls':r['queries'],'uploadBytes':r['requestBytes'],'downloadBytes':r['responseBytes'],'finalization':[t for t in r['timings']if any(k in t['path']for k in ['finalize','commit','completed'])],'backendProcesses':pids,'databaseStats':json.load(open(d/'database-resources.json')),'samplingCaveat':'0.75s interval plus Docker instrumentation; sampled CPU excludes work before first/after last sample; sum RSS double-counts shared pages; PSS apportions them; PostgreSQL temp_bytes excludes temp-relation size; not provider billing'}
 out.append(summary)
(P/'resource-summary.json').write_text(json.dumps(out,indent=2));print([{k:r[k]for k in ['run','wallSeconds','appPeakRssMiB','databasePeakSummedPssMiB','databaseSampledCpuSeconds','databaseConnectionsPeak']}for r in out])
