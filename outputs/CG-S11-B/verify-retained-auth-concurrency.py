import subprocess,pathlib
P=['/opt/homebrew/opt/postgresql@17/bin/psql','-X','-h','/private/tmp/s11b-prep/socket','-p','55439','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At']
def run(s):
 r=subprocess.run(P,input=s,text=True,capture_output=True);assert r.returncode==0,r.stderr;return r.stdout.strip()
run('DELETE FROM twuanis_canonical_private.s11_retained_auth_receipt; DELETE FROM user_subscriptions;')
s=pathlib.Path('/Users/cassidydaddy/twuanis/outputs/CG-S11-B/retained-auth-initialize.sql').read_text()
a=subprocess.Popen(P,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
b=subprocess.Popen(P,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
a.stdin.write(s);a.stdin.close();b.stdin.write(s);b.stdin.close()
for p in (a,b):
 p.wait(timeout=15);assert p.returncode==0,p.stderr.read()
assert run('SELECT count(*)=3 AND count(DISTINCT user_id)=3 FROM user_subscriptions')=='t'
assert run('SELECT count(*)=1 FROM twuanis_canonical_private.s11_retained_auth_receipt')=='t'
print('PASS concurrent same-operation initialization: two sessions, three subscriptions, one receipt')
