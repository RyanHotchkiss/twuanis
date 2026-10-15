from pathlib import Path
import os,sys,time,json,subprocess,psycopg2
P=Path('/private/tmp/twuanis-orch-final-01');name=sys.argv[1];db=os.environ.get('CAPACITY_DB','twuanis_orch_final_01_2000');D=P/'runs'/name;D.mkdir(parents=True,exist_ok=True);c=psycopg2.connect('postgresql://postgres:postgres@127.0.0.1:54322/'+db);c.autocommit=True;q=c.cursor();fields=['xact_commit','xact_rollback','blks_read','blks_hit','tup_returned','tup_fetched','tup_inserted','tup_updated','tup_deleted','temp_bytes','deadlocks']
def stats():
 q.execute('select '+','.join(fields)+' from pg_stat_database where datname=current_database()');return dict(zip(fields,q.fetchone()))
before=stats();log=(D/'run.log').open('w');start=time.monotonic();proc=subprocess.Popen(['node','--conditions=react-server','--expose-gc',str(P/'run-capacity.cjs')],cwd=str(P/'candidate'),env={**os.environ,'RUN_DIR':str(D),'REQUEST_FILE':str(P/'capacity-request.json'),'CANDIDATE_ROOT':str(P/'candidate'),'NODE_PATH':'/Users/cassidydaddy/twuanis/node_modules'},stdout=log,stderr=log);samples=[];guard=None
while proc.poll()is None:
 q.execute("select pid,usename,state,wait_event_type,wait_event,extract(epoch from clock_timestamp()-query_start) from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()");active=q.fetchall();pids=[str(int(r[0]))for r in active];metrics={}
 if pids:
  cmd=';'.join('echo PID:'+pid+';cat /proc/'+pid+'/stat /proc/'+pid+'/smaps_rollup /proc/'+pid+'/io 2>/dev/null'for pid in pids)
  v=subprocess.run(['docker','exec','-u','postgres','supabase_db_twuanis-disposable-rehearsal','sh','-c',cmd],capture_output=True,text=True);metrics['proc']=v.stdout
 meminfo=subprocess.check_output(['docker','exec','supabase_db_twuanis-disposable-rehearsal','cat','/proc/meminfo'],text=True);available=int(next(line.split()[1]for line in meminfo.splitlines()if line.startswith('MemAvailable:')));metrics['vmAvailableKiB']=available
 if available<716800 and guard is None:
  q.execute("select pid,pg_cancel_backend(pid)from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid()and usename='authenticator'and state='active'");guard={'at':time.monotonic()-start,'availableKiB':available,'cancelled':q.fetchall(),'reason':'Protect shared local database from host OOM; capacity NOT PASS'};metrics['resourceGuard']=guard
 sample={'seconds':time.monotonic()-start,'connections':[{'pid':a,'user':b,'state':d,'waitType':e,'wait':f,'querySeconds':float(g or 0)}for a,b,d,e,f,g in active],**metrics};samples.append(sample)
 if len(samples)%10==0:(D/'database-samples.json').write_text(json.dumps(samples,indent=2))
 time.sleep(.75)
after=stats();q.execute('select pg_database_size(current_database())');size=q.fetchone()[0];c.close();log.close();(D/'database-samples.json').write_text(json.dumps(samples,indent=2));(D/'database-resources.json').write_text(json.dumps({'resourceGuard':guard,'database':db,'scope':'local backend proc RSS/PSS/CPU and pg_stat_database deltas; shared server non-JF work excluded from connection samples but may affect host','exit':proc.returncode,'elapsed':time.monotonic()-start,'before':before,'after':after,'delta':{k:after[k]-before[k]for k in fields},'databaseBytes':size},indent=2));print(name,'exit',proc.returncode,'seconds',time.monotonic()-start)
