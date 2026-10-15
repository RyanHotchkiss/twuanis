from local import *
import psycopg2
checks=[];c=psycopg2.connect('postgresql://postgres:postgres@127.0.0.1:54322/twuanis_orch_final_01');q=c.cursor()
for name in ['history-expiry','during-execution-expiry']:
 actor=json.load(open(P/(name+'.private.json')));q.execute('select ends_at<=clock_timestamp()from twuanis_canonical_private.entitlement_terms where id=%s',(actor['term']['term'],));assert q.fetchone()[0]
 st,v=http('/auth/v1/token?grant_type=password',{'email':actor['email'],'password':'Phase53F-Disposable-Only!2026'},keys['anon']);assert st==200;who={'token':v['access_token']};st,r=rpc('read_execution_credit_authority',{'p_orchestrator':'orchestrator-markets-current-valuation-of-property','p_population':'COMBINED'},who);checks.append({'case':name+' authority after expiry','http':st,'pass':st==403})
 if name=='history-expiry':
  report=json.load(open(P/'faults'/name/'live-report.json'));st,r=rpc('read_completed_execution_report',{'p_report':report['reportId']},who);checks.append({'case':'L1 exact post-expiration committed report','http':st,'sameBody':r==report,'pass':st==200 and r==report})
  other=json.load(open(P/'peer-paid.private.json'));st,v=http('/auth/v1/token?grant_type=password',{'email':other['email'],'password':'Phase53F-Disposable-Only!2026'},keys['anon']);assert st==200;st,r=rpc('read_completed_execution_report',{'p_report':report['reportId']},{'token':v['access_token']});checks.append({'case':'cross-account historical delivery denied','http':st,'pass':st==403})
 q.execute("select kind,sum(quantity)::text from twuanis_canonical_private.execution_credit_events where account_id=%s group by kind",(actor['id'],));events=q.fetchall();charged=sum(int(v)for k,v in events if k=='EXECUTION_CONSUMED');checks.append({'case':name+' accounting','events':events,'pass':charged==(1 if name=='history-expiry'else 0)})
c.close();(P/'expiry-checks.json').write_text(json.dumps(checks,indent=2));print('expiry/delivery',sum(x['pass']for x in checks),'/',len(checks));assert all(x['pass']for x in checks)
