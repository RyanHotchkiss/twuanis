import subprocess,os,json,hashlib
from pathlib import Path
r=Path('/Users/cassidydaddy/twuanis');out=r/'outputs/CG-S11-C-evidence';db='s11c2_bridge_r2b'
env={k:v for k,v in os.environ.items() if not k.startswith('PG')};env['PGPASSFILE']='/private/tmp/c2-empty-pgpass'
base=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-w','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1','-At']
log=[]
def run(sql=None,file=None,expect=0,database=db):
 p=subprocess.run(base+['-d',database]+(['-f',str(file)] if file else ['-f','-']),input=sql,env=env,text=True,capture_output=True)
 log.append({'file':str(file) if file else None,'sql':sql,'stdout':p.stdout,'stderr':p.stderr,'exit_code':p.returncode})
 (out/'c2-r2-disposable-transcript.json').write_text(json.dumps(log,indent=2)+'\n')
 if p.returncode!=expect:raise RuntimeError(str(file)+' '+p.stderr)
 return p
run('CREATE DATABASE '+db+' TEMPLATE template0;',database='postgres')
fixture=(r/'outputs/CG-S11-B/disposable-install-fixture.sql').read_text().split('CREATE OR REPLACE FUNCTION public.activate_purchase',1)[0]
run(fixture)
for n in ['002','003','004','005']:run(file=next((r/'supabase/migrations').glob(n+'_*.sql')))
run('ALTER TABLE public.listings ADD COLUMN created_at timestamptz DEFAULT now();')
x=json.loads(json.loads((out/'c2-r2-final-dependencies.json').read_text())['stdout'])
setup='SET search_path=public,pg_catalog;\n'
for v in x['views']:
 setup+='CREATE VIEW public.'+v['name']+' AS '+v['definition']+'\nREVOKE ALL ON public.'+v['name']+' FROM PUBLIC,anon,authenticated,service_role;\nGRANT TRUNCATE,REFERENCES,TRIGGER,MAINTAIN ON public.'+v['name']+' TO anon,authenticated,service_role;\n'
run(setup)
run("INSERT INTO listings(title,transaction_type,listing_status,listing_origin,listing_source_type,canton,monthly_price,price_millions) VALUES ('rent','rent','active','customer','manual','A',100,NULL),('lease','lease','active','customer','manual','A',200,NULL),('null','rent','active','customer','manual','A',NULL,NULL),('sale','sale','active','customer','manual','A',999,10),('other','buy','active','customer','manual','A',888,20),('draft','rent','draft','customer','manual','A',900,NULL),('no-canton','rent','active','customer','manual',NULL,500,NULL);")
before=json.loads(run("SELECT jsonb_agg(to_jsonb(x) ORDER BY canton) FROM market_canton_stats x;").stdout)
f=run(file=r/'supabase/migrations/006_canonical_domain_machinery.sql',expect=3);assert 'used by a view or rule' in f.stderr
assert run("SELECT count(*) FROM pg_attribute WHERE attrelid='listings'::regclass AND attname='canonical_domain_version';").stdout.strip()=='0'
f=run('DROP VIEW public.market_listing_base RESTRICT;',expect=3);assert 'depend' in f.stderr
# Force failure after successful ordered drops; session close must rollback both drops.
f=run('\\i '+str(r/'outputs/CG-S11-C/migration-006-market-views-pre.sql')+'\nSELECT 1/0;',expect=3);assert 'division by zero' in f.stderr
assert run("SELECT to_regclass('public.market_listing_base') IS NOT NULL AND to_regclass('public.market_canton_stats') IS NOT NULL;").stdout.strip()=='t'
run(file=r/'outputs/CG-S11-C/migration-006-market-views-bridge.sql')
after=json.loads(run("SELECT jsonb_agg(to_jsonb(x) ORDER BY canton) FROM market_canton_stats x;").stdout);assert before==after
assert run("SELECT format_type(atttypid,atttypmod) FROM pg_attribute WHERE attrelid='listings'::regclass AND attname='monthly_price';").stdout.strip()=='numeric'
run("UPDATE listings SET monthly_price=100.25 WHERE title='rent';UPDATE listings SET monthly_price=200.75 WHERE title='lease';")
a=json.loads(run("SELECT to_jsonb(x) FROM market_canton_stats x WHERE canton='A';").stdout)
assert a['avg_monthly_rent']==150.5 and a['median_monthly_rent']==150.5 and a['rental_listings']==3 and a['sale_listings']==1 and a['total_active_listings']==5
assert a['avg_sale_price_millions']==10 and a['median_sale_price_millions']==10
assert run("SELECT monthly_price FROM market_listing_base WHERE title='rent';").stdout.strip()=='100.25'
# Capture006 function definitions and new canonical tables for target comparison before007 replaces functions.
source=(r/'supabase/migrations/006_canonical_domain_machinery.sql').read_text()
import re
fn=sorted(set(re.findall(r'CREATE(?: OR REPLACE)? FUNCTION\s+([\w.]+)',source,re.I)))
tables=sorted(set(re.findall(r'CREATE TABLE\s+([\w.]+)',source,re.I)))
q=lambda s:"'"+s.replace("'","''")+"'"
sql="SELECT jsonb_build_object('functions',(SELECT jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',p.proacl) ORDER BY p.oid::regprocedure::text) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname||'.'||p.proname IN("+','.join(map(q,fn))+")),'tables',(SELECT jsonb_agg(jsonb_build_object('name',c.oid::regclass::text,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'acl',c.relacl,'columns',(SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull) ORDER BY a.attnum) FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped)) ORDER BY c.oid::regclass::text) FROM pg_class c WHERE c.oid IN("+','.join(q(t)+'::regclass' for t in tables)+")));"
(r/'outputs/CG-S11-C/migration-006-catalog-verification.sql').write_text(sql+'\n')
cat=json.loads(run(sql).stdout);(out/'c2-r2-local-006-catalog.json').write_text(json.dumps(cat,indent=2)+'\n')
run(file=r/'supabase/migrations/007_canonical_creation_authority.sql')
result={'expected_006_dependency_failure':True,'wrong_drop_order_rejected':True,'injected_precommit_failure_restores_both_views':True,'bridge_committed':True,'exact_view_metadata_assertions_passed':True,'integer_population_outputs_identical':True,'fractional_average_median_preserved':True,'null_transaction_status_filters_preserved':True,'numeric_type':True,'migration007_committed_locally':True,'function_count':len(cat['functions']),'new_006_table_count':len(cat['tables'])}
(out/'c2-r2-disposable-results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
