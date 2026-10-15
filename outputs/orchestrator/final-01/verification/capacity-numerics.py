from pathlib import Path
import json,shutil,subprocess
P=Path('/private/tmp/twuanis-orch-final-01');summary=[]
for n,run in [(128,'capacity-128'),(500,'capacity-500-60s'),(1000,'capacity-1000-60s')]:
 src=Path('/private/tmp/twuanis-phase53je/independent-'+str(n));d=P/('numerical-'+str(n));(d/'reports').mkdir(parents=True,exist_ok=True);shutil.copyfile(src/'fixtures.json',d/'fixtures.json');s=(src/'independent-check.py').read_text().replace(str(src),str(d));(d/'independent-check.py').write_text(s);r=json.load(open(P/'runs'/run/'live-report.json'));(d/'reports/combined.json').write_text(json.dumps({'report':r}));v=subprocess.run(['python3',str(d/'independent-check.py')],capture_output=True,text=True);(d/'check.log').write_text(v.stdout+v.stderr);print(n,v.returncode,v.stdout,flush=True)
