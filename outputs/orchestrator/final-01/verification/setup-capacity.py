import json,pathlib,psycopg2,subprocess,sys
P=pathlib.Path('/private/tmp/twuanis-orch-final-01');size=int(sys.argv[1]);assert size in [128,500,1000,2000,5000];name='twuanis_orch_final_01_'+str(size);source='twuanis_phase53je_'+str(size) if size!=5000 else'twuanis_phase53jf_5000'
c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/postgres');c.autocommit=True;q=c.cursor();q.execute('select 1 from pg_database where datname=%s',(name,));assert q.fetchone()is None
try:q.execute('CREATE DATABASE '+name+' TEMPLATE '+source)
except psycopg2.errors.ObjectInUse:
 # Snapshot-copy a busy reference fixture without interrupting its sessions.
 dump=P/(source+'.fixture.dump')
 with dump.open('wb')as f:subprocess.run(['docker','exec','supabase_db_twuanis-disposable-rehearsal','pg_dump','-U','supabase_admin','-Fc',source],stdout=f,check=True)
 q.execute('CREATE DATABASE '+name)
 # Supabase extension-management event triggers are not application contracts and cannot be restored under this local mixed-owner setup.
 with dump.open('rb')as f:toc=subprocess.check_output(['docker','exec','-i','supabase_db_twuanis-disposable-rehearsal','pg_restore','-l'],stdin=f,text=False).decode()
 filtered='\n'.join(line for line in toc.splitlines()if 'EVENT TRIGGER'not in line)+'\n'
 subprocess.run(['docker','exec','-i','supabase_db_twuanis-disposable-rehearsal','sh','-c','cat > /tmp/orch-final-fixture-toc'],input=filtered,text=True,check=True)
 with dump.open('rb')as f:subprocess.run(['docker','exec','-i','supabase_db_twuanis-disposable-rehearsal','pg_restore','-U','supabase_admin','--exit-on-error','--use-list=/tmp/orch-final-fixture-toc','-d',name],stdin=f,check=True)
c.close()
c=psycopg2.connect('postgresql://supabase_admin:postgres@127.0.0.1:54322/'+name);q=c.cursor();base=json.load(open(P/'baseline-functions.json'));changes=[]
# Restore EXACT current approved contracts into the cloned fixture, excluding all JF experiments.
for sig,definition,owner,acl in base:
 q.execute('select to_regprocedure(%s)',(sig,));exists=q.fetchone()[0]
 if exists:
  q.execute('select pg_get_functiondef(%s::regprocedure)',(sig,));old=q.fetchone()[0]
  if old==definition:continue
 else:old=None
 q.execute(definition);changes.append({'signature':sig,'existed':bool(exists)})
 q.execute('ALTER FUNCTION '+sig+' OWNER TO '+owner)
 q.execute('REVOKE ALL ON FUNCTION '+sig+' FROM PUBLIC,anon,authenticated,service_role')
 for role in ['anon','authenticated','service_role']:
  if acl and role+'=X/' in acl:q.execute('GRANT EXECUTE ON FUNCTION '+sig+' TO '+role)
q.execute((P/'candidate/supabase/migrations/110_orchestrator_classification_plan_cache.sql').read_text())
release=json.load(open('/private/tmp/twuanis-orch-acq-02/release-manifest.json'));q.execute('insert into twuanis_canonical_private.orchestrator_methodology_releases(id,manifest,archive_sha256)values(%s,%s,%s)on conflict do nothing',(release['id'],json.dumps(release['manifest']),release['manifest']['archiveSha256']));c.commit();c.close();(P/('capacity-'+str(size)+'-contracts.json')).write_text(json.dumps(changes,indent=2));print(name,'exact current source/contract baseline, data fixture only from',source)
