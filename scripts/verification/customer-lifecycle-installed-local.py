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
    result = subprocess.run(args, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)
    if result.returncode: raise RuntimeError(result.stderr)
    return result

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
    # Synthetic customer and taxonomy use actual schema, triggers and RPCs.
    customer='40000000-0000-4000-8000-000000000001'
    package='40000000-0000-4000-8000-000000000002'
    sql(f"""BEGIN; SET LOCAL session_replication_role=replica; INSERT INTO public.capacity_policy_guard(id) VALUES (1);
      INSERT INTO auth.users(id) VALUES ('{customer}'),('40000000-0000-4000-8000-000000000099');
      INSERT INTO twuanis_canonical_private.account_principals(id) VALUES ('{customer}'),('40000000-0000-4000-8000-000000000099');
      INSERT INTO public.ontology_terms(id,parent_id,term_name,term_type,slug,level,official_code) VALUES
      (9,NULL,'Costa Rica','country','cr',0,NULL),(3,9,'San José','province','san-jose',1,'3'),
      (304,3,'Central','canton','central',2,'304'),(30403,304,'District','district','district',3,'30403'),
      (1,NULL,'House','property_type','house',1,NULL);
      INSERT INTO public.packages(id,slug,name_en,name_es,description_en,description_es,hierarchy_level,display_order,billing_interval)
      VALUES ('{package}','fixture-customer','Fixture','Fixture','Fixture','Fixture',1,1,'monthly');
      INSERT INTO public.package_limits(package_id,listing_limit,publication_duration_seconds) VALUES ('{package}',20,2592000);
      INSERT INTO public.user_subscriptions(user_id,package_id,status,billing_cycle,started_at,current_period_start,current_period_end)
      VALUES ('{customer}','{package}','active','monthly',now()-interval '1 day',now()-interval '1 day',now()+interval '1 year'); COMMIT;""")
    def customer_sql(statement):
        return sql(f"SET request.jwt.claim.sub='{customer}'; SET ROLE authenticated; "+statement)
    input_data={'transaction':'sale','geography':{'province':'3','canton':'304','district':'30403'},
      'semantics':{'property_type':['1']},'measurements':{'property_area':{'value':'200'},'construction_area':{'value':'100'}},
      'money':{'amount':'125000','currency':'USD'},'content':{'title':'Fixture customer Sale','whatsapp':'50688888888'}}
    payload=json.dumps(input_data).replace("'","''")
    created=json.loads(customer_sql(f"SELECT public.create_customer_canonical_listing('40000000-0000-4000-8000-000000000003','{payload}'::jsonb)::text;"))
    assert created.get('listing_id') and created.get('revision') == '1', created
    created_id=created['listing_id']
    decision=json.loads(sql(f"SELECT twuanis_canonical_private.decide_listing_price_v4(l)::text FROM public.listings l WHERE id='{created_id}';"))
    assert decision.get('assertion_kind')=='authenticated_owner_asking_price' and decision.get('publication_allowed') is True, decision
    print('PASS: authenticated customer Sale creation creates a valid owner-asserted price event through installed entry point.')
    publication=json.loads(customer_sql(f"SELECT public.publish_customer_canonical_listing('{created_id}',1,'40000000-0000-4000-8000-000000000004','publish')::text;"))
    state=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'revision',canonical_revision)::text FROM public.listings WHERE id='{created_id}';"))
    assert state['status']=='active' and state['revision']==2, (state,publication)
    print('PASS: customer Sale publication committed through canonical database RPC.')
    edit=json.loads(customer_sql(f"SELECT public.edit_customer_canonical_listing('{created_id}',2,'40000000-0000-4000-8000-000000000005','{{\"money\":{{\"amount\":\"126000\",\"currency\":\"USD\"}}}}'::jsonb,'{{\"title\":\"Edited customer Sale\"}}'::jsonb)::text;"))
    after_edit=json.loads(sql(f"SELECT jsonb_build_object('amount',current_price,'title',title,'revision',canonical_revision)::text FROM public.listings WHERE id='{created_id}';"))
    assert after_edit['amount']==126000 and after_edit['revision']==3, (edit,after_edit)
    archived=json.loads(customer_sql(f"SELECT public.mutate_customer_canonical_listing('{created_id}',3,'40000000-0000-4000-8000-000000000006','{{\"lifecycle\":{{\"event\":\"archive\"}}}}'::jsonb)::text;"))
    restored=json.loads(customer_sql(f"SELECT public.mutate_customer_canonical_listing('{created_id}',4,'40000000-0000-4000-8000-000000000007','{{\"lifecycle\":{{\"event\":\"restore\"}}}}'::jsonb)::text;"))
    republished=json.loads(customer_sql(f"SELECT public.publish_customer_canonical_listing('{created_id}',5,'40000000-0000-4000-8000-000000000008','publish')::text;"))
    state=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'revision',canonical_revision)::text FROM public.listings WHERE id='{created_id}';"))
    assert state['status']=='active' and state['revision']==6, (archived,restored,republished,state)
    duplicate=json.loads(customer_sql(f"SELECT public.prepare_customer_duplicate('{created_id}','40000000-0000-4000-8000-000000000009')::text;"))
    duplicated_id=duplicate['listing_id']
    copy_row=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'owner',owner_id,'price',current_price,'source',source_name)::text FROM public.listings WHERE id='{duplicated_id}';"))
    assert copy_row['status']=='draft' and copy_row['owner']==customer and copy_row['price']==126000, (duplicate,copy_row)
    print('PASS: customer Sale edit, archive, restore, republish and duplicate canonical entry points.')
    input_data['transaction']='rent';input_data['money']={'amount':'750000','currency':'CRC'};input_data['content']['title']='Fixture customer Rent'
    rent_payload=json.dumps(input_data).replace("'","''")
    rent_created=json.loads(customer_sql(f"SELECT public.create_customer_canonical_listing('40000000-0000-4000-8000-000000000010','{rent_payload}'::jsonb)::text;"))
    rent_id=rent_created['listing_id']
    rent_published=json.loads(customer_sql(f"SELECT public.publish_customer_canonical_listing('{rent_id}',1,'40000000-0000-4000-8000-000000000011','publish')::text;"))
    rent_row=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'rent',monthly_price,'sale',current_price,'currency',currency)::text FROM public.listings WHERE id='{rent_id}';"))
    assert rent_row=={'status':'active','rent':750000,'sale':None,'currency':'CRC'}, (rent_published,rent_row)
    print('PASS: customer Rent creation and publication keep transaction-specific monetary identity.')
    rent_edit=json.loads(customer_sql(f"SELECT public.edit_customer_canonical_listing('{rent_id}',2,'40000000-0000-4000-8000-000000000012','{{\"money\":{{\"amount\":\"760000\",\"currency\":\"CRC\"}}}}'::jsonb,'{{\"title\":\"Edited customer Rent\"}}'::jsonb)::text;"))
    rent_archive=json.loads(customer_sql(f"SELECT public.mutate_customer_canonical_listing('{rent_id}',3,'40000000-0000-4000-8000-000000000013','{{\"lifecycle\":{{\"event\":\"archive\"}}}}'::jsonb)::text;"))
    rent_restore=json.loads(customer_sql(f"SELECT public.mutate_customer_canonical_listing('{rent_id}',4,'40000000-0000-4000-8000-000000000014','{{\"lifecycle\":{{\"event\":\"restore\"}}}}'::jsonb)::text;"))
    rent_republish=json.loads(customer_sql(f"SELECT public.publish_customer_canonical_listing('{rent_id}',5,'40000000-0000-4000-8000-000000000015','publish')::text;"))
    rent_state=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'revision',canonical_revision,'rent',monthly_price,'sale',current_price)::text FROM public.listings WHERE id='{rent_id}';"))
    assert rent_state=={'status':'active','revision':6,'rent':760000,'sale':None}, (rent_edit,rent_archive,rent_restore,rent_republish,rent_state)
    rent_duplicate=json.loads(customer_sql(f"SELECT public.prepare_customer_duplicate('{rent_id}','40000000-0000-4000-8000-000000000016')::text;"))
    rent_copy=json.loads(sql(f"SELECT jsonb_build_object('status',listing_status,'owner',owner_id,'rent',monthly_price,'sale',current_price)::text FROM public.listings WHERE id='{rent_duplicate['listing_id']}';"))
    assert rent_copy=={'status':'draft','owner':customer,'rent':760000,'sale':None}, (rent_duplicate,rent_copy)
    print('PASS: customer Rent edit, archive, restore, republish and duplicate canonical entry points.')
    stale = subprocess.run(db+['-qAt','-v','ON_ERROR_STOP=1'], input=f"SET request.jwt.claim.sub='{customer}'; SET ROLE authenticated; SELECT public.edit_customer_canonical_listing('{rent_id}',2,'40000000-0000-4000-8000-000000000017','{{\"money\":{{\"amount\":\"1\",\"currency\":\"CRC\"}}}}'::jsonb,'{{}}'::jsonb);", text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert stale.returncode != 0 and 'stale canonical revision' in stale.stderr, ('Stale revision was not rejected for the expected reason', stale.stderr)
    foreign = subprocess.run(db+['-qAt','-v','ON_ERROR_STOP=1'], input=f"SET request.jwt.claim.sub='40000000-0000-4000-8000-000000000099'; SET ROLE authenticated; SELECT public.prepare_customer_duplicate('{rent_id}','40000000-0000-4000-8000-000000000018');", text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    assert foreign.returncode != 0 and 'owned source required' in foreign.stderr, ('Non-owner was not rejected for the expected reason', foreign.stderr)
    unchanged=json.loads(sql(f"SELECT jsonb_build_object('revision',canonical_revision,'rent',monthly_price)::text FROM public.listings WHERE id='{rent_id}';"))
    assert unchanged=={'revision':6,'rent':760000}, unchanged
    assert sql(f"SELECT count(*) FROM public.listing_source_observations WHERE listing_id IN ('{created_id}','{rent_id}');")=='0'
    print('PASS: stale edits and non-owner duplication are rejected; customer prices require no source observation.')
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
