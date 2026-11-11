"""Disposable local R15 DB regression; exact existing authority, never production."""
from pathlib import Path
root=Path('/Users/cassidydaddy/twuanis')
source=(root/'scripts/verification/remates-r08-db.py').read_text()
extra='''
 r15_start=len(results);r15_before=snap()
 r15fields=[dict(path='parcel',ordinal=0,label='Registry parcel',raw='R15-PARCEL',validation='VALID'),dict(path='extreme',ordinal=0,label='Explicit bank selling price',raw='99999999999999999999999999999.123456789012345678',currency='USD',validation='VALID')]
 r15obs=retain(evidence('observation.retain',dict(obs_body,key='r15-extreme',record_key='r15-record',fields=r15fields)))['id']
 r15case=icmd(proposal(r15obs,[parcel('R15-PARCEL','parcel')]))['id'];r15resolved=icmd(decide(r15case));r15off=r15resolved['offeringId']
 r15body=dict(offering=r15off,observation=r15obs,path='extreme',ordinal=0,kind='SELLING_PRICE',status='VALID',amount=r15fields[1]['raw'],currency='USD',round=None)
 r15value=save(r15body)['id']
 check('R15 extreme money preserved exactly',"SELECT amount::text="+lit(r15fields[1]['raw'])+" FROM twuanis_remates_private.financial_values WHERE id="+lit(r15value))
 r15ids=json.loads(sql("SELECT jsonb_agg(property_id) FROM twuanis_remates_private.offering_properties WHERE offering_id="+lit(r15off)))
 for rid in r15ids:
  sql("INSERT INTO twuanis_remates_private.property_reference_terms(property_id,dimension,term_id) VALUES("+lit(rid)+",'province',1001),("+lit(rid)+",'canton',1002),("+lit(rid)+",'property_type',1)")
  reject('R15 property UUID cannot enter ordinary memberships',"INSERT INTO public.listings_ontology_terms VALUES("+lit(rid)+",1)",'23503')
  check('R15 property UUID excluded by actual canonical reader',role("SELECT public.read_canonical_listing_evidence(ARRAY["+lit(rid)+"::uuid],ARRAY[]::text[],ARRAY[]::text[])='[]'::jsonb"))
 assert snap()==r15_before;results.append('R15 exact all-ten ordinary/reference/cache snapshots unchanged after extreme bank money and shared geography/type')
 r15_db_evidence={'ordinaryBefore':r15_before,'ordinaryAfter':snap(),'rematesPropertyIds':r15ids,'rematesOfferingId':r15off,'financialValue':r15fields[1]['raw'],'checks':results[r15_start:]}
 (root/'outputs/remates/R-15-db-isolation-results.json').write_text(json.dumps(r15_db_evidence,indent=2))
'''
source=source.replace(" print('R07',",extra+" print('R07',",1)
# Keep original admission/independent-session namespace races and exact foundation,
# identity, financial, geography, media and control gates. No migrations on production.
source=source.replace('R-08-db-results.json','R-15-db-regression-results.json').replace("'full17EngineRegression':'NOT RUN / R-15'","'full17EngineRegression':'Separate R-15-engine-results.json; no DB-transport integration claim'")
exec(compile(source,str(root/'scripts/verification/remates-r08-db.py'),'exec'))
