"""LOCAL ONLY: reuse the disposable R09 fixture; no production connection or source fetching."""
from pathlib import Path
root=Path('/Users/cassidydaddy/twuanis')
script=(root/'scripts/verification/remates-r09-db.py').read_text()
replacement="""extra=(root/'scripts/verification/remates-r10-db-cases.py').read_text()+(root/'scripts/verification/remates-r11-db-cases.py').read_text()+(root/'scripts/verification/remates-r12-db-cases.py').read_text()+(root/'scripts/verification/remates-r13-db-cases.py').read_text()+(root/'scripts/verification/remates-r14-db-cases.py').read_text()
source=source.replace(" report={'status':'PASS'",extra+" report={'status':'PASS'",1)
source=source.replace('R-09-db-results.json','R-14-db-results.json').replace("report={'status':'PASS'","report={'status':'PASS','r10Assertions':r11_start-r10_start,'r11Assertions':r12_start-r11_start,'r12Assertions':r13_start-r12_start,'r13Assertions':r14_start-r13_start,'r14Assertions':len(results)-r14_start",1)
source=source.replace("'r09Assertions':len(results)-r09_start","'r09Assertions':r10_start-r09_start,'r10PriorRegressionAssertions':r10_start")
exec(compile(source,str(root/'scripts/verification/remates-r08-db.py'),'exec'))"""
script=script[:script.index('exec(compile(source')]+replacement
exec(compile(script,str(root/'scripts/verification/remates-r09-db.py'),'exec'))
