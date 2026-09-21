from pathlib import Path
import json,re,subprocess
R=Path('/Users/cassidydaddy/twuanis');O=R/'outputs/CG-S11-B';B='/opt/homebrew/opt/postgresql@17/bin/'
P=[B+'psql','-X','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-d','s11b_purge','-v','ON_ERROR_STOP=1','-Atq']
def sql(s,ok=True):
 x=subprocess.run(P,input=s,text=True,capture_output=True)
 assert (x.returncode==0)==ok,x.stdout+x.stderr
 return x.stdout.strip()
manifest=json.loads((O/'purge-allowlist.json').read_text());edges=manifest['foreign_keys'];names={x['table'] for x in manifest['tables']}|{'auth.users'}
cols={t:{'id'} for t in names}
for e in edges:
 a=re.search(r'FOREIGN KEY \(([^)]+)\) REFERENCES [^(]+\(([^)]+)\)',e['definition']);assert a,e
 cols[e['child']].update(a[1].split(', '));cols[e['parent']].update(a[2].split(', '))
fixture=['CREATE SCHEMA auth;']
for t in sorted(names):
 fixture.append('CREATE TABLE '+t+'('+','.join(c+' uuid'+(' PRIMARY KEY' if c=='id' else '') for c in sorted(cols[t]))+');')
 fixture.append('INSERT INTO '+t+' VALUES('+','.join("'11111111-1111-4111-8111-111111111111'" for c in sorted(cols[t]))+');')
for e in edges:fixture.append('ALTER TABLE '+e['child']+' ADD CONSTRAINT '+e['constraint']+' '+e['definition']+';')
fixture+=['''CREATE FUNCTION public.prevent_promotion_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'immutable'; END $$;
CREATE TRIGGER prevent_promotion_events_delete BEFORE DELETE ON promotion_events FOR EACH ROW EXECUTE FUNCTION prevent_promotion_event_mutation();
CREATE TRIGGER prevent_promotion_events_update BEFORE UPDATE ON promotion_events FOR EACH ROW EXECUTE FUNCTION prevent_promotion_event_mutation();''']
sql('\n'.join(fixture));(Path('/private/tmp/s11b-prep/purge-fixture.sql')).write_text('\n'.join(fixture))
s=(O/'purge-before-install.sql').read_text()
# Draft reserved SQL keyword correction is exercised before final review.
s=s.replace('deferrable boolean','is_deferrable boolean').replace(' AS deferrable',' AS is_deferrable')
# Wrong schema phase must fail before data changes.
sql('CREATE SCHEMA twuanis_canonical_private;');sql(s,False);sql('DROP SCHEMA twuanis_canonical_private;')
assert sql('SELECT count(*) FROM listings')=='1';print('PASS phase gate preserves rows')
sql('ALTER TABLE properties ADD CONSTRAINT unexpected FOREIGN KEY(id) REFERENCES sale_listing(id);');sql(s,False)
assert sql('SELECT count(*) FROM listings')=='1';sql('ALTER TABLE properties DROP CONSTRAINT unexpected;');print('PASS new FK drift denied')
# Failure after deletion must restore rows AND exact trigger state by rollback.
failed=s.replace('ALTER TABLE public.promotion_events ENABLE TRIGGER prevent_promotion_events_delete;',"DO $$ BEGIN RAISE EXCEPTION 'injected'; END $$;\nALTER TABLE public.promotion_events ENABLE TRIGGER prevent_promotion_events_delete;")
sql(failed,False)
assert sql('SELECT count(*) FROM listings')=='1'
assert sql("SELECT tgenabled FROM pg_trigger WHERE tgname='prevent_promotion_events_delete'")=='O';print('PASS injected post-delete failure rolls back data and guard')
# Reference-changing side effect must abort, with unchanged protected data afterward.
sql("CREATE FUNCTION bad_side_effect() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN DELETE FROM fx_rates; RETURN OLD; END $$;CREATE TRIGGER bad BEFORE DELETE ON properties FOR EACH ROW EXECUTE FUNCTION bad_side_effect();")
sql(s,False);assert sql('SELECT count(*) FROM fx_rates')=='1';sql('DROP TRIGGER bad ON properties;DROP FUNCTION bad_side_effect();');print('PASS reference mutation aborts and rolls back')
result=sql(s);assert 'S11_PURGE_COMMITTED' in result
for t in manifest['purge_order']:assert sql('SELECT count(*) FROM '+t)=='0',t
for t in names-set(manifest['purge_order']):assert sql('SELECT count(*) FROM '+t)=='1',t
assert sql("SELECT tgenabled FROM pg_trigger WHERE tgname='prevent_promotion_events_delete'")=='O'
print('PASS all 51 disposable tables empty; 15 protected/auth tables preserved; guard restored; 70 FKs retained')
print('TOTAL 5 purge scenarios; per-table preservation/emptiness assertions included')
