import subprocess,pathlib
ROOT=pathlib.Path('/Users/cassidydaddy/twuanis')
BASE=ROOT/'outputs/CG-S11-B'
PSQL=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At']
def sql(s,ok=True):
 r=subprocess.run(PSQL,input=s,text=True,capture_output=True)
 if (r.returncode==0)!=ok: raise AssertionError(r.stdout+r.stderr)
 return r.stdout.strip()
n=0
def check(s,label):
 global n
 assert sql(s)=='t',label
 n+=1;print('PASS',n,label)
setup=(BASE/'retained-auth-setup.sql').read_text();init=(BASE/'retained-auth-initialize.sql').read_text()
sql('''CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA twuanis_canonical_private;
REVOKE ALL ON SCHEMA twuanis_canonical_private FROM PUBLIC;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
CREATE TABLE public.packages(id uuid PRIMARY KEY,slug text,is_active boolean);
CREATE TABLE public.publisher_accounts(id uuid PRIMARY KEY,owner_user_id uuid REFERENCES auth.users);
CREATE TABLE public.user_subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users,package_id uuid NOT NULL REFERENCES packages,status text NOT NULL CHECK(status IN('active','cancelled')),billing_cycle text NOT NULL, started_at timestamptz,current_period_start timestamptz,current_period_end timestamptz);
CREATE UNIQUE INDEX one_active ON user_subscriptions(user_id) WHERE status='active';
INSERT INTO auth.users SELECT gen_random_uuid(),'fixture' FROM generate_series(1,3);
CREATE TABLE auth_snapshot AS TABLE auth.users;
INSERT INTO packages VALUES('00000000-0000-0000-0000-000000000001','market-explorer',true),('00000000-0000-0000-0000-000000000002','paid',true);
''')
sql(setup)
# Prior paid/test state is rejected, never used as initialization authority.
sql("INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle) SELECT id,'00000000-0000-0000-0000-000000000002','active','paid' FROM auth.users; CREATE TABLE old_ids AS SELECT id FROM user_subscriptions;")
sql(init,False);check('SELECT count(*)=0 FROM twuanis_canonical_private.s11_retained_auth_receipt','pre-purge state rejected atomically')
sql('DELETE FROM user_subscriptions;')
sql(init)
check("SELECT count(*)=3 AND bool_and(status='active' AND billing_cycle='free' AND package_id='00000000-0000-0000-0000-000000000001') FROM user_subscriptions",'three independent free defaults')
check('SELECT count(DISTINCT user_id)=3 FROM user_subscriptions','one per retained identity')
check('SELECT NOT EXISTS(SELECT id FROM old_ids INTERSECT SELECT id FROM user_subscriptions)','old subscription IDs not reused')
check('SELECT NOT EXISTS((TABLE auth.users EXCEPT TABLE auth_snapshot) UNION ALL (TABLE auth_snapshot EXCEPT TABLE auth.users))','auth identities unchanged')
check('SELECT count(*)=0 FROM publisher_accounts','no eager publisher account')
check('SELECT count(*)=2 FROM packages','no package created')
sql('CREATE TABLE initialized_snapshot AS TABLE user_subscriptions;');sql(init)
check('SELECT NOT EXISTS((TABLE user_subscriptions EXCEPT TABLE initialized_snapshot) UNION ALL (TABLE initialized_snapshot EXCEPT TABLE user_subscriptions))','same-operation replay preserves exact rows')
sql("UPDATE user_subscriptions SET billing_cycle='tampered';");sql(init,False)
check("SELECT bool_and(billing_cycle='tampered') FROM user_subscriptions",'receipt mismatch fails without replacement')
sql("UPDATE user_subscriptions SET billing_cycle='free';")
sql('SET ROLE authenticated;'+init,False)
check('SELECT count(*)=3 FROM user_subscriptions','authenticated administrative invocation denied')
sql("INSERT INTO user_subscriptions(user_id,package_id,status,billing_cycle) SELECT user_id,package_id,status,billing_cycle FROM user_subscriptions LIMIT 1",False)
check('SELECT count(*)=3 FROM user_subscriptions','active uniqueness still enforced')
for mode,change,restore in [
 ('inactive',"UPDATE packages SET is_active=false WHERE slug='market-explorer'","UPDATE packages SET is_active=true WHERE slug='market-explorer'"),
 ('missing',"UPDATE packages SET slug='absent' WHERE slug='market-explorer'","UPDATE packages SET slug='market-explorer' WHERE slug='absent'"),
 ('ambiguous',"INSERT INTO packages VALUES('00000000-0000-0000-0000-000000000003','market-explorer',true)","DELETE FROM packages WHERE id='00000000-0000-0000-0000-000000000003'")]:
 sql(change);sql(init,False);check('SELECT count(*)=3 FROM user_subscriptions',mode+' package rejected without writes');sql(restore)
check("SELECT NOT has_table_privilege('authenticated','twuanis_canonical_private.s11_retained_auth_receipt','INSERT') AND NOT has_table_privilege('anon','twuanis_canonical_private.s11_retained_auth_receipt','SELECT') AND NOT has_table_privilege('service_role','twuanis_canonical_private.s11_retained_auth_receipt','UPDATE')",'receipt denied to runtime roles')
print('TOTAL',n)
