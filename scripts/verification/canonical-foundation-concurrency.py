#!/usr/bin/env python3
"""Supplement canonical-foundation.sql in an existing disposable fixture DB.
Usage: python3 canonical-foundation-concurrency.py --socket /private/tmp/... --port 55438
Does not initialize, recreate, migrate, or stop a server. Unix socket only.
"""
import argparse
import os
from pathlib import Path
import select
import subprocess
import time

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('--socket', required=True)
ap.add_argument('--port', required=True)
ap.add_argument('--pg-bin', default='/opt/homebrew/opt/postgresql@17/bin')
a = ap.parse_args()
socket = Path(a.socket).resolve()
if not socket.is_dir() or not str(socket).startswith('/private/tmp/'):
    raise SystemExit('Only an existing /private/tmp Unix socket directory is allowed')
env = {k:v for k,v in os.environ.items() if not k.startswith('PG')}
base = [str(Path(a.pg_bin)/'psql'), '-X','-qAt','-h',str(socket),'-p',a.port,
        '-U','postgres','-d','cg_s1_verification','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose']
def sql(s, error=None):
    r = subprocess.run(base+['-c',s],env=env,text=True,capture_output=True,timeout=15)
    if error:
        assert r.returncode and error in r.stderr, r.stderr or r.stdout
    elif r.returncode:
        raise RuntimeError(r.stderr)
    return r.stdout.strip()
assert sql("SELECT current_database()='cg_s1_verification' AND inet_server_addr() IS NULL AND session_user='postgres'")=='t'
assert sql("SELECT count(*) FROM public.listing_classification_rule_sets WHERE id IN ('30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003')")=='2'
assert sql("SELECT count(*) FROM public.listing_classification_rules WHERE rule_set_id='30000000-0000-0000-0000-000000000002'")=='0', 'Use a fresh harness fixture for the race'
for role in ('anon','authenticated','service_role'):
    sql(f'SET ROLE {role}; INSERT INTO public.capacity_policy_guard VALUES(1)', '42501')
    sql(f'SET ROLE {role}; SELECT twuanis_canonical_private.finite_numeric(1)', '42501')
print('PASS: 6 actual application-role access denials', flush=True)
sql("BEGIN ISOLATION LEVEL REPEATABLE READ; INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000003',7,'[0,100)'); COMMIT", '0A000')
print('PASS: stale-snapshot isolation rejected', flush=True)
workers=[]
try:
    first=subprocess.Popen(base,env=env,text=True,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,bufsize=1)
    workers.append(first)
    first.stdin.write("BEGIN; INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000002',7,'[0,100)'); SELECT 'LOCK_HELD';\n")
    first.stdin.flush()
    ready,_,_=select.select([first.stdout],[],[],10)
    assert ready and first.stdout.readline().strip()=='LOCK_HELD', 'First session failed before barrier'
    second=subprocess.Popen(base+['-c',"SET application_name='cg_s1_competing_rule'; BEGIN; INSERT INTO public.listing_classification_rules(rule_set_id,ontology_term_id,bounds) VALUES('30000000-0000-0000-0000-000000000002',8,'[50,150)'); COMMIT"],env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    workers.append(second)
    blocked=False
    for _ in range(60):
        if sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='cg_s1_competing_rule' AND wait_event_type='Lock')")=='t':
            blocked=True
            break
        if second.poll() is not None: break
        time.sleep(.05)
    assert blocked, 'Competing session did not wait on rule-set lock'
    first.stdin.write('COMMIT;\n\q\n')
    first.stdin.flush()
    first.wait(timeout=10)
    out,err=second.communicate(timeout=10)
    assert first.returncode==0 and second.returncode!=0 and '23514' in err, err
    assert sql("SELECT count(*) FROM public.listing_classification_rules WHERE rule_set_id='30000000-0000-0000-0000-000000000002'")=='1'
    print('PASS: independent-session overlap race: one commit, one rejection',flush=True)
finally:
    for w in workers:
        if w.poll() is None:
            w.terminate()
            w.wait(timeout=10)
sql("BEGIN; INSERT INTO public.canonical_operation_receipts(authority_kind,authority_identity,operation_type,request_id,payload_fingerprint,outcome) VALUES('system','rollback-fixture','fixture',gen_random_uuid(),repeat('a',64),'succeeded'); SELECT 1/0; COMMIT",'22012')
assert sql("SELECT count(*) FROM public.canonical_operation_receipts WHERE authority_identity='rollback-fixture'")=='0'
print('PASS: failed transaction retains no success receipt; replay commands are not implemented')
print('S1 SUPPLEMENTAL VERIFICATION PASSED')
