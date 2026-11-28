#!/usr/bin/env python3
"""Disposable Unix-socket PostgreSQL verification; never connects to production."""
import csv
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[2]
fixture = Path(tempfile.mkdtemp(prefix='.price-integrity-local-', dir=root))
data, socket = fixture / 'data', fixture / 'socket'
socket.mkdir()
started = False

def run(args, **kwargs):
    return subprocess.run(args, text=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)

try:
    run(['initdb', '-D', str(data), '--auth=trust', '--no-locale', '--encoding=UTF8'])
    run(['pg_ctl', '-D', str(data), '-l', str(fixture / 'server.log'), '-o', f'-F -k {socket} -p 55438 -c listen_addresses=', 'start'])
    started = True
    db = ['psql', '-X', '-h', str(socket), '-p', '55438', '-d', 'postgres']
    def sql(statement):
        return run(db + ['-qAt', '-v', 'ON_ERROR_STOP=1'], input=statement).stdout.strip()
    sql('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE ROLE authenticator; CREATE ROLE supabase_admin;')
    restore = subprocess.run(db + ['-f', str(root / 'supabase/backups/production-schema-2026-11-19.sql')], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    errors = [line for line in restore.stderr.splitlines() if 'ERROR:' in line]
    if len(errors) != 2 or not all('supabase_vault' in line for line in errors):
        raise RuntimeError('Unexpected baseline restore errors: ' + '\n'.join(errors))
    sql('DROP TRIGGER IF EXISTS canonical_publication_price_integrity ON public.listings;')
    migration = (root / 'supabase/migrations/134_price_integrity_production_reconciliation.sql').read_text()
    # The old historical backup predates the supplied installed functions. Replace
    # functions only in this disposable fixture to reconstruct that installed state.
    sql(migration.replace('IF f IS NULL THEN EXECUTE', 'IF true THEN EXECUTE'))
    # Install the owner-supplied current lifecycle entry points, plus the
    # directly related installed publication definitions, in this disposable DB only.
    csv.field_size_limit(20_000_000)
    with open(Path.home() / 'Desktop/lifecycle fixture representative of production.csv', newline='') as source:
        lifecycle = list(csv.DictReader(source))
    if len(lifecycle) != 7:
        raise RuntimeError('Expected seven exported lifecycle definitions')
    with open(Path.home() / 'Desktop/Export dependencies and publication integration.csv', newline='') as source:
        dependencies = list(csv.DictReader(source))
    needed = {'publish_customer_canonical_listing', 'customer_publication_core', 's3_admission_command',
              'customer_publication_allowance', 'publisher_allowance', 'publisher_consumption',
              'resolve_publisher', 'lock_publisher', 'decide_listing_admission',
              'record_listing_admission_success'}
    selected = [r for r in dependencies if r['function_name'] in needed]
    if {r['function_name'] for r in selected} != needed:
        raise RuntimeError('The supplied publication dependency export is incomplete')
    with open(Path.home() / 'Desktop/s4_create_core definition and its relevant helpers.csv', newline='') as source:
        helpers = list(csv.DictReader(source))
    if len(helpers) != 8 or any(not r.get('installed_definition') for r in helpers):
        raise RuntimeError('Expected eight nonempty installed lifecycle helper definitions')
    sql('SET check_function_bodies=off;\n' + '\n'.join(r['installed_definition'].rstrip(';\n') + ';' for r in selected + lifecycle + helpers))
    owner='30000000-0000-4000-8000-000000000001'
    sale='30000000-0000-4000-8000-000000000002'
    rent='30000000-0000-4000-8000-000000000003'
    impostor='30000000-0000-4000-8000-000000000004'
    mismatch='30000000-0000-4000-8000-000000000005'
    mixed='30000000-0000-4000-8000-000000000006'
    # Synthetic setup bypasses constraints triggered by incomplete external fixtures,
    # not the evaluator itself; no publication is claimed by this test.
    sql(f"""BEGIN; SET LOCAL session_replication_role=replica;
      INSERT INTO auth.users(id) VALUES ('{owner}');
      INSERT INTO public.listings(id,owner_id,canonical_domain_version,canonical_revision,listing_origin,listing_source_type,listing_status,transaction_type,current_price,monthly_price,currency,title) VALUES
      ('{sale}','{owner}',1,1,'customer','customer','draft','sale',125000,NULL,'USD','Customer Sale'),
      ('{rent}','{owner}',1,1,'customer','customer','draft','rent',NULL,750000,'CRC','Customer Rent'),
      ('{impostor}','{owner}',1,1,'customer','customer','draft','sale',125000,NULL,'USD','Untrusted Price'),
      ('{mismatch}','{owner}',1,1,'customer','customer','draft','sale',125001,NULL,'USD','Mismatched Price'),
      ('{mixed}','{owner}',1,1,'customer','customer','draft','sale',125000,500,'USD','Mixed Transactions');
      INSERT INTO public.listing_monetary_events(listing_id,operation_id,listing_revision,transaction_type,event_kind,new_amount,new_currency,actor_kind,actor_identity) VALUES
      ('{sale}',gen_random_uuid(),1,'sale','initial_observation',125000,'USD','owner','{owner}'),
      ('{rent}',gen_random_uuid(),1,'rent','initial_observation',750000,'CRC','owner','{owner}'),
      ('{impostor}',gen_random_uuid(),1,'sale','initial_observation',125000,'USD','trusted','not-the-owner'),
      ('{mismatch}',gen_random_uuid(),1,'sale','initial_observation',125000,'USD','owner','{owner}'),
      ('{mixed}',gen_random_uuid(),1,'sale','initial_observation',125000,'USD','owner','{owner}');
      COMMIT;""")
    for listing in (sale,rent):
        decision=json.loads(sql(f"SELECT twuanis_canonical_private.decide_listing_price_v4(l)::text FROM public.listings l WHERE id='{listing}';"))
        assert decision.get('assertion_kind') == 'authenticated_owner_asking_price', decision
        assert decision.get('evidence_format') == 'AUTHENTICATED_OWNER', decision
        assert decision.get('publication_allowed') is True, decision
        assert decision.get('analytical_eligible') is True, decision
        assert decision.get('structured_evidence',{}).get('status') == 'NOT_APPLICABLE', decision
    rejected=json.loads(sql(f"SELECT twuanis_canonical_private.decide_listing_price_v4(l)::text FROM public.listings l WHERE id='{impostor}';"))
    assert rejected.get('publication_allowed') is False, rejected
    assert rejected.get('assertion_kind') != 'authenticated_owner_asking_price', rejected
    for listing, reason in ((mismatch,'PRICE_CANONICAL_ASSERTION_MISSING'),(mixed,'PRICE_TRANSACTION_MIXING')):
        decision=json.loads(sql(f"SELECT twuanis_canonical_private.decide_listing_price_v4(l)::text FROM public.listings l WHERE id='{listing}';"))
        assert decision.get('publication_allowed') is False and reason in decision.get('blocking_reasons',[]), decision
    print('PASS: owner Sale/Rent assertions avoid scraper evidence; untrusted, mismatched and transaction-mixed prices fail; evaluator only, not publication.')
    sql("""INSERT INTO twuanis_canonical_private.listing_price_integrity_evidence
      (id, listing_id, canonical_revision, canonical_domain_version, evaluator_version,
       transaction_type, currency, evidence_format, integrity_status, publication_allowed,
       analytical_eligible, mandatory_review_required, supplementary_review_required, decision)
      VALUES ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
       1,1,4,'sale','CRC','fixture','APPROVED',true,true,false,false,'{}');
      INSERT INTO twuanis_canonical_private.price_historical_evidence_registry
      (listing_id,retained_evidence_id,source_name,source_listing_id,evidence_format,registration_reason)
      VALUES ('20000000-0000-0000-0000-000000000001','fixture','fixture','1','LEGACY_NO_PRICE_OBJECT','fixture');""")
    before = sql("SELECT (SELECT row_to_json(e)::text FROM twuanis_canonical_private.listing_price_integrity_evidence e WHERE id='10000000-0000-0000-0000-000000000001') || (SELECT row_to_json(h)::text FROM twuanis_canonical_private.price_historical_evidence_registry h WHERE retained_evidence_id='fixture');")
    sql(migration)
    after = sql("SELECT (SELECT row_to_json(e)::text FROM twuanis_canonical_private.listing_price_integrity_evidence e WHERE id='10000000-0000-0000-0000-000000000001') || (SELECT row_to_json(h)::text FROM twuanis_canonical_private.price_historical_evidence_registry h WHERE retained_evidence_id='fixture');")
    assert before == after, 'Reconciliation changed immutable evidence or historical authorization'
    permissions = sql("""SELECT bool_and(
        has_table_privilege('service_role', c.oid, 'SELECT') AND
        NOT has_table_privilege('anon', c.oid, 'SELECT') AND
        NOT has_table_privilege('authenticated', c.oid, 'SELECT'))
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE (n.nspname='twuanis_canonical_private' AND c.relname IN
        ('listing_price_integrity_evidence','listing_price_integrity_current','price_historical_evidence_registry','price_integrity_pending'))
        OR (n.nspname='public' AND c.relname='analytically_eligible_marketplace_listings');""")
    assert permissions == 't', 'Unexpected relationship or table read grants'
    assert sql("SELECT has_function_privilege('service_role','public.marketplace_price_eligibility(public.listings)','EXECUTE') AND NOT has_function_privilege('anon','public.marketplace_price_eligibility(public.listings)','EXECUTE') AND NOT has_function_privilege('authenticated','public.marketplace_price_eligibility(public.listings)','EXECUTE');") == 't'
    immutable = subprocess.run(db + ['-v', 'ON_ERROR_STOP=1'], input="UPDATE twuanis_canonical_private.listing_price_integrity_evidence SET currency='USD' WHERE id='10000000-0000-0000-0000-000000000001';", text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert immutable.returncode != 0, 'Evidence immutability trigger failed to reject update'
    sql("BEGIN; ALTER FUNCTION twuanis_canonical_private.finite_numeric(numeric) RENAME TO finite_numeric_fixture_original;\n" + migration.replace('BEGIN;', '', 1).replace('COMMIT;', 'ROLLBACK;', 1))
    print('PASS: isolated installed-state reconciliation, evidence/authorization retention, immutable update rejection, read/execute privileges, and finite_numeric creation branch.')
finally:
    if started:
        subprocess.run(['pg_ctl', '-D', str(data), '-m', 'immediate', 'stop'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    shutil.rmtree(fixture, ignore_errors=True)
